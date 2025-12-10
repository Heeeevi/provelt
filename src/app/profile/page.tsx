'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Loader2 } from 'lucide-react';

/**
 * Profile Index Page
 * Redirects to the current user's profile or login if not authenticated
 */
export default function ProfileIndexPage() {
  const router = useRouter();
  const { userId, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && userId) {
        router.replace(`/profile/${userId}`);
      } else {
        // Not logged in - redirect to login
        router.replace('/auth/login');
      }
    }
  }, [userId, isAuthenticated, isLoading, router]);

  return (
    <main className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-surface-400">Loading profile...</p>
      </div>
    </main>
  );
}
