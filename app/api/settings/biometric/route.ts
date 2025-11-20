import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { HikvisionService } from '@/lib/hikvision-service'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get biometric settings from database
    const { data: settingsData, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('category', 'biometric')
      .single()

    let settings = {
      enabled: false,
      deviceIP: "192.168.1.64",
      username: "gymapi",
      password: "",
      port: 80,
      autoSync: true,
      syncInterval: 5
    }

    if (settingsData && !error) {
      settings = { ...settings, ...settingsData.settings }
    }

    // Test device status if enabled
    let status = { connected: false }
    
    if (settings.enabled && settings.deviceIP && settings.username && settings.password) {
      try {
        const hikvision = new HikvisionService({
          deviceIP: settings.deviceIP,
          username: settings.username,
          password: settings.password,
          port: settings.port
        })

        const connectionTest = await hikvision.testConnection()
        
        if (connectionTest.success) {
          const [deviceInfo, userCount] = await Promise.all([
            hikvision.getDeviceInfo().catch(() => null),
            hikvision.getUserCount().catch(() => null)
          ])

          status = {
            connected: true,
            deviceInfo,
            userCount: userCount?.UserInfoCount?.userNumber?.[0] || 0,
            lastSync: settingsData?.last_sync || null
          }
        }
      } catch (error) {
        console.error('Device status check failed:', error)
      }
    }

    return NextResponse.json({
      success: true,
      settings,
      status
    })

  } catch (error) {
    console.error('Failed to get biometric settings:', error)
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings = await request.json()
    const supabase = await createClient()

    // Validate required fields if enabled
    if (settings.enabled) {
      if (!settings.deviceIP || !settings.username || !settings.password) {
        return NextResponse.json(
          { error: 'Device IP, username, and password are required when biometric system is enabled' },
          { status: 400 }
        )
      }

      // Test connection before saving
      const hikvision = new HikvisionService({
        deviceIP: settings.deviceIP,
        username: settings.username,
        password: settings.password,
        port: settings.port || 80
      })

      const connectionTest = await hikvision.testConnection()
      if (!connectionTest.success) {
        return NextResponse.json(
          { error: `Device connection failed: ${connectionTest.error}` },
          { status: 400 }
        )
      }
    }

    // Save settings to database
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        category: 'biometric',
        settings: settings,
        updated_at: new Date().toISOString()
      })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Biometric settings saved successfully'
    })

  } catch (error) {
    console.error('Failed to save biometric settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}