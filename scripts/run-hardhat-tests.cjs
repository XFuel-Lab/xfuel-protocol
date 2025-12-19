// Wrapper script to run Hardhat tests with proper CommonJS handling
// This ensures .cjs files are loaded correctly even with "type": "module"
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
const originalType = packageJson.type

// Temporarily remove type: module
if (packageJson.type === 'module') {
  delete packageJson.type
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
}

let exitCode = 0
try {
  // Compile contracts first to ensure artifacts are generated
  console.log('Compiling contracts...')
  execSync('npx hardhat compile', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      NODE_OPTIONS: '--no-warnings',
    },
  })
  
  // Run hardhat test using npx (synchronously to ensure package.json change is applied)
  console.log('Running tests...')
  execSync('npx hardhat test', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      NODE_OPTIONS: '--no-warnings',
    },
  })
} catch (error) {
  exitCode = error.status || 1
} finally {
  // Restore type: module if it was there
  if (originalType === 'module') {
    const restoredPkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    restoredPkg.type = 'module'
    fs.writeFileSync(packageJsonPath, JSON.stringify(restoredPkg, null, 2) + '\n')
  }
  process.exit(exitCode)
}

