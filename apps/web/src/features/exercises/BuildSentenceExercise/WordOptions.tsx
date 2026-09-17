import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

interface Props {
  currentWordIndex: number;
  totalWords: number;
  options: string[];
  onOptionClick: (option: string) => void;
}

export function WordOptions({ currentWordIndex, totalWords, options, onOptionClick }: Props) {
  const { t } = useTranslation();

  // Keep a ref so the keydown handler always calls the latest closure without
  // needing to be re-registered on every render.
  const onOptionClickRef = useRef(onOptionClick);
  onOptionClickRef.current = onOptionClick;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= options.length) {
        onOptionClickRef.current(options[num - 1]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options]); // re-register only when the actual options slot changes

  return (
    <>
      <p className="mb-2 block text-xs text-muted-foreground">
        {t('exercises.buildSentence.wordOf', {
          current: currentWordIndex + 1,
          total: totalWords,
        })}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option, index) => (
          <Button
            key={index}
            variant="outline"
            size="lg"
            onClick={() => onOptionClick(option)}
            className="gap-1.5 text-lg font-medium lowercase"
          >
            <span
              aria-hidden="true"
              className="inline-flex size-4 shrink-0 items-center justify-center rounded-[3px] border border-current text-[10px] leading-none opacity-55"
            >
              {index + 1}
            </span>
            {option}
          </Button>
        ))}
      </div>
    </>
  );
}
