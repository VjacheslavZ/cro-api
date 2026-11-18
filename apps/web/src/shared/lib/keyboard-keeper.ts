/**
 * @module keyboard-keeper
 * @description Keeps the on-screen keyboard of a mobile browser open while one exercise
 * input is replaced by another (next word, next Learn Words step).
 *
 * A mobile browser closes the keyboard as soon as the focused input leaves the DOM, and
 * iOS Safari opens it again only when `focus()` runs inside a tap — never from a timer or
 * after a network request. Focus that moves straight from one text field to another keeps
 * the keyboard up, so before an exercise input unmounts it parks focus on a hidden input
 * here, and the next input's `autoFocus` takes focus over from it.
 *
 * Parking works only while a session page has armed the keeper (`useKeyboardKeeper`), so
 * a page whose last screen is a text input does not leave the keyboard open on the
 * results page. A park that no input takes over is released after `PARK_TIMEOUT_MS`.
 */

const PARK_TIMEOUT_MS = 5000;

let armedCount = 0;
let keeper: HTMLInputElement | null = null;
let releaseTimer: ReturnType<typeof setTimeout> | null = null;

function getKeeper(): HTMLInputElement {
  if (keeper?.isConnected) return keeper;
  const el = document.createElement('input');
  el.type = 'text';
  el.tabIndex = -1;
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('autocomplete', 'off');
  el.setAttribute('autocorrect', 'off');
  el.setAttribute('autocapitalize', 'none');
  el.spellcheck = false;
  // 16px stops iOS from zooming in on focus; fixed at the top so focusing it never scrolls.
  // It must stay rendered (no display:none / zero size), or iOS will not keep the keyboard.
  el.style.cssText =
    'position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0;font-size:16px;pointer-events:none;';
  document.body.appendChild(el);
  keeper = el;
  return el;
}

/** Arms the keeper; returns the function that disarms it. Used by `useKeyboardKeeper`. */
export function armKeyboardKeeper(): () => void {
  armedCount += 1;
  return () => {
    armedCount -= 1;
    releaseKeyboard();
  };
}

/**
 * Moves focus from `input` to the hidden keeper input so the keyboard stays open while
 * `input` unmounts. Does nothing unless the keeper is armed and `input` has focus.
 * Call it before the input is removed from the DOM (a `useLayoutEffect` cleanup).
 */
export function parkKeyboard(input: HTMLElement | null): void {
  if (armedCount === 0 || !input || document.activeElement !== input) return;
  getKeeper().focus({ preventScroll: true });
  if (releaseTimer) clearTimeout(releaseTimer);
  releaseTimer = setTimeout(releaseKeyboard, PARK_TIMEOUT_MS);
}

/** Closes the keyboard if focus is still parked on the keeper. */
export function releaseKeyboard(): void {
  if (releaseTimer) {
    clearTimeout(releaseTimer);
    releaseTimer = null;
  }
  if (keeper && document.activeElement === keeper) keeper.blur();
}
