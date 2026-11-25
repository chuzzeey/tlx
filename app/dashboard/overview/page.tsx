import Link from 'next/link';
import { ArrowUpRight, Check, Clock3, PackageCheck, Star } from 'lucide-react';
import {
  catalogSetupMessage,
  getAdminOverviewData,
  getStoreMetrics,
  type DashboardProduct,
  type CatalogReview
} from '@dashboard/lib/catalog-service';
import {
  DashboardCharts,
  type CategoryMixPoint,
  type InventoryBandPoint,
  type ProductActivityPoint,
  type RatingPoint
} from '@dashboard/features/tlx-store/dashboard-charts';

// Next.js page metadata is required here but is not a React component export.
// eslint-disable-next-line react-refresh/only-export-components -- App Router metadata export.
export const metadata = { title: 'Dashboard · TLX Originals Admin' };

function getActivitySeries(products: DashboardProduct[], now = new Date()): ProductActivityPoint[] {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1));
    const monthKey = date.toISOString().slice(0, 7);
    return {
      month: new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(date),
      products: products.filter((product) => {
        if (!product.createdAt) return false;
        const timestamp = Date.parse(product.createdAt);
        return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 7) === monthKey;
      }).length
    };
  });
}

function formatCategoryName(category: string) {
  const labels: Record<string, string> = {
    apparel: 'T-shirts',
    jackets: 'Jackets',
    shoes: 'Shoes',
    bags: 'Bags',
    accessories: 'Accessories'
  };
  return labels[category] ?? category.replaceAll('-', ' ');
}

function getCategoryMix(products: DashboardProduct[]): CategoryMixPoint[] {
  const categories = new Map<string, CategoryMixPoint>();
  for (const product of products) {
    const category = product.category;
    const count = categories.get(category) ?? { category, published: 0, drafts: 0, total: 0 };
    count.total += 1;
    if (product.isPublished) count.published += 1;
    else count.drafts += 1;
    categories.set(category, count);
  }
  return [...categories.values()]
    .map((category) => ({ ...category, category: formatCategoryName(category.category) }))
    .sort((a, b) => b.total - a.total || a.category.localeCompare(b.category));
}

function getInventoryDistribution(products: DashboardProduct[]): InventoryBandPoint[] {
  const bands: InventoryBandPoint[] = [
    { band: '0 units', products: 0, units: 0 },
    { band: '1–5 units', products: 0, units: 0 },
    { band: '6+ units', products: 0, units: 0 }
  ];

  for (const product of products) {
    const units = Math.max(0, product.stock);
    const band = units === 0 ? bands[0] : units <= 5 ? bands[1] : bands[2];
    band.products += 1;
    band.units += units;
  }

  return bands;
}

function getRatingDistribution(reviews: CatalogReview[]): RatingPoint[] {
  const approved = reviews.filter((review) => review.approved);
  return [5, 4, 3, 2, 1].map((rating) => ({
    rating: `${rating} stars`,
    reviews: approved.filter((review) => review.rating === rating).length
  }));
}

function formatActivityDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

type StoreActivity = {
  id: string;
  date: string;
  title: string;
  detail: string;
  kind: 'product' | 'review';
};

function getRecentActivity(products: DashboardProduct[], reviews: CatalogReview[]): StoreActivity[] {
  const productActivity = products.flatMap((product) => {
    const date = product.updatedAt || product.createdAt;
    if (!date) return [];
    const created = product.createdAt ? Date.parse(product.createdAt) : Number.NaN;
    const updated = product.updatedAt ? Date.parse(product.updatedAt) : Number.NaN;
    const changed = Number.isFinite(updated) && (!Number.isFinite(created) || updated > created);
    return [{
      id: `product-${product.id}`,
      date,
      title: product.name,
      detail: changed ? 'Product updated' : 'Product added',
      kind: 'product' as const
    }];
  });
  const reviewActivity = reviews.map((review) => ({
    id: `review-${review.id}`,
    date: review.createdAt,
    title: review.title,
    detail: `Review from ${review.author} · ${review.approved ? 'approved' : 'awaiting review'}`,
    kind: 'review' as const
  }));

  return [...productActivity, ...reviewActivity]
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 6);
}

export default async function DashboardOverview() {
  const setupMessage = catalogSetupMessage();
  let products: DashboardProduct[] = [];
  let reviews: CatalogReview[] = [];
  let loadError: string | null = null;

  if (!setupMessage) {
    try {
      const data = await getAdminOverviewData();
      products = data.products;
      reviews = data.reviews;
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'Store intelligence could not be loaded.';
    }
  }

  const metrics = !setupMessage && !loadError ? await getStoreMetrics(products) : null;
  const publishedProducts = products.filter((product) => product.isPublished);
  const draftCount = products.length - publishedProducts.length;
  const approvedReviews = reviews.filter((review) => review.approved);
  const averageRating = approvedReviews.length
    ? Math.round((approvedReviews.reduce((sum, review) => sum + review.rating, 0) / approvedReviews.length) * 10) / 10
    : null;
  const pendingReviews = reviews.length - approvedReviews.length;
  const inventoryAttention = publishedProducts
    .filter((product) => !product.inStock || (product.stock > 0 && product.stock <= 5))
    .sort((a, b) => Number(a.inStock) - Number(b.inStock) || a.stock - b.stock || a.name.localeCompare(b.name))
    .slice(0, 5);
  const inventoryAttentionCount = metrics
    ? metrics.lowStockProducts + metrics.outOfStockProducts
    : 0;
  const activity = getActivitySeries(products);
  const categories = getCategoryMix(products);
  const inventoryDistribution = getInventoryDistribution(products);
  const ratingDistribution = getRatingDistribution(reviews);
  const recentFeedback = approvedReviews.slice(0, 3);
  const recentActivity = getRecentActivity(products, reviews);

  return (
    <div className='intel-overview'>
      <header className='intel-header'>
        <div>
          <p className='intel-eyebrow'><span aria-hidden='true' /> TLX Originals <i>/</i> Store intelligence</p>
          <h1>Overview</h1>
          <p className='intel-header-description'>
            A live reading of your catalog, inventory and customer response.
          </p>
        </div>
        <Link href='/dashboard/product' className='intel-primary-link'>
          Manage products
          <ArrowUpRight aria-hidden className='size-4' strokeWidth={1.7} />
        </Link>
      </header>

      {setupMessage && (
        <section className='intel-notice intel-glass' role='status'>
          <p className='intel-kicker'>Store setup</p>
          <h2>Connect the product database</h2>
          <p>{setupMessage}</p>
          <p>
            Apply the migration in <code>supabase/migrations</code>, then seed the existing
            storefront products with <code>npm run seed:catalog</code>.
          </p>
        </section>
      )}
      {loadError && <p role='alert' className='intel-error'>{loadError}</p>}

      {metrics && (
        <>
          <section aria-label='Store performance' className='intel-measures intel-glass'>
            <article className='intel-measure intel-measure-lead'>
              <span>Catalog products</span>
              <strong>{metrics.totalProducts}</strong>
              <small>Across every publication state</small>
            </article>
            <article className='intel-measure'>
              <span>Published</span>
              <strong>{metrics.publishedProducts}</strong>
              <small>Visible in the storefront</small>
            </article>
            <article className='intel-measure'>
              <span>Drafts</span>
              <strong>{draftCount}</strong>
              <small>Not yet published</small>
            </article>
            <article className='intel-measure'>
              <span>Inventory watch</span>
              <strong>{inventoryAttentionCount}</strong>
              <small>Published products needing review</small>
            </article>
            <article className='intel-measure'>
              <span>Review submissions</span>
              <strong>{reviews.length}</strong>
              <small>{approvedReviews.length} approved · {pendingReviews} pending</small>
            </article>
          </section>

          <div className='intel-grid'>
            <DashboardCharts
              activity={activity}
              categories={categories}
              publishedProducts={metrics.publishedProducts}
              draftProducts={draftCount}
              inventory={inventoryDistribution}
              ratingDistribution={ratingDistribution}
            />

            <section className='intel-panel intel-attention-panel' aria-labelledby='inventory-attention-title'>
              <header className='intel-panel-heading'>
                <div>
                  <p className='intel-kicker'>06 <span>/</span> Action required</p>
                  <h2 id='inventory-attention-title'>Inventory to check</h2>
                  <p>
                    {inventoryAttentionCount > inventoryAttention.length
                      ? `${inventoryAttentionCount} published products need attention · showing the five most urgent`
                      : `${inventoryAttentionCount} published ${inventoryAttentionCount === 1 ? 'product needs' : 'products need'} attention`}
                  </p>
                </div>
                <Link href='/dashboard/product' className='intel-inline-link'>
                  Open catalog <ArrowUpRight aria-hidden className='size-4' />
                </Link>
              </header>
              {inventoryAttention.length ? (
                <ul className='intel-attention-list'>
                  {inventoryAttention.map((product) => (
                    <li key={product.id}>
                      <span className='intel-attention-mark' aria-hidden='true'><PackageCheck /></span>
                      <span className='intel-attention-product'>
                        <strong>{product.name}</strong>
                        <small>{formatCategoryName(product.category)}</small>
                      </span>
                      <span className='intel-attention-units'>{product.stock.toLocaleString()} <small>units</small></span>
                      <span className={`intel-status ${product.inStock ? 'is-low' : 'is-out'}`}>
                        {product.inStock ? 'Low stock' : product.stock > 0 ? 'Unavailable' : 'Out of stock'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className='intel-empty-state'>
                  <span><Check aria-hidden /></span>
                  <div>
                    <strong>{inventoryAttentionCount ? 'All attention items shown' : 'No published stock alerts'}</strong>
                    <p>{inventoryAttentionCount ? 'The highest-priority products are listed above.' : 'Draft quantities remain visible in the stock distribution.'}</p>
                  </div>
                </div>
              )}
            </section>

            <section className='intel-panel intel-feedback-panel' aria-labelledby='customer-feedback-title'>
              <header className='intel-panel-heading'>
                <div>
                  <p className='intel-kicker'>07 <span>/</span> Customer voice</p>
                  <h2 id='customer-feedback-title'>Recent feedback</h2>
                  <p>
                    {averageRating === null
                      ? `${pendingReviews} awaiting review · no approved ratings yet`
                      : `${averageRating.toFixed(1)} average from ${metrics.reviewsCount} approved reviews`}
                  </p>
                </div>
                <Link href='/dashboard/reviews' className='intel-inline-link'>
                  Review inbox <ArrowUpRight aria-hidden className='size-4' />
                </Link>
              </header>
              {recentFeedback.length ? (
                <ul className='intel-feedback-list'>
                  {recentFeedback.map((review) => (
                    <li key={review.id}>
                      <span className='intel-feedback-rating' aria-label={`${review.rating} out of 5 stars`}>
                        <Star aria-hidden />
                        {review.rating.toFixed(1)}
                      </span>
                      <div>
                        <strong>{review.title}</strong>
                        <p>{review.body}</p>
                        <small>{review.author}{review.location ? ` · ${review.location}` : ''} · {formatActivityDate(review.createdAt)}</small>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className='intel-empty-state'>
                  <span><Star aria-hidden /></span>
                  <div>
                    <strong>No approved feedback yet</strong>
                    <p>{pendingReviews ? `${pendingReviews} submission${pendingReviews === 1 ? '' : 's'} await review.` : 'Approved customer reviews will appear here.'}</p>
                  </div>
                </div>
              )}
            </section>

            <section className='intel-panel intel-operations-panel' aria-labelledby='operations-activity-title'>
              <header className='intel-panel-heading'>
                <div>
                  <p className='intel-kicker'>08 <span>/</span> Operations</p>
                  <h2 id='operations-activity-title'>Recent product and review activity</h2>
                  <p>Derived from product update and review submission records.</p>
                </div>
                <Clock3 aria-hidden className='intel-heading-icon' />
              </header>
              {recentActivity.length ? (
                <ol className='intel-activity-list'>
                  {recentActivity.map((item) => (
                    <li key={item.id}>
                      <span className={`intel-activity-mark ${item.kind}`} aria-hidden='true'>
                        {item.kind === 'product' ? <PackageCheck /> : <Star />}
                      </span>
                      <span className='intel-activity-copy'>
                        <strong>{item.title}</strong>
                        <small>{item.detail}</small>
                      </span>
                      <time dateTime={item.date}>{formatActivityDate(item.date)}</time>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className='intel-empty-state'>
                  <span><Clock3 aria-hidden /></span>
                  <div>
                    <strong>No recorded activity</strong>
                    <p>Product and review events will appear here when available.</p>
                  </div>
                </div>
              )}
            </section>

            <section className='intel-panel intel-commerce-panel' aria-labelledby='commerce-data-title'>
              <p className='intel-kicker'>09 <span>/</span> Commerce data</p>
              <div className='intel-commerce-title'>
                <h2 id='commerce-data-title'>Order management</h2>
                <span>Orders page</span>
              </div>
              <p>
                Review orders, verify bank transfers and update order statuses after the TLX orders
                migration is applied. Sales trends and inventory valuation are not shown.
              </p>
              <Link href='/dashboard/orders' className='intel-inline-link'>
                Open order manager <ArrowUpRight aria-hidden className='size-4' />
              </Link>
              <span className='intel-commerce-rule' aria-hidden='true' />
            </section>
          </div>
        </>
      )}
    </div>
  );
}
