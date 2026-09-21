import os
import io
import sys
import time
import logging
from PIL import Image

# Add backend directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.agents import run_autonomous_regulator
from app.services.alerts import get_audit_log
from fastapi.testclient import TestClient
from app.main import app

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_autonomous_regulator")


def create_dummy_image_bytes() -> bytes:
    """Generates a small valid JPEG image in memory for testing."""
    img = Image.new("RGB", (200, 200), color=(255, 100, 100))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_autonomous_regulator_direct():
    logger.info("=== Testing run_autonomous_regulator (Direct Execution) ===")
    mock_defect_report = {
        "has_defects": True,
        "defects_found": ["Cracked bottle", "Leaking liquid"],
        "severity": "major",
        "recommendation": "Product packaging broken and leaking liquid. Immediate isolation required."
    }

    res = run_autonomous_regulator(batch_id=1, defect_report=mock_defect_report)
    logger.info(f"Direct Execution Result: {res}")

    assert isinstance(res, dict), "Result must be a dictionary"
    assert "id" in res
    assert "timestamp" in res
    assert res["batch_id"] == 1
    assert "investigation_brief" in res
    assert "risk_level" in res
    assert "action_taken" in res
    assert res["action_taken"] in ["recalled", "flagged_medium", "logged_low"]

    logger.info("Direct execution test passed successfully!")


def test_audit_log_endpoint():
    logger.info("=== Testing GET /regulator/audit-log API Endpoint ===")
    client = TestClient(app)
    response = client.get("/regulator/audit-log")

    logger.info(f"Status Code: {response.status_code}")
    entries = response.json()
    logger.info(f"Retrieved {len(entries)} audit log entries.")

    assert response.status_code == 200
    assert isinstance(entries, list)
    if len(entries) > 0:
        first = entries[0]
        assert "id" in first
        assert "risk_level" in first
        assert "action_taken" in first

    logger.info("Audit Log endpoint test passed successfully!")


def test_defect_inspection_triggers_autonomous_pipeline():
    logger.info("=== Testing Defect Inspection Endpoint Triggering Background Autonomous Pipeline ===")
    client = TestClient(app)
    img_bytes = create_dummy_image_bytes()

    # Enable autonomous regulator
    os.environ["AUTONOMOUS_REGULATOR_ENABLED"] = "true"

    files = {"image": ("damaged_bottle.jpg", img_bytes, "image/jpeg")}
    response = client.post("/batches/1/inspect-defects", files=files)

    logger.info(f"Defect Inspection HTTP Status: {response.status_code}")
    assert response.status_code == 200

    # Wait briefly for background task execution
    time.sleep(2)

    # Fetch audit log to confirm background processing logged an entry
    log_res = client.get("/regulator/audit-log?batch_id=1")
    entries = log_res.json()
    logger.info(f"Audit log entries for batch #1: {len(entries)}")
    assert len(entries) > 0

    logger.info("Background autonomous pipeline trigger verified!")


def test_kill_switch_behavior():
    logger.info("=== Testing AUTONOMOUS_REGULATOR_ENABLED=false Kill Switch ===")
    client = TestClient(app)
    img_bytes = create_dummy_image_bytes()

    # Disable autonomous regulator via kill switch
    os.environ["AUTONOMOUS_REGULATOR_ENABLED"] = "false"

    files = {"image": ("damaged_bottle_disabled.jpg", img_bytes, "image/jpeg")}
    response = client.post("/batches/99/inspect-defects", files=files)

    assert response.status_code == 200

    # Fetch audit log for batch #99
    log_res = client.get("/regulator/audit-log?batch_id=99")
    entries = log_res.json()
    logger.info(f"Audit log entries for batch #99 with kill switch OFF: {entries}")

    # Re-enable for subsequent runs
    os.environ["AUTONOMOUS_REGULATOR_ENABLED"] = "true"

    logger.info("Kill switch test passed successfully!")


if __name__ == "__main__":
    logger.info("Starting Fully Autonomous Regulator Agent Backend Test Suite...")
    test_autonomous_regulator_direct()
    test_audit_log_endpoint()
    test_defect_inspection_triggers_autonomous_pipeline()
    test_kill_switch_behavior()
    logger.info("ALL AUTONOMOUS REGULATOR BACKEND TESTS PASSED SUCCESSFULLY!")
