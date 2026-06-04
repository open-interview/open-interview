import { useState, useRef, useCallback, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  tiltAmount?: number;
  glowOnHover?: boolean;
  borderGlow?: boolean;
  as?: 'div' | 'button' | 'a';
  href?: string;
  onClick?: () => void;
}

export function SpotlightCard({
  children,
  className,
  spotlightColor = 'rgba(124, 58, 237, 0.15)',
  gradientFrom = 'from-violet-500/30',
  gradientTo = 'to-cyan-500/30',
  tiltAmount = 3,
  glowOnHover = true,
  borderGlow = true,
  as = 'div',
  href,
  onClick,
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 25 });
  const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 25 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      cardRef.current?.style.setProperty('--mouse-x', `${x}%`);
      cardRef.current?.style.setProperty('--mouse-y', `${y}%`);

      const centerX = (x / 100) * 2 - 1;
      const centerY = (y / 100) * 2 - 1;
      rotateX.set(-centerY * tiltAmount);
      rotateY.set(centerX * tiltAmount);
    },
    [tiltAmount, rotateX, rotateY]
  );

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    cardRef.current?.style.setProperty('--mouse-x', '50%');
    cardRef.current?.style.setProperty('--mouse-y', '50%');
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  const handleClick = () => {
    if (as === 'a' && href) {
      window.location.href = href;
    }
    onClick?.();
  };

  const cardBaseClasses = cn(
    'relative rounded-xl bg-[#0f1629] border border-white/[0.06] p-5 overflow-hidden',
    'transition-shadow duration-300 ease-out',
    glowOnHover && isHovered && 'shadow-[0_0_30px_-5px_rgba(124,58,237,0.3)]',
    isHovered && 'shadow-lg',
    className
  );

  const cardMotionStyle = {
    rotateX: springRotateX,
    rotateY: springRotateY,
    perspective: '800px',
    transformStyle: 'preserve-3d' as const,
  };

  const cardHover = {
    y: -4,
    transition: { type: 'spring' as const, stiffness: 300, damping: 20 },
  };

  const handlers = {
    onMouseMove: handleMouseMove,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };

  const innerContent = (
    <>
      {/* Grid pattern dot overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.6) 0.5px, transparent 0.5px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Spotlight gradient following cursor */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${spotlightColor}, transparent 40%)`,
        }}
      />

      {/* Gradient border on hover using mask technique */}
      {borderGlow && (
        <div
          className={cn(
            'pointer-events-none absolute inset-0 rounded-xl z-[2]',
            'bg-gradient-to-br',
            gradientFrom,
            gradientTo,
            'p-[1px]',
            'transition-opacity duration-400 ease-out',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
          style={{
            WebkitMask:
              'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
      )}

      {/* Shine sweep across content on hover */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 z-[3]',
          'transition-opacity duration-500 ease-out',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)',
        }}
      />

      {/* Content container */}
      <div className="relative z-[4]">{children}</div>
    </>
  );

  if (as === 'a') {
    return (
      <motion.a
        ref={cardRef as React.Ref<HTMLAnchorElement>}
        href={href}
        className={cardBaseClasses}
        style={cardMotionStyle}
        whileHover={cardHover}
        {...handlers}
        onClick={handleClick}
      >
        {innerContent}
      </motion.a>
    );
  }

  if (as === 'button') {
    return (
      <motion.button
        ref={cardRef as React.Ref<HTMLButtonElement>}
        type="button"
        className={cardBaseClasses}
        style={cardMotionStyle}
        whileHover={cardHover}
        {...handlers}
        onClick={handleClick}
      >
        {innerContent}
      </motion.button>
    );
  }

  return (
    <motion.div
      ref={cardRef}
      className={cardBaseClasses}
      style={cardMotionStyle}
      whileHover={cardHover}
      {...handlers}
    >
      {innerContent}
    </motion.div>
  );
}
