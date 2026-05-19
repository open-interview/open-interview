import { Layout, Card, Button } from '../ui';
import { useRoute } from 'wouter';
import { allChannelsConfig } from '../lib/channels-config';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useLocation } from 'wouter';

const emojiMap: Record<string, string> = {
  boxes: '📦', 'chart-line': '📊', 'git-branch': '🌿', binary: '⚡', puzzle: '🧩',
  'git-merge': '🔀', calculator: '🧮', cpu: '💻', terminal: '💻', layout: '🎨',
  server: '🖥️', database: '🗄️', infinity: '♾️', activity: '📈', box: '📦',
  cloud: '☁️', layers: '🥞', workflow: '⚙️', brain: '🧠', sparkles: '✨',
  'message-circle': '💬', eye: '👁️', 'file-text': '📄', code: '📝', shield: '🛡️',
  network: '🌐', monitor: '🖥️', smartphone: '📱', 'check-circle': '✅', users: '👥',
  award: '🏆', lock: '🔒', zap: '⚡', 'book-open': '📖', gauge: '⏱️'
};

export default function ChannelDetail() {
  const [match, params] = useRoute('/channel/:id');
  const [, setLocation] = useLocation();

  if (!match || !params?.id) {
    return (
      <Layout title="Channel" showBack>
        <div className="py-8 text-center text-muted-foreground">Channel not found</div>
      </Layout>
    );
  }

  const channel = allChannelsConfig.find((c) => c.id === params.id);

  if (!channel) {
    return (
      <Layout title="Channel" showBack>
        <div className="py-8 text-center text-muted-foreground">Channel not found</div>
      </Layout>
    );
  }

  return (
    <Layout title={channel.name} showBack>
      <div className="py-4">
        <Card className="p-6 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl">{emojiMap[channel.icon] || '📚'}</span>
            <div>
              <h1 className="text-xl font-bold">{channel.name}</h1>
              <p className="text-sm text-muted-foreground capitalize">{channel.category}</p>
            </div>
          </div>
          <p className="text-muted-foreground">{channel.description}</p>
        </Card>

        <div className="text-center py-8">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Questions coming soon</p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => setLocation('/channels')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Channels
          </Button>
        </div>
      </div>
    </Layout>
  );
}
