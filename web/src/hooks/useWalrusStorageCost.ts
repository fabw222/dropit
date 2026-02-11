import { useState, useEffect, useMemo } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { WalrusClient } from "@mysten/walrus";
import wasmUrl from "@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url";

const FROST_PER_WAL = 1_000_000_000n;
const DEFAULT_EPOCHS = 5;

export function formatWal(frost: bigint): string {
  const whole = frost / FROST_PER_WAL;
  const remainder = frost % FROST_PER_WAL;
  const decimal = remainder.toString().padStart(9, "0").slice(0, 4);
  return `${whole}.${decimal}`;
}

interface StorageCostResult {
  totalCost: bigint | null;
  walBalance: bigint | null;
  isLoading: boolean;
  error: string | null;
  hasSufficientBalance: boolean | null;
}

export function useWalrusStorageCost(
  fileSize: number | null,
  ownerAddress: string | null,
  epochs = DEFAULT_EPOCHS,
): StorageCostResult {
  const suiClient = useSuiClient();

  const walrusClient = useMemo(
    () =>
      new WalrusClient({
        network: "testnet",
        suiClient,
        wasmUrl,
      }),
    [suiClient],
  );

  const [totalCost, setTotalCost] = useState<bigint | null>(null);
  const [walBalance, setWalBalance] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estimate storage cost when file size changes
  useEffect(() => {
    if (fileSize == null || fileSize <= 0) {
      setTotalCost(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    walrusClient
      .storageCost(fileSize, epochs)
      .then((cost) => {
        if (!cancelled) {
          setTotalCost(cost.totalCost);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Failed to estimate cost");
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [walrusClient, fileSize, epochs]);

  // Fetch WAL balance when owner address is available
  useEffect(() => {
    if (!ownerAddress) {
      setWalBalance(null);
      return;
    }

    let cancelled = false;

    suiClient
      .getAllBalances({ owner: ownerAddress })
      .then((balances) => {
        if (cancelled) return;
        const walEntry = balances.find((b) =>
          b.coinType.includes("::wal::WAL"),
        );
        setWalBalance(walEntry ? BigInt(walEntry.totalBalance) : 0n);
      })
      .catch(() => {
        if (!cancelled) setWalBalance(null);
      });

    return () => {
      cancelled = true;
    };
  }, [suiClient, ownerAddress]);

  const hasSufficientBalance =
    totalCost != null && walBalance != null
      ? walBalance >= totalCost
      : null;

  return { totalCost, walBalance, isLoading, error, hasSufficientBalance };
}
