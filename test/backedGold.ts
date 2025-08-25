import { expect } from "chai";
import { ethers } from "hardhat";

const abi = ethers.AbiCoder.defaultAbiCoder();

describe("BackedGold", function () {
  async function deploy() {
    const [owner, user] = await ethers.getSigners();

    const Stable = await ethers.getContractFactory("MockERC20");
    const stable = await Stable.deploy();

    const Oracle = await ethers.getContractFactory("StubOracle");
    const price = ethers.parseEther("1");
    const oracle = await Oracle.deploy(price);

    const Bridge = await ethers.getContractFactory("StubBridge");
    const bridge = await Bridge.deploy();

    const goldFactory = await ethers.getContractFactory("BackedGold");
    const gold = await goldFactory.deploy(await stable.getAddress());
    await gold.setOracle(await oracle.getAddress());
    await gold.setBridge(await bridge.getAddress());

    await stable.mint(user.address, ethers.parseEther("100"));

    return { gold, stable, oracle, bridge, owner, user, price };
  }

  it("mints tokens and emits bridge message on buy", async function () {
    const { gold, stable, bridge, user, price } = await deploy();
    const buyAmount = ethers.parseEther("10");

    await stable.connect(user).approve(await gold.getAddress(), buyAmount);

    const tokens = (buyAmount * 10n ** 18n) / price;
    const message = abi.encode(["string", "address", "uint256"], ["buy", user.address, tokens]);

    await expect(gold.connect(user).buy(buyAmount))
      .to.emit(bridge, "Message")
      .withArgs(await stable.getAddress(), buyAmount, message);

    expect(await gold.balanceOf(user.address)).to.equal(tokens);
    expect(await stable.balanceOf(await bridge.getAddress())).to.equal(buyAmount);
  });

  it("burns tokens, queues redeem and emits bridge message", async function () {
    const { gold, stable, bridge, user, price } = await deploy();
    const buyAmount = ethers.parseEther("10");
    await stable.connect(user).approve(await gold.getAddress(), buyAmount);
    await gold.connect(user).buy(buyAmount);

    const tokens = await gold.balanceOf(user.address);
    const stableValue = (tokens * price) / (10n ** 18n);
    const message = abi.encode(["string", "address", "uint256"], ["redeem", user.address, stableValue]);

    await expect(gold.connect(user).redeem(tokens))
      .to.emit(bridge, "Message")
      .withArgs(await stable.getAddress(), 0, message);

    expect(await gold.balanceOf(user.address)).to.equal(0n);
    const req = await gold.redemptionQueue(0);
    expect(req.account).to.equal(user.address);
    expect(req.amount).to.equal(stableValue);
  });

  it("returns deployer as owner via getOwner", async function () {
    const { gold, owner } = await deploy();
    expect(await gold.getOwner()).to.equal(owner.address);
  });
});
