const hre = require("hardhat");

async function main() {
  console.log("Checking nonce and pending transactions...");
  
  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Account:", deployer.address);
  
  // Check current nonce
  const currentNonce = await hre.ethers.provider.getTransactionCount(deployer.address, "latest");
  const pendingNonce = await hre.ethers.provider.getTransactionCount(deployer.address, "pending");
  
  console.log("Current nonce (latest):", currentNonce);
  console.log("Pending nonce:", pendingNonce);
  
  if (currentNonce !== pendingNonce) {
    console.log("⚠️  There are", pendingNonce - currentNonce, "pending transactions");
    console.log("You may need to wait for them to confirm or replace them");
  } else {
    console.log("✅ No pending transactions");
  }
  
  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  }); 