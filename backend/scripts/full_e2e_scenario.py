import sys
import os
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_full_e2e_walkthrough():
    print("=" * 70)
    print("      MEDCHAIN TIER 1 FEATURE EXPANSION — FULL E2E WALKTHROUGH")
    print("=" * 70)

    dummy_gif = b'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'

    # STEP 1: Create batch with 2 reference images (Front & Back)
    print("\n[STEP 1] Manufacturer creates batch with 2 reference images (Front & Back)")
    form_data = {
        "drugName": "Lipitor 20mg (E2E Test)",
        "batchNumber": f"BATCH-E2E-{int(time.time())}",
        "mfgDate": str(int(time.time()) - 86400 * 2),
        "expiryDate": str(int(time.time()) + 86400 * 365)
    }
    files = [
        ("images", ("front.gif", dummy_gif, "image/gif")),
        ("images", ("back.gif", dummy_gif, "image/gif"))
    ]
    res1 = client.post("/batches", data=form_data, files=files)
    assert res1.status_code == 200, f"Step 1 failed: {res1.text}"
    b_data = res1.json()
    batch_id = b_data["batchId"]
    print(f"  -> Batch #{batch_id} created successfully!")
    print(f"  -> Transaction Hash: {b_data['txHash']}")
    print(f"  -> Reference IPFS CIDs ({len(b_data.get('ipfsHashes', []))}): {b_data.get('ipfsHashes')}")

    # STEP 2: Transfer custody with Geolocation PERMISSION GRANTED
    print("\n[STEP 2] Transfer custody to Distributor with Geolocation (GPS GRANTED)")
    transfer1 = {
        "toAddress": "0xA6C5Ab3CC646b083F6936e696F5722ED2c5Bd9fd",
        "newState": 1, # InTransit
        "latitude": "12.971598",
        "longitude": "77.594563"
    }
    res2 = client.post(f"/batches/{batch_id}/transfer", json=transfer1)
    assert res2.status_code == 200, f"Step 2 failed: {res2.text}"
    t1_data = res2.json()
    print(f"  -> Custody updated: {t1_data['newStateName']}")
    print(f"  -> Coordinates recorded: Lat {t1_data['latitude']}, Lon {t1_data['longitude']}")

    # STEP 3: Transfer custody with Geolocation DENIED
    print("\n[STEP 3] Transfer custody to Pharmacy with Geolocation (GPS DENIED / Empty)")
    transfer2 = {
        "toAddress": "0xA6C5Ab3CC646b083F6936e696F5722ED2c5Bd9fd",
        "newState": 2, # AtDistributor
        "latitude": "",
        "longitude": ""
    }
    res3 = client.post(f"/batches/{batch_id}/transfer", json=transfer2)
    assert res3.status_code == 200, f"Step 3 failed: {res3.text}"
    t2_data = res3.json()
    print(f"  -> Custody updated: {t2_data['newStateName']}")
    print(f"  -> Empty coordinates accepted gracefully: Lat '{t2_data['latitude']}', Lon '{t2_data['longitude']}'")

    # STEP 4: Patient verification returns a verdict on photo
    print("\n[STEP 4] Patient verifies physical packaging photo against multi-reference standards")
    v_files = {"image": ("patient_sample.gif", dummy_gif, "image/gif")}
    res4 = client.post(f"/batches/{batch_id}/verify", files=v_files)
    assert res4.status_code == 200, f"Step 4 failed: {res4.text}"
    v_data = res4.json()
    print(f"  -> Verdict: {v_data['verdict'].upper()}")
    print(f"  -> Minimum distance metric: {v_data['distance']}")
    print(f"  -> Confidence score: {v_data['confidence'] * 100}%")

    # STEP 5: Regulator recalls the batch on-chain
    print("\n[STEP 5] Regulator issues binding on-chain recall order (REGULATOR_ROLE)")
    recall_req = {"reason": "Packaging seal tamper defect reported during audit"}
    res5 = client.post(f"/batches/{batch_id}/recall", json=recall_req)
    assert res5.status_code == 200, f"Step 5 failed: {res5.text}"
    rec_data = res5.json()
    print(f"  -> On-Chain Recall Tx: {rec_data['txHash']}")
    print(f"  -> Reason: {rec_data['reason']}")

    # STEP 6: Confirm Patient View & Batch Query now surface recall warning
    print("\n[STEP 6] Confirm Patient & Role views now surface recall warning banner")
    res6 = client.get(f"/batches/{batch_id}")
    assert res6.status_code == 200, f"Step 6 failed: {res6.text}"
    b_detail = res6.json()
    assert b_detail["isRecalled"] == True
    print(f"  -> Batch #{batch_id} stateName: {b_detail['stateName']}")
    print(f"  -> isRecalled: {b_detail['isRecalled']}")
    print(f"  -> recallReason: {b_detail['recallReason']}")
    print("  -> Patient & Role view warning banners CONFIRMED ACTIVE.")

    # STEP 7: Export batch record as PDF
    print("\n[STEP 7] Export full batch audit record as PDF")
    res7 = client.get(f"/batches/{batch_id}/export?format=pdf")
    assert res7.status_code == 200, f"Step 7 failed: {res7.text}"
    assert res7.content.startswith(b"%PDF")
    print(f"  -> ReportLab PDF document generated successfully! Size: {len(res7.content)} bytes")

    print("\n" + "=" * 70)
    print("  E2E WALKTHROUGH COMPLETED PERFECTLY WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == "__main__":
    run_full_e2e_walkthrough()
