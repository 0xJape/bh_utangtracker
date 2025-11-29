# Utang Tracker Setup

## Supabase Database Setup

Copy and run this in Supabase SQL Editor (only the SQL below, not this text):

CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  profile_pic TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on users" ON users FOR UPDATE WITH CHECK (true);

CREATE POLICY "Allow public read access on transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on transactions" ON transactions FOR INSERT WITH CHECK (true);

## 2. Environment Variables

Update `.env` with your Supabase credentials:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 3. Run Development Server

```bash
npm install
npm run dev
```

## 4. Deploy to Vercel

1. Push to GitHub
2. Import repository in Vercel
3. Add environment variables
4. Deploy
