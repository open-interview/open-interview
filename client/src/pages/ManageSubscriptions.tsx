/**
 * ManageSubscriptions — Google-style subscription manager.
 * Features Material Design 3 toggles, clean settings cards, and plan selection.
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Search, Settings2, Zap, Award, BookOpen, TrendingUp } from 'lucide-react';
import { allChannelsConfig, categories } from '../lib/channels-config';
import { certificationsConfig } from '../lib/certifications-config';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { AppLayout } from '../components/layout/AppLayout';
import { SEOHead } from '../components/SEOHead';
import '../styles/google-subscriptions.css';

type Tab = 'topics' | 'certs' | 'plans';

interface Plan {
  id: string;
  name: string;
  price: string;
  features: string[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    features: ['5 topics', '1 certification', 'Basic alerts'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9/mo',
    popular: true,
    features: ['Unlimited topics', 'All certifications', 'Priority alerts', 'Analytics'],
  },
  {
    id: 'team',
    name: 'Team',
    price: '$29/mo',
    features: ['Everything in Pro', 'Team management', 'API access', 'Dedicated support'],
  },
];

function GoogleToggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`google-toggle ${checked ? 'google-toggle-on' : ''} ${disabled ? 'google-toggle-disabled' : ''}`}
    >
      <span className="google-toggle-track" />
      <span className={`google-toggle-thumb ${checked ? 'google-toggle-thumb-on' : ''}`}>
        <Check className="google-toggle-check w-3 h-3" />
      </span>
    </button>
  );
}

function SubscriptionCard({
  title,
  description,
  icon: Icon,
  checked,
  onChange,
  badge,
}: {
  title: string;
  description?: string;
  icon?: React.ElementType;
  checked: boolean;
  onChange: (checked: boolean) => void;
  badge?: string;
}) {
  return (
    <div className={`subscription-card ${checked ? 'subscription-card-active' : ''}`}>
      <div className="subscription-card-content">
        {Icon && (
          <div className={`subscription-card-icon ${checked ? 'subscription-card-icon-active' : ''}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="subscription-card-text">
          <div className="subscription-card-title">{title}</div>
          {description && <div className="subscription-card-description">{description}</div>}
        </div>
        {badge && <span className="subscription-card-badge">{badge}</span>}
      </div>
      <GoogleToggle checked={checked} onChange={onChange} />
    </div>
  );
}

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: Plan;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`plan-card ${plan.popular ? 'plan-card-popular' : ''} ${selected ? 'plan-card-selected' : ''}`}
      onClick={onSelect}
    >
      {plan.popular && <div className="plan-card-badge">Most Popular</div>}
      <div className="plan-card-header">
        <div className="plan-card-name">{plan.name}</div>
        <div className="plan-card-price">{plan.price}</div>
      </div>
      <ul className="plan-card-features">
        {plan.features.map((feature, i) => (
          <li key={i} className="plan-card-feature">
            <Check className="w-4 h-4 text-[var(--g-green)]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <div className={`plan-card-select ${selected ? 'plan-card-select-active' : ''}`}>
        {selected ? (
          <>
            <Check className="w-5 h-5" />
            <span>Selected</span>
          </>
        ) : (
          <>
            <span>Select Plan</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function ManageSubscriptionsPage() {
  const { preferences, toggleSubscription } = useUserPreferences();
  const [tab, setTab] = useState<Tab>('topics');
  const [query, setQuery] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('free');

  const topicCategories = useMemo(
    () => categories.filter((c) => c.id !== 'certification'),
    []
  );

  const topicChannels = useMemo(
    () => allChannelsConfig.filter((c) => !c.isCertification),
    []
  );

  const certsByProvider = useMemo(() => {
    const map: Record<string, typeof certificationsConfig> = {};
    const providers = ['Amazon Web Services', 'Kubernetes', 'HashiCorp', 'Google Cloud', 'Microsoft Azure'];
    for (const cert of certificationsConfig) {
      if (!providers.includes(cert.provider)) continue;
      (map[cert.provider] ??= []).push(cert);
    }
    return map;
  }, []);

  const isSubscribed = (id: string) => preferences.subscribedChannels.includes(id);

  const filteredTopics = topicChannels.filter(
    (c) => !query || c.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredCerts = Object.entries(certsByProvider).reduce<Record<string, typeof certificationsConfig>>(
    (acc, [provider, certs]) => {
      const filtered = certs.filter(
        (c) =>
          !query ||
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          provider.toLowerCase().includes(query.toLowerCase())
      );
      if (filtered.length) acc[provider] = filtered;
      return acc;
    },
    {}
  );

  const subscribedTopicCount = topicChannels.filter((c) => isSubscribed(c.id)).length;
  const subscribedCertCount = certificationsConfig.filter((c) => isSubscribed(c.id)).length;

  const categoryIcons: Record<string, React.ElementType> = {
    devops: Zap,
    cloud: CloudIcon,
    security: ShieldIcon,
    programming: CodeIcon,
    databases: DatabaseIcon,
    'soft-skills': UsersIcon,
  };

  return (
    <AppLayout title="Manage Subscriptions" fullWidth>
      <SEOHead
        title="Manage Subscriptions | Open Interview"
        description="Manage your topic and certification subscriptions."
      />
      <div className="google-subscriptions-page">
        {/* Page Header */}
        <div className="google-page-header">
          <div className="google-page-icon">
            <Settings2 className="w-6 h-6" />
          </div>
          <div className="google-page-title">
            <h1>My Subscriptions</h1>
            <p>
              {subscribedTopicCount} topics · {subscribedCertCount} certs subscribed
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="google-search-container">
          <Search className="google-search-icon w-5 h-5" />
          <input
            type="text"
            placeholder="Search topics, certifications..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="google-search-input"
          />
        </div>

        {/* Tabs */}
        <div className="google-tabs" role="tablist">
          {([
            { id: 'topics', label: `Topics (${subscribedTopicCount})`, icon: BookOpen },
            { id: 'certs', label: `Certifications (${subscribedCertCount})`, icon: Award },
            { id: 'plans', label: 'Plans', icon: TrendingUp },
          ] as const).map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`google-tab ${tab === t.id ? 'google-tab-active' : ''}`}
            >
              <t.icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {tab === 'topics' && (
            <motion.div
              key="topics"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="google-tab-content"
            >
              <div className="settings-section">
                <div className="settings-section-header">
                  <h2>Topic Subscriptions</h2>
                  <p>Choose topics to receive alerts for</p>
                </div>
                <div className="settings-cards">
                  {topicCategories.map((cat) => {
                    const chans = filteredTopics.filter((c) => c.category === cat.id);
                    if (!chans.length && query) return null;
                    if (!chans.length) return null;

                    const Icon = categoryIcons[cat.id] || BookOpen;
                    const subscribedCount = chans.filter((c) => isSubscribed(c.id)).length;
                    const allSubscribed = subscribedCount === chans.length;

                    return (
                      <div key={cat.id} className="settings-card">
                        <div className="settings-card-header">
                          <div className="settings-card-icon-wrapper">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="settings-card-title-group">
                            <div className="settings-card-title">{cat.name}</div>
                            <div className="settings-card-subtitle">
                              {subscribedCount} of {chans.length} subscribed
                            </div>
                          </div>
                          <GoogleToggle
                            checked={allSubscribed}
                            onChange={(checked) => {
                              chans.forEach((c) => {
                                if (checked !== isSubscribed(c.id)) {
                                  toggleSubscription(c.id);
                                }
                              });
                            }}
                          />
                        </div>
                        <div className="settings-card-channels">
                          {chans.slice(0, 6).map((c) => (
                            <button
                              key={c.id}
                              onClick={() => toggleSubscription(c.id)}
                              className={`channel-chip ${isSubscribed(c.id) ? 'channel-chip-active' : ''}`}
                            >
                              {isSubscribed(c.id) && <Check className="w-3 h-3" />}
                              <span>{c.name}</span>
                            </button>
                          ))}
                          {chans.length > 6 && (
                            <div className="channel-chip-more">+{chans.length - 6} more</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'certs' && (
            <motion.div
              key="certs"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="google-tab-content"
            >
              <div className="settings-section">
                <div className="settings-section-header">
                  <h2>Certification Subscriptions</h2>
                  <p>Track your favorite certifications</p>
                </div>
                {Object.keys(filteredCerts).length === 0 ? (
                  <div className="empty-state">
                    <p>No certifications match "{query}".</p>
                    {query && (
                      <button onClick={() => setQuery('')} className="btn btn-secondary">
                        Clear search
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="settings-cards">
                    {Object.entries(filteredCerts).map(([provider, certs]) => (
                      <div key={provider} className="settings-card">
                        <div className="settings-card-header cert-provider-header">
                          <div className="settings-card-icon-wrapper cert-provider-icon">
                            <Award className="w-5 h-5" />
                          </div>
                          <div className="settings-card-title-group">
                            <div className="settings-card-title">{provider}</div>
                            <div className="settings-card-subtitle">
                              {certs.filter((c) => isSubscribed(c.id)).length} of {certs.length}{' '}
                              subscribed
                            </div>
                          </div>
                          <GoogleToggle
                            checked={certs.every((c) => isSubscribed(c.id))}
                            onChange={(checked) => {
                              certs.forEach((c) => {
                                if (checked !== isSubscribed(c.id)) {
                                  toggleSubscription(c.id);
                                }
                              });
                            }}
                          />
                        </div>
                        <div className="cert-list">
                          {certs.map((cert) => (
                            <SubscriptionCard
                              key={cert.id}
                              title={cert.name}
                              description={cert.examCode}
                              icon={Award}
                              checked={isSubscribed(cert.id)}
                              onChange={(checked) => {
                                if (checked !== isSubscribed(cert.id)) {
                                  toggleSubscription(cert.id);
                                }
                              }}
                              badge={cert.examCode}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {tab === 'plans' && (
            <motion.div
              key="plans"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="google-tab-content"
            >
              <div className="settings-section">
                <div className="settings-section-header">
                  <h2>Choose Your Plan</h2>
                  <p>Select the plan that fits your needs</p>
                </div>
                <div className="plans-grid">
                  {PLANS.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      selected={selectedPlan === plan.id}
                      onSelect={() => setSelectedPlan(plan.id)}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}

function CloudIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  );
}

function ShieldIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  );
}

function CodeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function DatabaseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}