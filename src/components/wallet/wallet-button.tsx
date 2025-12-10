'use client';

import { useCallback, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  ChevronDown, 
  Copy, 
  ExternalLink, 
  LogOut,
  Check,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSolanaWallet } from '@/hooks/use-solana-wallet';

interface WalletButtonProps {
  className?: string;
  showBalance?: boolean;
}

export function WalletButton({ className, showBalance = false }: WalletButtonProps) {
  const { setVisible } = useWalletModal();
  const { connected, connecting, publicKey } = useWallet();
  const { truncatedAddress, explorerUrl, disconnect, getBalance } = useSolanaWallet();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const handleConnect = useCallback(() => {
    setVisible(true);
  }, [setVisible]);

  const handleCopyAddress = useCallback(async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [publicKey]);

  const handleFetchBalance = useCallback(async () => {
    if (!loadingBalance) {
      setLoadingBalance(true);
      const bal = await getBalance();
      setBalance(bal);
      setLoadingBalance(false);
    }
  }, [getBalance, loadingBalance]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    setIsDropdownOpen(false);
    setBalance(null);
  }, [disconnect]);

  // Not connected - show connect button
  if (!connected) {
    return (
      <Button
        onClick={handleConnect}
        disabled={connecting}
        className={cn(
          'bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700',
          'text-white font-medium',
          className
        )}
      >
        {connecting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </>
        )}
      </Button>
    );
  }

  // Connected - show wallet dropdown
  return (
    <div className="relative">
      <Button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        variant="outline"
        className={cn(
          'border-surface-700 bg-surface-800/50 hover:bg-surface-800',
          'text-white font-medium',
          className
        )}
      >
        <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
        {truncatedAddress}
        <ChevronDown className={cn(
          'w-4 h-4 ml-2 transition-transform',
          isDropdownOpen && 'rotate-180'
        )} />
      </Button>

      <AnimatePresence>
        {isDropdownOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsDropdownOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'absolute right-0 top-full mt-2 z-50',
                'w-64 rounded-xl overflow-hidden',
                'bg-surface-800 border border-surface-700',
                'shadow-xl shadow-black/20'
              )}
            >
              {/* Wallet Info */}
              <div className="p-4 border-b border-surface-700">
                <p className="text-sm text-surface-400 mb-1">Connected Wallet</p>
                <p className="font-mono text-sm text-white break-all">
                  {publicKey?.toBase58()}
                </p>
                
                {showBalance && (
                  <div className="mt-3">
                    <p className="text-sm text-surface-400 mb-1">Balance</p>
                    {balance !== null ? (
                      <p className="text-lg font-semibold text-white">
                        {balance.toFixed(4)} SOL
                      </p>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleFetchBalance}
                        disabled={loadingBalance}
                        className="text-brand-400 hover:text-brand-300 p-0 h-auto"
                      >
                        {loadingBalance ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'View Balance'
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-2">
                <button
                  onClick={handleCopyAddress}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
                    'text-surface-300 hover:text-white hover:bg-surface-700/50',
                    'transition-colors text-sm'
                  )}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copied ? 'Copied!' : 'Copy Address'}
                </button>

                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
                      'text-surface-300 hover:text-white hover:bg-surface-700/50',
                      'transition-colors text-sm'
                    )}
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Explorer
                  </a>
                )}

                <button
                  onClick={handleDisconnect}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
                    'text-red-400 hover:text-red-300 hover:bg-red-500/10',
                    'transition-colors text-sm'
                  )}
                >
                  <LogOut className="w-4 h-4" />
                  Disconnect
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
