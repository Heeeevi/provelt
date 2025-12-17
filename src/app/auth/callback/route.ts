/**
 * Auth Callback Page
 * Handles OAuth redirects from Supabase Auth
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/feed';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.session?.user) {
      // Ensure profile exists for this user
      const user = data.session.user;
      const displayName = user.user_metadata?.full_name || user.user_metadata?.name || (user.email ? user.email.split('@')[0] : 'User');
      const username = user.email 
        ? user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_') + '_' + user.id.substring(0, 4)
        : 'user_' + user.id.substring(0, 8);

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!existingProfile) {
        // Create profile
        await supabase
          .from('profiles')
          .insert({
            id: user.id,
            display_name: displayName,
            username: username,
            avatar_url: user.user_metadata?.avatar_url || null,
            is_public: true,
          });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to login page with error
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`);
}
