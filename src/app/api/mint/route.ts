/**
 * Mint Badge API
 * Mints a compressed NFT badge for challenge completion
 * 
 * POST /api/mint
 * Body: { challengeId, submissionId, walletAddress }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  mintCompressedNFT, 
  createBadgeMetadata,
  uploadMetadata,
  getMintingConfig,
} from '@/lib/solana/mint';
import { SOLANA_NETWORK, getExplorerUrl } from '@/lib/solana/config';

interface MintRequestBody {
  challengeId: string;
  submissionId: string;
  walletAddress: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: MintRequestBody = await request.json();
    const { challengeId, submissionId, walletAddress } = body;

    if (!challengeId || !submissionId || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: challengeId, submissionId, walletAddress' },
        { status: 400 }
      );
    }

    // Check minting configuration
    const config = getMintingConfig();
    if (!config.configured) {
      return NextResponse.json(
        { error: 'Minting not configured. Please set up Merkle tree and collection addresses.' },
        { status: 503 }
      );
    }

    // Verify submission exists and belongs to user
    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .select(`
        *,
        challenge:challenges(*)
      `)
      .eq('id', submissionId)
      .eq('user_id', user.id)
      .single();

    if (subError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found or access denied' },
        { status: 404 }
      );
    }

    // Check if submission is approved
    if (submission.status !== 'approved') {
      return NextResponse.json(
        { error: 'Submission must be approved before minting' },
        { status: 400 }
      );
    }

    // Check if badge already minted
    const { data: existingBadge } = await supabase
      .from('badge_nfts')
      .select('id')
      .eq('submission_id', submissionId)
      .single();

    if (existingBadge) {
      return NextResponse.json(
        { error: 'Badge already minted for this submission' },
        { status: 409 }
      );
    }

    // Get treasury private key from environment
    const treasuryPrivateKey = process.env.TREASURY_PRIVATE_KEY;
    if (!treasuryPrivateKey || treasuryPrivateKey.startsWith('your_')) {
      return NextResponse.json(
        { error: 'Treasury wallet not configured' },
        { status: 503 }
      );
    }

    // Create badge metadata
    const challenge = submission.challenge as any;
    const metadata = createBadgeMetadata({
      challengeTitle: challenge.title,
      challengeCategory: challenge.category || 'General',
      difficulty: challenge.difficulty || 'Medium',
      completedAt: new Date().toISOString(),
      imageUrl: challenge.image_url || 'https://provelt.app/badge-default.png',
      creatorAddress: walletAddress,
    });

    // Upload metadata (placeholder - would use Arweave/IPFS in production)
    const metadataUri = await uploadMetadata(metadata);

    // Mint compressed NFT
    const mintResult = await mintCompressedNFT({
      recipientAddress: walletAddress,
      merkleTreeAddress: config.merkleTree!,
      collectionAddress: config.collection!,
      metadata: { ...metadata, image: metadataUri },
      treasuryPrivateKey,
    });

    if (!mintResult.success) {
      return NextResponse.json(
        { error: mintResult.error || 'Minting failed' },
        { status: 500 }
      );
    }

    // Store badge in database
    const { data: badge, error: badgeError } = await supabase
      .from('badge_nfts')
      .insert({
        user_id: user.id,
        challenge_id: challengeId,
        submission_id: submissionId,
        mint_address: mintResult.assetId || mintResult.signature!,
        metadata_uri: metadataUri,
        tx_signature: mintResult.signature!,
        name: metadata.name,
        description: metadata.description,
        image_url: metadata.image,
        attributes: metadata.attributes as any,
      })
      .select()
      .single();

    if (badgeError) {
      console.error('Error storing badge:', badgeError);
      // Badge was minted but DB insert failed - log for manual reconciliation
    }

    // Update submission with badge mint info
    await supabase
      .from('submissions')
      .update({
        nft_mint_address: mintResult.assetId || mintResult.signature,
        nft_metadata_uri: metadataUri,
        nft_tx_signature: mintResult.signature,
        minted_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    // Update user badge count (increment badges_count in profile)
    await supabase
      .from('profiles')
      .update({ 
        badges_count: (await supabase
          .from('badge_nfts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
        ).count || 0
      })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      signature: mintResult.signature,
      assetId: mintResult.assetId,
      explorerUrl: getExplorerUrl(mintResult.signature!, 'tx'),
      badge: badge,
    });

  } catch (error) {
    console.error('Mint error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mint - Get minting configuration status
 */
export async function GET() {
  const config = getMintingConfig();
  return NextResponse.json({
    configured: config.configured,
    network: config.network,
    merkleTree: config.merkleTree ? `${config.merkleTree.slice(0, 8)}...` : null,
    collection: config.collection ? `${config.collection.slice(0, 8)}...` : null,
  });
}
