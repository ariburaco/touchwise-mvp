'use client';

import { useAuthMutation, useAuthQuery } from '@/hooks/useConvexQuery';
import { useAuth } from '@/lib/auth-context';
import { api } from '@invoice-tracker/backend/convex/_generated/api';
import {
  SupportedLanguage,
  supportedLanguages,
} from '@invoice-tracker/translations';
import { useTheme } from 'next-themes';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export interface UserSettings {
  language: SupportedLanguage;
  theme: 'light' | 'dark' | 'system';
  timezone?: string;
  dateFormat?: string;
  defaultView?: 'grid' | 'table';
  sidebarCollapsed?: boolean;
  tablePageSize?: number;
  emailNotifications?: boolean;
  lastSyncedAt?: number;
}

interface SettingsContextValue {
  settings: UserSettings | null;
  isLoading: boolean;
  language: SupportedLanguage | undefined;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  syncSettings: () => Promise<void>;
  setLanguage: (language: SupportedLanguage) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

// Get language from cookie fallback (client-side only)
const getCookieLanguage = (): SupportedLanguage => {
  // Only check cookies on client side
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const cookieLanguage = document.cookie
      .split('; ')
      .find((row) => row.startsWith('preferred_language='))
      ?.split('=')[1];

    if (cookieLanguage && supportedLanguages.includes(cookieLanguage as any)) {
      return cookieLanguage as SupportedLanguage;
    }
  }
  return 'en';
};

// Default settings that work on both server and client
const DEFAULT_SETTINGS: UserSettings = {
  language: 'en',
  theme: 'system',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  defaultView: 'grid',
  sidebarCollapsed: false,
  tablePageSize: 25,
  emailNotifications: true,
};

// Get default settings with client-side enhancements
const getDefaultSettings = (): UserSettings => {
  // Start with stable defaults
  const settings = { ...DEFAULT_SETTINGS };

  // Only enhance on client side
  if (typeof window !== 'undefined') {
    settings.language = getCookieLanguage();
    settings.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  return settings;
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { session, isConvexReady } = useAuth();
  const { setTheme } = useTheme();
  const { i18n } = useTranslation();

  // Initialize with defaults immediately for SSR compatibility
  const [localSettings, setLocalSettings] =
    useState<UserSettings>(getDefaultSettings());
  const [isInitialized, setIsInitialized] = useState(false);

  // Query user settings - only when both session exists AND Convex is authenticated
  const settingsQuery = useAuthQuery(
    api.user.userSettings.get,
    {},
    { enabled: !!session?.user && isConvexReady }
  );

  // Mutations
  const updateSettingsMutation = useAuthMutation(api.user.userSettings.update);
  const syncSettingsMutation = useAuthMutation(api.user.userSettings.sync);

  // Update settings when query data changes
  useEffect(() => {
    // For authenticated users, update settings when data arrives
    if (session && settingsQuery.data && !settingsQuery.isPending) {
      const settings = settingsQuery.data;
      setLocalSettings(settings as UserSettings);

      // Sync with i18n and theme
      if (settings.language) {
        i18n.changeLanguage(settings.language);
      }

      if (settings.theme) {
        setTheme(settings.theme);
      }

      setIsInitialized(true);
    } else if (session && settingsQuery.error) {
      // User is authenticated but settings query failed - use defaults
      console.warn(
        'Failed to load user settings, using defaults:',
        settingsQuery.error
      );
      if (!isInitialized) {
        const defaultSettings = getDefaultSettings();
        setLocalSettings(defaultSettings);

        // Sync with i18n and theme
        i18n.changeLanguage(defaultSettings.language);
        setTheme(defaultSettings.theme);

        setIsInitialized(true);
      }
    } else if (session === null && !isInitialized) {
      // User is explicitly not authenticated - use default settings
      const defaultSettings = getDefaultSettings();
      setLocalSettings(defaultSettings);

      // Sync with i18n and theme
      i18n.changeLanguage(defaultSettings.language);
      setTheme(defaultSettings.theme);

      setIsInitialized(true);
    }
  }, [
    session,
    settingsQuery.data,
    settingsQuery.error,
    settingsQuery.isPending,
    i18n,
    setTheme,
    isInitialized, // Add isInitialized to prevent warnings
  ]);

  // Update settings
  const updateSettings = useCallback(
    async (updates: Partial<UserSettings>) => {
      if (!session) {
        // For unauthenticated users, just update local state and cookies
        setLocalSettings((prev) => ({ ...prev, ...updates }) as UserSettings);

        // Update i18n if language changed
        if (updates.language) {
          i18n.changeLanguage(updates.language);
          // Update cookie
          document.cookie = `preferred_language=${updates.language}; path=/; max-age=${60 * 60 * 24 * 365}`;
        }

        // Update theme if changed
        if (updates.theme) {
          setTheme(updates.theme);
        }

        return;
      }

      try {
        // Optimistically update local state
        setLocalSettings((prev) => ({ ...prev, ...updates }) as UserSettings);

        // Update i18n if language changed
        if (updates.language) {
          i18n.changeLanguage(updates.language);
        }

        // Update theme if changed
        if (updates.theme) {
          setTheme(updates.theme);
        }

        // Update in backend - only send fields that are being updated
        const updatePayload: any = {};
        if (updates.language !== undefined)
          updatePayload.language = updates.language;
        if (updates.theme !== undefined) updatePayload.theme = updates.theme;
        if (updates.timezone !== undefined)
          updatePayload.timezone = updates.timezone;
        if (updates.dateFormat !== undefined)
          updatePayload.dateFormat = updates.dateFormat;
        if (updates.defaultView !== undefined)
          updatePayload.defaultView = updates.defaultView;
        if (updates.sidebarCollapsed !== undefined)
          updatePayload.sidebarCollapsed = updates.sidebarCollapsed;
        if (updates.tablePageSize !== undefined)
          updatePayload.tablePageSize = updates.tablePageSize;
        if (updates.emailNotifications !== undefined)
          updatePayload.emailNotifications = updates.emailNotifications;

        const updatedSettings =
          await updateSettingsMutation.mutate(updatePayload);

        if (updatedSettings) {
          setLocalSettings(updatedSettings as UserSettings);
          toast.success('Settings updated successfully');
        }
      } catch (error) {
        console.error('Failed to update settings:', error);
        toast.error('Failed to update settings');
        // Revert optimistic update by reloading from backend
        if (settingsQuery.data) {
          setLocalSettings(settingsQuery.data as UserSettings);
        }
        throw error;
      }
    },
    [session, updateSettingsMutation, i18n, setTheme, settingsQuery]
  );

  // Convenience methods for language and currency
  const setLanguage = useCallback(
    async (language: SupportedLanguage) => {
      await updateSettings({ language });
    },
    [updateSettings]
  );

  // Sync settings with backend
  const syncSettings = useCallback(async () => {
    if (!session || !localSettings) return;

    try {
      const syncedSettings = await syncSettingsMutation.mutate({
        settings: {
          language: localSettings.language,
          theme: localSettings.theme,
          timezone: localSettings.timezone,
          dateFormat: localSettings.dateFormat,
          defaultView: localSettings.defaultView,
          sidebarCollapsed: localSettings.sidebarCollapsed,
          tablePageSize: localSettings.tablePageSize,
          emailNotifications: localSettings.emailNotifications,
        },
        clientType: 'web',
        clientTimestamp: Date.now(),
      });

      if (syncedSettings) {
        setLocalSettings(syncedSettings as UserSettings);
      }
    } catch (error) {
      console.error('Failed to sync settings:', error);
    }
  }, [session, localSettings, syncSettingsMutation]);

  const value: SettingsContextValue = {
    settings: localSettings,
    // Show loading state while fetching settings for authenticated users
    isLoading: session
      ? (!isInitialized && settingsQuery.isPending) || !isConvexReady
      : false,
    updateSettings,
    syncSettings,
    language: localSettings.language,
    setLanguage,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
