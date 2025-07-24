const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Escrow", function () {
  // Fixture to deploy contracts
  async function deployContractsFixture() {
    const [buyer, seller, inspector, lender, other] = await ethers.getSigners();

    // Deploy RealEstate
    const RealEstate = await ethers.getContractFactory("RealEstate");
    const realEstate = await RealEstate.deploy();

    // Mint a property
    await realEstate.connect(seller).mint(
      "https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS"
    );

    // Deploy Escrow
    const Escrow = await ethers.getContractFactory("Escrow");
    const escrow = await Escrow.deploy(
      await realEstate.getAddress(),
      seller.address,
      inspector.address,
      lender.address
    );

    // Approve and list property
    await realEstate.connect(seller).approve(await escrow.getAddress(), 1);
    await escrow.connect(seller).list(
      1,
      buyer.address,
      ethers.parseEther("10"),
      ethers.parseEther("5")
    );

    return { realEstate, escrow, buyer, seller, inspector, lender, other };
  }

  describe("Deployment", function () {
    it("Should set the correct NFT address", async function () {
      const { realEstate, escrow } = await loadFixture(deployContractsFixture);
      expect(await escrow.nftAddress()).to.equal(await realEstate.getAddress());
    });

    it("Should set the correct seller", async function () {
      const { escrow, seller } = await loadFixture(deployContractsFixture);
      expect(await escrow.seller()).to.equal(seller.address);
    });

    it("Should set the correct inspector", async function () {
      const { escrow, inspector } = await loadFixture(deployContractsFixture);
      expect(await escrow.inspector()).to.equal(inspector.address);
    });

    it("Should set the correct lender", async function () {
      const { escrow, lender } = await loadFixture(deployContractsFixture);
      expect(await escrow.lender()).to.equal(lender.address);
    });
  });

  describe("Listing", function () {
    it("Should update property as listed", async function () {
      const { escrow } = await loadFixture(deployContractsFixture);
      expect(await escrow.isListed(1)).to.be.true;
    });

    it("Should set the correct buyer", async function () {
      const { escrow, buyer } = await loadFixture(deployContractsFixture);
      expect(await escrow.buyer(1)).to.equal(buyer.address);
    });

    it("Should set the correct purchase price", async function () {
      const { escrow } = await loadFixture(deployContractsFixture);
      expect(await escrow.purchasePrice(1)).to.equal(ethers.parseEther("10"));
    });

    it("Should set the correct escrow amount", async function () {
      const { escrow } = await loadFixture(deployContractsFixture);
      expect(await escrow.escrowAmount(1)).to.equal(ethers.parseEther("5"));
    });

    it("Should transfer ownership to escrow", async function () {
      const { realEstate, escrow } = await loadFixture(deployContractsFixture);
      expect(await realEstate.ownerOf(1)).to.equal(await escrow.getAddress());
    });
  });

  describe("Deposits", function () {
    it("Should update contract balance", async function () {
      const { escrow, buyer } = await loadFixture(deployContractsFixture);
      
      await escrow.connect(buyer).depositEarnest(1, { 
        value: ethers.parseEther("5") 
      });
      
      expect(await escrow.getBalance()).to.equal(ethers.parseEther("5"));
    });

    it("Should revert if deposit is less than escrow amount", async function () {
      const { escrow, buyer } = await loadFixture(deployContractsFixture);
      
      await expect(
        escrow.connect(buyer).depositEarnest(1, { 
          value: ethers.parseEther("3") 
        })
      ).to.be.revertedWithCustomError(escrow, "InsufficientEarnestAmount");
    });

    it("Should revert if non-buyer tries to deposit", async function () {
      const { escrow, other } = await loadFixture(deployContractsFixture);
      
      await expect(
        escrow.connect(other).depositEarnest(1, { 
          value: ethers.parseEther("5") 
        })
      ).to.be.revertedWithCustomError(escrow, "OnlyBuyer");
    });
  });

  describe("Inspection", function () {
    it("Should update inspection status", async function () {
      const { escrow, inspector } = await loadFixture(deployContractsFixture);
      
      await escrow.connect(inspector).updateInspectionStatus(1, true);
      expect(await escrow.inspectionPassed(1)).to.be.true;
    });

    it("Should revert if non-inspector tries to update", async function () {
      const { escrow, other } = await loadFixture(deployContractsFixture);
      
      await expect(
        escrow.connect(other).updateInspectionStatus(1, true)
      ).to.be.revertedWithCustomError(escrow, "OnlyInspector");
    });
  });

  describe("Approval", function () {
    it("Should update approval status for buyer", async function () {
      const { escrow, buyer } = await loadFixture(deployContractsFixture);
      
      await escrow.connect(buyer).approveSale(1);
      expect(await escrow.approval(1, buyer.address)).to.be.true;
    });

    it("Should update approval status for seller", async function () {
      const { escrow, seller } = await loadFixture(deployContractsFixture);
      
      await escrow.connect(seller).approveSale(1);
      expect(await escrow.approval(1, seller.address)).to.be.true;
    });

    it("Should update approval status for lender", async function () {
      const { escrow, lender } = await loadFixture(deployContractsFixture);
      
      await escrow.connect(lender).approveSale(1);
      expect(await escrow.approval(1, lender.address)).to.be.true;
    });
  });

  describe("Sale", function () {
    async function setupSaleFixture() {
      const contracts = await deployContractsFixture();
      const { escrow, buyer, seller, inspector, lender } = contracts;

      // Deposit earnest
      await escrow.connect(buyer).depositEarnest(1, { 
        value: ethers.parseEther("5") 
      });

      // Update inspection status
      await escrow.connect(inspector).updateInspectionStatus(1, true);

      // Approve sale from all parties
      await escrow.connect(buyer).approveSale(1);
      await escrow.connect(seller).approveSale(1);
      await escrow.connect(lender).approveSale(1);

      // Lender sends remaining funds
      await lender.sendTransaction({
        to: await escrow.getAddress(),
        value: ethers.parseEther("5")
      });

      return contracts;
    }

    it("Should transfer ownership to buyer", async function () {
      const { realEstate, escrow, buyer, seller } = await loadFixture(setupSaleFixture);
      
      await escrow.connect(seller).finalizeSale(1);
      expect(await realEstate.ownerOf(1)).to.equal(buyer.address);
    });

    it("Should transfer funds to seller", async function () {
      const { escrow, seller } = await loadFixture(setupSaleFixture);
      
      const initialBalance = await ethers.provider.getBalance(seller.address);
      const tx = await escrow.connect(seller).finalizeSale(1);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const finalBalance = await ethers.provider.getBalance(seller.address);
      
      expect(finalBalance).to.equal(
        initialBalance + ethers.parseEther("10") - gasUsed
      );
    });

    it("Should clear contract balance", async function () {
      const { escrow, seller } = await loadFixture(setupSaleFixture);
      
      await escrow.connect(seller).finalizeSale(1);
      expect(await escrow.getBalance()).to.equal(0);
    });

    it("Should mark property as not listed", async function () {
      const { escrow, seller } = await loadFixture(setupSaleFixture);
      
      await escrow.connect(seller).finalizeSale(1);
      expect(await escrow.isListed(1)).to.be.false;
    });

    it("Should revert if inspection not passed", async function () {
      const { escrow, buyer, seller, lender } = await loadFixture(deployContractsFixture);
      
      await escrow.connect(buyer).depositEarnest(1, { 
        value: ethers.parseEther("5") 
      });
      await escrow.connect(buyer).approveSale(1);
      await escrow.connect(seller).approveSale(1);
      await escrow.connect(lender).approveSale(1);
      
      await expect(
        escrow.connect(seller).finalizeSale(1)
      ).to.be.revertedWithCustomError(escrow, "InspectionNotPassed");
    });

    it("Should revert if not all parties approved", async function () {
      const { escrow, buyer, inspector } = await loadFixture(deployContractsFixture);
      
      await escrow.connect(buyer).depositEarnest(1, { 
        value: ethers.parseEther("5") 
      });
      await escrow.connect(inspector).updateInspectionStatus(1, true);
      await escrow.connect(buyer).approveSale(1);
      
      await expect(
        escrow.connect(buyer).finalizeSale(1)
      ).to.be.revertedWithCustomError(escrow, "NotAllPartiesApproved");
    });
  });

  describe("Cancel Sale", function () {
    it("Should refund buyer if inspection failed", async function () {
      const { escrow, buyer } = await loadFixture(deployContractsFixture);
      
      await escrow.connect(buyer).depositEarnest(1, { 
        value: ethers.parseEther("5") 
      });
      
      const initialBalance = await ethers.provider.getBalance(buyer.address);
      const tx = await escrow.connect(buyer).cancelSale(1);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const finalBalance = await ethers.provider.getBalance(buyer.address);
      
      expect(finalBalance).to.be.closeTo(
        initialBalance + ethers.parseEther("5") - gasUsed,
        ethers.parseEther("0.01") // Allow for small rounding differences
      );
    });

    it("Should send funds to seller if inspection passed", async function () {
      const { escrow, buyer, seller, inspector } = await loadFixture(deployContractsFixture);
      
      await escrow.connect(buyer).depositEarnest(1, { 
        value: ethers.parseEther("5") 
      });
      await escrow.connect(inspector).updateInspectionStatus(1, true);
      
      const initialBalance = await ethers.provider.getBalance(seller.address);
      const tx = await escrow.connect(seller).cancelSale(1);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const finalBalance = await ethers.provider.getBalance(seller.address);
      
      expect(finalBalance).to.equal(
        initialBalance + ethers.parseEther("5") - gasUsed
      );
    });

    it("Should return NFT to seller", async function () {
      const { realEstate, escrow, buyer, seller } = await loadFixture(deployContractsFixture);
      
      await escrow.connect(buyer).cancelSale(1);
      expect(await realEstate.ownerOf(1)).to.equal(seller.address);
    });

    it("Should only allow buyer or seller to cancel", async function () {
      const { escrow, other } = await loadFixture(deployContractsFixture);
      
      await expect(
        escrow.connect(other).cancelSale(1)
      ).to.be.revertedWith("Only buyer or seller can cancel");
    });
  });
});