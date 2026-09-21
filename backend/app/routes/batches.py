from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response, Query, BackgroundTasks
from typing import Optional, List
import time
import io
import csv
import logging
from datetime import datetime

from app.models.schemas import (
    BatchCreateResponse,
    BatchTransferRequest,
    BatchTransferResponse,
    BatchDetailResponse,
    BatchRecallRequest,
    BatchRecallResponse,
    CustodyEventSchema,
    BatchInfoExtractionResponse,
    InvestigationBriefResponse,
    DefectInspectionResponse,
)
from app.services.ipfs import upload_to_ipfs, get_ipfs_url
from app.services.blockchain import get_blockchain_service
from app.services.qr import generate_qr
from app.services.agents import (
    draft_recall_notice,
    extract_batch_info_from_image,
    investigate_batch,
    inspect_for_defects,
    run_autonomous_regulator,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/batches", tags=["Batches"])

# In-memory storage for drafted recall notices
_RECALL_NOTICES = {}



def generate_pdf_report(batch_info: dict, custody_history: list) -> bytes:
    """
    Generates a professional PDF batch verification and audit report using ReportLab.
    """
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#475569'),
        spaceAfter=15
    )
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=12,
        spaceAfter=8
    )
    cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#334155')
    )
    cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.HexColor('#0F172A')
    )

    story = []

    # Title Banner
    story.append(Paragraph("MedChain Pharmaceutical Audit Report", title_style))
    story.append(Paragraph(f"Generated on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} • Blockchain-Verified Audit Trail", subtitle_style))
    story.append(Spacer(1, 10))

    # Recall Warning Banner if applicable
    is_recalled = batch_info.get("is_recalled", False)
    if is_recalled:
        recall_text = f"<b>⚠️ BATCH RECALLED BY REGULATOR</b><br/>Reason: {batch_info.get('recall_reason', 'N/A')}"
        recall_style = ParagraphStyle(
            'RecallBanner',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=11,
            textColor=colors.HexColor('#991B1B'),
            backColor=colors.HexColor('#FEE2E2'),
            borderColor=colors.HexColor('#EF4444'),
            borderWidth=1,
            borderPadding=8,
            spaceAfter=15
        )
        story.append(Paragraph(recall_text, recall_style))
        story.append(Spacer(1, 10))

    # Metadata Table
    story.append(Paragraph("Batch Details", section_style))
    
    mfg_str = datetime.utcfromtimestamp(batch_info.get("mfg_date", 0)).strftime("%Y-%m-%d")
    exp_str = datetime.utcfromtimestamp(batch_info.get("expiry_date", 0)).strftime("%Y-%m-%d")

    meta_data = [
        [Paragraph("Batch ID", cell_bold), Paragraph(str(batch_info.get("batch_id", "")), cell_style), Paragraph("State", cell_bold), Paragraph(str(batch_info.get("state_name", "")), cell_style)],
        [Paragraph("Drug Name", cell_bold), Paragraph(str(batch_info.get("drug_name", "")), cell_style), Paragraph("Batch Number", cell_bold), Paragraph(str(batch_info.get("batch_number", "")), cell_style)],
        [Paragraph("Manufacturing Date", cell_bold), Paragraph(mfg_str, cell_style), Paragraph("Expiration Date", cell_bold), Paragraph(exp_str, cell_style)],
        [Paragraph("Current Custodian", cell_bold), Paragraph(str(batch_info.get("current_custodian", "")), cell_style), Paragraph("IPFS Hash", cell_bold), Paragraph(str(batch_info.get("ipfs_image_hash", "")[:24] + "..."), cell_style)],
    ]

    t_meta = Table(meta_data, colWidths=[110, 160, 110, 160])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 15))

    # Custody History Table
    story.append(Paragraph("Custody Chain & Geolocation Log", section_style))

    hist_data = [
        [Paragraph("Stage", cell_bold), Paragraph("Custodian Address", cell_bold), Paragraph("Timestamp (UTC)", cell_bold), Paragraph("Coordinates", cell_bold)]
    ]

    for h in custody_history:
        ts_str = datetime.utcfromtimestamp(h.get("timestamp", 0)).strftime("%Y-%m-%d %H:%M:%S")
        lat = h.get("latitude", "")
        lon = h.get("longitude", "")
        coords = f"{lat}, {lon}" if (lat and lon) else "N/A"

        hist_data.append([
            Paragraph(str(h.get("state_name", "")), cell_style),
            Paragraph(str(h.get("custodian", "")), cell_style),
            Paragraph(ts_str, cell_style),
            Paragraph(coords, cell_style),
        ])

    t_hist = Table(hist_data, colWidths=[100, 210, 120, 110])
    t_hist.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_hist)

    # Footer note
    story.append(Spacer(1, 20))
    footer_text = "MedChain Immutable Blockchain Ledger • Powered by Sepolia Ethereum & Decentralized IPFS Storage"
    story.append(Paragraph(footer_text, subtitle_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


@router.post("", response_model=BatchCreateResponse)
async def create_batch(
    drugName: str = Form(...),
    batchNumber: str = Form(...),
    mfgDate: int = Form(...),
    expiryDate: int = Form(...),
    images: List[UploadFile] = File(None),
    image: Optional[UploadFile] = File(None)
):
    """
    Creates a new batch accepting 1-3 reference images:
    1. Uploads reference images to IPFS via Pinata.
    2. Invokes smart contract `createBatch`.
    3. Invokes smart contract `linkImageHashes`.
    """
    try:
        # Normalize uploaded images list (accepting 'images' multi-upload or legacy single 'image')
        upload_files = []
        if images:
            upload_files.extend(images)
        if image:
            upload_files.append(image)

        if not upload_files:
            raise HTTPException(status_code=400, detail="At least one reference image file must be uploaded.")

        if len(upload_files) > 3:
            raise HTTPException(status_code=400, detail="Maximum 3 reference images allowed per batch.")

        ipfs_hashes = []
        for idx, f in enumerate(upload_files):
            content = await f.read()
            fname = f.filename or f"reference_{idx + 1}.jpg"
            cid = upload_to_ipfs(content, fname)
            ipfs_hashes.append(cid)

        primary_hash = ipfs_hashes[0]
        primary_url = get_ipfs_url(primary_hash)

        bc_service = get_blockchain_service()
        
        if not bc_service.is_connected() or not bc_service.contract:
            logger.warning("Blockchain node not connected. Returning mock batch creation.")
            return BatchCreateResponse(
                batchId=101,
                txHash="0xmocktxhash1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
                ipfsHash=primary_hash,
                ipfsHashes=ipfs_hashes,
                ipfsUrl=primary_url,
                drugName=drugName,
                batchNumber=batchNumber,
                mfgDate=mfgDate,
                expiryDate=expiryDate,
                currentCustodian="0xA6C5Ab3CC646b083F6936e696F5722ED2c5Bd9fd",
                state=0,
                stateName="Manufactured"
            )

        bc_res = bc_service.create_batch(drugName, batchNumber, mfgDate, expiryDate)
        batch_id = bc_res["batch_id"]
        create_tx = bc_res["tx_hash"]

        # Link 1-3 image hashes on smart contract
        bc_service.link_image_hashes(batch_id, ipfs_hashes)

        batch_info = bc_service.get_batch(batch_id)

        return BatchCreateResponse(
            batchId=batch_id,
            txHash=create_tx,
            ipfsHash=primary_hash,
            ipfsHashes=batch_info.get("ipfs_image_hashes", ipfs_hashes),
            ipfsUrl=primary_url,
            drugName=batch_info["drug_name"],
            batchNumber=batch_info["batch_number"],
            mfgDate=batch_info["mfg_date"],
            expiryDate=batch_info["expiry_date"],
            currentCustodian=batch_info["current_custodian"],
            state=batch_info["state"],
            stateName=batch_info["state_name"]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating batch: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create batch: {str(e)}")


@router.post("/{batch_id}/transfer", response_model=BatchTransferResponse)
async def transfer_custody(batch_id: int, req: BatchTransferRequest):
    """
    Transfers batch custody to `toAddress` with optional geolocation coordinates.
    """
    try:
        bc_service = get_blockchain_service()

        if not bc_service.is_connected() or not bc_service.contract:
            state_names = ["Manufactured", "InTransit", "AtDistributor", "AtPharmacy", "Dispensed", "Recalled"]
            return BatchTransferResponse(
                batchId=batch_id,
                txHash="0xmocktransfertxhash1234567890abcdef1234567890abcdef1234567890abcdef",
                newState=req.newState,
                newStateName=state_names[req.newState] if req.newState < len(state_names) else str(req.newState),
                newCustodian=req.toAddress,
                latitude=req.latitude or "",
                longitude=req.longitude or ""
            )

        res = bc_service.transfer_custody(batch_id, req.toAddress, req.newState, req.latitude or "", req.longitude or "")
        return BatchTransferResponse(
            batchId=batch_id,
            txHash=res["tx_hash"],
            newState=res["new_state"],
            newStateName=res["new_state_name"],
            newCustodian=res["new_custodian"],
            latitude=res.get("latitude", ""),
            longitude=res.get("longitude", "")
        )
    except Exception as e:
        logger.error(f"Error transferring custody for batch {batch_id}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Transfer custody failed: {str(e)}")


@router.post("/{batch_id}/recall", response_model=BatchRecallResponse)
async def recall_batch(batch_id: int, req: BatchRecallRequest):
    """
    Recalls a batch due to safety or quality concerns (REGULATOR_ROLE).
    Invokes Groq AI Agent `draft_recall_notice` to generate formal recall announcement.
    """
    try:
        bc_service = get_blockchain_service()
        tx_hash = "0xmockrecalltxhash1234567890abcdef1234567890abcdef1234567890abcdef"
        batch_info = {"batch_id": batch_id, "drug_name": "Amoxicillin 500mg", "batch_number": f"BATCH-2026-{batch_id:03d}"}

        if bc_service.is_connected() and bc_service.contract:
            res = bc_service.recall_batch(batch_id, req.reason)
            tx_hash = res["tx_hash"]
            try:
                batch_info = bc_service.get_batch(batch_id)
            except Exception:
                pass

        # Call Agent A2: Recall Notice Drafting Agent
        notice_text = draft_recall_notice(batch_info, req.reason)
        _RECALL_NOTICES[batch_id] = notice_text

        return BatchRecallResponse(
            batchId=batch_id,
            txHash=tx_hash,
            reason=req.reason,
            recalled=True,
            recallNotice=notice_text
        )
    except Exception as e:
        logger.error(f"Error recalling batch {batch_id}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Batch recall failed: {str(e)}")


@router.get("/{batch_id}", response_model=BatchDetailResponse)
async def get_batch(batch_id: int):
    """
    Fetches full batch details, multiple IPFS image hashes, recall status, custody history with geolocation,
    and stored drafted recall notice if recalled.
    """
    try:
        bc_service = get_blockchain_service()

        if not bc_service.is_connected() or not bc_service.contract:
            return BatchDetailResponse(
                batchId=batch_id,
                drugName="Amoxicillin 500mg",
                batchNumber=f"BATCH-2026-{batch_id:03d}",
                mfgDate=int(time.time()) - 86400 * 5,
                expiryDate=int(time.time()) + 86400 * 365,
                ipfsImageHash="QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
                ipfsImageHashes=["QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"],
                ipfsImageUrl=get_ipfs_url("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"),
                currentCustodian="0xA6C5Ab3CC646b083F6936e696F5722ED2c5Bd9fd",
                state=0,
                stateName="Manufactured",
                isRecalled=False,
                recallReason="",
                recallTimestamp=0,
                recallNotice=_RECALL_NOTICES.get(batch_id, ""),
                custodyHistory=[
                    CustodyEventSchema(
                        custodian="0xA6C5Ab3CC646b083F6936e696F5722ED2c5Bd9fd",
                        state=0,
                        stateName="Manufactured",
                        timestamp=int(time.time()) - 86400 * 5,
                        latitude="12.9716",
                        longitude="77.5946"
                    )
                ]
            )

        batch_info = bc_service.get_batch(batch_id)
        history_raw = bc_service.get_custody_history(batch_id)

        history = [
            CustodyEventSchema(
                custodian=h["custodian"],
                state=h["state"],
                stateName=h["state_name"],
                timestamp=h["timestamp"],
                latitude=h.get("latitude", ""),
                longitude=h.get("longitude", "")
            )
            for h in history_raw
        ]

        primary_hash = batch_info.get("ipfs_image_hash", "")
        ipfs_url = get_ipfs_url(primary_hash)

        return BatchDetailResponse(
            batchId=batch_info["batch_id"],
            drugName=batch_info["drug_name"],
            batchNumber=batch_info["batch_number"],
            mfgDate=batch_info["mfg_date"],
            expiryDate=batch_info["expiry_date"],
            ipfsImageHash=primary_hash,
            ipfsImageHashes=batch_info.get("ipfs_image_hashes", [primary_hash]),
            ipfsImageUrl=ipfs_url,
            currentCustodian=batch_info["current_custodian"],
            state=batch_info["state"],
            stateName=batch_info["state_name"],
            isRecalled=batch_info.get("is_recalled", False),
            recallReason=batch_info.get("recall_reason", ""),
            recallTimestamp=batch_info.get("recall_timestamp", 0),
            recallNotice=_RECALL_NOTICES.get(batch_id, ""),
            custodyHistory=history
        )
    except Exception as e:
        logger.error(f"Error fetching batch {batch_id}: {str(e)}")
        raise HTTPException(status_code=404 if "does not exist" in str(e) else 500, detail=str(e))


@router.post("/extract-batch-info", response_model=BatchInfoExtractionResponse)
@router.post("/extract-info", response_model=BatchInfoExtractionResponse)
async def extract_batch_info(image: UploadFile = File(...)):
    """
    Agent A3: Manufacturer Data-Entry Assistant (Vision OCR).
    Uses Groq Vision (llama-3.2-90b-vision-preview) to extract label fields.
    """
    try:
        content = await image.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded label image is empty.")
        extracted = extract_batch_info_from_image(content)
        return BatchInfoExtractionResponse(**extracted)
    except Exception as e:
        logger.error(f"Error extracting batch info from image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Image data extraction failed: {str(e)}")


@router.post("/{batch_id}/investigate", response_model=InvestigationBriefResponse)
async def investigate_batch_route(batch_id: int):
    """
    Agent A4: Regulator Multi-Step Investigation Agent.
    Executes tool-calling loop (custody, geolocation anomalies, wallet history)
    and synthesizes a decision-support brief for human regulators.
    """
    try:
        res = investigate_batch(batch_id)
        return InvestigationBriefResponse(
            summary=res.get("summary", ""),
            risk_level=res.get("risk_level", "medium"),
            findings=res.get("findings", []),
            recommended_action=res.get("recommended_action", ""),
            tool_trace=res.get("tool_trace", [])
        )
    except Exception as e:
        logger.error(f"Error running regulator investigation agent for batch {batch_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Investigation agent failed: {str(e)}")


@router.post("/{batch_id}/inspect-defects", response_model=DefectInspectionResponse)
async def inspect_defects_route(batch_id: int, background_tasks: BackgroundTasks, image: UploadFile = File(...)):
    """
    Agent A5: Physical Defect Inspection Agent.
    Inspects photographs of product/packaging for physical defects (cracks, leaks, crushed items, torn seals).
    If severity is "major" and AUTONOMOUS_REGULATOR_ENABLED is true, triggers run_autonomous_regulator as a background task.
    If severity is "major" and AUTONOMOUS_REGULATOR_ENABLED is false, logs a passive alert entry instead.
    """
    import os
    try:
        content = await image.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded photo for defect inspection is empty.")
        res = inspect_for_defects(content)

        severity = str(res.get("severity", "none")).lower()
        autonomous_enabled = str(os.getenv("AUTONOMOUS_REGULATOR_ENABLED", "true")).lower() in ("true", "1", "yes")

        if severity == "major":
            if autonomous_enabled:
                logger.info(f"Major severity defect flagged for Batch #{batch_id}. Triggering Autonomous Regulator pipeline in background...")
                background_tasks.add_task(run_autonomous_regulator, batch_id, res)
            else:
                logger.info(f"Major severity defect flagged for Batch #{batch_id}. AUTONOMOUS_REGULATOR_ENABLED=false: Logging passive alert.")
                from app.services.alerts import add_audit_entry
                add_audit_entry({
                    "batch_id": batch_id,
                    "defect_report": res,
                    "investigation_brief": {"summary": "Autonomous pipeline disabled via kill switch. Passive alert recorded."},
                    "risk_level": "none",
                    "action_taken": "passive_alert",
                    "tx_hash": None,
                    "recall_notice": None
                })

        return DefectInspectionResponse(
            has_defects=res.get("has_defects", False),
            defects_found=res.get("defects_found", []),
            severity=res.get("severity", "none"),
            recommendation=res.get("recommendation", "")
        )
    except Exception as e:
        logger.error(f"Error inspecting defects for batch {batch_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Defect inspection failed: {str(e)}")





@router.get("/{batch_id}/export")
async def export_batch(batch_id: int, format: str = Query("csv", pattern="^(csv|pdf)$")):
    """
    Downloads batch audit record in CSV or PDF format.
    """
    try:
        bc_service = get_blockchain_service()
        if bc_service.is_connected() and bc_service.contract:
            try:
                batch_info = bc_service.get_batch(batch_id)
                history_raw = bc_service.get_custody_history(batch_id)
            except Exception as e:
                if "does not exist" in str(e):
                    raise HTTPException(status_code=404, detail=f"Batch {batch_id} does not exist on chain.")
                raise e
        else:
            batch_info = {
                "batch_id": batch_id,
                "drug_name": "Amoxicillin 500mg",
                "batch_number": f"BATCH-2026-{batch_id:03d}",
                "mfg_date": int(time.time()) - 86400 * 5,
                "expiry_date": int(time.time()) + 86400 * 365,
                "ipfs_image_hash": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
                "current_custodian": "0xA6C5Ab3CC646b083F6936e696F5722ED2c5Bd9fd",
                "state": 0,
                "stateName": "Manufactured",
                "is_recalled": False,
                "recall_reason": ""
            }
            history_raw = [{
                "custodian": "0xA6C5Ab3CC646b083F6936e696F5722ED2c5Bd9fd",
                "state": 0,
                "state_name": "Manufactured",
                "timestamp": int(time.time()) - 86400 * 5,
                "latitude": "12.9716",
                "longitude": "77.5946"
            }]

        filename_base = f"medchain_batch_{batch_id}_export"

        if format == "pdf":
            pdf_bytes = generate_pdf_report(batch_info, history_raw)
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename={filename_base}.pdf"}
            )
        else:
            # CSV format using built-in csv module
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Header metadata
            writer.writerow(["=== MEDCHAIN BATCH AUDIT REPORT ==="])
            writer.writerow(["Batch ID", batch_info.get("batch_id", batch_id)])
            writer.writerow(["Drug Name", batch_info.get("drug_name", "")])
            writer.writerow(["Batch Number", batch_info.get("batch_number", "")])
            writer.writerow(["Manufacturing Date (Timestamp)", batch_info.get("mfg_date", 0)])
            writer.writerow(["Expiry Date (Timestamp)", batch_info.get("expiry_date", 0)])
            writer.writerow(["Current Custodian", batch_info.get("current_custodian", "")])
            writer.writerow(["State", batch_info.get("state_name", "")])
            writer.writerow(["Recalled", "YES" if batch_info.get("is_recalled") else "NO"])
            writer.writerow(["Recall Reason", batch_info.get("recall_reason", "")])
            writer.writerow([])
            writer.writerow(["=== CUSTODY HISTORY & GEOLOCATION LOG ==="])
            writer.writerow(["State", "Custodian Address", "Timestamp", "Latitude", "Longitude"])

            for h in history_raw:
                writer.writerow([
                    h.get("state_name", ""),
                    h.get("custodian", ""),
                    h.get("timestamp", ""),
                    h.get("latitude", ""),
                    h.get("longitude", "")
                ])

            csv_content = output.getvalue()
            return Response(
                content=csv_content,
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={filename_base}.csv"}
            )
    except Exception as e:
        logger.error(f"Error exporting batch {batch_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.get("/{batch_id}/qr")
async def get_batch_qr(batch_id: int):
    """
    Generates and returns the PNG QR code image for a given batch.
    """
    try:
        png_bytes = generate_qr(batch_id)
        return Response(content=png_bytes, media_type="image/png")
    except Exception as e:
        logger.error(f"Error generating QR code for batch {batch_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate QR code: {str(e)}")
