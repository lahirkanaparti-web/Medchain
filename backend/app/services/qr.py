import io
import os
import qrcode


def generate_qr(batch_id: int, base_url: str = None) -> bytes:
    """
    Generates a PNG QR code image for a given batch ID, encoding the patient verification URL.
    Returns raw PNG bytes.
    """
    if not base_url:
        base_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # URL that patient opens / scans
    verification_url = f"{base_url.rstrip('/')}/verify/{batch_id}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(verification_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="PNG")
    return img_byte_arr.getvalue()
