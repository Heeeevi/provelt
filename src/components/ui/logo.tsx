'use client';

import Image from 'next/image';
import Link from 'next/link';
import { LOGO_URL, APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  linkToHome?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { image: 'w-8 h-8', text: 'text-lg' },
  md: { image: 'w-12 h-12', text: 'text-xl' },
  lg: { image: 'w-16 h-16', text: 'text-2xl' },
  xl: { image: 'w-24 h-24', text: 'text-4xl' },
};

export function Logo({ 
  size = 'md', 
  showText = true, 
  linkToHome = true,
  className 
}: LogoProps) {
  const { image: imageSize, text: textSize } = sizeMap[size];

  const content = (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Logo Image */}
      <div className={cn(
        'relative rounded-xl overflow-hidden shadow-lg shadow-brand-500/20 ring-1 ring-brand-500/30 shrink-0',
        imageSize
      )}>
        <Image
          src={LOGO_URL}
          alt={`${APP_NAME} Logo`}
          fill
          className="object-cover"
        />
      </div>
      
      {/* Logo Text */}
      {showText && (
        <span className={cn('font-bold', textSize)}>
          <span className="gradient-text">PROVE</span>
          <span className="text-white">LT</span>
        </span>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link href="/" className="hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

// Small logo icon only (for bottom nav, etc.)
export function LogoIcon({ 
  size = 'sm',
  className 
}: { 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClass = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  return (
    <div className={cn(
      'relative rounded-lg overflow-hidden shadow-md shadow-brand-500/20 ring-1 ring-brand-500/20',
      sizeClass[size],
      className
    )}>
      <Image
        src={LOGO_URL}
        alt={APP_NAME}
        fill
        className="object-cover"
      />
    </div>
  );
}
