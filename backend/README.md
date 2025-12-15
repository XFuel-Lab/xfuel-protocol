# XFUEL Backend

Backend infrastructure for XFUEL Protocol: Theta EVM router and TPulse relayer listener.

## Structure

```
backend/
├── router/          # Hardhat project for Theta EVM router
│   ├── contracts/   # Solidity contracts
│   ├── scripts/     # Deployment and utility scripts
│   └── test/        # Contract tests
└── listener/        # Go TPulse relayer fork
    └── main.go      # Listener service
```

## Quick Start

### 1. Deploy Router

```bash
cd router
npm install
cp .env.example .env
# Add your PRIVATE_KEY to .env
npm run deploy:testnet
```

### 2. Register Listener

```bash
cd router
# Set LISTENER_ADDRESS in .env (your listener account address)
npm run register:testnet
```

### 3. Run Listener

```bash
cd listener
go mod download
cp .env.example .env
# Set ROUTER_ADDRESS and PRIVATE_KEY in .env
go run main.go
```

### 4. Simulate Full Flow

```bash
# In router directory
npm run simulate

# Or in listener directory
SIMULATE=true go run main.go
```

## Flow Overview

1. **GPU Proof** → Mock GPU proof generated
2. **Listener** → Processes proof and calls router
3. **Router** → Validates, processes, and emits events
4. **Events** → `GPUProofProcessed` and `SwapAndStake` emitted

## Environment Variables

### Router (.env)
- `PRIVATE_KEY`: Theta testnet private key for deployment
- `LISTENER_ADDRESS`: Address of the listener account (for registration)

### Listener (.env)
- `RPC_URL`: Theta testnet RPC URL
- `ROUTER_ADDRESS`: Deployed router contract address
- `PRIVATE_KEY`: Listener account private key (must be registered)
- `SIMULATE`: Set to "true" to run simulation mode

