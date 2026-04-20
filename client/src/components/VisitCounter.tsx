import { motion } from "framer-motion";
import { Eye } from "lucide-react";

interface VisitCounterProps {
  showLabel?: boolean;
  className?: string;
}

export function VisitCounter({ 
  showLabel = true,
  className = ""
}: VisitCounterProps) {
  // Using hits.sh badge as an image - bypasses CORS
  // The badge auto-increments on each unique view
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
      {showLabel && <span className="text-xs text-muted-foreground mr-1">visits</span>}
      <img 
        src="https://hits.sh/devprep-io.github.io.svg?style=flat&label=&color=6366f1&labelColor=transparent"
        alt="Visit count"
        className="h-5"
        loading="lazy"
      />
    </motion.div>
  );
}
