import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { memberId, monthsPaid, description } = await request.json()

    if (!memberId || !monthsPaid || monthsPaid <= 0) {
      return NextResponse.json(
        { error: 'Member ID and valid months paid are required' },
        { status: 400 }
      )
    }

    // Use service role key for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get member details
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Get member's outstanding dues
    const { data: dues, error: duesError } = await supabase
      .from('invoices')
      .select('*')
      .eq('member_id', memberId)
      .eq('status', 'due')
      .order('due_date')

    if (duesError) {
      return NextResponse.json(
        { error: 'Error fetching member dues' },
        { status: 500 }
      )
    }

    const monthsPayment = parseInt(monthsPaid)
    let remainingMonths = monthsPayment
    const clearedInvoices = []

    // Process dues clearance
    for (const due of dues || []) {
      if (remainingMonths <= 0) break

      const dueMonths = due.months_due || 1

      if (remainingMonths >= dueMonths) {
        // Fully pay this invoice
        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_date: new Date().toISOString().split('T')[0]
          })
          .eq('id', due.id)

        if (updateError) throw updateError

        remainingMonths -= dueMonths
        clearedInvoices.push({ ...due, months_cleared: dueMonths })
      } else {
        // Partially pay this invoice
        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            months_due: dueMonths - remainingMonths
          })
          .eq('id', due.id)

        if (updateError) throw updateError

        // Create a paid invoice for the partial payment
        const { error: partialError } = await supabase
          .from('invoices')
          .insert({
            member_id: memberId,
            months_due: remainingMonths,
            description: `Partial payment for ${due.description || 'membership'}`,
            status: 'paid',
            due_date: due.due_date,
            paid_date: new Date().toISOString().split('T')[0]
          })

        if (partialError) throw partialError

        clearedInvoices.push({ ...due, months_cleared: remainingMonths })
        remainingMonths = 0
      }
    }

    // Create main payment record
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('invoices')
      .insert({
        member_id: memberId,
        months_due: monthsPayment,
        description: description || 'Payment received',
        status: 'paid',
        due_date: new Date().toISOString().split('T')[0],
        paid_date: new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    const totalMonthsCleared = monthsPayment - remainingMonths

    return NextResponse.json({
      success: true,
      message: `Payment for ${monthsPayment} month${monthsPayment > 1 ? 's' : ''} recorded successfully`,
      data: {
        payment: paymentRecord,
        member: member,
        totalMonthsCleared: totalMonthsCleared,
        clearedInvoices: clearedInvoices,
        remainingMonths: remainingMonths
      }
    })

  } catch (error) {
    console.error('Payment processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}