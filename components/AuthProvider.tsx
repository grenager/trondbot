"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { parseProfile, resolveDisplayName, getAvatarUrlFromUser } from "@/lib/supabase/profile";
import type { Profile } from "@/lib/supabase/types";

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  displayName: string | null;
  avatarUrl: string | null;
  authReady: boolean;
  profileLoading: boolean;
  supabaseEnabled: boolean;
  signInWithGoogle: () => Promise<string | null>;
  sendEmailCode: (email: string) => Promise<string | null>;
  verifyEmailCode: (email: string, code: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
  updateProfileCredits: (credits: number) => Promise<Profile | null>;
  updateProfileDisplayName: (displayName: string | null) => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getAuthCallbackUrl(): string {
  return `${window.location.origin}/auth/callback`;
}

async function fetchProfile(): Promise<Profile | null> {
  const response = await fetch("/api/user/profile");
  if (!response.ok) {
    return null;
  }

  const data: unknown = await response.json();
  if (
    typeof data !== "object" ||
    data === null ||
    !("profile" in data) ||
    typeof data.profile !== "object" ||
    data.profile === null
  ) {
    return null;
  }

  return parseProfile(data.profile);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const supabaseEnabled: boolean = isSupabaseConfigured();

  const refreshProfile = useCallback(async (): Promise<Profile | null> => {
    if (!supabaseEnabled) {
      return null;
    }

    setProfileLoading(true);
    try {
      const nextProfile: Profile | null = await fetchProfile();
      setProfile(nextProfile);
      return nextProfile;
    } finally {
      setProfileLoading(false);
    }
  }, [supabaseEnabled]);

  const updateProfileCredits = useCallback(
    async (credits: number): Promise<Profile | null> => {
      if (!supabaseEnabled || !user) {
        return null;
      }

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits }),
      });

      if (!response.ok) {
        return null;
      }

      const data: unknown = await response.json();
      if (
        typeof data !== "object" ||
        data === null ||
        !("profile" in data) ||
        typeof data.profile !== "object" ||
        data.profile === null
      ) {
        return null;
      }

      const nextProfile: Profile | null = parseProfile(
        (data as { profile: unknown }).profile,
      );
      setProfile(nextProfile);
      return nextProfile;
    },
    [supabaseEnabled, user],
  );

  const updateProfileDisplayName = useCallback(
    async (displayName: string | null): Promise<Profile | null> => {
      if (!supabaseEnabled || !user) {
        return null;
      }

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName }),
      });

      if (!response.ok) {
        return null;
      }

      const data: unknown = await response.json();
      if (
        typeof data !== "object" ||
        data === null ||
        !("profile" in data) ||
        typeof data.profile !== "object" ||
        data.profile === null
      ) {
        return null;
      }

      const nextProfile: Profile | null = parseProfile(
        (data as { profile: unknown }).profile,
      );
      setProfile(nextProfile);
      return nextProfile;
    },
    [supabaseEnabled, user],
  );

  useEffect(() => {
    if (!supabaseEnabled) {
      setAuthReady(true);
      return;
    }

    const supabase = createClient();
    let cancelled = false;

    async function loadInitialSession(): Promise<void> {
      const {
        data: { user: initialUser },
      } = await supabase.auth.getUser();

      if (cancelled) {
        return;
      }

      setUser(initialUser);
      setAuthReady(true);

      if (initialUser) {
        setProfileLoading(true);
        try {
          const nextProfile: Profile | null = await fetchProfile();
          if (!cancelled) {
            setProfile(nextProfile);
          }
        } finally {
          if (!cancelled) {
            setProfileLoading(false);
          }
        }
      }
    }

    void loadInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser: User | null = session?.user ?? null;
      setUser(nextUser);

      if (nextUser) {
        void refreshProfile();
      } else {
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [refreshProfile, supabaseEnabled]);

  const signInWithGoogle = useCallback(async (): Promise<string | null> => {
    if (!supabaseEnabled) {
      return "Supabase is not configured";
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthCallbackUrl(),
      },
    });

    return error?.message ?? null;
  }, [supabaseEnabled]);

  const sendEmailCode = useCallback(
    async (email: string): Promise<string | null> => {
      if (!supabaseEnabled) {
        return "Supabase is not configured";
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      return error?.message ?? null;
    },
    [supabaseEnabled],
  );

  const verifyEmailCode = useCallback(
    async (email: string, code: string): Promise<string | null> => {
      if (!supabaseEnabled) {
        return "Supabase is not configured";
      }

      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: "email",
      });

      return error?.message ?? null;
    },
    [supabaseEnabled],
  );

  const signOut = useCallback(async (): Promise<void> => {
    if (!supabaseEnabled) {
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut();
    setProfile(null);
  }, [supabaseEnabled]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      displayName: resolveDisplayName(profile, user),
      avatarUrl: getAvatarUrlFromUser(user),
      authReady,
      profileLoading,
      supabaseEnabled,
      signInWithGoogle,
      sendEmailCode,
      verifyEmailCode,
      signOut,
      refreshProfile,
      updateProfileCredits,
      updateProfileDisplayName,
    }),
    [
      user,
      profile,
      authReady,
      profileLoading,
      supabaseEnabled,
      signInWithGoogle,
      sendEmailCode,
      verifyEmailCode,
      signOut,
      refreshProfile,
      updateProfileCredits,
      updateProfileDisplayName,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
