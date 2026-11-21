'use client';

import { BadgeCheck, Star } from 'lucide-react';
import { useState } from 'react';
import type { CatalogReview } from '@dashboard/lib/catalog-service';

export default function ReviewManager({ reviews }: { reviews: CatalogReview[] }) {
  const [items, setItems] = useState(reviews);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const visible = items.filter((review) =>
    filter === 'all' || (filter === 'approved' ? review.approved : !review.approved)
  );
  const pendingCount = items.filter((review) => !review.approved).length;
  const approvedReviews = items.filter((review) => review.approved);
  const averageRating = approvedReviews.length
    ? approvedReviews.reduce((sum, review) => sum + review.rating, 0) / approvedReviews.length
    : null;

  async function setApproval(review: CatalogReview, approved: boolean) {
    setSavingId(review.id);
    setError('');
    try {
      const response = await fetch(`/api/admin/reviews/${encodeURIComponent(review.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved })
      });
      const result = (await response.json()) as { approved?: boolean; error?: string };
      if (!response.ok || result.approved !== approved) {
        throw new Error(result.error ?? 'The review status was not updated.');
      }
      setItems((current) => current.map((item) => item.id === review.id ? { ...item, approved } : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The review status was not updated.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className='space-y-5'>
      <div className='grid gap-3 sm:grid-cols-3'>
        <article className='rounded-xl border border-border bg-card p-4 shadow-sm'>
          <p className='text-sm text-muted-foreground'>Awaiting review</p>
          <p className='mt-2 text-2xl font-semibold tabular-nums'>{pendingCount}</p>
          <p className='mt-1 text-xs text-muted-foreground'>Submissions not yet published</p>
        </article>
        <article className='rounded-xl border border-border bg-card p-4 shadow-sm'>
          <p className='text-sm text-muted-foreground'>Published</p>
          <p className='mt-2 text-2xl font-semibold tabular-nums'>{approvedReviews.length}</p>
          <p className='mt-1 text-xs text-muted-foreground'>Approved customer reviews</p>
        </article>
        <article className='rounded-xl border border-border bg-card p-4 shadow-sm'>
          <p className='text-sm text-muted-foreground'>Average rating</p>
          <p className='mt-2 flex items-center gap-2 text-2xl font-semibold tabular-nums'>
            {averageRating === null ? '—' : averageRating.toFixed(1)}
            {averageRating !== null && <Star aria-hidden className='size-5 fill-amber-400 text-amber-500' />}
          </p>
          <p className='mt-1 text-xs text-muted-foreground'>Based on approved reviews</p>
        </article>
      </div>

      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h2 className='font-semibold tracking-tight'>Review submissions</h2>
          <p className='mt-1 text-xs text-muted-foreground'>{visible.length} shown · {items.length} total</p>
        </div>
        <label className='flex items-center gap-2 text-sm'>
          <span>Show</span>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as typeof filter)}
            className='min-h-9 rounded-md border border-input bg-background px-3'
          >
            <option value='pending'>Pending</option>
            <option value='approved'>Approved</option>
            <option value='all'>All reviews</option>
          </select>
        </label>
      </div>
      {error && <p role='alert' className='rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive'>{error}</p>}
      {visible.length ? visible.map((review) => (
        <article key={review.id} className='rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div className='flex min-w-0 items-start gap-3'>
              <span className='grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground'>
                {review.verified ? <BadgeCheck aria-hidden className='size-4' /> : <Star aria-hidden className='size-4' />}
              </span>
              <div className='min-w-0'>
                <h3 className='truncate font-medium'>{review.title}</h3>
                <p className='mt-1 break-words text-sm text-muted-foreground'>
                  {review.productName} · {review.author}{review.location ? ` · ${review.location}` : ''}
                </p>
              </div>
            </div>
            <div className='flex shrink-0 items-center gap-2 rounded-full bg-muted px-2.5 py-1.5'>
              <span className='flex' role='img' aria-label={`${review.rating} out of 5 stars`}>
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    aria-hidden
                    className={`size-3 ${index < review.rating ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground/40'}`}
                  />
                ))}
              </span>
              {review.verified && <span className='text-[11px] text-muted-foreground'>Verified</span>}
            </div>
          </div>
          <p className='mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-foreground/90'>{review.body}</p>
          <div className='mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4'>
            <span className='text-xs text-muted-foreground'>
              {new Date(review.createdAt).toLocaleDateString()} · {review.approved ? 'Published' : 'Pending'}
            </span>
            <button
              type='button'
              disabled={savingId === review.id}
              onClick={() => void setApproval(review, !review.approved)}
              className={review.approved
                ? 'min-h-9 rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50'
                : 'min-h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50'}
            >
              {savingId === review.id ? 'Saving…' : review.approved ? 'Unpublish' : 'Approve'}
            </button>
          </div>
        </article>
      )) : (
        <p className='rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground'>
          {items.length ? 'No reviews match this filter.' : 'No customer reviews have been submitted yet.'}
        </p>
      )}
    </section>
  );
}
