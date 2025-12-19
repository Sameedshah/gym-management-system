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

    // Also save/update the biometric device record for better tracking
    if (settings.enabled && settings.deviceIP) {
      const { error: deviceError } = await supabase
        .from('biometric_devices')
        .upsert({
          device_name: 'Main Scanner',
          device_type: 'hikvision',
          device_ip: settings.deviceIP,
          device_port: settings.port || 80,
          username: settings.username,
          password_encrypted: settings.password, // In production, encrypt this
          auto_sync: settings.autoSync,
          sync_interval: settings.syncInterval,
          is_active: settings.enabled,
          is_connected: true, // We tested connection above
          last_connection_test: new Date().toISOString(),
          settings: {
            deviceIP: settings.deviceIP,
            username: settings.username,
            port: settings.port,
            autoSync: settings.autoSync,
            syncInterval: settings.syncInterval
          }
        }, {
          onConflict: 'device_ip'
        })

      if (deviceError) {
        console.error('Failed to save device record:', deviceError)
        // Don't fail the main request, just log the error
      }
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