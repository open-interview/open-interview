import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./index.css";
import { initializeAnalytics } from "./lib/analytics";
import { initializePostHog } from "./lib/posthog";
import { registerServiceWorker } from "./lib/service-worker";
import { WebVitalsReporter } from "./components/WebVitals";

// Initialize Google Analytics
// Using Code Reels Google Analytics Measurement ID
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-47MSM57H95';
initializeAnalytics(GA_MEASUREMENT_ID);

// Initialize PostHog for A/B testing (non-blocking)
// Loads asynchronously to avoid impacting Core Web Vitals
const POST_HOG_API_KEY = import.meta.env.VITE_POST_HOG_API_KEY;
if (POST_HOG_API_KEY) {
  if (document.readyState === 'complete') {
    setTimeout(() => initializePostHog(), 2000);
  } else {
    window.addEventListener('load', () => {
      setTimeout(() => initializePostHog(), 2000);
    });
  }
}

// Register service worker for offline support
registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
    <WebVitalsReporter />
  </HelmetProvider>
);
