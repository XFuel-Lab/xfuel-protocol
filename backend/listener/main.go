package main

import (
	"context"
	"crypto/ecdsa"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"os"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/joho/godotenv"
)

// XFUELRouter ABI (simplified for processGPUProof)
const routerABI = `[
	{
		"inputs": [
			{"internalType": "bytes32", "name": "proofHash", "type": "bytes32"},
			{"internalType": "address", "name": "user", "type": "address"},
			{"internalType": "uint256", "name": "amount", "type": "uint256"},
			{"internalType": "string", "name": "targetLST", "type": "string"}
		],
		"name": "processGPUProof",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{"indexed": true, "internalType": "address", "name": "listener", "type": "address"},
			{"indexed": true, "internalType": "bytes32", "name": "proofHash", "type": "bytes32"},
			{"indexed": true, "internalType": "address", "name": "user", "type": "address"},
			{"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
			{"indexed": false, "internalType": "string", "name": "targetLST", "type": "string"}
		],
		"name": "GPUProofProcessed",
		"type": "event"
	}
]`

// Mock GPU Proof structure
type GPUProof struct {
	GPUId     string `json:"gpuId"`
	TaskId    string `json:"taskId"`
	Reward    string `json:"reward"`
	Timestamp int64  `json:"timestamp"`
	User      string `json:"user"`
	TargetLST string `json:"targetLST"`
}

type Listener struct {
	client     *ethclient.Client
	routerAddr common.Address
	privateKey *ecdsa.PrivateKey
	routerABI  abi.ABI
	chainID    *big.Int
}

func NewListener(rpcURL, routerAddr, privateKeyHex string) (*Listener, error) {
	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to RPC: %w", err)
	}

	chainID, err := client.NetworkID(context.Background())
	if err != nil {
		return nil, fmt.Errorf("failed to get chain ID: %w", err)
	}

	privateKey, err := crypto.HexToECDSA(privateKeyHex)
	if err != nil {
		return nil, fmt.Errorf("invalid private key: %w", err)
	}

	parsedABI, err := abi.JSON(strings.NewReader(routerABI))
	if err != nil {
		return nil, fmt.Errorf("failed to parse ABI: %w", err)
	}

	return &Listener{
		client:     client,
		routerAddr: common.HexToAddress(routerAddr),
		privateKey: privateKey,
		routerABI:  parsedABI,
		chainID:    chainID,
	}, nil
}

// ProcessMockGPUProof simulates processing a GPU proof and calling the router
func (l *Listener) ProcessMockGPUProof(proof GPUProof) error {
	// Calculate proof hash
	proofJSON, err := json.Marshal(proof)
	if err != nil {
		return fmt.Errorf("failed to marshal proof: %w", err)
	}
	proofHash := crypto.Keccak256Hash(proofJSON)

	// Parse amount
	amount, ok := new(big.Int).SetString(proof.Reward, 10)
	if !ok {
		return fmt.Errorf("invalid reward amount: %s", proof.Reward)
	}

	// Get user address
	userAddr := common.HexToAddress(proof.User)

	// Prepare transaction
	auth, err := bind.NewKeyedTransactorWithChainID(l.privateKey, l.chainID)
	if err != nil {
		return fmt.Errorf("failed to create transactor: %w", err)
	}

	// Get nonce
	nonce, err := l.client.PendingNonceAt(context.Background(), auth.From)
	if err != nil {
		return fmt.Errorf("failed to get nonce: %w", err)
	}
	auth.Nonce = big.NewInt(int64(nonce))

	// Get gas price
	gasPrice, err := l.client.SuggestGasPrice(context.Background())
	if err != nil {
		return fmt.Errorf("failed to get gas price: %w", err)
	}
	auth.GasPrice = gasPrice
	auth.GasLimit = 300000

	// Pack function call
	data, err := l.routerABI.Pack("processGPUProof", proofHash, userAddr, amount, proof.TargetLST)
	if err != nil {
		return fmt.Errorf("failed to pack function: %w", err)
	}

	// Create transaction
	tx := types.NewTransaction(
		auth.Nonce.Uint64(),
		l.routerAddr,
		big.NewInt(0),
		auth.GasLimit,
		auth.GasPrice,
		data,
	)

	// Sign transaction
	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(l.chainID), l.privateKey)
	if err != nil {
		return fmt.Errorf("failed to sign transaction: %w", err)
	}

	// Send transaction
	err = l.client.SendTransaction(context.Background(), signedTx)
	if err != nil {
		return fmt.Errorf("failed to send transaction: %w", err)
	}

	log.Printf("✅ Transaction sent: %s", signedTx.Hash().Hex())
	log.Printf("   Proof Hash: %s", proofHash.Hex())
	log.Printf("   User: %s", userAddr.Hex())
	log.Printf("   Amount: %s TFUEL", amount.String())
	log.Printf("   Target LST: %s", proof.TargetLST)

	// Wait for receipt
	receipt, err := bind.WaitMined(context.Background(), l.client, signedTx)
	if err != nil {
		return fmt.Errorf("failed to wait for transaction: %w", err)
	}

	if receipt.Status == 0 {
		return fmt.Errorf("transaction failed")
	}

	log.Printf("✅ Transaction confirmed in block %d", receipt.BlockNumber)

	return nil
}

// ListenForEvents listens for GPUProofProcessed events
func (l *Listener) ListenForEvents(ctx context.Context) error {
	query := ethereum.FilterQuery{
		Addresses: []common.Address{l.routerAddr},
	}

	logs := make(chan types.Log)
	sub, err := l.client.SubscribeFilterLogs(ctx, query, logs)
	if err != nil {
		return fmt.Errorf("failed to subscribe to logs: %w", err)
	}
	defer sub.Unsubscribe()

	log.Println("👂 Listening for GPUProofProcessed events...")

	for {
		select {
		case err := <-sub.Err():
			return fmt.Errorf("subscription error: %w", err)
		case logEntry := <-logs:
			// Parse event - indexed params are in Topics, non-indexed in Data
			if len(logEntry.Topics) < 4 {
				log.Printf("⚠️  Invalid event log (insufficient topics)")
				continue
			}

			// Topics[0] is the event signature hash
			// Topics[1] is listener (indexed)
			// Topics[2] is proofHash (indexed)
			// Topics[3] is user (indexed)
			listener := common.BytesToAddress(logEntry.Topics[1].Bytes())
			proofHash := common.BytesToHash(logEntry.Topics[2].Bytes())
			user := common.BytesToAddress(logEntry.Topics[3].Bytes())

			// Unpack non-indexed parameters (amount, targetLST) from Data
			event := struct {
				Amount    *big.Int
				TargetLST string
			}{}

			err := l.routerABI.UnpackIntoInterface(&event, "GPUProofProcessed", logEntry.Data)
			if err != nil {
				log.Printf("⚠️  Failed to unpack event data: %v", err)
				continue
			}

			log.Printf("🎉 GPUProofProcessed event received!")
			log.Printf("   Listener: %s", listener.Hex())
			log.Printf("   Proof Hash: %s", proofHash.Hex())
			log.Printf("   User: %s", user.Hex())
			log.Printf("   Amount: %s TFUEL", event.Amount.String())
			log.Printf("   Target LST: %s", event.TargetLST)
			log.Printf("   Block: %d", logEntry.BlockNumber)
		case <-ctx.Done():
			return ctx.Err()
		}
	}
}

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	rpcURL := os.Getenv("RPC_URL")
	if rpcURL == "" {
		rpcURL = "https://eth-rpc-api-testnet.thetatoken.org/rpc"
	}

	routerAddr := os.Getenv("ROUTER_ADDRESS")
	if routerAddr == "" {
		log.Fatal("ROUTER_ADDRESS environment variable is required")
	}

	privateKeyHex := os.Getenv("PRIVATE_KEY")
	if privateKeyHex == "" {
		log.Fatal("PRIVATE_KEY environment variable is required")
	}

	// Remove 0x prefix if present
	if len(privateKeyHex) > 2 && privateKeyHex[:2] == "0x" {
		privateKeyHex = privateKeyHex[2:]
	}

	listener, err := NewListener(rpcURL, routerAddr, privateKeyHex)
	if err != nil {
		log.Fatalf("Failed to create listener: %v", err)
	}

	// Check if we should run simulation
	if os.Getenv("SIMULATE") == "true" {
		log.Println("🚀 Running simulation mode...")

		// Get listener address
		publicKey := listener.privateKey.Public()
		publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
		if !ok {
			log.Fatal("Failed to get public key")
		}
		listenerAddr := crypto.PubkeyToAddress(*publicKeyECDSA)

		// Create mock proof
		proof := GPUProof{
			GPUId:     "gpu-12345",
			TaskId:    "task-67890",
			Reward:    "1000000000000000000", // 1 TFUEL
			Timestamp: time.Now().Unix(),
			User:      listenerAddr.Hex(), // Use listener address as user for simulation
			TargetLST: "stkXPRT",
		}

		log.Printf("📝 Mock GPU Proof:")
		log.Printf("   GPU ID: %s", proof.GPUId)
		log.Printf("   Task ID: %s", proof.TaskId)
		log.Printf("   Reward: %s TFUEL", proof.Reward)
		log.Printf("   User: %s", proof.User)
		log.Printf("   Target LST: %s", proof.TargetLST)

		if err := listener.ProcessMockGPUProof(proof); err != nil {
			log.Fatalf("Failed to process proof: %v", err)
		}

		log.Println("✅ Simulation complete!")
		return
	}

	// Run event listener
	ctx := context.Background()
	if err := listener.ListenForEvents(ctx); err != nil {
		log.Fatalf("Event listener error: %v", err)
	}
}

