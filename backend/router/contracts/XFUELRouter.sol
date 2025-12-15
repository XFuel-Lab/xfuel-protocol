// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title XFUELRouter
 * @dev Theta EVM router for processing GPU proofs and routing to LSTs
 */
contract XFUELRouter is Ownable {
    address public constant TFUEL = 0x0000000000000000000000000000000000001010;
    
    // Listener registration
    mapping(address => bool) public registeredListeners;
    
    // Events
    event SwapAndStake(address indexed user, uint256 amount, string targetLST);
    event GPUProofProcessed(
        address indexed listener,
        bytes32 indexed proofHash,
        address indexed user,
        uint256 amount,
        string targetLST
    );
    event ListenerRegistered(address indexed listener);
    event ListenerRemoved(address indexed listener);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Register a listener address (only owner)
     */
    function registerListener(address listener) external onlyOwner {
        require(listener != address(0), "Invalid listener address");
        registeredListeners[listener] = true;
        emit ListenerRegistered(listener);
    }

    /**
     * @dev Remove a listener address (only owner)
     */
    function removeListener(address listener) external onlyOwner {
        registeredListeners[listener] = false;
        emit ListenerRemoved(listener);
    }

    /**
     * @dev Process GPU proof and route to LST (called by registered listener)
     * @param proofHash Hash of the GPU proof
     * @param user Address of the user receiving the staked tokens
     * @param amount Amount of TFUEL to swap and stake
     * @param targetLST Target liquid staking token (e.g., "stkXPRT", "stkATOM")
     */
    function processGPUProof(
        bytes32 proofHash,
        address user,
        uint256 amount,
        string memory targetLST
    ) external {
        require(registeredListeners[msg.sender], "Unauthorized listener");
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(targetLST).length > 0, "Target LST cannot be empty");

        // Transfer TFUEL from router to this contract (router should have balance)
        // In production, this would integrate with actual swap/stake contracts
        require(
            IERC20(TFUEL).transferFrom(address(this), address(this), amount),
            "TFUEL transfer failed"
        );

        // Emit events
        emit GPUProofProcessed(msg.sender, proofHash, user, amount, targetLST);
        emit SwapAndStake(user, amount, targetLST);
    }

    /**
     * @dev Direct swap and stake (for testing/fallback)
     */
    function swapAndStake(uint256 amount, string memory targetLST) external {
        require(IERC20(TFUEL).transferFrom(msg.sender, address(this), amount), "TFUEL transfer failed");
        emit SwapAndStake(msg.sender, amount, targetLST);
    }

    /**
     * @dev Allow contract to receive TFUEL
     */
    receive() external payable {}
}

