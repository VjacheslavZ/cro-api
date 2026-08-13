import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import { ResultBanner } from './ResultBanner';

describe('ResultBanner', () => {
  it('shows a success message and no retry button when correct', () => {
    renderWithProviders(
      <ResultBanner phase="correct" correctSentence="Ja jedem kruh" onRetry={jest.fn()} />,
    );

    expect(screen.getByText('Correct!')).toBeInTheDocument();
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('shows the correct sentence and a retry button when incorrect', () => {
    renderWithProviders(
      <ResultBanner phase="incorrect" correctSentence="Ja jedem kruh" onRetry={jest.fn()} />,
    );

    expect(screen.getByText('Almost! Here is the correct sentence:')).toBeInTheDocument();
    expect(screen.getByText('Ja jedem kruh')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('calls onRetry when "Try Again" is clicked', async () => {
    const onRetry = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <ResultBanner phase="incorrect" correctSentence="Ja jedem kruh" onRetry={onRetry} />,
    );

    await user.click(screen.getByText('Try Again'));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
