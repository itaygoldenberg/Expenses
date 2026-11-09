import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Fill them in .env (see .env.example).',
  )
}

// Browser client: uses only the public (anon) key. Data is protected by RLS.
export const supabase = createClient(url, anonKey)
