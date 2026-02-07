/**
 * PWA Hook and Utilities
 * Provides PWA installation, update management, and offline detection
 */

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
  updateAvailable: boolean;
  swVersion: string | null;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOffline: !navigator.onLine,
    deferredPrompt: null,
    updateAvailable: false,
    swVersion: null,
  });

  useEffect(() => {
    // Check if installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setState((prev) => ({ ...prev, isInstalled: isStandalone || isIOSStandalone }));
    };

    checkInstalled();

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setState((prev) => ({
        ...prev,
        deferredPrompt: e as BeforeInstallPromptEvent,
        isInstallable: true,
      }));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setState((prev) => ({
        ...prev,
        isInstallable: false,
        isInstalled: true,
        deferredPrompt: null,
      }));
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // Listen for online/offline
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOffline: false }));
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOffline: true }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check for updates
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        setState((prev) => ({ ...prev, updateAvailable: true }));
      });

      // Get SW version
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          const messageChannel = new MessageChannel();
          messageChannel.port1.onmessage = (event) => {
            if (event.data && event.data.version) {
              setState((prev) => ({ ...prev, swVersion: event.data.version }));
            }
          };
          registration.active.postMessage(
            { type: "GET_VERSION" },
            [messageChannel.port2]
          );
        }
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const install = useCallback(async () => {
    if (!state.deferredPrompt) return;

    state.deferredPrompt.prompt();
    const choiceResult = await state.deferredPrompt.userChoice;

    if (choiceResult.outcome === "accepted") {
      console.log("[PWA] User accepted the install prompt");
    } else {
      console.log("[PWA] User dismissed the install prompt");
    }

    setState((prev) => ({ ...prev, deferredPrompt: null, isInstallable: false }));
  }, [state.deferredPrompt]);

  const update = useCallback(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.update();
        window.location.reload();
      });
    }
  }, []);

  return {
    ...state,
    install,
    update,
  };
}

// PWA Installation Button Component
interface InstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

export function InstallPrompt({ onInstall, onDismiss }: InstallPromptProps) {
  const { isInstallable, isInstalled, install } = usePWA();

  if (!isInstallable || isInstalled) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-primary-600 text-white p-4 rounded-lg shadow-lg z-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold">Install Interview Buddy</h3>
          <p className="text-sm text-primary-200">
            Add to your home screen for quick access
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              onDismiss?.();
            }}
            className="px-4 py-2 text-primary-200 hover:text-white"
          >
            Later
          </button>
          <button
            onClick={() => {
              install();
              onInstall?.();
            }}
            className="px-4 py-2 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}

// Offline Indicator Component
export function OfflineIndicator() {
  const { isOffline } = usePWA();

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-600 text-white px-4 py-2 text-center text-sm z-50">
      ⚠️ You're offline. Some features may be limited.
    </div>
  );
}

// Update Available Prompt
interface UpdatePromptProps {
  onUpdate?: () => void;
  onDismiss?: () => void;
}

export function UpdatePrompt({ onUpdate, onDismiss }: UpdatePromptProps) {
  const { updateAvailable, update } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="fixed top-4 left-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold">Update Available</h3>
          <p className="text-sm text-green-200">
            A new version is available. Update now for the latest features.
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setDismissed(true);
              onDismiss?.();
            }}
            className="px-4 py-2 text-green-200 hover:text-white"
          >
            Later
          </button>
          <button
            onClick={() => {
              update();
              onUpdate?.();
            }}
            className="px-4 py-2 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}

export default usePWA;
