import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { User, Species } from '../types/index';
import { api, setApiTokenProvider } from './api';
import { detectSpecies, getTheme, Theme } from './theme';

interface AppContextValue {
  currentUser: User | null;
  species: Species;
  theme: Theme;
  token: string | null;
  refreshUser: () => Promise<void>;
  unreadCount: number;
  refreshUnread: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const species = detectSpecies();
  const theme = getTheme(species);

  useEffect(() => {
    setApiTokenProvider(getToken);
    return () => setApiTokenProvider(null);
  }, [getToken]);

  const refreshToken = useCallback(async () => {
    const t = await getToken();
    setToken(t);
    return t;
  }, [getToken]);

  const refreshUser = useCallback(async () => {
    const t = await refreshToken();
    if (!t || !clerkUser) return;
    try {
      const username = clerkUser.username ||
        clerkUser.primaryEmailAddress?.emailAddress.split('@')[0].replace(/[^a-z0-9_]/gi, '_') ||
        `user_${clerkUser.id.slice(-6)}`;

      const user = await api.syncUser({
        username,
        display_name: clerkUser.fullName || username,
        avatar_url: clerkUser.imageUrl || '',
        bio: '',
        species,
      }, t) as User;
      setCurrentUser(user);
    } catch (err) {
      console.error('Failed to sync user:', err);
    }
  }, [clerkUser, species, refreshToken]);

  const refreshUnread = useCallback(async () => {
    const t = token || await refreshToken();
    if (!t) return;
    try {
      const data = await api.getUnreadCount(t) as { count: number };
      setUnreadCount(data.count);
    } catch { /* silent */ }
  }, [token, refreshToken]);

  useEffect(() => {
    if (isSignedIn && clerkUser) {
      refreshUser();
    } else {
      setCurrentUser(null);
      setToken(null);
    }
  }, [isSignedIn, clerkUser?.id]);

  useEffect(() => {
    if (token) {
      refreshUnread();
      const interval = setInterval(refreshUnread, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  return (
    <AppContext.Provider value={{ currentUser, species, theme, token, refreshUser, unreadCount, refreshUnread }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
