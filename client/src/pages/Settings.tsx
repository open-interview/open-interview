import { Layout, Button, Card } from '../ui';
import { Moon, Trash2 } from 'lucide-react';

export default function Settings() {
  const clearData = () => {
    const keysToKeep = ['theme'];
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    window.location.reload();
  };

  return (
    <Layout title="Settings">
      <div className="py-4 space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5" />
              <span>Dark Mode</span>
            </div>
            <span className="text-sm text-muted-foreground">System controlled</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-500" />
              <span>Clear All Data</span>
            </div>
            <Button variant="danger" size="sm" onClick={clearData}>
              Clear
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            This will remove all saved progress, bookmarks, and history.
          </p>
        </Card>
      </div>
    </Layout>
  );
}
