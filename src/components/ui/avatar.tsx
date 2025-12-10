'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface AvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children?: React.ReactNode;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
  xl: 'h-20 w-20',
};

const iconSizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
  xl: 'h-10 w-10',
};

const textSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg',
  xl: 'text-xl',
};

export function Avatar({ size = 'md', className, children }: AvatarProps) {
  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden bg-surface-800 flex items-center justify-center shrink-0',
        sizeClasses[size],
        className
      )}
    >
      {children}
    </div>
  );
}

interface AvatarImageProps {
  src?: string | null;
  alt?: string;
}

export function AvatarImage({ src, alt = 'Avatar' }: AvatarImageProps) {
  const [error, setError] = useState(false);
  
  if (!src || error) return null;
  
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      onError={() => setError(true)}
    />
  );
}

interface AvatarFallbackProps {
  className?: string;
  children?: React.ReactNode;
}

export function AvatarFallback({ className, children }: AvatarFallbackProps) {
  return (
    <div className={cn('flex items-center justify-center w-full h-full text-surface-400 font-medium', className)}>
      {children || <User className="w-1/2 h-1/2" />}
    </div>
  );
}

interface AvatarGroupProps {
  avatars: { src?: string | null; alt?: string }[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarGroup({ avatars, max = 3, size = 'sm' }: AvatarGroupProps) {
  const displayed = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className="flex -space-x-2">
      {displayed.map((avatar, i) => (
        <Avatar
          key={i}
          size={size}
          className="ring-2 ring-surface-950"
        >
          <AvatarImage src={avatar.src} alt={avatar.alt} />
          <AvatarFallback />
        </Avatar>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'rounded-full bg-surface-700 flex items-center justify-center ring-2 ring-surface-950 text-xs font-medium text-white',
            sizeClasses[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
