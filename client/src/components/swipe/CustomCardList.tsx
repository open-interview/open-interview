import type { CustomCardData } from '@/types/swipe';
import { Pencil, Trash2, Upload, Download } from 'lucide-react';
import { useRef } from 'react';

interface CustomCardListProps {
  cards: CustomCardData[];
  onEdit: (card: CustomCardData) => void;
  onDelete: (cardId: string) => void;
  onExport: () => void;
  onImport: () => void;
}

export function CustomCardList({
  cards,
  onEdit,
  onDelete,
  onExport,
  onImport,
}: CustomCardListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDelete = (cardId: string) => {
    if (window.confirm('Delete this custom card?')) {
      onDelete(cardId);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport();
      e.target.value = '';
    }
  };

  const truncated = (text: string, max = 60) =>
    text.length > max ? text.slice(0, max) + '…' : text;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground tracking-wider">
          —— My Cards ————————
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center"
            aria-label="Import cards"
          >
            <Upload className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={onExport}
            className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center"
            aria-label="Export cards"
          >
            <Download className="h-4 w-4 text-muted-foreground" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* List */}
      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No custom cards yet. Tap + in the study view to create one.
        </p>
      ) : (
        <div className="space-y-2">
          {cards.map((card) => (
            <div
              key={card.id}
              className="bg-[#141414] border border-[#2a2a2a] rounded-lg p-3 flex justify-between items-center mb-2"
            >
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-sm text-foreground truncate">
                  {truncated(card.front)}
                </p>
                <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded bg-purple-600/20 text-purple-400">
                  {card.channel}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onEdit(card)}
                  className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center"
                  aria-label="Edit card"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(card.id)}
                  className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center"
                  aria-label="Delete card"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
