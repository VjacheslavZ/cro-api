import { Routes, Route } from 'react-router-dom';

import { MyDictionaryPage } from '../../features/dictionary/MyDictionaryPage/MyDictionaryPage.tsx';
import { CollectionsPage } from '../../features/dictionary/CollectionsPage';
import { WordSetsPage } from '../../features/dictionary/WordSetsPage';
import { CollectionPreviewPage } from '../../features/dictionary/CollectionPreviewPage/CollectionPreviewPage.tsx';
import { DictionaryPracticePage } from '../../features/dictionary/DictionaryPractice/DictionaryPracticePage.tsx';
import { DictionaryPracticeResultsPage } from '../../features/dictionary/DictionaryPractice/DictionaryPracticeResultsPage.tsx';
import { DictionaryReviewPage } from '../../features/dictionary/Review/DictionaryReviewPage.tsx';
import { DictionaryReviewResultsPage } from '../../features/dictionary/Review/DictionaryReviewResultsPage.tsx';
import { ProtectedLayout } from '../guards';

/** Mounted at `/dictionary/*` — all paths below are relative to that prefix. */
export function DictionaryRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedLayout />}>
        <Route path="my" element={<MyDictionaryPage />} />
        <Route path="my-collections" element={<CollectionsPage />} />
        <Route path="recommended-word-sets" element={<WordSetsPage />} />
        <Route path="collections/:collectionId" element={<CollectionPreviewPage />} />
        <Route path="practice/:sessionId" element={<DictionaryPracticePage />} />
        <Route path="practice/results/:sessionId" element={<DictionaryPracticeResultsPage />} />
        <Route path="review/:sessionId" element={<DictionaryReviewPage />} />
        <Route path="review/results/:sessionId" element={<DictionaryReviewResultsPage />} />
      </Route>
    </Routes>
  );
}
