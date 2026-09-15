const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MedChainRegistry Smart Contract", function () {
  let registry;
  let admin, manufacturer, distributor, pharmacy, regulator, patient, unauthorized;

  let MANUFACTURER_ROLE;
  let DISTRIBUTOR_ROLE;
  let PHARMACY_ROLE;
  let REGULATOR_ROLE;

  const BatchState = {
    Manufactured: 0,
    InTransit: 1,
    AtDistributor: 2,
    AtPharmacy: 3,
    Dispensed: 4,
    Recalled: 5,
  };

  beforeEach(async function () {
    [admin, manufacturer, distributor, pharmacy, regulator, patient, unauthorized] =
      await ethers.getSigners();

    const MedChainRegistry = await ethers.getContractFactory("MedChainRegistry");
    registry = await MedChainRegistry.deploy();
    await registry.waitForDeployment();

    MANUFACTURER_ROLE = await registry.MANUFACTURER_ROLE();
    DISTRIBUTOR_ROLE = await registry.DISTRIBUTOR_ROLE();
    PHARMACY_ROLE = await registry.PHARMACY_ROLE();
    REGULATOR_ROLE = await registry.REGULATOR_ROLE();

    await registry.grantRole(MANUFACTURER_ROLE, manufacturer.address);
    await registry.grantRole(DISTRIBUTOR_ROLE, distributor.address);
    await registry.grantRole(PHARMACY_ROLE, pharmacy.address);
    await registry.grantRole(REGULATOR_ROLE, regulator.address);
  });

  describe("Batch Creation & Multiple IPFS Images", function () {
    it("should allow manufacturer to create batch and link 1-3 IPFS image hashes", async function () {
      const mfgDate = Math.floor(Date.now() / 1000) - 86400;
      const expiryDate = mfgDate + 365 * 86400;

      const tx = await registry
        .connect(manufacturer)
        .createBatch("Amoxicillin 500mg", "BATCH-2026-001", mfgDate, expiryDate);
      await tx.wait();

      const batchId = 1;
      const hashes = [
        "QmFrontHash1111111111111111111111111111111111",
        "QmBackHash22222222222222222222222222222222222",
        "QmSealHash33333333333333333333333333333333333",
      ];

      await registry.connect(manufacturer).linkImageHashes(batchId, hashes);

      const batch = await registry.getBatch(batchId);
      expect(batch.ipfsImageHash).to.equal(hashes[0]);
      expect(batch.ipfsImageHashes.length).to.equal(3);
      expect(batch.ipfsImageHashes[0]).to.equal(hashes[0]);
      expect(batch.ipfsImageHashes[1]).to.equal(hashes[1]);
      expect(batch.ipfsImageHashes[2]).to.equal(hashes[2]);
    });

    it("should reject image hash arrays outside 1-3 bounds", async function () {
      const mfgDate = Math.floor(Date.now() / 1000);
      const expiryDate = mfgDate + 86400;
      await registry.connect(manufacturer).createBatch("Test", "B1", mfgDate, expiryDate);

      await expect(
        registry.connect(manufacturer).linkImageHashes(1, [])
      ).to.be.revertedWith("Must provide 1 to 3 image hashes");

      await expect(
        registry.connect(manufacturer).linkImageHashes(1, ["h1", "h2", "h3", "h4"])
      ).to.be.revertedWith("Must provide 1 to 3 image hashes");
    });
  });

  describe("Custody Transfers with Geolocation", function () {
    let batchId;

    beforeEach(async function () {
      const mfgDate = Math.floor(Date.now() / 1000);
      const expiryDate = mfgDate + 365 * 86400;
      await registry.connect(manufacturer).createBatch("Paracetamol 650mg", "B-PAR-101", mfgDate, expiryDate);
      batchId = 1;
    });

    it("should record custody transfers with optional geolocation coordinates", async function () {
      await registry
        .connect(manufacturer)
        ["transferCustody(uint256,address,uint8,string,string)"](
          batchId,
          manufacturer.address,
          BatchState.InTransit,
          "12.9716",
          "77.5946"
        );

      await registry
        .connect(manufacturer)
        ["transferCustody(uint256,address,uint8,string,string)"](
          batchId,
          distributor.address,
          BatchState.AtDistributor,
          "",
          ""
        );

      const history = await registry.getCustodyHistory(batchId);
      expect(history.length).to.equal(3);
      expect(history[1].latitude).to.equal("12.9716");
      expect(history[1].longitude).to.equal("77.5946");
      expect(history[2].latitude).to.equal("");
      expect(history[2].longitude).to.equal("");
    });
  });

  describe("On-Chain Batch Recall", function () {
    let batchId;

    beforeEach(async function () {
      const mfgDate = Math.floor(Date.now() / 1000);
      const expiryDate = mfgDate + 365 * 86400;
      await registry.connect(manufacturer).createBatch("Recall Test Drug", "B-REC-1", mfgDate, expiryDate);
      batchId = 1;
    });

    it("should allow regulator to recall batch from active states", async function () {
      await registry
        .connect(regulator)
        .recallBatch(batchId, "Quality audit defect reported");

      const batch = await registry.getBatch(batchId);
      expect(batch.state).to.equal(BatchState.Recalled);
      expect(batch.recallReason).to.equal("Quality audit defect reported");
      expect(batch.recallTimestamp).to.be.gt(0);
    });

    it("should block custody transfers on recalled batches", async function () {
      await registry.connect(regulator).recallBatch(batchId, "Contamination hazard");

      await expect(
        registry
          .connect(manufacturer)
          ["transferCustody(uint256,address,uint8,string,string)"](
            batchId,
            manufacturer.address,
            BatchState.InTransit,
            "",
            ""
          )
      ).to.be.revertedWith("Cannot transfer custody of a recalled batch");
    });

    it("should reject recall on dispensed batches", async function () {
      await registry.connect(manufacturer)["transferCustody(uint256,address,uint8)"](batchId, manufacturer.address, BatchState.InTransit);
      await registry.connect(manufacturer)["transferCustody(uint256,address,uint8)"](batchId, distributor.address, BatchState.AtDistributor);
      await registry.connect(distributor)["transferCustody(uint256,address,uint8)"](batchId, pharmacy.address, BatchState.AtPharmacy);
      await registry.connect(pharmacy)["transferCustody(uint256,address,uint8)"](batchId, patient.address, BatchState.Dispensed);

      await expect(
        registry.connect(regulator).recallBatch(batchId, "Late recall attempt")
      ).to.be.revertedWith("Cannot recall a dispensed batch");
    });

    it("should reject recall calls from non-regulators", async function () {
      await expect(
        registry.connect(manufacturer).recallBatch(batchId, "Unauthorized recall")
      ).to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount");
    });
  });
});
