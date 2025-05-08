import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

interface SourceProps {
  source: {
    uri?: string;
    text: string;
  };
  index: number;
}

export function SourceItem({ source, index }: SourceProps) {
  // Extract domain from URI for display
  const getDomain = (uri: string) => {
    try {
      if (uri.startsWith("at://")) {
        return "bsky.app";
      }
      const url = new URL(uri);
      return url.hostname.replace("www.", "");
    } catch {
      return "source";
    }
  };

  if (!source.uri)
    return (
      <Card>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 font-medium text-sm text-primary w-5 text-center">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground line-clamp-2">
              {source.text}
            </p>
            <div className="mt-1 flex items-center text-xs text-muted-foreground">
              <span>Domain not found?</span>
            </div>
          </div>
        </div>
      </Card>
    );

  return (
    <Card
      id={`source-${index}`}
      className="p-3 hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 font-medium text-sm text-primary w-5 text-center">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground line-clamp-2">{source.text}</p>
          <div className="mt-1 flex items-center text-xs text-muted-foreground">
            <span>{getDomain(source.uri)}</span>
          </div>
        </div>
        <a
          href={
            source.uri.startsWith("at://")
              ? source.uri
                  .replace("at://", "https://bsky.app/profile/")
                  .replace("app.bsky.feed.post", "post")
              : source.uri
          }
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </Card>
  );
}
