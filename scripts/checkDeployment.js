const hre = require("hardhat");

async function main() {
  console.log("Checking deployment...\n");
  
  // Get the deployed addresses from the config
  const fs = require("fs");
  const path = require("path");
  const configPath = path.join(__dirname, "../src/config/deployedAddresses.json");
  
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const chainId = hre.network.config.chainId;
    
    console.log("Current Chain ID:", chainId);
    console.log("Config contains:", Object.keys(config));
    
    if (config[chainId]) {
      console.log("\nDeployed addresses for chain", chainId);
      console.log("RealEstate:", config[chainId].realEstate.address);
      console.log("Escrow:", config[chainId].escrow.address);
      
      // Try to interact with the contract
      try {
        const RealEstate = await hre.ethers.getContractAt(
          "RealEstate",
          config[chainId].realEstate.address
        );
        
        const totalSupply = await RealEstate.totalSupply();
        console.log("\n✅ Contract is valid! Total supply:", totalSupply.toString());
      } catch (error) {
        console.log("\n❌ Error accessing contract:", error.message);
        console.log("\n🔄 You need to redeploy the contracts!");
      }
    } else {
      console.log("\n❌ No deployment found for chain ID:", chainId);
      console.log("🔄 Please run: npm run deploy");
    }
  } else {
    console.log("❌ No deployment config found at:", configPath);
    console.log("🔄 Please run: npm run deploy");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});