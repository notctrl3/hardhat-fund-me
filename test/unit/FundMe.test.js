const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { describe, beforeEach } = require("node:test")

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
    })
  })
})
