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
  
  // Get gas estimate for deployment
  const deployTransaction = await BaseDrumNFT.getDeployTransaction();
  const gasEstimate = await hre.ethers.provider.estimateGas(deployTransaction);
  const feeData = await hre.ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice;
  const estimatedCost = gasEstimate * gasPrice;
  
  console.log("Gas estimate:", gasEstimate.toString());
  console.log("Gas price:", hre.ethers.formatUnits(gasPrice, "gwei"), "Gwei");
  console.log("Estimated cost:", hre.ethers.formatEther(estimatedCost), "ETH");
  
  // Check if we have enough balance for deployment
  if (balance < estimatedCost) {
    console.log("❌ Insufficient balance for deployment");
    console.log("Required:", hre.ethers.formatEther(estimatedCost), "ETH");
    console.log("Available:", hre.ethers.formatEther(balance), "ETH");
    return;
  }

  // Deploy with explicit gas settings for speed
  console.log("✅ Starting deployment with higher gas price...");
  const baseDrumNFT = await BaseDrumNFT.deploy({
    gasLimit: 5000000,
    gasPrice: hre.ethers.parseUnits("0.01", "gwei") // Higher gas price for priority
  });
  
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