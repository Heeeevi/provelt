-- Migration: Add approvals table, prize pool (escrow) and awards
-- Run this migration in Supabase SQL editor or via supabase migrations

-- 1) Approvals table - records community/judge approvals for submissions
CREATE TABLE IF NOT EXISTS public.approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  approver_id TEXT NOT NULL,
  approver_type TEXT DEFAULT 'user', -- user | judge | sponsor
  score INTEGER, -- optional numeric rating
  weight NUMERIC DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uniq_submission_approver UNIQUE (submission_id, approver_id)
);

CREATE INDEX IF NOT EXISTS idx_approvals_submission ON public.approvals(submission_id);
CREATE INDEX IF NOT EXISTS idx_approvals_approver ON public.approvals(approver_id);

-- 2) Challenge prize pool / escrow table
CREATE TABLE IF NOT EXISTS public.challenge_pools (
  challenge_id UUID PRIMARY KEY REFERENCES public.challenges(id) ON DELETE CASCADE,
  sponsor_id UUID NULL, -- reference to profile/auth user that sponsored (optional)
  amount NUMERIC DEFAULT 0, -- numeric amount (interpretation depends on currency)
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'open', -- open | locked | distributed
  deposited_at TIMESTAMPTZ,
  distributed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) Awards table - records payouts / awarded submissions
CREATE TABLE IF NOT EXISTS public.awards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE SET NULL,
  submission_id UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
  prize_amount NUMERIC,
  currency TEXT DEFAULT 'USD',
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  tx_reference TEXT, -- optional tx / mint signature / payment id
  awarded_by TEXT -- server process or admin id
);

-- 4) Row Level Security: enable RLS on approvals to allow fine-grained policies
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;

-- Allow everyone to SELECT approvals (for transparency)
DROP POLICY IF EXISTS "Allow select approvals" ON public.approvals;
CREATE POLICY "Allow select approvals" ON public.approvals
  FOR SELECT
  USING (true);

-- Prevent self-approval on INSERT: disallow inserting an approval where the
-- approver is the same as the submission owner. Note: this policy assumes
-- that approver identity is provided by auth.uid() (for authenticated users).
-- For more robust enforcement, perform approvals through a server endpoint
-- which validates rules and inserts with the service_role key.
DROP POLICY IF EXISTS "No self approval on insert" ON public.approvals;
CREATE POLICY "No self approval on insert" ON public.approvals
  FOR INSERT
  WITH CHECK (
    -- requester must be an authenticated user
    auth.uid() IS NOT NULL
    -- approver_id must match the authenticated user (prevents inserting approvals on behalf of others)
    AND approver_id = auth.uid()::text
    -- disallow approving your own submission
    AND auth.uid()::text != (
      SELECT coalesce(user_id::text, '') FROM public.submissions WHERE id = public.approvals.submission_id
    )
  );

-- Allow approver to delete their own approval (optional)
DROP POLICY IF EXISTS "Allow delete own approval" ON public.approvals;
CREATE POLICY "Allow delete own approval" ON public.approvals
  FOR DELETE
  USING (auth.uid()::text = approver_id OR auth.role() = 'service_role');

-- Allow insert only by authenticated users (and subject to WITH CHECK above)
DROP POLICY IF EXISTS "Allow insert approvals authenticated" ON public.approvals;
CREATE POLICY "Allow insert approvals authenticated" ON public.approvals
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND approver_id = auth.uid()::text
    -- also prevent self-approval here so no INSERT policy can bypass the "no self approval" rule
    AND auth.uid()::text != (
      SELECT coalesce(user_id::text, '') FROM public.submissions WHERE id = public.approvals.submission_id
    )
  );

-- Grant minimal select to anon role (optional, depending on your privacy needs)
GRANT SELECT ON public.approvals TO anon;

-- 5) Helpful aggregates / view (optional): approvals count per submission
CREATE OR REPLACE VIEW public.submission_approval_counts AS
SELECT
  submission_id,
  COUNT(*)::int AS approvals_count,
  SUM(weight)::numeric AS approvals_weight
FROM public.approvals
GROUP BY submission_id;

-- 6) Ensure challenge_pools table has useful indexes
CREATE INDEX IF NOT EXISTS idx_challenge_pools_status ON public.challenge_pools(status);

-- 7) Grants: allow authenticated users to insert approvals through policies above
GRANT SELECT, INSERT, DELETE ON public.approvals TO authenticated;

-- 8) Backfill note: you can backfill existing approved submissions into awards
-- by running a server-side job that reads approved submissions and populates
-- the awards table when distributing prizes.

-- Done.
