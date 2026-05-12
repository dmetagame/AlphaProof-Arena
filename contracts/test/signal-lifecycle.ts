import { expect } from "chai";
import { ethers } from "hardhat";

describe("AlphaProof signal lifecycle", function () {
  async function deployFixture() {
    const [owner, agentOwner, other] = await ethers.getSigners();

    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    const agentRegistry = await AgentRegistry.deploy();

    const ScoreRegistry = await ethers.getContractFactory("ScoreRegistry");
    const scoreRegistry = await ScoreRegistry.deploy(owner.address);

    const SignalRegistry = await ethers.getContractFactory("SignalRegistry");
    const signalRegistry = await SignalRegistry.deploy(
      await agentRegistry.getAddress(),
      await scoreRegistry.getAddress(),
      owner.address
    );

    await scoreRegistry.setResolver(await signalRegistry.getAddress());

    return { owner, agentOwner, other, agentRegistry, scoreRegistry, signalRegistry };
  }

  it("registers an agent and commits a signal", async function () {
    const { agentOwner, agentRegistry, signalRegistry } = await deployFixture();

    await agentRegistry.connect(agentOwner).registerAgent("Whale Flow Agent", "ipfs://agent");

    const targetId = ethers.id("MANTLE:METH");
    const sourceHash = ethers.id("source-data");
    const explanationHash = ethers.id("agent-explanation");
    const expiresAt = BigInt((await ethers.provider.getBlock("latest"))!.timestamp + 3600);

    await expect(
      signalRegistry.connect(agentOwner).commitSignal(
        1,
        0,
        targetId,
        7600,
        expiresAt,
        sourceHash,
        explanationHash
      )
    ).to.emit(signalRegistry, "SignalCommitted");

    const signal = await signalRegistry.getSignal(1);
    expect(signal.agentId).to.equal(1);
    expect(signal.confidenceBps).to.equal(7600);
    expect(signal.resolved).to.equal(false);
  });

  it("rejects signal commits from non-owners", async function () {
    const { agentOwner, other, agentRegistry, signalRegistry } = await deployFixture();

    await agentRegistry.connect(agentOwner).registerAgent("Volatility Agent", "ipfs://agent");

    await expect(
      signalRegistry.connect(other).commitSignal(
        1,
        2,
        ethers.id("MANTLE:VOL"),
        6500,
        BigInt((await ethers.provider.getBlock("latest"))!.timestamp + 3600),
        ethers.id("source-data"),
        ethers.id("agent-explanation")
      )
    ).to.be.revertedWith("not active agent owner");
  });

  it("resolves an expired signal and updates the score", async function () {
    const { owner, agentOwner, agentRegistry, scoreRegistry, signalRegistry } = await deployFixture();

    await agentRegistry.connect(agentOwner).registerAgent("Liquidity Agent", "ipfs://agent");

    const expiresAt = (await ethers.provider.getBlock("latest"))!.timestamp + 60;
    await signalRegistry.connect(agentOwner).commitSignal(
      1,
      1,
      ethers.id("MANTLE:POOL"),
      8100,
      expiresAt,
      ethers.id("source-data"),
      ethers.id("agent-explanation")
    );

    await ethers.provider.send("evm_increaseTime", [61]);
    await ethers.provider.send("evm_mine", []);

    await expect(
      signalRegistry.connect(owner).resolveSignal(1, true, 125, 10)
    ).to.emit(signalRegistry, "SignalResolved");

    const signal = await signalRegistry.getSignal(1);
    expect(signal.resolved).to.equal(true);
    expect(signal.correct).to.equal(true);

    const score = await scoreRegistry.getScore(1);
    expect(score.resolvedSignals).to.equal(1);
    expect(score.correctSignals).to.equal(1);
    expect(score.reputation).to.equal(10);
    expect(score.cumulativePnLBps).to.equal(125);
  });
});

