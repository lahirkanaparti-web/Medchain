const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const contractAddress = process.env.CONTRACT_ADDRESS || "0x380C35D453AAcc82972eDf223e4832c7a492Abd5";
  
  console.log("Target Contract Address:", contractAddress);
  console.log("Executing role assignments with Admin wallet:", deployer.address);

  const registry = await hre.ethers.getContractAt("MedChainRegistry", contractAddress);

  const MANUFACTURER_ROLE = await registry.MANUFACTURER_ROLE();
  const DISTRIBUTOR_ROLE = await registry.DISTRIBUTOR_ROLE();
  const PHARMACY_ROLE = await registry.PHARMACY_ROLE();
  const REGULATOR_ROLE = await registry.REGULATOR_ROLE();

  const targetAddress = deployer.address;

  // 1. Grant MANUFACTURER_ROLE
  console.log("\n1. Granting MANUFACTURER_ROLE to", targetAddress);
  const tx1 = await registry.grantRole(MANUFACTURER_ROLE, targetAddress);
  console.log("Tx Sent: https://sepolia.etherscan.io/tx/" + tx1.hash);
  await tx1.wait();
  console.log("MANUFACTURER_ROLE Confirmed!");

  // 2. Grant DISTRIBUTOR_ROLE
  console.log("\n2. Granting DISTRIBUTOR_ROLE to", targetAddress);
  const tx2 = await registry.grantRole(DISTRIBUTOR_ROLE, targetAddress);
  console.log("Tx Sent: https://sepolia.etherscan.io/tx/" + tx2.hash);
  await tx2.wait();
  console.log("DISTRIBUTOR_ROLE Confirmed!");

  // 3. Grant PHARMACY_ROLE
  console.log("\n3. Granting PHARMACY_ROLE to", targetAddress);
  const tx3 = await registry.grantRole(PHARMACY_ROLE, targetAddress);
  console.log("Tx Sent: https://sepolia.etherscan.io/tx/" + tx3.hash);
  await tx3.wait();
  console.log("PHARMACY_ROLE Confirmed!");

  // 4. Grant REGULATOR_ROLE
  console.log("\n4. Granting REGULATOR_ROLE to", targetAddress);
  const tx4 = await registry.grantRole(REGULATOR_ROLE, targetAddress);
  console.log("Tx Sent: https://sepolia.etherscan.io/tx/" + tx4.hash);
  await tx4.wait();
  console.log("REGULATOR_ROLE Confirmed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
