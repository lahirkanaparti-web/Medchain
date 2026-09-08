import os
import sys
import io
from PIL import Image

# Add parent app directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.vision import load_model, verify_authenticity, get_embedding, compute_distance


def create_sample_image(color="blue", text="Sample"):
    """Generates a dummy 300x300 image byte stream for testing."""
    img = Image.new("RGB", (300, 300), color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def main():
    print("=" * 60)
    print("MedChain Siamese Vision Model Integration Test")
    print("=" * 60)

    # Attempt model startup load
    loaded = load_model()
    print(f"Model Load Status: {'REAL TFLITE MODE' if loaded else 'MOCK FALLBACK MODE'}")

    # Generate reference and live sample image bytes
    ref_bytes = create_sample_image("blue")
    live_bytes = create_sample_image("blue")  # Identical image -> low distance

    diff_bytes = create_sample_image("red")   # Different image -> higher distance

    print("\n--- Test 1: Matching Image Pair ---")
    res1 = verify_authenticity(ref_bytes, live_bytes)
    print(f"Verdict     : {res1['verdict'].upper()}")
    print(f"L2 Distance : {res1['distance']:.4f}")
    print(f"Confidence  : {res1['confidence'] * 100:.2f}%")
    print(f"Mock Mode   : {res1['mock_mode']}")

    print("\n--- Test 2: Different Image Pair ---")
    res2 = verify_authenticity(ref_bytes, diff_bytes)
    print(f"Verdict     : {res2['verdict'].upper()}")
    print(f"L2 Distance : {res2['distance']:.4f}")
    print(f"Confidence  : {res2['confidence'] * 100:.2f}%")
    print(f"Mock Mode   : {res2['mock_mode']}")

    print("\n" + "=" * 60)
    print("Test Execution Complete.")
    print("=" * 60)


if __name__ == "__main__":
    main()
