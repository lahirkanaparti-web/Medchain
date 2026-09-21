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
            {"internalType": "string[]", "name": "hashes", "type": "string[]"}
        ],
        "name": "linkImageHashes",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "batchId", "type": "uint256"},
            {"internalType": "address", "name": "toAddress", "type": "address"},
            {"internalType": "uint8", "name": "newState", "type": "uint8"},
            {"internalType": "string", "name": "latitude", "type": "string"},
            {"internalType": "string", "name": "longitude", "type": "string"}
        ],
        "name": "transferCustody",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "batchId", "type": "uint256"},
            {"internalType": "string", "name": "reason", "type": "string"}
        ],
        "name": "recallBatch",
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
                    {"internalType": "string[]", "name": "ipfsImageHashes", "type": "string[]"},
                    {"internalType": "address", "name": "currentCustodian", "type": "address"},
                    {"internalType": "uint8", "name": "state", "type": "uint8"},
                    {"internalType": "string", "name": "recallReason", "type": "string"},
                    {"internalType": "uint256", "name": "recallTimestamp", "type": "uint256"}
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
                    {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
                    {"internalType": "string", "name": "latitude", "type": "string"},
                    {"internalType": "string", "name": "longitude", "type": "string"}
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
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "role", "type": "bytes32"},
            {"internalType": "address", "name": "account", "type": "address"}
        ],
        "name": "hasRole",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "uint256", "name": "batchId", "type": "uint256"},
            {"indexed": False, "internalType": "string", "name": "drugName", "type": "string"},
            {"indexed": False, "internalType": "string", "name": "batchNumber", "type": "string"},
            {"indexed": True, "internalType": "address", "name": "manufacturer", "type": "address"}
        ],
        "name": "BatchCreated",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "uint256", "name": "batchId", "type": "uint256"},
            {"indexed": False, "internalType": "string", "name": "ipfsHash", "type": "string"}
        ],
        "name": "ImageHashLinked",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "uint256", "name": "batchId", "type": "uint256"},
            {"indexed": False, "internalType": "string[]", "name": "ipfsHashes", "type": "string[]"}
        ],
        "name": "ImageHashesLinked",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "uint256", "name": "batchId", "type": "uint256"},
            {"indexed": True, "internalType": "address", "name": "from", "type": "address"},
            {"indexed": True, "internalType": "address", "name": "to", "type": "address"},
            {"indexed": False, "internalType": "uint8", "name": "newState", "type": "uint8"},
            {"indexed": False, "internalType": "uint256", "name": "timestamp", "type": "uint256"},
            {"indexed": False, "internalType": "string", "name": "latitude", "type": "string"},
            {"indexed": False, "internalType": "string", "name": "longitude", "type": "string"}
        ],
        "name": "CustodyTransferred",
        "type": "event"
    },
    {
        "anonymous": False,
        "inputs": [
            {"indexed": True, "internalType": "uint256", "name": "batchId", "type": "uint256"},
            {"indexed": False, "internalType": "string", "name": "reason", "type": "string"},
            {"indexed": False, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "name": "BatchRecalled",
        "type": "event"
    }
]

STATE_NAMES = ["Manufactured", "InTransit", "AtDistributor", "AtPharmacy", "Dispensed", "Recalled"]


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

        abi = MEDCHAIN_REGISTRY_ABI
        # Check if full compiled artifact exists
        artifact_paths = [
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "contracts", "artifacts", "contracts", "MedChainRegistry.sol", "MedChainRegistry.json")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models", "MedChainRegistry.json")),
        ]
        for ap in artifact_paths:
            if os.path.exists(ap):
                try:
                    with open(ap, "r") as f:
                        abi = json.load(f)["abi"]
                    break
                except Exception:
                    pass

        if self.contract_address and Web3.is_address(self.contract_address):
            checksum_addr = Web3.to_checksum_address(self.contract_address)
            self.contract = self.w3.eth.contract(address=checksum_addr, abi=abi)

    def is_connected(self) -> bool:
        return self.w3.is_connected()

    def _send_transaction(self, func_call, signer_private_key: str = None):
        """Helper to sign and send a Web3 transaction using deployer or custom regulator account."""
        key = signer_private_key or self.private_key
        if not key:
            raise ValueError("No private key configured for blockchain transaction signing.")
        
        signer_account = Account.from_key(key) if signer_private_key else self.account

        nonce = self.w3.eth.get_transaction_count(signer_account.address, 'pending')
        current_gas_price = self.w3.eth.gas_price
        buffered_gas_price = int(current_gas_price * 1.25)

        tx_dict = {
            'from': signer_account.address,
            'nonce': nonce,
            'gasPrice': buffered_gas_price,
            'chainId': self.w3.eth.chain_id,
        }

        try:
            estimated_gas = func_call.estimate_gas({'from': signer_account.address})
            tx_dict['gas'] = int(estimated_gas * 1.3)
        except Exception:
            tx_dict['gas'] = 600000

        tx = func_call.build_transaction(tx_dict)
        signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        logger.info(f"Transaction submitted by {signer_account.address}: {tx_hash.hex()} (nonce={nonce})")
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=180)
        return receipt

    def grant_role_to_account(self, role_name: str, target_address: str) -> str:
        """Grants role to an address."""
        checksum_target = Web3.to_checksum_address(target_address)
        role_hash = self.w3.keccak(text=role_name)
        func = self.contract.functions.grantRole(role_hash, checksum_target)
        receipt = self._send_transaction(func)
        return receipt.transactionHash.hex()

    def ensure_deployer_has_roles(self):
        """Ensures deployer account has all roles for testing."""
        if not self.contract or not self.account:
            return
        deployer_addr = self.account.address
        roles = ["MANUFACTURER_ROLE", "DISTRIBUTOR_ROLE", "PHARMACY_ROLE", "REGULATOR_ROLE"]
        for r in roles:
            try:
                self.grant_role_to_account(r, deployer_addr)
            except Exception as e:
                logger.debug(f"Role setup note for {r}: {str(e)}")

    def create_batch(self, drug_name: str, batch_number: str, mfg_date: int, expiry_date: int) -> dict:
        """Calls createBatch on smart contract."""
        func = self.contract.functions.createBatch(drug_name, batch_number, mfg_date, expiry_date)
        receipt = self._send_transaction(func)

        batch_id = None
        for log in receipt.logs:
            try:
                event_data = self.contract.events.BatchCreated().process_log(log)
                batch_id = event_data['args']['batchId']
                break
            except Exception:
                continue

        if batch_id is None:
            batch_id = 1

        return {
            "batch_id": batch_id,
            "tx_hash": receipt.transactionHash.hex(),
            "block_number": receipt.blockNumber
        }

    def link_image_hashes(self, batch_id: int, ipfs_hashes: list) -> str:
        """Calls linkImageHashes on smart contract."""
        func = self.contract.functions.linkImageHashes(batch_id, ipfs_hashes)
        receipt = self._send_transaction(func)
        return receipt.transactionHash.hex()

    def link_image_hash(self, batch_id: int, ipfs_hash: str) -> str:
        """Calls linkImageHash for backward compatibility."""
        func = self.contract.functions.linkImageHash(batch_id, ipfs_hash)
        receipt = self._send_transaction(func)
        return receipt.transactionHash.hex()

    def transfer_custody(self, batch_id: int, to_address: str, new_state: int, latitude: str = "", longitude: str = "") -> dict:
        """Calls transferCustody on smart contract with geolocation."""
        checksum_to = Web3.to_checksum_address(to_address)
        func = self.contract.functions.transferCustody(batch_id, checksum_to, new_state, str(latitude), str(longitude))
        receipt = self._send_transaction(func)
        return {
            "batch_id": batch_id,
            "tx_hash": receipt.transactionHash.hex(),
            "new_state": new_state,
            "new_state_name": STATE_NAMES[new_state] if 0 <= new_state < len(STATE_NAMES) else str(new_state),
            "new_custodian": checksum_to,
            "latitude": latitude,
            "longitude": longitude
        }

    def recall_batch(self, batch_id: int, reason: str, signer_private_key: str = None) -> dict:
        """Calls recallBatch on smart contract (REGULATOR_ROLE)."""
        func = self.contract.functions.recallBatch(batch_id, reason)
        receipt = self._send_transaction(func, signer_private_key=signer_private_key)
        return {
            "batch_id": batch_id,
            "tx_hash": receipt.transactionHash.hex(),
            "reason": reason
        }

    def get_batch(self, batch_id: int) -> dict:
        """Calls getBatch view function on smart contract."""
        raw_batch = self.contract.functions.getBatch(batch_id).call()
        # Tuple fields: 
        # 0: batchId, 1: drugName, 2: batchNumber, 3: mfgDate, 4: expiryDate,
        # 5: ipfsImageHash, 6: ipfsImageHashes, 7: currentCustodian, 8: state,
        # 9: recallReason, 10: recallTimestamp
        state_idx = raw_batch[8]
        return {
            "batch_id": raw_batch[0],
            "drug_name": raw_batch[1],
            "batch_number": raw_batch[2],
            "mfg_date": raw_batch[3],
            "expiry_date": raw_batch[4],
            "ipfs_image_hash": raw_batch[5],
            "ipfs_image_hashes": list(raw_batch[6]) if len(raw_batch) > 6 and isinstance(raw_batch[6], (list, tuple)) else [raw_batch[5]],
            "current_custodian": raw_batch[7],
            "state": state_idx,
            "state_name": STATE_NAMES[state_idx] if 0 <= state_idx < len(STATE_NAMES) else str(state_idx),
            "recall_reason": raw_batch[9] if len(raw_batch) > 9 else "",
            "recall_timestamp": raw_batch[10] if len(raw_batch) > 10 else 0,
            "is_recalled": (state_idx == 5)
        }

    def get_custody_history(self, batch_id: int) -> list:
        """Calls getCustodyHistory view function on smart contract."""
        raw_history = self.contract.functions.getCustodyHistory(batch_id).call()
        history = []
        for item in raw_history:
            state_idx = item[1]
            lat = item[3] if len(item) > 3 else ""
            lon = item[4] if len(item) > 4 else ""
            history.append({
                "custodian": item[0],
                "state": state_idx,
                "state_name": STATE_NAMES[state_idx] if 0 <= state_idx < len(STATE_NAMES) else str(state_idx),
                "timestamp": item[2],
                "latitude": lat,
                "longitude": lon
            })
        return history


# Global singleton instance
blockchain_service = None


def get_blockchain_service() -> BlockchainService:
    global blockchain_service
    if blockchain_service is None:
        blockchain_service = BlockchainService()
    return blockchain_service
