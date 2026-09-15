from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
import logging
import time

from app.models.schemas import VerifyResponse, CustodyEventSchema
from app.services.ipfs import get_ipfs_url, fetch_ipfs_file
from app.services.blockchain import get_blockchain_service
from app.services.vision import verify_authenticity_multi

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/batches", tags=["Verification"])

# Limiter instance for router level rate-limiting
limiter = Limiter(key_func=get_remote_address)


@router.post("/{batch_id}/verify", response_model=VerifyResponse)
@limiter.limit("10/minute")
async def verify_product(request: Request, batch_id: int, image: UploadFile = File(...)):
    """
    Verifies a live physical product photo against ALL IPFS reference images of the batch:
    1. Reads uploaded live photo bytes.
    2. Fetches on-chain batch record to get ALL IPFS reference CIDs (1-3 images).
    3. Downloads raw reference image bytes from IPFS via `fetch_ipfs_file`.
    4. Computes live distance against EACH reference image and uses the SMALLEST distance (best match).
    5. Returns 3-way tiered authenticity verdict ('genuine', 'needs_review', 'suspect').
    """
    try:
        live_image_bytes = await image.read()
        if not live_image_bytes:
            raise HTTPException(status_code=400, detail="Uploaded live image file is empty.")

        bc_service = get_blockchain_service()
        ipfs_url = ""
        custody_history = []
        ref_images_bytes = []

        if bc_service.is_connected() and bc_service.contract:
            try:
                batch_info = bc_service.get_batch(batch_id)
            except Exception as e:
                err_msg = str(e).lower()
                if "does not exist" in err_msg or "reverted" in err_msg:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Batch #{batch_id} does not exist on the Sepolia blockchain ledger. Please verify the batch serial number."
                    )
                raise HTTPException(
                    status_code=400,
                    detail=f"Blockchain query failed for batch #{batch_id}: {str(e)}"
                )

            ipfs_hashes = [h for h in batch_info.get("ipfs_image_hashes", []) if h]
            if not ipfs_hashes and batch_info.get("ipfs_image_hash"):
                ipfs_hashes = [batch_info.get("ipfs_image_hash")]

            if not ipfs_hashes:
                raise HTTPException(
                    status_code=404,
                    detail=f"Batch #{batch_id} exists on blockchain, but has no reference packaging images linked on IPFS."
                )

            primary_hash = ipfs_hashes[0]
            ipfs_url = get_ipfs_url(primary_hash)

            logger.info(f"Batch #{batch_id} retrieved from blockchain. Fetching {len(ipfs_hashes)} reference image(s) from Pinata IPFS...")
            for cid in ipfs_hashes:
                content = fetch_ipfs_file(cid)
                if content:
                    ref_images_bytes.append(content)

            if not ref_images_bytes:
                raise HTTPException(
                    status_code=502,
                    detail=f"Failed to download reference packaging images from Pinata IPFS (CIDs: {', '.join(ipfs_hashes)}). Please verify network and IPFS gateway connectivity."
                )

            raw_history = bc_service.get_custody_history(batch_id)
            custody_history = [
                CustodyEventSchema(
                    custodian=h["custodian"],
                    state=h["state"],
                    stateName=h["state_name"],
                    timestamp=h["timestamp"],
                    latitude=h.get("latitude", ""),
                    longitude=h.get("longitude", "")
                )
                for h in raw_history
            ]
        else:
            # Offline mock fallback only when blockchain is not connected
            logger.warning("Blockchain node is disconnected. Running in offline mock mode.")
            primary_hash = "QmMockCIDForOfflineTesting"
            ipfs_url = get_ipfs_url(primary_hash)
            ref_images_bytes = [live_image_bytes]
            custody_history = [
                CustodyEventSchema(
                    custodian="0xA6C5Ab3CC646b083F6936e696F5722ED2c5Bd9fd",
                    state=0,
                    stateName="Manufactured (Offline Mock)",
                    timestamp=int(time.time()) - 86400 * 3,
                    latitude="12.9716",
                    longitude="77.5946"
                )
            ]

        v_result = verify_authenticity_multi(ref_images_bytes, live_image_bytes)
        mode_str = "siamese_mock" if v_result.get("mock_mode") else "siamese_tflite"

        forensic_data = v_result.get("forensics", None)

        return VerifyResponse(
            batchId=batch_id,
            authenticityScore=v_result.get("authenticity_score", 0.90),
            verdict=v_result.get("verdict", "genuine"),
            distance=v_result.get("distance", 0.0),
            confidence=v_result.get("confidence", 0.95),
            ipfsImageUrl=ipfs_url or "https://via.placeholder.com/300?text=Reference+Image",
            custodyHistory=custody_history,
            mode=mode_str,
            forensicMetrics=forensic_data
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during verification for batch {batch_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Product verification failed: {str(e)}")
