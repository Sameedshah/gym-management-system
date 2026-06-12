import { NextRequest, NextResponse } from 'next/server'
import { HikvisionService } from '@/lib/hikvision-service'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { memberId, memberName } = await request.json()

    if (!memberId || !memberName) {
      return NextResponse.json(
        { error: 'Member ID and name are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

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

    // Check if user already exists on device
    try {
      await hikvision.deleteUser(memberId) // Remove if exists
    } catch (error) {
      // User doesn't exist, which is fine
    }

    // Add user to device
    const userResult = await hikvision.addUser({
      employeeNo: memberId,
      name: memberName,
      userType: 'normal'
    })

    // Start fingerprint enrollment
    const enrollResult = await hikvision.enrollFingerprint(memberId)

    // Update member record in database
    const { error: updateError } = await supabase
      .from('members')
      .update({
        biometric_id: memberId,
        scanner_device_id: settings.deviceIP,
        biometric_enrolled: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)

    if (updateError) {
      console.error('Failed to update member record:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Fingerprint enrollment started. Please place finger on scanner.',
      userResult,
      enrollResult
    })

  } catch (error) {
    console.error('Biometric enrollment error:', error)
    return NextResponse.json(
      { 
        error: 'Enrollment failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}