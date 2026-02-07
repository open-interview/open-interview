interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background-primary">
      <header className="bg-background-secondary border-b border-primary-900/20 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold gradient-text">
            Interview Buddy AI
          </h1>
          <nav className="flex items-center space-x-4">
            <button className="text-primary-300 hover:text-primary-200 transition-colors">
              Dashboard
            </button>
            <button className="text-primary-300 hover:text-primary-200 transition-colors">
              Profile
            </button>
            <button className="text-primary-300 hover:text-primary-200 transition-colors">
              Settings
            </button>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
