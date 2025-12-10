/**
 * NFT Metadata Generator
 * Creates standardized metadata for PROVELT badge NFTs
 * Following Metaplex Token Metadata Standard
 */

import type { BadgeMetadata } from './mint';

export interface MetadataGeneratorParams {
  challengeTitle: string;
  challengeDescription?: string;
  challengeCategory: string;
  challengeDifficulty: string;
  submissionMediaUrl: string;
  submissionCaption?: string;
  userDisplayName: string;
  userWalletAddress: string;
  completedAt: Date;
  challengeId: string;
  submissionId: string;
}

export interface NFTMetadataJson {
  name: string;
  symbol: string;
  description: string;
  image: string;
  animation_url?: string;
  external_url: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
  properties: {
    files: Array<{
      uri: string;
      type: string;
    }>;
    category: string;
    creators: Array<{
      address: string;
      share: number;
    }>;
  };
  collection?: {
    name: string;
    family: string;
  };
}

/**
 * Generate badge NFT name
 */
export function generateBadgeName(challengeTitle: string): string {
  // Truncate if too long (max 32 chars for on-chain)
  const prefix = 'PROVELT: ';
  const maxTitleLength = 32 - prefix.length;
  const truncatedTitle = challengeTitle.length > maxTitleLength
    ? challengeTitle.slice(0, maxTitleLength - 3) + '...'
    : challengeTitle;
  return `${prefix}${truncatedTitle}`;
}

/**
 * Generate badge NFT description
 */
export function generateBadgeDescription(params: {
  challengeTitle: string;
  challengeDescription?: string;
  userDisplayName: string;
  completedAt: Date;
}): string {
  const dateStr = params.completedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  let description = `This badge certifies that ${params.userDisplayName} successfully completed the "${params.challengeTitle}" challenge on PROVELT on ${dateStr}.`;
  
  if (params.challengeDescription) {
    description += `\n\nChallenge: ${params.challengeDescription}`;
  }
  
  return description;
}

/**
 * Generate complete NFT metadata JSON
 */
export function generateNFTMetadata(params: MetadataGeneratorParams): NFTMetadataJson {
  const name = generateBadgeName(params.challengeTitle);
  const description = generateBadgeDescription({
    challengeTitle: params.challengeTitle,
    challengeDescription: params.challengeDescription,
    userDisplayName: params.userDisplayName,
    completedAt: params.completedAt,
  });

  // Determine if media is video
  const isVideo = params.submissionMediaUrl.match(/\.(mp4|webm|mov)$/i);

  const metadata: NFTMetadataJson = {
    name,
    symbol: 'PRVLT',
    description,
    image: params.submissionMediaUrl,
    external_url: `https://provelt.app/submissions/${params.submissionId}`,
    attributes: [
      {
        trait_type: 'Challenge',
        value: params.challengeTitle,
      },
      {
        trait_type: 'Category',
        value: params.challengeCategory,
      },
      {
        trait_type: 'Difficulty',
        value: params.challengeDifficulty,
      },
      {
        trait_type: 'Completed Date',
        value: params.completedAt.toISOString().split('T')[0],
      },
      {
        trait_type: 'Completion Timestamp',
        value: Math.floor(params.completedAt.getTime() / 1000),
        display_type: 'date',
      },
      {
        trait_type: 'Platform',
        value: 'PROVELT',
      },
      {
        trait_type: 'Challenge ID',
        value: params.challengeId,
      },
    ],
    properties: {
      files: [
        {
          uri: params.submissionMediaUrl,
          type: isVideo ? 'video/mp4' : 'image/png',
        },
      ],
      category: isVideo ? 'video' : 'image',
      creators: [
        {
          address: params.userWalletAddress,
          share: 100,
        },
      ],
    },
    collection: {
      name: 'PROVELT Badges',
      family: 'PROVELT',
    },
  };

  // Add animation URL if video
  if (isVideo) {
    metadata.animation_url = params.submissionMediaUrl;
  }

  // Add caption as attribute if provided
  if (params.submissionCaption) {
    metadata.attributes.push({
      trait_type: 'Caption',
      value: params.submissionCaption.slice(0, 100),
    });
  }

  return metadata;
}

/**
 * Convert NFTMetadataJson to BadgeMetadata format for minting
 */
export function toBadgeMetadata(
  nftMetadata: NFTMetadataJson,
  creatorAddress: string
): BadgeMetadata {
  return {
    name: nftMetadata.name,
    symbol: nftMetadata.symbol,
    description: nftMetadata.description,
    image: nftMetadata.image,
    externalUrl: nftMetadata.external_url,
    attributes: nftMetadata.attributes.map(attr => ({
      trait_type: attr.trait_type,
      value: attr.value,
    })),
    properties: {
      category: nftMetadata.properties.category,
      creators: [
        {
          address: creatorAddress,
          share: 100,
        },
      ],
    },
  };
}

/**
 * Generate metadata URI from metadata object
 * In production, this would upload to Arweave/IPFS
 */
export function generateMetadataUri(metadata: NFTMetadataJson): string {
  const jsonString = JSON.stringify(metadata);
  const base64 = Buffer.from(jsonString).toString('base64');
  return `data:application/json;base64,${base64}`;
}

/**
 * Validate metadata before minting
 */
export function validateMetadata(metadata: NFTMetadataJson): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!metadata.name || metadata.name.length > 32) {
    errors.push('Name is required and must be 32 characters or less');
  }

  if (!metadata.symbol || metadata.symbol.length > 10) {
    errors.push('Symbol is required and must be 10 characters or less');
  }

  if (!metadata.description) {
    errors.push('Description is required');
  }

  if (!metadata.image) {
    errors.push('Image URL is required');
  }

  if (!metadata.attributes || metadata.attributes.length === 0) {
    errors.push('At least one attribute is required');
  }

  if (!metadata.properties?.creators || metadata.properties.creators.length === 0) {
    errors.push('At least one creator is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
