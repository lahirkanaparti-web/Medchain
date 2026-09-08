const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MedChainRegistry Smart Contract", function () {
  let registry;
  let admin, manufacturer, distributor, pharmacy, patient, unauthorized;

  let MANUFACTURER_ROLE;
  let DISTRIBUTOR_ROLE;
  let PHARMACY_ROLE;

  // BatchState enum mapping
  const BatchState = {
    Manufactured: 0,
    InTransit: 1,
    AtDistributor: 2,
    AtPharmacy: 3,
    Dispensed: 4,
  };

  beforeEach(async function () {
    [admin, manufacturer, distributor, pharmacy, patient, unauthorized] =
      await ethers.getSigners();

    const MedChainRegistry = await ethers.getContractFactory("MedChainRegistry");
    registry = await MedChainRegistry.deploy();
    await registry.waitForDeployment();

    MANUFACTURER_ROLE = await registry.MANUFACTURER_ROLE();
    DISTRIBUTOR_ROLE = await registry.DISTRIBUTOR_ROLE();
    PHARMACY_ROLE = await registry.PHARMACY_ROLE();

    // Grant roles
    await registry.grantRole(MANUFACTURER_ROLE, manufacturer.address);
    await registry.grantRole(DISTRIBUTOR_ROLE, distributor.address);
    await registry.grantRole(PHARMACY_ROLE, pharmacy.address);
  });

  describe("Batch Creation & IPFS Linking", function () {
    it("should allow a manufacturer to create a batch and link an IPFS image hash", async function () {
      const mfgDate = Math.floor(Date.now() / 1000) - 86400; // yesterday
      const expiryDate = mfgDate + 365 * 86400; // 1 year later

      const tx = await registry
        .connect(manufacturer)
        .createBatch("Amoxicillin 500mg", "BATCH-2026-001", mfgDate, expiryDate);
      const receipt = await tx.wait();

      // Check event emission
      const event = receipt.logs.find(
        (log) => registry.interface.parseLog(log)?.name === "BatchCreated"
      );
      expect(event).to.not.be.undefined;
      const batchId = 1;

      const batch = await registry.getBatch(batchId);
      expect(batch.drugName).to.equal("Amoxicillin 500mg");
      expect(batch.batchNumber).to.equal("BATCH-2026-001");
      expect(batch.currentCustodian).to.equal(manufacturer.address);
      expect(batch.state).to.equal(BatchState.Manufactured);

      // Link IPFS Hash
      const ipfsHash = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
      await registry.connect(manufacturer).linkImageHash(batchId, ipfsHash);

      const updatedBatch = await registry.getBatch(batchId);
      expect(updatedBatch.ipfsImageHash).to.equal(ipfsHash);
    });

    it("should reject batch creation from an unauthorized caller", async function () {
      const mfgDate = Math.floor(Date.now() / 1000);
      const expiryDate = mfgDate + 86400;

      await expect(
        registry
          .connect(unauthorized)
          .createBatch("Fake Drug", "BATCH-FAKE", mfgDate, expiryDate)
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Custody Transfers & Lifecycle", function () {
    let batchId;

    beforeEach(async function () {
      const mfgDate = Math.floor(Date.now() / 1000);
      const expiryDate = mfgDate + 365 * 86400;

      const tx = await registry
        .connect(manufacturer)
        .createBatch("Paracetamol 650mg", "BATCH-PAR-101", mfgDate, expiryDate);
      await tx.wait();
      batchId = 1;
    });

    it("should complete a full sequential custody lifecycle (Manufactured -> InTransit -> AtDistributor -> AtPharmacy -> Dispensed)", async function () {
      // 1. Manufacturer sets to InTransit
      await registry
        .connect(manufacturer)
        .transferCustody(batchId, manufacturer.address, BatchState.InTransit);
      let batch = await registry.getBatch(batchId);
      expect(batch.state).to.equal(BatchState.InTransit);

      // 2. Manufacturer transfers to Distributor (AtDistributor)
      await registry
        .connect(manufacturer)
        .transferCustody(batchId, distributor.address, BatchState.AtDistributor);
      batch = await registry.getBatch(batchId);
      expect(batch.state).to.equal(BatchState.AtDistributor);
      expect(batch.currentCustodian).to.equal(distributor.address);

      // 3. Distributor transfers to Pharmacy (AtPharmacy)
      await registry
        .connect(distributor)
        .transferCustody(batchId, pharmacy.address, BatchState.AtPharmacy);
      batch = await registry.getBatch(batchId);
      expect(batch.state).to.equal(BatchState.AtPharmacy);
      expect(batch.currentCustodian).to.equal(pharmacy.address);

      // 4. Pharmacy dispenses to Patient (Dispensed)
      await registry
        .connect(pharmacy)
        .transferCustody(batchId, patient.address, BatchState.Dispensed);
      batch = await registry.getBatch(batchId);
      expect(batch.state).to.equal(BatchState.Dispensed);
      expect(batch.currentCustodian).to.equal(patient.address);

      // Verify complete custody history
      const history = await registry.getCustodyHistory(batchId);
      expect(history.length).to.equal(5);
      expect(history[0].state).to.equal(BatchState.Manufactured);
      expect(history[1].state).to.equal(BatchState.InTransit);
      expect(history[2].state).to.equal(BatchState.AtDistributor);
      expect(history[3].state).to.equal(BatchState.AtPharmacy);
      expect(history[4].state).to.equal(BatchState.Dispensed);
    });

    it("should reject out-of-order state transitions (e.g. skipping InTransit state)", async function () {
      // Attempt to jump from Manufactured (0) directly to AtDistributor (2)
      await expect(
        registry
          .connect(manufacturer)
          .transferCustody(batchId, distributor.address, BatchState.AtDistributor)
      ).to.be.revertedWith("Invalid state transition: states must be advanced sequentially");
    });

    it("should reject custody transfer by a non-custodian", async function () {
      await expect(
        registry
          .connect(unauthorized)
          .transferCustody(batchId, distributor.address, BatchState.InTransit)
      ).to.be.revertedWith("Caller is not current custodian");
    });
  });
});
