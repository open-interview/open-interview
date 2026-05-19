import { Layout, Button } from '../ui';
import { useLocation } from 'wouter';
import { Mic, ArrowRight } from 'lucide-react';

export default function Practice() {
  const [, setLocation] = useLocation();

  return (
    <Layout title="Practice">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Mic className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Voice Interview Practice</h2>
        <p className="text-muted-foreground mb-8 max-w-xs">
          Voice interview practice coming soon. Practice answering technical questions out loud.
        </p>
        <Button onClick={() => setLocation('/channels')}>
          Browse Channels <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </Layout>
  );
}
