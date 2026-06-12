import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()

  try {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, name')
      .eq('status', 'active')

    if (membersError) throw membersError
    if (!members || members.length === 0) {
      return NextResponse.json({ success: true, generated: 0 })
    }

    const memberIds = members.map(m => m.id)

    const { data: existingInvoices } = await supabase
      .from('invoices')
      .select('member_id')
      .in('member_id', memberIds)
      .eq('invoice_month', currentMonth)

    const membersWithInvoice = new Set((existingInvoices || []).map(inv => inv.member_id))
    const membersNeedingInvoice = members.filter(m => !membersWithInvoice.has(m.id))

    if (membersNeedingInvoice.length === 0) {
      return NextResponse.json({ success: true, generated: 0 })
    }

    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let invoiceCounter = 1001
    if (lastInvoice?.invoice_number) {
      const match = lastInvoice.invoice_number.match(/INV-(\d+)/)
      if (match) invoiceCounter = parseInt(match[1]) + 1
    }

    const dueDateStr = now.toISOString().split('T')[0]

    const newInvoices = membersNeedingInvoice.map((member, idx) => ({
      member_id: member.id,
      invoice_number: `INV-${invoiceCounter + idx}`,
      invoice_month: currentMonth,
      status: 'due',
      months_due: 1,
      amount: 0,
      due_date: dueDateStr,
      description: `Monthly membership fee - ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      sms_sent: false,
      email_sent: false,
      reminder_count: 0,
    }))

    const { error: insertError } = await supabase.from('invoices').insert(newInvoices)
    if (insertError) throw insertError

    return NextResponse.json({ success: true, generated: newInvoices.length, timestamp: now.toISOString() })
  } catch (error) {
    console.error('Monthly dues cron failed:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
