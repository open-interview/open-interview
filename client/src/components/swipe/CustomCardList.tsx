import type { CustomCardData } from '@/types/swipe';
import { Pencil, Trash2, Upload, Download, FileEdit } from 'lucide-react';
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

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

  const listRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: cards.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 72,
    overscan: 5,
  });

  const truncated = (text: string, max = 60) =>
    text.length > max ? text.slice(0, max) + '\u2026' : text;

  return (
    <div className="glass-card rounded-xl border border-border/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {cards.length} {cards.length === 1 ? 'card' : 'cards'}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 w-8 rounded-lg hover:bg-accent/30 flex items-center justify-center transition-colors"
            aria-label="Import cards"
          >
            <Upload className="h-4 w-4 text-muted-foreground" aria-hidden={true} />
          </button>
          <button
            type="button"
            onClick={onExport}
            className="h-8 w-8 rounded-lg hover:bg-accent/30 flex items-center justify-center transition-colors"
            aria-label="Export cards"
          >
            <Download className="h-4 w-4 text-muted-foreground" aria-hidden={true} />
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

      {cards.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 flex items-center justify-center">
            <FileEdit className="w-5 h-5 text-violet-400/50" aria-hidden={true} />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            No custom cards yet. Tap + in the study view to create one.
          </p>
        </div>
      ) : (
        <div ref={listRef} className="max-h-[60vh] overflow-auto">
          <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const card = cards[virtualItem.index];
              return (
                <div
                  key={card.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div className="h-[68px] mx-1 rounded-lg border border-border/20 bg-accent/10 hover:bg-accent/20 transition-colors p-3 flex justify-between items-center">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm text-foreground truncate">
                        {truncated(card.front)}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded bg-gradient-to-r from-violet-500/20 to-indigo-500/20 text-violet-300">
                        {card.channel}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onEdit(card)}
                        className="h-8 w-8 rounded-lg hover:bg-accent/30 flex items-center justify-center transition-colors"
                        aria-label="Edit card"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" aria-hidden={true} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(card.id)}
                        className="h-8 w-8 rounded-lg hover:bg-accent/30 flex items-center justify-center transition-colors"
                        aria-label="Delete card"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" aria-hidden={true} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
