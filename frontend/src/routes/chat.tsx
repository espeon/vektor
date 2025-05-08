import { MultiTurnChatStream } from "@/components/chat/MultiTurnChat";
import { SearchHeader } from "@/components/search-header";
import { Skeleton } from "@/components/ui/skeleton";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { Suspense } from "react";

export const Route = createFileRoute("/chat")({
  component: RouteComponent,
  validateSearch: (search: Record<string, string | undefined>) => {
    return { q: search.q };
  },
});

function RouteComponent() {
  // get params
  const search = useSearch({ from: "/chat" });

  const query = search.q || "";

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SearchHeader />

      <main className="flex-1 container max-w-max mx-auto px-4 py-6">
        <Suspense fallback={<SearchSkeleton />}>
          <MultiTurnChatStream
            key={JSON.stringify(query)}
            initialQuery={decodeURIComponent(query)}
          />
        </Suspense>
      </main>
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-[80%]" />
      </div>

      <div className="pt-4">
        <Skeleton className="h-24 w-full rounded-md" />
      </div>
    </div>
  );
}
