const { expect } = require('chai')
const { ethers } = require('hardhat')
const { getAddress, parseEther, getZeroAddress } = require('./helpers.cjs')

describe('veXF', function () {
  let veXF, xfToken
  let owner, user1, user2, treasury
  const MIN_LOCK = 1 * 7 * 24 * 3600 // 1 week in seconds
  const MAX_LOCK = 4 * 365 * 24 * 3600 // 4 years in seconds

  beforeEach(async function () {
    ;[owner, user1, user2, treasury] = await ethers.getSigners()

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

    // Mint XF tokens to users
    const amount = parseEther('10000')
    await xfToken.mint(await getAddress(user1), amount)
    await xfToken.mint(await getAddress(user2), amount)
  })

  afterEach(async function () {
    // Note: Removed hardhat_reset to avoid module loading issues
  })

  describe('Deployment', function () {
    it('Should set the correct XF token address', async function () {
      expect(await veXF.xfToken()).to.equal(await getAddress(xfToken))
    })

    it('Should set the correct owner', async function () {
      expect(await veXF.owner()).to.equal(await getAddress(owner))
    })

    it('Should initialize with zero total supply', async function () {
      expect(await veXF.totalSupply()).to.equal(0)
    })
  })

  describe('createLock', function () {
    it('Should create a new lock successfully', async function () {
      const amount = parseEther('1000')
      const unlockTime = Math.floor(Date.now() / 1000) + MAX_LOCK

      await xfToken.connect(user1).approve(await getAddress(veXF), amount)
      await veXF.connect(user1).createLock(amount, unlockTime)

      const lock = await veXF.getLock(await getAddress(user1))
      expect(lock.amount).to.equal(amount)
      expect(lock.unlockTime).to.equal(unlockTime)
    })

    it('Should fail with zero amount', async function () {
      const unlockTime = Math.floor(Date.now() / 1000) + MAX_LOCK
      await expect(
        veXF.connect(user1).createLock(0, unlockTime)
      ).to.be.revertedWith('veXF: amount must be greater than 0')
    })

    it('Should fail with unlock time in the past', async function () {
      const amount = parseEther('1000')
      const unlockTime = Math.floor(Date.now() / 1000) - 1000

      await xfToken.connect(user1).approve(await getAddress(veXF), amount)
      await expect(
        veXF.connect(user1).createLock(amount, unlockTime)
      ).to.be.revertedWith('veXF: unlock time must be in future')
    })

    it('Should fail with lock duration too short', async function () {
      const amount = parseEther('1000')
      const unlockTime = Math.floor(Date.now() / 1000) + MIN_LOCK - 1

      await xfToken.connect(user1).approve(await getAddress(veXF), amount)
      await expect(
        veXF.connect(user1).createLock(amount, unlockTime)
      ).to.be.revertedWith('veXF: lock duration too short')
    })

    it('Should fail with lock duration too long', async function () {
      const amount = parseEther('1000')
      const unlockTime = Math.floor(Date.now() / 1000) + MAX_LOCK + 1

      await xfToken.connect(user1).approve(await getAddress(veXF), amount)
      await expect(
        veXF.connect(user1).createLock(amount, unlockTime)
      ).to.be.revertedWith('veXF: lock duration too long')
    })

    it('Should transfer XF tokens to contract', async function () {
      const amount = parseEther('1000')
      const unlockTime = Math.floor(Date.now() / 1000) + MAX_LOCK

      await xfToken.connect(user1).approve(await getAddress(veXF), amount)
      await veXF.connect(user1).createLock(amount, unlockTime)

      expect(await xfToken.balanceOf(await getAddress(veXF))).to.equal(amount)
      expect(await xfToken.balanceOf(await getAddress(user1))).to.equal(parseEther('9000'))
    })

    it('Should emit LockCreated event', async function () {
      const amount = parseEther('1000')
      const unlockTime = Math.floor(Date.now() / 1000) + MAX_LOCK

      await xfToken.connect(user1).approve(await getAddress(veXF), amount)
      const tx = await veXF.connect(user1).createLock(amount, unlockTime)
      const receipt = await tx.wait()

      const event = receipt.logs.find(
        log => {
          try {
            const parsed = veXF.interface.parseLog(log)
            return parsed?.name === 'LockCreated'
          } catch {
            return false
          }
        }
      )
      expect(event).to.not.be.undefined
    })
  })

  describe('balanceOf and votingPower', function () {
    it('Should calculate veXF balance correctly for max lock', async function () {
      const amount = parseEther('1000')
      const unlockTime = Math.floor(Date.now() / 1000) + MAX_LOCK

      await xfToken.connect(user1).approve(await getAddress(veXF), amount)
      await veXF.connect(user1).createLock(amount, unlockTime)

      const balance = await veXF.balanceOf(await getAddress(user1))
      const votingPower = await veXF.votingPower(await getAddress(user1))

      // For max lock (4 years), multiplier should be close to 4x
      // balance should be approximately amount * 4
      expect(balance).to.be.gte(parseEther('3500')) // At least 3.5x
      expect(balance).to.be.lte(parseEther('4000')) // At most 4x
      expect(balance).to.equal(votingPower)
    })

    it('Should calculate veXF balance correctly for min lock', async function () {
      const amount = parseEther('1000')
      const unlockTime = Math.floor(Date.now() / 1000) + MIN_LOCK

      await xfToken.connect(user1).approve(await getAddress(veXF), amount)
      await veXF.connect(user1).createLock(amount, unlockTime)

      const balance = await veXF.balanceOf(await getAddress(user1))

      // For min lock (1 week), multiplier should be close to 1x
      expect(balance).to.be.gte(parseEther('900')) // At least 0.9x
      expect(balance).to.be.lte(parseEther('1100')) // At most 1.1x
    })

    it('Should return zero balance after lock expires', async function () {
      const amount = parseEther('1000')
      const unlockTime = Math.floor(Date.now() / 1000) + MIN_LOCK

      await xfToken.connect(user1).approve(await getAddress(veXF), amount)
      await veXF.connect(user1).createLock(amount, unlockTime)

      // Fast forward time
      await ethers.provider.send('evm_increaseTime', [MIN_LOCK + 1])
      await ethers.provider.send('evm_mine', [])

      const balance = await veXF.balanceOf(await getAddress(user1))
      expect(balance).to.equal(0)
    })
  })

  describe('increaseAmount', function () {
    it('Should increase lock amount successfully', async function () {
      const amount1 = parseEther('1000')
      const amount2 = parseEther('500')
      const unlockTime = Math.floor(Date.now() / 1000) + MAX_LOCK

      await xfToken.connect(user1).approve(await getAddress(veXF), parseEther('2000'))
      await veXF.connect(user1).createLock(amount1, unlockTime)
      await veXF.connect(user1).increaseAmount(amount2)

      const lock = await veXF.getLock(await getAddress(user1))
      expect(lock.amount).to.equal(parseEther('1500'))
    })

    it('Should fail if no existing lock', async function () {
      const amount = parseEther('500')
      await xfToken.connect(user1).approve(await getAddress(veXF), amount)
      await expect(
        veXF.connect(user1).increaseAmount(amount)
      ).to.be.revertedWith('veXF: no existing lock')
    })

    it('Should fail if lock expired', async function () {
      const amount1 = parseEther('1000')
      const amount2 = parseEther('500')
      const unlockTime = Math.floor(Date.now() / 1000) + MIN_LOCK

      await xfToken.connect(user1).approve(await getAddress(veXF), parseEther('2000'))
      await veXF.connect(user1).createLock(amount1, unlockTime)

      // Fast forward time
      await ethers.provider.send('evm_increaseTime', [MIN_LOCK + 1])
      await ethers.provider.send('evm_mine', [])

      await expect(
        veXF.connect(user1).increaseAmount(amount2)
      ).to.be.revertedWith('veXF: lock expired')
    })
  })

  describe('increaseUnlockTime', function () {
    it('Should extend unlock time successfully', async function () {
      const amount = parseEther('1000')
      const unlockTime1 = Math.floor(Date.now() / 1000) + MIN_LOCK
      const unlockTime2 = Math.floor(Date.now() / 1000) + MAX_LOCK

      await xfToken.connect(user1).approve(await getAddress(veXF), amount)
      await veXF.connect(user1).createLock(amount, unlockTime1)
      await veXF.connect(user1).increaseUnlockTime(unlockTime2)

      const lock = await veXF.getLock(await getAddress(user1))
      expect(lock.unlockTime).to.equal(unlockTime2)
    })

    it('Should fail if new unlock time is not later', async function () {
      const amount = parseEther('1000')
      const unlockTime1 = Math.floor(Date.now() / 1000) + MAX_LOCK
      const unlockTime2 = Math.floor(Date.now() / 1000) + MIN_LOCK

      await xfToken.connect(user1).approve(await getAddress(veXF), amount)
      await veXF.connect(user1).createLock(amount, unlockTime1)
      await expect(
        veXF.connect(user1).increaseUnlockTime(unlockTime2)
      ).to.be.revertedWith('veXF: new unlock time must be later')
    })
  })

  describe('withdraw', function () {
    it('Should withdraw XF tokens after lock expires', async function () {
      const amount = parseEther('1000')
      const unlockTime = Math.floor(Date.now() / 1000) + MIN_LOCK

      await xfToken.connect(user1).approve(await getAddress(veXF), amount)
      await veXF.connect(user1).createLock(amount, unlockTime)

      // Fast forward time
      await ethers.provider.send('evm_increaseTime', [MIN_LOCK + 1])
      await ethers.provider.send('evm_mine', [])

      await veXF.connect(user1).withdraw()

      expect(await xfToken.balanceOf(await getAddress(user1))).to.equal(parseEther('10000'))
      expect(await xfToken.balanceOf(await getAddress(veXF))).to.equal(0)
    })

    it('Should fail if lock not expired', async function () {
      const amount = parseEther('1000')
      const unlockTime = Math.floor(Date.now() / 1000) + MAX_LOCK

      await xfToken.connect(user1).approve(await getAddress(veXF), amount)
      await veXF.connect(user1).createLock(amount, unlockTime)

      await expect(
        veXF.connect(user1).withdraw()
      ).to.be.revertedWith('veXF: lock not expired')
    })

    it('Should fail if no lock exists', async function () {
      await expect(
        veXF.connect(user1).withdraw()
      ).to.be.revertedWith('veXF: no lock to withdraw')
    })
  })

  describe('distributeYield', function () {
    it('Should distribute yield successfully', async function () {
      const amount = parseEther('1000')
      const unlockTime = Math.floor(Date.now() / 1000) + MAX_LOCK

      await xfToken.connect(user1).approve(await getAddress(veXF), amount)
      await veXF.connect(user1).createLock(amount, unlockTime)

      // Deploy yield token (USDC)
      const MockERC20 = await ethers.getContractFactory('MockERC20')
      const yieldToken = await MockERC20.deploy('USD Coin', 'USDC', 6)
      await yieldToken.waitForDeployment?.() || await yieldToken.deployed?.()

      const yieldAmount = parseEther('100')
      await yieldToken.mint(await getAddress(owner), yieldAmount)
      await yieldToken.connect(owner).approve(await getAddress(veXF), yieldAmount)

      await veXF.connect(owner).distributeYield(await getAddress(yieldToken), yieldAmount)

      expect(await yieldToken.balanceOf(await getAddress(veXF))).to.equal(yieldAmount)
      expect(await veXF.totalYieldDistributed()).to.equal(yieldAmount)
    })

    it('Should fail with zero amount', async function () {
      const MockERC20 = await ethers.getContractFactory('MockERC20')
      const yieldToken = await MockERC20.deploy('USD Coin', 'USDC', 6)
      await yieldToken.waitForDeployment?.() || await yieldToken.deployed?.()

      await expect(
        veXF.connect(owner).distributeYield(await getAddress(yieldToken), 0)
      ).to.be.revertedWith('veXF: amount must be greater than 0')
    })
  })

  describe('totalSupply', function () {
    it('Should update total supply when locks are created', async function () {
      const amount1 = parseEther('1000')
      const amount2 = parseEther('2000')
      const unlockTime = Math.floor(Date.now() / 1000) + MAX_LOCK

      await xfToken.connect(user1).approve(await getAddress(veXF), amount1)
      await xfToken.connect(user2).approve(await getAddress(veXF), amount2)

      await veXF.connect(user1).createLock(amount1, unlockTime)
      const supply1 = await veXF.totalSupply()

      await veXF.connect(user2).createLock(amount2, unlockTime)
      const supply2 = await veXF.totalSupply()

      expect(supply1).to.be.gt(0)
      expect(supply2).to.be.gt(supply1)
    })
  })
})

