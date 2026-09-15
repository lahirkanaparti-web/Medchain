import sys
import os
import io
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_phase_c_endpoints():
    print("--- 1. Testing Root Endpoint ---")
    res = client.get("/")
    assert res.status_code == 200, f"Root failed: {res.text}"
    print("Root response:", res.json())

    # Generate dummy image bytes (valid 1x1 GIF)
    dummy_gif = b'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'

    print("\n--- 2. Testing Batch Creation with 2 Reference Images (POST /batches) ---")
    form_data = {
        "drugName": "Amoxicillin 500mg",
        "batchNumber": f"BATCH-TEST-{int(time.time())}",
        "mfgDate": str(int(time.time()) - 86400 * 2),
        "expiryDate": str(int(time.time()) + 86400 * 365)
    }
    files = [
        ("images", ("front.gif", dummy_gif, "image/gif")),
        ("images", ("back.gif", dummy_gif, "image/gif"))
    ]
    res = client.post("/batches", data=form_data, files=files)
    assert res.status_code == 200, f"Create batch failed: {res.text}"
    create_data = res.json()
    batch_id = create_data["batchId"]
    print(f"Batch created successfully! Batch ID: {batch_id}, IPFS Hashes: {create_data.get('ipfsHashes')}")

    print(f"\n--- 3. Testing Batch Detail Endpoint (GET /batches/{batch_id}) ---")
    res = client.get(f"/batches/{batch_id}")
    assert res.status_code == 200, f"Get batch failed: {res.text}"
    detail = res.json()
    print("Batch Details:", detail["drugName"], detail["stateName"], "isRecalled:", detail["isRecalled"])

    print(f"\n--- 4. Testing Batch Transfer with Geolocation (POST /batches/{batch_id}/transfer) ---")
    transfer_payload = {
        "toAddress": "0xA6C5Ab3CC646b083F6936e696F5722ED2c5Bd9fd",
        "newState": 1, # InTransit
        "latitude": "12.9716",
        "longitude": "77.5946"
    }
    res = client.post(f"/batches/{batch_id}/transfer", json=transfer_payload)
    assert res.status_code == 200, f"Transfer failed: {res.text}"
    transfer_res = res.json()
    print("Transfer response:", transfer_res["newStateName"], "Lat/Lon:", transfer_res.get("latitude"), transfer_res.get("longitude"))

    print(f"\n--- 5. Testing Verification (POST /batches/{batch_id}/verify) ---")
    v_files = {"image": ("live.gif", dummy_gif, "image/gif")}
    res = client.post(f"/batches/{batch_id}/verify", files=v_files)
    assert res.status_code == 200, f"Verify failed: {res.text}"
    v_data = res.json()
    print("Verify verdict:", v_data["verdict"], "distance:", v_data["distance"], "confidence:", v_data["confidence"])
    assert v_data["verdict"] in ["genuine", "needs_review", "suspect"]

    print(f"\n--- 6. Testing Batch Recall (POST /batches/{batch_id}/recall) ---")
    recall_payload = {"reason": "Test regulatory quality hold"}
    res = client.post(f"/batches/{batch_id}/recall", json=recall_payload)
    assert res.status_code == 200, f"Recall failed: {res.text}"
    print("Recall response:", res.json())

    print(f"\n--- 7. Testing Batch Export CSV (GET /batches/{batch_id}/export?format=csv) ---")
    res = client.get(f"/batches/{batch_id}/export?format=csv")
    assert res.status_code == 200, f"Export CSV failed: {res.text}"
    assert "MEDCHAIN BATCH AUDIT REPORT" in res.text
    print("Export CSV Success! Size:", len(res.text), "bytes")

    print(f"\n--- 8. Testing Batch Export PDF (GET /batches/{batch_id}/export?format=pdf) ---")
    res = client.get(f"/batches/{batch_id}/export?format=pdf")
    assert res.status_code == 200, f"Export PDF failed: {res.text}"
    assert res.content.startswith(b"%PDF")
    print("Export PDF Success! Size:", len(res.content), "bytes")

    print("\nALL PHASE C BACKEND ENDPOINTS TESTED AND VERIFIED WORKING PERFECTLY!")

if __name__ == "__main__":
    test_phase_c_endpoints()
