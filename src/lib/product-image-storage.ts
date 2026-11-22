export const PRODUCT_IMAGE_BUCKET = 'tlx-products';

export function productMainImagePath(productId: string) {
  return `${productId}/main`;
}

export function productMainImageUrl(supabaseUrl: string, productId: string) {
  return productImageUrl(supabaseUrl, productMainImagePath(productId));
}

export function productImageUrl(supabaseUrl: string, storagePath: string) {
  const baseUrl = supabaseUrl.replace(/\/+$/, '');
  const encodedPath = storagePath.split('/').map(encodeURIComponent).join('/');
  return `${baseUrl}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${encodedPath}`;
}

export function isLocalProductImagePath(value: string) {
  const prefix = '/images/products/';
  if (!value.startsWith(prefix)) return false;
  const imagePath = value.slice(prefix.length);
  return !imagePath.split(/[\\/]/).some((part) => !part || part === '.' || part === '..');
}

export function isStorefrontImage(value: string, supabaseUrl?: string) {
  return isLocalProductImagePath(value) ||
    Boolean(supabaseUrl && productStoragePathFromUrl(value, supabaseUrl));
}

export function productStoragePathFromUrl(value: string, supabaseUrl: string) {
  try {
    const url = new URL(value);
    const configuredHost = new URL(supabaseUrl).hostname;
    const prefix = `/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`;
    if (url.protocol !== 'https:' || url.hostname !== configuredHost || !url.pathname.startsWith(prefix)) {
      return null;
    }

    const path = decodeURIComponent(url.pathname.slice(prefix.length));
    if (!path || path.split('/').some((part) => !part || part === '..' || part === '.')) return null;
    return path;
  } catch {
    return null;
  }
}
