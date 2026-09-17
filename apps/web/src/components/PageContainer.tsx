import type { ComponentProps } from 'react';
import { cn } from 'cn';

type PageContainerSize = 'sm' | 'md' | 'lg';

const sizeClass: Record<PageContainerSize, string> = {
  sm: 'max-w-[600px]',
  md: 'max-w-[900px]',
  lg: 'max-w-[1200px]',
};

interface PageContainerProps extends ComponentProps<'div'> {
  size?: PageContainerSize;
}

export function PageContainer({ size = 'lg', className, ...props }: PageContainerProps) {
  return (
    <div className={cn('mx-auto w-full px-4 sm:px-6', sizeClass[size], className)} {...props} />
  );
}
