// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract XFUELRouter is Ownable {
    address public constant TFUEL = 0x0000000000000000000000000000000000001010;

    event SwapAndStake(address indexed user, uint256 amount, string targetLST);

    constructor() Ownable(msg.sender) {}

    function swapAndStake(uint256 amount, string memory targetLST) external {
        require(IERC20(TFUEL).transferFrom(msg.sender, address(this), amount), "TFUEL transfer failed");
        emit SwapAndStake(msg.sender, amount, targetLST);
    }
}
