import logging
from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException

from app.models.schemas import AuditLogEntryResponse
from app.services.alerts import get_audit_log

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/regulator", tags=["Regulator Audit Log"])


@router.get("/audit-log", response_model=List[AuditLogEntryResponse])
@router.get("/alerts", response_model=List[AuditLogEntryResponse])
async def fetch_audit_log(
    risk_level: Optional[str] = Query(None, description="Filter by risk level ('high', 'medium', 'low')"),
    action_taken: Optional[str] = Query(None, description="Filter by action ('recalled', 'flagged_medium', 'logged_low', 'passive_alert')"),
    batch_id: Optional[int] = Query(None, description="Filter by batch ID")
):
    """
    Returns the autonomous regulatory audit trail history, newest first.
    Exposes filters for risk level, action taken, and batch ID.
    """
    try:
        entries = get_audit_log(risk_level=risk_level, action_taken=action_taken, batch_id=batch_id)
        return entries
    except Exception as e:
        logger.error(f"Error fetching regulator audit log: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch audit log: {str(e)}")
