const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying MedChainRegistry contract on network '${hre.network.name}' with account:`, deployer.address);

  const MedChainRegistry = await hre.ethers.getContractFactory("MedChainRegistry");
  const registry = await MedChainRegistry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log(`MedChainRegistry deployed successfully to ${hre.network.name}:`, address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
