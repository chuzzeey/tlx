import { HydrationBoundary, dehydrate, noop } from '@tanstack/react-query';
import { getQueryClient } from '@dashboard/lib/query-client';
import { pokemonQueries } from '@dashboard/features/react-query-demo/api/queries';
import { PokemonInfo } from '@dashboard/features/react-query-demo/components/pokemon-info';
import PageContainer from '@dashboard/components/layout/page-container';
import { Suspense } from 'react';
import { PokemonSkeleton } from '@dashboard/features/react-query-demo/components/pokemon-skeleton';
import { reactQueryInfoContent } from '@dashboard/features/react-query-demo/info-content';

export const metadata = {
  title: 'Dashboard: React Query'
};

export default async function ReactQueryPage() {

  const queryClient = getQueryClient();

  // Prefetch on the server — data is ready before client JS loads
  void queryClient.query(pokemonQueries.detail(25)).catch(noop);

  return (
    <PageContainer
      pageTitle='React Query'
      pageDescription='Server prefetch + client hydration + suspense query pattern.'
      infoContent={reactQueryInfoContent}
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<PokemonSkeleton />}>
          <PokemonInfo />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
