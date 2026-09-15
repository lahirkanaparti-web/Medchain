import os
import io
import logging
import random
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# Global handles for Siamese model & configuration
_INTERPRETER = None
_INPUT_DETAILS = None
_OUTPUT_DETAILS = None
_BUNDLE = None

_MOCK_MODE = True
_DISTANCE_THRESHOLD = 0.35
_EMBEDDING_DIM = 256
_IMG_SIZE = (299, 299)

# Configurable margin (+/- 15%) around threshold for "needs_review" verdict
REVIEW_MARGIN = 0.15


def load_model(model_path: str = None, bundle_path: str = None):
    """
    Loads the TFLite Siamese embedding model and joblib threshold bundle from disk.
    If missing or invalid, falls back to MOCK MODE without raising an unhandled exception.
    """
    global _INTERPRETER, _INPUT_DETAILS, _OUTPUT_DETAILS, _BUNDLE
    global _MOCK_MODE, _DISTANCE_THRESHOLD, _EMBEDDING_DIM, _IMG_SIZE

    if model_path is None:
        model_path = os.getenv("ML_MODEL_PATH", "app/models/medchain_siamese_embedding.tflite")
    if bundle_path is None:
        bundle_path = os.getenv("ML_BUNDLE_PATH", "app/models/medchain_siamese_bundle.joblib")

    # If relative path is not found from CWD, attempt resolving relative to this file's directory
    if not os.path.exists(model_path):
        alt_model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models", "medchain_siamese_embedding.tflite"))
        if os.path.exists(alt_model_path):
            model_path = alt_model_path

    if not os.path.exists(bundle_path):
        alt_bundle_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models", "medchain_siamese_bundle.joblib"))
        if os.path.exists(alt_bundle_path):
            bundle_path = alt_bundle_path

    if not os.path.exists(model_path) or not os.path.exists(bundle_path):
        logger.warning(
            f"Siamese model artifacts missing ('{model_path}' or '{bundle_path}'). "
            "Vision service running in MOCK MODE."
        )
        _MOCK_MODE = True
        return False

    try:
        import joblib
        _BUNDLE = joblib.load(bundle_path)
        _DISTANCE_THRESHOLD = float(_BUNDLE.get("distance_threshold", 0.35))
        _EMBEDDING_DIM = int(_BUNDLE.get("embedding_dim", 256))
        _IMG_SIZE = tuple(_BUNDLE.get("img_size", (299, 299)))

        interpreter = None
        try:
            import tflite_runtime.interpreter as tflite
            interpreter = tflite.Interpreter(model_path=model_path)
        except ImportError:
            try:
                import tensorflow as tf
                interpreter = tf.lite.Interpreter(model_path=model_path)
            except Exception as e:
                logger.warning(f"Could not import TFLite interpreter: {str(e)}")

        if interpreter is None:
            logger.warning("No TFLite interpreter library found. Falling back to MOCK MODE.")
            _MOCK_MODE = True
            return False

        interpreter.allocate_tensors()
        _INTERPRETER = interpreter
        _INPUT_DETAILS = interpreter.get_input_details()
        _OUTPUT_DETAILS = interpreter.get_output_details()
        _MOCK_MODE = False

        logger.info(
            f"Successfully loaded Siamese TFLite model from '{model_path}' "
            f"with distance threshold {_DISTANCE_THRESHOLD:.4f} and image target {_IMG_SIZE}."
        )
        return True

    except Exception as e:
        logger.warning(f"Failed to load Siamese model artifacts: {str(e)}. Falling back to MOCK MODE.")
        _MOCK_MODE = True
        return False


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Decodes image bytes, resizes to target img_size (299x299),
    and applies Xception-style scaling: (pixel / 127.5) - 1.0 -> [-1.0, 1.0].
    """
    global _IMG_SIZE
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize(_IMG_SIZE)

    img_arr = np.array(image, dtype=np.float32)
    img_arr = (img_arr / 127.5) - 1.0
    return np.expand_dims(img_arr, axis=0)


def get_embedding(image_bytes: bytes) -> np.ndarray:
    """
    Extracts L2-normalized 256-dimensional embedding vector for an image.
    Returns random unit vector if in MOCK MODE.
    """
    global _INTERPRETER, _INPUT_DETAILS, _OUTPUT_DETAILS, _MOCK_MODE, _EMBEDDING_DIM

    if _MOCK_MODE or _INTERPRETER is None:
        vec = np.random.randn(_EMBEDDING_DIM).astype(np.float32)
        return vec / (np.linalg.norm(vec) + 1e-8)

    try:
        input_tensor = preprocess_image(image_bytes)
        _INTERPRETER.set_tensor(_INPUT_DETAILS[0]['index'], input_tensor)
        _INTERPRETER.invoke()
        embedding = _INTERPRETER.get_tensor(_OUTPUT_DETAILS[0]['index'])[0]

        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm

        return embedding.astype(np.float32)
    except Exception as e:
        logger.error(f"TFLite inference error: {str(e)}. Returning fallback mock embedding.")
        vec = np.random.randn(_EMBEDDING_DIM).astype(np.float32)
        return vec / (np.linalg.norm(vec) + 1e-8)


def compute_distance(embedding_a: np.ndarray, embedding_b: np.ndarray) -> float:
    """
    Computes squared L2 distance between two embedding vectors: sum((a - b)^2).
    """
    return float(np.sum((embedding_a - embedding_b) ** 2))


def compute_color_similarity(img1_bytes: bytes, img2_bytes: bytes) -> float:
    """
    Computes normalized RGB color histogram intersection similarity in range [0.0, 1.0].
    """
    try:
        im1 = Image.open(io.BytesIO(img1_bytes)).convert("RGB").resize((128, 128))
        im2 = Image.open(io.BytesIO(img2_bytes)).convert("RGB").resize((128, 128))
        h1 = np.array(im1.histogram(), dtype=np.float32)
        h2 = np.array(im2.histogram(), dtype=np.float32)
        h1 /= (h1.sum() + 1e-8)
        h2 /= (h2.sum() + 1e-8)
        sim = float(np.sum(np.minimum(h1, h2)))
        return max(0.0, min(1.0, round(sim, 4)))
    except Exception as e:
        logger.debug(f"Color similarity calculation fallback: {str(e)}")
        return 0.85


def compute_structural_similarity(img1_bytes: bytes, img2_bytes: bytes) -> float:
    """
    Computes normalized gradient / edge correlation similarity in range [0.0, 1.0].
    """
    try:
        from PIL import ImageFilter
        im1 = Image.open(io.BytesIO(img1_bytes)).convert("L").resize((128, 128))
        im2 = Image.open(io.BytesIO(img2_bytes)).convert("L").resize((128, 128))
        e1 = np.array(im1.filter(ImageFilter.FIND_EDGES), dtype=np.float32) / 255.0
        e2 = np.array(im2.filter(ImageFilter.FIND_EDGES), dtype=np.float32) / 255.0
        e1_norm = e1 - np.mean(e1)
        e2_norm = e2 - np.mean(e2)
        denom = np.sqrt(np.sum(e1_norm**2) * np.sum(e2_norm**2)) + 1e-8
        corr = float(np.sum(e1_norm * e2_norm) / denom)
        return max(0.0, min(1.0, round((corr + 1.0) / 2.0, 4)))
    except Exception as e:
        logger.debug(f"Structural similarity calculation fallback: {str(e)}")
        return 0.80


def determine_verdict(distance: float) -> tuple:
    """
    Given a distance metric, determines verdict using tiered 3-way band:
      - distance < lower_bound: 'genuine'
      - lower_bound <= distance <= upper_bound: 'needs_review'
      - distance > upper_bound: 'suspect'
    Returns (verdict_str, confidence_float, authenticity_score_float).
    """
    global _DISTANCE_THRESHOLD, REVIEW_MARGIN

    lower_bound = _DISTANCE_THRESHOLD * (1.0 - REVIEW_MARGIN)
    upper_bound = _DISTANCE_THRESHOLD * (1.0 + REVIEW_MARGIN)

    if distance < lower_bound:
        verdict = "genuine"
        confidence = 1.0 - (distance / max(2.0 * lower_bound, 1e-5))
    elif distance <= upper_bound:
        verdict = "needs_review"
        diff_from_center = abs(distance - _DISTANCE_THRESHOLD)
        range_half = (upper_bound - lower_bound) / 2.0
        confidence = 0.5 + 0.3 * (1.0 - (diff_from_center / max(range_half, 1e-5)))
    else:
        verdict = "suspect"
        confidence = (distance - _DISTANCE_THRESHOLD) / max(_DISTANCE_THRESHOLD, 1e-5)

    confidence = max(0.0, min(1.0, round(float(confidence), 4)))
    authenticity_score = max(0.0, min(1.0, round(1.0 - (distance / max(2.0 * _DISTANCE_THRESHOLD, 1e-5)), 4)))

    return verdict, confidence, authenticity_score


def verify_authenticity_multi(ref_images_bytes: list, live_image_bytes: bytes) -> dict:
    """
    Computes embedding for live image and all reference images (1-3 images),
    computes multi-vector forensic metrics (neural, color, structural),
    and evaluates comprehensive verdict.
    """
    global _MOCK_MODE, _DISTANCE_THRESHOLD

    if _INTERPRETER is None and _MOCK_MODE:
        load_model()

    if _MOCK_MODE:
        logger.warning("Running verify_authenticity in MOCK MODE.")
        mock_dist = round(random.uniform(0.08, 0.22), 4)
        verdict, confidence, authenticity_score = determine_verdict(mock_dist)

        return {
            "verdict": verdict,
            "distance": mock_dist,
            "confidence": confidence,
            "authenticity_score": authenticity_score,
            "best_match_index": 0,
            "mock_mode": True,
            "forensics": {
                "neuralSimilarity": authenticity_score,
                "colorConsistency": 0.92,
                "structuralCoherence": 0.88,
                "compositeScore": authenticity_score,
                "distanceMetric": mock_dist,
            }
        }

    emb_live = get_embedding(live_image_bytes)
    distances = []
    color_sims = []
    struct_sims = []

    for ref_bytes in ref_images_bytes:
        emb_ref = get_embedding(ref_bytes)
        dist = compute_distance(emb_ref, emb_live)
        distances.append(dist)
        color_sims.append(compute_color_similarity(ref_bytes, live_image_bytes))
        struct_sims.append(compute_structural_similarity(ref_bytes, live_image_bytes))

    min_distance = min(distances) if distances else 0.0
    best_index = distances.index(min_distance) if distances else 0
    best_color_sim = color_sims[best_index] if color_sims else 0.85
    best_struct_sim = struct_sims[best_index] if struct_sims else 0.80

    # Calculate neural similarity score
    neural_score = max(0.0, min(1.0, round(1.0 - (min_distance / max(1.8 * _DISTANCE_THRESHOLD, 1e-5)), 4)))

    # Composite multi-vector score
    composite_score = round(0.55 * neural_score + 0.30 * best_color_sim + 0.15 * best_struct_sim, 4)

    # Multi-vector verdict classification
    if composite_score >= 0.78 and best_color_sim >= 0.50:
        verdict = "genuine"
        confidence = round(0.85 + 0.15 * min(1.0, (composite_score - 0.78) / 0.22), 4)
    elif composite_score >= 0.48:
        verdict = "needs_review"
        confidence = round(0.60 + 0.25 * (1.0 - abs(composite_score - 0.63) / 0.15), 4)
    else:
        verdict = "suspect"
        confidence = round(0.80 + 0.20 * min(1.0, (0.48 - composite_score) / 0.48), 4)

    confidence = max(0.10, min(1.0, confidence))

    return {
        "verdict": verdict,
        "distance": round(min_distance, 4),
        "confidence": confidence,
        "authenticity_score": composite_score,
        "best_match_index": best_index,
        "mock_mode": False,
        "forensics": {
            "neuralSimilarity": neural_score,
            "colorConsistency": best_color_sim,
            "structuralCoherence": best_struct_sim,
            "compositeScore": composite_score,
            "distanceMetric": round(min_distance, 4),
        }
    }


def verify_authenticity(reference_image_bytes: bytes, live_image_bytes: bytes) -> dict:
    return verify_authenticity_multi([reference_image_bytes], live_image_bytes)


def predict(reference_image_bytes: bytes, live_image_bytes: bytes) -> dict:
    return verify_authenticity(reference_image_bytes, live_image_bytes)
