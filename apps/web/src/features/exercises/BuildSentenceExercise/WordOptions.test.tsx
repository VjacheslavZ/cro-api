import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import { WordOptions } from './WordOptions';

describe('WordOptions', () => {
  it('renders the word-of-total caption and all options', () => {
    renderWithProviders(
      <WordOptions
        currentWordIndex={1}
        totalWords={3}
        options={['kruh', 'mlijeko', 'vodu']}
        onOptionClick={jest.fn()}
      />,
    );

    expect(screen.getByText('Word 2 of 3')).toBeInTheDocument();
    expect(screen.getByText('kruh')).toBeInTheDocument();
    expect(screen.getByText('mlijeko')).toBeInTheDocument();
    expect(screen.getByText('vodu')).toBeInTheDocument();
  });

  it('calls onOptionClick with the tapped option', async () => {
    const onOptionClick = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <WordOptions
        currentWordIndex={0}
        totalWords={3}
        options={['kruh', 'mlijeko', 'vodu']}
        onOptionClick={onOptionClick}
      />,
    );

    await user.click(screen.getByText('mlijeko'));

    expect(onOptionClick).toHaveBeenCalledWith('mlijeko');
  });

  it('calls onOptionClick with the matching option when a number key is pressed', async () => {
    const onOptionClick = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <WordOptions
        currentWordIndex={0}
        totalWords={3}
        options={['kruh', 'mlijeko', 'vodu']}
        onOptionClick={onOptionClick}
      />,
    );

    await user.keyboard('2');

    expect(onOptionClick).toHaveBeenCalledWith('mlijeko');
  });

  it('ignores number keys outside the range of available options', async () => {
    const onOptionClick = jest.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <WordOptions
        currentWordIndex={0}
        totalWords={3}
        options={['kruh', 'mlijeko', 'vodu']}
        onOptionClick={onOptionClick}
      />,
    );

    await user.keyboard('9');

    expect(onOptionClick).not.toHaveBeenCalled();
  });
});
