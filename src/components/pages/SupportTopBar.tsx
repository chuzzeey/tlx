import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SupportTopBar({
  title,
  backHref,
  backLabel,
}: {
  title: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="sticky top-0 z-30 flex h-14 items-center justify-center border-b border-border bg-background md:hidden">
      <Link
        href={backHref}
        aria-label={backLabel}
        className="absolute left-3 flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-card"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <h1 className="text-sm font-semibold">{title}</h1>
      <span aria-hidden="true" className="absolute right-3 h-11 w-11" />
    </div>
  );
}
