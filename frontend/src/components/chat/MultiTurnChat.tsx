import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import { SourceItem } from "@/components/chat/SourceItem";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import ExpandableInput from "@/components/chat/TextArea";
import { AssistantMessage } from "./AssistantMessage";
import type { Emoji } from "./TextArea";
import ProgressiveBlur from "../ui/progressive-blur";
import { usePreferences } from "@/providers/PreferencesProvider";

interface Model {
  id: string;
  object: string;
  owned_by: string;
}

interface OpenAIStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  system_fingerprint?: string;
  choices: Array<{
    index: number;
    delta: {
      content?: string;
      reasoning_content?: string;
    };
    finish_reason: string | null;
  }>;
  timings?: {
    prompt_n: number;
    prompt_ms: number;
    prompt_per_token_ms: number;
    prompt_per_second: number;
    predicted_n: number;
    predicted_ms: number;
    predicted_per_token_ms: number;
    predicted_per_second: number;
    cache_n: number;
  };
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  thinking?: string;
  sources?: any[];
  model?: string;
  timestamp?: number;
  timings?: {
    prompt_n: number;
    prompt_ms: number;
    prompt_per_token_ms: number;
    prompt_per_second: number;
    predicted_n: number;
    predicted_ms: number;
    predicted_per_token_ms: number;
    predicted_per_second: number;
    cache_n: number;
  };
}

const sampleEmojis: Emoji[] = [];

export function MultiTurnChatStream({
  initialQuery,
}: {
  initialQuery?: string;
}) {
  const { preferences } = usePreferences();
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserInput, setCurrentUserInput] = useState(initialQuery || "");
  const [thinking, setThinking] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);
  const [sources, setSources] = useState<any[]>([]);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (input = currentUserInput) => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      model: preferences.selectedModel,
      timestamp: Date.now(),
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
      { role: "assistant", content: "", model: preferences.selectedModel, timestamp: Date.now() },
    ]);

    setCurrentUserInput("");
    setIsLoading(true);
    setThinking("");
    setIsThinking(false);
    setSources([]);

    const assistantMessageIndex = messages.length + 1;

      let currentResponse = "";
      let currentThinking = "";
      let currentSources: any[] = [];
      let currentTimings: OpenAIStreamChunk['timings'] | null = null;
      let inThinkingBlock = false;

    try {
      if (!preferences.selectedModel) {
        throw new Error("No model selected");
      }

      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      conversationHistory.push({
        role: "user",
        content: input,
      });

      const response = await fetch("http://ami:9292/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: preferences.selectedModel,
          messages: conversationHistory,
          stream: true,
        }),
      });

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          try {
            if (line.startsWith("data: ")) {
              const jsonStr = line.slice(6);
              console.log("SSE line:", jsonStr);
              if (jsonStr.trim() === "[DONE]") continue;

              const parsed: OpenAIStreamChunk = JSON.parse(jsonStr);

              if (parsed.choices && parsed.choices.length > 0) {
                const delta = parsed.choices[0].delta;

                // Capture timings if present (stop message)
                if (parsed.timings) {
                  currentTimings = parsed.timings;
                }

                // Log timings if present (stop message)
                if (parsed.timings && !delta.content && !delta.reasoning_content) {
                  console.log("Request timings:", parsed.timings);
                }

                // Handle reasoning_content separately (goes to thinking)
                if (delta.reasoning_content) {
                  if (delta.reasoning_content.trim().length > 0) {
                    currentThinking += delta.reasoning_content;
                    setThinking(currentThinking);
                    setIsThinking(true);
                  }
                  continue;
                }

                // Handle regular content
                if (delta.content) {
                  if (delta.content === "```thinking") {
                    inThinkingBlock = true;
                  } else if (delta.content === "```") {
                    inThinkingBlock = false;
                  }

                  if (inThinkingBlock) {
                    if (delta.content.trim().length > 0) {
                      currentThinking += delta.content;
                      setThinking(currentThinking);
                      setIsThinking(true);
                    }
                  } else {
                    currentResponse += delta.content;
                    setIsThinkingExpanded(false);

                    setMessages((prev) => {
                      const updated = [...prev];
                      updated[assistantMessageIndex] = {
                        role: "assistant",
                        content: currentResponse,
                        thinking: currentThinking,
                        sources: currentSources,
                        timings: currentTimings || undefined,
                      };
                      return updated;
                    });
                  }
                }
              }
            }
          } catch (e) {
            console.error("Error parsing chunk:", e);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);

      setMessages((prev) => {
        const updated = [...prev];
        updated[assistantMessageIndex] = {
          role: "assistant",
          content: "Sorry, an error occurred while processing your request.",
        };
        return updated;
      });
    } finally {
      // Update final message with timings if captured
      if (currentTimings && assistantMessageIndex !== undefined) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantMessageIndex] = {
            ...updated[assistantMessageIndex],
            timings: currentTimings,
          };
          return updated;
        });
      }

      setIsLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  return (
    <div className="relative max-w-[62rem] flex min-h-[calc(100vh-7rem)]">
      <div className="relative flex flex-col md:flex-row gap-6 transition-all duration-500 ease-in-out flex-1">
        <div
          className={cn(
            "flex-1 space-y-6 transition-all duration-500 ease-in-out",
            !isMobile && isSourcesOpen
              ? "md:w-[calc(60rem-340px)]"
              : "md:w-[calc(60rem-340px)]",
          )}
        >
          <div className="space-y-6 mb-4">
            {messages.map((message, index) => (
              <div key={index} data-message-index={index}>
                {message.role === "user" ? (
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

        {!isMobile && (
          <div
            className={cn(
              "md:flex flex-col w-[320px] bg-background border rounded-lg shadow-md self-start sticky top-[72px]",
              "transition-all duration-500 ease-in-out transform",
              isSourcesOpen
                ? "opacity-100 translate-x-0 md:max-w-[320px]"
                : "opacity-0 translate-x-8 md:max-w-0 md:w-0 h-0 md:overflow-hidden md:invisible",
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

      {isMobile && sources.length > 0 && (
        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 bg-background border-t rounded-t-xl shadow-lg transition-transform duration-300 ease-in-out z-50",
            isSourcesOpen ? "translate-y-0" : "translate-y-full",
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
