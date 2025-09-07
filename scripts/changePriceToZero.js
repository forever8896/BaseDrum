const hre = require("hardhat");

async function main() {
  console.log("Changing mint price to 0 on", hre.network.name);
  
  // Contract address (update this to your deployed contract address)
  const CONTRACT_ADDRESS = "0x20585aCAD03AC611BeE6Ed70E6EF6D0E9A5AD18c";
  
  // Get the owner account (first signer)
  const [owner] = await hre.ethers.getSigners();
  console.log("Owner account:", owner.address);
  
  // Check balance
  const balance = await hre.ethers.provider.getBalance(owner.address);
  console.log("Owner balance:", hre.ethers.formatEther(balance), "ETH");
  
  // Get contract instance
  console.log("\nConnecting to BaseDrumNFT contract at:", CONTRACT_ADDRESS);
  const BaseDrumNFT = await hre.ethers.getContractFactory("BaseDrumNFT");
  const contract = BaseDrumNFT.attach(CONTRACT_ADDRESS);
  
  // Check current mint price
  const currentPrice = await contract.mintPrice();
  console.log("Current mint price:", hre.ethers.formatEther(currentPrice), "ETH");
  
  // Check if we're the owner
  const contractOwner = await contract.owner();
  console.log("Contract owner:", contractOwner);
  
  if (owner.address.toLowerCase() !== contractOwner.toLowerCase()) {
    console.error("❌ Error: You are not the owner of this contract!");
    console.log("Your address:", owner.address);
    console.log("Contract owner:", contractOwner);
    process.exit(1);
  }
  
  // Get gas estimate for setMintPrice
  console.log("\nEstimating gas for setMintPrice transaction...");
  const gasEstimate = await contract.setMintPrice.estimateGas(0);
  const feeData = await hre.ethers.provider.getFeeData();
  
  // Increase gas price by 20% for faster confirmation
  const baseGasPrice = feeData.gasPrice;
  const gasPrice = baseGasPrice + (baseGasPrice * 20n / 100n); // 20% increase
  const estimatedCost = gasEstimate * gasPrice;
  
  console.log("Gas estimate:", gasEstimate.toString());
  console.log("Base gas price:", hre.ethers.formatUnits(baseGasPrice, "gwei"), "Gwei");
  console.log("Boosted gas price:", hre.ethers.formatUnits(gasPrice, "gwei"), "Gwei (+20%)");
  console.log("Estimated cost:", hre.ethers.formatEther(estimatedCost), "ETH");
  
  // Check if we have enough balance for the transaction
  if (balance < estimatedCost) {
    console.error("❌ Insufficient balance for transaction!");
    console.log("Required:", hre.ethers.formatEther(estimatedCost), "ETH");
    console.log("Available:", hre.ethers.formatEther(balance), "ETH");
    process.exit(1);
  }
  
  // Change mint price to 0
  console.log("\n🔄 Changing mint price to 0 ETH...");
  const tx = await contract.setMintPrice(0, {
    gasPrice: gasPrice,
    gasLimit: gasEstimate + (gasEstimate * 10n / 100n) // Add 10% buffer to gas limit
  });
  console.log("Transaction hash:", tx.hash);
  console.log("Used gas price:", hre.ethers.formatUnits(gasPrice, "gwei"), "Gwei");
  
  // Wait for confirmation
  console.log("⏳ Waiting for confirmation...");
  const receipt = await tx.wait();
  
  if (receipt.status === 1) {
    console.log("✅ Transaction confirmed!");
    console.log("Block number:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());
    
    // Verify the change
    const newPrice = await contract.mintPrice();
    console.log("\n✅ Mint price updated successfully!");
    console.log("Old price:", hre.ethers.formatEther(currentPrice), "ETH");
    console.log("New price:", hre.ethers.formatEther(newPrice), "ETH");
    
    // Explorer link
    const explorerUrl = hre.network.name === 'base' 
      ? `https://basescan.org/tx/${tx.hash}`
      : `https://sepolia.basescan.org/tx/${tx.hash}`;
    console.log("View on explorer:", explorerUrl);
    
  } else {
    console.error("❌ Transaction failed!");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  }); 