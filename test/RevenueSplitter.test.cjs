const { expect } = require('chai')
const { ethers } = require('hardhat')
const { getAddress, parseEther, parseUnits } = require('./helpers.cjs')

describe('RevenueSplitter', function () {
  let revenueSplitter, veXF, revenueToken, xfToken
  let owner, treasury, user1

  beforeEach(async function () {
    ;[owner, treasury, user1] = await ethers.getSigners()

    // Deploy XF token
    const MockERC20 = await ethers.getContractFactory('MockERC20')
    xfToken = await MockERC20.deploy('XFuel Token', 'XF', 18)
    await xfToken.waitForDeployment?.() || await xfToken.deployed?.()

    // Deploy veXF
    const VeXF = await ethers.getContractFactory('veXF')
    veXF = await VeXF.deploy(
      await getAddress(xfToken),
      await getAddress(owner)
    )
    await veXF.waitForDeployment?.() || await veXF.deployed?.()

    // Deploy revenue token (USDC with 6 decimals)
    revenueToken = await MockERC20.deploy('USD Coin', 'USDC', 6)
    await revenueToken.waitForDeployment?.() || await revenueToken.deployed?.()

    // Deploy RevenueSplitter
    const RevenueSplitter = await ethers.getContractFactory('RevenueSplitter')
    revenueSplitter = await RevenueSplitter.deploy(
      await getAddress(revenueToken),
      await getAddress(veXF),
      await getAddress(treasury),
      await getAddress(owner)
    )
    await revenueSplitter.waitForDeployment?.() || await revenueSplitter.deployed?.()

    // Mint revenue tokens to user1
    await revenueToken.mint(await getAddress(user1), parseUnits('1000000', 6))
  })

  afterEach(async function () {
    // Note: Removed hardhat_reset to avoid module loading issues
  })

  describe('Deployment', function () {
    it('Should set the correct revenue token', async function () {
      expect(await revenueSplitter.revenueToken()).to.equal(await getAddress(revenueToken))
    })

    it('Should set the correct veXF contract', async function () {
      expect(await revenueSplitter.veXFContract()).to.equal(await getAddress(veXF))
    })

    it('Should set the correct treasury', async function () {
      expect(await revenueSplitter.treasury()).to.equal(await getAddress(treasury))
    })

    it('Should initialize with zero totals', async function () {
      expect(await revenueSplitter.totalRevenueCollected()).to.equal(0)
      expect(await revenueSplitter.totalYieldDistributed()).to.equal(0)
      expect(await revenueSplitter.totalTreasurySent()).to.equal(0)
    })
  })

  describe('splitRevenue', function () {
    it('Should split revenue correctly (90% veXF, 10% treasury)', async function () {
      const amount = parseUnits('1000', 6) // 1000 USDC

      await revenueToken.connect(user1).approve(await getAddress(revenueSplitter), amount)
      await revenueSplitter.connect(user1).splitRevenue(amount)

      // Check totals
      expect(await revenueSplitter.totalRevenueCollected()).to.equal(amount)

      // Check splits (50% yield, 25% buyback, 15% rXF, 10% treasury)
      const veXFYield = (amount * 5000n) / 10000n
      const buybackBurn = (amount * 2500n) / 10000n
      const rXFMint = (amount * 1500n) / 10000n
      const treasuryAmount = (amount * 1000n) / 10000n

      expect(await revenueSplitter.totalYieldDistributed()).to.equal(veXFYield)
      expect(await revenueSplitter.totalTreasurySent()).to.equal(treasuryAmount)
    })

    it('Should transfer tokens correctly', async function () {
      const amount = parseUnits('1000', 6)

      await revenueToken.connect(user1).approve(await getAddress(revenueSplitter), amount)
      await revenueSplitter.connect(user1).splitRevenue(amount)

      // RevenueSplitter should have received tokens
      // veXF should have received yield (50%)
      const veXFYield = (amount * 5000n) / 10000n
      expect(await revenueToken.balanceOf(await getAddress(veXF))).to.equal(veXFYield)

      // Treasury should have received 10%
      const treasuryAmount = (amount * 1000n) / 10000n
      expect(await revenueToken.balanceOf(await getAddress(treasury))).to.equal(treasuryAmount)
    })

    it('Should emit RevenueSplit event', async function () {
      const amount = parseUnits('1000', 6)

      await revenueToken.connect(user1).approve(await getAddress(revenueSplitter), amount)
      const tx = await revenueSplitter.connect(user1).splitRevenue(amount)
      const receipt = await tx.wait()

      const event = receipt.logs.find(
        log => {
          try {
            const parsed = revenueSplitter.interface.parseLog(log)
            return parsed?.name === 'RevenueSplit'
          } catch {
            return false
          }
        }
      )
      expect(event).to.not.be.undefined
    })

    it('Should fail with zero amount', async function () {
      await expect(
        revenueSplitter.connect(user1).splitRevenue(0)
      ).to.be.revertedWith('RevenueSplitter: amount must be greater than 0')
    })

    it('Should handle rounding correctly', async function () {
      // Test with amount that doesn't divide evenly
      const amount = parseUnits('1001', 6)

      await revenueToken.connect(user1).approve(await getAddress(revenueSplitter), amount)
      await revenueSplitter.connect(user1).splitRevenue(amount)

      // Total should match (with rounding handled)
      const splits = await revenueSplitter.calculateSplits(amount)
      const total = splits.veXFYield + splits.buybackBurn + splits.rXFMint + splits.treasuryAmount
      expect(total).to.equal(amount)
    })
  })

  describe('calculateSplits', function () {
    it('Should calculate splits correctly', async function () {
      const amount = parseUnits('1000', 6)

      const splits = await revenueSplitter.calculateSplits(amount)

      expect(splits.veXFYield).to.equal((amount * 5000n) / 10000n)
      expect(splits.buybackBurn).to.equal((amount * 2500n) / 10000n)
      expect(splits.rXFMint).to.equal((amount * 1500n) / 10000n)
      expect(splits.treasuryAmount).to.equal((amount * 1000n) / 10000n)
    })
  })

  describe('setVeXF', function () {
    it('Should set veXF contract (owner only)', async function () {
      const newVeXF = await ethers.getContractFactory('veXF')
      const newVeXFInstance = await newVeXF.deploy(
        await getAddress(xfToken),
        await getAddress(owner)
      )
      await newVeXFInstance.waitForDeployment?.() || await newVeXFInstance.deployed?.()

      await revenueSplitter.connect(owner).setVeXF(await getAddress(newVeXFInstance))
      expect(await revenueSplitter.veXFContract()).to.equal(await getAddress(newVeXFInstance))
    })

    it('Should fail if not owner', async function () {
      await expect(
        revenueSplitter.connect(user1).setVeXF(await getAddress(veXF))
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })
  })

  describe('setTreasury', function () {
    it('Should set treasury address (owner only)', async function () {
      const newTreasury = (await ethers.getSigners())[3]
      await revenueSplitter.connect(owner).setTreasury(await getAddress(newTreasury))
      expect(await revenueSplitter.treasury()).to.equal(await getAddress(newTreasury))
    })

    it('Should fail if not owner', async function () {
      await expect(
        revenueSplitter.connect(user1).setTreasury(await getAddress(treasury))
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })
  })

  describe('setBuybackBurner', function () {
    it('Should set buyback burner address (owner only)', async function () {
      const burner = (await ethers.getSigners())[3]
      await revenueSplitter.connect(owner).setBuybackBurner(await getAddress(burner))
      expect(await revenueSplitter.buybackBurner()).to.equal(await getAddress(burner))
    })
  })

  describe('setRXF', function () {
    it('Should set rXF contract address (owner only)', async function () {
      const rXF = (await ethers.getSigners())[3]
      await revenueSplitter.connect(owner).setRXF(await getAddress(rXF))
      expect(await revenueSplitter.rXFContract()).to.equal(await getAddress(rXF))
    })
  })
})

