import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { notificationService } from '@/lib/notification-service'

export async function POST(request: NextRequest) {
  try {
    const { type, to, subject, message, memberId } = await request.json()

    if (!type || !to || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, to, subject, message' },
        { status: 400 }
      )
    }

    if (type !== 'email') {
      return NextResponse.json(
        { error: 'Only email type is supported for bulk reminders' },
        { status: 400 }
      )
    }

    // Use service role key for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Send the email
    const result = await notificationService.sendEmail(to, subject, message)

    if (result.success && memberId) {
      // Update member's invoices with reminder info
      await supabase
        .from('invoices')
        .update({ 
          last_reminder_sent: new Date().toISOString(),
          email_sent: true,
          reminder_count: supabase.raw('COALESCE(reminder_count, 0) + 1')
        })
        .eq('member_id', memberId)
        .eq('status', 'due')
    }

    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? 'Email reminder sent successfully'
        : `Failed to send email reminder: ${result.error}`
    })

  } catch (error) {
    console.error('Bulk email API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}