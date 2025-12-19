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
  // Clean and compile contracts first to ensure artifacts are generated
  console.log('Cleaning artifacts...')
  try {
    execSync('npx hardhat clean', {
      stdio: 'pipe',
      cwd: path.join(__dirname, '..'),
    })
  } catch (e) {
    // Ignore clean errors
  }
  
  console.log('Compiling contracts...')
  execSync('npx hardhat compile', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      NODE_OPTIONS: '--no-warnings',
    },
  })
  
  // Verify artifacts exist - check multiple possible paths due to case sensitivity
  const artifactsDir = path.join(__dirname, '..', 'artifacts', 'contracts')
  const possiblePaths = [
    path.join(artifactsDir, 'veXF.sol', 'veXF.json'),
    path.join(artifactsDir, 'VeXF.sol', 'VeXF.json'),
    path.join(artifactsDir, 'VeXF.sol', 'veXF.json'),
    path.join(artifactsDir, 'veXF.sol', 'VeXF.json'),
  ]
  
  let artifactFound = false
  let foundPath = null
  for (const artifactPath of possiblePaths) {
    if (fs.existsSync(artifactPath)) {
      artifactFound = true
      foundPath = artifactPath
      console.log('✓ Found veXF artifact at:', artifactPath)
      break
    }
  }
  
  if (!artifactFound) {
    console.error('ERROR: veXF artifact not found after compilation!')
    console.error('Checked paths:')
    possiblePaths.forEach(p => console.error('  -', p))
    
    // List what artifacts actually exist
    console.error('\nAvailable artifacts:')
    try {
      const contractsDir = fs.readdirSync(artifactsDir)
      contractsDir.forEach(dir => {
        const dirPath = path.join(artifactsDir, dir)
        if (fs.statSync(dirPath).isDirectory()) {
          const files = fs.readdirSync(dirPath)
          files.forEach(file => {
            if (file.endsWith('.json') && !file.endsWith('.dbg.json')) {
              console.error(`  - ${dir}/${file}`)
            }
          })
        }
      })
    } catch (e) {
      console.error('  Could not list artifacts:', e.message)
    }
    process.exit(1)
  }
  
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

