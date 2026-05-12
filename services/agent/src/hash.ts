import { keccak256, stringToHex } from "viem";

export function stableJson(value: unknown): string {
  return JSON.stringify(sortForStableJson(value));
}

export function hashJson(value: unknown): `0x${string}` {
  return keccak256(stringToHex(stableJson(value)));
}

export function hashText(value: string): `0x${string}` {
  return keccak256(stringToHex(value));
}

function sortForStableJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortForStableJson);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, inner]) => [key, sortForStableJson(inner)])
  );
}

