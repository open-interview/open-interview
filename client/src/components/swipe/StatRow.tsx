import { useIsMobile } from '@/hooks/use-mobile';

interface StatRowProps {
  totalReviewed: number;
  mastered: number;
  feynmanAttempts: number;
  customCards: number;
  longestStreak: number;
}

export function StatRow({ totalReviewed, mastered, feynmanAttempts, customCards, longestStreak }: StatRowProps) {
  const isMobile = useIsMobile();

  const stats = [
    { label: 'Total reviewed', value: totalReviewed },
    { label: 'Mastered', value: mastered },
    { label: 'Feynman attempts', value: feynmanAttempts },
    { label: 'Custom cards', value: customCards },
    { label: 'Longest streak', value: `${longestStreak} days` },
  ];

  return (
    <div>
      <p className="text-sm text-gray-500 mb-3 tracking-wider">── Stats ────────</p>
      <div className={`grid gap-3 ${isMobile ? 'grid-cols-3' : 'grid-cols-5'}`}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-3 text-center"
          >
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
