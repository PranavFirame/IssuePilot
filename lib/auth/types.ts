export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  githubId: string | null;
  githubUsername: string | null;
  isVerified: boolean;
  createdAt: Date;
}

export interface SessionWithUser {
  id: string;
  sessionToken: string;
  userId: string;
  expiresAt: Date;
  user: AuthUser;
}
