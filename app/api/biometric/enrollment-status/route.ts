import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { HikvisionService } from '@/lib/hikvision-service'

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
      return NextResponse.json({
        success: false,
        enrolled: false,
        error: 'Biometric system is disabled'
      })
    }

    const settings = settingsData.settings

    // Check device connection
    const hikvision = new HikvisionService({
      deviceIP: settings.deviceIP,
      username: settings.username,
      password: settings.password,
      port: settings.port || 80
    })

    const connectionTest = await hikvision.testConnection()
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        enrolled: false,
        deviceConnected: false,
        error: 'Device not connected'
      })
    }

    // Check if user exists on device by trying to get user info
    let enrolledOnDevice = false
    try {
      // Try to get user info from device
      const response = await fetch(`http://${settings.deviceIP}:${settings.port || 80}/ISAPI/AccessControl/UserInfo/Search?format=json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + Buffer.from(`${settings.username}:${settings.password}`).toString('base64')
        },
        body: JSON.stringify({
          UserInfoSearchCond: {
            searchID: "1",
            searchResultPosition: 0,
            maxResults: 1,
            EmployeeNoList: [{ employeeNo: memberId }]
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        enrolledOnDevice = data.UserInfoSearch?.UserInfo?.length > 0
      }
    } catch (error) {
      console.log('Could not check device enrollment status:', error)
    }

    // Check database enrollment status
    const { data: memberData } = await supabase
      .from('members')
      .select('biometric_enrolled, biometric_id')
      .eq('member_id', memberId)
      .single()

    const enrolledInDB = memberData?.biometric_enrolled || false

    return NextResponse.json({
      success: true,
      enrolled: enrolledOnDevice && enrolledInDB,
      deviceConnected: true,
      enrollmentDetails: {
        onDevice: enrolledOnDevice,
        inDatabase: enrolledInDB,
        biometricId: memberData?.biometric_id
      }
    })

  } catch (error) {
    console.error('Enrollment status check error:', error)
    return NextResponse.json({
      success: false,
      enrolled: false,
      error: error instanceof Error ? error.message : 'Failed to check enrollment status'
    }, { status: 500 })
  }
}