import { createFileRoute, Link } from '@tanstack/react-router';
import { ThemeToggle } from '@/components/theme-toggle';
import { Search } from '@/components/home/Search';
import { Suggestions } from '@/components/home/Suggestions';

export const Route = createFileRoute('/')({
  component: App,
});

function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-3xl w-full space-y-8 mt-48">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight animate-in fade-in">
            Answers, from the{' '}
            <span className="text-teal-800 dark:text-teal-400">world</span>.
          </h1>
          <div className="text-xl text-muted-foreground animate-in fade-in duration-300">
            <span className="text-teal-800 dark:text-teal-400">Lumine</span>{' '}
            gives you{' '}
            <span className="text-teal-800 dark:text-teal-400">real</span>{' '}
            insights from{' '}
            <span className="text-sky-800 dark:text-sky-400">
              the ATmosphere.
            </span>{' '}
          </div>
        </div>

        <Search />

        <div className="text-center text-sm text-muted-foreground animate-in duration-500">
          <Suggestions />
        </div>
      </div>
    </main>
  );
}
