"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export function OfflineDetector() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-destructive/90 backdrop-blur-sm text-destructive-foreground text-center text-sm py-2 px-4 flex items-center justify-center gap-2">
      <WifiOff className="h-4 w-4" />
      <span>You are offline. Some features may be unavailable.</span>
    </div>
  );
}
