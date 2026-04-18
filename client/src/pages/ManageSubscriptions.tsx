/**
 * ManageSubscriptions — slide-up modal to add/remove topics & certs.
 * Accessible via nav "Manage" link.
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Search, Settings2 } from 'lucide-react';
import { allChannelsConfig, categories } from '../lib/channels-config';
import { certificationsConfig } from '../lib/certifications-config';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { AppLayout } from '../components/layout/AppLayout';
import { SEOHead } from '../components/SEOHead';
import { useLocation } from 'wouter';

const CERT_PROVIDERS = ['Amazon Web Services', 'Kubernetes', 'HashiCorp', 'Google Cloud', 'Microsoft Azure'];

type Tab = 'topics' | 'certs';

export default function ManageSubscriptionsPage() {
  const { preferences, toggleSubscription } = useUserPreferences();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>('topics');
  const [query, setQuery] = useState('');

  const topicChannels = useMemo(() =>
    allChannelsConfig.filter(c => !c.isCertification), []);

  const certsByProvider = useMemo(() => {
    const map: Record<string, typeof certificationsConfig> = {};
    for (const cert of certificationsConfig) {
      if (!CERT_PROVIDERS.includes(cert.provider)) continue;
      (map[cert.provider] ??= []).push(cert);
    }
    return map;
  }, []);

  const isSubscribed = (id: string) => preferences.subscribedChannels.includes(id);

  const filteredTopics = topicChannels.filter(c =>
    !query || c.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredCerts = Object.entries(certsByProvider).reduce<Record<string, typeof certificationsConfig>>(
    (acc, [provider, certs]) => {
      const filtered = certs.filter(c =>
        !query || c.name.toLowerCase().includes(query.toLowerCase()) || provider.toLowerCase().includes(query.toLowerCase())
      );
      if (filtered.length) acc[provider] = filtered;
      return acc;
    }, {}
  );

  const subscribedTopicCount = topicChannels.filter(c => isSubscribed(c.id)).length;
  const subscribedCertCount = certificationsConfig.filter(c => isSubscribed(c.id)).length;

  const hasTopicResults = categories
    .filter(cat => cat.id !== 'certification')
    .some(cat => filteredTopics.some(c => c.category === cat.id));

  return (
    <AppLayout title="Manage Subscriptions" fullWidth>
      <SEOHead title="Manage Subscriptions | Open Interview" description="Manage your topic and certification subscriptions." />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-24">

        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6 pt-6">
          <Settings2 className="w-5 h-5 text-[var(--color-accent-violet-light)]" />
          <div>
            <h1 className="text-xl font-bold">My Subscriptions</h1>
            <p className="text-sm text-muted-foreground">{subscribedTopicCount} topics · {subscribedCertCount} certs</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search topics or certifications..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-3 min-h-[44px] bg-muted/50 border border-border rounded-lg text-base focus:outline-none focus:border-primary transition-colors duration-150 ease-out"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['topics', 'certs'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 min-h-[44px] rounded-full text-sm font-semibold capitalize transition-all duration-150 ease-out cursor-pointer ${
                tab === t
                  ? 'bg-gradient-to-r from-[var(--color-accent-violet)] to-[var(--color-accent-cyan)] text-white'
                  : 'bg-muted/50 border border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {t === 'topics' ? `Topics (${subscribedTopicCount})` : `Certs (${subscribedCertCount})`}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'topics' && (
            <motion.div key="topics" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15, ease: 'easeOut' }}>
              {!hasTopicResults ? (
                <div className="text-center py-16">
                  <p className="text-base text-muted-foreground mb-4">No topics match "{query}".</p>
                  <button
                    onClick={() => setQuery('')}
                    className="px-5 py-2.5 min-h-[44px] bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors duration-150 ease-out cursor-pointer"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                categories.filter(cat => cat.id !== 'certification').map(cat => {
                  const chans = filteredTopics.filter(c => c.category === cat.id);
                  if (!chans.length) return null;
                  return (
                    <div key={cat.id} className="mb-6">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{cat.name}</div>
                      <div className="flex flex-wrap gap-2">
                        {chans.map(c => {
                          const on = isSubscribed(c.id);
                          return (
                            <button
                              key={c.id}
                              onClick={() => toggleSubscription(c.id)}
                              className={`px-4 py-2.5 min-h-[44px] rounded-full text-sm font-semibold border transition-all duration-150 ease-out cursor-pointer ${
                                on
                                  ? 'border-[var(--color-accent-violet)] bg-[var(--color-accent-violet)]/15 text-[var(--color-accent-violet-light)]'
                                  : 'border-border bg-card text-muted-foreground hover:border-[var(--color-accent-violet)]/40'
                              }`}
                            >
                              {on && <Check className="w-3 h-3 inline mr-1" />}{c.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}

          {tab === 'certs' && (
            <motion.div key="certs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15, ease: 'easeOut' }}>
              {Object.keys(filteredCerts).length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-base text-muted-foreground mb-4">
                    {query ? `No certs match "${query}".` : 'No certifications available.'}
                  </p>
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      className="px-5 py-2.5 min-h-[44px] bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors duration-150 ease-out cursor-pointer"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                Object.entries(filteredCerts).map(([provider, certs]) => (
                  <div key={provider} className="mb-6">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{provider}</div>
                    <div className="space-y-2">
                      {certs.map(cert => {
                        const on = isSubscribed(cert.id);
                        return (
                          <button
                            key={cert.id}
                            onClick={() => toggleSubscription(cert.id)}
                            className={`w-full flex items-center justify-between p-4 min-h-[44px] rounded-xl border transition-all duration-150 ease-out text-left cursor-pointer ${
                              on
                                ? 'border-[var(--color-accent-cyan)] bg-[var(--color-accent-cyan)]/10'
                                : 'border-border bg-card hover:border-[var(--color-accent-cyan)]/40'
                            }`}
                          >
                            <div>
                              <div className="text-base font-semibold">{cert.name}</div>
                              {cert.examCode && <div className="text-xs text-muted-foreground font-mono mt-0.5">{cert.examCode}</div>}
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 transition-colors duration-150 ${
                              on ? 'border-[var(--color-accent-cyan)] bg-[var(--color-accent-cyan)]' : 'border-border'
                            }`}>
                              {on && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AppLayout>
  );
}
