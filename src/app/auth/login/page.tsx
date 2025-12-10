'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Wallet, 
  ChevronLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase/client';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { LOGO_URL, APP_NAME } from '@/lib/constants';

/**
 * Login Page
 * Supabase Auth login with email magic link or wallet
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { publicKey, connected, signMessage } = useWallet();
  const { setVisible } = useWalletModal();

  // Handle magic link login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        // Provide more helpful error messages
        if (error.message.includes('Database error')) {
          throw new Error('Email service is not configured. Please try connecting with your wallet instead, or contact support.');
        }
        throw error;
      }
      setIsSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle wallet login - simplified: just connect and redirect
  const handleWalletLogin = async () => {
    setError(null);
    
    if (!connected) {
      try {
        setVisible(true);
      } catch (err) {
        setError('Failed to open wallet modal. Please make sure you have a Solana wallet installed.');
      }
      return;
    }

    // Already connected - just redirect to feed
    if (publicKey) {
      console.log('Wallet connected:', publicKey.toString());
      router.push('/feed');
      return;
    }

    setError('Wallet connection pending. Please try again.');
  };

  // Success state - magic link sent
  if (isSent) {
    return (
      <main className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-brand-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
              <p className="text-surface-400 mb-6">
                We sent a magic link to <span className="text-white">{email}</span>
              </p>
              <p className="text-surface-500 text-sm">
                Click the link in the email to sign in. If you don't see it, check your spam folder.
              </p>
              <Button 
                variant="ghost" 
                className="mt-6"
                onClick={() => setIsSent(false)}
              >
                Use a different email
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-500/10 via-transparent to-transparent" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-surface-400 hover:text-white mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Back to home
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-lg shadow-brand-500/20 ring-1 ring-brand-500/30">
                <Image
                  src={LOGO_URL}
                  alt={`${APP_NAME} Logo`}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="text-2xl font-bold mb-2">
              <span className="gradient-text">PROVE</span>
              <span className="text-white">LT</span>
            </div>
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to continue your journey
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Wallet Login */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleWalletLogin}
              disabled={isLoading}
            >
              <Wallet className="w-4 h-4 mr-2" />
              {connected ? `Connected: ${publicKey?.toString().slice(0, 8)}...` : 'Connect Wallet'}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-surface-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-surface-900 px-2 text-surface-500">or continue with email</span>
              </div>
            </div>

            {/* Email Login */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Magic Link
                  </>
                )}
              </Button>
            </form>

            {/* Terms */}
            <p className="text-xs text-surface-500 text-center">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="text-brand-500 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-brand-500 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
