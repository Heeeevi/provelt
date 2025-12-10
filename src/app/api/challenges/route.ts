/**
 * Challenges API
 * CRUD operations for challenges
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';

    const supabase = await createClient();
    
    let query = supabase
      .from('challenges')
      .select('*')
      .order('created_at', { ascending: false });

    if (activeOnly) {
      const now = new Date().toISOString();
      query = query
        .eq('is_active', true)
        .lte('starts_at', now)
        .gte('ends_at', now);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Fetch challenges error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
