import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.json()
    const supabase = createAdminClient()

    // Get Clerk client
    const clerk = await clerkClient()
    
    // Get Clerk user and organization data
    const user = await clerk.users.getUser(userId)
    
    // Save onboarding data to system settings instead of organization table
    if (formData) {
      const { error: settingsError } = await supabase
        .from('system_settings')
        .upsert({
          category: 'gym_info',
          settings: {
            gym_name: formData.gym_name,
            address: formData.address,
            phone: formData.phone,
            email: formData.email,
            website: formData.website,
            timezone: formData.timezone || 'UTC',
            currency: formData.currency || 'USD',
            onboarding_completed: true
          }
        })

      if (settingsError) {
        console.error('Error saving gym settings:', settingsError)
      }
    }

    // Check if user exists in database
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!existingUser) {
      // Create user in database
      const { error: userError } = await supabase
        .from('users')
        .insert({
          clerk_user_id: userId,
          email: user.emailAddresses[0]?.emailAddress || '',
          first_name: user.firstName || '',
          last_name: user.lastName || '',
          avatar_url: user.imageUrl || '',
          role: 'admin',
          is_active: true
        })

      if (userError) {
        console.error('Error creating user:', userError)
        return NextResponse.json({ error: userError.message }, { status: 500 })
      }
    } else {
      // Update existing user
      const { error: updateError } = await supabase
        .from('users')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('clerk_user_id', userId)

      if (updateError) {
        console.error('Error updating user:', updateError)
      }
    }

    // Skip activity logging for now (no activity_logs table)

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully'
    })

  } catch (error) {
    console.error('Onboarding error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Log environment variables (without sensitive data)
    console.error('Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasClerkSecret: !!process.env.CLERK_SECRET_KEY,
      nodeEnv: process.env.NODE_ENV
    })
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Onboarding failed',
        details: error instanceof Error ? error.stack : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}