import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();

  const ScoreRegistry = await ethers.getContractFactory("ScoreRegistry");
  const scoreRegistry = await ScoreRegistry.deploy(deployer.address);
  await scoreRegistry.waitForDeployment();

  const SignalRegistry = await ethers.getContractFactory("SignalRegistry");
  const signalRegistry = await SignalRegistry.deploy(
    await agentRegistry.getAddress(),
    await scoreRegistry.getAddress(),
    deployer.address
  );
  await signalRegistry.waitForDeployment();

  await scoreRegistry.setResolver(await signalRegistry.getAddress());

  console.log("AgentRegistry:", await agentRegistry.getAddress());
  console.log("ScoreRegistry:", await scoreRegistry.getAddress());
  console.log("SignalRegistry:", await signalRegistry.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

