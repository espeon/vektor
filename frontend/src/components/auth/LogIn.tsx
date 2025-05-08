import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import Ambilight from '../Ambilight';
import { AtSign, Info } from 'lucide-react';

export default function LogIn() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Implement login logic
  };

  return (
    <Card className="relative ambilight max-w-xl w-screen overflow-clip animate-in fade-in ease-in-out dark:shadow-none shadow-2xl">
      <form
        className="flex flex-col px-12 pt-2 gap-8 z-10"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col items-start gap-1">
          <div className="relative flex items-center text-3xl font-serif overflow-y-clip">
            Sign in{' '}
            <img
              className="absolute -bottom-12 -z-10"
              src="https://flyclipart.com/thumb2/scratch-studio-760323.png"
            />
          </div>
          <div className="flex items-center gap-1">
            Log in with your handle on the
            <div className="dark:text-blue-300 text-blue-700 flex items-center -mr-1">
              <AtSign className="h-4 w-4 " />
              AT
            </div>
            Protocol.
            {/* Tooltip */}
            <div className="relative group">
              <Info className="w-4 h-4 dark:text-blue-300 text-blue-700 cursor-help" />
              <div
                className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-popover text-popover-foreground text-sm rounded-md shadow-md
                opacity-0 invisible group-hover:opacity-100 group-hover:visible
                transition-all duration-200 w-64 text-center outline outline-border outline-offset-2"
              >
                This is the same as your Bluesky handle (e.g.,
                username.bsky.social)
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 h-3 w-3 rotate-45 bg-popover border-b border-r border-border"></div>
              </div>
            </div>
          </div>
        </div>
        <div>
          {/* <label className="block text-sm text-muted-foreground mb-1">
            Handle
          </label> */}
          <Input
            className="bg-muted/50 border border-neutral-500/30"
            value={email}
            placeholder="jay.bsky.team"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <a href="https://bsky.app">
            <Button
              variant="ghost"
              type="button"
              className="text-primary/80 -m-4"
            >
              Sign up with Bluesky
            </Button>
          </a>
          <div />
          <Button type="submit" size="lg">
            Log In
          </Button>
        </div>
      </form>
      <img
        src="/blobbies/wb-gradient-blob.png"
        alt="Blob"
        className="absolute top-0 left-1/3 w-full object-fill -z-0 dark:brightness-75 animate-in fade-in opacity-50 dark:opacity-100"
      />
      <Ambilight />
    </Card>
  );
}
