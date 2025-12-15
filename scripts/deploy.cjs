const hre = require('hardhat')

async function main() {
  console.log('Deploying XFUELRouter to Theta Testnet...')
  console.log('Network:', hre.network.name)
  console.log('Chain ID:', hre.network.config.chainId)

  const [deployer] = await hre.ethers.getSigners()
  console.log('Deploying with account:', deployer.address)
  
  const balance = await hre.ethers.provider.getBalance(deployer.address)
  console.log('Account balance:', hre.ethers.formatEther(balance), 'TFUEL')

  if (balance === 0n) {
    console.log('\n⚠️  Account has 0 TFUEL. Please fund the account first.')
    console.log('Visit: https://faucet.testnet.theta.org/')
    console.log('Address:', deployer.address)
    process.exit(1)
  }

  const XFUELRouter = await hre.ethers.getContractFactory('XFUELRouter')
  console.log('Deploying contract...')
  
  // Try deployment with explicit gas settings
  const router = await XFUELRouter.deploy({
    gasLimit: 3000000,
  })
  console.log('Waiting for deployment...')

  await router.waitForDeployment()

  const address = await router.getAddress()
  console.log('\n✅ XFUELRouter deployed to:', address)
  console.log('📋 Contract address:', address)
  
  return address
}

main()
  .then((address) => {
    console.log('\n🎉 Deployment successful!')
    console.log('Contract address:', address)
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Deployment failed:')
    console.error(error.message)
    if (error.transaction) {
      console.error('Transaction:', error.transaction)
    }
    process.exit(1)
  })
