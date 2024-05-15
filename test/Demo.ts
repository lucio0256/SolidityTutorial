import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
  import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
  import { expect } from "chai";
  import hre, { ethers } from "hardhat";

  
  describe("Demo", function() {
    async function deploy() {
        const [owner, user1, user2, user3] =  await ethers.getSigners();
        const factory = await ethers.getContractFactory("Demo");
        const demoContract = await factory.deploy();
        await demoContract.waitForDeployment();
        return { owner, demoContract, user1, user2, user3 }
    }

    describe("Deployment", function() {
        it("should set the right owner", async function() {
            const { owner, demoContract } = await loadFixture(deploy);
            expect(await demoContract.owner()).to.equal(owner.address);
        })  
    })

    describe("Payment", function() {
        it("Should pay", async function() {
            const { owner, demoContract, user1 } = await loadFixture(deploy);
            const msg = "Hello from hardhat";
            const sum = 1000; // wei

            const payTx = await demoContract.connect(user1).pay(msg, {value: sum});
            await payTx.wait();

            await expect(payTx).to.changeEtherBalance(user1, -sum);
            await expect(payTx).to.changeEtherBalance(await demoContract.getAddress(), +sum);

            const newPayment = await demoContract.getPayment(user1.address, 0);
            expect(newPayment.message).to.eq(msg);
            expect(newPayment.amount).to.eq(sum);
            expect(newPayment.from).to.eq(user1.address);

        })
    })



  })