import { Layout, Card, Empty } from '../ui';
import { useLocation } from 'wouter';
import { Clock } from 'lucide-react';

export default function History() {
  const [, setLocation] = useLocation();
  const history = JSON.parse(localStorage.getItem('question-history') || '[]');
  const recent = history.slice(0, 5);

  return (
    <Layout title="History">
      <div className="py-4">
        {recent.length === 0 ? (
          <Empty
            title="No history yet"
            description="Questions you view will appear here"
            action={{
              label: 'Explore Channels',
              onClick: () => setLocation('/channels'),
            }}
          />
        ) : (
          <div className="space-y-3">
            {recent.map((item: any, index: number) => (
              <Card key={index} className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{item.title || 'Unknown Question'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
