import { useEffect, useState, useRef } from 'react';
import { X, BookOpen } from 'lucide-react';
import { SourceItem } from '@/components/chat/SourceItem';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import ExpandableInput from '@/components/chat/TextArea';
import { AssistantMessage } from './AssistantMessage';
import type { Emoji } from './TextArea';
import ProgressiveBlur from '../ui/progressive-blur';

interface StreamChunk {
  type: string;
  data: any;
  id: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  thinking?: string;
  sources?: any[];
}

// Sample emojis - replace with actual emoji data from your application
const sampleEmojis: Emoji[] = [];

export function MultiTurnChatStream({
  initialQuery,
}: {
  initialQuery?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserInput, setCurrentUserInput] = useState(initialQuery || '');
  const [thinking, setThinking] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);
  const [sources, setSources] = useState<any[]>([]);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add click handler for source links
  useEffect(() => {
    const handleSourceLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('source-link')) {
        e.preventDefault();

        // Get the source index
        const sourceIndex = target.getAttribute('data-source-index');
        if (sourceIndex) {
          // Open sources panel on mobile
          if (isMobile) {
            setIsSourcesOpen(true);
          } else {
            // Make sure sources panel is open on desktop
            setIsSourcesOpen(true);
          }

          // Update current sources to display
          const messageElement = target.closest('[data-message-index]');
          if (messageElement) {
            const messageIndex = parseInt(
              messageElement.getAttribute('data-message-index') || '0',
              10,
            );
            const messageSources = messages[messageIndex]?.sources || [];
            setSources(messageSources);
          }

          // Scroll to the source
          setTimeout(() => {
            const sourceElement = document.getElementById(
              `source-${sourceIndex}`,
            );
            if (sourceElement) {
              sourceElement.scrollIntoView({ behavior: 'smooth' });
              sourceElement.classList.add('bg-primary/10');
              setTimeout(() => {
                sourceElement.classList.remove('bg-primary/10');
              }, 2000);
            }
          }, 100);
        }
      }
    };

    document.addEventListener('click', handleSourceLinkClick);

    return () => {
      document.removeEventListener('click', handleSourceLinkClick);
    };
  }, [isMobile, messages]);

  const handleSendMessage = async (input = currentUserInput) => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
    };

    // Add both user message and empty assistant message
    setMessages((prev) => [
      ...prev,
      userMessage,
      { role: 'assistant', content: '' }, // Add placeholder for assistant
    ]);

    setCurrentUserInput('');
    setIsLoading(true);
    setThinking('');
    setIsThinking(false);
    setSources([]);

    // Assistant message is at the new end of the array
    const assistantMessageIndex = messages.length + 1;

    let currentResponse = '';
    let currentThinking = '';
    let currentSources: any[] = [];
    let inThinkingBlock = false;

    try {
      // Convert messages to the format expected by your backend
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Add the new user message
      conversationHistory.push({
        role: 'user',
        content: input,
      });

      const response = await fetch(`http://localhost:8000/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationHistory,
        }),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          try {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              // Handle the "data: [DONE]" message from OpenAI
              if (jsonStr.trim() === '[DONE]') continue;

              const parsed: StreamChunk = JSON.parse(jsonStr);

              if (parsed.type === 'context' && Array.isArray(parsed.data)) {
                currentSources = parsed.data;
                setSources(currentSources);
                // Auto-open sources on desktop
                if (!isMobile) {
                  setIsSourcesOpen(true);
                }
              } else if (parsed.type === 'token') {
                const token = parsed.data;

                if (token === '<think>') {
                  inThinkingBlock = true;
                  continue;
                } else if (token === '</think>') {
                  inThinkingBlock = false;
                  continue;
                }

                if (inThinkingBlock) {
                  if (token.trim().length > 0) {
                    currentThinking += token;
                    setThinking(currentThinking);
                    setIsThinking(true);
                  }
                } else {
                  currentResponse += token;
                  setIsThinkingExpanded(false);

                  // Update the current assistant message
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[assistantMessageIndex] = {
                      role: 'assistant',
                      content: currentResponse,
                      thinking: currentThinking,
                      sources: currentSources,
                    };
                    return updated;
                  });
                }
              }
            }
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);

      setMessages((prev) => {
        const updated = [...prev];
        updated[assistantMessageIndex] = {
          role: 'assistant',
          content: 'Sorry, an error occurred while processing your request.',
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
      // Focus the input for the next message
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  return (
    <div className="relative max-w-[62rem] flex min-h-[calc(100vh-7rem)]">
      {/* Main content container with two-column layout on desktop */}
      <div className="relative flex flex-col md:flex-row gap-6 transition-all duration-500 ease-in-out flex-1">
        {/* Main content area with thinking and response - animate width changes */}
        <div
          className={cn(
            'flex-1 space-y-6 transition-all duration-500 ease-in-out',
            !isMobile && isSourcesOpen
              ? 'md:w-[calc(60rem-340px)]'
              : 'md:w-[calc(60rem-340px)]',
          )}
        >
          {/* Conversation history */}
          <div className="space-y-6 mb-4">
            {messages.map((message, index) => (
              <div key={index} data-message-index={index}>
                {message.role === 'user' ? (
                  <div className="rounded-lg flex flex-col align-end items-end">
                    <div className="bg-muted px-4 py-2 rounded-2xl">
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <AssistantMessage
                    message={message}
                    isLoading={isLoading}
                    isLastMessage={index === messages.length - 1}
                    isMobile={isMobile}
                    onViewSources={setSources}
                    setIsSourcesOpen={setIsSourcesOpen}
                    streamInfo={
                      index === messages.length - 1 && isLoading
                        ? {
                            thinking,
                            isThinking,
                            isThinkingExpanded,
                            setIsThinkingExpanded,
                          }
                        : undefined
                    }
                  />
                )}
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>
          <div className="h-12" />
        </div>

        {/* Desktop inline sources panel */}
        {!isMobile && (
          <div
            className={cn(
              'md:flex flex-col w-[320px] bg-background border rounded-lg shadow-md self-start sticky top-[72px]',
              'transition-all duration-500 ease-in-out transform',
              isSourcesOpen
                ? 'opacity-100 translate-x-0 md:max-w-[320px]'
                : 'opacity-0 translate-x-8 md:max-w-0 md:w-0 h-0 md:overflow-hidden md:invisible',
            )}
          >
            <div className="p-4 border-b sticky top-0 bg-background z-10 flex justify-between items-center">
              <h2 className="font-serif text-lg font-medium">Sources</h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                onClick={() => setIsSourcesOpen(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <div className="p-4 space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto">
              {sources.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No sources available
                </p>
              )}
              {sources.map((source, index) => (
                <SourceItem key={index} source={source} index={index} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile sources drawer */}
      {isMobile && sources.length > 0 && (
        <div
          className={cn(
            'fixed bottom-0 left-0 right-0 bg-background border-t rounded-t-xl shadow-lg transition-transform duration-300 ease-in-out z-50',
            isSourcesOpen ? 'translate-y-0' : 'translate-y-full',
          )}
        >
          <div className="p-4 border-b sticky top-0 bg-background flex justify-between items-center">
            <h2 className="font-serif text-lg font-medium">Sources</h2>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full"
              onClick={() => setIsSourcesOpen(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
            {sources.map((source, index) => (
              <SourceItem key={index} source={source} index={index} />
            ))}
          </div>
        </div>
      )}
      <div className="fixed top-0 w-full md:pb-4 pt-20 -ml-8">
        <ProgressiveBlur reverse={true} />
      </div>
      {/* Input area */}
      <div className="fixed bottom-0 w-full md:pb-4 pt-10">
        <ProgressiveBlur />
        <div className="md:w-[calc(60rem-340px)] w-[90vw] z-10">
          <ExpandableInput
            value={currentUserInput}
            onChange={setCurrentUserInput}
            onSubmit={handleSendMessage}
            isLoading={isLoading}
            emojis={sampleEmojis}
          />
        </div>
      </div>
    </div>
  );
}
