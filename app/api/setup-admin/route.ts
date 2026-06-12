import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    // Use service role key for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create admin user
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@gym.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        role: 'admin'
      }
    })

    if (error) {
      // If user already exists, that's okay
      if (error.message.includes('already registered')) {
        return NextResponse.json({ 
          success: true, 
          message: 'Admin user already exists' 
        })
      }
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Admin user created successfully',
      user: data.user 
    })

  } catch (error) {
    console.error('Setup admin error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}