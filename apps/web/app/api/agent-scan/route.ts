import {
  buildDemoCommitBundle,
  buildLiveCommitBundle,
  stringifyBigInts
} from "../../../../../services/agent/src/demoBundle.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json(stringifyBigInts({
      ...(await buildLiveCommitBundle()),
      dataSourceMode: "live-mantle-rpc"
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "live Mantle RPC observation failed";

    return Response.json(stringifyBigInts({
      ...buildDemoCommitBundle(),
      dataSourceMode: "demo-fallback",
      warning: message
    }));
  }
}
