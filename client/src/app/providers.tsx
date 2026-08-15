'use client';

import { Provider } from 'react-redux';
import { store } from '@/store';
import { ReactNode } from 'react';
import { HiddenScreensProvider } from '@/lib/hooks/useHiddenScreens';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <HiddenScreensProvider>{children}</HiddenScreensProvider>
    </Provider>
  );
}

