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
  CheckCircle,
  Sparkles,
  Trophy,
  Users,
  Gift,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
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
 * Email + Password login with optional wallet connection for Web3 features
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showWalletOption, setShowWalletOption] = useState(false);
  
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();

  // Handle email + password login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email atau password salah. Coba lagi atau daftar akun baru.');
        }
        throw error;
      }

      if (data.user) {
        router.push('/feed');
      }
    } catch (err: any) {
      setError(err.message || 'Login gagal');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle email + password signup
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate password
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password tidak sama');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Signup error:', error);
        if (error.message.includes('already registered')) {
          throw new Error('Email sudah terdaftar. Silakan login.');
        }
        throw error;
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        setSuccess('Akun berhasil dibuat! Cek email untuk konfirmasi, atau langsung login.');
        setIsSignUp(false);
        setPassword('');
        setConfirmPassword('');
      } else if (data.session) {
        // Auto-logged in (email confirmation disabled)
        router.push('/feed');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal membuat akun');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle wallet login
  const handleWalletLogin = async () => {
    setError(null);
    
    if (!connected) {
      try {
        setVisible(true);
      } catch (err) {
        setError('Gagal membuka wallet. Pastikan kamu sudah install wallet Solana.');
      }
      return;
    }

    if (publicKey) {
      router.push('/feed');
    }
  };

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
            <CardTitle className="text-xl">
              {isSignUp ? 'Buat Akun Baru' : 'Selamat Datang!'}
            </CardTitle>
            <CardDescription>
              {isSignUp 
                ? 'Daftar gratis dan mulai buktikan skill-mu' 
                : 'Masuk untuk melanjutkan perjalananmu'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Benefits - Why sign up (only show on signup) */}
            {isSignUp && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-surface-400">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span>100% Gratis</span>
                </div>
                <div className="flex items-center gap-2 text-surface-400">
                  <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Dapat XP & badge</span>
                </div>
                <div className="flex items-center gap-2 text-surface-400">
                  <Users className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>Gabung 10K+ user</span>
                </div>
                <div className="flex items-center gap-2 text-surface-400">
                  <Gift className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>Menangkan hadiah</span>
                </div>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <Alert className="bg-green-500/10 border-green-500/20">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <AlertDescription className="text-green-400">{success}</AlertDescription>
              </Alert>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Login/Signup Form */}
            <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 pl-11"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-12 pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Confirm Password (signup only) */}
              {isSignUp && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Konfirmasi Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-12 pl-11"
                  />
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-12 text-base"
                disabled={isLoading || !email || !password || (isSignUp && !confirmPassword)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isSignUp ? 'Membuat akun...' : 'Masuk...'}
                  </>
                ) : (
                  <>
                    {isSignUp ? (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Daftar Sekarang
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Masuk
                      </>
                    )}
                  </>
                )}
              </Button>
            </form>

            {/* Toggle Login/Signup */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setSuccess(null);
                }}
                className="text-sm text-surface-400 hover:text-white transition-colors"
              >
                {isSignUp ? (
                  <>Sudah punya akun? <span className="text-brand-500">Masuk</span></>
                ) : (
                  <>Belum punya akun? <span className="text-brand-500">Daftar gratis</span></>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-surface-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-surface-900 px-2 text-surface-500">atau</span>
              </div>
            </div>

            {/* Wallet Option */}
            {!showWalletOption ? (
              <button
                type="button"
                onClick={() => setShowWalletOption(true)}
                className="w-full text-center text-sm text-surface-500 hover:text-surface-300 transition-colors"
              >
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Punya crypto wallet? Login dengan wallet
                </span>
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-surface-500 text-center">
                  Connect wallet untuk mint NFT badge (opsional)
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleWalletLogin}
                  disabled={isLoading}
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  {connected ? `Connected: ${publicKey?.toString().slice(0, 8)}...` : 'Connect Wallet'}
                </Button>
              </div>
            )}

            {/* Terms */}
            <p className="text-xs text-surface-500 text-center">
              Dengan melanjutkan, kamu setuju dengan{' '}
              <Link href="/terms" className="text-brand-500 hover:underline">
                Syarat & Ketentuan
              </Link>{' '}
              dan{' '}
              <Link href="/privacy" className="text-brand-500 hover:underline">
                Kebijakan Privasi
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
