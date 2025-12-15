# XFUEL Listener

TPulse relayer fork for listening to GPU proofs and routing to XFUEL Router.

## Setup

1. Install Go dependencies:
```bash
go mod download
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Set your environment variables:
- `ROUTER_ADDRESS`: The deployed XFUELRouter contract address
- `PRIVATE_KEY`: Your Theta testnet private key (for the listener account)
- `RPC_URL`: Theta testnet RPC URL (defaults to testnet)

## Usage

### Run Event Listener
```bash
go run main.go
```

### Run Simulation
```bash
SIMULATE=true go run main.go
```

The simulation will:
1. Generate a mock GPU proof
2. Process it through the listener
3. Call the router's `processGPUProof` function
4. Emit events on-chain

## Flow

1. **GPU Proof Received**: Listener receives GPU proof data
2. **Proof Processing**: Listener validates and hashes the proof
3. **Router Call**: Listener calls `processGPUProof` on the router contract
4. **Event Emission**: Router emits `GPUProofProcessed` and `SwapAndStake` events
5. **Event Listening**: Listener subscribes to and logs events

