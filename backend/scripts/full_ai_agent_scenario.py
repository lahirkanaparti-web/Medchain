import sys
import io
import json
import time
import dotenv
from PIL import Image
from fastapi.testclient import TestClient

dotenv.load_dotenv("backend/.env")
sys.path.append("backend")

from app.main import app

def main():
    print("======================================================================")
    print("      MEDCHAIN FULL E2E SCENARIO — ALL 4 GROQ AI AGENTS DEMO")
    print("======================================================================")

    client = TestClient(app)

    # -----------------------------------------------------------------
    # STEP 1: Agent A3 — Manufacturer Vision OCR Label Autofill
    # -----------------------------------------------------------------
    print("\n[STEP 1] Agent A3: Manufacturer uploads packaging label photo for AI autofill...")
    # Generate tiny sample label image bytes
    img = Image.new("RGB", (150, 150), color="white")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    label_bytes = buf.getvalue()

    r1 = client.post("/extract-batch-info", files={"image": ("label_sample.jpg", label_bytes, "image/jpeg")})
    assert r1.status_code == 200, f"Step 1 failed: {r1.text}"
    extracted_data = r1.json()
    print(f"  -> Vision OCR Extracted Data JSON: {json.dumps(extracted_data, indent=2)}")

    # -----------------------------------------------------------------
    # STEP 2: Create Batch & Verify Product (Agent A1: Verdict Explanation)
    # -----------------------------------------------------------------
    print("\n[STEP 2] Create batch & run verification to test Agent A1 (Verdict Explanation)...")
    # Batch creation payload
    form_payload = {
        "drugName": extracted_data.get("drug_name") or "Amoxicillin 500mg",
        "batchNumber": extracted_data.get("batch_number") or f"BATCH-2026-AI{int(time.time()) % 1000}",
        "mfgDate": int(time.time()) - 86400 * 5,
        "expiryDate": int(time.time()) + 86400 * 365
    }
    r2_create = client.post("/batches", data=form_payload, files={"images": ("ref_1.jpg", label_bytes, "image/jpeg")})
    assert r2_create.status_code == 200, f"Batch creation failed: {r2_create.text}"
    batch_res = r2_create.json()
    bid = batch_res["batchId"]
    print(f"  -> Batch #{bid} created successfully! TxHash: {batch_res.get('txHash', 'N/A')[:18]}...")

    # Product Verification
    r2_verify = client.post(f"/batches/{bid}/verify", files={"image": ("live_photo.jpg", label_bytes, "image/jpeg")})
    assert r2_verify.status_code == 200, f"Verify failed: {r2_verify.text}"
    verify_res = r2_verify.json()
    print(f"  -> Verdict: {verify_res['verdict'].upper()} (Confidence: {verify_res['confidence']*100:.1f}%)")
    print(f"  -> Agent A1 Patient Explanation Text:\n     \"{verify_res.get('explanation')}\"")

    # -----------------------------------------------------------------
    # STEP 3: Agent A4 — Regulator Multi-Step Investigation Agent
    # -----------------------------------------------------------------
    print(f"\n[STEP 3] Regulator runs Agent A4 (Multi-Step Investigation) on Batch #{bid}...")
    r3_inv = client.post(f"/batches/{bid}/investigate")
    assert r3_inv.status_code == 200, f"Investigate failed: {r3_inv.text}"
    inv_brief = r3_inv.json()
    print(f"  -> Risk Level: {inv_brief.get('risk_level').upper()}")
    print(f"  -> Summary: {inv_brief.get('summary')}")
    print(f"  -> Findings Count: {len(inv_brief.get('findings', []))}")
    print(f"  -> Recommended Action: {inv_brief.get('recommended_action')}")
    print(f"  -> Tool Trace Log ({len(inv_brief.get('tool_trace', []))} tools executed):")
    for t in inv_brief.get("tool_trace", []):
        print(f"      - Tool: {t['tool']} | Args: {t['args']}")

    # -----------------------------------------------------------------
    # STEP 4: Agent A2 — Recall Notice Drafting Agent
    # -----------------------------------------------------------------
    print(f"\n[STEP 4] Regulator recalls Batch #{bid} & tests Agent A2 (Recall Notice Drafting)...")
    recall_payload = {"reason": "Packaging seal tamper defect reported during audit"}
    r4_recall = client.post(f"/batches/{bid}/recall", json=recall_payload)
    assert r4_recall.status_code == 200, f"Recall failed: {r4_recall.text}"
    recall_res = r4_recall.json()
    print(f"  -> On-Chain Recall TxHash: {recall_res.get('txHash', 'N/A')[:18]}...")
    print(f"  -> Agent A2 Drafted Recall Notice:\n{recall_res.get('recallNotice')}\n")

    # Verify retrieval via GET /batches/{bid}
    r4_get = client.get(f"/batches/{bid}")
    assert r4_get.status_code == 200, f"GET batch failed: {r4_get.text}"
    get_res = r4_get.json()
    assert get_res["isRecalled"] == True
    assert len(get_res["recallNotice"]) > 0
    print("  -> Confirmed drafted recall notice persisted & retrievable via GET /batches/{id}!")

    print("\n======================================================================")
    print("  FULL AI AGENT E2E SCENARIO COMPLETED PERFECTLY WITH 100% SUCCESS!")
    print("======================================================================")

if __name__ == "__main__":
    main()
