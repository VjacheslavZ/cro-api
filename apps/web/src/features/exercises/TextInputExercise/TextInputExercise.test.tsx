import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import { TextInputExercise } from './TextInputExercise';

const defaultProps = {
  itemId: 'item1',
  correctAnswer: 'čaj',
  placeholder: 'Enter answer...',
  prompt: <div>What is tea?</div>,
  correctMessage: 'Correct!',
  incorrectMessage: 'Incorrect. The correct answer is: čaj',
  onAnswer: jest.fn(),
};

describe('TextInputExercise', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the prompt, placeholder and progress header', () => {
    const onStop = jest.fn();
    renderWithProviders(
      <TextInputExercise
        {...defaultProps}
        onAnswer={jest.fn()}
        progress={{ currentIndex: 1, total: 5, onStop }}
      />,
    );

    expect(screen.getByText('What is tea?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter answer...')).toBeInTheDocument();
    expect(screen.getByText('2 / 5')).toBeInTheDocument();
  });

  it('disables the check button while the input is empty', () => {
    renderWithProviders(<TextInputExercise {...defaultProps} onAnswer={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled();
  });

  it('accepts the correct answer after trimming and case normalization, then calls onAnswer', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onAnswer = jest.fn();
    renderWithProviders(<TextInputExercise {...defaultProps} onAnswer={onAnswer} />);

    await user.type(screen.getByPlaceholderText('Enter answer...'), '  ČAJ  '.trim());

    expect(await screen.findByText('Correct!')).toBeInTheDocument();
    expect(onAnswer).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);

    expect(onAnswer).toHaveBeenCalledWith({
      itemId: 'item1',
      givenAnswer: 'ČAJ',
      isCorrect: true,
    });
  });

  it('rejects a wrong answer, shows feedback, and calls onAnswer with isCorrect=false on Next', async () => {
    const user = userEvent.setup();
    const onAnswer = jest.fn();
    renderWithProviders(<TextInputExercise {...defaultProps} onAnswer={onAnswer} />);

    await user.type(screen.getByPlaceholderText('Enter answer...'), 'kava');
    await user.click(screen.getByRole('button', { name: 'Check' }));

    expect(screen.getByText('Incorrect. The correct answer is: čaj')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Check' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(onAnswer).toHaveBeenCalledWith({
      itemId: 'item1',
      givenAnswer: 'kava',
      isCorrect: false,
    });
  });

  it('checks the answer when Enter is pressed with non-empty input', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TextInputExercise {...defaultProps} onAnswer={jest.fn()} />);

    await user.type(screen.getByPlaceholderText('Enter answer...'), 'kava{Enter}');

    expect(screen.getByText('Incorrect. The correct answer is: čaj')).toBeInTheDocument();
  });

  it('reveals the next character of the answer when the hint button is used', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TextInputExercise {...defaultProps} onAnswer={jest.fn()} />);

    await user.click(screen.getByTitle('Hint'));

    expect(screen.getByPlaceholderText('Enter answer...')).toHaveValue('č');
  });

  it('turns off keyboard suggestions, autocorrect and auto-capitalization', () => {
    renderWithProviders(<TextInputExercise {...defaultProps} onAnswer={jest.fn()} />);

    const input = screen.getByPlaceholderText('Enter answer...');
    expect(input).toHaveAttribute('autocomplete', 'off');
    expect(input).toHaveAttribute('autocorrect', 'off');
    expect(input).toHaveAttribute('autocapitalize', 'none');
    expect(input).toHaveAttribute('spellcheck', 'false');
  });

  it('keeps the input focused after a wrong answer and advances once on Enter', async () => {
    const user = userEvent.setup();
    const onAnswer = jest.fn();
    renderWithProviders(<TextInputExercise {...defaultProps} onAnswer={onAnswer} />);

    const input = screen.getByPlaceholderText('Enter answer...');
    await user.type(input, 'kava{Enter}');

    // Focus stays on the input so the mobile keyboard does not close; typing is ignored
    expect(input).toHaveFocus();
    expect(input).toBeEnabled();
    await user.type(input, 'x');
    expect(input).toHaveValue('kava');

    // The window Enter listener is attached on the next animation frame
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)));
    await user.keyboard('{Enter}');

    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith({
      itemId: 'item1',
      givenAnswer: 'kava',
      isCorrect: false,
    });
  });

  it('keeps the input focused when the Check button is pressed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TextInputExercise {...defaultProps} onAnswer={jest.fn()} />);

    const input = screen.getByPlaceholderText('Enter answer...');
    await user.type(input, 'kava');
    await user.click(screen.getByRole('button', { name: 'Check' }));

    expect(input).toHaveFocus();
  });
});
