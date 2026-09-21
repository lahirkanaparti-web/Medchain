import os
import json
import time
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

ALERTS_FILE_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "alerts.json")


def _ensure_alerts_file():
    """Ensures data directory and alerts.json file exist."""
    data_dir = os.path.dirname(ALERTS_FILE_PATH)
    if not os.path.exists(data_dir):
        os.makedirs(data_dir, exist_ok=True)
    if not os.path.exists(ALERTS_FILE_PATH):
        with open(ALERTS_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump([], f, indent=2)


def get_audit_log(
    risk_level: Optional[str] = None,
    action_taken: Optional[str] = None,
    batch_id: Optional[int] = None
) -> List[dict]:
    """
    Returns audit log entries sorted by timestamp newest first,
    filtered by optional risk_level, action_taken, or batch_id.
    """
    _ensure_alerts_file()
    try:
        with open(ALERTS_FILE_PATH, "r", encoding="utf-8") as f:
            entries = json.load(f)

        # Reverse to get newest first
        entries = sorted(entries, key=lambda x: x.get("timestamp", 0), reverse=True)

        filtered = []
        for e in entries:
            if risk_level and e.get("risk_level", "").lower() != risk_level.lower():
                continue
            if action_taken and e.get("action_taken", "").lower() != action_taken.lower():
                continue
            if batch_id is not None and int(e.get("batch_id", -1)) != int(batch_id):
                continue
            filtered.append(e)

        return filtered
    except Exception as err:
        logger.error(f"Error reading audit log file: {str(err)}")
        return []


def add_audit_entry(entry: dict) -> dict:
    """
    Appends a new audit log entry to alerts.json and returns it.
    """
    _ensure_alerts_file()
    try:
        entries = get_audit_log()  # Existing entries

        if "id" not in entry:
            entry["id"] = f"audit_{int(time.time() * 1000)}"
        if "timestamp" not in entry:
            entry["timestamp"] = int(time.time())

        # Append new entry at the beginning
        entries.insert(0, entry)

        with open(ALERTS_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(entries, f, indent=2)

        logger.info(f"Audit log entry persisted: ID={entry['id']} Batch=#{entry.get('batch_id')} Action={entry.get('action_taken')}")
        return entry
    except Exception as err:
        logger.error(f"Error persisting audit log entry: {str(err)}")
        return entry
