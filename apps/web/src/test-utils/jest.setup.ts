import { TextEncoder, TextDecoder } from 'node:util';

import '@testing-library/jest-dom';

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
}

// Floating UI (used by Base UI popups: DropdownMenu, Select, Dialog…) probes
// `element.matches(':modal')` / `':popover-open'` while positioning. jsdom's
// selector engine (nwsapi) implements `:modal` by re-matching `:fullscreen`
// against the whole tree, which turns a single menu open into ~20 s of CPU.
// None of these top-layer states exist in jsdom, so answer `false` directly.
const TOP_LAYER_PSEUDO = /^:(modal|popover-open|fullscreen)$/;
const originalMatches = Element.prototype.matches;
Element.prototype.matches = function matches(selectors: string) {
  if (TOP_LAYER_PSEUDO.test(selectors)) return false;
  return originalMatches.call(this, selectors);
};

// jsdom has no `matchMedia`; the theme code resolves SYSTEM against it.
// Default to a light OS scheme, individual tests can override `matches`.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
