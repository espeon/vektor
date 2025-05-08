import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { suggestionsData } from './suggestionsArr';

export const Suggestions = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategories, setShowCategories] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCategoryAnimating, setIsCategoryAnimating] = useState(false);
  const [isCategoryFadingOut, setIsCategoryFadingOut] = useState(false);
  const [isSuggestionsFadingOut, setIsSuggestionsFadingOut] = useState(false);
  const [visibleCategories, setVisibleCategories] = useState<string[]>([]);
  const [isRotating, setIsRotating] = useState(false);

  const isMobile = useMediaQuery('(max-width: 512px)');

  const allCategories = Object.keys(suggestionsData);

  // Initialize visible categories
  useEffect(() => {
    setVisibleCategories(allCategories.slice(0, isMobile ? 2 : 4));
  }, [isMobile]);

  // Handle rotation logic
  const rotateCategories = () => {
    // Skip rotation if showing suggestions
    if (showSuggestions) return;

    // Start rotation animation
    setIsRotating(true);

    // After animation out completes, update categories
    setTimeout(() => {
      const currentIndex = allCategories.indexOf(visibleCategories[0]);
      let nextStartIndex =
        (currentIndex + (isMobile ? 2 : 4)) % allCategories.length;

      // If we'd go past the end, loop back to the beginning
      if (nextStartIndex + (isMobile ? 2 : 4) > allCategories.length) {
        nextStartIndex = 0;
      }

      const nextCategories = allCategories.slice(
        nextStartIndex,
        nextStartIndex + (isMobile ? 2 : 4),
      );
      setVisibleCategories(nextCategories);

      // After a delay, fade the new categories in
      setTimeout(() => {
        setIsRotating(false);
      }, 150);
    }, 500);
  };

  // Set up rotation timer
  useEffect(() => {
    const rotationTimer = setInterval(() => {
      rotateCategories();
    }, 7500);

    return () => clearInterval(rotationTimer);
  }, [visibleCategories, showSuggestions]);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setIsCategoryFadingOut(true);

    // Fade out categories first
    setTimeout(() => {
      setShowCategories(false);
      setIsCategoryFadingOut(false);
      setShowSuggestions(true);
      setIsCategoryAnimating(true);
    }, 250);
  };

  const handleBackToCategories = () => {
    setIsSuggestionsFadingOut(true);

    // Wait for suggestions to animate out before showing categories
    setTimeout(() => {
      setShowSuggestions(false);
      setIsSuggestionsFadingOut(false);
      setShowCategories(true);
      setIsCategoryAnimating(true);
    }, 250);
  };

  // Reset animation state after animation completes
  useEffect(() => {
    if (isCategoryAnimating) {
      const timer = setTimeout(() => {
        setIsCategoryAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isCategoryAnimating]);

  return (
    <div className="relative text-center text-sm text-muted-foreground pt-0 h-0 min-h-[200px]">
      {/* Categories */}
      {showCategories && (
        <div className="absolute right-0 left-0 flex justify-center space-x-4">
          {visibleCategories.map((category, i) => (
            <button
              key={i}
              onClick={() => handleCategoryClick(category)}
              className={`px-4 py-2 bg-secondary rounded-full hover:bg-teal-300 dark:hover:bg-teal-900
                        transition-all duration-500
                        ${isCategoryAnimating ? 'animate-categoryFadeIn' : ''}
                        ${isCategoryFadingOut ? 'animate-categoryFadeOut' : ''}
                        ${isRotating ? 'animate-blurFadeOut' : 'animate-blurFadeIn'}`}
              style={{
                animationDelay: `${i * 0.08}s`,
                opacity: isRotating ? 1 : 0,
              }}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Questions */}
      {showSuggestions && selectedCategory && (
        <>
          <div
            className={`absolute -top-4 ${isSuggestionsFadingOut ? 'animate-containerFadeOut' : 'animate-containerFadeIn'}`}
          >
            <Button
              size="sm"
              variant="ghost"
              className="py-0 my-0 h-6 rounded-full"
              onClick={handleBackToCategories}
            >
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              Back
            </Button>
          </div>
          <div
            className={`w-full pt-4 ${isSuggestionsFadingOut ? 'animate-containerFadeOut' : 'animate-containerFadeIn'}`}
          >
            <div className="flex flex-col gap-2">
              {suggestionsData[selectedCategory]?.map((question, index) => (
                <Link
                  key={question}
                  to="/chat"
                  search={{ q: question }}
                  className={`px-4 py-2 bg-transparent text-start rounded-md w-full hover:bg-teal-300 dark:hover:bg-teal-900 transition-colors
                           ${isSuggestionsFadingOut ? 'animate-cascadeUp' : 'animate-cascadeIn'}`}
                  style={{
                    animationDelay: `${isSuggestionsFadingOut ? 0 : index * 0.08}s`,
                  }}
                >
                  <span className="font-semibold">
                    {selectedCategory.replace('...', '')}
                  </span>{' '}
                  {question.replace(selectedCategory.replace('...', ''), '')}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
