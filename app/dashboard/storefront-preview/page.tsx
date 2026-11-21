export const metadata = { title: 'Storefront preview · TLX Originals Admin' };

export default function StorefrontPreviewPage() {
  return (
    <main className='mx-auto flex min-h-full w-full max-w-[1800px] flex-col gap-5 p-4 sm:p-6 xl:p-8'>
      <header className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <p className='font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground'>
            TLX Originals · Live preview
          </p>
          <h1 className='mt-2 text-2xl font-semibold tracking-tight'>Storefront preview</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Browse the customer storefront here without leaving the admin dashboard.
          </p>
        </div>
        <span className='inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground'>
          <span aria-hidden className='size-2 rounded-full bg-emerald-500' />
          Embedded preview
        </span>
      </header>
      <section className='min-h-[36rem] flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm'>
        <iframe
          src='/'
          title='TLX Originals storefront preview'
          className='h-[calc(100dvh-12rem)] min-h-[36rem] w-full bg-background'
          loading='eager'
        />
      </section>
    </main>
  );
}
