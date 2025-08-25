// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IOracle {
    function getPrice() external view returns (uint256);
}

interface IBridge {
    function send(address token, uint256 amount, bytes calldata message) external;
}

contract BackedGold is ERC20, Ownable {
    IERC20 public immutable stable;
    address public oracle;
    address public bridge;

    struct RedemptionRequest {
        address account;
        uint256 amount;
    }

    RedemptionRequest[] public redemptionQueue;

    constructor(address stablecoin) ERC20("Backed Gold", "BGOLD") {
        stable = IERC20(stablecoin);
    }

    function setOracle(address _oracle) external onlyOwner {
        oracle = _oracle;
    }

    function setBridge(address _bridge) external onlyOwner {
        bridge = _bridge;
    }

    function buy(uint256 stableAmount) external {
        require(oracle != address(0) && bridge != address(0), "BackedGold: not wired");
        require(stableAmount > 0, "BackedGold: amount zero");

        require(stable.transferFrom(msg.sender, address(this), stableAmount), "BackedGold: transfer failed");
        uint256 price = IOracle(oracle).getPrice();
        require(price > 0, "BackedGold: price zero");
        uint256 tokensToMint = stableAmount * 1e18 / price;

        _mint(msg.sender, tokensToMint);

        stable.approve(bridge, stableAmount);
        IBridge(bridge).send(address(stable), stableAmount, abi.encode("buy", msg.sender, tokensToMint));
    }

    function redeem(uint256 tokenAmount) external {
        require(oracle != address(0) && bridge != address(0), "BackedGold: not wired");
        require(tokenAmount > 0, "BackedGold: amount zero");

        _burn(msg.sender, tokenAmount);

        uint256 price = IOracle(oracle).getPrice();
        uint256 stableValue = tokenAmount * price / 1e18;

        redemptionQueue.push(RedemptionRequest({account: msg.sender, amount: stableValue}));

        IBridge(bridge).send(address(stable), 0, abi.encode("redeem", msg.sender, stableValue));
    }

    function redemptionQueueLength() external view returns (uint256) {
        return redemptionQueue.length;
    }

    function getOwner() external view returns (address) {
        return owner();
    }
}

