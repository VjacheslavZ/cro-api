import type { ReactNode, SVGProps } from 'react';

export type BrandIconProps = Omit<SVGProps<SVGSVGElement>, 'viewBox' | 'children'>;

/**
 * Base for brand glyphs that lucide does not ship (X, YouTube, App Store…).
 * Sized like a lucide icon (1em) and filled with `currentColor`, so it can be
 * placed anywhere a `lucide-react` icon is expected.
 */
export function BrandIcon({ children, ...props }: BrandIconProps & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}
