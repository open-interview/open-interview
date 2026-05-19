import { useState, useEffect } from 'react';
import { Layout, Card, Button } from '../ui';
import { useLocation } from 'wouter';
import { Compass, Brain, Trophy, ArrowRight } from 'lucide-react';

export default function Home() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);
  
  const features = [
    { icon: Compass, title: 'Explore', desc: '30+ channels', path: '/channels' },
    { icon: Brain, title: 'Practice', desc: 'Voice interview', path: '/voice-interview' },
    { icon: Trophy, title: 'Progress', desc: 'Track stats', path: '/stats' },
  ];

  if (loading) {
    return (
      <Layout title="Home">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-8 lg:py-12 text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">CodeReels</h1>
        <p className="text-muted-foreground mb-8">Level up your interview game</p>
        <div className="grid gap-4 max-w-md mx-auto">
          {features.map(({ icon: Icon, title, desc, path }) => (
            <Card key={path} onClick={() => setLocation(path)} className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Card>
          ))}
        </div>
        <Button size="lg" className="mt-8" onClick={() => setLocation('/channels')}>
          Start Learning
        </Button>
      </div>
    </Layout>
  );
}
