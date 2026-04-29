import { useEffect, useState } from 'react';
import {
  onCLS,
  onFID,
  onINP,
  onLCP,
  type CLSMetric,
  type FIDMetric,
  type INPMetric,
  type LCPMetric,
} from 'web-vitals';

export interface WebVitalsMetrics {
  lcp: number | null;
  fid: number | null;
  inp: number | null;
  cls: number | null;
}

export interface WebVitalsComponentProps {
  onReport?: (metrics: WebVitalsMetrics) => void;
  debug?: boolean;
}

function reportMetric(
  name: string,
  value: number,
  event: CLSMetric | FIDMetric | INPMetric | LCPMetric,
  setMetrics: React.Dispatch<React.SetStateAction<WebVitalsMetrics>>,
  onReport?: (metrics: WebVitalsMetrics) => void,
  debug?: boolean
) {
  setMetrics((prev) => {
    const newMetrics = { ...prev, [name]: value };
    if (debug) {
      console.log(`[Web Vitals] ${name}:`, value, 'ms');
    }
    if (onReport) {
      onReport(newMetrics);
    }
    return newMetrics;
  });
}

export function WebVitalsReporter({
  onReport,
  debug = false,
}: WebVitalsComponentProps) {
  const [metrics, setMetrics] = useState<WebVitalsMetrics>({
    lcp: null,
    fid: null,
    inp: null,
    cls: null,
  });

  useEffect(() => {
    onLCP((metric) => {
      reportMetric('lcp', metric.value, metric, setMetrics, onReport, debug);
    });

    onFID((metric) => {
      reportMetric('fid', metric.value, metric, setMetrics, onReport, debug);
    });

    onINP((metric) => {
      reportMetric('inp', metric.value, metric, setMetrics, onReport, debug);
    });

    onCLS((metric) => {
      reportMetric('cls', metric.value, metric, setMetrics, onReport, debug);
    });
  }, [onReport, debug]);

  return null;
}

export function useWebVitals() {
  const [metrics, setMetrics] = useState<WebVitalsMetrics>({
    lcp: null,
    fid: null,
    inp: null,
    cls: null,
  });

  useEffect(() => {
    const handleReport = (newMetrics: WebVitalsMetrics) => {
      setMetrics(newMetrics);
    };

    onLCP((metric) => {
      setMetrics((prev) => ({ ...prev, lcp: metric.value }));
      if (metric.value > 2500) {
        console.warn(`[LCP] Slow: ${metric.value}ms (target: ≤2500ms)`);
      }
    });

    onFID((metric) => {
      setMetrics((prev) => ({ ...prev, fid: metric.value }));
      if (metric.value > 100) {
        console.warn(`[FID] Slow: ${metric.value}ms (target: ≤100ms)`);
      }
    });

    onINP((metric) => {
      setMetrics((prev) => ({ ...prev, inp: metric.value }));
      if (metric.value > 200) {
        console.warn(`[INP] Slow: ${metric.value}ms (target: ≤200ms)`);
      }
    });

    onCLS((metric) => {
      setMetrics((prev) => ({ ...prev, cls: metric.value }));
      if (metric.value > 0.1) {
        console.warn(`[CLS] High: ${metric.value} (target: ≤0.1)`);
      }
    });
  }, []);

  return metrics;
}

export function getPerformanceRating(
  metric: 'lcp' | 'fid' | 'inp' | 'cls',
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = {
    lcp: { good: 2500, needsImprovement: 4000 },
    fid: { good: 100, needsImprovement: 300 },
    inp: { good: 200, needsImprovement: 500 },
    cls: { good: 0.1, needsImprovement: 0.25 },
  };

  const threshold = thresholds[metric];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

export { onCLS, onFID, onINP, onLCP };
export type { CLSMetric, FIDMetric, INPMetric, LCPMetric };