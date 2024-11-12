const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")

describe("FundMe", async () => {
  let fundMe
  let deployer
  let mockV3Aggregator
  let sendValue = ethers.utils.parseEther("1")
  beforeEach(async () => {
    // deploy our contracts using Hardhat-deploy
    // const accounts = await ethers.getSigners()
    // const accountZero = accounts[0]
    deployer = (await getNamedAccounts()).deployer
    await deployments.fixture(["all"])
    fundMe = await ethers.getContract("FundMe", deployer)
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer)
  })

  describe("constructor", function () {
    it("sets the aggregator addresses correctly", async () => {
      const response = await fundMe.getPriceFeed()
      assert.equal(response, mockV3Aggregator.address)
    })
  })

  describe("fund", () => {
    it("Fails if you dont send enough ETH", async () => {
      // get more info on ethereum-waffle.readthedocs.io
      await expect(fundMe.fund()).to.be.revertedWith(
        "You need to spend more ETH!"
      )
    })
    it("updated the amount funded data structure", async () => {
      await fundMe.fund({ value: sendValue })
      const response = await fundMe.getAddressToAmountFunded(deployer)
      assert.equal(response.toString(), sendValue.toString())
    })
    it("Adds funder to array of funders", async () => {
      await fundMe.fund({ value: sendValue })
      const response = await fundMe.getFunder(0)
      assert.equal(response, deployer)
    })

    describe("withdraw", () => {
      beforeEach(async () => {
        await fundMe.fund({ value: sendValue })
      })
      it("withdraws ETH from a single funder", async () => {
        // can also use ethers.provider.getbalance
        const startingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        )
        const startingDeployerBalance = await fundMe.provider.getBalance(
          deployer
        )

        const txRes = await fundMe.withdraw()
        const transactionReceipt = await txRes.wait()
        const { gasUsed, effectiveGasPrice } = transactionReceipt
        const gasCost = gasUsed.mul(effectiveGasPrice)

        const endingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        )
        const endingDeployerBalance = await fundMe.provider.getBalance(deployer)
        assert.equal(endingFundMeBalance, 0)
        assert.equal(
          startingFundMeBalance.add(startingDeployerBalance).toString(),
          endingDeployerBalance.add(gasCost).toString()
        )
      })
      it("is allows us to withdraw with mutiple funders", async () => {
        const accounts = await ethers.getSigners()
        for (i = 1; i < 6; i++) {
          const fundMeConnectedContract = await fundMe.connect(accounts[i])
          await fundMeConnectedContract.fund({ value: sendValue })
        }
        const startingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        )
        const startingDeployerBalance = await fundMe.provider.getBalance(
          deployer
        )
        const txRes = await fundMe.withdraw()
        const transactionReceipt = await txRes.wait()
        const { gasUsed, effectiveGasPrice } = transactionReceipt
        const gasCost = gasUsed.mul(effectiveGasPrice)
        const endingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        )
        const endingDeployerBalance = await fundMe.provider.getBalance(deployer)
        assert.equal(endingFundMeBalance, 0)
        assert.equal(
          startingFundMeBalance.add(startingDeployerBalance).toString(),
          endingDeployerBalance.add(gasCost).toString()
        )
        await expect(fundMe.getFunder(0)).to.be.reverted
        for (i = 1; i < 6; i++) {
          assert.equal(
            await fundMe.getAddressToAmountFunded(accounts[i].address),
            0
          )
        }
      })
      it("Only allows the owner to withdraw", async () => {
        const accounts = await ethers.getSigners()
        const attacter = await fundMe.connect(accounts[1])
        await expect(attacter.withdraw()).to.be.revertedWith("FundMe__NotOwner")
      })
    })
  })
})
