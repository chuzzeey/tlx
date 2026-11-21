import { createClient } from '@supabase/supabase-js';
import { products } from '../src/data/catalog.ts';
import { isProductInStock } from '../src/lib/product-availability.ts';
import { productMainImagePath } from '../src/lib/product-image-storage.ts';
import { uploadMainProductImage } from './lib/product-images.mjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.'
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const { data: existingProducts, error: existingProductsError } = await supabase
  .from('products')
  .select('id');
if (existingProductsError) {
  throw new Error(`Could not check existing products: ${existingProductsError.message}`);
}
const existingIds = new Set(existingProducts.map((product) => product.id));
const productsToInsert = products.filter((product) => !existingIds.has(product.id));

for (const product of productsToInsert) {
  await uploadMainProductImage(supabase, supabaseUrl, product.id, product.image);
}

const rows = productsToInsert.map((product) => ({
  id: product.id,
  main_image_path: productMainImagePath(product.id),
  name: product.name,
  category: product.category,
  price: product.price,
  compare_at: product.compareAt ?? null,
  gallery: product.gallery ?? [],
  gallery_alt: product.gallery?.map((_, index) => `${product.name}, image ${index + 2}`) ?? [],
  description: product.description,
  story: product.story,
  materials: product.materials,
  dimensions: product.dimensions,
  care: product.care,
  stock: product.stock,
  is_in_stock: isProductInStock(product),
  badge: product.badge ?? null,
  colors: product.colors ?? [],
  sizes: [],
  featured: product.featured ?? false,
  is_published: true
}));

const { error } = await supabase.from('products').upsert(rows, {
  onConflict: 'id',
  ignoreDuplicates: true
});

if (error) {
  throw new Error(`Catalog seed failed: ${error.message}`);
}

console.info(`Catalog seed complete (${rows.length} missing products added; existing rows preserved).`);
