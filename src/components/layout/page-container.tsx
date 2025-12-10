'use client';

import { type ReactNode } from 'react';
import { BottomNav } from './bottom-nav';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  showNav?: boolean;
  padTop?: boolean;
  padBottom?: boolean;
  className?: string;
}

export function PageContainer({ 
  children, 
  showNav = true, 
  padTop = true,
  padBottom = true,
  className 
}: PageContainerProps) {
  return (
    <div className={cn('min-h-screen bg-surface-950', className)}>
      <main
        className={cn(
          padTop && 'pt-14',
          padBottom && showNav && 'pb-20'
        )}
      >
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}

interface ContentContainerProps {
  children: ReactNode;
  className?: string;
}

export function ContentContainer({ children, className }: ContentContainerProps) {
  return (
    <div className={cn('max-w-lg mx-auto px-4', className)}>
      {children}
    </div>
  );
}
