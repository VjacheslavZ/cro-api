import type { ReactNode } from 'react';

/** Practice modes, grouped the way the app groups them. Specimens are real Croatian. */
export const GRAMMAR_MODES = ['typeAnswer', 'fillBlank', 'buildSentence', 'flashcards'] as const;
export const WORD_MODES = ['wordTranslation', 'buildWord', 'listeningMatch', 'speedQuiz'] as const;

export type PracticeMode = (typeof GRAMMAR_MODES | typeof WORD_MODES)[number];

export const SPECIMENS: Record<PracticeMode, ReactNode> = {
  typeAnswer: (
    <>
      grad <span className="text-muted-foreground">→</span> gradu
    </>
  ),
  fillBlank: (
    <>
      Pijem <span className="border-b-2 border-foreground/60">&nbsp;&nbsp;&nbsp;&nbsp;</span>
      <span className="ml-2 font-sans text-sm text-muted-foreground">(kava)</span>
    </>
  ),
  buildSentence: (
    <span className="inline-flex flex-wrap gap-1.5">
      {['Zagrebu', 'u', 'Živim'].map((w) => (
        <span key={w} className="rounded-md border px-2 py-0.5 text-base">
          {w}
        </span>
      ))}
    </span>
  ),
  flashcards: (
    <>
      kuća <span className="text-muted-foreground">·</span>{' '}
      <span className="text-muted-foreground">?</span>
    </>
  ),
  wordTranslation: (
    <>
      more <span className="text-muted-foreground">↔</span> sea
    </>
  ),
  buildWord: <span className="tracking-[0.35em]">kuća</span>,
  listeningMatch: (
    <>
      <span className="text-muted-foreground">🔊</span> jabuka
    </>
  ),
  speedQuiz: (
    <>
      5 <span className="font-sans text-sm text-muted-foreground">s / word</span>
    </>
  ),
};
