import type React from 'react';

import { useEffect, useRef, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from '@tanstack/react-router';
import Ambilight from '../Ambilight';

export function Search() {
  const [query, setQuery] = useState('');

  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.navigate({
        to: '/chat',
        search: { q: encodeURIComponent(query.trim()) },
      });
    }
  };

  // auto focus on input field
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Ask anything..."
          className="border-0 ring-1 hover:ring-2 -ring-offset-2 text-lg h-10 ring-violet-300/30 hover:ring-violet-300/20 focus-visible:ring-violet-300/20 shadow-sm hover:shadow-lg hover:shadow-violet-950/10 rounded-full"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button
          type="submit"
          size="icon"
          className="absolute right-1 h-8 w-10 rounded-full"
          disabled={!query.trim()}
        >
          <SearchIcon className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Button>
      </div>
      <Ambilight />
    </form>
  );
}
