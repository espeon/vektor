import { useEffect, useState, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Model {
  id: string;
  object: string;
  owned_by: string;
}

interface ModelSelectorProps {
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
  className?: string;
  size?: 'default' | 'large';
}

export function ModelSelector({
  selectedModel,
  onModelSelect,
  className,
  size = 'default',
}: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch("http://ami:9292/v1/models");
        const data = await response.json();
        setModels(data.data || []);
      } catch (error) {
        console.error("Error fetching models:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedModelData = models.find((m) => m.id === selectedModel);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || models.length === 0}
        className={cn(
          "justify-between h-auto py-3 px-4 hover:bg-muted/20 rounded-full",
          size === 'large' ? 'min-w-[300px] max-w-[500px]' : 'min-w-[200px] max-w-[200px]'
        )}
      >
        <div className="flex flex-col items-start text-left">
          {isLoading ? (
            <span className="text-sm">Loading models...</span>
          ) : selectedModelData ? (
            <>
              <span className="font-medium text-sm">
                {selectedModelData.id}
              </span>
            </>
          ) : models.length > 0 ? (
            <span className="text-sm text-muted-foreground">
              Select a model
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              No models available
            </span>
          )}
        </div>
        <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
      </Button>

      {isOpen && models.length > 0 && (
        <div className="absolute top-full left-0 mt-2 w-full bg-background border rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onModelSelect(model.id);
                setIsOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-3 hover:bg-muted transition-colors flex flex-col items-start",
                selectedModel === model.id && "bg-muted",
              )}
            >
              <span className="font-medium text-sm">{model.id}</span>
              <span className="text-xs text-muted-foreground">
                {model.owned_by}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
