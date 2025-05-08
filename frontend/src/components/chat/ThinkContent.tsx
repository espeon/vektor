import { Card } from "@/components/ui/card";
import { Brain, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface ThinkContentProps {
  content: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function ThinkContent({
  content,
  isExpanded = true,
  onToggleExpand,
}: ThinkContentProps) {
  const [timeStart, setTimeStart] = useState(new Date().getTime());
  const [timeEnd, setTimeEnd] = useState(0);

  // if we dont see a word in <500ms assume we're done, and set timeEnd
  useEffect(() => {
    const timeout = setTimeout(() => {
      setTimeEnd(new Date().getTime());
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Card className="p-2 bg-accent/50 border-border relative">
      <div className="flex items-start gap-2">
        <Brain className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">
              {timeEnd
                ? `Thought for ${((timeEnd - timeStart) / 1000).toFixed(2)}s`
                : "Analyzing information..."}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 rounded-full"
              onClick={onToggleExpand}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <span className="sr-only">
                {isExpanded ? "Collapse" : "Expand"}
              </span>
            </Button>
          </div>
          <div
            className={cn(
              "text-sm text-muted-foreground whitespace-pre-wrap transition-all duration-300 ease-in-out overflow-hidden",
              isExpanded
                ? "max-h-max opacity-100 mt-1"
                : "max-h-[0rem] opacity-70",
            )}
          >
            {content || "Analyzing information..."}
          </div>
        </div>
      </div>
    </Card>
  );
}
