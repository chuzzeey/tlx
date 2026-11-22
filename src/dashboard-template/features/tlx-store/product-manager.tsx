'use client';

import Image from 'next/image';
import { AlertTriangle, Boxes, Check, EyeOff, PackageCheck, PackagePlus, Upload, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';
import { PRODUCT_IMAGE_BUCKET } from '@/lib/product-image-storage';
import type { CatalogProduct } from '@dashboard/lib/catalog-service';
import { createSupabaseAuthBrowserClient } from '@dashboard/lib/supabase-auth-browser';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@dashboard/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@dashboard/components/ui/dialog';
import { makeUniqueProductSlug, type ProductInput } from './product-schema';

const categories = [
  { slug: 'jackets', name: 'Jackets' },
  { slug: 'apparel', name: 'T-Shirts' },
  { slug: 'shoes', name: 'Shoes' },
  { slug: 'bags', name: 'Bags' },
  { slug: 'accessories', name: 'Accessories' }
] as const;
const pageSize = 10;
const maxGalleryImages = 4;

type ImageUploadTarget = { type: 'main' } | { type: 'gallery'; index: number };

const blankProduct: CatalogProduct = {
  id: '',
  name: '',
  category: 'jackets',
  price: 0,
  rating: 0,
  reviewCount: 0,
  image: '',
  gallery: [],
  galleryAlt: [],
  description: '',
  story: '',
  materials: '',
  dimensions: '',
  care: '',
  stock: 0,
  inStock: true,
  colors: [],
  sizes: [],
  featured: false,
  isPublished: false
};

function formatPriceInput(value: number) {
  return new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);
}

function parsePriceInput(value: string) {
  const normalized = value.trim();
  if (!/^(?:[0-9]+|[0-9]{1,3}(?:,[0-9]{3})+)(?:[.][0-9]{1,2})?$/.test(normalized)) {
    return undefined;
  }
  const parsed = Number(normalized.replaceAll(',', ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function Field({
  label,
  children,
  className = ''
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`grid gap-1.5 text-sm ${className}`}>
      <span className='font-medium'>{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  'min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring';

function ProductEditor({
  product,
  existingProducts,
  onClose,
  onSaved
}: {
  product: CatalogProduct;
  existingProducts: CatalogProduct[];
  onClose: () => void;
  onSaved: (product: CatalogProduct, oldImageUrls: string[], previousId?: string) => void;
}) {
  const [values, setValues] = useState<CatalogProduct>(product);
  const [priceInput, setPriceInput] = useState(() => formatPriceInput(product.price));
  const priceInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageUploadTargetRef = useRef<ImageUploadTarget>({ type: 'main' });
  const uploadedImageUrlsRef = useRef<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const isNew = !product.id;

  const update = <K extends keyof CatalogProduct>(key: K, value: CatalogProduct[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  function chooseImage(target: ImageUploadTarget) {
    imageUploadTargetRef.current = target;
    imageInputRef.current?.click();
  }

  async function uploadImage(file: File | undefined, target: ImageUploadTarget) {
    if (!file) return;
    const previewKey = target.type === 'main' ? 'main' : `gallery-${target.index}`;
    const previewUrl = URL.createObjectURL(file);
    setImagePreviews((current) => ({ ...current, [previewKey]: previewUrl }));
    setUploading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/product-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, size: file.size })
      });
      const result = (await response.json()) as {
        path?: string;
        token?: string;
        url?: string;
        alt?: string;
        error?: string;
      };
      if (!response.ok || !result.path || !result.token || !result.url) {
        throw new Error(result.error ?? 'Image upload could not be prepared.');
      }

      const { error: uploadError } = await createSupabaseAuthBrowserClient()
        .storage.from(PRODUCT_IMAGE_BUCKET)
        .uploadToSignedUrl(result.path, result.token, file, {
          contentType: file.type,
          cacheControl: '31536000'
        });
      if (uploadError) {
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }

      const uploadedUrl = result.url;
      uploadedImageUrlsRef.current.push(uploadedUrl);

      if (target.type === 'main') {
        update('image', uploadedUrl);
      } else {
        setValues((current) => {
          const gallery = [...(current.gallery ?? [])];
          const galleryAlt = [...(current.galleryAlt ?? [])];
          gallery[target.index] = uploadedUrl;
          galleryAlt[target.index] = result.alt?.slice(0, 250) || `${current.name}, image ${target.index + 2}`;
          return { ...current, gallery, galleryAlt };
        });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Image upload failed.');
    } finally {
      URL.revokeObjectURL(previewUrl);
      setImagePreviews((current) => {
        const next = { ...current };
        delete next[previewKey];
        return next;
      });
      setUploading(false);
    }
  }

  function removeGalleryImage(index: number) {
    setValues((current) => ({
      ...current,
      gallery: (current.gallery ?? []).filter((_, imageIndex) => imageIndex !== index),
      galleryAlt: (current.galleryAlt ?? []).filter((_, imageIndex) => imageIndex !== index)
    }));
  }

  async function closeWithoutSaving() {
    const uncommittedImages = [...uploadedImageUrlsRef.current];
    uploadedImageUrlsRef.current = [];
    onClose();

    const cleanupErrors = await Promise.all(uncommittedImages.map(async (url) => {
      try {
        const response = await fetch('/api/admin/product-images', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        if (response.ok) return null;
        const result = (await response.json()) as { error?: string };
        return result.error ?? 'An unused image could not be removed.';
      } catch (cause) {
        return cause instanceof Error ? cause.message : 'An unused image could not be removed.';
      }
    }));
    const cleanupError = cleanupErrors.find(Boolean);
    if (cleanupError) {
      toast.error('An unused uploaded image could not be removed.', { description: cleanupError });
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.image) {
      setError('Upload a main product image before saving.');
      return;
    }
    setSaving(true);
    setError('');

    const input: ProductInput = {
      id: isNew
        ? makeUniqueProductSlug(values.name, existingProducts.map((item) => item.id))
        : values.id,
      name: values.name,
      category: values.category as ProductInput['category'],
      price: values.price,
      compareAt: values.compareAt != null && values.compareAt > values.price ? values.compareAt : null,
      image: values.image,
      gallery: values.gallery ?? [],
      galleryAlt: (values.gallery ?? []).map(
        (image, index) => values.galleryAlt?.[index] || `${values.name}, image ${index + 2}`
      ),
      description: values.description,
      story: values.story,
      materials: values.materials,
      dimensions: values.dimensions,
      care: values.care,
      inStock: values.inStock,
      badge: values.badge ?? null,
      colors: values.colors ?? [],
      sizes: values.sizes ?? [],
      featured: values.featured ?? false,
      isPublished: values.isPublished
    };

    try {
      const response = await fetch(
        isNew ? '/api/admin/products' : `/api/admin/products/${encodeURIComponent(product.id)}`,
        {
          method: isNew ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input)
        }
      );
      const result = (await response.json()) as {
        id?: string;
        image?: string;
        stagedImageUrl?: string;
        error?: string;
      };
      if (!response.ok || !result.id) {
        throw new Error(result.error ?? 'Product could not be saved.');
      }

      const savedProduct: CatalogProduct = {
        ...values,
        id: result.id,
        image: result.image ?? values.image,
        compareAt: input.compareAt ?? undefined,
        stock: values.inStock && product.stock === 0 ? 1 : product.stock,
        rating: product.rating,
        reviewCount: product.reviewCount,
        gallery: values.gallery ?? [],
        galleryAlt: input.galleryAlt
      };
      const oldImageUrls = [
        product.image,
        ...(product.gallery ?? []),
        ...uploadedImageUrlsRef.current,
        ...(result.stagedImageUrl ? [result.stagedImageUrl] : [])
      ].filter(Boolean);
      onSaved(savedProduct, oldImageUrls, product.id || undefined);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Product could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  const lines = (value: string) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !uploading && !saving) void closeWithoutSaving();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className='dashboard-product-dialog'
      >
        <DialogHeader className='dashboard-product-header'>
          <div>
            <p className='font-mono text-xs uppercase tracking-widest text-muted-foreground'>TLX Originals · Catalog</p>
            <DialogTitle id='product-editor-title' className='mt-2 text-2xl font-semibold'>
              {isNew ? 'Add product' : 'Edit product'}
            </DialogTitle>
            <DialogDescription className='mt-2'>
              Manage the catalog details, imagery and storefront availability for this product.
            </DialogDescription>
          </div>
          <button type='button' disabled={uploading || saving} onClick={() => void closeWithoutSaving()} className='rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50'>
            Close
          </button>
        </DialogHeader>

        <form onSubmit={save} className='dashboard-product-form'>
          <section className='dashboard-product-section'>
            <header className='dashboard-product-section-heading'>
              <span>01</span>
              <div><h3>Product details</h3><p>Identity, pricing and availability</p></div>
            </header>
            <div className='grid gap-4 sm:grid-cols-2'>
            <Field label='Product name'>
              <input required maxLength={120} className={inputClass} value={values.name} onChange={(event) => update('name', event.target.value)} />
            </Field>
            <Field label='Category'>
              <select className={inputClass} value={values.category} onChange={(event) => update('category', event.target.value as ProductInput['category'])}>
                {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
              </select>
            </Field>
            <Field label='Price (NGN)'>
              <input
                required
                type='text'
                inputMode='decimal'
                pattern='(?:[0-9]+|[0-9]{1,3}(?:,[0-9]{3})+)(?:[.][0-9]{1,2})?'
                maxLength={14}
                className={inputClass}
                ref={priceInputRef}
                value={priceInput}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  const cursor = event.currentTarget.selectionStart ?? value.length;
                  const ungrouped = value.replaceAll(',', '');
                  const partialDecimal = /^[0-9]+[.]$/.test(ungrouped);
                  const parsed = parsePriceInput(ungrouped);
                  const formatted = parsed !== undefined
                    ? formatPriceInput(parsed)
                    : partialDecimal
                      ? `${formatPriceInput(Number(ungrouped.slice(0, -1)))}.`
                      : ungrouped;
                  const digitsBeforeCursor = value.slice(0, cursor).replaceAll(',', '').length;
                  setPriceInput(formatted);
                  if (parsed !== undefined) update('price', parsed);
                  requestAnimationFrame(() => {
                    const input = priceInputRef.current;
                    if (!input) return;
                    let position = 0;
                    let characters = 0;
                    while (position < formatted.length && characters < digitsBeforeCursor) {
                      if (formatted[position] !== ',') characters += 1;
                      position += 1;
                    }
                    input.setSelectionRange(position, position);
                  });
                }}
                onBlur={() => {
                  const parsed = parsePriceInput(priceInput);
                  if (parsed !== undefined) setPriceInput(formatPriceInput(parsed));
                }}
              />
            </Field>
            <Field label='Badge'>
              <select className={inputClass} value={values.badge ?? ''} onChange={(event) => update('badge', (event.target.value || undefined) as CatalogProduct['badge'])}>
                <option value=''>None</option>
                <option value='New'>New</option>
                <option value='Bestseller'>Bestseller</option>
                <option value='Low stock'>Low stock</option>
                <option value='Sale'>Sale</option>
              </select>
            </Field>
            <div className='grid gap-1.5 sm:col-span-2'>
              <p id='product-availability-label' className='text-sm font-medium'>Availability</p>
              <div role='group' aria-labelledby='product-availability-label' className='grid gap-3 sm:grid-cols-2'>
                {([
                  { value: true, label: 'In stock', selectedClass: 'border-emerald-600 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200' },
                  { value: false, label: 'Out of stock', selectedClass: 'border-rose-600 bg-rose-500/10 text-rose-800 dark:text-rose-200' }
                ] as const).map((option) => {
                  const selected = values.inStock === option.value;
                  return (
                    <button
                      key={option.label}
                      type='button'
                      aria-pressed={selected}
                      onClick={() => update('inStock', option.value)}
                      className={`inline-flex min-h-12 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        selected ? option.selectedClass : 'border-border bg-background text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <span className={`grid size-5 place-items-center rounded-full border ${selected ? 'border-current' : 'border-muted-foreground/50'}`}>
                        {selected && <Check aria-hidden className='size-3.5' />}
                      </span>
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            </div>
          </section>

          <section className='dashboard-product-section'>
            <header className='dashboard-product-section-heading'>
              <span>02</span>
              <div><h3>Product imagery</h3><p>Main image and up to four gallery images</p></div>
            </header>
            <p className='dashboard-product-help'>Uploads go directly to Supabase Storage. JPEG, PNG, WebP or AVIF · max 8 MB each.</p>
            <input
              ref={imageInputRef}
              type='file'
              accept='image/jpeg,image/png,image/webp,image/avif'
              disabled={uploading}
              onChange={(event) => {
                void uploadImage(event.currentTarget.files?.[0], imageUploadTargetRef.current);
                event.currentTarget.value = '';
              }}
              className='sr-only'
            />
            <div className='flex gap-1.5 overflow-x-auto pb-1' role='group' aria-label='Product images'>
              <div className='w-16 shrink-0'>
                <div className='relative'>
                  <button
                    type='button'
                    aria-label={values.image ? `Replace main image for ${values.name}` : `Upload main image for ${values.name}`}
                    disabled={uploading}
                    onClick={() => chooseImage({ type: 'main' })}
                    className='relative grid size-16 place-items-center overflow-hidden rounded-md border border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50'
                  >
                    {values.image ? (
                      <Image src={imagePreviews.main ?? values.image} alt={values.name} fill unoptimized sizes='64px' className='object-cover' />
                    ) : (
                      <Upload aria-hidden className='size-5' />
                    )}
                  </button>
                  {values.image && (
                    <button
                      type='button'
                      aria-label='Remove main image'
                      onClick={() => update('image', '')}
                      className='absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full border bg-background text-foreground shadow-sm'
                    >
                      <X aria-hidden className='size-3' />
                    </button>
                  )}
                </div>
                <p className='mt-1 truncate text-center text-[10px] font-medium' title={values.name || 'Main image'}>
                  {values.name || 'Main image'}
                </p>
              </div>
              {Array.from({ length: Math.max(maxGalleryImages, values.gallery?.length ?? 0) }, (_, index) => {
                const imageUrl = values.gallery?.[index];
                const imageLabel = values.galleryAlt?.[index] || `${values.name}, image ${index + 2}`;
                const canUpload = Boolean(imageUrl) || index === (values.gallery?.length ?? 0);
                return (
                  <div
                    key={index}
                    className={`min-w-[44px] ${
                      (values.gallery?.length ?? 0) > maxGalleryImages
                        ? 'w-[52px] shrink-0'
                        : 'max-w-16 flex-1'
                    }`}
                  >
                    <div className='relative'>
                      <button
                        type='button'
                        aria-label={imageUrl ? `Replace gallery image ${index + 1}` : `Upload gallery image ${index + 1}`}
                        disabled={uploading || !canUpload}
                        onClick={() => chooseImage({ type: 'gallery', index })}
                        className='relative grid aspect-square w-full place-items-center overflow-hidden rounded-md border border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50'
                      >
                        {imageUrl ? (
                          <Image src={imagePreviews[`gallery-${index}`] ?? imageUrl} alt={imageLabel} fill unoptimized sizes='64px' className='object-cover' />
                        ) : (
                          <Upload aria-hidden className='size-4' />
                        )}
                      </button>
                      {imageUrl && (
                        <button
                          type='button'
                          aria-label={`Remove gallery image ${index + 1}`}
                          onClick={() => removeGalleryImage(index)}
                          className='absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full border bg-background text-foreground shadow-sm'
                        >
                          <X aria-hidden className='size-3' />
                        </button>
                      )}
                    </div>
                    <p className='mt-1 truncate text-center text-[10px] text-muted-foreground' title={`Gallery image ${index + 1}`}>
                      Image {index + 1}
                    </p>
                  </div>
                );
              })}
            </div>
            {uploading && <span role='status' className='text-xs text-muted-foreground'>Uploading image…</span>}
          </section>

          <section className='dashboard-product-section'>
            <header className='dashboard-product-section-heading'>
              <span>03</span>
              <div><h3>Story and specifications</h3><p>Product copy, materials and sizing</p></div>
            </header>
            <div className='grid gap-4 sm:grid-cols-2'>
            <Field label='Description'>
              <textarea rows={4} maxLength={4000} className={inputClass} value={values.description} onChange={(event) => update('description', event.target.value)} />
            </Field>
            <Field label='Product story'>
              <textarea rows={4} maxLength={4000} className={inputClass} value={values.story} onChange={(event) => update('story', event.target.value)} />
            </Field>
            <Field label='Materials'>
              <textarea rows={2} className={inputClass} value={values.materials} onChange={(event) => update('materials', event.target.value)} />
            </Field>
            <Field label='Dimensions'>
              <textarea rows={2} className={inputClass} value={values.dimensions} onChange={(event) => update('dimensions', event.target.value)} />
            </Field>
            <Field label='Care instructions'>
              <textarea rows={2} className={inputClass} value={values.care} onChange={(event) => update('care', event.target.value)} />
            </Field>
            <Field label='Sizes (one per line)'>
              <textarea rows={2} className={inputClass} value={(values.sizes ?? []).join('\n')} onChange={(event) => update('sizes', lines(event.target.value))} placeholder='S&#10;M&#10;L&#10;XL' />
            </Field>
            <Field label='Colors (one per line: Name | #RRGGBB)'>
              <textarea
                rows={3}
                className={inputClass}
                value={(values.colors ?? []).map((color) => `${color.name} | ${color.hex}`).join('\n')}
                onChange={(event) => update('colors', lines(event.target.value).map((line) => {
                  const [name = '', hex = ''] = line.split('|').map((part) => part.trim());
                  return { name, hex };
                }))}
                placeholder='Washed blue | #71879A'
              />
            </Field>
            </div>
          </section>

          <section className='dashboard-product-section dashboard-product-publishing'>
            <header className='dashboard-product-section-heading'>
              <span>04</span>
              <div><h3>Storefront placement</h3><p>Choose how this product appears to customers</p></div>
            </header>
            <div className='flex flex-wrap gap-5'>
              <label className='inline-flex items-center gap-2 text-sm'>
                <input type='checkbox' checked={values.featured ?? false} onChange={(event) => update('featured', event.target.checked)} />
                Feature on storefront
              </label>
              <label className='inline-flex items-center gap-2 text-sm'>
                <input type='checkbox' checked={values.isPublished} onChange={(event) => update('isPublished', event.target.checked)} />
                Published on storefront
              </label>
            </div>
          </section>
          {error && <p role='alert' className='rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive'>{error}</p>}
          <div className='dashboard-product-actions'>
            <button type='button' disabled={uploading || saving} onClick={() => void closeWithoutSaving()} className='min-h-10 rounded-md border px-4 text-sm hover:bg-muted disabled:opacity-50'>Cancel</button>
            <button type='submit' disabled={saving || uploading} className='min-h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50'>
              {saving ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ProductManager({
  initialProducts,
  setupMessage,
  loadError
}: {
  initialProducts: CatalogProduct[];
  setupMessage: string | null;
  loadError: string | null;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [editing, setEditing] = useState<CatalogProduct | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [visibility, setVisibility] = useState('all');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState('');
  const [archiving, setArchiving] = useState<CatalogProduct | null>(null);
  const [archivePending, setArchivePending] = useState(false);

  const filtered = useMemo(() => products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.trim().toLowerCase());
    const matchesCategory = category === 'all' || product.category === category;
    const matchesVisibility = visibility === 'all' || (visibility === 'published' ? product.isPublished : !product.isPublished);
    return matchesSearch && matchesCategory && matchesVisibility;
  }).sort((a, b) => {
    switch (sort) {
      case 'price-asc': return a.price - b.price || a.name.localeCompare(b.name);
      case 'price-desc': return b.price - a.price || a.name.localeCompare(b.name);
      case 'availability': return Number(b.inStock) - Number(a.inStock) || a.name.localeCompare(b.name);
      default: return a.name.localeCompare(b.name);
    }
  }), [category, products, search, sort, visibility]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageProducts = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const publishedCount = products.filter((product) => product.isPublished).length;
  const draftCount = products.length - publishedCount;
  const lowStockCount = products.filter(
    (product) => product.isPublished && product.inStock && product.stock > 0 && product.stock <= 5
  ).length;
  const outOfStockCount = products.filter(
    (product) => product.isPublished && !product.inStock
  ).length;

  async function archive(product: CatalogProduct) {
    setActionError('');
    setArchivePending(true);
    try {
      const response = await fetch(`/api/admin/products/${encodeURIComponent(product.id)}`, { method: 'DELETE' });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setActionError(result.error ?? 'Product could not be unpublished.');
        return;
      }
      setProducts((current) => current.map((item) => item.id === product.id ? { ...item, isPublished: false } : item));
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Product could not be unpublished.');
    } finally {
      setArchivePending(false);
      setArchiving(null);
    }
  }

  async function onSaved(saved: CatalogProduct, oldImageUrls: string[], previousId?: string) {
    setActionError('');
    setProducts((current) => [
      ...current.filter((item) => item.id !== previousId && item.id !== saved.id),
      saved
    ]);
    setEditing(null);

    const currentImageUrls = new Set([saved.image, ...(saved.gallery ?? [])]);
    const removed = oldImageUrls.filter((url) => url.includes('/storage/v1/object/public/tlx-products/') && !currentImageUrls.has(url));
    const cleanupErrors = await Promise.all(removed.map(async (url) => {
      try {
        const cleanup = await fetch('/api/admin/product-images', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        if (!cleanup.ok) {
          const result = (await cleanup.json()) as { error?: string };
          return result.error ?? 'Unknown storage error.';
        }
        return null;
      } catch (cause) {
        return cause instanceof Error ? cause.message : 'Unknown storage error.';
      }
    }));
    const cleanupError = cleanupErrors.find(Boolean);
    if (cleanupError) {
      setActionError(`Product saved, but an unused image could not be removed: ${cleanupError}`);
    }
  }

  return (
    <div className='mx-auto w-full max-w-[1680px] space-y-6 p-4 sm:p-6 xl:p-8'>
      <div className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <p className='font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground'>TLX Originals · Catalog</p>
          <h1 className='mt-2 text-3xl font-semibold tracking-tight'>Products</h1>
          <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>Manage the products, pricing, and inventory customers see in your store.</p>
        </div>
        <button type='button' disabled={Boolean(setupMessage || loadError)} onClick={() => setEditing({ ...blankProduct })} className='inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'>
          <PackagePlus aria-hidden className='size-4' />
          Add product
        </button>
      </div>

      <section aria-label='Catalog summary' className='grid gap-3 sm:grid-cols-2 2xl:grid-cols-4'>
        <article className='flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm'>
          <div><p className='text-sm text-muted-foreground'>Total products</p><p className='mt-1 text-2xl font-semibold tabular-nums'>{products.length}</p></div>
          <span className='grid size-10 place-items-center rounded-lg bg-primary/10 text-primary'><Boxes aria-hidden className='size-5' /></span>
        </article>
        <article className='flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm'>
          <div><p className='text-sm text-muted-foreground'>Published</p><p className='mt-1 text-2xl font-semibold tabular-nums'>{publishedCount}</p></div>
          <span className='grid size-10 place-items-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'><PackageCheck aria-hidden className='size-5' /></span>
        </article>
        <article className='flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm'>
          <div><p className='text-sm text-muted-foreground'>Drafts</p><p className='mt-1 text-2xl font-semibold tabular-nums'>{draftCount}</p></div>
          <span className='grid size-10 place-items-center rounded-lg bg-muted text-muted-foreground'><Boxes aria-hidden className='size-5' /></span>
        </article>
        <article className='flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm'>
          <div>
            <p className='text-sm text-muted-foreground'>Needs attention</p>
            <p className='mt-1 text-2xl font-semibold tabular-nums'>{lowStockCount + outOfStockCount}</p>
            <p className='mt-0.5 text-xs text-muted-foreground'>{outOfStockCount} out of stock · {lowStockCount} low</p>
          </div>
          <span className='grid size-10 place-items-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300'><AlertTriangle aria-hidden className='size-5' /></span>
        </article>
      </section>

      {setupMessage && (
        <section className='rounded-xl border border-amber-500/30 bg-amber-500/5 p-4' role='status'>
          <h2 className='font-medium'>Connect the product database</h2>
          <p className='mt-1 text-sm text-muted-foreground'>{setupMessage}</p>
          <p className='mt-2 text-sm text-muted-foreground'>Apply the migration in <code>supabase/migrations</code>, then run <code>npm run seed:catalog</code>.</p>
        </section>
      )}
      {loadError && <p role='alert' className='rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive'>{loadError}</p>}
      {actionError && <p role='alert' className='rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive'>{actionError}</p>}

      {!setupMessage && !loadError && (
        <>
          <div className='grid gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:grid-cols-2 2xl:grid-cols-4'>
            <input aria-label='Search products' className={inputClass} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder='Search products' />
            <select aria-label='Filter by category' className={inputClass} value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}>
              <option value='all'>All categories</option>
              {categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
            </select>
            <select aria-label='Filter by publication status' className={inputClass} value={visibility} onChange={(event) => { setVisibility(event.target.value); setPage(1); }}>
              <option value='all'>All statuses</option>
              <option value='published'>Published</option>
              <option value='draft'>Drafts</option>
            </select>
            <select aria-label='Sort products' className={inputClass} value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>
              <option value='name'>Name: A to Z</option>
              <option value='price-asc'>Price: low to high</option>
              <option value='price-desc'>Price: high to low</option>
              <option value='availability'>Availability: in stock first</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className='rounded-xl border border-dashed p-10 text-center'>
              <h2 className='font-medium'>{products.length ? 'No matching products' : 'Your catalog is empty'}</h2>
              <p className='mt-1 text-sm text-muted-foreground'>{products.length ? 'Try another search or filter.' : 'Add a product to start building the TLX catalog.'}</p>
            </div>
          ) : (
            <div className='space-y-3'>
              <div className='grid gap-3 sm:grid-cols-2 2xl:hidden'>
                {pageProducts.map((product) => (
                  <article key={product.id} className='flex min-w-0 items-center gap-2.5 rounded-lg border border-border bg-card p-2 shadow-sm'>
                    <div className='relative size-11 shrink-0 overflow-hidden rounded-md bg-muted'>
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          unoptimized
                          className='object-cover'
                        />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <h2 className='truncate text-sm font-medium'>{product.name}</h2>
                      <p className={`mt-1 truncate text-[11px] font-medium ${product.inStock ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                        {product.inStock ? 'In stock' : 'Out of stock'}
                        <span className='font-normal text-muted-foreground'> · {product.isPublished ? 'Published' : 'Draft'}</span>
                      </p>
                    </div>
                    <button
                      type='button'
                      aria-label={`Edit ${product.name}`}
                      onClick={() => setEditing(product)}
                      className='min-h-9 shrink-0 rounded-md border border-border px-2.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    >
                      Edit
                    </button>
                    {product.isPublished && (
                      <button
                        type='button'
                        aria-label={`Unpublish ${product.name}`}
                        title={`Unpublish ${product.name}`}
                        onClick={() => setArchiving(product)}
                        className='grid size-9 shrink-0 place-items-center rounded-md border border-destructive/30 text-destructive transition-colors hover:bg-destructive/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                      >
                        <EyeOff aria-hidden className='size-4' />
                      </button>
                    )}
                  </article>
                ))}
              </div>

              <div className='hidden overflow-hidden rounded-xl border border-border bg-card shadow-sm 2xl:block'>
                <div className='overflow-x-auto'>
                  <table className='w-full min-w-[850px] text-left text-sm'>
                    <thead className='bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground'>
                      <tr>
                        <th className='px-4 py-3 font-medium'>Product</th>
                        <th className='px-4 py-3 font-medium'>Category</th>
                        <th className='px-4 py-3 font-medium'>Price</th>
                        <th className='px-4 py-3 font-medium'>Availability</th>
                        <th className='px-4 py-3 font-medium'>Reviews</th>
                        <th className='px-4 py-3 font-medium'>Status</th>
                        <th className='px-4 py-3 font-medium'>Actions</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-border'>
                      {pageProducts.map((product) => (
                        <tr key={product.id} className='transition-colors hover:bg-muted/30'>
                          <td className='px-4 py-3'>
                            <div className='flex items-center gap-3'>
                              <div className='relative size-12 shrink-0 overflow-hidden rounded-md bg-muted'>
                                <Image src={product.image} alt={product.name} fill unoptimized className='object-cover' />
                              </div>
                              <div className='min-w-0'><p className='truncate font-medium'>{product.name}</p></div>
                            </div>
                          </td>
                          <td className='px-4 py-3 capitalize'>{product.category}</td>
                          <td className='px-4 py-3 tabular-nums'>{formatPrice(product.price)}</td>
                          <td className='px-4 py-3'>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${product.inStock ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'}`}>
                              {product.inStock && <Check aria-hidden className='size-3.5' />}
                              {product.inStock ? 'In stock' : 'Out of stock'}
                            </span>
                          </td>
                          <td className='px-4 py-3 tabular-nums'>{product.reviewCount ? `${product.rating.toFixed(1)} ★ · ${product.reviewCount}` : 'No reviews'}</td>
                          <td className='px-4 py-3'><span className={`rounded-full px-2 py-1 text-xs ${product.isPublished ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>{product.isPublished ? 'Published' : 'Draft'}</span></td>
                          <td className='px-4 py-3'>
                            <div className='flex items-center gap-2'>
                              <button type='button' onClick={() => setEditing(product)} className='rounded-md border px-2.5 py-1.5 text-xs hover:bg-muted'>Edit</button>
                              {product.isPublished && <button type='button' onClick={() => setArchiving(product)} className='rounded-md border border-destructive/30 px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/5'>Unpublish</button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm'>
                <p className='text-xs text-muted-foreground'>
                  Showing {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
                  <span className='hidden sm:inline'> filtered · {products.length} total</span>
                </p>
                <div className='ml-auto flex items-center gap-2'>
                  <button
                    type='button'
                    aria-label='Previous product page'
                    disabled={currentPage <= 1}
                    onClick={() => setPage(currentPage - 1)}
                    className='min-h-9 rounded-md border px-3 text-xs transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50'
                  >
                    Previous
                  </button>
                  <span className='whitespace-nowrap text-xs tabular-nums text-muted-foreground'>Page {currentPage} of {pageCount}</span>
                  <button
                    type='button'
                    aria-label='Next product page'
                    disabled={currentPage >= pageCount}
                    onClick={() => setPage(currentPage + 1)}
                    className='min-h-9 rounded-md border px-3 text-xs transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50'
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {editing && <ProductEditor product={editing} existingProducts={products} onClose={() => setEditing(null)} onSaved={(saved, oldUrls, previousId) => void onSaved(saved, oldUrls, previousId)} />}
      <AlertDialog
        open={Boolean(archiving)}
        onOpenChange={(open) => {
          if (!open && !archivePending) setArchiving(null);
        }}
      >
        {archiving && (
          <AlertDialogContent className='dashboard-unpublish-dialog'>
            <AlertDialogHeader>
              <AlertDialogTitle>Unpublish this product?</AlertDialogTitle>
              <AlertDialogDescription>
                {archiving.name} will be removed from the storefront. Its catalog record will remain available to edit.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={archivePending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={archivePending}
                onClick={() => void archive(archiving)}
                className='dashboard-unpublish-action'
              >
                {archivePending ? 'Unpublishing…' : 'Unpublish product'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  );
}
