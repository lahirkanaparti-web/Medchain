import pytest
import io
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.services.ipfs import upload_to_ipfs, get_ipfs_url
from app.services.vision import predict, preprocess_image, load_model
from app.services.qr import generate_qr

client = TestClient(app)


def create_dummy_image_bytes():
    """Generates 100x100 RGB image bytes for testing."""
    img = Image.new("RGB", (100, 100), color="blue")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_ipfs_service():
    img_bytes = create_dummy_image_bytes()
    cid = upload_to_ipfs(img_bytes, "test_drug.jpg")
    assert cid is not None
    assert len(cid) > 0

    url = get_ipfs_url(cid)
    assert url.startswith("https://")
    assert cid in url


def test_vision_service_mock_mode():
    img_bytes = create_dummy_image_bytes()
    # Test preprocessor
    tensor = preprocess_image(img_bytes)
    assert tensor.shape == (1, 299, 299, 3)

    # Test prediction
    result = predict(img_bytes, img_bytes)
    assert "authenticity_score" in result
    assert "verdict" in result
    assert result["verdict"] in ["genuine", "suspect"]
    assert 0.0 <= result["authenticity_score"] <= 1.0


def test_qr_service():
    qr_bytes = generate_qr(batch_id=42)
    assert qr_bytes.startswith(b"\x89PNG")


def test_fastapi_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"


def test_fastapi_batch_lifecycle_routes():
    img_bytes = create_dummy_image_bytes()

    # 1. Create Batch Endpoint
    files = {"image": ("reference.jpg", img_bytes, "image/jpeg")}
    form_data = {
        "drugName": "Amoxicillin 500mg",
        "batchNumber": "BATCH-TEST-2026",
        "mfgDate": "1700000000",
        "expiryDate": "1735000000",
    }
    create_res = client.post("/batches", data=form_data, files=files)
    assert create_res.status_code == 200
    create_data = create_res.json()
    assert "batchId" in create_data
    assert create_data["drugName"] == "Amoxicillin 500mg"
    batch_id = create_data["batchId"]

    # 2. Get Batch Endpoint
    detail_res = client.get(f"/batches/{batch_id}")
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert detail_data["batchId"] == batch_id
    assert len(detail_data["custodyHistory"]) >= 1

    # 3. Transfer Custody Endpoint (0 Manufactured -> 1 InTransit)
    transfer_res = client.post(
        f"/batches/{batch_id}/transfer",
        json={
            "toAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
            "newState": 1
        }
    )
    assert transfer_res.status_code == 200
    transfer_data = transfer_res.json()
    assert transfer_data["newState"] == 1

    # 4. QR Code Endpoint
    qr_res = client.get(f"/batches/{batch_id}/qr")
    assert qr_res.status_code == 200
    assert qr_res.headers["content-type"] == "image/png"

    # 5. Image Verification Endpoint
    verify_files = {"image": ("live_photo.jpg", img_bytes, "image/jpeg")}
    verify_res = client.post(f"/batches/{batch_id}/verify", files=verify_files)
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert "authenticityScore" in verify_data
    assert "verdict" in verify_data
    assert "custodyHistory" in verify_data
