from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response
from typing import Optional
import time
import requests
import logging

from app.models.schemas import (
    BatchCreateResponse,
    BatchTransferRequest,
    BatchTransferResponse,
    BatchDetailResponse,
    CustodyEventSchema,
)
from app.services.ipfs import upload_to_ipfs, get_ipfs_url
from app.services.blockchain import get_blockchain_service
from app.services.qr import generate_qr

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/batches", tags=["Batches"])


@router.post("", response_model=BatchCreateResponse)
async def create_batch(
    drugName: str = Form(...),
    batchNumber: str = Form(...),
    mfgDate: int = Form(...),
    expiryDate: int = Form(...),
    image: UploadFile = File(...)
):
    """
    Creates a new batch:
    1. Uploads reference image to IPFS via Pinata.
    2. Invokes smart contract `createBatch`.
    3. Invokes smart contract `linkImageHash`.
    """
    try:
        # Read uploaded image bytes
        image_bytes = await image.read()
        filename = image.filename or "reference.jpg"

        # 1. Upload reference image to IPFS
        ipfs_hash = upload_to_ipfs(image_bytes, filename)
        ipfs_url = get_ipfs_url(ipfs_hash)

        # 2. Blockchain transactions
        bc_service = get_blockchain_service()
        
        # If contract is not connected (e.g. mock mode during offline testing)
        if not bc_service.is_connected() or not bc_service.contract:
            logger.warning("Blockchain node not connected. Returning mock batch creation.")
            return BatchCreateResponse(
                batchId=101,
                txHash="0xmocktxhash1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
                ipfsHash=ipfs_hash,
                ipfsUrl=ipfs_url,
                drugName=drugName,
                batchNumber=batchNumber,
                mfgDate=mfgDate,
                expiryDate=expiryDate,
                currentCustodian="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
                state=0,
                stateName="Manufactured"
            )

        # Execute createBatch transaction
        bc_res = bc_service.create_batch(drugName, batchNumber, mfgDate, expiryDate)
        batch_id = bc_res["batch_id"]
        create_tx = bc_res["tx_hash"]

        # Link IPFS hash on-chain
        bc_service.link_image_hash(batch_id, ipfs_hash)

        batch_info = bc_service.get_batch(batch_id)

        return BatchCreateResponse(
            batchId=batch_id,
            txHash=create_tx,
            ipfsHash=ipfs_hash,
            ipfsUrl=ipfs_url,
            drugName=batch_info["drug_name"],
            batchNumber=batch_info["batch_number"],
            mfgDate=batch_info["mfg_date"],
            expiryDate=batch_info["expiry_date"],
            currentCustodian=batch_info["current_custodian"],
            state=batch_info["state"],
            stateName=batch_info["state_name"]
        )
    except Exception as e:
        logger.error(f"Error creating batch: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create batch: {str(e)}")


@router.post("/{batch_id}/transfer", response_model=BatchTransferResponse)
async def transfer_custody(batch_id: int, req: BatchTransferRequest):
    """
    Transfers batch custody to `toAddress` and advances `newState` sequentially on-chain.
    """
    try:
        bc_service = get_blockchain_service()

        if not bc_service.is_connected() or not bc_service.contract:
            state_names = ["Manufactured", "InTransit", "AtDistributor", "AtPharmacy", "Dispensed"]
            return BatchTransferResponse(
                batchId=batch_id,
                txHash="0xmocktransfertxhash1234567890abcdef1234567890abcdef1234567890abcdef",
                newState=req.newState,
                newStateName=state_names[req.newState] if req.newState < len(state_names) else str(req.newState),
                newCustodian=req.toAddress
            )

        res = bc_service.transfer_custody(batch_id, req.toAddress, req.newState)
        return BatchTransferResponse(
            batchId=batch_id,
            txHash=res["tx_hash"],
            newState=res["new_state"],
            newStateName=res["new_state_name"],
            newCustodian=res["new_custodian"]
        )
    except Exception as e:
        logger.error(f"Error transferring custody for batch {batch_id}: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Transfer custody failed: {str(e)}")


@router.get("/{batch_id}", response_model=BatchDetailResponse)
async def get_batch(batch_id: int):
    """
    Fetches full batch details and complete on-chain custody history.
    """
    try:
        bc_service = get_blockchain_service()

        if not bc_service.is_connected() or not bc_service.contract:
            # Fallback response for offline testing
            return BatchDetailResponse(
                batchId=batch_id,
                drugName="Amoxicillin 500mg",
                batchNumber=f"BATCH-2026-{batch_id:03d}",
                mfgDate=int(time.time()) - 86400 * 5,
                expiryDate=int(time.time()) + 86400 * 365,
                ipfsImageHash="QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
                ipfsImageUrl=get_ipfs_url("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"),
                currentCustodian="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                state=0,
                stateName="Manufactured",
                custodyHistory=[
                    CustodyEventSchema(
                        custodian="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                        state=0,
                        stateName="Manufactured",
                        timestamp=int(time.time()) - 86400 * 5
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
                timestamp=h["timestamp"]
            )
            for h in history_raw
        ]

        ipfs_url = get_ipfs_url(batch_info["ipfs_image_hash"])

        return BatchDetailResponse(
            batchId=batch_info["batch_id"],
            drugName=batch_info["drug_name"],
            batchNumber=batch_info["batch_number"],
            mfgDate=batch_info["mfg_date"],
            expiryDate=batch_info["expiry_date"],
            ipfsImageHash=batch_info["ipfs_image_hash"],
            ipfsImageUrl=ipfs_url,
            currentCustodian=batch_info["current_custodian"],
            state=batch_info["state"],
            stateName=batch_info["state_name"],
            custodyHistory=history
        )
    except Exception as e:
        logger.error(f"Error fetching batch {batch_id}: {str(e)}")
        raise HTTPException(status_code=444 if "does not exist" in str(e) else 500, detail=str(e))


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
