import 'server-only';

import type { Product } from '@/data/catalog';
import { isProductInStock } from '@/lib/product-availability';
import { catalogVariantDefaults } from '@/lib/product-variants';
import { productImageUrl, productMainImagePath } from '@/lib/product-image-storage';
import {
  createAdminSupabaseClient,
  createPublicSupabaseClient,
  isSupabaseAdminConfigured,
  isSupabaseCatalogConfigured
} from './supabase-server';

export type CatalogProduct = Product & {
  galleryAlt: string[];
  sizes: string[];
  inStock: boolean;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CatalogReview = {
  id: string;
  productId: string;
  productName: string;
  author: string;
  location: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  approved: boolean;
  createdAt: string;
};

export type DashboardProduct = {
  id: string;
  name: string;
  category: string;
  stock: number;
  inStock: boolean;
  isPublished: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
};

type CatalogRow = {
  id: string;
  name: string;
  category: string;
  price: number | string;
  compare_at: number | string | null;
  image?: string | null;
  main_image_path?: string | null;
  gallery: string[] | null;
  gallery_alt: string[] | null;
  description: string;
  story: string;
  materials: string;
  dimensions: string;
  care: string;
  stock: number;
  is_in_stock: boolean;
  badge: Product['badge'] | null;
  colors: Product['colors'] | null;
  sizes: string[] | null;
  featured: boolean;
  is_published: boolean;
  rating?: number | string;
  review_count?: number;
  created_at?: string;
  updated_at?: string;
};

function mapCatalogRow(row: CatalogRow): CatalogProduct {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!projectUrl) {
    throw new Error('Supabase catalog URL is not configured for product image loading.');
  }

  const defaults = catalogVariantDefaults[row.id];
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    ...(row.compare_at == null ? {} : { compareAt: Number(row.compare_at) }),
    rating: Number(row.rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    image: row.image?.trim() || productImageUrl(projectUrl, row.main_image_path || productMainImagePath(row.id)),
    gallery: row.gallery ?? [],
    galleryAlt: row.gallery_alt ?? [],
    description: row.description,
    story: row.story,
    materials: row.materials,
    dimensions: row.dimensions,
    care: row.care,
    stock: row.stock,
    inStock: row.is_in_stock,
    ...(row.badge ? { badge: row.badge } : {}),
    colors: row.colors?.length ? row.colors : defaults?.colors ?? [],
    sizes: row.sizes?.length ? row.sizes : defaults?.sizes ?? [],
    featured: row.featured,
    isPublished: row.is_published,
    ...(row.created_at ? { createdAt: row.created_at } : {}),
    ...(row.updated_at ? { updatedAt: row.updated_at } : {})
  };
}

export async function getPublishedCatalog(): Promise<CatalogProduct[]> {
  if (!isSupabaseCatalogConfigured) {
    const { products } = await import('@/data/catalog');
    return products.map((product) => ({
      ...product,
      galleryAlt: product.gallery?.map(() => product.name) ?? [],
      sizes: [],
      inStock: isProductInStock(product),
      isPublished: true
    }));
  }

  const { data, error } = await createPublicSupabaseClient()
    .from('store_products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Could not load the published catalog: ${error.message}`);
  }

  return (data as CatalogRow[]).map(mapCatalogRow);
}

export async function getPublishedProductAliases(): Promise<Record<string, string>> {
  if (!isSupabaseCatalogConfigured) return {};

  const { data, error } = await createPublicSupabaseClient()
    .from('product_slug_redirects')
    .select('old_slug,product_id');

  if (error) {
    throw new Error(`Could not load product URL redirects: ${error.message}`);
  }

  return Object.fromEntries(data.map((alias) => [alias.old_slug, alias.product_id]));
}

export async function getPublishedProduct(id: string): Promise<CatalogProduct | undefined> {
  if (!isSupabaseCatalogConfigured) {
    const products = await getPublishedCatalog();
    return products.find((product) => product.id === id);
  }

  const client = createPublicSupabaseClient();
  const { data: product, error: productError } = await client
    .from('store_products')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (productError) {
    throw new Error(`Could not load product ${id}: ${productError.message}`);
  }
  if (product) return mapCatalogRow(product as CatalogRow);

  const { data: alias, error: aliasError } = await client
    .from('product_slug_redirects')
    .select('product_id')
    .eq('old_slug', id)
    .maybeSingle();
  if (aliasError) {
    throw new Error(`Could not resolve product URL ${id}: ${aliasError.message}`);
  }
  if (!alias) return undefined;

  const { data: redirectedProduct, error: redirectedProductError } = await client
    .from('store_products')
    .select('*')
    .eq('id', alias.product_id)
    .maybeSingle();
  if (redirectedProductError) {
    throw new Error(`Could not load product ${alias.product_id}: ${redirectedProductError.message}`);
  }

  return redirectedProduct ? mapCatalogRow(redirectedProduct as CatalogRow) : undefined;
}

export async function getAdminCatalog(): Promise<CatalogProduct[]> {
  if (!isSupabaseAdminConfigured) return [];

  const client = createAdminSupabaseClient();
  const [{ data: products, error: productsError }, { data: reviews, error: reviewsError }] =
    await Promise.all([
      client.from('products').select('*').order('created_at', { ascending: false }),
      client.from('reviews').select('product_id,rating').eq('is_approved', true)
    ]);

  if (productsError) {
    throw new Error(`Could not load products from Supabase: ${productsError.message}`);
  }
  if (reviewsError) {
    throw new Error(`Could not load reviews from Supabase: ${reviewsError.message}`);
  }

  const reviewStats = new Map<string, { count: number; total: number }>();
  for (const review of reviews) {
    const stats = reviewStats.get(review.product_id) ?? { count: 0, total: 0 };
    stats.count += 1;
    stats.total += review.rating;
    reviewStats.set(review.product_id, stats);
  }

  return (products as CatalogRow[]).map((row) => {
    const stats = reviewStats.get(row.id);
    return mapCatalogRow({
      ...row,
      rating: stats ? Math.round((stats.total / stats.count) * 10) / 10 : 0,
      review_count: stats?.count ?? 0
    });
  });
}

export async function getAdminOverviewData(): Promise<{
  products: DashboardProduct[];
  reviews: CatalogReview[];
}> {
  if (!isSupabaseAdminConfigured) {
    return { products: [], reviews: [] };
  }

  const client = createAdminSupabaseClient();
  const [{ data: productRows, error: productsError }, { data: reviewRows, error: reviewsError }] =
    await Promise.all([
      client
        .from('products')
        .select('id,name,category,stock,is_in_stock,is_published,created_at,updated_at')
        .order('created_at', { ascending: false }),
      client
        .from('reviews')
        .select('id,product_id,author,location,rating,title,body,is_verified,is_approved,created_at')
        .order('created_at', { ascending: false })
    ]);

  if (productsError) {
    throw new Error(`Could not load products from Supabase: ${productsError.message}`);
  }
  if (reviewsError) {
    throw new Error(`Could not load customer reviews: ${reviewsError.message}`);
  }

  const productNames = new Map(productRows.map((product) => [product.id, product.name]));
  const approvedReviewStats = new Map<string, { count: number; total: number }>();
  for (const review of reviewRows) {
    if (!review.is_approved) continue;
    const stats = approvedReviewStats.get(review.product_id) ?? { count: 0, total: 0 };
    stats.count += 1;
    stats.total += review.rating;
    approvedReviewStats.set(review.product_id, stats);
  }

  const products: DashboardProduct[] = productRows.map((row) => {
    const stats = approvedReviewStats.get(row.id);
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      stock: row.stock,
      inStock: row.is_in_stock,
      isPublished: row.is_published,
      rating: stats ? Math.round((stats.total / stats.count) * 10) / 10 : 0,
      reviewCount: stats?.count ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  });
  const reviews: CatalogReview[] = reviewRows.map((review) => ({
    id: review.id,
    productId: review.product_id,
    productName: productNames.get(review.product_id) ?? 'Archived product',
    author: review.author,
    location: review.location,
    rating: review.rating,
    title: review.title,
    body: review.body,
    verified: review.is_verified,
    approved: review.is_approved,
    createdAt: review.created_at
  }));

  return { products, reviews };
}

export async function getAdminReviews(): Promise<CatalogReview[]> {
  const client = createAdminSupabaseClient();
  const [{ data: reviews, error: reviewsError }, { data: products, error: productsError }] =
    await Promise.all([
      client
        .from('reviews')
        .select('id,product_id,author,location,rating,title,body,is_verified,is_approved,created_at')
        .order('created_at', { ascending: false }),
      client.from('products').select('id,name')
    ]);

  if (reviewsError) {
    throw new Error(`Could not load customer reviews: ${reviewsError.message}`);
  }
  if (productsError) {
    throw new Error(`Could not load review product names: ${productsError.message}`);
  }

  const productNames = new Map(products.map((product) => [product.id, product.name]));
  return reviews.map((review) => ({
    id: review.id,
    productId: review.product_id,
    productName: productNames.get(review.product_id) ?? 'Archived product',
    author: review.author,
    location: review.location,
    rating: review.rating,
    title: review.title,
    body: review.body,
    verified: review.is_verified,
    approved: review.is_approved,
    createdAt: review.created_at
  }));
}

type StoreMetricProduct = Pick<
  CatalogProduct,
  'isPublished' | 'inStock' | 'stock' | 'rating' | 'reviewCount'
>;

export async function getStoreMetrics(products?: readonly StoreMetricProduct[]) {
  const catalog: readonly StoreMetricProduct[] = products ?? (await getAdminCatalog());
  const published = catalog.filter((product) => product.isPublished);
  const reviewsCount = catalog.reduce((sum, product) => sum + product.reviewCount, 0);
  const weightedRating = catalog.reduce(
    (sum, product) => sum + product.rating * product.reviewCount,
    0
  );

  return {
    totalProducts: catalog.length,
    publishedProducts: published.length,
    lowStockProducts: published.filter(
      (product) => product.inStock && product.stock > 0 && product.stock <= 5
    ).length,
    outOfStockProducts: published.filter((product) => !product.inStock).length,
    reviewsCount,
    averageRating: reviewsCount ? Math.round((weightedRating / reviewsCount) * 10) / 10 : null
  };
}

export function catalogSetupMessage() {
  if (!isSupabaseCatalogConfigured) {
    return 'Connect this app to your Supabase project, then apply the catalog migration and seed the existing products.';
  }
  if (!isSupabaseAdminConfigured) {
    return 'Add SUPABASE_SERVICE_ROLE_KEY to the server environment to enable admin catalog management.';
  }
  return null;
}
