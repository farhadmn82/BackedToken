import { expect } from "chai";
import { ethers } from "hardhat";

const abi = ethers.AbiCoder.defaultAbiCoder();

describe("Representative", function () {
  async function deploy() {
    const [owner, user] = await ethers.getSigners();

    const Stable = await ethers.getContractFactory("MockERC20");
    const stable = await Stable.deploy();

    const Oracle = await ethers.getContractFactory("StubOracle");
    const price = ethers.parseEther("1");
    const oracle = await Oracle.deploy(price);

    const Bridge = await ethers.getContractFactory("StubBridge");
    const bridge = await Bridge.deploy();

    const Rep = await ethers.getContractFactory("Representative");
    const rep = await Rep.deploy(await stable.getAddress());
    await rep.setOracle(await oracle.getAddress());
    await rep.setBridge(await bridge.getAddress());

    await stable.mint(user.address, ethers.parseEther("100"));

    return { rep, stable, oracle, bridge, owner, user, price };
  }

  it("mints tokens and emits bridge message on buy", async function () {
    const { rep, stable, bridge, user, price } = await deploy();
    const buyAmount = ethers.parseEther("10");

    await stable.connect(user).approve(await rep.getAddress(), buyAmount);

    const tokens = (buyAmount * 10n ** 18n) / price;
    const message = abi.encode(["string", "address", "uint256"], ["buy", user.address, tokens]);

    await expect(rep.connect(user).buy(buyAmount))
      .to.emit(bridge, "Message")
      .withArgs(await stable.getAddress(), buyAmount, message);

    expect(await rep.balanceOf(user.address)).to.equal(tokens);
    expect(await stable.balanceOf(await bridge.getAddress())).to.equal(buyAmount);
  });

  it("burns tokens, queues redeem and emits bridge message", async function () {
    const { rep, stable, bridge, user, price } = await deploy();
    const buyAmount = ethers.parseEther("10");
    await stable.connect(user).approve(await rep.getAddress(), buyAmount);
    await rep.connect(user).buy(buyAmount);

    const tokens = await rep.balanceOf(user.address);
    const stableValue = (tokens * price) / (10n ** 18n);
    const message = abi.encode(["string", "address", "uint256"], ["redeem", user.address, stableValue]);

    await expect(rep.connect(user).redeem(tokens))
      .to.emit(bridge, "Message")
      .withArgs(await stable.getAddress(), 0, message);

    expect(await rep.balanceOf(user.address)).to.equal(0n);
    const req = await rep.redemptionQueue(0);
    expect(req.account).to.equal(user.address);
    expect(req.amount).to.equal(stableValue);
  });

  it("returns deployer as owner via getOwner", async function () {
    const { rep, owner } = await deploy();
    expect(await rep.getOwner()).to.equal(owner.address);
  });
});
