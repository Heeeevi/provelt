import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';

// Network configuration
export const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet') as 'devnet' | 'mainnet-beta' | 'testnet';

// RPC endpoint
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(SOLANA_NETWORK);

// Exported config object for easy access
export const solanaConfig = {
  network: SOLANA_NETWORK,
  rpcUrl: SOLANA_RPC_URL,
} as const;

// Create connection instance
export function getConnection(): Connection {
  return new Connection(SOLANA_RPC_URL, 'confirmed');
}

// Helper to safely create PublicKey
function safePublicKey(address: string | undefined): PublicKey | null {
  if (!address || address.startsWith('your_')) return null;
  try {
    return new PublicKey(address);
  } catch {
    return null;
  }
}

// Merkle tree address for compressed NFTs
export const MERKLE_TREE_ADDRESS = safePublicKey(process.env.NEXT_PUBLIC_MERKLE_TREE_ADDRESS);

// Collection NFT address
export const COLLECTION_ADDRESS = safePublicKey(process.env.NEXT_PUBLIC_COLLECTION_ADDRESS);

// Explorer URLs
export function getExplorerUrl(signature: string, type: 'tx' | 'address' = 'tx'): string {
  const base = SOLANA_NETWORK === 'mainnet-beta' 
    ? 'https://explorer.solana.com' 
    : 'https://explorer.solana.com';
  const cluster = SOLANA_NETWORK === 'mainnet-beta' ? '' : `?cluster=${SOLANA_NETWORK}`;
  return `${base}/${type}/${signature}${cluster}`;
}

// Validate Solana address
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}
