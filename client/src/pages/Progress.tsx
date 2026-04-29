/**
 * Progress — Unified progress page with 3 tabs
 * Replaces /stats, /badges, /history
 *
 * Reads ?tab= param and renders the appropriate sub-page.
 * Each sub-page renders ProgressTabBar at the top of its content.
 */

import { lazy, Suspense, useEffect } from 'react';
import { useLocation } from 'wouter';
import { InterviewLoader } from '@/components/ui/InterviewLoader';

const GoogleStats   = lazy(() => import('./GoogleStats'));
const BadgesPage    = lazy(() => import('./Badges'));
const AnswerHistory = lazy(() => import('./AnswerHistory'));

type Tab = 'overview' | 'badges' | 'history';

export default function Progress() {
  const [location] = useLocation();

  const params = new URLSearchParams(window.location.search);
  const tab = (params.get('tab') as Tab) || 'overview';

  // Store active tab so sub-pages can read it
  useEffect(() => {
    sessionStorage.setItem('progress-tab', tab);
  }, [tab]);

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <InterviewLoader message="Loading..." showTip={false} />
      </div>
    }>
      {tab === 'overview' && <GoogleStats />}
      {tab === 'badges'   && <BadgesPage />}
      {tab === 'history'  && <AnswerHistory />}
    </Suspense>
  );
}
