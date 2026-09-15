// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title MedChainRegistry
 * @dev ERC721 token representing pharmaceutical batches with role-based access control,
 * sequential custody state transitions, on-chain recall mechanism, multiple reference image CIDs,
 * and geolocation-aware custody logs.
 */
contract MedChainRegistry is ERC721, AccessControl {
    // Role definitions
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant PHARMACY_ROLE = keccak256("PHARMACY_ROLE");
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");

    // Sequential batch lifecycle states + Recalled
    enum BatchState {
        Manufactured, // 0
        InTransit,    // 1
        AtDistributor, // 2
        AtPharmacy,   // 3
        Dispensed,    // 4
        Recalled      // 5
    }

    struct Batch {
        uint256 batchId;
        string drugName;
        string batchNumber;
        uint256 mfgDate;
        uint256 expiryDate;
        string ipfsImageHash; // Primary reference image hash
        string[] ipfsImageHashes; // Array of 1-3 reference image hashes
        address currentCustodian;
        BatchState state;
        string recallReason;
        uint256 recallTimestamp;
    }

    struct CustodyEvent {
        address custodian;
        BatchState state;
        uint256 timestamp;
        string latitude;
        string longitude;
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

    event ImageHashesLinked(
        uint256 indexed batchId,
        string[] ipfsHashes
    );

    event CustodyTransferred(
        uint256 indexed batchId,
        address indexed from,
        address indexed to,
        BatchState newState,
        uint256 timestamp,
        string latitude,
        string longitude
    );

    event BatchRecalled(
        uint256 indexed batchId,
        string reason,
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

        Batch storage batch = _batches[batchId];
        batch.batchId = batchId;
        batch.drugName = drugName;
        batch.batchNumber = batchNumber;
        batch.mfgDate = mfgDate;
        batch.expiryDate = expiryDate;
        batch.ipfsImageHash = "";
        batch.currentCustodian = msg.sender;
        batch.state = BatchState.Manufactured;
        batch.recallReason = "";
        batch.recallTimestamp = 0;

        _custodyHistory[batchId].push(CustodyEvent({
            custodian: msg.sender,
            state: BatchState.Manufactured,
            timestamp: block.timestamp,
            latitude: "",
            longitude: ""
        }));

        _safeMint(msg.sender, batchId);

        emit BatchCreated(batchId, drugName, batchNumber, msg.sender);
        return batchId;
    }

    /**
     * @notice Link array of 1-3 IPFS reference image CIDs to a batch.
     * @dev Only MANUFACTURER_ROLE can link reference images.
     */
    function linkImageHashes(uint256 batchId, string[] memory hashes)
        public
        onlyRole(MANUFACTURER_ROLE)
    {
        require(_ownerOf(batchId) != address(0), "Batch does not exist");
        require(hashes.length >= 1 && hashes.length <= 3, "Must provide 1 to 3 image hashes");

        for (uint256 i = 0; i < hashes.length; i++) {
            require(bytes(hashes[i]).length > 0, "Empty IPFS hash provided");
        }

        _batches[batchId].ipfsImageHashes = hashes;
        _batches[batchId].ipfsImageHash = hashes[0];

        emit ImageHashesLinked(batchId, hashes);
        emit ImageHashLinked(batchId, hashes[0]);
    }

    /**
     * @notice Backward-compatible single image hash linking.
     */
    function linkImageHash(uint256 batchId, string calldata ipfsHash)
        external
        onlyRole(MANUFACTURER_ROLE)
    {
        string[] memory hashes = new string[](1);
        hashes[0] = ipfsHash;
        linkImageHashes(batchId, hashes);
    }

    /**
     * @notice Transfer custody and advance batch state with optional geolocation.
     * @dev Enforces sequential state transition (no skipping stages), role requirements, and recall checks.
     */
    function transferCustody(
        uint256 batchId,
        address toAddress,
        BatchState newState,
        string memory latitude,
        string memory longitude
    ) public {
        require(_ownerOf(batchId) != address(0), "Batch does not exist");
        require(toAddress != address(0), "Invalid recipient address");

        Batch storage batch = _batches[batchId];

        require(batch.state != BatchState.Recalled, "Cannot transfer custody of a recalled batch");

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
            require(
                hasRole(MANUFACTURER_ROLE, msg.sender) || hasRole(DISTRIBUTOR_ROLE, msg.sender),
                "Caller lacks permission for InTransit transfer"
            );
        } else if (newState == BatchState.AtDistributor) {
            require(
                hasRole(DISTRIBUTOR_ROLE, toAddress),
                "Recipient must have DISTRIBUTOR_ROLE"
            );
        } else if (newState == BatchState.AtPharmacy) {
            require(
                hasRole(PHARMACY_ROLE, toAddress),
                "Recipient must have PHARMACY_ROLE"
            );
        } else if (newState == BatchState.Dispensed) {
            require(
                hasRole(PHARMACY_ROLE, msg.sender),
                "Caller must have PHARMACY_ROLE to dispense"
            );
        }

        address previousCustodian = batch.currentCustodian;
        batch.currentCustodian = toAddress;
        batch.state = newState;

        _transfer(previousCustodian, toAddress, batchId);

        _custodyHistory[batchId].push(CustodyEvent({
            custodian: toAddress,
            state: newState,
            timestamp: block.timestamp,
            latitude: latitude,
            longitude: longitude
        }));

        emit CustodyTransferred(batchId, previousCustodian, toAddress, newState, block.timestamp, latitude, longitude);
    }

    /**
     * @notice Overloaded transferCustody for backward compatibility without location args.
     */
    function transferCustody(
        uint256 batchId,
        address toAddress,
        BatchState newState
    ) external {
        transferCustody(batchId, toAddress, newState, "", "");
    }

    /**
     * @notice Recall a batch due to safety or quality concerns.
     * @dev Only REGULATOR_ROLE can call recallBatch. Callable from any active state, but blocked once Dispensed.
     */
    function recallBatch(uint256 batchId, string calldata reason)
        external
        onlyRole(REGULATOR_ROLE)
    {
        require(_ownerOf(batchId) != address(0), "Batch does not exist");
        require(bytes(reason).length > 0, "Recall reason required");

        Batch storage batch = _batches[batchId];
        require(batch.state != BatchState.Dispensed, "Cannot recall a dispensed batch");
        require(batch.state != BatchState.Recalled, "Batch is already recalled");

        batch.state = BatchState.Recalled;
        batch.recallReason = reason;
        batch.recallTimestamp = block.timestamp;

        _custodyHistory[batchId].push(CustodyEvent({
            custodian: batch.currentCustodian,
            state: BatchState.Recalled,
            timestamp: block.timestamp,
            latitude: "",
            longitude: ""
        }));

        emit BatchRecalled(batchId, reason, block.timestamp);
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
