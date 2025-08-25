// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IBridge {
    function send(address token, uint256 amount, bytes calldata message) external;
}

contract StubBridge is IBridge {
    event Message(address token, uint256 amount, bytes message);

    function send(address token, uint256 amount, bytes calldata message) external override {
        if (amount > 0) {
            IERC20(token).transferFrom(msg.sender, address(this), amount);
        }
        emit Message(token, amount, message);
    }
}
