'use client';

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useEffect, useState, useCallback } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  RefreshCw, 
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, truncateAddress, getExplorerUrl } from '@/lib/utils';
import { SOLANA_NETWORK } from '@/lib/solana';

interface WalletInfoProps {
  className?: string;
  showRefresh?: boolean;
  showExplorer?: boolean;
}

export function WalletInfo({ 
  className, 
  showRefresh = true,
  showExplorer = true 
}: WalletInfoProps) {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const bal = await connection.getBalance(publicKey);
      setBalance(bal / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey]);

  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance();
    }
  }, [connected, publicKey, fetchBalance]);

  if (!connected || !publicKey) {
    return (
      <Card className={cn('bg-surface-800/50 border-surface-700', className)}>
        <CardContent className="py-8 text-center">
          <Wallet className="w-12 h-12 mx-auto text-surface-500 mb-4" />
          <p className="text-surface-400">Connect your wallet to view info</p>
        </CardContent>
      </Card>
    );
  }

  const explorerUrl = getExplorerUrl(publicKey.toBase58(), 'address', SOLANA_NETWORK);

  return (
    <Card className={cn('bg-surface-800/50 border-surface-700', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Connected Wallet
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {SOLANA_NETWORK}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address */}
        <div>
          <p className="text-xs text-surface-500 mb-1">Address</p>
          <p className="font-mono text-sm text-white">
            {truncateAddress(publicKey.toBase58(), 8)}
          </p>
        </div>

        {/* Balance */}
        <div>
          <p className="text-xs text-surface-500 mb-1">Balance</p>
          <div className="flex items-center gap-2">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-surface-400" />
            ) : error ? (
              <span className="text-red-400 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </span>
            ) : (
              <span className="text-xl font-semibold text-white">
                {balance?.toFixed(4)} SOL
              </span>
            )}
            {showRefresh && (
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchBalance}
                disabled={loading}
                className="h-8 w-8"
              >
                <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
              </Button>
            )}
          </div>
        </div>

        {/* Explorer Link */}
        {showExplorer && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300',
              'transition-colors'
            )}
          >
            <ExternalLink className="w-4 h-4" />
            View on Solana Explorer
          </a>
        )}
      </CardContent>
    </Card>
  );
}
