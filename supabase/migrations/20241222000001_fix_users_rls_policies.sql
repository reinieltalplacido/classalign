-- Fix RLS policies for users table to allow proper signup

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own data" ON public.users;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Enable realtime for users table
alter publication supabase_realtime add table users;
