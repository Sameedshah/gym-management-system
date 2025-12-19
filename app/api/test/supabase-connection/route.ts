import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    console.log('Testing Supabase connection...')
    
    // Check if environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'NEXT_PUBLIC_SUPABASE_URL not set'
      }, { status: 500 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: false,
        error: 'SUPABASE_SERVICE_ROLE_KEY not set'
      }, { status: 500 })
    }

    // Check if service role key looks valid (should start with eyJ)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('eyJ')) {
      return NextResponse.json({
        success: false,
        error: 'SUPABASE_SERVICE_ROLE_KEY appears invalid (should start with eyJ)'
      }, { status: 500 })
    }

    const supabase = createAdminClient()
    
    // Test 1: Try to query organizations table
    console.log('Test 1: Querying organizations table...')
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('count')
      .limit(1)
    
    if (orgsError) {
      console.error('Organizations query error:', orgsError)
      return NextResponse.json({
        success: false,
        error: 'Failed to query organizations table',
        details: orgsError.message,
        hint: orgsError.hint,
        code: orgsError.code
      }, { status: 500 })
    }

    // Test 2: Try to insert a test record (then delete it)
    console.log('Test 2: Testing insert permissions...')
    const testOrgId = 'test_' + Date.now()
    const { error: insertError } = await supabase
      .from('organizations')
      .insert({
        clerk_org_id: testOrgId,
        name: 'Test Organization',
        slug: 'test-org',
        owner_clerk_id: 'test_user',
        license_type: 'standard',
        license_status: 'active'
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({
        success: false,
        error: 'Failed to insert test record',
        details: insertError.message,
        hint: insertError.hint,
        code: insertError.code,
        suggestion: 'Run scripts/fix_permissions.sql in Supabase SQL Editor'
      }, { status: 500 })
    }

    // Clean up test record
    await supabase
      .from('organizations')
      .delete()
      .eq('clerk_org_id', testOrgId)

    console.log('✅ All tests passed!')

    return NextResponse.json({
      success: true,
      message: 'Supabase connection working perfectly!',
      tests: {
        env_vars: 'OK',
        connection: 'OK',
        read_permission: 'OK',
        write_permission: 'OK'
      }
    })

  } catch (error) {
    console.error('Connection test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}