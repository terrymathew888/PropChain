const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const tokens = (n) => {
  return hre.ethers.parseEther(n.toString());
}

async function main() {
  console.log("Starting deployment...");
  
  // Setup accounts
  const [buyer, seller, inspector, lender] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with the following addresses:");
  console.log("Seller:", seller.address);
  console.log("Buyer:", buyer.address);
  console.log("Inspector:", inspector.address);
  console.log("Lender:", lender.address);
  console.log("---");

  // Deploy Real Estate
  console.log("Deploying RealEstate contract...");
  const RealEstate = await hre.ethers.getContractFactory("RealEstate");
  const realEstate = await RealEstate.deploy();
  await realEstate.waitForDeployment();
  const realEstateAddress = await realEstate.getAddress();
  
  console.log(`RealEstate deployed to: ${realEstateAddress}`);
  console.log("Minting 3 properties...\n");

  // Mint properties
  for (let i = 0; i < 3; i++) {
    const tx = await realEstate.connect(seller).mint(
      `https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${i + 1}.json`
    );
    await tx.wait();
    console.log(`Property ${i + 1} minted`);
  }

  // Deploy Escrow
  console.log("\nDeploying Escrow contract...");
  const Escrow = await hre.ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(
    realEstateAddress,
    seller.address,
    inspector.address,
    lender.address
  );
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  
  console.log(`Escrow deployed to: ${escrowAddress}`);
  console.log("Listing 3 properties...\n");

  // Approve properties for escrow
  for (let i = 0; i < 3; i++) {
    let tx = await realEstate.connect(seller).approve(escrowAddress, i + 1);
    await tx.wait();
  }

  // List properties
  let tx = await escrow.connect(seller).list(1, buyer.address, tokens(20), tokens(10));
  await tx.wait();
  console.log("Property 1 listed: Price 20 ETH, Escrow 10 ETH");

  tx = await escrow.connect(seller).list(2, buyer.address, tokens(15), tokens(5));
  await tx.wait();
  console.log("Property 2 listed: Price 15 ETH, Escrow 5 ETH");

  tx = await escrow.connect(seller).list(3, buyer.address, tokens(10), tokens(5));
  await tx.wait();
  console.log("Property 3 listed: Price 10 ETH, Escrow 5 ETH");

  // Save deployment addresses
  const chainId = hre.network.config.chainId;
  const deployedAddresses = {
    [chainId]: {
      realEstate: {
        address: realEstateAddress
      },
      escrow: {
        address: escrowAddress
      },
      deployer: seller.address,
      buyer: buyer.address,
      inspector: inspector.address,
      lender: lender.address,
      deploymentTime: new Date().toISOString()
    }
  };

  const deploymentPath = path.join(__dirname, "../src/config/deployedAddresses.json");
  
  // Read existing deployments if file exists
  let existingDeployments = {};
  if (fs.existsSync(deploymentPath)) {
    existingDeployments = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  }
  
  // Merge with new deployment
  const updatedDeployments = { ...existingDeployments, ...deployedAddresses };
  
  // Write updated deployments
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(updatedDeployments, null, 2)
  );

  console.log("\n✅ Deployment completed successfully!");
  console.log(`📁 Deployment addresses saved to: ${deploymentPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });