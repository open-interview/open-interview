/**
 * Hook for fetching channel metadata from API/static files
 * This is the client-side source of truth for channel data
 */
import { useState, useEffect } from 'react';
import { fetchChannelsMeta, fetchSubchannelsMeta, type ChannelMeta, type SubchannelMeta } from '../lib/api-client';

// Cache for channel metadata
let channelsMetaCache: ChannelMeta[] | null = null;
const subchannelsCache = new Map<string, SubchannelMeta[]>();

export function useChannelsMeta() {
  const [channels, setChannels] = useState<ChannelMeta[]>(channelsMetaCache || []);
  const [isLoading, setIsLoading] = useState(!channelsMetaCache);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (channelsMetaCache) {
      setChannels(channelsMetaCache);
      setIsLoading(false);
      return;
    }

    fetchChannelsMeta()
      .then(data => {
        channelsMetaCache = data;
        setChannels(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err);
        setIsLoading(false);
      });
  }, []);

  return { channels, isLoading, error };
}

export function useChannelMeta(channelId: string) {
  const { channels, isLoading, error } = useChannelsMeta();
  const channel = channels.find(c => c.id === channelId) || null;
  return { channel, isLoading, error };
}

export function useSubchannelsMeta(channelId: string) {
  const [subchannels, setSubchannels] = useState<SubchannelMeta[]>(
    subchannelsCache.get(channelId) || []
  );
  const [isLoading, setIsLoading] = useState(!subchannelsCache.has(channelId));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!channelId) return;

    if (subchannelsCache.has(channelId)) {
      setSubchannels(subchannelsCache.get(channelId)!);
      setIsLoading(false);
      return;
    }

    fetchSubchannelsMeta(channelId)
      .then(data => {
        subchannelsCache.set(channelId, data);
        setSubchannels(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err);
        setIsLoading(false);
      });
  }, [channelId]);

  return { subchannels, isLoading, error };
}

// Helper to get channel by ID from cache (sync)
export function getChannelMetaSync(channelId: string): ChannelMeta | null {
  return channelsMetaCache?.find(c => c.id === channelId) || null;
}

// Helper to get all channels from cache (sync)
export function getAllChannelsMetaSync(): ChannelMeta[] {
  return channelsMetaCache || [];
}

// Categories for grouping (static - these don't change often)
export const categories = [
  { id: 'engineering', name: 'Engineering', icon: 'code' },
  { id: 'cloud', name: 'Cloud & DevOps', icon: 'cloud' },
  { id: 'data', name: 'Data', icon: 'database' },
  { id: 'ai', name: 'AI & ML', icon: 'brain' },
  { id: 'testing', name: 'Testing & QA', icon: 'check-circle' },
  { id: 'security', name: 'Security', icon: 'shield' },
  { id: 'mobile', name: 'Mobile', icon: 'smartphone' },
  { id: 'management', name: 'Management', icon: 'users' }
];

// Get channels by category
export function getChannelsByCategory(category: string, channels: ChannelMeta[]): ChannelMeta[] {
  return channels.filter(c => c.category === category);
}

// Get recommended channels for a role
export function getRecommendedChannelsForRole(roleId: string, channels: ChannelMeta[]): ChannelMeta[] {
  return channels.filter(c => c.roles.includes(roleId) || c.roles.includes('all'));
}
