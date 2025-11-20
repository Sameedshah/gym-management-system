import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { notificationService } from '@/lib/notification-service'

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, type } = await request.json()

    if (!invoiceId || !type || !['sms', 'email'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid request. Invoice ID and type (sms/email) are required.' },
        { status: 400 }
      )
    }

    // Use service role key for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get invoice with member details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        member:members(*)
      `)
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    let result: { success: boolean; error?: string }

    if (type === 'sms') {
      const message = notificationService.generatePaymentReminderSMS(
        invoice.member.name,
        invoice.invoice_number,
        invoice.months_due || 1,
        invoice.due_date
      )
      result = await notificationService.sendSMS(invoice.member.phone || '', message)
    } else {
      const { subject, message } = notificationService.generatePaymentReminderEmail(
        invoice.member.name,
        invoice.invoice_number,
        invoice.months_due || 1,
        invoice.due_date
      )
      result = await notificationService.sendEmail(invoice.member.email, subject, message)
    }

    // Log the notification attempt
    const { error: logError } = await supabase
      .from('notification_logs')
      .insert({
        invoice_id: invoiceId,
        member_id: invoice.member_id,
        notification_type: type,
        status: result.success ? 'sent' : 'failed',
        message: type === 'sms' 
          ? notificationService.generatePaymentReminderSMS(invoice.member.name, invoice.invoice_number, invoice.months_due || 1, invoice.due_date)
          : notificationService.generatePaymentReminderEmail(invoice.member.name, invoice.invoice_number, invoice.months_due || 1, invoice.due_date).message,
        sent_at: result.success ? new Date().toISOString() : null,
        error_message: result.error || null
      })

    if (logError) {
      console.error('Error logging notification:', logError)
    }

    // Update invoice reminder fields if successful
    if (result.success) {
      const updateData = type === 'sms' 
        ? { 
            sms_sent: true, 
            last_reminder_sent: new Date().toISOString(), 
            reminder_count: invoice.reminder_count + 1 
          }
        : { 
            email_sent: true, 
            last_reminder_sent: new Date().toISOString(), 
            reminder_count: invoice.reminder_count + 1 
          }

      const { error: updateError } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId)

      if (updateError) {
        console.error('Error updating invoice:', updateError)
      }
    }

    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `${type.toUpperCase()} reminder sent successfully`
        : `Failed to send ${type} reminder: ${result.error}`
    })

  } catch (error) {
    console.error('Notification API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}