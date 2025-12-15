const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Registering listener with XFUELRouter...");
  console.log("Network:", hre.network.name);

  // Load deployment info
  const deploymentPath = path.join(__dirname, "../deployments", `${hre.network.name}.json`);
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ Deployment info not found. Please deploy the router first.");
    console.log("Run: npm run deploy:testnet");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const routerAddress = deployment.address;
  console.log("Router address:", routerAddress);

  // Get listener address from environment or use deployer as default
  const listenerAddress = process.env.LISTENER_ADDRESS;
  if (!listenerAddress) {
    console.error("❌ LISTENER_ADDRESS environment variable not set");
    console.log("Set it in .env file or export it before running this script");
    process.exit(1);
  }

  console.log("Listener address:", listenerAddress);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Registering with account:", deployer.address);

  const router = await hre.ethers.getContractAt("XFUELRouter", routerAddress);
  
  console.log("Registering listener...");
  const tx = await router.registerListener(listenerAddress, {
    gasLimit: 500000,
  });
  console.log("Transaction hash:", tx.hash);
  
  await tx.wait();
  console.log("✅ Listener registered successfully!");

  // Verify registration
  const isRegistered = await router.registeredListeners(listenerAddress);
  console.log("Verification - Listener registered:", isRegistered);

  // Update deployment info
  deployment.listenerAddress = listenerAddress;
  deployment.listenerRegisteredAt = new Date().toISOString();
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log("💾 Updated deployment info saved");
}

main()
  .then(() => {
    console.log("\n🎉 Registration successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Registration failed:", error);
    process.exit(1);
  });

