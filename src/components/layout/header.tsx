'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title?: ReactNode;
  showBack?: boolean;
  backHref?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  transparent?: boolean;
  className?: string;
}

export function Header({ 
  title, 
  showBack = false, 
  backHref,
  leftAction,
  rightAction,
  transparent = false,
  className 
}: HeaderProps) {
  const router = useRouter();
  
  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 safe-top',
        transparent 
          ? 'bg-transparent' 
          : 'bg-surface-950/90 backdrop-blur-lg border-b border-surface-800',
        className
      )}
    >
      <div className="w-10">
        {leftAction || (showBack && (
          <Link href={backHref || '/'}>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </Link>
        ))}
      </div>
      
      {title && (
        <h1 className="text-lg font-semibold text-white truncate">
          {title}
        </h1>
      )}
      
      <div className="w-10 flex justify-end">
        {rightAction}
      </div>
    </header>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle && (
            <p className="text-surface-400 mt-1">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}
