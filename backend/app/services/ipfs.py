import os
import logging
import requests

logger = logging.getLogger(__name__)

PINATA_BASE_URL = "https://api.pinata.cloud"
PUBLIC_IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs"


class IPFSUploadError(Exception):
    """Custom exception raised when uploading to IPFS fails."""
    pass


def upload_to_ipfs(file_bytes: bytes, filename: str) -> str:
    """
    Uploads file bytes to IPFS using Pinata's REST API.
    Returns the IPFS CID (hash).
    """
    api_key = os.getenv("PINATA_API_KEY")
    secret_key = os.getenv("PINATA_SECRET")
    jwt_token = os.getenv("PINATA_JWT")

    if not (jwt_token or (api_key and secret_key)) or api_key == "mock_pinata_api_key":
        logger.warning("Pinata credentials not set or using mock keys. Returning fallback mock CID.")
        return f"QmMockCIDFor{filename.replace(' ', '_')}"

    headers = {}
    if jwt_token:
        headers["Authorization"] = f"Bearer {jwt_token}"
    else:
        headers["pinata_api_key"] = api_key
        headers["pinata_secret_api_key"] = secret_key

    url = f"{PINATA_BASE_URL}/pinning/pinFileToIPFS"
    files = {"file": (filename, file_bytes)}

    try:
        response = requests.post(url, files=files, headers=headers, timeout=30)
        response.raise_for_status()
        data = response.json()
        cid = data.get("IpfsHash")
        if not cid:
            raise IPFSUploadError("Pinata response missing IpfsHash key.")
        return cid
    except requests.exceptions.RequestException as e:
        logger.error(f"IPFS Upload to Pinata failed: {str(e)}")
        raise IPFSUploadError(f"Failed to upload image to IPFS via Pinata: {str(e)}") from e


def get_ipfs_url(cid: str) -> str:
    """
    Returns a public IPFS gateway URL given a CID.
    """
    if not cid:
        return ""
    if cid.startswith("http://") or cid.startswith("https://"):
        return cid
    return f"{PUBLIC_IPFS_GATEWAY}/{cid}"


def fetch_ipfs_file(cid: str) -> bytes:
    """
    Downloads raw file bytes from an IPFS CID using Pinata gateway (with auth) or public IPFS fallbacks.
    Returns None if download fails or CID is mock.
    """
    if not cid or "QmMock" in cid:
        logger.info(f"Skipping HTTP download for mock CID '{cid}'.")
        return None

    jwt_token = os.getenv("PINATA_JWT")
    headers = {}
    if jwt_token:
        headers["Authorization"] = f"Bearer {jwt_token}"

    gateways = [
        f"https://gateway.pinata.cloud/ipfs/{cid}",
        f"https://ipfs.io/ipfs/{cid}",
        f"https://cloudflare-ipfs.com/ipfs/{cid}",
        f"https://dweb.link/ipfs/{cid}",
    ]

    for gw_url in gateways:
        try:
            req_headers = headers if "pinata.cloud" in gw_url else {}
            logger.info(f"Accessing IPFS for CID '{cid}' via {gw_url}...")
            res = requests.get(gw_url, headers=req_headers, timeout=12)
            if res.status_code == 200 and len(res.content) > 0:
                logger.info(f"Successfully retrieved IPFS file ({len(res.content)} bytes) for CID '{cid}' from {gw_url}")
                return res.content
            logger.debug(f"Gateway {gw_url} returned HTTP {res.status_code}")
        except Exception as e:
            logger.debug(f"Gateway {gw_url} failed for CID '{cid}': {str(e)}")

    logger.warning(f"All IPFS gateways failed to fetch content for CID '{cid}'.")
    return None


def check_pinata_connection() -> dict:
    """
    Checks connection status with Pinata IPFS API.
    Returns status dict with connected boolean and message.
    """
    api_key = os.getenv("PINATA_API_KEY")
    secret_key = os.getenv("PINATA_SECRET")
    jwt_token = os.getenv("PINATA_JWT")

    if not (jwt_token or (api_key and secret_key)) or api_key == "mock_pinata_api_key":
        return {"connected": False, "message": "Using mock Pinata credentials."}

    headers = {}
    if jwt_token:
        headers["Authorization"] = f"Bearer {jwt_token}"
    else:
        headers["pinata_api_key"] = api_key
        headers["pinata_secret_api_key"] = secret_key

    try:
        url = f"{PINATA_BASE_URL}/data/testAuthentication"
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            return {"connected": True, "message": "Pinata IPFS live cloud connected successfully."}
        return {"connected": False, "message": f"Pinata returned HTTP status {res.status_code}."}
    except Exception as e:
        return {"connected": False, "message": f"Pinata connection test failed: {str(e)}"}

