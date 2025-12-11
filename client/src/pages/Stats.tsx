import { useState } from "react";
import { useLocation } from "wouter";
import { useGlobalStats } from "../hooks/use-progress";
import { channels, getQuestions, getStatsByChannel, getAllQuestions, getQuestionDifficulty } from "../lib/data";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ArrowLeft, Trophy, Target, Flame, BookOpen, Calendar } from "lucide-react";
import { motion } from "framer-motion";

// Generate activity data for a given number of days
function generateActivityData(stats: { date: string; count: number }[], days: number) {
  const data: { date: string; count: number; dayOfWeek: number; week: number }[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const activity = stats.find(s => s.date === dateStr);
    
    data.push({
      date: dateStr,
      count: activity?.count || 0,
      dayOfWeek: date.getDay(),
      week: Math.floor((days - 1 - i) / 7),
    });
  }
  
  return data;
}

// Get month labels for the heatmap
function getMonthLabels(days: number) {
  const labels: { month: string; week: number }[] = [];
  const today = new Date();
  let lastMonth = -1;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const month = date.getMonth();
    const week = Math.floor((days - 1 - i) / 7);
    
    if (month !== lastMonth) {
      labels.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        week,
      });
      lastMonth = month;
    }
  }
  
  return labels;
}

export default function Stats() {
  const [_, setLocation] = useLocation();
  const { stats } = useGlobalStats();
  const [timeRange, setTimeRange] = useState<'30' | '90' | '365'>('365');

  const days = parseInt(timeRange);
  const activityData = generateActivityData(stats, days);
  const monthLabels = getMonthLabels(days);
  const weeks = Math.ceil(days / 7);

  // Get all progress data across channels
  const allProgress = channels.map(channel => {
    const stored = localStorage.getItem(`progress-${channel.id}`);
    const completed = stored ? JSON.parse(stored) : [];
    const questions = getQuestions(channel.id);
    return {
      id: channel.id,
      name: channel.name,
      completed: completed.length,
      total: questions.length,
      percent: questions.length > 0 ? Math.round((completed.length / questions.length) * 100) : 0
    };
  });

  // Calculate totals
  const totalCompleted = allProgress.reduce((acc, c) => acc + c.completed, 0);
  const totalQuestions = getAllQuestions().length;
  const overallPercent = totalQuestions > 0 ? Math.round((totalCompleted / totalQuestions) * 100) : 0;

  // Get difficulty distribution
  const allQuestions = getAllQuestions();
  const difficultyData = [
    { name: 'Beginner', value: allQuestions.filter(q => getQuestionDifficulty(q) === 'beginner').length, color: '#22c55e' },
    { name: 'Intermediate', value: allQuestions.filter(q => getQuestionDifficulty(q) === 'intermediate').length, color: '#eab308' },
    { name: 'Advanced', value: allQuestions.filter(q => getQuestionDifficulty(q) === 'advanced').length, color: '#ef4444' },
  ];

  // Channel stats for bar chart
  const channelStats = getStatsByChannel();

  // Calculate streak
  const calculateStreak = () => {
    let streak = 0;
    const sortedStats = [...stats].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    for (let i = 0; i < sortedStats.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];
      
      if (sortedStats.find(s => s.date === expectedDateStr)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };
  
  const currentStreak = calculateStreak();
  const totalSessions = stats.reduce((acc, curr) => acc + curr.count, 0);

  // Activity in selected period
  const periodActivity = activityData.reduce((acc, d) => acc + d.count, 0);

  // Get activity level class
  const getActivityClass = (count: number) => {
    if (count === 0) return 'bg-muted/20';
    if (count === 1) return 'bg-primary/25';
    if (count <= 3) return 'bg-primary/50';
    if (count <= 5) return 'bg-primary/75';
    return 'bg-primary';
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-4 sm:p-8 font-mono overflow-x-hidden">
      <header className="mb-6 sm:mb-12 flex items-center justify-between border-b border-border pb-4 sm:pb-6">
        <button 
          onClick={() => setLocation('/')}
          className="flex items-center gap-2 hover:text-primary transition-colors text-xs uppercase tracking-widest font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-lg sm:text-2xl font-bold uppercase tracking-tighter">
          <span className="text-primary">&gt;</span> Statistics
        </h1>
      </header>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-border p-4 sm:p-6 bg-card"
        >
          <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground mb-2">
            <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-primary" /> Overall
          </div>
          <div className="text-2xl sm:text-4xl font-bold text-primary">{overallPercent}%</div>
          <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">{totalCompleted}/{totalQuestions} completed</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="border border-border p-4 sm:p-6 bg-card"
        >
          <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground mb-2">
            <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" /> Streak
          </div>
          <div className="text-2xl sm:text-4xl font-bold text-orange-500">{currentStreak}</div>
          <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">days active</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="border border-border p-4 sm:p-6 bg-card"
        >
          <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground mb-2">
            <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" /> Sessions
          </div>
          <div className="text-2xl sm:text-4xl font-bold text-blue-400">{totalSessions}</div>
          <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">total sessions</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border border-border p-4 sm:p-6 bg-card"
        >
          <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground mb-2">
            <Target className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" /> Modules
          </div>
          <div className="text-2xl sm:text-4xl font-bold text-green-400">{channels.length}</div>
          <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">available</div>
        </motion.div>
      </div>

      {/* GitHub-style Activity Heatmap */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="border border-border p-4 sm:p-6 bg-card mb-6 sm:mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Activity
            <span className="text-muted-foreground font-normal">({periodActivity} sessions in {timeRange} days)</span>
          </h2>
          
          {/* Time Range Switcher */}
          <div className="flex gap-1 bg-muted/30 p-1 rounded">
            {(['30', '90', '365'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-[10px] sm:text-xs uppercase tracking-widest transition-colors rounded ${
                  timeRange === range 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {range === '30' ? '30D' : range === '90' ? '90D' : '1Y'}
              </button>
            ))}
          </div>
        </div>

        {/* Month Labels */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-fit">
            <div className="flex mb-1 ml-8">
              {monthLabels.map((label, idx) => (
                <div 
                  key={idx} 
                  className="text-[9px] sm:text-[10px] text-muted-foreground"
                  style={{ 
                    position: 'relative',
                    left: `${label.week * (timeRange === '365' ? 11 : timeRange === '90' ? 14 : 18)}px`,
                    marginRight: idx < monthLabels.length - 1 ? '0' : '0'
                  }}
                >
                  {label.month}
                </div>
              ))}
            </div>

            {/* Heatmap Grid */}
            <div className="flex gap-[2px]">
              {/* Day labels */}
              <div className="flex flex-col gap-[2px] mr-1">
                <div className="h-[10px] sm:h-[12px]"></div>
                <div className="h-[10px] sm:h-[12px] text-[8px] sm:text-[9px] text-muted-foreground flex items-center">Mon</div>
                <div className="h-[10px] sm:h-[12px]"></div>
                <div className="h-[10px] sm:h-[12px] text-[8px] sm:text-[9px] text-muted-foreground flex items-center">Wed</div>
                <div className="h-[10px] sm:h-[12px]"></div>
                <div className="h-[10px] sm:h-[12px] text-[8px] sm:text-[9px] text-muted-foreground flex items-center">Fri</div>
                <div className="h-[10px] sm:h-[12px]"></div>
              </div>

              {/* Weeks */}
              {Array.from({ length: weeks }, (_, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-[2px]">
                  {Array.from({ length: 7 }, (_, dayIdx) => {
                    const dataIdx = weekIdx * 7 + dayIdx;
                    const dayData = activityData[dataIdx];
                    
                    if (!dayData) {
                      return <div key={dayIdx} className="w-[10px] h-[10px] sm:w-[12px] sm:h-[12px]" />;
                    }
                    
                    return (
                      <div
                        key={dayIdx}
                        className={`w-[10px] h-[10px] sm:w-[12px] sm:h-[12px] rounded-sm ${getActivityClass(dayData.count)} transition-colors hover:ring-1 hover:ring-primary cursor-pointer`}
                        title={`${dayData.date}: ${dayData.count} session${dayData.count !== 1 ? 's' : ''}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
          <div className="text-[9px] sm:text-[10px] text-muted-foreground">
            Learn something new every day!
          </div>
          <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-[2px]">
              <div className="w-[10px] h-[10px] sm:w-[12px] sm:h-[12px] rounded-sm bg-muted/20"></div>
              <div className="w-[10px] h-[10px] sm:w-[12px] sm:h-[12px] rounded-sm bg-primary/25"></div>
              <div className="w-[10px] h-[10px] sm:w-[12px] sm:h-[12px] rounded-sm bg-primary/50"></div>
              <div className="w-[10px] h-[10px] sm:w-[12px] sm:h-[12px] rounded-sm bg-primary/75"></div>
              <div className="w-[10px] h-[10px] sm:w-[12px] sm:h-[12px] rounded-sm bg-primary"></div>
            </div>
            <span>More</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Progress by Module */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="border border-border p-4 sm:p-6 bg-card"
        >
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest mb-4 sm:mb-6 text-primary flex items-center gap-2">
            <span className="w-2 h-2 bg-primary block"></span> Progress by Module
          </h2>
          <div className="space-y-3 sm:space-y-4">
            {allProgress.map((module, idx) => (
              <div key={module.id} className="space-y-1">
                <div className="flex justify-between text-[10px] sm:text-xs">
                  <span className="uppercase tracking-widest">{module.name}</span>
                  <span className="text-muted-foreground">{module.completed}/{module.total}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${module.percent}%` }}
                    transition={{ delay: 0.6 + idx * 0.1, duration: 0.5 }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Difficulty Distribution */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="border border-border p-4 sm:p-6 bg-card"
        >
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest mb-4 sm:mb-6 text-primary flex items-center gap-2">
            <span className="w-2 h-2 bg-primary block"></span> Difficulty Distribution
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 sm:w-40 sm:h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={difficultyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {difficultyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2 sm:space-y-3">
              {difficultyData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 sm:gap-3">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                  <div className="flex-1">
                    <div className="text-[10px] sm:text-xs uppercase tracking-widest">{item.name}</div>
                    <div className="text-sm sm:text-lg font-bold">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Questions by Channel Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="border border-border p-4 sm:p-6 bg-card"
      >
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-widest mb-4 sm:mb-6 text-primary flex items-center gap-2">
          <span className="w-2 h-2 bg-primary block"></span> Questions by Module
        </h2>
        <div className="h-[200px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={channelStats} layout="vertical">
              <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={10} />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="var(--color-muted-foreground)" 
                fontSize={10}
                width={80}
                tickFormatter={(value) => value.replace('.', '')}
              />
              <Tooltip 
                cursor={{fill: 'var(--color-muted)', opacity: 0.2}}
                contentStyle={{ 
                  backgroundColor: 'var(--color-popover)', 
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-foreground)',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="beginner" stackId="a" fill="#22c55e" name="Beginner" />
              <Bar dataKey="intermediate" stackId="a" fill="#eab308" name="Intermediate" />
              <Bar dataKey="advanced" stackId="a" fill="#ef4444" name="Advanced" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="mt-8 text-center text-muted-foreground text-[10px] sm:text-xs uppercase tracking-widest">
        Keep learning! Every question brings you closer to mastery.
      </div>
    </div>
  );
}
