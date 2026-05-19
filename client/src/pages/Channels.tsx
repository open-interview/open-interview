import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Layout, Card, SearchBar } from '../ui';
import { allChannelsConfig } from '../lib/channels-config';
import { ChevronRight } from 'lucide-react';

const emojiMap: Record<string, string> = { boxes: '📦', 'chart-line': '📊', 'git-branch': '🌿', binary: '⚡', puzzle: '🧩', 'git-merge': '🔀', calculator: '🧮', cpu: '💻', terminal: '💻', layout: '🎨', server: '🖥️', database: '🗄️', infinity: '♾️', activity: '📈', box: '📦', cloud: '☁️', layers: '🥞', workflow: '⚙️', brain: '🧠', sparkles: '✨', 'message-circle': '💬', eye: '👁️', 'file-text': '📄', code: '📝', shield: '🛡️', network: '🌐', monitor: '🖥️', smartphone: '📱', 'check-circle': '✅', users: '👥', award: '🏆', lock: '🔒', zap: '⚡', 'book-open': '📖', gauge: '⏱️' };

export default function Channels() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const channels = allChannelsConfig.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Layout title="Channels">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Channels">
      <div className="py-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search channels..." className="mb-4" />
        <div className="grid gap-3">
          {channels.map((channel) => (
            <Card key={channel.id} onClick={() => setLocation(`/channel/${channel.id}`)} className="p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{emojiMap[channel.icon] || '📚'}</span>
                <div className="flex-1">
                  <h3 className="font-medium">{channel.name}</h3>
                  <p className="text-sm text-muted-foreground">{channel.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Card>
          ))}
        </div>
        {channels.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">No channels found</p>
            <button onClick={() => setSearch('')} className="text-primary text-sm">
              Clear search
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
