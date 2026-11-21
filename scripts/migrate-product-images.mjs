import { createClient } from '@supabase/supabase-js';
import { uploadMainProductImage } from './lib/product-images.mjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before migrating product images.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});
const pageSize = 100;
let migrated = 0;

for (let offset = 0; ; offset += pageSize) {
  const { data: products, error } = await supabase
    .from('products')
    .select('id,image')
    .order('id')
    .range(offset, offset + pageSize - 1);
  if (error) throw new Error(`Could not load legacy product images: ${error.message}`);
  if (!products.length) break;

  for (const product of products) {
    if (!product.image) throw new Error(`Product ${product.id} has no main image to migrate.`);
    await uploadMainProductImage(supabase, supabaseUrl, product.id, product.image);
    migrated += 1;
  }
}

console.info(`Migrated ${migrated} product main images to deterministic storage paths.`);
