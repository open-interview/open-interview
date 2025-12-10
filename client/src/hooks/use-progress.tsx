import { useState, useEffect } from "react";

interface ProgressEntry {
  questionId: string;
  timestamp: number;
}

export function useProgress(channelId: string) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [history, setHistory] = useState<ProgressEntry[]>([]);

  const [lastVisitedIndex, setLastVisitedIndex] = useState(0);

  useEffect(() => {
    // Load simple completed list
    const savedCompleted = localStorage.getItem(`progress-${channelId}`);
    if (savedCompleted) {
      setCompleted(JSON.parse(savedCompleted));
    }

    // Load detailed history
    const savedHistory = localStorage.getItem(`history-${channelId}`);
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    // Load last visited index
    const savedIndex = localStorage.getItem(`last-index-${channelId}`);
    if (savedIndex) {
        setLastVisitedIndex(parseInt(savedIndex));
    }
  }, [channelId]);

  const saveLastVisitedIndex = (index: number) => {
      localStorage.setItem(`last-index-${channelId}`, index.toString());
      setLastVisitedIndex(index);
  }

  const markCompleted = (questionId: string) => {
    setCompleted((prev) => {
      if (prev.includes(questionId)) return prev;
      const next = [...prev, questionId];
      localStorage.setItem(`progress-${channelId}`, JSON.stringify(next));
      return next;
    });

    setHistory((prev) => {
      // Avoid duplicate history entries for same day/session if needed
      // For now, simple append
      const next = [...prev, { questionId, timestamp: Date.now() }];
      localStorage.setItem(`history-${channelId}`, JSON.stringify(next));
      return next;
    });
  };

  return { completed, history, markCompleted, lastVisitedIndex, saveLastVisitedIndex };
}

export function useGlobalStats() {
  const [stats, setStats] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    // Aggregate stats across all channels
    // This is a naive implementation scanning local storage
    const allHistory: ProgressEntry[] = [];
    
    // Scan standard channels
    ['system-design', 'algorithms', 'frontend', 'database'].forEach(cid => {
      const saved = localStorage.getItem(`history-${cid}`);
      if (saved) {
        allHistory.push(...JSON.parse(saved));
      }
    });

    // Group by date
    const grouped = allHistory.reduce((acc, curr) => {
      const date = new Date(curr.timestamp).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(grouped).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setStats(chartData);
  }, []);

  return { stats };
}
