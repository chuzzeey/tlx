"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

const BRAND_ANIMATION_MS = 1400;
const LOADER_EXIT_MS = 250;

function scrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
}

function BrandLoader({ isFadingOut }: { isFadingOut: boolean }) {
  return (
    <motion.div
      role="status"
      aria-label="Loading TLX Originals"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background text-foreground"
      initial={false}
      animate={{ opacity: isFadingOut ? 0 : 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="flex flex-col items-center px-6 text-center">
        <div className="brand-type flex items-baseline whitespace-nowrap font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          <motion.span
            initial={{ x: -45, y: -70, opacity: 0, rotate: -8 }}
            animate={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 190, damping: 18 }}
          >
            T
          </motion.span>
          <motion.span
            initial={{ y: 70, opacity: 0, rotate: 8 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 190, damping: 18, delay: 0.08 }}
          >
            L
          </motion.span>
          <motion.span
            initial={{ scale: 0.15, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.16 }}
          >
            X
          </motion.span>
          <motion.span
            className="ml-2"
            initial={{ x: 90, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 180, damping: 20, delay: 0.24 }}
          >
            Originals
          </motion.span>
        </div>
        <motion.p
          className="mt-3 font-mono2 text-[10px] tracking-[0.2em] text-muted-foreground sm:text-xs"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.62 }}
        >
          No Hype. Just Motion!
        </motion.p>
      </div>
    </motion.div>
  );
}

export default function NavigationEffects() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const loaderTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!window.location.hash) scrollToTop();
  }, [pathname]);

  useEffect(() => {
    const hideLoader = () => {
      setIsFadingOut(true);
      hideTimer.current = window.setTimeout(() => {
        setIsLoading(false);
        setIsFadingOut(false);
        loaderTimer.current = null;
        hideTimer.current = null;
      }, LOADER_EXIT_MS);
    };

    loaderTimer.current = window.setTimeout(hideLoader, BRAND_ANIMATION_MS);

    return () => {
      if (loaderTimer.current !== null) window.clearTimeout(loaderTimer.current);
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    };
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;

      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.hash) return;

      if (destination.pathname === "/") {
        event.preventDefault();
        if (loaderTimer.current !== null) window.clearTimeout(loaderTimer.current);
        if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
        setIsLoading(true);
        setIsFadingOut(false);
        scrollToTop();

        loaderTimer.current = window.setTimeout(() => {
          if (pathname !== "/") router.push("/", { scroll: false });
          setIsFadingOut(true);
          hideTimer.current = window.setTimeout(() => {
            scrollToTop();
            setIsLoading(false);
            setIsFadingOut(false);
            loaderTimer.current = null;
            hideTimer.current = null;
          }, LOADER_EXIT_MS);
        }, BRAND_ANIMATION_MS);
        return;
      }

      scrollToTop();
    };

    const handleHistoryNavigation = () => {
      requestAnimationFrame(() => {
        if (!window.location.hash) scrollToTop();
      });
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handleHistoryNavigation);
    window.addEventListener("pageshow", handleHistoryNavigation);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handleHistoryNavigation);
      window.removeEventListener("pageshow", handleHistoryNavigation);
    };
  }, [pathname, router]);

  return isLoading ? <BrandLoader isFadingOut={isFadingOut} /> : null;
}
