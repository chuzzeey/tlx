import { requireStoreAdminPage } from '@dashboard/lib/admin-auth';
import { catalogSetupMessage, getAdminReviews } from '@dashboard/lib/catalog-service';
import ReviewManager from '@dashboard/features/tlx-store/review-manager';

export const metadata = { title: 'Reviews · TLX Originals Admin' };

export default async function ReviewsPage() {
  await requireStoreAdminPage();
  const setupMessage = catalogSetupMessage();
  if (setupMessage) {
    return (
      <main className='mx-auto w-full max-w-[1680px] space-y-4 p-4 sm:p-6 xl:p-8'>
        <h1 className='text-2xl font-semibold'>Customer reviews</h1>
        <p className='rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm text-muted-foreground'>{setupMessage}</p>
      </main>
    );
  }

  let reviews = null;
  let error: string | null = null;
  try {
    reviews = await getAdminReviews();
  } catch (cause) {
    error = cause instanceof Error ? cause.message : 'Customer reviews could not be loaded.';
  }

  return (
    <main className='mx-auto w-full max-w-[1680px] space-y-6 p-4 sm:p-6 xl:p-8'>
      <header>
        <p className='font-mono text-xs uppercase tracking-widest text-muted-foreground'>TLX Originals · Store admin</p>
        <h1 className='mt-2 text-2xl font-semibold tracking-tight'>Customer reviews</h1>
        <p className='mt-1 text-sm text-muted-foreground'>Review real submissions and publish only approved feedback.</p>
      </header>
      {error ? (
        <p role='alert' className='rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive'>{error}</p>
      ) : (
        <ReviewManager reviews={reviews ?? []} />
      )}
    </main>
  );
}
