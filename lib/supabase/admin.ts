import { createClient } from '@supabase/supabase-js'

// Create a Supabase client with service role key for admin operations
// This bypasses RLS and should only be used in secure server-side contexts
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      nodeEnv: process.env.NODE_ENV
    })
    throw new Error('Missing Supabase environment variables')
  }

  try {
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  } catch (error) {
    console.error('Failed to create Supabase admin client:', error)
    throw error
  }
}