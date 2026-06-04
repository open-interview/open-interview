import { Brain } from "lucide-react";

interface EmptyDeckProps {
  onBrowse: () => void;
}

export function EmptyDeck({ onBrowse }: EmptyDeckProps) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center space-y-4 px-6">
        <Brain className="w-16 h-16 text-muted-foreground/30 mx-auto" />
        <h2 className="text-2xl font-bold">No cards due</h2>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Add questions to your SRS deck by tapping &ldquo;Add to SRS&rdquo; while reviewing questions.
        </p>
        <button
          onClick={onBrowse}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm cursor-pointer"
        >
          Browse Questions
        </button>
      </div>
    </div>
  );
}
