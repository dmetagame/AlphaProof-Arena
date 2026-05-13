import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { run } from "hardhat";

type Deployment = {
  deployer: string;
  contracts: {
    AgentRegistry: { address: string };
    ScoreRegistry: { address: string };
    SignalRegistry: { address: string };
  };
};

async function main() {
  const deploymentPath = resolve(process.cwd(), "../deployment-artifacts/mantle-sepolia.json");
  const deployment = JSON.parse(readFileSync(deploymentPath, "utf8")) as Deployment;

  await verify("AgentRegistry", "src/AgentRegistry.sol:AgentRegistry", deployment.contracts.AgentRegistry.address, []);
  await verify("ScoreRegistry", "src/ScoreRegistry.sol:ScoreRegistry", deployment.contracts.ScoreRegistry.address, [
    deployment.deployer
  ]);
  await verify("SignalRegistry", "src/SignalRegistry.sol:SignalRegistry", deployment.contracts.SignalRegistry.address, [
    deployment.contracts.AgentRegistry.address,
    deployment.contracts.ScoreRegistry.address,
    deployment.deployer
  ]);
}

async function verify(name: string, contract: string, address: string, constructorArguments: unknown[]) {
  try {
    await run("verify:verify", {
      address,
      contract,
      constructorArguments
    });
    console.log(`${name} verified: ${address}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("already verified")) {
      console.log(`${name} already verified: ${address}`);
      return;
    }
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
