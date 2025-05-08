import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThinkContent } from '@/components/chat/ThinkContent';
import { Markdown } from './Markdown';
import { LoadingText } from './LoadingText';

interface AssistantMessageProps {
  message: {
    content: string;
    thinking?: string;
    sources?: any[];
  };
  isLoading: boolean;
  isLastMessage: boolean;
  isMobile: boolean;
  onViewSources: (sources: any[]) => void;
  setIsSourcesOpen: (isOpen: boolean) => void;
  // Current streaming information if this is the active message
  streamInfo?: {
    thinking: string;
    isThinking: boolean;
    isThinkingExpanded: boolean;
    setIsThinkingExpanded: (isExpanded: boolean) => void;
  };
}

export function AssistantMessage({
  message,
  isLoading,
  isLastMessage,
  isMobile,
  onViewSources,
  setIsSourcesOpen,
  streamInfo,
}: AssistantMessageProps) {
  const [processedContent, setProcessedContent] = useState(message.content);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);

  // Process source links when content or sources change
  useEffect(() => {
    if (message.content && message.sources?.length) {
      setProcessedContent(
        processResponseWithSourceLinks(message.content, message.sources),
      );
    } else {
      setProcessedContent(message.content);
    }
  }, [message.content, message.sources]);

  // Function to process source links
  const processResponseWithSourceLinks = (
    text: string,
    sources: any[] = [],
  ) => {
    if (!text || !sources || sources.length === 0) return text;

    // Create a regex to find source references by index like [0], [1], etc.
    const sourceRegex = /\[(\d+)\]/g;

    // Replace each match with a linked version
    return text.replace(sourceRegex, (match, indexStr) => {
      const index = Number.parseInt(indexStr, 10);

      // Check if this index exists in our sources array
      if (index >= 0 && index < sources.length) {
        // Create a link to the source
        return `<a href="#source-${index}" class="source-link" data-source-index="${index}">[${index + 1}]</a>`;
      }
      return match;
    });
  };

  // Get thinking content - either from stored message or real-time stream
  const thinkingContent =
    streamInfo?.isThinking && isLastMessage && isLoading
      ? streamInfo.thinking
      : message.thinking;

  // Is there any thinking to show?
  const hasThinking = !!thinkingContent;

  // Handle thinking expand/collapse
  const toggleThinkingExpanded = () => {
    if (streamInfo?.isThinking && streamInfo.setIsThinkingExpanded) {
      streamInfo.setIsThinkingExpanded(!streamInfo.isThinkingExpanded);
    } else {
      setIsThinkingExpanded(!isThinkingExpanded);
    }
  };

  // Determine if thinking is expanded
  const thinkingExpanded = streamInfo?.isThinking
    ? streamInfo.isThinkingExpanded
    : isThinkingExpanded;

  return (
    <div className="p-4 rounded-lg bg-card" data-message-role="assistant">
      {/* Thinking section - Shows either stored thinking or streaming thinking */}
      {hasThinking && (
        <div className="mb-4">
          <ThinkContent
            content={thinkingContent || ''}
            isExpanded={thinkingExpanded}
            onToggleExpand={toggleThinkingExpanded}
          />
        </div>
      )}

      {/* Content section - Shows loading indicator or content */}
      {message.content === '' && isLoading && isLastMessage ? (
        <div className="flex items-center text-muted-foreground">
          <LoadingText />
        </div>
      ) : (
        <Markdown
          content={processedContent}
          isMobile={isMobile}
          processResponseWithSourceLinks={(text) => text} // Already processed
          setIsSourcesOpen={() => {
            if (message.sources?.length) {
              onViewSources(message.sources);
            }
          }}
        />
      )}

      {/* Show sources button */}
      {message.sources && message.sources.length > 0 && (
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full shadow-sm flex items-center gap-2"
            onClick={() => {
              onViewSources(message.sources || []);
              setIsSourcesOpen(true);
            }}
          >
            <BookOpen className="h-3 w-3" />
            <span>View Sources</span>
          </Button>
        </div>
      )}
    </div>
  );
}
