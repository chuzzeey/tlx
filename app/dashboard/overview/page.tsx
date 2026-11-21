import Link from 'next/link';
import {
  ArrowUpRight,
  Boxes,
  CircleAlert,
  PackageCheck,
  Star,
  Warehouse
} from 'lucide-react';
import { catalogSetupMessage, getAdminCatalog, getStoreMetrics } from '@dashboard/lib/catalog-service';

export const metadata = { title: 'Dashboard · TLX Originals Admin' };

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Boxes;
  tone: 'blue' | 'green' | 'amber' | 'gold';
}) {
  const toneClass = {
    blue: 'bg-primary/10 text-primary',
    green: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    gold: 'bg-secondary text-secondary-foreground'
  }[tone];

  return (
    <article className='rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5'>
      <div className='flex items-start justify-between gap-3'>
        <p className='text-sm font-medium text-muted-foreground'>{label}</p>
        <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${toneClass}`}>
          <Icon aria-hidden className='size-5' />
        </span>
      </div>
      <p className='mt-3 text-3xl font-semibold tracking-tight tabular-nums'>{value}</p>
      <p className='mt-1 text-xs leading-5 text-muted-foreground'>{hint}</p>
    </article>
  );
}

export default async function DashboardOverview() {
  const setupMessage = catalogSetupMessage();
  let metrics: Awaited<ReturnType<typeof getStoreMetrics>> | null = null;
  let lowStock: Awaited<ReturnType<typeof getAdminCatalog>> = [];
  let categoryMix: { name: string; count: number }[] = [];
  let loadError: string | null = null;

  if (!setupMessage) {
    try {
      const [storeMetrics, products] = await Promise.all([getStoreMetrics(), getAdminCatalog()]);
      const published = products.filter((product) => product.isPublished);
      metrics = storeMetrics;
      lowStock = published
        .filter((product) => product.inStock && product.stock <= 5)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5);
      const categories = new Map<string, number>();
      for (const product of published) {
        categories.set(product.category, (categories.get(product.category) ?? 0) + 1);
      }
      categoryMix = [...categories.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'Store metrics could not be loaded.';
    }
  }

  const maxCategoryCount = Math.max(1, ...categoryMix.map((category) => category.count));

  return (
    <main className='mx-auto w-full max-w-[1680px] space-y-6 p-4 sm:p-6 xl:p-8'>
      <header className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <p className='font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground'>
            TLX Originals · Store operations
          </p>
          <h1 className='mt-2 text-3xl font-semibold tracking-tight'>Overview</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Your live catalog, inventory, and customer feedback at a glance.
          </p>
        </div>
        <Link
          href='/dashboard/product'
          className='inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'
        >
          Manage products
          <ArrowUpRight aria-hidden className='size-4' />
        </Link>
      </header>

      {setupMessage && (
        <section className='rounded-xl border border-amber-500/30 bg-amber-500/5 p-5' role='status'>
          <h2 className='font-medium'>Connect the product database</h2>
          <p className='mt-1 text-sm text-muted-foreground'>{setupMessage}</p>
          <p className='mt-2 text-sm text-muted-foreground'>
            Apply the migration in <code>supabase/migrations</code>, then seed the existing
            storefront products with <code>npm run seed:catalog</code>.
          </p>
        </section>
      )}
      {loadError && (
        <p role='alert' className='rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive'>
          {loadError}
        </p>
      )}

      {metrics && (
        <>
          <section aria-label='Store metrics' className='grid gap-3 sm:grid-cols-2 2xl:grid-cols-4'>
            <MetricCard
              label='Published products'
              value={`${metrics.publishedProducts}`}
              hint={`${metrics.totalProducts} products in the catalog`}
              icon={Boxes}
              tone='blue'
            />
            <MetricCard
              label='Low stock'
              value={`${metrics.lowStockProducts}`}
              hint='Published products with 1–5 units remaining'
              icon={Warehouse}
              tone='amber'
            />
            <MetricCard
              label='Out of stock'
              value={`${metrics.outOfStockProducts}`}
              hint='Published products currently unavailable'
              icon={CircleAlert}
              tone='gold'
            />
            <MetricCard
              label='Customer reviews'
              value={`${metrics.reviewsCount}`}
              hint={metrics.averageRating === null ? 'No approved reviews yet' : `${metrics.averageRating.toFixed(1)} average rating`}
              icon={Star}
              tone='green'
            />
          </section>

          <div className='grid gap-4 2xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]'>
            <section className='overflow-hidden rounded-xl border border-border bg-card shadow-sm'>
              <div className='flex items-center justify-between gap-3 border-b border-border p-4 sm:p-5'>
                <div>
                  <h2 className='font-semibold tracking-tight'>Inventory to check</h2>
                  <p className='mt-1 text-xs text-muted-foreground'>Published products with five or fewer units</p>
                </div>
                <Link
                  href='/dashboard/product'
                  className='shrink-0 rounded-md px-2 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5'
                >
                  View catalog
                </Link>
              </div>
              {lowStock.length ? (
                <ul className='divide-y divide-border'>
                  {lowStock.map((product) => (
                    <li key={product.id} className='flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5'>
                      <div className='min-w-0'>
                        <p className='truncate text-sm font-medium'>{product.name}</p>
                      </div>
                      <span className='shrink-0 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300'>
                        {product.stock} left
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className='p-5 text-sm text-muted-foreground'>No published products need a stock check.</p>
              )}
            </section>

            <div className='grid gap-4'>
              <section className='rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5'>
                <div className='flex items-center gap-2'>
                  <PackageCheck aria-hidden className='size-4 text-primary' />
                  <h2 className='font-semibold tracking-tight'>Catalog mix</h2>
                </div>
                <p className='mt-1 text-xs text-muted-foreground'>Published products by category</p>
                {categoryMix.length ? (
                  <ul className='mt-5 space-y-4'>
                    {categoryMix.map((category) => (
                      <li key={category.name}>
                        <div className='mb-1.5 flex items-center justify-between gap-3 text-sm'>
                          <span className='capitalize'>{category.name}</span>
                          <span className='tabular-nums text-muted-foreground'>{category.count}</span>
                        </div>
                        <div
                          className='h-2 overflow-hidden rounded-full bg-muted'
                          role='img'
                          aria-label={`${category.name}: ${category.count} published products`}
                        >
                          <div
                            className='h-full rounded-full bg-primary'
                            style={{ width: `${(category.count / maxCategoryCount) * 100}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className='mt-4 text-sm text-muted-foreground'>Publish products to see the category mix.</p>
                )}
              </section>

              <section className='rounded-xl border border-dashed border-border bg-muted/30 p-4 sm:p-5'>
                <p className='text-sm font-medium'>Orders and revenue</p>
                <p className='mt-1 text-sm leading-6 text-muted-foreground'>
                  Not available yet: the storefront does not persist orders, so revenue and sales
                  charts are intentionally not shown.
                </p>
              </section>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
