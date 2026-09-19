import type { ReactNode } from 'react';
import { cn } from 'cn';

interface EmptyStateProps {
  /** A lucide icon element; sized and coloured by this component. */
  icon: ReactNode;
  title: string;
  description?: string;
  className?: string;
}

/** Centered "nothing here" placeholder: muted icon disc, title, optional description. */
export function EmptyState({ icon, title, description, className }: EmptyStateProps) {
  return (
    <div className={cn('py-16 text-center', className)}>
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground/70 [&_svg]:size-8">
        {icon}
      </div>
      <h3 className="mb-1 text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
