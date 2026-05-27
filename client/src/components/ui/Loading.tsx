import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
  fullPage?: boolean;
}

const sizeConfig = {
  sm: { icon: "h-4 w-4", text: "text-xs" },
  md: { icon: "h-8 w-8", text: "text-sm" },
  lg: { icon: "h-12 w-12", text: "text-base" },
};

function LoadingComponent({
  size = "md",
  text,
  className,
  fullPage,
}: LoadingProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        fullPage && "min-h-[calc(100vh-3rem)]",
        className,
      )}
      role="status"
      aria-label={text ?? "Loading"}
    >
      <Loader2
        className={cn("animate-spin gradient-text", config.icon)}
      />
      {text && (
        <p className={cn("text-muted-foreground", config.text)}>
          {text}
        </p>
      )}
      <span className="sr-only">{text ?? "Loading"}</span>
    </div>
  );
}

export const Loading = React.memo(LoadingComponent);
