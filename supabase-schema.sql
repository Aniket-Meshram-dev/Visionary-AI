-- ==============================================================================
-- Visionary.ai — Supabase Database Schema
-- Run this SQL in your Supabase Dashboard -> SQL Editor (New Query) -> Click "Run"
-- Link: https://supabase.com/dashboard/project/jmgyjdgveyuecstkytal/sql/new
-- ==============================================================================

-- 1. Create the 'creations' table
CREATE TABLE IF NOT EXISTS public.creations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL, -- 'article' | 'summary' | 'quick-code' | 'image' | 'resume-review'
    publish BOOLEAN DEFAULT FALSE,
    likes TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Performance indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_creations_user_id ON public.creations(user_id);
CREATE INDEX IF NOT EXISTS idx_creations_publish ON public.creations(publish);
CREATE INDEX IF NOT EXISTS idx_creations_created_at ON public.creations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creations_type ON public.creations(type);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.creations ENABLE ROW LEVEL SECURITY;

-- 4. Set RLS Policies

-- Public Policy: Anyone (authenticated or guest) can view published creations in Community Feed
DROP POLICY IF EXISTS "Anyone can view published creations" ON public.creations;
CREATE POLICY "Anyone can view published creations" 
    ON public.creations 
    FOR SELECT 
    USING (publish = true);

-- User Policy: Users can view their own creations in their dashboard
DROP POLICY IF EXISTS "Users can view their own creations" ON public.creations;
CREATE POLICY "Users can view their own creations" 
    ON public.creations 
    FOR SELECT 
    USING (auth.uid()::text = user_id);

-- User Policy: Users can insert their own creations
DROP POLICY IF EXISTS "Users can insert their own creations" ON public.creations;
CREATE POLICY "Users can insert own creations" 
    ON public.creations 
    FOR INSERT 
    WITH CHECK (auth.uid()::text = user_id);

-- User Policy: Users can update creations (e.g. toggle publish or likes)
DROP POLICY IF EXISTS "Users can update their creations" ON public.creations;
CREATE POLICY "Users can update creations" 
    ON public.creations 
    FOR UPDATE 
    USING (true);

-- User Policy: Users can delete their own creations
DROP POLICY IF EXISTS "Users can delete their own creations" ON public.creations;
CREATE POLICY "Users can delete own creations" 
    ON public.creations 
    FOR DELETE 
    USING (auth.uid()::text = user_id);

-- Note: The backend server connects via SUPABASE_SERVICE_ROLE_KEY which automatically bypasses RLS for guaranteed reliability.
