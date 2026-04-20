import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeAnalytics } from "./lib/analytics";
import { registerServiceWorker } from "./lib/service-worker";

// Initialize Google Analytics
// Using Code Reels Google Analytics Measurement ID
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-47MSM57H95';
initializeAnalytics(GA_MEASUREMENT_ID);

// Register service worker for offline support
registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
