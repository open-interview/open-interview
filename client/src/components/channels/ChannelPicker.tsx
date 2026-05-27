import { useState, useEffect } from 'react';
import { getEnrolledChannels, getEnrolledCerts } from '@/lib/enrollment-service';
import { allChannelsConfig } from '@/lib/channels-config';

interface ChannelPickerProps {
  onClose: () => void;
}

export default function ChannelPicker({ onClose }: ChannelPickerProps) {
  const [enrolledChannels, setEnrolledChannels] = useState<string[]>([]);
  const [enrolledCerts, setEnrolledCerts] = useState<string[]>([]);

  useEffect(() => {
    setEnrolledChannels(getEnrolledChannels());
    setEnrolledCerts(getEnrolledCerts());
  }, []);

  const channelNames = enrolledChannels
    .map(id => allChannelsConfig.find(c => c.id === id)?.name || id)
    .sort();

  return (
    <div className="p-4 rounded-2xl space-y-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">My Topics</h3>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/15 transition-colors cursor-pointer"
        >
          Done
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Channels ({enrolledChannels.length})
          </p>
          {channelNames.length === 0 ? (
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>No channels enrolled yet</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {channelNames.map(name => (
                <span
                  key={name}
                  className="px-2 py-0.5 rounded-md text-xs"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
                >
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Certifications ({enrolledCerts.length})
          </p>
          {enrolledCerts.length === 0 ? (
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>No certifications enrolled yet</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {enrolledCerts.map(id => (
                <span
                  key={id}
                  className="px-2 py-0.5 rounded-md text-xs"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
                >
                  {id}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
