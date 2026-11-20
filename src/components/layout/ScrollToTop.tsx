"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function scrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}

export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    if (!window.location.hash) scrollToTop();
  }, [pathname]);

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
  }, []);

  return null;
}
