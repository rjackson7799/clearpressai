import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { CommandPaletteProvider } from '@/contexts/CommandPaletteContext';
import { Toaster } from '@/components/ui/sonner';
import { AppErrorBoundary } from '@/components/common/ErrorBoundary';
import { router } from '@/app/routes';
import { OfflineIndicator, PWAUpdatePrompt } from '@/components/pwa';

// Dev diagnostics panel — lazy-loaded, tree-shaken from production builds
const DevDiagnostics = import.meta.env.DEV
  ? lazy(() => import('@/components/dev/DevDiagnostics'))
  : null;

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppErrorBoundary>
        <LanguageProvider defaultLanguage="ja">
          <AuthProvider>
            <CommandPaletteProvider>
              <RouterProvider router={router} />
              <Toaster position="top-right" />
              <OfflineIndicator />
              <PWAUpdatePrompt />
              {DevDiagnostics && (
                <Suspense fallback={null}>
                  <DevDiagnostics />
                </Suspense>
              )}
            </CommandPaletteProvider>
          </AuthProvider>
        </LanguageProvider>
      </AppErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
