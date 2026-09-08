// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title MedChainRegistry
 * @dev ERC721 token representing pharmaceutical batches with role-based access control,
 * sequential custody state transitions, and IPFS reference image linking.
 */
contract MedChainRegistry is ERC721, AccessControl {
    // Role definitions
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant PHARMACY_ROLE = keccak256("PHARMACY_ROLE");

    // Sequential batch lifecycle states
    enum BatchState {
        Manufactured, // 0
        InTransit,    // 1
        AtDistributor, // 2
        AtPharmacy,   // 3
        Dispensed     // 4
    }

    struct Batch {
        uint256 batchId;
        string drugName;
        string batchNumber;
        uint256 mfgDate;
        uint256 expiryDate;
        string ipfsImageHash;
        address currentCustodian;
        BatchState state;
    }

    struct CustodyEvent {
        address custodian;
        BatchState state;
        uint256 timestamp;
    }

    // Auto-incrementing batch counter
    uint256 private _nextBatchId = 1;

    // Mapping from batchId to Batch struct details
    mapping(uint256 => Batch) private _batches;

    // Mapping from batchId to array of custody history events
    mapping(uint256 => CustodyEvent[]) private _custodyHistory;

    // Events
    event BatchCreated(
        uint256 indexed batchId,
        string drugName,
        string batchNumber,
        address indexed manufacturer
    );

    event ImageHashLinked(
        uint256 indexed batchId,
        string ipfsHash
    );

    event CustodyTransferred(
        uint256 indexed batchId,
        address indexed from,
        address indexed to,
        BatchState newState,
        uint256 timestamp
    );

    constructor() ERC721("MedChain Batch Token", "MCB") {
        // Deployer receives admin role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Create a new pharmaceutical batch token.
     * @dev Only accounts with MANUFACTURER_ROLE can create batches.
     */
    function createBatch(
        string memory drugName,
        string memory batchNumber,
        uint256 mfgDate,
        uint256 expiryDate
    ) external onlyRole(MANUFACTURER_ROLE) returns (uint256) {
        require(bytes(drugName).length > 0, "Drug name required");
        require(bytes(batchNumber).length > 0, "Batch number required");
        require(expiryDate > mfgDate, "Expiry must be after manufacturing date");

        uint256 batchId = _nextBatchId++;
        _safeMint(msg.sender, batchId);

        Batch storage batch = _batches[batchId];
        batch.batchId = batchId;
        batch.drugName = drugName;
        batch.batchNumber = batchNumber;
        batch.mfgDate = mfgDate;
        batch.expiryDate = expiryDate;
        batch.ipfsImageHash = "";
        batch.currentCustodian = msg.sender;
        batch.state = BatchState.Manufactured;

        _custodyHistory[batchId].push(CustodyEvent({
            custodian: msg.sender,
            state: BatchState.Manufactured,
            timestamp: block.timestamp
        }));

        emit BatchCreated(batchId, drugName, batchNumber, msg.sender);
        return batchId;
    }

    /**
     * @notice Link IPFS reference image CID to a batch.
     * @dev Only MANUFACTURER_ROLE can link reference image.
     */
    function linkImageHash(uint256 batchId, string calldata ipfsHash)
        external
        onlyRole(MANUFACTURER_ROLE)
    {
        require(_ownerOf(batchId) != address(0), "Batch does not exist");
        require(bytes(ipfsHash).length > 0, "Empty IPFS hash");

        _batches[batchId].ipfsImageHash = ipfsHash;
        emit ImageHashLinked(batchId, ipfsHash);
    }

    /**
     * @notice Transfer custody and advance batch state.
     * @dev Enforces sequential state transition (no skipping stages) and role requirements.
     */
    function transferCustody(
        uint256 batchId,
        address toAddress,
        BatchState newState
    ) external {
        require(_ownerOf(batchId) != address(0), "Batch does not exist");
        require(toAddress != address(0), "Invalid recipient address");

        Batch storage batch = _batches[batchId];

        // Caller must be current custodian or contract admin
        require(
            msg.sender == batch.currentCustodian || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Caller is not current custodian"
        );

        // Enforce strict sequential state transition
        require(
            uint8(newState) == uint8(batch.state) + 1,
            "Invalid state transition: states must be advanced sequentially"
        );

        // Validate role for target state
        if (newState == BatchState.InTransit) {
            // Manufacturer or Distributor moving to transit
            require(
                hasRole(MANUFACTURER_ROLE, msg.sender) || hasRole(DISTRIBUTOR_ROLE, msg.sender),
                "Caller lacks permission for InTransit transfer"
            );
        } else if (newState == BatchState.AtDistributor) {
            // Recipient must be a distributor
            require(
                hasRole(DISTRIBUTOR_ROLE, toAddress),
                "Recipient must have DISTRIBUTOR_ROLE"
            );
        } else if (newState == BatchState.AtPharmacy) {
            // Recipient must be a pharmacy
            require(
                hasRole(PHARMACY_ROLE, toAddress),
                "Recipient must have PHARMACY_ROLE"
            );
        } else if (newState == BatchState.Dispensed) {
            // Caller dispensing must be a pharmacy
            require(
                hasRole(PHARMACY_ROLE, msg.sender),
                "Caller must have PHARMACY_ROLE to dispense"
            );
        }

        address previousCustodian = batch.currentCustodian;
        batch.currentCustodian = toAddress;
        batch.state = newState;

        // Internal ERC721 transfer of token ownership
        _transfer(previousCustodian, toAddress, batchId);

        _custodyHistory[batchId].push(CustodyEvent({
            custodian: toAddress,
            state: newState,
            timestamp: block.timestamp
        }));

        emit CustodyTransferred(batchId, previousCustodian, toAddress, newState, block.timestamp);
    }

    /**
     * @notice Get details for a specific batch.
     */
    function getBatch(uint256 batchId) external view returns (Batch memory) {
        require(_ownerOf(batchId) != address(0), "Batch does not exist");
        return _batches[batchId];
    }

    /**
     * @notice Get complete custody history array for a batch.
     */
    function getCustodyHistory(uint256 batchId) external view returns (CustodyEvent[] memory) {
        require(_ownerOf(batchId) != address(0), "Batch does not exist");
        return _custodyHistory[batchId];
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
