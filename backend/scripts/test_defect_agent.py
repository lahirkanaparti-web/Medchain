import os
import io
import sys
import logging
from PIL import Image

# Add backend directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.agents import inspect_for_defects
from fastapi.testclient import TestClient
from app.main import app

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_defect_agent")


def create_dummy_image_bytes() -> bytes:
    """Generates a small valid JPEG image in memory for testing."""
    img = Image.new("RGB", (200, 200), color=(200, 220, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_inspect_for_defects_direct():
    logger.info("=== Testing inspect_for_defects (Direct Call) ===")
    img_bytes = create_dummy_image_bytes()
    res = inspect_for_defects(img_bytes)

    logger.info(f"Result: {res}")

    assert isinstance(res, dict), "Result must be a dictionary"
    assert "has_defects" in res, "Missing 'has_defects' key"
    assert "defects_found" in res, "Missing 'defects_found' key"
    assert "severity" in res, "Missing 'severity' key"
    assert "recommendation" in res, "Missing 'recommendation' key"

    assert isinstance(res["has_defects"], bool), "'has_defects' must be boolean"
    assert isinstance(res["defects_found"], list), "'defects_found' must be a list"
    assert res["severity"] in ["none", "minor", "major"], f"Unexpected severity value: {res['severity']}"
    assert isinstance(res["recommendation"], str), "'recommendation' must be a string"

    logger.info("Direct test passed successfully!")


def test_inspect_for_defects_api_endpoint():
    logger.info("=== Testing POST /batches/1/inspect-defects API Endpoint ===")
    client = TestClient(app)
    img_bytes = create_dummy_image_bytes()

    files = {"image": ("test_product.jpg", img_bytes, "image/jpeg")}
    response = client.post("/batches/1/inspect-defects", files=files)

    logger.info(f"Status Code: {response.status_code}")
    logger.info(f"Response Body: {response.json()}")

    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
    data = response.json()
    assert "has_defects" in data
    assert "defects_found" in data
    assert "severity" in data
    assert "recommendation" in data

    logger.info("API Endpoint test passed successfully!")


if __name__ == "__main__":
    logger.info("Starting Agent #5 Defect Inspection Test Suite...")
    test_inspect_for_defects_direct()
    test_inspect_for_defects_api_endpoint()
    logger.info("ALL AGENT #5 TESTS PASSED SUCCESSFULLY!")
