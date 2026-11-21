'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { products as staticProducts, type Product } from '@/data/catalog';
import { createSupabaseAuthBrowserClient } from '@dashboard/lib/supabase-auth-browser';

type CatalogStatus = 'loading' | 'ready' | 'error';

type CatalogContextValue = {
  products: Product[];
  status: CatalogStatus;
  error: string | null;
  source: 'built-in' | 'supabase' | null;
  aliases: Record<string, string>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [products, setProducts] = useState<Product[]>(staticProducts);
  const [status, setStatus] = useState<CatalogStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<CatalogContextValue['source']>(null);
  const [aliases, setAliases] = useState<Record<string, string>>({});

  useEffect(() => {
    if (pathname.startsWith('/auth') || pathname.startsWith('/dashboard')) return;
    let active = true;
    let requestId = 0;
    let loaded = false;

    async function loadCatalog() {
      const currentRequestId = ++requestId;
      try {
        const response = await fetch('/api/store/products', { cache: 'no-store' });
        const result = (await response.json()) as {
          products?: Product[];
          source?: CatalogContextValue['source'];
          aliases?: Record<string, string>;
          error?: string;
        };
        if (!response.ok || !Array.isArray(result.products)) {
          throw new Error(result.error ?? 'The store catalog could not be loaded.');
        }
        if (result.source !== 'built-in' && result.source !== 'supabase') {
          throw new Error('The store catalog response was invalid.');
        }
        if (!result.aliases || typeof result.aliases !== 'object' || Array.isArray(result.aliases)) {
          throw new Error('The product URL redirect response was invalid.');
        }
        if (!active || currentRequestId !== requestId) return;
        setProducts(result.products);
        setSource(result.source);
        setAliases(result.aliases);
        setStatus('ready');
        loaded = true;
      } catch (cause) {
        if (!active || currentRequestId !== requestId) return;
        const message = cause instanceof Error ? cause.message : 'The store catalog could not be loaded.';
        if (loaded) {
          toast.error('The storefront could not refresh product updates.', { description: message });
          return;
        }
        setProducts([]);
        setError(message);
        setStatus('error');
        toast.error('The store catalog could not be loaded.', { description: message });
      }
    }

    void loadCatalog();

    let realtimeErrorShown = false;
    let channel: ReturnType<ReturnType<typeof createSupabaseAuthBrowserClient>['channel']> | undefined;
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      try {
        channel = createSupabaseAuthBrowserClient()
          .channel('storefront-products')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'products' },
            () => void loadCatalog()
          )
          .subscribe((subscriptionStatus) => {
            if (subscriptionStatus === 'SUBSCRIBED') {
              void loadCatalog();
            } else if (
              !realtimeErrorShown &&
              (subscriptionStatus === 'CHANNEL_ERROR' || subscriptionStatus === 'TIMED_OUT')
            ) {
              realtimeErrorShown = true;
              toast.error('Live product updates are unavailable. Apply the latest Supabase migrations and reconnect.');
            }
          });
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : 'Supabase Realtime could not be initialized.';
        toast.error('Live product updates are unavailable.', { description: message });
      }
    }

    return () => {
      active = false;
      if (channel) void channel.unsubscribe();
    };
  }, [pathname]);

  const value = useMemo(
    () => ({ products, status, error, source, aliases }),
    [products, status, error, source, aliases]
  );
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error('useCatalog must be used within CatalogProvider');
  return context;
}
