import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
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

  const deployment = {
    network: "mantleSepolia",
    chainId: 5003,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      AgentRegistry: {
        address: await agentRegistry.getAddress(),
        transactionHash: agentRegistry.deploymentTransaction()?.hash
      },
      ScoreRegistry: {
        address: await scoreRegistry.getAddress(),
        transactionHash: scoreRegistry.deploymentTransaction()?.hash
      },
      SignalRegistry: {
        address: await signalRegistry.getAddress(),
        transactionHash: signalRegistry.deploymentTransaction()?.hash
      }
    }
  };

  const outputPath = resolve(process.cwd(), "../deployment-artifacts/mantle-sepolia.json");
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(deployment, null, 2)}\n`);

  console.log("AgentRegistry:", deployment.contracts.AgentRegistry.address);
  console.log("ScoreRegistry:", deployment.contracts.ScoreRegistry.address);
  console.log("SignalRegistry:", deployment.contracts.SignalRegistry.address);
  console.log("Deployment artifact:", outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
