import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Test direct query to members table
    const { data: members, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('Members query result:', { 
      count: members?.length || 0, 
      error: error?.message,
      firstMember: members?.[0]?.name 
    })

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      count: members?.length || 0,
      members: members || [],
      message: `Found ${members?.length || 0} members`
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}