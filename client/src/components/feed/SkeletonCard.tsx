import { Hash } from 'lucide-react';

const shimmerKeyframes = `
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
`;

const shimmerBg = {
  background: 'linear-gradient(90deg, #1d1f23 25%, #2f3336 50%, #1d1f23 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s ease-in-out infinite',
};

export function SkeletonCard() {
  return (
    <div className="w-full border-b border-[var(--tw-border)] px-4 py-3">
      <style>{shimmerKeyframes}</style>
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-[34px] h-[34px] rounded-full shrink-0"
          style={shimmerBg}
        />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-3 w-24 rounded" style={shimmerBg} />
          <div className="h-3 w-36 rounded" style={shimmerBg} />
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-[28px] w-3/4 rounded" style={shimmerBg} />
        <div className="h-[28px] w-1/2 rounded" style={shimmerBg} />
      </div>
      <div className="h-[120px] rounded-xl mb-3" style={shimmerBg} />
      <div className="space-y-2 mb-3">
        <div className="h-4 w-full rounded" style={shimmerBg} />
        <div className="h-4 w-5/6 rounded" style={shimmerBg} />
        <div className="h-4 w-2/3 rounded" style={shimmerBg} />
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-16 rounded-full" style={shimmerBg} />
        <div className="h-9 w-16 rounded-full" style={shimmerBg} />
        <div className="h-9 w-16 rounded-full" style={shimmerBg} />
        <div className="h-9 w-16 rounded-full" style={shimmerBg} />
      </div>
    </div>
  );
}
