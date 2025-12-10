/**
 * On-Chain Logging Module
 * 
 * Provides utilities for logging challenge completions and other events
 * on the Solana blockchain for permanent, verifiable records.
 */

import { 
  Connection, 
  Transaction, 
  TransactionInstruction,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';
import { SOLANA_RPC_URL, SOLANA_NETWORK, getExplorerUrl } from './config';

// Memo program ID (official Solana Memo program)
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

export interface OnChainLogData {
  type: 'PROVELT_COMPLETION' | 'PROVELT_BADGE' | 'PROVELT_CHALLENGE';
  challengeId: string;
  userId: string;
  timestamp: number;
  submissionId?: string;
  badgeId?: string;
  metadata?: Record<string, any>;
}

export interface LogResult {
  success: boolean;
  signature?: string;
  explorerUrl?: string;
  error?: string;
}

/**
 * Create a memo instruction for on-chain logging
 */
export function createMemoInstruction(
  data: OnChainLogData,
  signerPublicKey: PublicKey
): TransactionInstruction {
  // Serialize the data as JSON
  const memoString = JSON.stringify(data);
  
  return new TransactionInstruction({
    keys: [{ pubkey: signerPublicKey, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memoString, 'utf-8'),
  });
}

/**
 * Create a transaction with memo for logging
 */
export function createLogTransaction(
  data: OnChainLogData,
  feePayer: PublicKey
): Transaction {
  const transaction = new Transaction();
  
  // Add memo instruction
  transaction.add(createMemoInstruction(data, feePayer));
  
  return transaction;
}

/**
 * Verify a logged transaction on-chain
 */
export async function verifyOnChainLog(signature: string): Promise<{
  verified: boolean;
  data?: OnChainLogData;
  timestamp?: number;
  error?: string;
}> {
  try {
    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });
    
    if (!tx) {
      return { verified: false, error: 'Transaction not found' };
    }

    // Look for memo instruction in the transaction
    const logMessages = tx.meta?.logMessages || [];
    let memoData: OnChainLogData | undefined;
    
    for (const log of logMessages) {
      if (log.includes('PROVELT_')) {
        try {
          // Extract JSON from log message
          const jsonMatch = log.match(/\{.*\}/);
          if (jsonMatch) {
            memoData = JSON.parse(jsonMatch[0]);
          }
        } catch {
          // Not valid JSON, continue
        }
      }
    }

    return {
      verified: true,
      data: memoData,
      timestamp: tx.blockTime ? tx.blockTime * 1000 : undefined,
    };
  } catch (error) {
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * Get all PROVELT logs for a specific user
 */
export async function getUserOnChainLogs(
  userSignatures: string[]
): Promise<Array<{ signature: string; data?: OnChainLogData; timestamp?: number }>> {
  const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
  const results: Array<{ signature: string; data?: OnChainLogData; timestamp?: number }> = [];

  for (const signature of userSignatures) {
    const verification = await verifyOnChainLog(signature);
    if (verification.verified) {
      results.push({
        signature,
        data: verification.data,
        timestamp: verification.timestamp,
      });
    }
  }

  return results;
}

/**
 * Format log data for display
 */
export function formatLogData(data: OnChainLogData): string {
  switch (data.type) {
    case 'PROVELT_COMPLETION':
      return `Challenge ${data.challengeId} completed by ${data.userId.slice(0, 8)}...`;
    case 'PROVELT_BADGE':
      return `Badge ${data.badgeId} minted for challenge ${data.challengeId}`;
    case 'PROVELT_CHALLENGE':
      return `Challenge ${data.challengeId} created`;
    default:
      return `PROVELT event: ${data.type}`;
  }
}

/**
 * Get explorer URL for a transaction
 */
export function getTransactionExplorerUrl(signature: string): string {
  return getExplorerUrl(signature, 'tx');
}
