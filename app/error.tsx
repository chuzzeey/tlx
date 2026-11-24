"use client";

import Link from "next/link";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-background px-6 py-16 text-center">
      <section className="max-w-md">
        <p className="label-mono">A quick pause</p>
        <h1 className="mt-3 font-display text-3xl font-light">This page couldn&apos;t load.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Your page is still here. Check your connection and try again.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium"
          >
            Go home
          </Link>
        </div>
      </section>
    </main>
  );
}
