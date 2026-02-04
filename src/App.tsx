import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { CommandPaletteProvider } from '@/contexts/CommandPaletteContext';
import { Toaster } from '@/components/ui/sonner';
import { router } from '@/app/routes';
import { OfflineIndicator, PWAUpdatePrompt } from '@/components/pwa';

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
      <LanguageProvider defaultLanguage="ja">
        <AuthProvider>
          <CommandPaletteProvider>
            <RouterProvider router={router} />
            <Toaster position="top-right" />
            <OfflineIndicator />
            <PWAUpdatePrompt />
          </CommandPaletteProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
