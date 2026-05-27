import { useLocation } from "wouter";
import { Home, User, Code2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCredits } from "@/context/CreditsContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetClose,
} from "@/components/ui/sheet";

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navItems = [
  { icon: Home, label: "Home", path: "/study" },
  { icon: User, label: "Profile", path: "/profile" },
] as const;

export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  const [location, setLocation] = useLocation();
  const { balance, formatCredits } = useCredits();

  const handleNavClick = (path: string) => {
    setLocation(path);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[280px] sm:max-w-[280px] p-0 flex flex-col bg-background/95 backdrop-blur-xl"
      >
        <SheetHeader className="p-4 border-b border-border/50">
          <SheetClose asChild>
            <button
              onClick={() => handleNavClick("/study")}
              className="flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Code2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">App</span>
            </button>
          </SheetClose>
        </SheetHeader>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(({ icon: Icon, label, path }) => {
            const active = location === path;
            return (
              <SheetClose asChild key={path}>
                <button
                  onClick={() => handleNavClick(path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-xl transition-all",
                    active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn("w-5 h-5", active && "scale-110")}
                  />
                  <span>{label}</span>
                </button>
              </SheetClose>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Guest</p>
              <p className="text-xs text-amber-500 flex items-center gap-1">
                <Zap className="w-3 h-3 fill-amber-500" />
                {formatCredits(balance)}
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
