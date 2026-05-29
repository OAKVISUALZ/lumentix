"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useWallet } from "@/contexts/WalletContext";
import { connectFreighter, signMessageWithFreighter } from "@/lib/stellar/freighter";
import { parseApiErrorMessage } from "@/lib/parse-api-error";
import { getAuthToken } from "@/hooks/useProfile";

function truncateKey(key: string): string {
  if (key.length <= 12) return key;
  return `${key.slice(0, 6)}…${key.slice(-4)}`;
}

interface WalletLinkSectionProps {
  linkedPublicKey: string | null;
  onLinked: () => void;
}

export default function WalletLinkSection({
  linkedPublicKey,
  onLinked,
}: WalletLinkSectionProps) {
  const { network } = useWallet();
  const [linking, setLinking] = useState(false);
  const [challengeMessage, setChallengeMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const linkWallet = async () => {
    const token = getAuthToken();
    if (!token) {
      setError("Sign in to link a wallet.");
      return;
    }

    setLinking(true);
    setError(null);
    setSuccess(null);
    setChallengeMessage(null);

    try {
      const publicKey = await connectFreighter(network);
      const { message } = await apiClient.walletChallenge(publicKey);
      setChallengeMessage(message);

      const signature = await signMessageWithFreighter(message, publicKey);
      await apiClient.walletVerify({ publicKey, signature }, token);

      setSuccess("Wallet linked successfully.");
      setChallengeMessage(null);
      onLinked();
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setLinking(false);
    }
  };

  return (
    <section className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-white mb-1">Stellar Wallet</h2>
      <p className="text-sm text-gray-500 mb-5">
        Link your Freighter wallet to receive payouts and verify on-chain identity.
      </p>

      {linkedPublicKey ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">
              Linked wallet
            </div>
            <div className="font-mono text-sm text-emerald-300" title={linkedPublicKey}>
              {truncateKey(linkedPublicKey)}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400 mb-4">No wallet linked yet.</p>
      )}

      {challengeMessage && (
        <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/25">
          <div className="text-xs text-blue-300 uppercase tracking-wider mb-2">
            Message to sign in Freighter
          </div>
          <p className="font-mono text-xs text-gray-300 break-all leading-relaxed">
            {challengeMessage}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => void linkWallet()}
        disabled={linking}
        className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 transition-all"
      >
        {linking
          ? "Waiting for Freighter…"
          : linkedPublicKey
            ? "Link a different wallet"
            : "Link wallet with Freighter"}
      </button>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {success && <p className="mt-3 text-sm text-emerald-400">{success}</p>}
    </section>
  );
}
