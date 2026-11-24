"use client";

import { useEffect, useState } from "react";
import { useCatalog } from "@/store/CatalogContext";

export default function OfflineNotice() {
  const { error } = useCatalog();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const updateNetworkStatus = () => setIsOffline(!navigator.onLine);
    updateNetworkStatus();
    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);

    return () => {
      window.removeEventListener("online", updateNetworkStatus);
      window.removeEventListener("offline", updateNetworkStatus);
    };
  }, []);

  if (!isOffline && !error) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[200] flex justify-center px-3 pt-[calc(env(safe-area-inset-top)+8px)]">
      <p
        role="status"
        aria-live="polite"
        className="rounded-full border border-[#EEE8D5] bg-[#FFFAF0] px-4 py-2 text-center text-sm text-foreground shadow-lg"
      >
        {isOffline
          ? "You're offline. This page is still open; some updates may not sync."
          : error}
      </p>
    </div>
  );
}
