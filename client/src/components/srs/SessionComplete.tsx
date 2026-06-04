import { CheckCircle } from "lucide-react";

interface SessionCompleteProps {
  onHome: () => void;
}

export function SessionComplete({ onHome }: SessionCompleteProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-2">Review Complete!</h2>
        <p className="text-muted-foreground mb-6">You&apos;ve reviewed all cards for today</p>
        <button
          onClick={onHome}
          className="min-h-[44px] px-8 py-4 bg-gradient-to-r from-primary to-cyan-500 rounded-[16px] font-bold text-black cursor-pointer"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
