import React, {
  useLayoutEffect,
  useRef,
  useState,
  useEffect,
  type KeyboardEventHandler,
} from 'react';

import { Loader2, SendIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MIN_TEXTAREA_HEIGHT = 40;
const MAX_TEXTAREA_HEIGHT = 256;

export interface Emoji {
  name: string;
  url: string;
}

export interface TextAreaProps {
  onSubmit: (value: string) => void;
  emojis?: Emoji[];
  isLoading?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

const TextArea = ({
  onSubmit,
  emojis = [],
  isLoading = false,
  placeholder = 'Blaze your glory!',
  value,
  onChange,
}: TextAreaProps) => {
  const [input, setInput] = useState(value || '');
  const [inputFocused, setInputFocused] = useState(false);
  // Add these new states
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiIcon, setEmojiIcon] = useState('😊');
  const [cursorPosition, setCursorPosition] = useState<number>(0);

  const [showEmojiSuggestions, setShowEmojiSuggestions] = useState(false);
  const [emojiFilter, setEmojiFilter] = useState('');
  const [selectedEmojiIndex, setSelectedEmojiIndex] = useState(0);
  const [colonIndex, setColonIndex] = useState(-1);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Update local input state when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setInput(value);
    }
  }, [value]);

  const filteredEmojis = emojis
    .filter((emoji) =>
      emoji.name.toLowerCase().includes(emojiFilter.toLowerCase()),
    )
    .slice(0, 8); // Limit to 8 suggestions

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmojiClick = (emoji: Emoji) => {
    if (!inputRef.current) return;

    const start = inputRef.current.selectionStart || 0;
    const end = inputRef.current.selectionEnd || 0;
    const emojiText = `:${emoji.name}:`;

    const newText =
      input.substring(0, start) + emojiText + input.substring(end);

    updateInput(newText);
    setCursorPosition(start + emojiText.length);
    setShowEmojiPicker(false);
  };

  const insertEmojiFromSuggestion = (emoji: Emoji) => {
    if (!inputRef.current || colonIndex === -1) return;

    const beforeColon = input.substring(0, colonIndex);
    const afterFilter = input.substring(colonIndex + emojiFilter.length + 1);
    const newText = beforeColon + `:${emoji.name}:` + afterFilter;

    updateInput(newText);
    setCursorPosition(colonIndex + emoji.name.length + 2);
    setShowEmojiSuggestions(false);
    setEmojiFilter('');
    setColonIndex(-1);
  };

  // Helper function to update input and call onChange if provided
  const updateInput = (newValue: string) => {
    setInput(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  // Update cursor position after emoji insertion
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.selectionStart = cursorPosition;
      inputRef.current.selectionEnd = cursorPosition;
    }
  }, [cursorPosition]);

  // Define a function to handle the click event
  const handleOuterFocus = (e: React.MouseEvent) => {
    // Set the focus state to true
    setInputFocused(true);

    // Focus on the textbox element
    if (inputRef.current != null) inputRef.current.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.currentTarget.value;
    updateInput(newValue);

    const cursorPos = e.currentTarget.selectionStart || 0;
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastColonIndex = textBeforeCursor.lastIndexOf(':');

    if (lastColonIndex !== -1 && lastColonIndex === colonIndex) {
      // Update emoji filter
      const filterText = textBeforeCursor.substring(lastColonIndex + 1);
      setEmojiFilter(filterText);
      setShowEmojiSuggestions(true);
    } else if (newValue[cursorPos - 1] === ':') {
      // Start new emoji filtering
      setColonIndex(cursorPos - 1);
      setEmojiFilter('');
      setShowEmojiSuggestions(true);
      setSelectedEmojiIndex(0);
    } else {
      setShowEmojiSuggestions(false);
      setEmojiFilter('');
      setColonIndex(-1);
    }
  };

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (showEmojiSuggestions && filteredEmojis.length > 0) {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedEmojiIndex((prev) =>
            prev > 0 ? prev - 1 : filteredEmojis.length - 1,
          );
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedEmojiIndex((prev) =>
            prev < filteredEmojis.length - 1 ? prev + 1 : 0,
          );
          break;
        case 'Enter':
          e.preventDefault();
          insertEmojiFromSuggestion(filteredEmojis[selectedEmojiIndex]);
          break;
        case 'Escape':
          setShowEmojiSuggestions(false);
          break;
        case 'Tab':
          e.preventDefault();
          insertEmojiFromSuggestion(filteredEmojis[selectedEmojiIndex]);
          break;
      }
    } else if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Let the default behavior happen which adds a new line
      } else {
        // handle submit
        e.preventDefault();
        if (input.trim() === '') return;
        onSubmit(input);
        setInput('');
      }
    }
  };

  useLayoutEffect(() => {
    if (!inputRef.current) return;

    // Reset height - important to shrink on delete
    inputRef.current.style.height = 'inherit';
    // Set height
    inputRef.current.style.height = `${Math.min(
      inputRef.current.scrollHeight,
      MAX_TEXTAREA_HEIGHT,
    )}px`;

    if (
      inputRef.current.scrollHeight > 32 &&
      inputRef.current.scrollHeight < 48
    ) {
      inputRef.current.style.height = `24px`;
    }
  }, [input]);

  const handleSubmitClick = () => {
    if (input.trim() === '' || isLoading) return;
    onSubmit(input);
    setInput('');
  };

  return (
    <div
      className={`flex py-1 pl-1 w-full h-10 max-w-full min-h-fit rounded-3xl bg-card/90 backdrop-blur-xs border border-border
            ${
              inputFocused
                ? 'outline-2 -outline-offset-2 outline-violet-300 dark:outline-violet-400 shadow-lg shadow-violet-950/10'
                : 'outline-0 hover:outline-2 -outline-offset-2 outline-violet-300/30 hover:outline-violet-300/30 shadow-xl hover:shadow-lg hover:shadow-violet-950/10'
            } transition-all duration-75`}
      onClick={handleOuterFocus}
    >
      <textarea
        value={input}
        onKeyDown={handleKeyDown}
        onChange={handleInputChange}
        className="border-0 outline-none focus:ring-0 p-2 w-full text-primary bg-transparent"
        placeholder={placeholder}
        ref={inputRef}
        onBlur={() => setInputFocused(false)}
        onFocus={() => setInputFocused(true)}
        rows={1}
        disabled={isLoading}
        style={{
          minHeight: `${MIN_TEXTAREA_HEIGHT}px`,
          height: 'auto',
          resize: 'none',
        }}
      />

      {/* Emoji Button - Only show if emojis are provided */}
      {emojis.length > 0 && (
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          onMouseOver={() => setEmojiIcon('😊')}
          className="absolute right-16 bottom-6 p-1 rounded hover:bg-gray-200 hover:scale-105 transition-all duration-150 ease-out dark:hover:bg-gray-700"
        >
          {emojiIcon.startsWith('http') ? (
            <img src={emojiIcon} alt="emoji" className="w-6 h-6" />
          ) : (
            emojiIcon
          )}
        </button>
      )}

      <Button
        onClick={handleSubmitClick}
        disabled={isLoading || !input.trim()}
        className="rounded-full mr-2 mt-0.5"
        size="icon"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <SendIcon className="h-4 w-4" />
        )}
      </Button>

      {/* Emoji Suggestions Popup */}
      {showEmojiSuggestions &&
        !showEmojiPicker &&
        filteredEmojis.length > 0 && (
          <div className="absolute w-full left-0 bottom-full mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 z-50">
            <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
              Emojis matching{' '}
              <span className="font-semibold">{emojiFilter}</span>
            </p>
            {filteredEmojis.map((emoji, index) => (
              <div
                key={emoji.url}
                className={`flex items-center gap-2 px-3 py-1 cursor-pointer rounded-md ${
                  index === selectedEmojiIndex
                    ? 'bg-violet-100 dark:bg-violet-900'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => insertEmojiFromSuggestion(emoji)}
              >
                <img src={emoji.url} alt={emoji.name} className="w-6 h-6" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {emoji.name}
                </span>
              </div>
            ))}
          </div>
        )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute w-full max-w-md bottom-full mb-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 z-50"
        >
          <div className="grid grid-cols-8 gap-1 max-h-[200px] overflow-y-auto">
            {emojis.map((emoji) => (
              <button
                key={emoji.url}
                onClick={() => handleEmojiClick(emoji)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <img
                  src={emoji.url}
                  alt={emoji.name}
                  className="w-full object-contain"
                  title={emoji.name}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TextArea;
