/**
 * Submission Server Actions
 * Next.js Server Actions for handling challenge submissions
 */
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { SubmissionStatus, ReactionType } from '@/lib/database.types';

export interface CreateSubmissionInput {
  challengeId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  textContent?: string;
}

export interface SubmissionResult {
  success: boolean;
  submissionId?: string;
  error?: string;
}

/**
 * Create a new submission
 */
export async function createSubmission(
  input: CreateSubmissionInput
): Promise<SubmissionResult> {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'You must be logged in to submit' };
    }

    // Verify challenge exists and is active
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('id, is_active, starts_at, ends_at')
      .eq('id', input.challengeId)
      .single();

    if (challengeError || !challenge) {
      return { success: false, error: 'Challenge not found' };
    }

    // Check if challenge is active
    const now = new Date();
    const startsAt = new Date(challenge.starts_at);
    const endsAt = new Date(challenge.ends_at);

    if (!challenge.is_active || now < startsAt || now > endsAt) {
      return { success: false, error: 'Challenge is not currently active' };
    }

    // Check for existing submission
    const { data: existing } = await supabase
      .from('submissions')
      .select('id')
      .eq('user_id', user.id)
      .eq('challenge_id', input.challengeId)
      .single();

    if (existing) {
      return { success: false, error: 'You have already submitted to this challenge' };
    }

    // Create submission
    const { data: submission, error: insertError } = await supabase
      .from('submissions')
      .insert({
        user_id: user.id,
        challenge_id: input.challengeId,
        media_url: input.mediaUrl,
        media_type: input.mediaType,
        caption: input.caption || null,
        text_content: input.textContent || null,
        status: 'pending' as SubmissionStatus,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return { success: false, error: 'Failed to create submission' };
    }

    // Increment challenge submissions count (best effort)
    try {
      const { data: currentChallenge } = await supabase
        .from('challenges')
        .select('submissions_count')
        .eq('id', input.challengeId)
        .single();
      
      if (currentChallenge) {
        await supabase
          .from('challenges')
          .update({ 
            submissions_count: (currentChallenge.submissions_count || 0) + 1 
          })
          .eq('id', input.challengeId);
      }
    } catch {
      // Non-critical, continue
    }

    // Update user submissions count (best effort)
    try {
      const { count } = await supabase
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      await supabase
        .from('profiles')
        .update({ submissions_count: count || 0 })
        .eq('id', user.id);
    } catch {
      // Non-critical, continue
    }

    // Revalidate feed and challenge pages
    revalidatePath('/feed');
    revalidatePath(`/challenges/${input.challengeId}`);

    return {
      success: true,
      submissionId: submission.id,
    };
  } catch (error) {
    console.error('Create submission error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Update submission status (admin only)
 */
export async function updateSubmissionStatus(
  submissionId: string,
  status: SubmissionStatus,
  rejectionReason?: string
): Promise<SubmissionResult> {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // TODO: Add admin check here
    // For now, allow submission owner to see their status

    const updateData: Record<string, any> = { status };
    if (status === 'rejected' && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    const { error: updateError } = await supabase
      .from('submissions')
      .update(updateData)
      .eq('id', submissionId);

    if (updateError) {
      return { success: false, error: 'Failed to update submission' };
    }

    revalidatePath('/feed');
    return { success: true, submissionId };
  } catch (error) {
    console.error('Update submission error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Delete a submission
 */
export async function deleteSubmission(
  submissionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership
    const { data: submission } = await supabase
      .from('submissions')
      .select('user_id, challenge_id')
      .eq('id', submissionId)
      .single();

    if (!submission || submission.user_id !== user.id) {
      return { success: false, error: 'You can only delete your own submissions' };
    }

    // Delete submission
    const { error: deleteError } = await supabase
      .from('submissions')
      .delete()
      .eq('id', submissionId);

    if (deleteError) {
      return { success: false, error: 'Failed to delete submission' };
    }

    revalidatePath('/feed');
    revalidatePath(`/challenges/${submission.challenge_id}`);

    return { success: true };
  } catch (error) {
    console.error('Delete submission error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Add reaction to submission
 */
export async function addReaction(
  submissionId: string,
  reactionType: ReactionType = 'like'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'You must be logged in to react' };
    }

    // Check if already reacted
    const { data: existing } = await supabase
      .from('reactions')
      .select('id')
      .eq('submission_id', submissionId)
      .eq('user_id', user.id)
      .eq('reaction_type', reactionType)
      .single();

    if (existing) {
      // Remove reaction (toggle)
      await supabase
        .from('reactions')
        .delete()
        .eq('id', existing.id);
    } else {
      // Add reaction
      await supabase
        .from('reactions')
        .insert({
          submission_id: submissionId,
          user_id: user.id,
          reaction_type: reactionType,
        });
    }

    revalidatePath('/feed');
    return { success: true };
  } catch (error) {
    console.error('Reaction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update reaction',
    };
  }
}
