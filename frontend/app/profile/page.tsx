"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import WalletLinkSection from "@/components/WalletLinkSection";
import Toast from "@/components/profile/Toast";
import { useProfile } from "@/hooks/useProfile";
import { parseApiErrorMessage } from "@/lib/parse-api-error";

type ToastState = { message: string; variant: "success" | "error" } | null;

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-white mb-1">{title}</h2>
      {description && <p className="text-sm text-gray-500 mb-5">{description}</p>}
      {!description && <div className="mb-5" />}
      {children}
    </section>
  );
}

function DeactivateModal({
  onClose,
  onConfirm,
  loading,
  error,
}: {
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  error: string | null;
}) {
  const [confirmText, setConfirmText] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#0e0e14] p-6 text-white shadow-2xl">
        <h3 className="text-xl font-bold text-red-400 mb-2">Deactivate account</h3>
        <p className="text-sm text-gray-400 mb-4">
          This permanently deactivates your account. You cannot undo this action.
          Type <span className="font-mono text-red-300">DEACTIVATE</span> to confirm.
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="DEACTIVATE"
          className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-red-500/50 mb-4"
          autoComplete="off"
        />
        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || confirmText !== "DEACTIVATE"}
            className="px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-500 disabled:opacity-40 transition-colors"
          >
            {loading ? "Deactivating…" : "Deactivate account"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const {
    user,
    socialProfile,
    walletStatus,
    loading,
    error: loadError,
    isAuthenticated,
    updateEmail,
    updateDisplayName,
    updateEmailOptOut,
    deactivateAccount,
    refreshWalletStatus,
  } = useProfile();

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [emailOptOut, setEmailOptOut] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setEmailOptOut(user.emailOptOut ?? false);
    }
  }, [user]);

  useEffect(() => {
    if (socialProfile?.displayName !== undefined) {
      setDisplayName(socialProfile.displayName ?? "");
    }
  }, [socialProfile]);

  const showToast = useCallback((message: string, variant: "success" | "error" = "success") => {
    setToast({ message, variant });
  }, []);

  const saveEmail = async () => {
    setSavingEmail(true);
    setSectionError(null);
    try {
      await updateEmail(email.trim());
      showToast("Email updated.");
    } catch (err) {
      setSectionError(parseApiErrorMessage(err));
    } finally {
      setSavingEmail(false);
    }
  };

  const saveDisplayName = async () => {
    setSavingName(true);
    setSectionError(null);
    try {
      await updateDisplayName(displayName.trim());
      showToast("Display name saved.");
    } catch (err) {
      setSectionError(parseApiErrorMessage(err));
    } finally {
      setSavingName(false);
    }
  };

  const toggleEmailOptOut = async () => {
    const next = !emailOptOut;
    setSavingNotif(true);
    setSectionError(null);
    try {
      await updateEmailOptOut(next);
      setEmailOptOut(next);
      showToast(next ? "Email notifications disabled." : "Email notifications enabled.");
    } catch (err) {
      setSectionError(parseApiErrorMessage(err));
    } finally {
      setSavingNotif(false);
    }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    setDeactivateError(null);
    try {
      await deactivateAccount();
      router.push("/");
    } catch (err) {
      setDeactivateError(parseApiErrorMessage(err));
      setDeactivating(false);
    }
  };

  if (!isAuthenticated && !loading) {
    return (
      <main className="min-h-screen bg-[#060609] text-white flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-3">Sign in required</h1>
          <p className="text-gray-500 text-sm mb-6">
            Log in and paste your access token on the create event page, then return here.
          </p>
          <a
            href="/create"
            className="inline-block px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
          >
            Go to sign in
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#060609] text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-600/[0.04] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-indigo-600/[0.03] rounded-full blur-[130px]" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
          <p className="text-gray-500 text-sm">Manage your account, wallet, and notifications.</p>
        </header>

        {loading && (
          <p className="text-gray-500 text-sm animate-pulse">Loading profile…</p>
        )}

        {loadError && (
          <p className="mb-6 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {loadError}
          </p>
        )}

        {!loading && user && (
          <div className="space-y-6">
            <SectionCard
              title="Account info"
              description="Update your email and how others see your name."
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
                    Display name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How you appear to others"
                    maxLength={100}
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => void saveEmail()}
                    disabled={savingEmail || email.trim() === user.email}
                    className="px-4 py-2 rounded-xl bg-white/[0.08] border border-white/[0.1] text-sm text-white hover:bg-white/[0.12] disabled:opacity-40 transition-colors"
                  >
                    {savingEmail ? "Saving…" : "Save email"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveDisplayName()}
                    disabled={savingName}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-sm text-white font-medium hover:bg-blue-500 disabled:opacity-60 transition-colors"
                  >
                    {savingName ? "Saving…" : "Save display name"}
                  </button>
                </div>
              </div>
            </SectionCard>

            <WalletLinkSection
              linkedPublicKey={
                walletStatus?.publicKey ?? user.stellarPublicKey ?? null
              }
              onLinked={() => void refreshWalletStatus()}
            />

            <SectionCard
              title="Notifications"
              description="Control whether you receive non-critical email updates."
            >
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <div>
                  <div className="text-sm text-white font-medium">Opt out of emails</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Critical emails (refunds, cancellations) are still sent.
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={emailOptOut}
                  disabled={savingNotif}
                  onClick={() => void toggleEmailOptOut()}
                  className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
                    emailOptOut ? "bg-blue-600" : "bg-white/10"
                  } ${savingNotif ? "opacity-60" : ""}`}
                >
                  <span
                    className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      emailOptOut ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </label>
            </SectionCard>

            <section className="bg-red-500/[0.04] border border-red-500/20 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-red-400 mb-1">Danger zone</h2>
              <p className="text-sm text-gray-500 mb-4">
                Deactivate your account. You must have no active tickets.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDeactivateError(null);
                  setShowDeactivate(true);
                }}
                className="px-4 py-2 rounded-xl border border-red-500/40 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
              >
                Deactivate account
              </button>
            </section>

            {sectionError && (
              <p className="text-sm text-red-400">{sectionError}</p>
            )}
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}

      {showDeactivate && (
        <DeactivateModal
          onClose={() => setShowDeactivate(false)}
          onConfirm={() => void handleDeactivate()}
          loading={deactivating}
          error={deactivateError}
        />
      )}
    </main>
  );
}
