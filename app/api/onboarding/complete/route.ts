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
    
    let organizationId: string | null = null

    // If user has an organization, sync it
    if (orgId) {
      const org = await clerk.organizations.getOrganization({ organizationId: orgId })
      
      // Check if organization exists in database
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('clerk_org_id', orgId)
        .single()

      if (!existingOrg) {
        // Create organization in database
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            clerk_org_id: orgId,
            name: org.name,
            slug: org.slug || org.name.toLowerCase().replace(/\s+/g, '-'),
            owner_clerk_id: userId,
            gym_name: formData.gym_name || org.name,
            address: formData.address || '',
            phone: formData.phone || '',
            email: formData.email || user.emailAddresses[0]?.emailAddress || '',
            website: formData.website || '',
            timezone: formData.timezone || 'UTC',
            currency: formData.currency || 'USD',
            license_type: 'standard',
            license_status: 'active',
            is_active: true,
            onboarding_completed: true
          })
          .select('id')
          .single()

        if (orgError) {
          console.error('Error creating organization:', orgError)
          return NextResponse.json({ error: orgError.message }, { status: 500 })
        }

        organizationId = newOrg.id
      } else {
        // Update existing organization with onboarding data
        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            gym_name: formData.gym_name,
            address: formData.address,
            phone: formData.phone,
            email: formData.email,
            website: formData.website,
            timezone: formData.timezone,
            currency: formData.currency,
            onboarding_completed: true,
            updated_at: new Date().toISOString()
          })
          .eq('clerk_org_id', orgId)

        if (updateError) {
          console.error('Error updating organization:', updateError)
        }

        organizationId = existingOrg.id
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
          organization_id: organizationId,
          email: user.emailAddresses[0]?.emailAddress || '',
          first_name: user.firstName || '',
          last_name: user.lastName || '',
          avatar_url: user.imageUrl || '',
          role: 'owner',
          is_active: true
        })

      if (userError) {
        console.error('Error creating user:', userError)
        return NextResponse.json({ error: userError.message }, { status: 500 })
      }
    } else {
      // Update user's organization
      const { error: updateError } = await supabase
        .from('users')
        .update({
          organization_id: organizationId,
          updated_at: new Date().toISOString()
        })
        .eq('clerk_user_id', userId)

      if (updateError) {
        console.error('Error updating user:', updateError)
      }
    }

    // Log activity
    if (organizationId) {
      await supabase
        .from('activity_logs')
        .insert({
          organization_id: organizationId,
          user_id: existingUser?.id,
          action: 'onboarding_completed',
          entity_type: 'organization',
          entity_id: organizationId,
          description: 'Completed onboarding wizard',
          metadata: formData
        })
    }

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