import type { ReactNode } from 'react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/** Full-screen gradient backdrop with the CroGrammar mark, shared by the pre-app auth screens. */
export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page-gradient p-4">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary">
          <span className="text-[26px] leading-none font-bold text-primary-foreground">C</span>
        </div>
        <h1 className="mb-1 text-2xl font-bold text-foreground">{title}</h1>
        <p className="mx-auto max-w-[420px] text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
