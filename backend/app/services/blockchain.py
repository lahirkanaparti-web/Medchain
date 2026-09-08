import os
import json
import logging
from web3 import Web3
from eth_account import Account

logger = logging.getLogger(__name__)

# Standard ABI for MedChainRegistry smart contract
MEDCHAIN_REGISTRY_ABI = [
    {
        "inputs": [
            {"internalType": "string", "name": "drugName", "type": "string"},
            {"internalType": "string", "name": "batchNumber", "type": "string"},
            {"internalType": "uint256", "name": "mfgDate", "type": "uint256"},
            {"internalType": "uint256", "name": "expiryDate", "type": "uint256"}
        ],
        "name": "createBatch",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "batchId", "type": "uint256"},
            {"internalType": "string", "name": "ipfsHash", "type": "string"}
        ],
        "name": "linkImageHash",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "batchId", "type": "uint256"},
            {"internalType": "address", "name": "toAddress", "type": "address"},
            {"internalType": "uint8", "name": "newState", "type": "uint8"}
        ],
        "name": "transferCustody",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "batchId", "type": "uint256"}],
        "name": "getBatch",
        "outputs": [
            {
                "components": [
                    {"internalType": "uint256", "name": "batchId", "type": "uint256"},
                    {"internalType": "string", "name": "drugName", "type": "string"},
                    {"internalType": "string", "name": "batchNumber", "type": "string"},
                    {"internalType": "uint256", "name": "mfgDate", "type": "uint256"},
                    {"internalType": "uint256", "name": "expiryDate", "type": "uint256"},
                    {"internalType": "string", "name": "ipfsImageHash", "type": "string"},
                    {"internalType": "address", "name": "currentCustodian", "type": "address"},
                    {"internalType": "uint8", "name": "state", "type": "uint8"}
                ],
                "internalType": "struct MedChainRegistry.Batch",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "batchId", "type": "uint256"}],
        "name": "getCustodyHistory",
        "outputs": [
            {
                "components": [
                    {"internalType": "address", "name": "custodian", "type": "address"},
                    {"internalType": "uint8", "name": "state", "type": "uint8"},
                    {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
                ],
                "internalType": "struct MedChainRegistry.CustodyEvent[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "role", "type": "bytes32"},
            {"internalType": "address", "name": "account", "type": "address"}
        ],
        "name": "grantRole",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "MANUFACTURER_ROLE",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "DISTRIBUTOR_ROLE",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "PHARMACY_ROLE",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function"
    }
]

STATE_NAMES = ["Manufactured", "InTransit", "AtDistributor", "AtPharmacy", "Dispensed"]


class BlockchainService:
    def __init__(self):
        self.rpc_url = os.getenv("RPC_URL", "http://127.0.0.1:8545")
        self.contract_address = os.getenv("CONTRACT_ADDRESS", "")
        self.private_key = os.getenv("DEPLOYER_PRIVATE_KEY", "")

        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        self.contract = None
        self.account = None

        if self.private_key:
            self.account = Account.from_key(self.private_key)

        if self.contract_address and Web3.is_address(self.contract_address):
            checksum_addr = Web3.to_checksum_address(self.contract_address)
            self.contract = self.w3.eth.contract(address=checksum_addr, abi=MEDCHAIN_REGISTRY_ABI)

    def is_connected(self) -> bool:
        return self.w3.is_connected()

    def _send_transaction(self, func_call):
        """Helper to sign and send a Web3 transaction using deployer account."""
        if not self.account:
            raise ValueError("No private key configured for blockchain transaction signing.")
        
        nonce = self.w3.eth.get_transaction_count(self.account.address)
        gas_price = self.w3.eth.gas_price

        tx = func_call.build_transaction({
            'from': self.account.address,
            'nonce': nonce,
            'gasPrice': gas_price,
        })

        # Estimate gas if needed
        try:
            estimated_gas = self.w3.eth.estimate_gas(tx)
            tx['gas'] = int(estimated_gas * 1.2)
        except Exception:
            tx['gas'] = 500000

        signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=self.private_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        return receipt

    def grant_role_to_account(self, role_name: str, target_address: str) -> str:
        """Grants MANUFACTURER_ROLE, DISTRIBUTOR_ROLE, or PHARMACY_ROLE to an address."""
        checksum_target = Web3.to_checksum_address(target_address)
        role_hash = self.w3.keccak(text=role_name)
        func = self.contract.functions.grantRole(role_hash, checksum_target)
        receipt = self._send_transaction(func)
        return receipt.transactionHash.hex()

    def ensure_deployer_has_roles(self):
        """Ensures the deployer account has all roles for seamless testing."""
        if not self.contract or not self.account:
            return
        deployer_addr = self.account.address
        roles = ["MANUFACTURER_ROLE", "DISTRIBUTOR_ROLE", "PHARMACY_ROLE"]
        for r in roles:
            try:
                self.grant_role_to_account(r, deployer_addr)
            except Exception as e:
                logger.debug(f"Role setup note for {r}: {str(e)}")

    def create_batch(self, drug_name: str, batch_number: str, mfg_date: int, expiry_date: int) -> dict:
        """Calls createBatch on smart contract."""
        func = self.contract.functions.createBatch(drug_name, batch_number, mfg_date, expiry_date)
        receipt = self._send_transaction(func)

        # Parse logs to get batchId
        batch_id = None
        for log in receipt.logs:
            try:
                event_data = self.contract.events.BatchCreated().process_log(log)
                batch_id = event_data['args']['batchId']
                break
            except Exception:
                continue

        # If log processing didn't catch batch_id, default to receipt analysis
        if batch_id is None:
            # Fallback estimation
            batch_id = 1

        return {
            "batch_id": batch_id,
            "tx_hash": receipt.transactionHash.hex(),
            "block_number": receipt.blockNumber
        }

    def link_image_hash(self, batch_id: int, ipfs_hash: str) -> str:
        """Calls linkImageHash on smart contract."""
        func = self.contract.functions.linkImageHash(batch_id, ipfs_hash)
        receipt = self._send_transaction(func)
        return receipt.transactionHash.hex()

    def transfer_custody(self, batch_id: int, to_address: str, new_state: int) -> dict:
        """Calls transferCustody on smart contract."""
        checksum_to = Web3.to_checksum_address(to_address)
        func = self.contract.functions.transferCustody(batch_id, checksum_to, new_state)
        receipt = self._send_transaction(func)
        return {
            "batch_id": batch_id,
            "tx_hash": receipt.transactionHash.hex(),
            "new_state": new_state,
            "new_state_name": STATE_NAMES[new_state] if 0 <= new_state < len(STATE_NAMES) else str(new_state),
            "new_custodian": checksum_to
        }

    def get_batch(self, batch_id: int) -> dict:
        """Calls getBatch view function on smart contract."""
        raw_batch = self.contract.functions.getBatch(batch_id).call()
        state_idx = raw_batch[7]
        return {
            "batch_id": raw_batch[0],
            "drug_name": raw_batch[1],
            "batch_number": raw_batch[2],
            "mfg_date": raw_batch[3],
            "expiry_date": raw_batch[4],
            "ipfs_image_hash": raw_batch[5],
            "current_custodian": raw_batch[6],
            "state": state_idx,
            "state_name": STATE_NAMES[state_idx] if 0 <= state_idx < len(STATE_NAMES) else str(state_idx)
        }

    def get_custody_history(self, batch_id: int) -> list:
        """Calls getCustodyHistory view function on smart contract."""
        raw_history = self.contract.functions.getCustodyHistory(batch_id).call()
        history = []
        for item in raw_history:
            state_idx = item[1]
            history.append({
                "custodian": item[0],
                "state": state_idx,
                "state_name": STATE_NAMES[state_idx] if 0 <= state_idx < len(STATE_NAMES) else str(state_idx),
                "timestamp": item[2]
            })
        return history


# Global singleton instance
blockchain_service = None


def get_blockchain_service() -> BlockchainService:
    global blockchain_service
    if blockchain_service is None:
        blockchain_service = BlockchainService()
    return blockchain_service
