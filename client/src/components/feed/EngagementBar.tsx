import { memo, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart, Bookmark, MessageCircle, Share2 } from 'lucide-react';
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

function getLikeCount(id: string): number {
  try { return JSON.parse(localStorage.getItem(`oi-likes-${id}`) || '0'); } catch { return 0; }
}
function setLikeCount(id: string, n: number) { localStorage.setItem(`oi-likes-${id}`, JSON.stringify(n)); }

export const EngagementBar = memo(function EngagementBar({ questionId, tags }: EngagementBarProps) {
  const [liked, setLiked] = useState(() => getLikedIds().includes(questionId));
  const [likeCount, setLikeCountState] = useState(() => getLikeCount(questionId));
  const [bookmarked, setBookmarked] = useState(() => getBookmarkedIds().includes(questionId));
  const [animating, setAnimating] = useState(false);
  const haptic = useHaptic();

  useEffect(() => {
    setLiked(getLikedIds().includes(questionId));
    setBookmarked(getBookmarkedIds().includes(questionId));
    setLikeCountState(getLikeCount(questionId));
  }, [questionId]);

  const handleLike = useCallback(() => {
    const ids = getLikedIds();
    if (!liked) {
      ids.push(questionId);
      setLikedIds(ids);
      const newCount = likeCount + 1;
      setLikeCount(questionId, newCount);
      setLiked(true);
      setLikeCountState(newCount);
      setAnimating(true);
      haptic.medium();
    } else {
      setLikedIds(ids.filter(id => id !== questionId));
      const newCount = Math.max(0, likeCount - 1);
      setLikeCount(questionId, newCount);
      setLiked(false);
      setLikeCountState(newCount);
    }
  }, [liked, questionId, likeCount, haptic]);

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
  }, [bookmarked, questionId, haptic]);

  const handleShare = useCallback(() => {
    const text = `Interview question: ${window.location.href}`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  }, []);

  const ActionBtn = ({
    onClick, active, activeClass, Icon, label, count, animateScale,
  }: {
    onClick: () => void;
    active?: boolean;
    activeClass?: string;
    Icon: React.ElementType;
    label: string;
    count?: number;
    animateScale?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-xl transition-all ${
        active ? activeClass : 'text-[#71767b] hover:text-[#e7e9ea] hover:bg-[#1d1f23]'
      }`}
    >
      <motion.div
        whileTap={{ scale: 0.75 }}
        animate={animateScale ? { scale: [1, 0.75, 1.25, 1] } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        onAnimationComplete={() => animateScale && setAnimating(false)}
      >
        <Icon className="w-[17px] h-[17px]" strokeWidth={1.5} />
      </motion.div>
      {(count !== undefined && count > 0) && (
        <span className="text-[12px] tabular-nums">{count}</span>
      )}
      <span className="text-[12px] hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="flex items-center gap-1 mt-3 pt-3 border-t border-[var(--tw-border)] -mx-1">
      <ActionBtn
        onClick={handleLike}
        active={liked}
        activeClass="text-pink-500 bg-pink-500/10"
        Icon={Heart}
        label="Like"
        count={likeCount}
        animateScale={animating}
      />
      <ActionBtn
        onClick={handleBookmark}
        active={bookmarked}
        activeClass="text-cyan-400 bg-cyan-500/10"
        Icon={Bookmark}
        label={bookmarked ? 'Saved' : 'Save'}
      />
      <a
        href={`https://github.com/open-interview/open-interview/issues/new?title=Discuss: ${encodeURIComponent(questionId)}&labels=discussion`}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-[#71767b] hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <MessageCircle className="w-[17px] h-[17px]" strokeWidth={1.5} />
        <span className="text-[12px] hidden sm:inline">Discuss</span>
      </a>
      <button
        onClick={handleShare}
        className="group flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-[#71767b] hover:text-[#e7e9ea] hover:bg-[#1d1f23] transition-all ml-auto"
      >
        <Share2 className="w-[17px] h-[17px]" strokeWidth={1.5} />
        <span className="text-[12px] hidden sm:inline">Share</span>
      </button>
    </div>
  );
});
