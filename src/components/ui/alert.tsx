'use client';

import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

type AlertVariant = 'default' | 'info' | 'success' | 'warning' | 'destructive' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<AlertVariant, string> = {
  default: 'bg-surface-800/50 border-surface-700 text-surface-200',
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  success: 'bg-brand-500/10 border-brand-500/30 text-brand-400',
  warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  destructive: 'bg-red-500/10 border-red-500/30 text-red-400',
  error: 'bg-red-500/10 border-red-500/30 text-red-400',
};

const variantIcons: Record<AlertVariant, React.ReactNode> = {
  default: <Info className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />,
  success: <CheckCircle className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  destructive: <AlertCircle className="h-5 w-5" />,
  error: <AlertCircle className="h-5 w-5" />,
};

export function Alert({ variant = 'default', title, children, className }: AlertProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4 flex gap-3',
        variantStyles[variant],
        className
      )}
      role="alert"
    >
      <div className="flex-shrink-0">{variantIcons[variant]}</div>
      <div className="flex-1">
        {title && <AlertTitle>{title}</AlertTitle>}
        {children && <AlertDescription>{children}</AlertDescription>}
      </div>
    </div>
  );
}

export function AlertTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5 
      className={cn('font-medium mb-1 leading-none tracking-tight', className)} 
      {...props}
    >
      {children}
    </h5>
  );
}

export function AlertDescription({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn('text-sm opacity-90', className)} 
      {...props}
    >
      {children}
    </div>
  );
}
