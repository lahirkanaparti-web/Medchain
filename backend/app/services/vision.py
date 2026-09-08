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


def load_model(model_path: str = None, bundle_path: str = None):
    """
    Loads the TFLite Siamese embedding model and joblib threshold bundle from disk.
    If missing or invalid, falls back to MOCK MODE without raising an unhandled exception.
    """
    global _INTERPRETER, _INPUT_DETAILS, _OUTPUT_DETAILS, _BUNDLE
    global _MOCK_MODE, _DISTANCE_THRESHOLD, _EMBEDDING_DIM, _IMG_SIZE

    if model_path is None:
        model_path = os.getenv("ML_MODEL_PATH", "app/ml_models/medchain_siamese_embedding.tflite")
    if bundle_path is None:
        bundle_path = os.getenv("ML_BUNDLE_PATH", "app/ml_models/medchain_siamese_bundle.joblib")

    # Check existence of both required Colab artifact files
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

        # Attempt loading TFLite interpreter via tflite_runtime or tensorflow
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

    # Convert to float32 numpy array
    img_arr = np.array(image, dtype=np.float32)

    # Xception-style preprocessing: scale pixel values from [0, 255] to [-1.0, 1.0]
    img_arr = (img_arr / 127.5) - 1.0

    # Expand batch dimension -> (1, 299, 299, 3)
    return np.expand_dims(img_arr, axis=0)


def get_embedding(image_bytes: bytes) -> np.ndarray:
    """
    Extracts L2-normalized 256-dimensional embedding vector for an image.
    Returns random unit vector if in MOCK MODE.
    """
    global _INTERPRETER, _INPUT_DETAILS, _OUTPUT_DETAILS, _MOCK_MODE, _EMBEDDING_DIM

    if _MOCK_MODE or _INTERPRETER is None:
        # Generate random unit-normalized embedding vector for mock evaluation
        vec = np.random.randn(_EMBEDDING_DIM).astype(np.float32)
        return vec / (np.linalg.norm(vec) + 1e-8)

    try:
        input_tensor = preprocess_image(image_bytes)
        _INTERPRETER.set_tensor(_INPUT_DETAILS[0]['index'], input_tensor)
        _INTERPRETER.invoke()
        embedding = _INTERPRETER.get_tensor(_OUTPUT_DETAILS[0]['index'])[0]

        # Ensure L2 normalization
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


def verify_authenticity(reference_image_bytes: bytes, live_image_bytes: bytes) -> dict:
    """
    Computes reference and live embeddings, calculates squared L2 distance,
    compares against distance_threshold, and calculates confidence score.
    """
    global _MOCK_MODE, _DISTANCE_THRESHOLD

    # Ensure model is initialized if not yet called
    if _INTERPRETER is None and _MOCK_MODE:
        load_model()

    if _MOCK_MODE:
        logger.warning("Running verify_authenticity in MOCK MODE (model files missing or interpreter uninitialized).")
        mock_dist = round(random.uniform(0.08, 0.22), 4)
        verdict = "genuine" if mock_dist <= _DISTANCE_THRESHOLD else "suspect"
        confidence = round(1.0 - (mock_dist / (2.0 * _DISTANCE_THRESHOLD)), 4)
        authenticity_score = round(max(0.0, min(1.0, 1.0 - mock_dist)), 4)

        return {
            "verdict": verdict,
            "distance": mock_dist,
            "confidence": max(0.0, min(1.0, confidence)),
            "authenticity_score": authenticity_score,
            "mock_mode": True
        }

    emb_ref = get_embedding(reference_image_bytes)
    emb_live = get_embedding(live_image_bytes)

    distance = compute_distance(emb_ref, emb_live)
    is_genuine = (distance <= _DISTANCE_THRESHOLD)
    verdict = "genuine" if is_genuine else "suspect"

    # Normalized confidence score heuristic
    if is_genuine:
        raw_conf = 1.0 - (distance / (2.0 * _DISTANCE_THRESHOLD))
    else:
        raw_conf = (distance - _DISTANCE_THRESHOLD) / max(_DISTANCE_THRESHOLD, 1e-5)

    confidence = max(0.0, min(1.0, round(float(raw_conf), 4)))
    authenticity_score = max(0.0, min(1.0, round(1.0 - (distance / max(2.0 * _DISTANCE_THRESHOLD, 1e-5)), 4)))

    return {
        "verdict": verdict,
        "distance": round(distance, 4),
        "confidence": confidence,
        "authenticity_score": authenticity_score,
        "mock_mode": False
    }


# Backwards compatibility alias for existing routes
def predict(reference_image_bytes: bytes, live_image_bytes: bytes) -> dict:
    return verify_authenticity(reference_image_bytes, live_image_bytes)
