import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton instance for convenience
export const supabase = createClient();

/**
 * Ensure a profile exists for the given user
 * Creates one if it doesn't exist
 */
export async function ensureProfileExists(userId: string, email?: string | null, metadata?: Record<string, any>) {
  const client = createClient();
  
  // Check if profile already exists
  const { data: existingProfile, error: fetchError } = await client
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (fetchError) {
    console.error('Error checking profile:', fetchError);
    return null;
  }

  // Profile already exists
  if (existingProfile) {
    return existingProfile;
  }

  // Generate username from email or metadata
  const displayName = metadata?.full_name || metadata?.name || (email ? email.split('@')[0] : 'User');
  const username = email 
    ? email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_') + '_' + userId.substring(0, 4)
    : 'user_' + userId.substring(0, 8);

  // Create new profile
  const { data: newProfile, error: insertError } = await client
    .from('profiles')
    .insert({
      id: userId,
      display_name: displayName,
      username: username,
      avatar_url: metadata?.avatar_url || null,
      is_public: true,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('Error creating profile:', insertError);
    // Try to return existing profile in case of race condition
    const { data: retryProfile } = await client
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    return retryProfile;
  }

  console.log('Created new profile for user:', userId);
  return newProfile;
}

/**
 * Ensure a profile exists for wallet-based login
 * Uses wallet address as the identifier
 */
export async function ensureWalletProfileExists(walletAddress: string) {
  const client = createClient();
  
  // Check if profile already exists by wallet address
  const { data: existingProfile, error: fetchError } = await client
    .from('profiles')
    .select('id, wallet_address')
    .eq('wallet_address', walletAddress)
    .maybeSingle();

  if (fetchError) {
    console.error('Error checking wallet profile:', fetchError);
    return null;
  }

  // Profile already exists
  if (existingProfile) {
    console.log('Wallet profile already exists:', existingProfile.id);
    return existingProfile;
  }

  // Generate display name from wallet address (first 4 + last 4 chars)
  const shortAddress = walletAddress.substring(0, 4) + '...' + walletAddress.substring(walletAddress.length - 4);
  const displayName = `Wallet ${shortAddress}`;
  const username = 'wallet_' + walletAddress.substring(0, 8).toLowerCase();

  // Create new profile with wallet address as ID (since no Supabase user)
  // We use the wallet address itself as the ID for wallet-only users
  const { data: newProfile, error: insertError } = await client
    .from('profiles')
    .insert({
      id: walletAddress, // Use wallet address as profile ID
      display_name: displayName,
      username: username,
      wallet_address: walletAddress,
      is_public: true,
    })
    .select('id, wallet_address')
    .single();

  if (insertError) {
    console.error('Error creating wallet profile:', insertError);
    // Try to return existing profile in case of race condition
    const { data: retryProfile } = await client
      .from('profiles')
      .select('id, wallet_address')
      .eq('wallet_address', walletAddress)
      .maybeSingle();
    return retryProfile;
  }

  console.log('Created new wallet profile:', walletAddress);
  return newProfile;
}
