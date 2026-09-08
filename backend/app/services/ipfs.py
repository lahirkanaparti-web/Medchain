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
    Downloads raw file bytes from an IPFS CID via public gateway URL.
    Returns None if download fails or CID is mock.
    """
    if not cid or "QmMock" in cid:
        logger.info(f"Skipping HTTP download for mock CID '{cid}'.")
        return None

    url = get_ipfs_url(cid)
    try:
        res = requests.get(url, timeout=10)
        if res.status_code == 200:
            return res.content
        logger.warning(f"Failed to download IPFS CID '{cid}': HTTP {res.status_code}")
        return None
    except Exception as e:
        logger.warning(f"Error fetching IPFS file for CID '{cid}': {str(e)}")
        return None
