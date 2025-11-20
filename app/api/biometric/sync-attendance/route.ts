import { NextRequest, NextResponse } from 'next/server'
import { HikvisionService } from '@/lib/hikvision-service'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
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

    // Get attendance records from last sync or last 24 hours
    const endTime = new Date().toISOString()
    let startTime: string

    // Get last sync time from settings
    if (settingsData.last_sync) {
      startTime = settingsData.last_sync
    } else {
      // Default to last 24 hours
      startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }

    const records = await hikvision.getAttendanceRecords(startTime, endTime)
    let syncedCount = 0
    let errorCount = 0

    // Process each attendance record
    for (const record of records) {
      try {
        // Find member by biometric_id
        const { data: member } = await supabase
          .from('members')
          .select('id, name')
          .eq('biometric_id', record.employeeNo)
          .single()

        if (member) {
          // Check if check-in already exists
          const { data: existingCheckin } = await supabase
            .from('checkins')
            .select('id')
            .eq('member_id', member.id)
            .eq('check_in_time', record.time)
            .single()

          if (!existingCheckin) {
            // Create new check-in record
            const { error: insertError } = await supabase
              .from('checkins')
              .insert({
                member_id: member.id,
                check_in_time: record.time,
                scanner_id: settings.deviceIP,
                entry_method: 'biometric',
                notes: `Auto-synced from biometric device (${record.doorName || 'Main Door'})`
              })

            if (insertError) {
              console.error('Failed to insert check-in:', insertError)
              errorCount++
            } else {
              syncedCount++
            }
          }
        } else {
          console.warn(`No member found for biometric ID: ${record.employeeNo}`)
        }
      } catch (error) {
        console.error('Error processing attendance record:', error)
        errorCount++
      }
    }

    // Update last sync time
    await supabase
      .from('system_settings')
      .update({
        last_sync: endTime,
        updated_at: new Date().toISOString()
      })
      .eq('category', 'biometric')

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} attendance records`,
      syncedCount,
      errorCount,
      totalRecords: records.length
    })

  } catch (error) {
    console.error('Attendance sync error:', error)
    return NextResponse.json(
      { 
        error: 'Sync failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}