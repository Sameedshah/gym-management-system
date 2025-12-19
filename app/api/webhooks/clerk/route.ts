import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  console.log('🔔 Webhook received')
  
  // Get the headers
  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('❌ Missing svix headers')
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Check if webhook secret is configured
  if (!process.env.CLERK_WEBHOOK_SECRET) {
    console.error('❌ CLERK_WEBHOOK_SECRET not configured in .env.local')
    return new Response('Webhook secret not configured', {
      status: 500,
    })
  }

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('❌ Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  const eventType = evt.type
  console.log(`📨 Event type: ${eventType}`)

  // Ignore session events (we don't need to handle these)
  if (eventType === 'session.created' || eventType === 'session.removed' || eventType === 'session.ended') {
    console.log('✅ Session event ignored (not needed)')
    return NextResponse.json({ success: true, message: 'Session event ignored' })
  }

  // Use admin client for webhooks (bypasses RLS)
  const supabase = createAdminClient()

  try {
    // Handle user.created event
    if (eventType === 'user.created') {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data
      console.log(`👤 Creating user: ${id}`)

      // Insert user into database
      const { error } = await supabase
        .from('users')
        .insert({
          clerk_user_id: id,
          email: email_addresses[0]?.email_address || '',
          first_name: first_name || '',
          last_name: last_name || '',
          avatar_url: image_url || '',
          role: 'owner', // First user is owner
          is_active: true
        })

      if (error) {
        console.error('❌ Error creating user:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      console.log('✅ User created successfully:', id)
    }

    // Handle organization.created event
    if (eventType === 'organization.created') {
      const { id, name, slug, created_by } = evt.data
      console.log(`🏢 Creating organization: ${name} (${id})`)

      // Insert organization into database
      const { error } = await supabase
        .from('organizations')
        .insert({
          clerk_org_id: id,
          name: name,
          slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
          owner_clerk_id: created_by,
          license_type: 'standard',
          license_status: 'active',
          is_active: true,
          onboarding_completed: false
        })

      if (error) {
        console.error('❌ Error creating organization:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      console.log('✅ Organization created successfully:', id)
    }

    // Handle organizationMembership.created event
    if (eventType === 'organizationMembership.created') {
      const { organization, public_user_data } = evt.data

      // Update user's organization_id
      const { error } = await supabase
        .from('users')
        .update({
          organization_id: (await supabase
            .from('organizations')
            .select('id')
            .eq('clerk_org_id', organization.id)
            .single()).data?.id
        })
        .eq('clerk_user_id', public_user_data.user_id)

      if (error) {
        console.error('Error updating user organization:', error)
      }

      console.log('User added to organization:', public_user_data.user_id)
    }

    // Handle user.updated event
    if (eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data

      const { error } = await supabase
        .from('users')
        .update({
          email: email_addresses[0]?.email_address || '',
          first_name: first_name || '',
          last_name: last_name || '',
          avatar_url: image_url || '',
          updated_at: new Date().toISOString()
        })
        .eq('clerk_user_id', id)

      if (error) {
        console.error('Error updating user:', error)
      }

      console.log('User updated:', id)
    }

    // Handle organization.updated event
    if (eventType === 'organization.updated') {
      const { id, name, slug } = evt.data

      const { error } = await supabase
        .from('organizations')
        .update({
          name: name,
          slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
          updated_at: new Date().toISOString()
        })
        .eq('clerk_org_id', id)

      if (error) {
        console.error('Error updating organization:', error)
      }

      console.log('Organization updated:', id)
    }

    console.log('✅ Webhook processed successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Webhook error:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Log environment variables (without sensitive data)
    console.error('Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasWebhookSecret: !!process.env.CLERK_WEBHOOK_SECRET,
      nodeEnv: process.env.NODE_ENV
    })
    
    return NextResponse.json(
      { 
        error: 'Webhook handler failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}