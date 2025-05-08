"use client";

import type React from "react";

import { useState } from "react";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link, useRouter } from "@tanstack/react-router";

export function SearchHeader() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.navigate({
        to: "/chat",
        search: { q: encodeURIComponent(query.trim()) },
      });
    }
  };

  return (
    <header className="border-b bg-background py-3 sticky top-0 z-10">
      <div className="container max-w-5xl mx-auto px-4 flex items-center gap-4">
        <Link to="/" className="font-serif text-xl font-medium flex-shrink-0">
          lumina
        </Link>

        <form onSubmit={handleSubmit} className="flex-1">
          <div className="relative flex items-center">
            <Input
              type="text"
              placeholder="Ask a new question..."
              className="pr-10 rounded-full"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="absolute right-1 h-8 w-8 rounded-full"
              disabled={!query.trim()}
            >
              <SearchIcon className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </div>
        </form>

        <ThemeToggle />
      </div>
    </header>
  );
}
