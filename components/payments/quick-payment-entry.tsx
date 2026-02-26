"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  Plus, 
  Search, 
  User, 
  CreditCard, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Check,
  ChevronsUpDown
} from "lucide-react"
import type { Member, Invoice } from "@/lib/types"

// Receipt generation function
const generateReceipt = (paymentData: {
  receiptNumber: string
  memberName: string
  memberId: string
  monthsPaid: number
  totalAmount: number
  paymentDate: string
  description: string
}) => {
  const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
    .header h1 { margin: 0; color: #333; }
    .header p { margin: 5px 0; color: #666; }
    .receipt-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .receipt-info div { flex: 1; }
    .receipt-info strong { display: block; color: #333; margin-bottom: 5px; }
    .details-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .details-table th, .details-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    .details-table th { background-color: #f5f5f5; font-weight: bold; }
    .total-row { font-weight: bold; font-size: 1.1em; background-color: #f9f9f9; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 0.9em; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>GymAdmin</h1>
    <p>Payment Receipt</p>
  </div>
  
  <div class="receipt-info">
    <div>
      <strong>Receipt Number:</strong>
      <span>${paymentData.receiptNumber}</span>
    </div>
    <div>
      <strong>Payment Date:</strong>
      <span>${new Date(paymentData.paymentDate).toLocaleDateString()}</span>
    </div>
  </div>
  
  <div class="receipt-info">
    <div>
      <strong>Member Name:</strong>
      <span>${paymentData.memberName}</span>
    </div>
    <div>
      <strong>Member ID:</strong>
      <span>${paymentData.memberId}</span>
    </div>
  </div>
  
  <table class="details-table">
    <thead>
      <tr>
        <th>Description</th>
        <th>Months</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${paymentData.description || 'Membership Fee'}</td>
        <td>${paymentData.monthsPaid} month(s)</td>
        <td>Rs. ${paymentData.totalAmount.toLocaleString()}</td>
      </tr>
      <tr class="total-row">
        <td colspan="2">Total Amount Paid</td>
        <td>Rs. ${paymentData.totalAmount.toLocaleString()}</td>
      </tr>
    </tbody>
  </table>
  
  <div class="footer">
    <p>Thank you for your payment!</p>
    <p>This is a computer-generated receipt and does not require a signature.</p>
  </div>
</body>
</html>
  `
  
  // Create a blob and download
  const blob = new Blob([receiptHTML], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Receipt-${paymentData.receiptNumber}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function QuickPaymentEntry() {
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [memberDues, setMemberDues] = useState<any[]>([])
  const [monthsPaid, setMonthsPaid] = useState("")
  const [totalAmount, setTotalAmount] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMembers()
  }, [])

  useEffect(() => {
    if (selectedMember) {
      fetchMemberDues()
    }
  }, [selectedMember])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (searchOpen && !target.closest('.dropdown-container')) {
        setSearchOpen(false)
      }
    }

    if (searchOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [searchOpen])

  const fetchMembers = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("status", "active")
        .order("name")
      
      if (error) {
        console.error('Error fetching members:', error)
        setError('Failed to load members')
        return
      }
      
      console.log('Fetched members:', data?.length || 0)
      setMembers(data || [])
    } catch (error) {
      console.error('Error in fetchMembers:', error)
      setError('Failed to load members')
    }
  }

  const fetchMemberDues = async () => {
    if (!selectedMember) return
    
    try {
      const supabase = createClient()
      
      // Get existing due invoices for this member
      const { data: dueInvoices, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("member_id", selectedMember.id)
        .eq("status", "due")
        .order("created_at", { ascending: true })

      if (invoiceError) {
        console.error('Error fetching due invoices:', invoiceError)
        setError('Failed to fetch member dues')
        return
      }

      // Calculate total months due
      const totalMonthsDue = dueInvoices?.reduce((sum, invoice) => sum + (invoice.months_due || 1), 0) || 0
      
      // Create a simplified dues structure
      const dueMonths = dueInvoices?.map((invoice, index) => ({
        invoiceId: invoice.id,
        monthsDue: invoice.months_due || 1,
        dueDate: invoice.due_date,
        status: 'due'
      })) || []
      
      setMemberDues(dueMonths)
    } catch (error) {
      console.error('Error fetching member dues:', error)
      setError('Failed to calculate member dues')
    }
  }

  const getTotalMonthsDue = () => {
    return memberDues.reduce((sum, due) => sum + due.monthsDue, 0)
  }

  const handlePayment = async () => {
    if (!selectedMember || !monthsPaid || !totalAmount) {
      setError("Please select a member, enter months paid, and total amount")
      return
    }

    const monthsPayment = parseInt(monthsPaid)
    const amountPaid = parseFloat(totalAmount)
    
    if (isNaN(monthsPayment) || monthsPayment <= 0) {
      setError("Please enter a valid number of months")
      return
    }
    
    if (isNaN(amountPaid) || amountPaid <= 0) {
      setError("Please enter a valid amount")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const supabase = createClient()

    try {
      const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      
      // Create payment record for months paid
      const paymentData = {
        member_id: selectedMember.id,
        invoice_number: invoiceNumber,
        months_due: monthsPayment,
        description: description || `Payment for ${monthsPayment} month(s) - Rs. ${amountPaid}`,
        status: "paid" as const,
        paid_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        sms_sent: false,
        email_sent: false,
        reminder_count: 0,
      }

      console.log('Inserting payment data:', paymentData)

      const { data: paymentRecord, error: paymentError } = await supabase
        .from("invoices")
        .insert(paymentData)
        .select()
        .single()

      if (paymentError) {
        console.error('Payment error details:', paymentError)
        throw paymentError
      }

      console.log('Payment recorded successfully:', paymentRecord)

      // Update existing due invoices to reduce months due
      let remainingMonthsToPay = monthsPayment
      for (const due of memberDues) {
        if (remainingMonthsToPay <= 0) break
        
        const monthsToDeduct = Math.min(remainingMonthsToPay, due.monthsDue)
        const newMonthsDue = due.monthsDue - monthsToDeduct
        
        if (newMonthsDue <= 0) {
          // Mark invoice as paid
          await supabase
            .from("invoices")
            .update({ 
              status: "paid", 
              paid_date: new Date().toISOString().split('T')[0] 
            })
            .eq("id", due.invoiceId)
        } else {
          // Reduce months due
          await supabase
            .from("invoices")
            .update({ months_due: newMonthsDue })
            .eq("id", due.invoiceId)
        }
        
        remainingMonthsToPay -= monthsToDeduct
      }

      // Generate and download receipt
      generateReceipt({
        receiptNumber,
        memberName: selectedMember.name,
        memberId: selectedMember.member_id || 'N/A',
        monthsPaid: monthsPayment,
        totalAmount: amountPaid,
        paymentDate: new Date().toISOString(),
        description: description || 'Membership Fee'
      })

      // Refresh member dues
      await fetchMemberDues()

      // Show success message
      setSuccess(
        `Payment recorded successfully! ` +
        `Cleared ${monthsPayment} month(s) of dues for ${selectedMember.name}. Receipt downloaded.`
      )

      // Reset form
      setMonthsPaid("")
      setTotalAmount("")
      setDescription("")

    } catch (error) {
      console.error('Payment error:', error)
      setError(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredMembers = searchValue.length > 0 
    ? members.filter(member =>
        member.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
        member.member_id?.toLowerCase().includes(searchValue.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchValue.toLowerCase())
      ).slice(0, 10) // Limit search results to 10
    : members.slice(0, 10) // Show first 10 members when no search

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Quick Payment Entry
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">




        {/* Member Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Select Member</Label>
            {selectedMember && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedMember(null)
                  setMemberDues([])
                  setSearchValue("")
                }}
                className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            )}
          </div>
          {/* Simple Test Dropdown */}
          <div className="relative dropdown-container">
            <Button
              variant="outline"
              onClick={() => setSearchOpen(!searchOpen)}
              className="w-full justify-between h-auto min-h-[40px] px-3 py-2"
            >
              {selectedMember ? (
                <div className="flex items-center gap-2 flex-1 text-left">
                  <Badge variant="outline" className="font-mono text-xs">
                    {selectedMember.member_id}
                  </Badge>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{selectedMember.name}</span>
                    <span className="text-xs text-muted-foreground">{selectedMember.email}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Search className="h-4 w-4" />
                  <span>Click to search members...</span>
                </div>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {searchOpen && (
              <div 
                className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 border-b border-border">
                  <input
                    placeholder="Type member name, ID, or email..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground placeholder:text-muted-foreground"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  {filteredMembers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {searchValue ? `No members found for "${searchValue}"` : 'Start typing to search...'}
                    </div>
                  ) : (
                    <div>
                      {filteredMembers.map((member, index) => {
                        const handleMemberClick = () => {
                          setSelectedMember(member)
                          setSearchOpen(false)
                          setSearchValue("")
                        }

                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={handleMemberClick}
                            className="w-full flex items-center gap-3 p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer border-b border-border last:border-b-0 text-left transition-colors"
                          >
                            <Badge variant="outline" className="font-mono text-xs shrink-0">
                              {member.member_id || `${1000 + index + 1}`}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {member.name || `Member ${index + 1}`}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">
                                {member.email || `member${index + 1}@example.com`}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Member Dues Display */}
        {selectedMember && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Outstanding Dues</Label>
              {memberDues.length > 0 && (
                <Badge variant="destructive">
                  {getTotalMonthsDue()} month(s) due
                </Badge>
              )}
            </div>
            
            {memberDues.length > 0 ? (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {memberDues.map((due, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded text-sm">
                    <div>
                      <div className="font-medium">{due.monthsDue} month(s)</div>
                      <div className="text-xs text-muted-foreground">
                        Due: {due.dueDate ? new Date(due.dueDate).toLocaleDateString() : 'No due date'}
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {due.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
                <p className="text-sm">No outstanding dues</p>
              </div>
            )}
          </div>
        )}

        {/* Payment Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthsPaid">Months Paid *</Label>
              <Input
                id="monthsPaid"
                type="number"
                placeholder="1"
                value={monthsPaid}
                onChange={(e) => setMonthsPaid(e.target.value)}
                min="1"
                max="12"
                step="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total Amount (Rs.) *</Label>
              <Input
                id="totalAmount"
                type="number"
                placeholder="0"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="Payment description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Payment Summary */}
        {selectedMember && monthsPaid && totalAmount && (
          <Alert>
            <CreditCard className="h-4 w-4" />
            <AlertDescription>
              Recording payment of <strong>Rs. {parseFloat(totalAmount).toLocaleString()}</strong> for{" "}
              <strong>{monthsPaid} month(s)</strong> from{" "}
              <strong>{selectedMember.name}</strong>
              {memberDues.length > 0 && (
                <span className="block mt-1 text-sm">
                  This will automatically clear dues starting from oldest invoices.
                </span>
              )}
              <span className="block mt-1 text-sm font-medium">
                Receipt will be auto-generated and downloaded.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Messages */}
        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-success">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button 
          onClick={handlePayment} 
          disabled={!selectedMember || !monthsPaid || !totalAmount || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Record Payment & Generate Receipt
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}