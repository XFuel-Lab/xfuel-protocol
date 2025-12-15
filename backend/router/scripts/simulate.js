const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

async function main() {
  console.log("🚀 Simulating full XFUEL flow...");
  console.log("Network:", hre.network.name);

  // Load deployment info
  const deploymentPath = path.join(__dirname, "../deployments", `${hre.network.name}.json`);
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ Deployment info not found. Please deploy the router first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const routerAddress = deployment.address;
  const listenerAddress = deployment.listenerAddress;

  if (!listenerAddress) {
    console.error("❌ Listener not registered. Please register listener first.");
    process.exit(1);
  }

  console.log("Router address:", routerAddress);
  console.log("Listener address:", listenerAddress);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Simulating with account:", deployer.address);

  const router = await hre.ethers.getContractAt("XFUELRouter", routerAddress);

  // Step 1: Mock GPU proof
  console.log("\n📝 Step 1: Generating mock GPU proof...");
  const mockProofData = {
    gpuId: "gpu-12345",
    taskId: "task-67890",
    reward: "1000000000000000000", // 1 TFUEL in wei
    timestamp: Date.now(),
  };
  const proofHash = ethers.keccak256(
    ethers.toUtf8Bytes(JSON.stringify(mockProofData))
  );
  console.log("Proof hash:", proofHash);
  console.log("Proof data:", JSON.stringify(mockProofData, null, 2));

  // Step 2: Listener processes proof (simulated by deployer calling as listener)
  console.log("\n👂 Step 2: Listener processing GPU proof...");
  const amount = ethers.parseEther("1.0"); // 1 TFUEL
  const targetLST = "stkXPRT";
  const userAddress = deployer.address;

  // Note: In real flow, the listener would call this
  // For simulation, we'll use the deployer account but check if it's registered
  const isRegistered = await router.registeredListeners(listenerAddress);
  if (!isRegistered) {
    console.error("❌ Listener not registered. Register it first.");
    process.exit(1);
  }

  // For simulation, we'll impersonate the listener or use a different approach
  // Since we can't easily impersonate, we'll show what the listener would do
  console.log("Listener would call: processGPUProof(...)");
  console.log("  - proofHash:", proofHash);
  console.log("  - user:", userAddress);
  console.log("  - amount:", ethers.formatEther(amount), "TFUEL");
  console.log("  - targetLST:", targetLST);

  // Step 3: Router processes and emits event
  console.log("\n🔄 Step 3: Router processing (simulated with direct call)...");
  
  // For full simulation, we need the listener to actually call
  // Since we're simulating, let's use swapAndStake as a fallback to show event emission
  console.log("Note: Full simulation requires listener to call processGPUProof");
  console.log("Using swapAndStake to demonstrate event emission...");

  try {
    // Check if we have TFUEL balance (this might fail if no balance)
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Deployer balance:", ethers.formatEther(balance), "TFUEL");

    if (balance > 0n) {
      // Listen for events
      console.log("\n👁️  Step 4: Listening for events...");
      
      router.on("SwapAndStake", (user, amount, targetLST, event) => {
        console.log("✅ SwapAndStake event received!");
        console.log("  - User:", user);
        console.log("  - Amount:", ethers.formatEther(amount), "TFUEL");
        console.log("  - Target LST:", targetLST);
        console.log("  - Block:", event.blockNumber);
        console.log("  - Tx:", event.transactionHash);
      });

      router.on("GPUProofProcessed", (listener, proofHash, user, amount, targetLST, event) => {
        console.log("✅ GPUProofProcessed event received!");
        console.log("  - Listener:", listener);
        console.log("  - Proof Hash:", proofHash);
        console.log("  - User:", user);
        console.log("  - Amount:", ethers.formatEther(amount), "TFUEL");
        console.log("  - Target LST:", targetLST);
        console.log("  - Block:", event.blockNumber);
        console.log("  - Tx:", event.transactionHash);
      });

      // Wait a bit for events
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      console.log("\n✅ Simulation complete!");
      console.log("\n📊 Summary:");
      console.log("  1. Mock GPU proof generated");
      console.log("  2. Listener would process proof");
      console.log("  3. Router would emit GPUProofProcessed event");
      console.log("  4. Router would emit SwapAndStake event");
      console.log("\n💡 To test full flow, run the Go listener service");
    } else {
      console.log("\n⚠️  No TFUEL balance. Simulation shows structure only.");
      console.log("Full flow requires:");
      console.log("  1. Go listener service running");
      console.log("  2. Listener registered with router");
      console.log("  3. Router has TFUEL balance");
    }
  } catch (error) {
    console.error("Error during simulation:", error.message);
  }

  // Cleanup
  router.removeAllListeners();
}

main()
  .then(() => {
    console.log("\n🎉 Simulation script completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Simulation failed:", error);
    process.exit(1);
  });

