'use client';

/**
 * Provider React Query pour l'application
 * Gère le cache et les états des requêtes API
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0, // Pas de cache par défaut - chaque query définit son propre staleTime
            refetchOnWindowFocus: true, // Rafraîchir par défaut quand on revient sur l'onglet
            retry: 1,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
