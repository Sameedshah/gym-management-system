import { NextRequest, NextResponse } from 'next/server'
import { HikvisionService } from '@/lib/hikvision-service'

export async function POST(request: NextRequest) {
  try {
    const { deviceIP, username, password, port } = await request.json()

    if (!deviceIP || !username || !password) {
      return NextResponse.json(
        { error: 'Device IP, username, and password are required' },
        { status: 400 }
      )
    }

    const hikvision = new HikvisionService({
      deviceIP,
      username,
      password,
      port: port || 80
    })

    // Test connection
    const connectionTest = await hikvision.testConnection()
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: connectionTest.error || 'Connection failed'
      })
    }

    // Get device info and user count
    try {
      const [deviceInfo, userCount] = await Promise.all([
        hikvision.getDeviceInfo(),
        hikvision.getUserCount()
      ])

      return NextResponse.json({
        success: true,
        message: 'Device connection successful',
        deviceInfo,
        userCount: userCount?.UserInfoCount?.userNumber?.[0] || 0
      })
    } catch (error) {
      // Connection works but couldn't get additional info
      return NextResponse.json({
        success: true,
        message: 'Device connection successful (limited info available)',
        deviceInfo: null,
        userCount: 0
      })
    }

  } catch (error) {
    console.error('Connection test error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed' 
      },
      { status: 500 }
    )
  }
}