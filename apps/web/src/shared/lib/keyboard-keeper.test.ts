import { armKeyboardKeeper, parkKeyboard, releaseKeyboard } from './keyboard-keeper';

function focusedInput() {
  const input = document.createElement('input');
  document.body.appendChild(input);
  input.focus();
  return input;
}

describe('keyboard-keeper', () => {
  afterEach(() => {
    releaseKeyboard();
    document.body.innerHTML = '';
  });

  it('does nothing while no page has armed it', () => {
    const input = focusedInput();

    parkKeyboard(input);

    expect(document.activeElement).toBe(input);
  });

  it('moves focus to a hidden input while armed, and the next input takes it over', () => {
    const disarm = armKeyboardKeeper();
    const input = focusedInput();

    parkKeyboard(input);
    input.remove();

    const keeper = document.activeElement as HTMLInputElement;
    expect(keeper).not.toBe(input);
    expect(keeper.tagName).toBe('INPUT');
    expect(keeper).toHaveAttribute('aria-hidden', 'true');

    const next = focusedInput();
    expect(document.activeElement).toBe(next);
    disarm();
  });

  it('ignores an input that does not have focus', () => {
    const disarm = armKeyboardKeeper();
    const input = document.createElement('input');
    document.body.appendChild(input);

    parkKeyboard(input);

    expect(document.activeElement).toBe(document.body);
    disarm();
  });

  it('closes the parked keyboard when disarmed', () => {
    const disarm = armKeyboardKeeper();
    parkKeyboard(focusedInput());

    disarm();

    expect(document.activeElement).toBe(document.body);
  });

  it('closes the parked keyboard when no input takes it over in time', () => {
    jest.useFakeTimers();
    const disarm = armKeyboardKeeper();
    parkKeyboard(focusedInput());

    jest.advanceTimersByTime(5000);

    expect(document.activeElement).toBe(document.body);
    disarm();
    jest.useRealTimers();
  });
});
