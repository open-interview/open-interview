import { Layout, Card } from '../ui';
import { Eye, CheckCircle, Flame } from 'lucide-react';

export default function Stats() {
  const stats = {
    viewed: parseInt(localStorage.getItem('stats-viewed') || '0'),
    completed: parseInt(localStorage.getItem('stats-completed') || '0'),
    streak: parseInt(localStorage.getItem('stats-streak') || '0'),
  };

  const statCards = [
    { icon: Eye, label: 'Questions Viewed', value: stats.viewed, color: 'text-blue-500' },
    { icon: CheckCircle, label: 'Completed', value: stats.completed, color: 'text-green-500' },
    { icon: Flame, label: 'Day Streak', value: stats.streak, color: 'text-orange-500' },
  ];

  return (
    <Layout title="Stats">
      <div className="py-4">
        <div className="grid gap-4">
          {statCards.map(({ icon: Icon, label, value, color }) => (
            <Card key={label} className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
