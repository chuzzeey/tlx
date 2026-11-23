'use client';

import Image from 'next/image';
import { Eye, EyeOff, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import type { AdminCategory } from '@/data/catalog';
import { PRODUCT_IMAGE_BUCKET } from '@/lib/product-image-storage';
import { createSupabaseAuthBrowserClient } from '@dashboard/lib/supabase-auth-browser';
import type { CategoryInput } from './category-schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@dashboard/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle
} from '@dashboard/components/ui/alert-dialog';

const inputClass =
  'min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring';

const blankCategory: AdminCategory = {
  slug: '',
  name: '',
  tagline: '',
  description: '',
  image: '',
  isPublished: true,
  productCount: 0
};

function CategoryEditor({
  category,
  onClose,
  onSaved
}: {
  category: AdminCategory;
  onClose: () => void;
  onSaved: (category: AdminCategory, warning?: string) => void;
}) {
  const isNew = !category.slug;
  const [values, setValues] = useState<CategoryInput>({
    name: category.name,
    tagline: category.tagline,
    description: category.description,
    image: category.image,
    isPublished: category.isPublished
  });
  const imageInputRef = useRef<HTMLInputElement>(null);
  const uploadedImageUrlsRef = useRef<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function removeUnusedImages(urls: string[], savedImage?: string) {
    const removable = [...new Set(urls)].filter((url) =>
      url !== savedImage && url.includes('/storage/v1/object/public/tlx-products/')
    );
    const errors = await Promise.all(removable.map(async (url) => {
      try {
        const response = await fetch('/api/admin/product-images', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        if (response.ok) return null;
        const result = (await response.json()) as { error?: string };
        return result.error ?? 'An unused category image could not be removed.';
      } catch (cause) {
        return cause instanceof Error ? cause.message : 'An unused category image could not be removed.';
      }
    }));
    const cleanupError = errors.find(Boolean);
    if (cleanupError) {
      toast.error('An uploaded category image could not be cleaned up.', { description: cleanupError });
    }
  }

  async function uploadImage(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/product-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, size: file.size })
      });
      const result = (await response.json()) as { path?: string; token?: string; url?: string; error?: string };
      if (!response.ok || !result.path || !result.token || !result.url) {
        throw new Error(result.error ?? 'Category image upload could not be prepared.');
      }

      const { error: uploadError } = await createSupabaseAuthBrowserClient()
        .storage.from(PRODUCT_IMAGE_BUCKET)
        .uploadToSignedUrl(result.path, result.token, file, {
          contentType: file.type,
          cacheControl: '31536000'
        });
      if (uploadError) {
        throw new Error(`Category image upload failed: ${uploadError.message}`);
      }

      const uploadedUrl = result.url;
      uploadedImageUrlsRef.current.push(result.url);
      setValues((current) => ({ ...current, image: uploadedUrl }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Category image upload failed.');
    } finally {
      setUploading(false);
    }
  }

  function closeWithoutSaving() {
    const uncommittedImages = [...uploadedImageUrlsRef.current];
    uploadedImageUrlsRef.current = [];
    onClose();
    void removeUnusedImages(uncommittedImages);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (isNew && !uploadedImageUrlsRef.current.includes(values.image)) {
        throw new Error('Upload a category image before saving the new category.');
      }

      const response = await fetch(
        isNew ? '/api/admin/categories' : `/api/admin/categories/${encodeURIComponent(category.slug)}`,
        {
          method: isNew ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        }
      );
      const result = (await response.json()) as {
        category?: CategoryInput & { slug: string; productCount?: number };
        error?: string;
        warning?: string;
      };
      if (!response.ok || !result.category?.slug) {
        throw new Error(result.error ?? 'Category could not be saved.');
      }
      const savedCategory: AdminCategory = {
        ...result.category,
        productCount: result.category.productCount ?? category.productCount
      };
      const oldAndUncommittedImages = [
        ...uploadedImageUrlsRef.current,
        ...(!isNew && category.image !== values.image ? [category.image] : [])
      ];
      uploadedImageUrlsRef.current = [];
      onSaved(savedCategory, result.warning);
      await removeUnusedImages(oldAndUncommittedImages, savedCategory.image);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Category could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !saving && !uploading) closeWithoutSaving(); }}>
      <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-xl'>
        <DialogHeader>
          <p className='font-mono text-xs uppercase tracking-widest text-muted-foreground'>Store catalog</p>
          <DialogTitle className='text-xl'>{isNew ? 'Add new category' : `Edit ${category.name}`}</DialogTitle>
          <DialogDescription>
            {isNew
              ? 'Add a category image and details to make a new collection available in the catalog.'
              : 'Change how this category appears in the storefront. Hiding it also hides its products.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className='grid gap-4'>
          <label className='grid gap-1.5 text-sm'>
            <span className='font-medium'>Category name</span>
            <input required minLength={2} maxLength={80} className={inputClass} value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label className='grid gap-1.5 text-sm'>
            <span className='font-medium'>Tagline</span>
            <input maxLength={160} className={inputClass} value={values.tagline} onChange={(event) => setValues((current) => ({ ...current, tagline: event.target.value }))} />
          </label>
          <label className='grid gap-1.5 text-sm'>
            <span className='font-medium'>Description</span>
            <textarea rows={4} maxLength={1000} className={inputClass} value={values.description} onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))} />
          </label>
          <div className='grid gap-1.5 text-sm'>
            <span className='font-medium'>
              Category image{isNew && <span className='ml-1 text-destructive'>*</span>}
            </span>
            <input
              ref={imageInputRef}
              type='file'
              accept='image/jpeg,image/png,image/webp,image/avif'
              disabled={uploading || saving}
              onChange={(event) => {
                void uploadImage(event.currentTarget.files?.[0]);
                event.currentTarget.value = '';
              }}
              className='sr-only'
            />
            <button
              type='button'
              disabled={uploading || saving}
              onClick={() => imageInputRef.current?.click()}
              className='relative flex min-h-36 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60'
            >
              {values.image && (
                <Image
                  src={values.image}
                  alt=''
                  fill
                  unoptimized
                  className='object-contain p-3 opacity-20'
                />
              )}
              <span className='relative grid size-10 place-items-center rounded-full bg-background text-foreground shadow-sm'>
                <Upload aria-hidden className='size-5' />
              </span>
              <span className='relative font-medium'>
                {uploading ? 'Uploading image…' : values.image ? 'Replace category image' : 'Upload category image'}
              </span>
              <span className='relative text-xs text-muted-foreground'>JPEG, PNG, WebP or AVIF · max 8 MB</span>
            </button>
          </div>
          <label className='flex items-start gap-2 text-sm'>
            <input type='checkbox' checked={values.isPublished} onChange={(event) => setValues((current) => ({ ...current, isPublished: event.target.checked }))} className='mt-0.5' />
            <span><span className='font-medium'>Show this category</span><span className='mt-0.5 block text-xs text-muted-foreground'>When off, customers cannot see this category or its products.</span></span>
          </label>
          {error && <p role='alert' className='rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive'>{error}</p>}
          <div className='flex justify-end gap-2'>
            <button type='button' disabled={saving || uploading} onClick={closeWithoutSaving} className='min-h-10 rounded-md border px-4 text-sm hover:bg-muted disabled:opacity-50'>Cancel</button>
            <button type='submit' disabled={saving || uploading} className='min-h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50'>
              {uploading ? 'Uploading…' : saving ? 'Saving…' : 'Save category'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CategoryManager({
  initialCategories,
  setupMessage,
  loadError
}: {
  initialCategories: AdminCategory[];
  setupMessage: string | null;
  loadError: string | null;
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [visibilitySavingSlug, setVisibilitySavingSlug] = useState<string | null>(null);
  const [visibilityError, setVisibilityError] = useState('');
  const [deletingCategory, setDeletingCategory] = useState<AdminCategory | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  function onSaved(category: AdminCategory, warning?: string) {
    setCategories((current) => current.some((item) => item.slug === category.slug)
      ? current.map((item) => item.slug === category.slug ? category : item)
      : [...current, category]
    );
    setVisibilityError(warning ?? '');
    setEditing(null);
  }

  async function toggleVisibility(category: AdminCategory) {
    setVisibilitySavingSlug(category.slug);
    setVisibilityError('');

    try {
      const values: CategoryInput = {
        name: category.name,
        tagline: category.tagline,
        description: category.description,
        image: category.image,
        isPublished: !category.isPublished
      };
      const response = await fetch(`/api/admin/categories/${encodeURIComponent(category.slug)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      const result = (await response.json()) as { category?: CategoryInput; error?: string; warning?: string };
      if (!response.ok || !result.category) {
        throw new Error(result.error ?? 'Category visibility could not be updated.');
      }

      setCategories((current) => current.map((item) =>
        item.slug === category.slug ? { ...item, ...result.category } : item
      ));
      setVisibilityError(result.warning ?? '');
    } catch (cause) {
      setVisibilityError(cause instanceof Error ? cause.message : 'Category visibility could not be updated.');
    } finally {
      setVisibilitySavingSlug(null);
    }
  }

  async function deleteCategory(category: AdminCategory) {
    setDeletePending(true);
    setVisibilityError('');

    try {
      const response = await fetch(`/api/admin/categories/${encodeURIComponent(category.slug)}`, {
        method: 'DELETE'
      });
      const result = (await response.json()) as {
        deleted?: boolean;
        imageUrls?: string[];
        productCount?: number;
        warning?: string;
        error?: string;
      };
      if (!response.ok || !result.deleted || !Array.isArray(result.imageUrls)) {
        throw new Error(result.error ?? 'Category could not be deleted.');
      }

      setCategories((current) => current.filter((item) => item.slug !== category.slug));
      setDeletingCategory(null);

      const cleanupErrors = await Promise.all(
        [...new Set(result.imageUrls)].map(async (url) => {
          try {
            const cleanup = await fetch('/api/admin/product-images', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url })
            });
            if (cleanup.ok) return null;
            const cleanupResult = (await cleanup.json()) as { error?: string };
            return cleanupResult.error ?? 'An image could not be removed from storage.';
          } catch (cause) {
            return cause instanceof Error ? cause.message : 'An image could not be removed from storage.';
          }
        })
      );
      const cleanupError = cleanupErrors.find(Boolean);
      if (cleanupError) {
        const message = `Category and products were deleted from the database, but image cleanup was incomplete: ${cleanupError}`;
        setVisibilityError(message);
        toast.error('Database records deleted; image cleanup needs attention.', { description: cleanupError });
        return;
      }

      if (result.warning) {
        setVisibilityError(result.warning);
        toast.warning('Category deleted, but the storefront may take a moment to refresh.', {
          description: result.warning
        });
      } else {
        toast.success(
          `Deleted ${category.name} and ${result.productCount ?? 0} ${result.productCount === 1 ? 'product' : 'products'}.`
        );
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Category could not be deleted.';
      setVisibilityError(message);
      toast.error('Category could not be deleted.', { description: message });
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <main className='mx-auto w-full max-w-[1680px] space-y-6 p-4 sm:p-6 xl:p-8'>
      <header className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <p className='font-mono text-xs uppercase tracking-widest text-muted-foreground'>TLX Originals · Store admin</p>
          <h1 className='mt-2 text-3xl font-semibold tracking-tight'>Category</h1>
          <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>Add categories, edit details, and control which collections are visible in the storefront.</p>
        </div>
        <button
          type='button'
          disabled={Boolean(setupMessage || loadError)}
          onClick={() => setEditing({ ...blankCategory })}
          className='inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'
        >
          <Plus aria-hidden className='size-4' />
          Add category
        </button>
      </header>

      {setupMessage && (
        <section className='rounded-xl border border-amber-500/30 bg-amber-500/5 p-4' role='status'>
          <h2 className='font-medium'>Connect the product database</h2>
          <p className='mt-1 text-sm text-muted-foreground'>{setupMessage}</p>
          <p className='mt-2 text-sm text-muted-foreground'>Apply the SQL files in <code>supabase/migrations</code> to enable category management.</p>
        </section>
      )}
      {loadError && <p role='alert' className='rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive'>{loadError}</p>}
      {visibilityError && <p role='alert' className='rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive'>{visibilityError}</p>}

      {!setupMessage && !loadError && (
        <section aria-label='Store categories' className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
          {categories.map((category) => (
            <article key={category.slug} className='flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm'>
              <div className='flex items-start justify-between gap-3'>
                <div className='flex min-w-0 items-start gap-3'>
                  <span className='inline-flex min-h-10 shrink-0 items-center rounded-lg bg-primary/10 px-3 text-[10px] font-semibold uppercase tracking-wide text-primary'>
                    Category
                  </span>
                  <div className='min-w-0'>
                    <h2 className='truncate font-semibold'>{category.name}</h2>
                    <p className='mt-0.5 text-xs text-muted-foreground'>/{category.slug}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${category.isPublished ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                  {category.isPublished ? 'Visible' : 'Hidden'}
                </span>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>{category.tagline || 'No tagline'}</p>
                <p className='mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground'>{category.description || 'No description'}</p>
              </div>
              <div className='mt-auto flex items-center justify-between border-t border-border pt-3'>
                <p className='text-sm tabular-nums text-muted-foreground'>{category.productCount} {category.productCount === 1 ? 'product' : 'products'}</p>
                <div className='flex items-center gap-2'>
                  <button
                    type='button'
                    aria-label={`${category.isPublished ? 'Hide' : 'Show'} ${category.name}`}
                    title={`${category.isPublished ? 'Hide' : 'Show'} ${category.name}`}
                    disabled={visibilitySavingSlug !== null}
                    aria-busy={visibilitySavingSlug === category.slug}
                    onClick={() => void toggleVisibility(category)}
                    className='inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
                  >
                    {category.isPublished ? <EyeOff aria-hidden className='size-4' /> : <Eye aria-hidden className='size-4' />}
                  </button>
                  <button
                    type='button'
                    aria-label={`Edit ${category.name}`}
                    onClick={() => setEditing(category)}
                    className='inline-flex min-h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-muted'
                  >
                    <Pencil aria-hidden className='size-3.5' />
                    Edit
                  </button>
                  <button
                    type='button'
                    aria-label={`Delete ${category.name}`}
                    title={`Delete ${category.name}`}
                    disabled={deletePending || visibilitySavingSlug !== null}
                    onClick={() => setDeletingCategory(category)}
                    className='inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-destructive/30 text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive disabled:cursor-not-allowed disabled:opacity-50'
                  >
                    <Trash2 aria-hidden className='size-4' />
                  </button>
                </div>
              </div>
            </article>
          ))}
          {categories.length === 0 && (
            <p className='rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground'>No categories were found. Apply the category migration, then reload this page.</p>
          )}
        </section>
      )}

      {editing && (
        <CategoryEditor
          key={editing.slug}
          category={editing}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}
      <AlertDialog
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => {
          if (!open && !deletePending) setDeletingCategory(null);
        }}
      >
        {deletingCategory && (
          <AlertDialogContent className='data-[size=default]:max-w-md data-[size=default]:sm:max-w-md rounded-2xl border border-destructive/20 bg-card shadow-2xl'>
            <AlertDialogHeader>
              <AlertDialogMedia className='size-12 rounded-full bg-destructive/10 text-destructive'>
                <Trash2 aria-hidden className='size-5' />
              </AlertDialogMedia>
              <AlertDialogTitle className='text-lg font-semibold'>
                Delete {deletingCategory.name}?
              </AlertDialogTitle>
              <AlertDialogDescription className='leading-6'>
                This permanently deletes the category, its {deletingCategory.productCount} {deletingCategory.productCount === 1 ? 'product' : 'products'}, and their reviews and URL redirects. Images still used elsewhere are kept. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={deletePending}
                className='min-h-10 rounded-md border-border bg-background'
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={deletePending}
                onClick={(event) => {
                  event.preventDefault();
                  void deleteCategory(deletingCategory);
                }}
                className='min-h-10 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90'
              >
                {deletePending ? 'Deleting…' : 'Delete category and products'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </main>
  );
}
