import { memo, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart, Bookmark, MessageCircle, Code2 } from 'lucide-react';
import { useHaptic } from '@/hooks/use-haptic';

interface EngagementBarProps {
  questionId: string;
  tags: string[];
}

function getLikedIds(): string[] {
  try { return JSON.parse(localStorage.getItem('oi-liked-questions') || '[]'); } catch { return []; }
}
function setLikedIds(ids: string[]) { localStorage.setItem('oi-liked-questions', JSON.stringify(ids)); }

function getBookmarkedIds(): string[] {
  try { return JSON.parse(localStorage.getItem('oi-bookmarked-questions') || '[]'); } catch { return []; }
}
function setBookmarkedIds(ids: string[]) { localStorage.setItem('oi-bookmarked-questions', JSON.stringify(ids)); }

export const EngagementBar = memo(function EngagementBar({ questionId, tags }: EngagementBarProps) {
  const [liked, setLiked] = useState(() => getLikedIds().includes(questionId));
  const [bookmarked, setBookmarked] = useState(() => getBookmarkedIds().includes(questionId));
  const [animating, setAnimating] = useState(false);
  const haptic = useHaptic();

  useEffect(() => {
    setLiked(getLikedIds().includes(questionId));
    setBookmarked(getBookmarkedIds().includes(questionId));
  }, [questionId]);

  const handleLike = useCallback(() => {
    const ids = getLikedIds();
    if (!liked) {
      ids.push(questionId);
      setLikedIds(ids);
      setLiked(true);
      setAnimating(true);
      haptic.medium();
    } else {
      setLikedIds(ids.filter(id => id !== questionId));
      setLiked(false);
    }
  }, [liked, questionId]);

  const handleBookmark = useCallback(() => {
    const ids = getBookmarkedIds();
    if (bookmarked) {
      setBookmarkedIds(ids.filter(id => id !== questionId));
      setBookmarked(false);
    } else {
      ids.push(questionId);
      setBookmarkedIds(ids);
      setBookmarked(true);
      haptic.light();
    }
  }, [bookmarked, questionId]);

  return (
    <div className="flex items-center justify-between mt-2 -mx-2">
      {/* Like — 48x48 hitbox */}
      <button
        onClick={handleLike}
        className="group flex items-center gap-1.5"
        style={{ minWidth: 48, minHeight: 48 }}
      >
        <div className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${liked ? 'text-pink-500 bg-pink-500/10' : 'text-[#71767b] group-hover:text-pink-500 group-hover:bg-pink-500/10'}`}>
          <motion.div
            whileTap={{ scale: 0.75 }}
            animate={animating ? { scale: [1, 0.75, 1.15, 1] } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            onAnimationComplete={() => setAnimating(false)}
          >
            <Heart
              className={`w-[18px] h-[18px] ${liked ? 'fill-pink-500' : ''}`}
              strokeWidth={1.5}
            />
          </motion.div>
        </div>
        <span className={`text-[13px] ${liked ? 'text-pink-500' : 'text-[#71767b]'}`}>{liked ? 1 : 0}</span>
      </button>

      {/* Bookmark — 48x48 hitbox */}
      <button
        onClick={handleBookmark}
        className="group flex items-center gap-1.5"
        style={{ minWidth: 48, minHeight: 48 }}
      >
        <div className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${bookmarked ? 'text-cyan-500 bg-cyan-500/10' : 'text-[#71767b] group-hover:text-cyan-500 group-hover:bg-cyan-500/10'}`}>
          <motion.div whileTap={{ scale: 0.8 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
            <Bookmark className={`w-[18px] h-[18px] ${bookmarked ? 'fill-cyan-500' : ''}`} strokeWidth={1.5} />
          </motion.div>
        </div>
      </button>

      {/* Run Code — 48x48 hitbox */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="group flex items-center gap-1.5"
        style={{ minWidth: 48, minHeight: 48 }}
      >
        <div className="flex items-center justify-center w-9 h-9 rounded-full text-[#71767b] group-hover:text-emerald-500 group-hover:bg-emerald-500/10 transition-colors">
          <Code2 className="w-[18px] h-[18px]" strokeWidth={1.5} />
        </div>
      </motion.button>

      {/* Discuss — links to GitHub, 48x48 hitbox */}
      <a
        href={`https://github.com/open-interview/open-interview/issues/new?title=Discuss: ${encodeURIComponent(questionId)}&labels=discussion`}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-1.5"
        style={{ minWidth: 48, minHeight: 48 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center w-9 h-9 rounded-full text-[#71767b] group-hover:text-indigo-500 group-hover:bg-indigo-500/10 transition-colors">
          <MessageCircle className="w-[18px] h-[18px]" strokeWidth={1.5} />
        </div>
      </a>
    </div>
  );
});
