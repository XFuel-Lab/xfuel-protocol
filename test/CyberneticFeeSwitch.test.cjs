const { expect } = require('chai')
const { ethers } = require('hardhat')
const { getAddress, parseEther } = require('./helpers.cjs')

describe('CyberneticFeeSwitch', function () {
  let feeSwitch, veXF, xfToken
  let owner, user1, user2

  beforeEach(async function () {
    ;[owner, user1, user2] = await ethers.getSigners()

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

    // Deploy CyberneticFeeSwitch
    const CyberneticFeeSwitch = await ethers.getContractFactory('CyberneticFeeSwitch')
    feeSwitch = await CyberneticFeeSwitch.deploy(
      await getAddress(veXF),
      await getAddress(owner)
    )
    await feeSwitch.waitForDeployment?.() || await feeSwitch.deployed?.()

    // Mint XF tokens and create locks for users
    await xfToken.mint(await getAddress(user1), parseEther('10000'))
    await xfToken.mint(await getAddress(user2), parseEther('10000'))
  })

  afterEach(async function () {
    // Note: Removed hardhat_reset to avoid module loading issues
  })

  describe('Deployment', function () {
    it('Should set the correct veXF contract', async function () {
      expect(await feeSwitch.veXFContract()).to.equal(await getAddress(veXF))
    })

    it('Should set the correct owner', async function () {
      expect(await feeSwitch.owner()).to.equal(await getAddress(owner))
    })

    it('Should initialize with fees enabled', async function () {
      expect(await feeSwitch.feesEnabled()).to.equal(true)
    })

    it('Should initialize in Growth mode', async function () {
      expect(await feeSwitch.currentMode()).to.equal(0) // Growth = 0
      expect(await feeSwitch.currentFeeBps()).to.equal(10) // 0.1%
    })
  })

  describe('setFeesEnabled', function () {
    it('Should disable fees (owner)', async function () {
      await feeSwitch.connect(owner).setFeesEnabled(false)
      expect(await feeSwitch.feesEnabled()).to.equal(false)
      expect(await feeSwitch.isFeesEnabled()).to.equal(false)
    })

    it('Should enable fees (owner)', async function () {
      await feeSwitch.connect(owner).setFeesEnabled(false)
      await feeSwitch.connect(owner).setFeesEnabled(true)
      expect(await feeSwitch.feesEnabled()).to.equal(true)
    })

    it('Should fail if not owner and no min veXF', async function () {
      await expect(
        feeSwitch.connect(user1).setFeesEnabled(false)
      ).to.be.revertedWith('CyberneticFeeSwitch: unauthorized')
    })
  })

  describe('setFeeMode', function () {
    it('Should change to Extraction mode (owner)', async function () {
      await feeSwitch.connect(owner).setFeeMode(1) // Extraction = 1
      expect(await feeSwitch.currentMode()).to.equal(1)
      expect(await feeSwitch.currentFeeBps()).to.equal(100) // 1.0%
    })

    it('Should change back to Growth mode (owner)', async function () {
      await feeSwitch.connect(owner).setFeeMode(1)
      await feeSwitch.connect(owner).setFeeMode(0) // Growth = 0
      expect(await feeSwitch.currentMode()).to.equal(0)
      expect(await feeSwitch.currentFeeBps()).to.equal(10) // 0.1%
    })

    it('Should emit FeeModeChanged event', async function () {
      const tx = await feeSwitch.connect(owner).setFeeMode(1)
      const receipt = await tx.wait()

      const event = receipt.logs.find(
        log => {
          try {
            const parsed = feeSwitch.interface.parseLog(log)
            return parsed?.name === 'FeeModeChanged'
          } catch {
            return false
          }
        }
      )
      expect(event).to.not.be.undefined
    })

    it('Should enforce cooldown period', async function () {
      await feeSwitch.connect(owner).setFeeMode(1)
      await expect(
        feeSwitch.connect(owner).setFeeMode(0)
      ).to.be.revertedWith('CyberneticFeeSwitch: cooldown active')
    })

    it('Should allow change after cooldown', async function () {
      await feeSwitch.connect(owner).setFeeMode(1)
      
      // Fast forward time
      await ethers.provider.send('evm_increaseTime', [7 * 24 * 3600 + 1]) // 7 days + 1 second
      await ethers.provider.send('evm_mine', [])

      await feeSwitch.connect(owner).setFeeMode(0)
      expect(await feeSwitch.currentMode()).to.equal(0)
    })
  })

  describe('setCustomFee', function () {
    it('Should set custom fee (owner only)', async function () {
      await feeSwitch.connect(owner).setCustomFee(50) // 0.5%
      expect(await feeSwitch.currentFeeBps()).to.equal(50)
    })

    it('Should fail if fee too high', async function () {
      await expect(
        feeSwitch.connect(owner).setCustomFee(1001) // > 10%
      ).to.be.revertedWith('CyberneticFeeSwitch: fee too high')
    })

    it('Should fail if fee is zero', async function () {
      await expect(
        feeSwitch.connect(owner).setCustomFee(0)
      ).to.be.revertedWith('CyberneticFeeSwitch: fee must be greater than 0')
    })

    it('Should fail if not owner', async function () {
      await expect(
        feeSwitch.connect(user1).setCustomFee(50)
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })
  })

  describe('IFeeAdapter interface', function () {
    it('Should return correct fee multiplier', async function () {
      expect(await feeSwitch.getFeeMultiplier()).to.equal(10) // 0.1% in Growth mode

      await feeSwitch.connect(owner).setFeeMode(1)
      expect(await feeSwitch.getFeeMultiplier()).to.equal(100) // 1.0% in Extraction mode

      await feeSwitch.connect(owner).setFeesEnabled(false)
      expect(await feeSwitch.getFeeMultiplier()).to.equal(0) // 0% when disabled
    })

    it('Should return correct effective fee', async function () {
      const baseFee = 500 // 5% base fee

      // Growth mode: 0.1% of 5% = 0.005% effective
      let effectiveFee = await feeSwitch.getEffectiveFee(baseFee)
      expect(effectiveFee).to.equal((baseFee * 10) / 10000)

      // Extraction mode: 1.0% of 5% = 0.05% effective
      await feeSwitch.connect(owner).setFeeMode(1)
      effectiveFee = await feeSwitch.getEffectiveFee(baseFee)
      expect(effectiveFee).to.equal((baseFee * 100) / 10000)

      // Disabled: 0% effective
      await feeSwitch.connect(owner).setFeesEnabled(false)
      effectiveFee = await feeSwitch.getEffectiveFee(baseFee)
      expect(effectiveFee).to.equal(0)
    })
  })

  describe('Cooldown functions', function () {
    it('Should report cooldown as active after fee change', async function () {
      await feeSwitch.connect(owner).setFeeMode(1)
      expect(await feeSwitch.isCooldownActive()).to.equal(true)
    })

    it('Should report cooldown time remaining', async function () {
      await feeSwitch.connect(owner).setFeeMode(1)
      const remaining = await feeSwitch.getCooldownTimeRemaining()
      expect(remaining).to.be.gt(0)
      expect(remaining).to.be.lte(7 * 24 * 3600)
    })

    it('Should report cooldown as inactive after time passes', async function () {
      await feeSwitch.connect(owner).setFeeMode(1)
      
      // Fast forward time
      await hre.network.provider.send('evm_increaseTime', [7 * 24 * 3600 + 1])
      await hre.network.provider.send('evm_mine')

      expect(await feeSwitch.isCooldownActive()).to.equal(false)
      expect(await feeSwitch.getCooldownTimeRemaining()).to.equal(0)
    })
  })

  describe('setMinVeXF', function () {
    it('Should set minimum veXF for fee changes (owner only)', async function () {
      await feeSwitch.connect(owner).setMinVeXF(parseEther('2000'))
      expect(await feeSwitch.minVeXFForFeeChange()).to.equal(parseEther('2000'))
    })

    it('Should fail if not owner', async function () {
      await expect(
        feeSwitch.connect(user1).setMinVeXF(parseEther('2000'))
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })
  })
})

