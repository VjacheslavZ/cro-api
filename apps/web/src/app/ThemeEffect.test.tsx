import { renderWithProviders } from '../test-utils/renderWithProviders';
import { ThemeEffect } from './ThemeEffect';

describe('ThemeEffect', () => {
  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('adds the dark class for the DARK preference', () => {
    renderWithProviders(<ThemeEffect />, {
      preferences: { speechEnabled: true, theme: 'DARK' },
    });
    expect(document.documentElement).toHaveClass('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('removes the dark class for LIGHT', () => {
    document.documentElement.classList.add('dark');
    renderWithProviders(<ThemeEffect />, {
      preferences: { speechEnabled: true, theme: 'LIGHT' },
    });
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('follows the OS scheme for SYSTEM', () => {
    const matchMedia = window.matchMedia as jest.Mock;
    const original = matchMedia.getMockImplementation();
    const darkMql = {
      matches: true,
      media: '(prefers-color-scheme: dark)',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    matchMedia.mockImplementation(() => darkMql);
    try {
      renderWithProviders(<ThemeEffect />, {
        preferences: { speechEnabled: true, theme: 'SYSTEM' },
      });
      expect(document.documentElement).toHaveClass('dark');
    } finally {
      matchMedia.mockImplementation(original);
    }
  });
});
