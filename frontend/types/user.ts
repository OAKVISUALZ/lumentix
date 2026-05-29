export interface UserProfile {
  id: string;
  email: string;
  role: string;
  status: string;
  stellarPublicKey: string | null;
  emailOptOut: boolean;
  notificationPreferences: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface SocialProfile {
  id: string;
  userId: string;
  displayName: string | null;
  bio: string | null;
  title: string | null;
}

export interface WalletStatus {
  linked: boolean;
  publicKey: string | null;
}
