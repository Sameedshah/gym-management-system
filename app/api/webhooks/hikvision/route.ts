import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Hikvision webhook received')

    // If a secret is configured, require it via header or query param.
    // Soft-enforced (only checked when set) so an already-deployed device
    // isn't cut off the moment this code ships, before it's reconfigured.
    const expectedSecret = process.env.HIKVISION_WEBHOOK_SECRET
    if (expectedSecret) {
      const providedSecret =
        request.headers.get('x-webhook-secret') || request.nextUrl.searchParams.get('secret')
      if (providedSecret !== expectedSecret) {
        console.warn('❌ Hikvision webhook rejected: invalid or missing secret')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    } else {
      console.warn('⚠️ HIKVISION_WEBHOOK_SECRET is not set — webhook is accepting unauthenticated requests')
    }

    // Get the raw body for Hikvision events
    const body = await request.text()
    console.log('Webhook body:', body)
    
    // Hikvision sends XML or JSON depending on configuration
    let eventData
    
    try {
      // Try parsing as JSON first
      eventData = JSON.parse(body)
    } catch {
      // If JSON parsing fails, it might be XML - we'll handle XML parsing
      console.log('Received XML data, parsing...')
      eventData = await parseHikvisionXML(body)
    }
    
    console.log('Parsed event data:', eventData)
    
    // Process the attendance event
    const result = await processAttendanceEvent(eventData)
    
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      result
    })
    
  } catch (error) {
    console.error('❌ Hikvision webhook error:', error)
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function parseHikvisionXML(xmlData: string) {
  // Simple XML parsing for Hikvision events
  // In a real implementation, you'd use xml2js or similar
  const employeeNoMatch = xmlData.match(/<employeeNoString>(.*?)<\/employeeNoString>/)
  const timeMatch = xmlData.match(/<time>(.*?)<\/time>/)
  const majorMatch = xmlData.match(/<major>(.*?)<\/major>/)
  const minorMatch = xmlData.match(/<minor>(.*?)<\/minor>/)
  const doorNameMatch = xmlData.match(/<doorName>(.*?)<\/doorName>/)
  
  return {
    employeeNoString: employeeNoMatch?.[1],
    time: timeMatch?.[1],
    major: majorMatch?.[1],
    minor: minorMatch?.[1],
    doorName: doorNameMatch?.[1] || 'Main Door'
  }
}

async function processAttendanceEvent(eventData: any) {
  const supabase = createAdminClient()
  
  // Extract attendance information
  const employeeNo = eventData.employeeNoString || eventData.employeeNo
  const eventTime = eventData.time || new Date().toISOString()
  const eventType = eventData.major || eventData.eventType || '1'
  const doorName = eventData.doorName || 'Main Door'
  
  if (!employeeNo) {
    console.log('No employee number found in event')
    return { processed: false, reason: 'No employee number' }
  }
  
  console.log(`Processing attendance for employee: ${employeeNo} at ${eventTime}`)
  
  // Find the member by biometric_id — the device-assigned enrollment ID,
  // which is distinct from the human-facing 4-digit member_id.
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('id, name, member_id')
    .eq('biometric_id', employeeNo)
    .single()
  
  if (memberError || !member) {
    console.log(`Member not found for employee number: ${employeeNo}`)
    return { processed: false, reason: 'Member not found', employeeNo }
  }
  
  // Duplicate check-ins are prevented at the DB level by the
  // prevent_duplicate_checkin trigger (5-minute window, silently no-ops),
  // so no app-level check is needed here.
  const { data: checkin, error: checkinError } = await supabase
    .from('checkins')
    .insert({
      member_id: member.id,
      check_in_time: eventTime,
      entry_method: 'biometric',
      scanner_id: employeeNo,
      device_name: doorName,
      notes: `Auto-synced from biometric device (${doorName})`
    })
    .select()
    .maybeSingle()

  if (checkinError) {
    console.error('Failed to insert check-in:', checkinError)
    return { processed: false, reason: 'Database error', error: checkinError.message }
  }

  if (!checkin) {
    console.log(`Duplicate check-in blocked by DB trigger for ${member.name}`)
    return { processed: false, reason: 'Duplicate check-in', member: member.name }
  }
  
  console.log(`✅ Check-in recorded for ${member.name}`)

  // last_seen and total_visits are already updated atomically by the
  // increment_member_visits DB trigger on checkins insert — doing it again
  // here from a stale in-memory total_visits value would race with it and
  // can undo a concurrent check-in's increment.

  return {
    processed: true,
    member: {
      id: member.id,
      name: member.name,
      member_id: member.member_id
    },
    checkin: {
      id: checkin.id,
      time: eventTime,
      method: 'biometric',
      device: doorName
    }
  }
}