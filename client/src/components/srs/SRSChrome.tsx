import { Flame, Brain, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

interface SRSChromeProps {
  streak: number;
  reviewedCount: number;
  totalCards: number;
  progressPercent: string;
  channelList: { channel: string; count: number }[];
  selectedChannel: string | null;
  focusMyTopics: boolean;
  showFocusToggle: boolean;
  onBack: () => void;
  onChannelSelect: (channel: string | null) => void;
  onFocusToggle: () => void;
  getChannelColor: (channel: string) => string;
}

export function SRSChrome({
  streak,
  reviewedCount,
  totalCards,
  progressPercent,
  channelList,
  selectedChannel,
  focusMyTopics,
  showFocusToggle,
  onBack,
  onChannelSelect,
  onFocusToggle,
  getChannelColor,
}: SRSChromeProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 min-h-[44px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="font-bold text-sm">{streak}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm">{reviewedCount}/{totalCards}</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-bold">{progressPercent}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            className="h-full bg-gradient-to-r from-primary to-cyan-500 rounded-full"
          />
        </div>
      </div>

      {channelList.length > 0 && (
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            {selectedChannel ? "Reviewing:" : "Channels with cards due:"}
          </div>
          <div className="flex flex-wrap gap-2">
            {!selectedChannel && (
              <button
                onClick={() => onChannelSelect(null)}
                className="min-h-[44px] px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-primary to-cyan-500 text-black"
              >
                All ({totalCards})
              </button>
            )}
            {channelList.map(({ channel, count }) => (
              <button
                key={channel}
                onClick={() => onChannelSelect(channel)}
                className={`min-h-[44px] px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                  selectedChannel === channel
                    ? "bg-primary text-black border-primary"
                    : `bg-gradient-to-br ${getChannelColor(channel)} border-transparent hover:opacity-80`
                }`}
              >
                {channel} ({count})
              </button>
            ))}
            {selectedChannel && (
              <button
                onClick={() => onChannelSelect(null)}
                className="min-h-[44px] px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Show all
              </button>
            )}
          </div>
        </div>
      )}

      {showFocusToggle && (
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onFocusToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer transition duration-150 ease-out ${focusMyTopics ? "bg-primary" : "bg-muted"}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                focusMyTopics ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm font-medium">Focus on my topics</span>
        </div>
      )}
    </>
  );
}
