/**
 * Submission API
 * Handles challenge proof submissions
 * 
 * POST /api/submissions - Create new submission
 * GET /api/submissions - Fetch submissions with pagination
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SubmissionStatus } from '@/lib/database.types';

interface CreateSubmissionBody {
  challengeId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  textContent?: string;
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
    const body: CreateSubmissionBody = await request.json();
    const { challengeId, mediaUrl, mediaType, caption, textContent } = body;

    // Validate required fields
    if (!challengeId || !mediaUrl || !mediaType) {
      return NextResponse.json(
        { error: 'Missing required fields: challengeId, mediaUrl, mediaType' },
        { status: 400 }
      );
    }

    // Verify challenge exists and is active
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('id, title, is_active, starts_at, ends_at')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Check if challenge is active
    const now = new Date();
    const startsAt = new Date(challenge.starts_at);
    const endsAt = new Date(challenge.ends_at);

    if (!challenge.is_active) {
      return NextResponse.json(
        { error: 'Challenge is not active' },
        { status: 400 }
      );
    }

    if (now < startsAt) {
      return NextResponse.json(
        { error: 'Challenge has not started yet' },
        { status: 400 }
      );
    }

    if (now > endsAt) {
      return NextResponse.json(
        { error: 'Challenge has ended' },
        { status: 400 }
      );
    }

    // Check for existing submission
    const { data: existing } = await supabase
      .from('submissions')
      .select('id')
      .eq('user_id', user.id)
      .eq('challenge_id', challengeId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'You have already submitted to this challenge' },
        { status: 409 }
      );
    }

    // Create submission
    const { data: submission, error: insertError } = await supabase
      .from('submissions')
      .insert({
        user_id: user.id,
        challenge_id: challengeId,
        media_url: mediaUrl,
        media_type: mediaType,
        caption: caption || null,
        text_content: textContent || null,
        status: 'pending' as SubmissionStatus,
      })
      .select(`
        *,
        profile:profiles(id, username, display_name, avatar_url),
        challenge:challenges(id, title, category, difficulty)
      `)
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create submission' },
        { status: 500 }
      );
    }

    // Update challenge submissions count (non-blocking)
    supabase
      .from('challenges')
      .update({ 
        submissions_count: ((challenge as any).submissions_count || 0) + 1 
      })
      .eq('id', challengeId)
      .then(() => {
        // Success - no action needed
      });

    return NextResponse.json({
      success: true,
      submission,
      message: 'Submission created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get('challengeId');
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '10');

    const supabase = await createClient();

    let query = supabase
      .from('submissions')
      .select(`
        *,
        profile:profiles(*),
        challenge:challenges(*)
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (challengeId) {
      query = query.eq('challenge_id', challengeId);
    }

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      data,
      nextCursor: data && data.length === limit ? data[data.length - 1].created_at : null,
    });
  } catch (error) {
    console.error('Fetch submissions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
