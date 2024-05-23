const { expect } = require("chai")
const { ethers } = require("hardhat")

  describe("Auction", function() {
    let owner, seller, buyer, auct

    beforeEach(async function() {
      [owner, seller, buyer] = await ethers.getSigners();
      const factory = await ethers.getContractFactory("Auction");
      auct = await factory.deploy();
      await auct.waitForDeployment();
    })

    it("should set owner", async function() {

      expect(await auct.owner()).to.eq(owner)
    })

    async function delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
    }

    async function makeAuction() {
      const duration = 60;
      const startPrice = ethers.parseEther("3")
      const item = "Punk NFT"
      const discount = 150
      const tx = await auct.connect(seller).createAuction(
        startPrice,
        discount,
        item,
        duration
      )
      return { tx, duration, item, startPrice, discount }
    }


    describe("Test auction", function() {
      it("Create auction correctly", async function() {

        const { tx, duration, item, startPrice } = await makeAuction()
        const currectAuct = await auct.auctions(0)
        const block = await ethers.provider.getBlock(tx.blockNumber)

        expect(currectAuct.seller).to.eq(seller.address)
        expect(currectAuct.item).to.eq("Punk NFT")
        expect(currectAuct.startAt).to.eq(block.timestamp)
        expect(currectAuct.endsAt).to.eq(block.timestamp + duration)
        await expect(tx).to.emit(auct, "AuctionCreated").withArgs(0, item, startPrice, duration)
      })

      it("not enough funds", async function() {
        const tx = await makeAuction()
        const buyTxNoFunds = auct.connect(buyer).buy(0, {
          value: ethers.parseEther("1")
        })  

        await expect(buyTxNoFunds).to.be.revertedWith("Not enough funds")

      })

      it("should buy", async function() {
        const { tx, duration, item, startPrice, discount } = await makeAuction()

        this.timeout(10000) // 10 sec
        await delay(5000) // 5 sec

        const buyTx = await auct.connect(buyer).buy(0, {
          value: ethers.parseEther("5")
        })  

        const currectAuct = await auct.auctions(0)
        const finalPrice = currectAuct.startPrice - ethers.parseUnits((discount * 5).toString(), "wei")
        const refund = buyTx.value - finalPrice
        
        // Check buyer correctly pay for the item
        await expect(buyTx).to.changeEtherBalance(buyer, -finalPrice)

        // check seller has received their revenue minus fee
        await expect(buyTx).to.changeEtherBalance(seller, finalPrice - (finalPrice * ethers.toBigInt(10)) / ethers.toBigInt(100)) 

        expect(currectAuct.finalPrice).to.eq(finalPrice)
        expect(currectAuct.stopped).to.eq(true)
        await expect(buyTx).to.emit(auct, "AuctionEnded").withArgs(0, finalPrice, buyer)

      })
    })
  })