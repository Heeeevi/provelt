'use client';

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useCallback, useMemo } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { truncateAddress, getExplorerUrl } from '@/lib/utils';
import { SOLANA_NETWORK } from '@/lib/solana';

export function useSolanaWallet() {
  const { connection } = useConnection();
  const {
    publicKey,
    connected,
    connecting,
    disconnect,
    select,
    wallet,
    wallets,
    signMessage,
    signTransaction,
    signAllTransactions,
  } = useWallet();

  const address = useMemo(() => {
    return publicKey?.toBase58() || null;
  }, [publicKey]);

  const truncatedAddress = useMemo(() => {
    return address ? truncateAddress(address) : null;
  }, [address]);

  const getBalance = useCallback(async () => {
    if (!publicKey) return 0;
    try {
      const balance = await connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
  }, [connection, publicKey]);

  const explorerUrl = useMemo(() => {
    if (!address) return null;
    return getExplorerUrl(address, 'address');
  }, [address]);

  return {
    // State
    publicKey,
    address,
    truncatedAddress,
    connected,
    connecting,
    wallet,
    wallets,
    network: SOLANA_NETWORK,
    explorerUrl,

    // Actions
    disconnect,
    select,
    getBalance,
    signMessage,
    signTransaction,
    signAllTransactions,
  };
}
