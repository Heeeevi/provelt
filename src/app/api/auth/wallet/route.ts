import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

// Server-side Supabase client
// Uses service role key if available, otherwise anon key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_supabase_service_role_key' 
    ? process.env.SUPABASE_SERVICE_ROLE_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Wallet Authentication API
 * Verifies wallet signature and creates/retrieves user profile
 * 
 * This uses a simplified auth flow:
 * 1. Verify wallet signature
 * 2. Check/create profile with wallet_address
 * 3. Return profile data (client stores in local state)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, signature, message } = body;

    if (!walletAddress || !signature || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, signature, message' },
        { status: 400 }
      );
    }

    // Verify the signature
    const isValid = verifySignature(walletAddress, signature, message);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Check if profile with this wallet already exists
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (existingProfile) {
      // User exists, return their profile
      return NextResponse.json({
        success: true,
        isNewUser: false,
        profile: existingProfile,
      });
    }

    // Profile doesn't exist - check if we have service role key to create one
    const hasServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_supabase_service_role_key';
    
    if (!hasServiceRole) {
      // Without service role, we can't create auth user
      // Return success but indicate profile needs to be created client-side
      return NextResponse.json({
        success: true,
        isNewUser: true,
        profile: null,
        needsProfileCreation: true,
        walletAddress,
      });
    }

    // With service role key, create full auth user + profile
    const walletEmail = `${walletAddress.slice(0, 8).toLowerCase()}@wallet.provelt.app`;
    
    // Create auth user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: walletEmail,
      email_confirm: true,
      user_metadata: {
        wallet_address: walletAddress,
        auth_method: 'wallet',
      },
    });

    if (createError) {
      console.error('Create user error:', createError);
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Create profile for new user
    const username = `user_${walletAddress.slice(0, 8).toLowerCase()}`;
    const { data: newProfile, error: newProfileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user.id,
        wallet_address: walletAddress,
        username: username,
        display_name: `Wallet ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
      })
      .select()
      .single();

    if (newProfileError) {
      console.error('Create profile error:', newProfileError);
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      isNewUser: true,
      profile: newProfile,
    });

  } catch (error: any) {
    console.error('Wallet auth error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Verify Solana wallet signature
 */
function verifySignature(
  walletAddress: string,
  signature: string,
  message: string
): boolean {
  try {
    const publicKeyBytes = bs58.decode(walletAddress);
    const signatureBytes = bs58.decode(signature);
    const messageBytes = new TextEncoder().encode(message);

    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}
