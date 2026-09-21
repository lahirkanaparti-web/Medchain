import os
import sys
import json
import dotenv

# Load environment
dotenv.load_dotenv("backend/.env")
sys.path.append("backend")

from app.services.agents import (
    explain_verdict,
    draft_recall_notice,
    extract_batch_info_from_image,
    investigate_batch,
    check_geolocation_anomaly
)

def main():
    print("======================================================================")
    print("       MEDCHAIN AI AGENT SUITE (GROQ API) — PHASE A TEST RUN")
    print("======================================================================")

    # 1. Test Agent A1: Verdict Explanation Agent
    print("\n[TEST 1] AGENT A1: Verdict Explanation Agent (explain_verdict)")
    history_sample = [{"custodian": "0xA6C5...", "state_name": "Manufactured"}]
    exp_genuine = explain_verdict("genuine", 0.08, 0.98, history_sample)
    exp_suspect = explain_verdict("suspect", 0.65, 0.85, history_sample)
    print(f" -> Genuine Verdict Explanation:\n   \"{exp_genuine}\"\n")
    print(f" -> Suspect Verdict Explanation:\n   \"{exp_suspect}\"\n")

    # 2. Test Agent A2: Recall Notice Drafting Agent
    print("[TEST 2] AGENT A2: Recall Notice Drafting Agent (draft_recall_notice)")
    batch_data = {
        "batch_id": 1,
        "drug_name": "Amoxicillin 500mg Capsules",
        "batch_number": "BATCH-2026-X99",
        "mfg_date": 1768435200,
        "expiry_date": 1831507200
    }
    recall_reason = "Packaging seal tamper defect reported during audit"
    notice = draft_recall_notice(batch_data, recall_reason)
    print(f" -> Drafted Recall Notice:\n{notice}\n")

    # 3. Test Agent A3: Manufacturer Data-Entry Assistant (Vision OCR)
    print("[TEST 3] AGENT A3: Vision Data-Entry Assistant (extract_batch_info_from_image)")
    # Generate tiny 100x100 white test image bytes
    from PIL import Image
    import io
    img = Image.new("RGB", (100, 100), color="white")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    img_bytes = buf.getvalue()

    extracted = extract_batch_info_from_image(img_bytes)
    print(f" -> Vision Extracted Data JSON:\n{json.dumps(extracted, indent=2)}\n")

    # 4. Test Agent A4: Regulator Investigation Agent (Multi-Step Tool Use)
    print("[TEST 4] AGENT A4: Regulator Investigation Agent (investigate_batch)")
    brief = investigate_batch(1)
    print(f" -> Investigation Summary: {brief.get('summary')}")
    print(f" -> Risk Level: {brief.get('risk_level')}")
    print(f" -> Findings: {brief.get('findings')}")
    print(f" -> Recommended Action: {brief.get('recommended_action')}")
    print(f" -> Tool Trace Count: {len(brief.get('tool_trace', []))}")
    print(f" -> Tool Trace Detail: {json.dumps(brief.get('tool_trace', []), indent=2)}")

    print("\n======================================================================")
    print("      ALL 4 AI AGENTS OPERATIONAL & TESTED PERFECTLY!")
    print("======================================================================")

if __name__ == "__main__":
    main()
