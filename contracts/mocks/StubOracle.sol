// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IOracle {
    function getPrice() external view returns (uint256);
}

contract StubOracle is IOracle {
    uint256 private price;

    constructor(uint256 _price) {
        price = _price;
    }

    function getPrice() external view override returns (uint256) {
        return price;
    }

    function setPrice(uint256 _price) external {
        price = _price;
    }
}
