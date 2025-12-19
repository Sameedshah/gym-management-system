import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check if organizations table exists
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('count')
      .limit(1)
    
    // Check if users table exists
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    // Check if activity_logs table exists
    const { data: logs, error: logsError } = await supabase
      .from('activity_logs')
      .select('count')
      .limit(1)

    return NextResponse.json({
      success: true,
      tables: {
        organizations: orgsError ? 'NOT FOUND' : 'EXISTS',
        users: usersError ? 'NOT FOUND' : 'EXISTS',
        activity_logs: logsError ? 'NOT FOUND' : 'EXISTS'
      },
      errors: {
        organizations: orgsError?.message,
        users: usersError?.message,
        activity_logs: logsError?.message
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}