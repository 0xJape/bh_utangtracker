-- Run this SQL in Supabase SQL Editor to add profile_pic column to existing users table
-- This is only needed if your users table already exists without this column

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_pic TEXT;

-- Update the RLS policy to allow users to update their profiles
DROP POLICY IF EXISTS "Allow public update access on users" ON users;
CREATE POLICY "Allow public update access on users" ON users FOR UPDATE WITH CHECK (true);
