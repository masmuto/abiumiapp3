// Provider TanStack Query untuk data fetching & sinkronisasi real-time
'use client';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Refresh cepat untuk sinkronisasi antar perangkat
            staleTime: 5_000,
            refetchOnWindowFocus: true,
            refetchOnMount: true,
            refetchInterval: 30_000, // refresh tiap 30s saat tab aktif
            retry: 1,
          },
        },
      })
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
