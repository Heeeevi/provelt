/**
 * Solana RPC Connection Management
 * Best practices for reliable RPC connections
 */

import { Connection, Commitment, ConnectionConfig } from '@solana/web3.js';
import { solanaConfig } from './config';

// Type for supported networks
type NetworkType = 'devnet' | 'mainnet-beta' | 'testnet';

// RPC endpoints with fallbacks
const RPC_ENDPOINTS: Record<NetworkType, string[]> = {
  devnet: [
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    'https://devnet.helius-rpc.com/?api-key=demo',
    'https://rpc.ankr.com/solana_devnet',
  ],
  'mainnet-beta': [
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    'https://solana-mainnet.g.alchemy.com/v2/demo',
    'https://rpc.ankr.com/solana',
  ],
  testnet: [
    'https://api.testnet.solana.com',
  ],
};

// Connection configuration optimized for dApps
const CONNECTION_CONFIG: ConnectionConfig = {
  commitment: 'confirmed' as Commitment,
  confirmTransactionInitialTimeout: 60000, // 60 seconds
  disableRetryOnRateLimit: false,
};

// Connection pool for reuse
let connectionPool: Map<string, Connection> = new Map();
let currentEndpointIndex = 0;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

/**
 * Get available RPC endpoints for current network
 */
export function getAvailableEndpoints(): string[] {
  const network = solanaConfig.network as NetworkType;
  return RPC_ENDPOINTS[network] || RPC_ENDPOINTS.devnet;
}

/**
 * Get or create a connection from the pool
 */
export function getConnection(endpoint?: string): Connection {
  const url = endpoint || getAvailableEndpoints()[currentEndpointIndex];
  
  if (!connectionPool.has(url)) {
    connectionPool.set(url, new Connection(url, CONNECTION_CONFIG));
  }
  
  return connectionPool.get(url)!;
}

/**
 * Get the primary connection (with automatic failover)
 */
export function getPrimaryConnection(): Connection {
  return getConnection();
}

/**
 * Check if an endpoint is healthy
 */
async function checkEndpointHealth(endpoint: string): Promise<boolean> {
  try {
    const connection = new Connection(endpoint, { commitment: 'processed' });
    const blockHeight = await Promise.race([
      connection.getBlockHeight(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 5000)
      ),
    ]);
    return blockHeight > 0;
  } catch {
    return false;
  }
}

/**
 * Find the best available endpoint
 */
export async function findBestEndpoint(): Promise<string> {
  const endpoints = getAvailableEndpoints();
  
  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    if (await checkEndpointHealth(endpoint)) {
      currentEndpointIndex = i;
      return endpoint;
    }
  }
  
  // Fall back to first endpoint if all checks fail
  return endpoints[0];
}

/**
 * Execute with automatic retry and failover
 */
export async function executeWithRetry<T>(
  operation: (connection: Connection) => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    failover?: boolean;
  } = {}
): Promise<T> {
  const { maxRetries = 3, retryDelay = 1000, failover = true } = options;
  const endpoints = getAvailableEndpoints();
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const endpointIndex = failover 
      ? (currentEndpointIndex + attempt) % endpoints.length 
      : currentEndpointIndex;
    const endpoint = endpoints[endpointIndex];
    const connection = getConnection(endpoint);
    
    try {
      return await operation(connection);
    } catch (error) {
      lastError = error as Error;
      console.warn(`RPC attempt ${attempt + 1} failed for ${endpoint}:`, error);
      
      // Check if it's a rate limit error
      if (isRateLimitError(error)) {
        // Wait longer for rate limit errors
        await sleep(retryDelay * 2 * (attempt + 1));
      } else {
        await sleep(retryDelay * (attempt + 1));
      }
      
      // Update current endpoint on failover
      if (failover && attempt < endpoints.length - 1) {
        currentEndpointIndex = (currentEndpointIndex + 1) % endpoints.length;
      }
    }
  }
  
  throw lastError || new Error('All RPC attempts failed');
}

/**
 * Check if error is a rate limit error
 */
function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('429') ||
      message.includes('rate limit') ||
      message.includes('too many requests')
    );
  }
  return false;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Confirm transaction with polling
 */
export async function confirmTransactionWithRetry(
  connection: Connection,
  signature: string,
  commitment: Commitment = 'confirmed',
  maxRetries = 30,
  pollInterval = 2000
): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const status = await connection.getSignatureStatus(signature);
      
      if (status?.value?.confirmationStatus === commitment || 
          status?.value?.confirmationStatus === 'finalized') {
        if (status.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
        }
        return true;
      }
      
      // Transaction might have expired
      if (status?.value === null && i > 5) {
        const tx = await connection.getTransaction(signature, {
          maxSupportedTransactionVersion: 0,
        });
        if (tx) return true;
      }
      
    } catch (error) {
      console.warn(`Confirmation check ${i + 1} failed:`, error);
    }
    
    await sleep(pollInterval);
  }
  
  return false;
}

/**
 * Get recent blockhash with retry
 */
export async function getRecentBlockhashWithRetry(
  connection: Connection
): Promise<{ blockhash: string; lastValidBlockHeight: number }> {
  return executeWithRetry(
    async (conn) => {
      const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash('finalized');
      return { blockhash, lastValidBlockHeight };
    },
    { maxRetries: 3, failover: true }
  );
}

/**
 * Prefetch connection for faster subsequent calls
 */
export async function prefetchConnection(): Promise<void> {
  const now = Date.now();
  if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL) return;
  
  lastHealthCheck = now;
  
  try {
    await findBestEndpoint();
  } catch (error) {
    console.warn('Prefetch connection failed:', error);
  }
}

/**
 * Clear connection pool (useful for testing or reconnection)
 */
export function clearConnectionPool(): void {
  connectionPool.clear();
  currentEndpointIndex = 0;
  lastHealthCheck = 0;
}

/**
 * Get connection stats for debugging
 */
export function getConnectionStats(): {
  poolSize: number;
  currentEndpoint: string;
  availableEndpoints: string[];
} {
  const endpoints = getAvailableEndpoints();
  return {
    poolSize: connectionPool.size,
    currentEndpoint: endpoints[currentEndpointIndex],
    availableEndpoints: endpoints,
  };
}
