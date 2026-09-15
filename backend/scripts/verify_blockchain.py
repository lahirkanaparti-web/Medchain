import sys
import os
from dotenv import load_dotenv

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '.env')))

from app.services.blockchain import get_blockchain_service

def main():
    bc = get_blockchain_service()
    print("Web3 Connected:", bc.is_connected())
    print("Contract Address:", bc.contract_address)
    print("Deployer Address:", bc.account.address)

    # 1. Test createBatch
    print("\n[1] Testing create_batch...")
    res = bc.create_batch(
        drug_name="Amoxicillin 500mg",
        batch_number="BATCH-TEST-2026-001",
        mfg_date=1700000000,
        expiry_date=1735000000
    )
    print("Batch created successfully:", res)
    batch_id = res["batch_id"]

    # 2. Test link_image_hash
    print("\n[2] Testing link_image_hash...")
    link_tx = bc.link_image_hash(batch_id, "QmXuiMYBoSxwJ1tbR8AJoC8jvhGZajpkRN8sjs423qtcWj")
    print("Image hash linked, tx:", link_tx)

    # 3. Test get_batch
    print(f"\n[3] Testing get_batch({batch_id})...")
    batch_data = bc.get_batch(batch_id)
    print("Decoded batch data:", batch_data)

    # 4. Test get_custody_history
    print(f"\n[4] Testing get_custody_history({batch_id})...")
    history = bc.get_custody_history(batch_id)
    print("Custody history:", history)

    print("\nAll blockchain operations verified successfully!")

if __name__ == "__main__":
    main()
