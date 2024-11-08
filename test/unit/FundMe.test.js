const { expect } = require("chai")
const { network, deployments, etehrs, getNamedAccounts } = require("hardhat")
const { describe } = require("node:test")

describe("FundMe", async () => {
  let fundMe
  let deployer
  beforeEach(async () => {
    deployer = (await getNamedAccounts()).deployer
    await deployments.fixture(["all"])
    fundMe = await ethers.getContract("FundMe", deployer)
    mockV3Aggregator = await ethers.getContract("mockV3Aggregator", deployer)
  })

  describe("constructor", function () {
    it("sets the aggregator addresses correctly", async () => {
      const response = await fundMe.getPriceFeed()
      assert.equal(response, mockV3Aggregator.address)
    })
  })

  describe("fund", () => {
    it("Fails if you dont send enough ETH", async () => {
      await expect(fundMe.fund()).to.be.revertedWith(
        "You need to spend more ETH!"
      )
    })
  })
})
