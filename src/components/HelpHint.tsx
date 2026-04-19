import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HelpCircle } from "lucide-react";

interface HelpHintProps {
  title: string;
  content: string;
  side?: "top" | "bottom" | "left" | "right";
}

export function HelpHint({ title, content, side = "bottom" }: HelpHintProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center justify-center text-muted-foreground/50 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
          onClick={() => setOpen(!open)}
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={side}
        sideOffset={8}
        className="w-80 rounded-2xl p-4 shadow-xl border border-border/60"
      >
        <p className="text-sm font-semibold text-foreground mb-1.5">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{content}</p>
      </PopoverContent>
    </Popover>
  );
}