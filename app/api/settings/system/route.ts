import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createAdminClient()
    
    // Get system settings from database
    const { data: settingsData, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('category', 'system')
      .single()

    let settings = {
      gymName: "FitLife Gym",
      adminEmail: "admin@gym.com",
      autoExpireMembers: true,
      membershipExpiryDays: 90,
      notificationSound: true,
      realTimeUpdates: true,
    }

    if (settingsData && !error) {
      settings = { ...settings, ...settingsData.settings }
    }

    return NextResponse.json({
      success: true,
      settings
    })

  } catch (error) {
    console.error('Failed to get system settings:', error)
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings = await request.json()
    const supabase = createAdminClient()

    // Save settings to database
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        category: 'system',
        settings: settings,
        updated_at: new Date().toISOString()
      })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'System settings saved successfully'
    })

  } catch (error) {
    console.error('Failed to save system settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}