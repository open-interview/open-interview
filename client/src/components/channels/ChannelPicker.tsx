import { useState, useEffect } from 'react';
import { enrollChannel, dropChannel, enrollCert, dropCert, getEnrolledChannels, getEnrolledCerts } from '@/lib/enrollment-service';
import { allChannelsConfig } from '@/lib/channels-config';
import { cn } from '@/lib/utils';

const DATA_BASE = import.meta.env.BASE_URL + 'data';

interface Cert { id: string; name: string; provider: string }

interface ChannelPickerProps {
  onClose: () => void;
}

export default function ChannelPicker({ onClose }: ChannelPickerProps) {
  const [enrolledChannels, setEnrolledChannels] = useState<string[]>(() => getEnrolledChannels());
  const [enrolledCerts, setEnrolledCerts] = useState<string[]>(() => getEnrolledCerts());
  const [certs, setCerts] = useState<Cert[]>([]);
  const [tab, setTab] = useState<'topics' | 'certs'>('topics');

  useEffect(() => {
    fetch(`${DATA_BASE}/certifications.json`)
      .then(r => r.json())
      .then((data: Cert[]) => setCerts(data))
      .catch(() => {});
  }, []);

  function toggleChannel(id: string) {
    if (enrolledChannels.includes(id)) {
      dropChannel(id);
      setEnrolledChannels(prev => prev.filter(c => c !== id));
    } else {
      enrollChannel(id);
      setEnrolledChannels(prev => [...prev, id]);
    }
  }

  function toggleCert(id: string) {
    if (enrolledCerts.includes(id)) {
      dropCert(id);
      setEnrolledCerts(prev => prev.filter(c => c !== id));
    } else {
      enrollCert(id);
      setEnrolledCerts(prev => [...prev, id]);
    }
  }

  const chipBase = 'px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors select-none';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
          <h2 className="text-sm font-semibold text-white">Pick topics to study</h2>
          <button onClick={onClose} className="text-[#666] hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>

        <div className="flex border-b border-[#2a2a2a]">
          {(['topics', 'certs'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-2.5 text-sm font-medium transition-colors',
                tab === t ? 'text-white border-b-2 border-purple-500' : 'text-[#666] hover:text-white'
              )}
            >
              {t === 'topics' ? `Topics (${enrolledChannels.length})` : `Certs (${enrolledCerts.length})`}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {tab === 'topics' && (
            <div className="flex flex-wrap gap-2">
              {allChannelsConfig.map(ch => {
                const active = enrolledChannels.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    onClick={() => toggleChannel(ch.id)}
                    className={cn(
                      chipBase,
                      active
                        ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                        : 'bg-white/5 text-[#888] border border-[#2a2a2a] hover:text-white hover:bg-white/10'
                    )}
                  >
                    {active ? '✓ ' : ''}{ch.name}
                  </button>
                );
              })}
            </div>
          )}

          {tab === 'certs' && (
            <div className="flex flex-wrap gap-2">
              {certs.map(cert => {
                const active = enrolledCerts.includes(cert.id);
                return (
                  <button
                    key={cert.id}
                    onClick={() => toggleCert(cert.id)}
                    className={cn(
                      chipBase,
                      active
                        ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                        : 'bg-white/5 text-[#888] border border-[#2a2a2a] hover:text-white hover:bg-white/10'
                    )}
                  >
                    {active ? '✓ ' : ''}{cert.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-[#2a2a2a]">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
