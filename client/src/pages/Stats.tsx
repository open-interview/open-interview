import { useLocation } from "wouter";
import { useGlobalStats } from "../hooks/use-progress";
import { useTheme } from "../context/ThemeContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ArrowLeft } from "lucide-react";

export default function Stats() {
  const [_, setLocation] = useLocation();
  const { stats } = useGlobalStats();
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-8 font-mono">
      <header className="mb-12 flex items-center justify-between border-b border-border pb-6">
        <button 
          onClick={() => setLocation('/')}
          className="flex items-center gap-2 hover:text-primary transition-colors text-xs uppercase tracking-widest font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Terminal
        </button>
        <h1 className="text-2xl font-bold uppercase tracking-tighter">
          User_Statistics_Log
        </h1>
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Activity Chart */}
        <div className="border border-border p-6 bg-card flex flex-col">
          <h2 className="text-sm font-bold uppercase tracking-widest mb-6 text-primary flex items-center gap-2">
            <span className="w-2 h-2 bg-primary block"></span> Activity_Metrics
          </h2>
          
          <div className="flex-1 min-h-[300px]">
            {stats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats}>
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--color-muted-foreground)" 
                    fontSize={12} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="var(--color-muted-foreground)" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    cursor={{fill: 'var(--color-muted)', opacity: 0.2}}
                    contentStyle={{ 
                      backgroundColor: 'var(--color-popover)', 
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-foreground)'
                    }}
                  />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-xs uppercase">
                No data available. Start learning to generate logs.
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-rows-3 gap-4">
           <div className="border border-border p-6 bg-card flex items-center justify-between">
             <div className="text-xs uppercase tracking-widest text-muted-foreground">Total_Sessions</div>
             <div className="text-4xl font-bold text-primary">{stats.reduce((acc, curr) => acc + curr.count, 0)}</div>
           </div>
           
           <div className="border border-border p-6 bg-card flex items-center justify-between">
             <div className="text-xs uppercase tracking-widest text-muted-foreground">Current_Streak</div>
             <div className="text-4xl font-bold text-white">
                {stats.length > 0 ? '1' : '0'} <span className="text-base text-muted-foreground font-normal">DAYS</span>
             </div>
           </div>

           <div className="border border-border p-6 bg-card flex items-center justify-between">
             <div className="text-xs uppercase tracking-widest text-muted-foreground">System_Status</div>
             <div className="text-green-500 text-sm font-bold uppercase animate-pulse">
                OPTIMAL
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
