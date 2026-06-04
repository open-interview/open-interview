import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

interface InteractiveFeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  shadow: string;
  delay?: number;
}

export function InteractiveFeatureCard({
  icon,
  title,
  description,
  gradient,
  shadow,
  delay = 0,
}: InteractiveFeatureCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current?.style.setProperty("--mouse-x", `${x}%`);
    cardRef.current?.style.setProperty("--mouse-y", `${y}%`);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.5,
        delay: delay * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative overflow-hidden rounded-xl border p-5 transition-all duration-300 ease-out cursor-default",
        "bg-[#0f1629] border-white/[0.06]",
        isHovered && "-translate-y-1 border-white/[0.12] shadow-xl",
        isHovered && shadow,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(124,58,237,0.08), transparent 40%)`,
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "conic-gradient(from 0deg, transparent, rgba(124,58,237,0.15), transparent, rgba(6,182,212,0.10), transparent)",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          padding: "1px",
        }}
      />

      <div className="relative z-10 flex flex-col gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg transition-transform duration-300 ease-out",
            gradient,
            shadow,
            isHovered && "scale-110",
          )}
        >
          {icon}
        </div>

        <h3 className="text-sm font-semibold text-white leading-snug">
          {title}
        </h3>

        <p className="text-xs text-white/60 leading-relaxed">{description}</p>

        <div className="pt-1 space-y-2">
          <div className="h-0.5 rounded-full overflow-hidden bg-white/[0.04]">
            <div
              className={cn(
                "h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out",
                gradient,
                isHovered ? "w-full" : "w-0",
              )}
            />
          </div>

          <div className="flex justify-end overflow-hidden">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium transition-all duration-300 ease-out",
                isHovered
                  ? "translate-x-0 opacity-100 text-violet-400"
                  : "translate-x-4 opacity-0",
              )}
            >
              Learn more <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
