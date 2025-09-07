const hre = require("hardhat");

async function main() {
  console.log("Deploying BaseDrumNFT to", hre.network.name);
  
  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");
  
  // Deploy the contract
  console.log("\nDeploying BaseDrumNFT...");
  const BaseDrumNFT = await hre.ethers.getContractFactory("BaseDrumNFT");
  
  // Deploy with constructor arguments if needed (none in this case)
  const baseDrumNFT = await BaseDrumNFT.deploy();
  
  // Wait for deployment
  await baseDrumNFT.waitForDeployment();
  
  const contractAddress = await baseDrumNFT.getAddress();
  console.log("✅ BaseDrumNFT deployed to:", contractAddress);
  
  // Log deployment details
  console.log("\n📋 Deployment Summary:");
  console.log("Contract Name: BaseDrumNFT");
  console.log("Network:", hre.network.name);
  console.log("Contract Address:", contractAddress);
  console.log("Deployer:", deployer.address);
  console.log("Block Explorer:", getBlockExplorerUrl(hre.network.name, contractAddress));
  
  // Verify contract if on testnet/mainnet
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n⏳ Waiting before verification...");
    await sleep(30000); // Wait 30 seconds
    
    try {
      console.log("🔍 Verifying contract...");
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified!");
    } catch (error) {
      console.log("❌ Verification failed:", error.message);
    }
  }
}

function getBlockExplorerUrl(networkName, address) {
  switch (networkName) {
    case 'baseSepolia':
      return `https://sepolia-explorer.base.org/address/${address}`;
    case 'base':
      return `https://basescan.org/address/${address}`;
    default:
      return `Address: ${address}`;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });