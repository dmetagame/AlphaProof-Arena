"use client";

import { ArrowUpRight, Radio } from "lucide-react";
import { useEffect, useState } from "react";

type TickerEntry = {
  blockNumber: string;
  timestamp: string;
  txCount: number;
  sampleTx?: `0x${string}`;
};

type TickerResponse = {
  observedAt: string;
  chainId: number;
  entries: TickerEntry[];
  error?: string;
};

const REFRESH_MS = 12_000;
const EXPLORER = "https://sepolia.mantlescan.xyz";

export function BlockStreamTicker() {
  const [entries, setEntries] = useState<TickerEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "live" | "stale">("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/chain-ticker", { cache: "no-store" });
        if (!response.ok) throw new Error("ticker fetch failed");
        const data = (await response.json()) as TickerResponse;
        if (cancelled) return;
        setEntries(data.entries);
        setStatus(data.entries.length > 0 ? "live" : "stale");
      } catch {
        if (cancelled) return;
        setStatus("stale");
      }
    }

    void load();
    const interval = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (entries.length === 0 && status === "loading") {
    return (
      <div className="block-ticker loading" aria-label="Mantle Sepolia block stream">
        <span className="ticker-badge">
          <Radio size={11} aria-hidden="true" />
          Mantle Sepolia
        </span>
        <span className="ticker-empty">Reading recent blocks…</span>
      </div>
    );
  }

  // Duplicate the entries so the marquee loop has no gap.
  const reel = [...entries, ...entries];

  return (
    <div className={`block-ticker ${status}`} aria-label="Mantle Sepolia block stream">
      <span className="ticker-badge">
        <Radio size={11} aria-hidden="true" />
        Mantle Sepolia
      </span>
      <div className="ticker-viewport" aria-live="off">
        <div className="ticker-reel">
          {reel.map((entry, index) => (
            <a
              key={`${entry.blockNumber}-${index}`}
              className="ticker-item"
              href={entry.sampleTx ? `${EXPLORER}/tx/${entry.sampleTx}` : `${EXPLORER}/block/${entry.blockNumber}`}
              target="_blank"
              rel="noreferrer"
            >
              <span className="ticker-tag">#</span>
              <strong>{entry.blockNumber}</strong>
              <span className="ticker-meta">{entry.txCount} tx</span>
              {entry.sampleTx ? (
                <span className="ticker-hash">{shorten(entry.sampleTx)}</span>
              ) : null}
              <ArrowUpRight size={11} aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function shorten(value: string) {
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}
