import { AnimatePresence, motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { AnswerContent } from "./AnswerContent";

interface ReviewCardData {
  id: string;
  question: string;
  answer?: string | null;
  tldr?: string | null;
  codeInterpretation?: string | null;
  diagram?: string | null;
  explanation?: string | null;
  channel: string;
  difficulty: string;
}

interface QuestionCardProps {
  card: ReviewCardData;
  showAnswer: boolean;
  onDelete: () => void;
  getChannelColor: (channel: string) => string;
}

export function QuestionCard({ card, showAnswer, onDelete, getChannelColor }: QuestionCardProps) {
  const difficultyColor =
    card.difficulty === "beginner"
      ? "bg-green-500/20 text-green-500"
      : card.difficulty === "intermediate"
        ? "bg-yellow-500/20 text-yellow-500"
        : "bg-red-500/20 text-red-500";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={card.id}
        initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        exit={{ opacity: 0, scale: 0.9, rotateY: 10 }}
        transition={{ duration: 0.3 }}
        className="relative w-full overflow-hidden"
      >
        <div
          className="p-8 rounded-[28px] border min-h-[400px] flex flex-col w-full overflow-hidden"
          style={{
            background: "color-mix(in srgb, var(--color-surface-2, #1e293b) 60%, transparent)",
            borderColor: "var(--color-border-subtle, rgba(148,163,184,0.15))",
            boxShadow:
              "8px 8px 24px rgba(0,0,0,0.3), -4px -4px 16px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-[#00ff88]/20 text-primary rounded-full text-xs font-bold uppercase">
                {card.channel}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${difficultyColor}`}>
                {card.difficulty}
              </span>
            </div>
            <button
              onClick={onDelete}
              title="Remove from SRS"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <h2 className="text-lg font-semibold text-center leading-relaxed">{card.question}</h2>
          </div>

          <AnswerContent
            showAnswer={showAnswer}
            tldr={card.tldr}
            answer={card.answer}
            codeInterpretation={card.codeInterpretation}
            diagram={card.diagram}
            explanation={card.explanation}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
