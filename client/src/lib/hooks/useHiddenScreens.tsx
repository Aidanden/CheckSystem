'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { systemSettingsService } from '@/lib/api';

interface HiddenScreensContextValue {
  hiddenScreens: string[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const HiddenScreensContext = createContext<HiddenScreensContextValue>({
  hiddenScreens: [],
  loading: true,
  refresh: async () => {},
});

export function HiddenScreensProvider({ children }: { children: ReactNode }) {
  const [hiddenScreens, setHiddenScreens] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { hiddenScreens: screens } = await systemSettingsService.getHiddenScreens();
      setHiddenScreens(screens);
    } catch (error) {
      console.error('فشل تحميل الشاشات المخفية:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ hiddenScreens, loading, refresh }),
    [hiddenScreens, loading, refresh]
  );

  return (
    <HiddenScreensContext.Provider value={value}>
      {children}
    </HiddenScreensContext.Provider>
  );
}

export function useHiddenScreens() {
  return useContext(HiddenScreensContext);
}
