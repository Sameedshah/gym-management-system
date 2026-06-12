import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { HikvisionService } from '@/lib/hikvision-service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
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
        connected: false,
        error: 'Biometric system is disabled'
      })
    }

    const settings = settingsData.settings

    // Test device connection
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
        connected: false,
        error: connectionTest.error || 'Device not connected'
      })
    }

    // Get device info and user count
    let deviceInfo = null
    let userCount = 0
    
    try {
      const [info, count] = await Promise.all([
        hikvision.getDeviceInfo(),
        hikvision.getUserCount()
      ])
      
      deviceInfo = info
      userCount = count?.UserInfoCount?.userNumber?.[0] || 0
    } catch (error) {
      console.log('Could not get detailed device info:', error)
    }

    // Get today's check-ins count
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data: todayCheckins, error: checkinsError } = await supabase
      .from('checkins')
      .select('id')
      .gte('check_in_time', today.toISOString())
      .eq('entry_method', 'biometric')

    const todayScans = todayCheckins?.length || 0

    // Get last scan time
    const { data: lastCheckin } = await supabase
      .from('checkins')
      .select('check_in_time')
      .eq('entry_method', 'biometric')
      .order('check_in_time', { ascending: false })
      .limit(1)
      .single()

    const lastScan = lastCheckin?.check_in_time || null

    // Get last sync time from biometric_devices table
    const { data: deviceData } = await supabase
      .from('biometric_devices')
      .select('last_sync')
      .eq('device_ip', settings.deviceIP)
      .single()

    return NextResponse.json({
      success: true,
      connected: true,
      deviceInfo: {
        name: deviceInfo?.DeviceInfo?.deviceName?.[0] || 'Biometric Scanner',
        model: deviceInfo?.DeviceInfo?.model?.[0] || 'Unknown',
        serial: deviceInfo?.DeviceInfo?.serialNumber?.[0] || 'Unknown',
        firmware: deviceInfo?.DeviceInfo?.firmwareVersion?.[0] || 'Unknown',
        ip: settings.deviceIP
      },
      stats: {
        enrolledUsers: userCount,
        todayScans,
        lastScan,
        lastSync: deviceData?.last_sync
      },
      settings: {
        autoSync: settings.autoSync,
        syncInterval: settings.syncInterval
      }
    })

  } catch (error) {
    console.error('Scanner status error:', error)
    return NextResponse.json({
      success: false,
      connected: false,
      error: error instanceof Error ? error.message : 'Failed to get scanner status'
    }, { status: 500 })
  }
}