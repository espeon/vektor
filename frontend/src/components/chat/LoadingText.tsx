import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface LoadingTextProps {
  texts?: string[];
  interval?: number;
  className?: string;
}

export const LoadingText = ({
  texts = [
    'Loading...',
    'Generating response',
    'Thinking...',
    'Working on it',
    'Beep boop',
    'Almost there',
    'Crunching data',
    'Processing request',
  ],
  interval = 2000,
  className,
}: LoadingTextProps) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const transitionTimer = setInterval(() => {
      setIsTransitioning(true);

      // After the fade-out transition completes, change the text
      const textChangeTimer = setTimeout(() => {
        setCurrentTextIndex((prevIndex) => (prevIndex + 1) % texts.length);
        setIsTransitioning(false);
      }, 300); // This should match the transition duration in CSS

      return () => clearTimeout(textChangeTimer);
    }, interval);

    return () => clearInterval(transitionTimer);
  }, [texts.length, interval]);

  return (
    <div className="flex items-center justify-start gap-3">
      <LoadingDots />
      <div
        className={cn(
          'relative text-muted-foreground transition-opacity duration-300',
          isTransitioning ? 'opacity-0' : 'opacity-100',
        )}
      >
        <div className="flex items-center gap-2">{texts[currentTextIndex]}</div>
      </div>
    </div>
  );
};

// Simple animated dots to accompany the loading text
const LoadingDots = () => {
  return (
    <div className="flex space-x-1.5 mt-1.5">
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className={`inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot-${dot}`}
          style={{
            animationDelay: `${dot * 0.2}s`,
            opacity: 0.4,
            animation: `pulse 0.8s infinite alternate ${dot * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
};
