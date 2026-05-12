import { buildDemoCommitBundle, stringifyBigInts } from "../../../../../services/agent/src/demoBundle.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return Response.json(stringifyBigInts(buildDemoCommitBundle()));
}
