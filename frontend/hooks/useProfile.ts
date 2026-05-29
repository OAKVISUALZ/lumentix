"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { parseApiErrorMessage } from "@/lib/parse-api-error";
import type { SocialProfile, UserProfile, WalletStatus } from "@/types/user";

export function getAuthToken(): string {
  return typeof window !== "undefined"
    ? localStorage.getItem("lumentix_access_token") ?? ""
    : "";
}

export interface ProfileState {
  user: UserProfile | null;
  socialProfile: SocialProfile | null;
  walletStatus: WalletStatus | null;
  loading: boolean;
  error: string | null;
}

export function useProfile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [socialProfile, setSocialProfile] = useState<SocialProfile | null>(null);
  const [walletStatus, setWalletStatus] = useState<WalletStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      setUser(null);
      setSocialProfile(null);
      setWalletStatus(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [me, social, wallet] = await Promise.all([
        apiClient.getMe(token),
        apiClient.getSocialProfile(token),
        apiClient.getWalletStatus(token),
      ]);
      setUser(me);
      setSocialProfile(social);
      setWalletStatus(wallet);
    } catch (err) {
      setError(parseApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updateEmail = useCallback(
    async (email: string) => {
      const token = getAuthToken();
      if (!token) throw new Error("Not signed in");
      const updated = await apiClient.patchMe({ email }, token);
      setUser(updated);
      return updated;
    },
    [],
  );

  const updateDisplayName = useCallback(
    async (displayName: string) => {
      const token = getAuthToken();
      if (!token) throw new Error("Not signed in");
      const updated = await apiClient.updateSocialProfile({ displayName }, token);
      setSocialProfile(updated);
      return updated;
    },
    [],
  );

  const updateEmailOptOut = useCallback(
    async (emailOptOut: boolean) => {
      const token = getAuthToken();
      if (!token) throw new Error("Not signed in");
      const updated = await apiClient.patchUserPreferences({ emailOptOut }, token);
      setUser(updated);
      return updated;
    },
    [],
  );

  const deactivateAccount = useCallback(async () => {
    const token = getAuthToken();
    if (!token) throw new Error("Not signed in");
    await apiClient.deleteMe(token);
    localStorage.removeItem("lumentix_access_token");
    localStorage.removeItem("lumentix_refresh_token");
  }, []);

  const refreshWalletStatus = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    const wallet = await apiClient.getWalletStatus(token);
    setWalletStatus(wallet);
    const me = await apiClient.getMe(token);
    setUser(me);
  }, []);

  return {
    user,
    socialProfile,
    walletStatus,
    loading,
    error,
    reload,
    updateEmail,
    updateDisplayName,
    updateEmailOptOut,
    deactivateAccount,
    refreshWalletStatus,
    isAuthenticated: !!getAuthToken(),
  };
}
