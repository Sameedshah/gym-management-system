import { NextRequest, NextResponse } from 'next/server'
import { HikvisionService } from '@/lib/hikvision-service'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { memberId } = await request.json()

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get biometric settings
    const { data: settingsData } = await supabase
      .from('system_settings')
      .select('settings')
      .eq('category', 'biometric')
      .single()

    if (!settingsData?.settings?.enabled) {
      return NextResponse.json(
        { error: 'Biometric system is disabled' },
        { status: 400 }
      )
    }

    const settings = settingsData.settings

    const hikvision = new HikvisionService({
      deviceIP: settings.deviceIP,
      username: settings.username,
      password: settings.password,
      port: settings.port || 80
    })

    // Test connection first
    const connectionTest = await hikvision.testConnection()
    if (!connectionTest.success) {
      return NextResponse.json(
        { error: 'Device not connected' },
        { status: 500 }
      )
    }

    // Remove user from device
    const deleteResult = await hikvision.deleteUser(memberId)

    if (deleteResult) {
      // Update member record in database
      const { error: updateError } = await supabase
        .from('members')
        .update({
          biometric_id: null,
          scanner_device_id: null,
          biometric_enrolled: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)

      if (updateError) {
        console.error('Failed to update member record:', updateError)
      }

      return NextResponse.json({
        success: true,
        message: 'Fingerprint removed successfully'
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to remove user from device' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Biometric removal error:', error)
    return NextResponse.json(
      { 
        error: 'Removal failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}