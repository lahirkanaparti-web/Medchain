import json
import os
import sys
from dotenv import load_dotenv

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '.env')))

from app.services.blockchain import get_blockchain_service

def setup():
    bc = get_blockchain_service()
    abi_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'contracts', 'artifacts', 'contracts', 'MedChainRegistry.sol', 'MedChainRegistry.json'))
    if os.path.exists(abi_path):
        with open(abi_path, 'r') as f:
            full_abi = json.load(f)['abi']
        bc.contract = bc.w3.eth.contract(address=bc.contract.address, abi=full_abi)
        print("Loaded full contract ABI from Hardhat artifact.")

    deployer = bc.account.address
    print(f"Deployer address: {deployer}")
    print(f"Contract address: {bc.contract.address}")

    roles = ["MANUFACTURER_ROLE", "DISTRIBUTOR_ROLE", "PHARMACY_ROLE", "REGULATOR_ROLE"]
    for role_name in roles:
        role_bytes = getattr(bc.contract.functions, role_name)().call()
        has_role = bc.contract.functions.hasRole(role_bytes, deployer).call()
        if not has_role:
            print(f"Granting {role_name} to {deployer}...")
            func = bc.contract.functions.grantRole(role_bytes, deployer)
            receipt = bc._send_transaction(func)
            print(f"Granted {role_name}, tx: {receipt.transactionHash.hex()}")
        else:
            print(f"Deployer already has {role_name}")

    print("\nAll roles verified and granted successfully!")

if __name__ == "__main__":
    setup()
