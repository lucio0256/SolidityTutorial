import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
  import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
  import { expect } from "chai";
  import hre, { ethers } from "hardhat";

  describe("Demo2", function() {
    async function deploy() {
        const [owner, user1, user2] = await ethers.getSigners();
        const factory = await ethers.getContractFactory("Demo2");
        const demoContract = await factory.deploy();
        await demoContract.waitForDeployment();
        return {owner, user1, user2, demoContract};
    }

    describe("Payment2", function() {
        it("should allow to send money", async function() {
            const { owner, user1, user2, demoContract } = await loadFixture(deploy);
            const sum = ethers.parseEther("1.0");

            const payTx = await user2.sendTransaction(
                {
                    to: demoContract.target, 
                    value: sum
                })
            await payTx.wait();
            const block = await ethers.provider.getBlock(payTx.blockNumber)

            await expect(payTx).to.changeEtherBalance(user2, -sum);
            await expect(payTx).to.changeEtherBalance(demoContract, sum);
            await expect(payTx).to.emit(demoContract, "Paid").withArgs(user2.address, sum, block?.timestamp);
        });

        it("test withdraw", async function() {
            const { owner, user1, user2, demoContract } = await loadFixture(deploy);
            const sum = ethers.parseEther("1.5");
            const topUp = await demoContract.connect(user2).pay({ value: sum})
            
            const notOwnerTx = async () => await demoContract.connect(user1).withdraw(user1.address);
            const ownerTx = async () => await demoContract.connect(owner).withdraw(owner.address);

            await expect(notOwnerTx()).to.be.revertedWith("you are not an owner!")
            
            await expect(ownerTx()).to.changeEtherBalance(demoContract.target, -sum)
            

        })
    })

  })