/**
 * Compressed NFT Minting Module
 * 
 * Uses Metaplex Bubblegum for minting compressed NFTs (cNFTs)
 * which are cost-effective for large-scale badge distribution.
 */

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { 
  mplBubblegum,
  mintToCollectionV1,
  type LeafSchema,
} from '@metaplex-foundation/mpl-bubblegum';
import { 
  createSignerFromKeypair,
  signerIdentity,
  publicKey,
  type Umi,
  type Signer,
} from '@metaplex-foundation/umi';
import { createNoopSigner } from '@metaplex-foundation/umi';
import bs58 from 'bs58';
import { SOLANA_RPC_URL, SOLANA_NETWORK, MERKLE_TREE_ADDRESS, COLLECTION_ADDRESS } from './config';

// Types for NFT metadata
export interface BadgeMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  externalUrl?: string;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
  properties: {
    category: string;
    creators: {
      address: string;
      share: number;
    }[];
  };
}

export interface MintBadgeParams {
  recipientAddress: string;
  merkleTreeAddress: string;
  collectionAddress: string;
  metadata: BadgeMetadata;
  treasuryPrivateKey?: string;
}

export interface MintBadgeResult {
  success: boolean;
  signature?: string;
  assetId?: string;
  error?: string;
}

/**
 * Create badge metadata for a challenge completion
 */
export function createBadgeMetadata(params: {
  challengeTitle: string;
  challengeCategory: string;
  difficulty: string;
  completedAt: string;
  imageUrl: string;
  creatorAddress: string;
}): BadgeMetadata {
  return {
    name: `PROVELT: ${params.challengeTitle}`,
    symbol: 'PRVLT',
    description: `Badge earned for completing the "${params.challengeTitle}" challenge on PROVELT.`,
    image: params.imageUrl,
    externalUrl: 'https://provelt.app',
    attributes: [
      { trait_type: 'Challenge', value: params.challengeTitle },
      { trait_type: 'Category', value: params.challengeCategory },
      { trait_type: 'Difficulty', value: params.difficulty },
      { trait_type: 'Completed', value: params.completedAt },
      { trait_type: 'Platform', value: 'PROVELT' },
    ],
    properties: {
      category: 'badge',
      creators: [
        {
          address: params.creatorAddress,
          share: 100,
        },
      ],
    },
  };
}

/**
 * Initialize Umi instance for client-side operations
 */
export function createUmiClient(): Umi {
  return createUmi(SOLANA_RPC_URL).use(mplBubblegum());
}

/**
 * Initialize Umi with treasury signer for server-side minting
 */
export function createUmiServer(treasuryPrivateKey: string): Umi {
  const umi = createUmi(SOLANA_RPC_URL).use(mplBubblegum());
  
  // Decode the base58 private key
  const secretKey = bs58.decode(treasuryPrivateKey);
  
  // Create keypair from secret key
  const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
  const signer = createSignerFromKeypair(umi, keypair);
  
  return umi.use(signerIdentity(signer));
}

/**
 * Mint a compressed NFT badge
 * This should only be called server-side with proper treasury key
 */
export async function mintCompressedNFT(
  params: MintBadgeParams
): Promise<MintBadgeResult> {
  const { 
    recipientAddress, 
    merkleTreeAddress, 
    collectionAddress, 
    metadata,
    treasuryPrivateKey 
  } = params;

  // Validate treasury key exists
  if (!treasuryPrivateKey) {
    return {
      success: false,
      error: 'Treasury private key not configured',
    };
  }

  try {
    // Initialize Umi with treasury signer
    const umi = createUmiServer(treasuryPrivateKey);

    // Prepare addresses
    const merkleTree = publicKey(merkleTreeAddress);
    const collection = publicKey(collectionAddress);
    const leafOwner = publicKey(recipientAddress);

    // Mint the compressed NFT to collection
    const { signature } = await mintToCollectionV1(umi, {
      leafOwner,
      merkleTree,
      collectionMint: collection,
      metadata: {
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.image, // In production, this would be an uploaded metadata JSON URI
        sellerFeeBasisPoints: 0,
        collection: { key: collection, verified: false },
        creators: metadata.properties.creators.map(c => ({
          address: publicKey(c.address),
          verified: false,
          share: c.share,
        })),
      },
    }).sendAndConfirm(umi);

    // Convert signature to base58 string
    const signatureStr = bs58.encode(signature);

    return {
      success: true,
      signature: signatureStr,
      // Asset ID would need to be derived from the merkle tree leaf
      assetId: signatureStr, // Simplified - in production, derive actual asset ID
    };
  } catch (error) {
    console.error('Mint error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown minting error',
    };
  }
}

/**
 * Upload metadata to decentralized storage (placeholder)
 * In production, use Arweave, IPFS, or similar
 */
export async function uploadMetadata(metadata: BadgeMetadata): Promise<string> {
  // TODO: Implement actual metadata upload to Arweave/IPFS
  // For now, return a placeholder URI
  const metadataJson = JSON.stringify(metadata);
  const base64 = Buffer.from(metadataJson).toString('base64');
  return `data:application/json;base64,${base64}`;
}

/**
 * Get configuration status for minting
 */
export function getMintingConfig(): {
  configured: boolean;
  merkleTree: string | null;
  collection: string | null;
  network: string;
} {
  return {
    configured: !!(MERKLE_TREE_ADDRESS && COLLECTION_ADDRESS),
    merkleTree: MERKLE_TREE_ADDRESS?.toBase58() || null,
    collection: COLLECTION_ADDRESS?.toBase58() || null,
    network: SOLANA_NETWORK,
  };
}
