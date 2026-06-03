import {
  createPublicClient,
  createWalletClient,
  getAddress,
  http,
  parseAbi
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  buildDemoCommitBundle,
  buildLiveCommitBundle,
  stringifyBigInts
} from "../../../../../services/agent/src/demoBundle.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const mantleSepoliaRpcUrl = process.env.MANTLE_SEPOLIA_RPC_URL || "https://rpc.sepolia.mantle.xyz";
const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 5003);
const signalRegistryAddress = getAddress(
  process.env.NEXT_PUBLIC_SIGNAL_REGISTRY_ADDRESS || "0x0d22DdC5d0Da0E4988b04E0647b4643e7BDfFc79"
);
const explorerBaseUrl = "https://sepolia.mantlescan.xyz";
const agentId = BigInt(process.env.LIVE_AGENT_ID || "1");
const expiryMinutes = Number(process.env.ARENA_ROUND_EXPIRY_MINUTES || process.env.LIVE_SIGNAL_EXPIRY_MINUTES || 2);
const cooldownSeconds = Number(process.env.ARENA_ROUND_COOLDOWN_SECONDS || 45);

let lastCommitAt = 0;

const signalAbi = parseAbi([
  "function nextSignalId() view returns (uint256)",
  "function commitSignal(uint256 agentId,uint8 kind,bytes32 targetId,uint16 confidenceBps,uint64 expiresAt,bytes32 sourceDataHash,bytes32 explanationHash) returns (uint256)"
]);

type CommitSignalArgs = readonly [
  bigint,
  number,
  `0x${string}`,
  number,
  bigint,
  `0x${string}`,
  `0x${string}`
];

export async function POST() {
  let bundle: Awaited<ReturnType<typeof buildLiveCommitBundle>>;

  try {
    bundle = await buildLiveCommitBundle(new Date(), agentId, { expiryMinutes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "live Mantle RPC observation failed";
    const fallback = buildDemoCommitBundle(new Date(), agentId);

    return Response.json(stringifyBigInts({
      round: buildPreparedRound({
        mode: "demo-fallback",
        reason: message,
        expiresAt: fallback.signal.expiresAt
      }),
      dataSourceMode: "demo-fallback",
      warning: message,
      observation: fallback.observation,
      signal: fallback.signal,
      contract: fallback.contract
    }), { status: 200 });
  }

  const autoCommitEnabled = process.env.ARENA_AUTOCOMMIT_ENABLED === "true";
  const privateKey = normalizePrivateKey(process.env.DEPLOYER_PRIVATE_KEY);

  if (!autoCommitEnabled || !privateKey) {
    return Response.json(stringifyBigInts({
      round: buildPreparedRound({
        mode: "live-mantle-rpc",
        reason: autoCommitEnabled
          ? "server signer is not configured"
          : "server autocommit is disabled",
        expiresAt: bundle.signal.expiresAt
      }),
      dataSourceMode: "live-mantle-rpc",
      observation: bundle.observation,
      signal: bundle.signal,
      contract: bundle.contract
    }));
  }

  const now = Date.now();
  const elapsedSeconds = Math.floor((now - lastCommitAt) / 1000);
  if (lastCommitAt > 0 && elapsedSeconds < cooldownSeconds) {
    return Response.json(stringifyBigInts({
      round: buildPreparedRound({
        mode: "live-mantle-rpc",
        reason: `cooldown active; retry in ${cooldownSeconds - elapsedSeconds}s`,
        expiresAt: bundle.signal.expiresAt
      }),
      dataSourceMode: "live-mantle-rpc",
      observation: bundle.observation,
      signal: bundle.signal,
      contract: bundle.contract
    }));
  }

  try {
    const publicClient = createPublicClient({
      transport: http(mantleSepoliaRpcUrl)
    });
    const account = privateKeyToAccount(privateKey);
    const walletClient = createWalletClient({
      account,
      chain: {
        id: chainId,
        name: "Mantle Sepolia",
        nativeCurrency: {
          decimals: 18,
          name: "Mantle",
          symbol: "MNT"
        },
        rpcUrls: {
          default: {
            http: [mantleSepoliaRpcUrl]
          }
        }
      },
      transport: http(mantleSepoliaRpcUrl)
    });

    const signalId = await publicClient.readContract({
      address: signalRegistryAddress,
      abi: signalAbi,
      functionName: "nextSignalId"
    });
    const commitArgs = bundle.contract.args as CommitSignalArgs;
    const hash = await walletClient.writeContract({
      address: signalRegistryAddress,
      abi: signalAbi,
      functionName: "commitSignal",
      args: commitArgs
    });
    lastCommitAt = now;
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return Response.json(stringifyBigInts({
      round: {
        id: `round-${signalId.toString()}`,
        status: "committed",
        mode: "live-mantle-rpc",
        committed: true,
        chainId,
        agentId,
        signalId,
        createdAt: new Date().toISOString(),
        expiresAt: bundle.signal.expiresAt,
        resolverEtaSeconds: secondsUntil(bundle.signal.expiresAt),
        commitTx: hash,
        commitBlock: receipt.blockNumber,
        explorerUrl: `${explorerBaseUrl}/tx/${hash}`,
        signer: account.address,
        nextStep: "Resolve after expiry to update reputation."
      },
      dataSourceMode: "live-mantle-rpc",
      observation: bundle.observation,
      signal: bundle.signal,
      contract: bundle.contract
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mantle commit transaction failed";

    return Response.json(stringifyBigInts({
      round: buildPreparedRound({
        mode: "live-mantle-rpc",
        reason: message,
        expiresAt: bundle.signal.expiresAt
      }),
      dataSourceMode: "live-mantle-rpc",
      warning: message,
      observation: bundle.observation,
      signal: bundle.signal,
      contract: bundle.contract
    }), { status: 200 });
  }
}

function buildPreparedRound({
  mode,
  reason,
  expiresAt
}: {
  mode: "live-mantle-rpc" | "demo-fallback";
  reason: string;
  expiresAt: string;
}) {
  return {
    id: `round-${Date.now()}`,
    status: "prepared",
    mode,
    committed: false,
    chainId,
    agentId,
    createdAt: new Date().toISOString(),
    expiresAt,
    resolverEtaSeconds: secondsUntil(expiresAt),
    reason,
    nextStep: "Commit payload is ready for SignalRegistry."
  };
}

function normalizePrivateKey(value?: string): `0x${string}` | null {
  if (!value) return null;

  const trimmed = value.trim();
  const normalized = trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;

  if (!/^0x[a-fA-F0-9]{64}$/.test(normalized)) return null;
  return normalized as `0x${string}`;
}

function secondsUntil(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return 0;
  return Math.max(0, Math.round((timestamp - Date.now()) / 1000));
}
