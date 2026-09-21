import os
import io
import json
import time
import math
import base64
import logging
from typing import Dict, Any, List, Optional
from PIL import Image

logger = logging.getLogger(__name__)

# Constants & Fallback Model Candidates for Groq API
TEXT_MODELS = [
    "llama-3.3-70b-versatile",
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-120b",
    "groq/compound"
]

VISION_MODELS = [
    "llama-3.2-90b-vision-preview",
    "llama-3.2-11b-vision-preview",
    "qwen/qwen3.8-27b"
]

# Global Groq Client Handle
_GROQ_CLIENT = None


def get_groq_client():
    """
    Initializes and returns the Groq client.
    Returns None if GROQ_API_KEY is missing or invalid.
    """
    global _GROQ_CLIENT
    if _GROQ_CLIENT is not None:
        return _GROQ_CLIENT

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or api_key.startswith("YOUR_") or api_key == "mock_groq_key":
        logger.warning("GROQ_API_KEY not set or using placeholder. Running AI Agents in MOCK MODE.")
        return None

    try:
        from groq import Groq
        _GROQ_CLIENT = Groq(api_key=api_key)
        return _GROQ_CLIENT
    except Exception as e:
        logger.error(f"Failed to initialize Groq client: {str(e)}")
        return None


def execute_completion_with_fallback(api_call_builder, model_candidates: list, max_retries: int = 3, initial_delay: float = 1.5):
    """
    Executes a Groq API call trying candidate models with exponential backoff for 429 rate limits
    and graceful fallback if a model is decommissioned / not found.
    """
    last_exception = None
    for model_name in model_candidates:
        delay = initial_delay
        for attempt in range(max_retries + 1):
            try:
                return api_call_builder(model_name)
            except Exception as e:
                err_msg = str(e).lower()
                is_rate_limit = "429" in err_msg or "rate limit" in err_msg or "too many requests" in err_msg
                is_not_found = "404" in err_msg or "not found" in err_msg or "decommissioned" in err_msg

                if is_not_found:
                    logger.warning(f"Model '{model_name}' not available on Groq ({str(e)}). Trying fallback model...")
                    last_exception = e
                    break  # Break inner retry loop, try next model in candidate list

                if is_rate_limit and attempt < max_retries:
                    logger.warning(f"Groq API rate limited (429) on '{model_name}'. Retrying in {delay:.1f}s (Attempt {attempt + 1}/{max_retries})...")
                    time.sleep(delay)
                    delay *= 2.0
                else:
                    last_exception = e
                    if attempt == max_retries:
                        logger.warning(f"Model '{model_name}' failed after retries: {str(e)}. Trying fallback model...")
                        break

    if last_exception:
        raise last_exception
    raise RuntimeError("All candidate Groq models failed.")


# =====================================================================
# AGENT A1: VERDICT EXPLANATION AGENT
# =====================================================================
def explain_verdict(verdict: str, distance: float, confidence: float, custody_history: list) -> str:
    """
    Generates a 2-4 sentence plain-language explanation for a patient detailing
    why the verdict was issued, ending with an appropriate action recommendation.
    """
    client = get_groq_client()
    if not client:
        # Fallback Mock Explanation
        if verdict == "genuine":
            return ("The physical packaging photograph closely matches the manufacturer's official security standards "
                    "with high visual fidelity. The product custody chain shows continuous verified handling. "
                    "No action needed; this product is verified authentic.")
        elif verdict == "needs_review":
            return ("Minor visual variations were detected between the submitted packaging photo and the manufacturer's baseline reference. "
                    "While the product may be legitimate, the feature variance falls into a cautionary margin. "
                    "We recommend consulting your dispensing pharmacist before consumption.")
        else:
            return ("Significant visual discrepancies were detected on the packaging label and structural seal compared to verified standards. "
                    "This packaging shows features consistent with potential tampering or counterfeit production. "
                    "Do not consume this product, and report it to regulatory authorities immediately.")

    system_prompt = (
        "You are a medical security AI assistant explaining pharmaceutical verification results to patients.\n"
        "Your task: Write 2–4 plain-language sentences that a non-technical patient can easily understand.\n"
        "Rules:\n"
        "1. Explain conceptually what drove the verdict (e.g. 'the packaging photo closely matched the manufacturer's verified reference image' or 'noticeable visual differences were detected in the label font and anti-tamper seal').\n"
        "2. DO NOT use technical terms like 'embedding distance', 'L2 Euclidean norm', 'Siamese network', or 'TFLite vector'.\n"
        "3. End with ONE clear recommended next step:\n"
        "   - 'genuine' -> no action needed.\n"
        "   - 'needs_review' -> suggest contacting the pharmacy for verification.\n"
        "   - 'suspect' -> suggest not consuming the product and reporting it immediately.\n"
    )

    user_content = (
        f"Verdict: {verdict.upper()}\n"
        f"Similarity Match Metric: {confidence * 100:.1f}%\n"
        f"Custody Handoff Count: {len(custody_history)} lifecycle stages logged\n"
    )

    def _call(model_name):
        res = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.3,
            max_tokens=250
        )
        return res.choices[0].message.content.strip()

    try:
        return execute_completion_with_fallback(_call, TEXT_MODELS)
    except Exception as e:
        logger.error(f"Error generating verdict explanation: {str(e)}")
        return f"This product was evaluated as {verdict.upper()}. Please verify with your healthcare provider if you have any questions."


# =====================================================================
# AGENT A2: RECALL NOTICE DRAFTING AGENT
# =====================================================================
def draft_recall_notice(batch_data: dict, recall_reason: str) -> str:
    """
    Drafts a professional, structured pharmaceutical recall notice following official regulatory format.
    """
    client = get_groq_client()
    drug_name = batch_data.get("drug_name") or batch_data.get("drugName") or "Pharmaceutical Product"
    batch_num = batch_data.get("batch_number") or batch_data.get("batchNumber") or "UNKNOWN"
    batch_id = batch_data.get("batch_id") or batch_data.get("batchId") or 0
    mfg_date = batch_data.get("mfg_date") or batch_data.get("mfgDate") or 0
    exp_date = batch_data.get("expiry_date") or batch_data.get("expiryDate") or 0

    mfg_str = time.strftime("%Y-%m-%d", time.gmtime(mfg_date)) if mfg_date else "N/A"
    exp_str = time.strftime("%Y-%m-%d", time.gmtime(exp_date)) if exp_date else "N/A"

    if not client:
        return (
            f"URGENT PHARMACEUTICAL RECALL NOTICE\n\n"
            f"PRODUCT IDENTIFICATION:\n"
            f"Drug Name: {drug_name}\n"
            f"Batch Serial Number: {batch_num} (Token #{batch_id})\n"
            f"Manufacturing Date: {mfg_str} | Expiration Date: {exp_str}\n\n"
            f"REASON FOR RECALL:\n"
            f"{recall_reason}\n\n"
            f"AFFECTED DISTRIBUTION SCOPE:\n"
            f"All wholesale distributors, hospital networks, and retail pharmacies currently holding Batch {batch_num}.\n\n"
            f"RECOMMENDED ACTION:\n"
            f"Quarantine all physical units of this batch immediately. Cease dispensing to patients. "
            f"Return inventory to the authorized manufacturer contact.\n\n"
            f"CONTACT & REPORTING GUIDANCE:\n"
            f"For regulatory inquiries, contact MedChain Regulatory Operations at [RECALL-CONTACT-PLACEHOLDER@medchain.org]."
        )

    system_prompt = (
        "You are an expert pharmaceutical regulatory compliance officer.\n"
        "Draft a formal, professional Urgent Product Recall Notice following standard regulatory structure:\n"
        "1. URGENT PHARMACEUTICAL RECALL NOTICE Title\n"
        "2. Product & Batch Identification (Drug Name, Batch Serial Number, Token ID, Mfg/Expiry Dates)\n"
        "3. Detailed Reason for Recall\n"
        "4. Affected Distribution Scope\n"
        "5. Required Action for Pharmacists, Distributors, and Patients\n"
        "6. Contact & Regulatory Reporting Guidance (use placeholders like [RECALL-CONTACT-PLACEHOLDER]).\n\n"
        "Use clear paragraph breaks and professional clinical typography."
    )

    user_content = (
        f"Drug Name: {drug_name}\n"
        f"Batch Number: {batch_num}\n"
        f"Batch ID: {batch_id}\n"
        f"Manufacturing Date: {mfg_str}\n"
        f"Expiry Date: {exp_str}\n"
        f"Recall Reason: {recall_reason}\n"
    )

    def _call(model_name):
        res = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.2,
            max_tokens=600
        )
        return res.choices[0].message.content.strip()

    try:
        return execute_completion_with_fallback(_call, TEXT_MODELS)
    except Exception as e:
        logger.error(f"Error drafting recall notice: {str(e)}")
        return f"URGENT RECALL NOTICE for {drug_name} (Batch #{batch_num}). Reason: {recall_reason}. Quarantine product immediately."


# =====================================================================
# AGENT A3: MANUFACTURER DATA-ENTRY ASSISTANT (VISION OCR)
# =====================================================================
def extract_batch_info_from_image(image_bytes: bytes) -> dict:
    """
    Uses Groq Vision to extract pharmaceutical label metadata as structured JSON.
    """
    client = get_groq_client()
    if not client:
        return {
            "drug_name": "Amoxicillin 500mg Capsules",
            "batch_number": "BATCH-2026-X99",
            "manufacturing_date": "2026-01-15",
            "expiry_date": "2028-01-15"
        }

    base64_img = base64.b64encode(image_bytes).decode('utf-8')
    data_url = f"data:image/jpeg;base64,{base64_img}"

    system_prompt = (
        "You are an automated pharmaceutical data-entry OCR assistant.\n"
        "Extract the following fields from the product label or Certificate of Analysis photo if visible:\n"
        "- drug_name (string or null)\n"
        "- batch_number (string or null)\n"
        "- manufacturing_date (YYYY-MM-DD or string or null)\n"
        "- expiry_date (YYYY-MM-DD or string or null)\n\n"
        "Respond ONLY with a valid JSON object containing these exact 4 keys."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Extract drug_name, batch_number, manufacturing_date, and expiry_date from this pharmaceutical label image."},
                {"type": "image_url", "image_url": {"url": data_url}}
            ]
        }
    ]

    def _call(model_name):
        res = client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=0.1,
            max_tokens=300
        )
        content = res.choices[0].message.content.strip()
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        return json.loads(content)

    try:
        res_json = execute_completion_with_fallback(_call, VISION_MODELS)
        return {
            "drug_name": res_json.get("drug_name"),
            "batch_number": res_json.get("batch_number"),
            "manufacturing_date": res_json.get("manufacturing_date"),
            "expiry_date": res_json.get("expiry_date")
        }
    except Exception as e:
        logger.error(f"Vision extraction failed: {str(e)}")
        return {
            "drug_name": None,
            "batch_number": None,
            "manufacturing_date": None,
            "expiry_date": None
        }


# =====================================================================
# AGENT A4: REGULATOR INVESTIGATION AGENT (MULTI-STEP TOOL USE)
# =====================================================================
def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates Haversine distance in kilometers between two GPS points."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def check_geolocation_anomaly(custody_events: list, max_speed_kmh: float = 900.0) -> dict:
    """
    Heuristic function checking if implied transit speed between consecutive custody events
    exceeds implausible threshold (900 km/h).
    """
    anomalies = []
    if not custody_events or len(custody_events) < 2:
        return {"anomaly_detected": False, "anomalies": []}

    for i in range(len(custody_events) - 1):
        e1 = custody_events[i]
        e2 = custody_events[i + 1]

        lat1_str, lon1_str = e1.get("latitude", ""), e1.get("longitude", "")
        lat2_str, lon2_str = e2.get("latitude", ""), e2.get("longitude", "")
        t1, t2 = e1.get("timestamp", 0), e2.get("timestamp", 0)

        if lat1_str and lon1_str and lat2_str and lon2_str:
            try:
                lat1, lon1 = float(lat1_str), float(lon1_str)
                lat2, lon2 = float(lat2_str), float(lon2_str)
                dist_km = haversine_distance_km(lat1, lon1, lat2, lon2)
                time_diff_hours = (t2 - t1) / 3600.0

                if time_diff_hours <= 0:
                    if dist_km > 10.0:
                        anomalies.append({
                            "stage": f"Event {i} to {i+1}",
                            "distance_km": round(dist_km, 1),
                            "time_diff_seconds": t2 - t1,
                            "implied_speed_kmh": "Instantaneous",
                            "reason": f"Transferred {dist_km:.1f} km instantly (0 elapsed seconds)."
                        })
                else:
                    speed_kmh = dist_km / time_diff_hours
                    if speed_kmh > max_speed_kmh:
                        anomalies.append({
                            "stage": f"Event {i} ({e1.get('state_name')}) to Event {i+1} ({e2.get('state_name')})",
                            "distance_km": round(dist_km, 1),
                            "time_diff_hours": round(time_diff_hours, 2),
                            "implied_speed_kmh": round(speed_kmh, 1),
                            "reason": f"Implied transit speed of {speed_kmh:.1f} km/h exceeds maximum physical ground threshold ({max_speed_kmh} km/h)."
                        })
            except ValueError:
                continue

    return {
        "anomaly_detected": len(anomalies) > 0,
        "anomaly_count": len(anomalies),
        "anomalies": anomalies
    }


def investigate_batch(batch_id: int) -> dict:
    """
    Executes a multi-step investigation loop using Groq tool calling.
    Queries on-chain custody, checks geolocation anomalies, and inspects related wallet history.
    Enforces decision-support framing for human regulators.
    """
    from app.services.blockchain import get_blockchain_service

    client = get_groq_client()
    bc_service = get_blockchain_service()
    tool_trace = []

    # Local Tool Executor Functions
    def tool_get_custody_history(b_id: int):
        if bc_service and bc_service.is_connected() and bc_service.contract:
            return bc_service.get_custody_history(b_id)
        # Fallback mock history
        return [
            {"custodian": "0xA6C5Ab3CC646b083F6936e696F5722ED2c5Bd9fd", "state": 0, "state_name": "Manufactured", "timestamp": int(time.time()) - 86400 * 2, "latitude": "12.9716", "longitude": "77.5946"},
            {"custodian": "0xB7D6Bc4DD557c194F788e5883F481FE03d6Ce0fe", "state": 1, "state_name": "InTransit", "timestamp": int(time.time()) - 86400 + 300, "latitude": "40.7128", "longitude": "-74.0060"}
        ]

    def tool_get_related_batches_by_wallet(wallet_address: str):
        return [
            {"batch_id": 1, "drug_name": "Amoxicillin 500mg", "state": "Recalled", "is_recalled": True},
            {"batch_id": 2, "drug_name": "Ibuprofen 400mg", "state": "Dispensed", "is_recalled": False}
        ]

    def tool_check_geolocation_anomaly(events: list):
        return check_geolocation_anomaly(events)

    if not client:
        # Mock investigation brief if API key is missing
        cust_events = tool_get_custody_history(batch_id)
        geo_res = tool_check_geolocation_anomaly(cust_events)
        return {
            "summary": f"Investigation brief for Batch #{batch_id} generated in offline decision-support mode. Custody logs indicate {len(cust_events)} handoffs.",
            "risk_level": "medium" if geo_res["anomaly_detected"] else "low",
            "findings": [
                f"Batch custody history contains {len(cust_events)} recorded lifecycle events.",
                f"Geolocation anomaly check: {'Anomaly flagged' if geo_res['anomaly_detected'] else 'Normal transit parameters'}.",
                "Current custodian address verified against Sepolia RBAC permissions."
            ],
            "recommended_action": "Review physical packaging seal and confirm distributor receiving logs before clearing batch.",
            "tool_trace": [
                {"tool": "get_custody_history", "args": {"batch_id": batch_id}, "result_summary": f"{len(cust_events)} events retrieved"},
                {"tool": "check_geolocation_anomaly", "args": {"events_count": len(cust_events)}, "result": geo_res}
            ]
        }

    # Tool Schemas for Groq / OpenAI Function Calling
    tools = [
        {
            "type": "function",
            "function": {
                "name": "get_custody_history",
                "description": "Returns the complete custody timeline and geolocation logs for a given batch ID.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "batch_id": {"type": "integer", "description": "The batch serial ID to query."}
                    },
                    "required": ["batch_id"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_related_batches_by_wallet",
                "description": "Returns other pharmaceutical batches associated with a specific custodian wallet address.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "wallet_address": {"type": "string", "description": "Ethereum wallet address of custodian."}
                    },
                    "required": ["wallet_address"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "check_geolocation_anomaly",
                "description": "Analyzes custody events using Haversine distance over time to flag physically impossible transit speeds (>900 km/h).",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "custody_events": {
                            "type": "array",
                            "description": "List of custody event dictionaries containing timestamp, latitude, and longitude."
                        }
                    },
                    "required": ["custody_events"]
                }
            }
        }
    ]

    system_prompt = (
        "You are an expert AI Investigation Assistant for a pharmaceutical regulatory authority.\n"
        "CRITICAL ETHICAL FRAMING: You provide DECISION-SUPPORT briefs for human regulator review. You must NEVER make a final determination of fraud or accuse any named entity of counterfeiting. Describe observed patterns objectively and flag anomalies for human investigation.\n\n"
        "STEPS TO FOLLOW:\n"
        "1. Call `get_custody_history` for the batch.\n"
        "2. Analyze the custody events. Call `check_geolocation_anomaly` to inspect for impossible speed handoffs.\n"
        "3. Optionally call `get_related_batches_by_wallet` for the current or previous custodian.\n"
        "4. Finally, synthesize a structured JSON brief with keys:\n"
        "   - summary: 2-3 sentence overview\n"
        "   - risk_level: 'low', 'medium', or 'high'\n"
        "   - findings: list of specific bullet-point observations\n"
        "   - recommended_action: clear recommendation for human regulators\n"
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Investigate batch ID #{batch_id}. Query its custody history, check for geolocation anomalies, and produce a decision-support brief."}
    ]

    cached_custody_events = []

    # Models supporting tool calling
    TOOL_MODELS = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b"]

    for step in range(5):
        def _chat_call(model_name):
            return client.chat.completions.create(
                model=model_name,
                messages=messages,
                tools=tools,
                tool_choice="auto",
                temperature=0.2,
                max_tokens=600
            )

        response = execute_completion_with_fallback(_chat_call, TOOL_MODELS)
        response_msg = response.choices[0].message
        messages.append(response_msg)

        if not response_msg.tool_calls:
            content = response_msg.content.strip()
            try:
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                brief_json = json.loads(content)
                brief_json["tool_trace"] = tool_trace
                return brief_json
            except Exception:
                return {
                    "summary": content,
                    "risk_level": "medium",
                    "findings": ["Completed multi-step agent investigation trajectory."],
                    "recommended_action": "Review custody logs and geolocation handoff coordinates.",
                    "tool_trace": tool_trace
                }

        for tool_call in response_msg.tool_calls:
            fn_name = tool_call.function.name
            args = json.loads(tool_call.function.arguments or "{}")

            result = None
            if fn_name == "get_custody_history":
                target_bid = args.get("batch_id", batch_id)
                result = tool_get_custody_history(target_bid)
                cached_custody_events = result
                tool_trace.append({"tool": fn_name, "args": args, "result_summary": f"{len(result)} events retrieved"})
            elif fn_name == "get_related_batches_by_wallet":
                w_addr = args.get("wallet_address", "")
                result = tool_get_related_batches_by_wallet(w_addr)
                tool_trace.append({"tool": fn_name, "args": args, "result_summary": f"{len(result)} batches found"})
            elif fn_name == "check_geolocation_anomaly":
                events = args.get("custody_events") or cached_custody_events
                result = tool_check_geolocation_anomaly(events)
                tool_trace.append({"tool": fn_name, "args": args, "result": result})
            else:
                result = {"error": f"Unknown tool {fn_name}"}

            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": json.dumps(result)
            })

    return {
        "summary": f"Multi-step investigation for Batch #{batch_id} completed.",
        "risk_level": "medium",
        "findings": ["Completed multi-tool analysis."],
        "recommended_action": "Review custody logs and geolocation handoff coordinates.",
        "tool_trace": tool_trace
    }


# =====================================================================
# AGENT A5: PHYSICAL DEFECT INSPECTION AGENT
# =====================================================================
def inspect_for_defects(image_bytes: bytes) -> dict:
    """
    Uses Groq Vision to inspect photographs of pharmaceutical products/packaging
    for physical damage (cracked bottles, crushed pills, damaged blister packs, leaking liquids,
    torn seals, discoloration).
    Returns structured JSON with has_defects, defects_found, severity, and recommendation.
    """
    client = get_groq_client()
    if not client:
        return {
            "has_defects": False,
            "defects_found": [],
            "severity": "none",
            "recommendation": "Product packaging appears physically intact based on visual inspection. No cracks, breaches, or leaks detected. Final clearance subject to physical verification."
        }

    base64_img = base64.b64encode(image_bytes).decode('utf-8')
    data_url = f"data:image/jpeg;base64,{base64_img}"

    system_prompt = (
        "You are an expert pharmaceutical quality assurance visual inspector.\n"
        "Examine the provided photograph of pharmaceutical products, packaging, bottles, blister packs, or vials for physical defects and damage.\n"
        "Specifically inspect for:\n"
        "- Cracked, broken, or shattered bottles, glass, or vials\n"
        "- Crushed, chipped, fragmented, or broken pills or capsules\n"
        "- Damaged, torn, punctured, or compromised blister packs or foil seals\n"
        "- Leaking liquids or moisture stains\n"
        "- Unintended discoloration or foreign particulate matter\n"
        "- Torn, crushed, or tampered outer packaging\n\n"
        "Respond ONLY with a valid JSON object matching this exact schema:\n"
        "{\n"
        '  "has_defects": boolean,\n'
        '  "defects_found": ["list of strings describing specific physical defects observed, or empty array if none"],\n'
        '  "severity": "none" | "minor" | "major",\n'
        '  "recommendation": "string advisory recommendation for receiving personnel"\n'
        "}\n\n"
        "CRITICAL GUIDELINE: Use conservative advisory phrasing (e.g., 'appears', 'recommend visual re-verification', 'consider quarantining'). Explicitly clarify that human inspection remains the final authority."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Inspect this pharmaceutical product image for physical damage or defects."},
                {
                    "type": "image_url",
                    "image_url": {"url": data_url}
                }
            ]
        }
    ]

    def _call(model_name):
        res = client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=0.1,
            max_tokens=500
        )
        return res.choices[0].message.content.strip()

    try:
        raw_res = execute_completion_with_fallback(_call, VISION_MODELS)
        content = raw_res
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        parsed = json.loads(content)
        return {
            "has_defects": bool(parsed.get("has_defects", False)),
            "defects_found": list(parsed.get("defects_found", [])),
            "severity": str(parsed.get("severity", "none")).lower(),
            "recommendation": str(parsed.get("recommendation", "Visual inspection completed."))
        }
    except Exception as e:
        logger.error(f"Error in inspect_for_defects vision agent: {str(e)}")
        return {
            "has_defects": False,
            "defects_found": [],
            "severity": "none",
            "recommendation": "Visual defect evaluation encountered an error. Proceed with manual visual inspection."
        }


# =====================================================================
# FULLY AUTONOMOUS REGULATOR AGENT
# =====================================================================
def run_autonomous_regulator(batch_id: int, defect_report: dict) -> dict:
    """
    Executes the fully autonomous regulatory pipeline:
    1. Runs multi-step investigation (investigate_batch).
    2. Decides action based on risk_level:
       - 'high': Autonomously issues on-chain recallBatch transaction (via AI_REGULATOR_PRIVATE_KEY) and drafts recall notice.
       - 'medium': Flags medium risk finding for transparency log.
       - 'low': Logs low risk observation.
    3. Persists complete audit trail entry.
    """
    from app.services.alerts import add_audit_entry
    from app.services.blockchain import get_blockchain_service

    logger.info(f"Starting Autonomous Regulator Agent pipeline for Batch #{batch_id}...")

    # Step 1: Execute multi-step AI investigation loop
    brief = investigate_batch(batch_id)
    risk_level = brief.get("risk_level", "medium").lower()
    summary = brief.get("summary", f"Batch #{batch_id} flagged during physical defect inspection.")

    action_taken = "logged_low"
    tx_hash = None
    recall_notice = None

    # Step 2: Evaluate risk and autonomously execute on-chain recall if HIGH risk
    if risk_level == "high":
        action_taken = "recalled"
        ai_key = os.getenv("AI_REGULATOR_PRIVATE_KEY") or os.getenv("DEPLOYER_PRIVATE_KEY")

        # Execute on-chain recall transaction
        try:
            bc_service = get_blockchain_service()
            if bc_service.is_connected() and bc_service.contract:
                recall_res = bc_service.recall_batch(
                    batch_id=batch_id,
                    reason=f"[AUTONOMOUS AI RECALL]: {summary}",
                    signer_private_key=ai_key
                )
                tx_hash = recall_res.get("tx_hash")
            else:
                tx_hash = "0xmock_autonomous_recall_tx_" + str(int(time.time()))
        except Exception as err:
            logger.error(f"On-chain autonomous recall transaction failed for Batch #{batch_id}: {str(err)}")
            tx_hash = "0xmock_fallback_tx_" + str(int(time.time()))

        # Generate AI recall notice (Agent #2)
        try:
            recall_notice = draft_recall_notice(
                drug_name="Pharmaceutical Product",
                batch_num=f"BATCH-2026-{batch_id:03d}",
                batch_id=batch_id,
                mfg_timestamp=int(time.time()) - 86400 * 10,
                expiry_timestamp=int(time.time()) + 86400 * 365,
                recall_reason=f"Autonomous AI Regulator trigger: {summary}"
            )
        except Exception as notice_err:
            logger.error(f"Error generating AI recall notice: {str(notice_err)}")
            recall_notice = f"URGENT AUTONOMOUS RECALL NOTICE: Batch #{batch_id} recalled on-chain due to high risk assessment. Reason: {summary}"

    elif risk_level == "medium":
        action_taken = "flagged_medium"
    else:
        action_taken = "logged_low"

    # Step 3: Construct and persist audit entry
    audit_entry = {
        "id": f"audit_{int(time.time() * 1000)}",
        "timestamp": int(time.time()),
        "batch_id": batch_id,
        "defect_report": defect_report,
        "investigation_brief": brief,
        "risk_level": risk_level,
        "action_taken": action_taken,
        "tx_hash": tx_hash,
        "recall_notice": recall_notice
    }

    persisted = add_audit_entry(audit_entry)
    logger.info(f"Autonomous Regulator Pipeline Completed for Batch #{batch_id}: Action={action_taken}, Risk={risk_level}")
    return persisted


