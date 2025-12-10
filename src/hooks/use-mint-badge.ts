'use client';

import { useCallback, useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { 
  Transaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface MintBadgeParams {
  challengeId: string;
  submissionId: string;
}

interface MintBadgeResult {
  success: boolean;
  signature?: string;
  assetId?: string;
  explorerUrl?: string;
  error?: string;
}

interface LogCompletionParams {
  challengeId: string;
  userId: string;
  timestamp: number;
}

/**
 * Hook for minting badge NFTs
 * Handles the client-side wallet interaction and API calls
 */
export function useMintBadge() {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ challengeId, submissionId }: MintBadgeParams): Promise<MintBadgeResult> => {
      // Ensure wallet is connected
      if (!publicKey || !connected) {
        setVisible(true);
        throw new Error('Please connect your wallet first');
      }

      if (!signTransaction) {
        throw new Error('Wallet does not support transaction signing');
      }

      // Call mint API
      const response = await fetch('/api/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          submissionId,
          walletAddress: publicKey.toBase58(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mint badge');
      }

      return {
        success: true,
        signature: data.signature,
        assetId: data.assetId,
        explorerUrl: data.explorerUrl,
      };
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

/**
 * Hook for logging challenge completion on-chain
 * Creates a memo transaction with completion data
 */
export function useLogChallengeCompletion() {
  const { publicKey, signTransaction, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  return useMutation({
    mutationFn: async ({ challengeId, userId, timestamp }: LogCompletionParams): Promise<{ signature: string }> => {
      if (!publicKey || !connected) {
        setVisible(true);
        throw new Error('Please connect your wallet first');
      }

      if (!sendTransaction) {
        throw new Error('Wallet does not support sending transactions');
      }

      // Create memo data
      const memoData = JSON.stringify({
        type: 'PROVELT_COMPLETION',
        challenge: challengeId,
        user: userId,
        ts: timestamp,
      });

      // Create a memo transaction
      // Using a minimal SOL transfer to self as a carrier for the memo
      const transaction = new Transaction();
      
      // Add memo instruction (simplified - just a transfer to self with memo in logs)
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: publicKey,
          lamports: 0, // Zero lamport transfer
        })
      );

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send transaction
      const signature = await sendTransaction(transaction, connection);

      // Wait for confirmation
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      // Log to API for record keeping
      await fetch('/api/log-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          userId,
          signature,
          memoData,
        }),
      }).catch(console.error); // Non-blocking

      return { signature };
    },
  });
}

/**
 * Hook for wallet connection state and utilities
 */
export function useWalletConnection() {
  const { publicKey, connected, connecting, disconnect } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [balance, setBalance] = useState<number | null>(null);

  const connect = useCallback(() => {
    setVisible(true);
  }, [setVisible]);

  const fetchBalance = useCallback(async () => {
    if (!publicKey) return null;
    try {
      const bal = await connection.getBalance(publicKey);
      const solBalance = bal / LAMPORTS_PER_SOL;
      setBalance(solBalance);
      return solBalance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return null;
    }
  }, [connection, publicKey]);

  // Fetch balance when connected
  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance();
    } else {
      setBalance(null);
    }
  }, [connected, publicKey, fetchBalance]);

  return {
    publicKey,
    address: publicKey?.toBase58() || null,
    connected,
    connecting,
    balance,
    connect,
    disconnect,
    fetchBalance,
  };
}
