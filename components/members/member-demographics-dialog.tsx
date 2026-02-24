"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { User, Mail, Phone, Calendar, CreditCard, AlertTriangle, Fingerprint } from "lucide-react"
import type { Member, Invoice } from "@/lib/types"
import { Loading } from "@/components/ui/loading"

interface MemberDemographicsDialogProps {
  member: Member | null
  onClose: () => void
}

export function MemberDemographicsDialog({ member, onClose }: MemberDemographicsDialogProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (member) {
      fetchMemberInvoices()
    }
  }, [member])

  const fetchMemberInvoices = async () => {
    if (!member) return
    
    setLoading(true)
    const supabase = createClient()

    try {
      const { data } = await supabase
        .from("invoices")
        .select("*")
        .eq("member_id", member.id)
        .order("created_at", { ascending: false })

      setInvoices(data || [])
    } catch (error) {
      console.error('Error fetching member invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!member) return null

  const dueInvoices = invoices.filter(invoice => invoice.status === 'due')
  const totalMonthsDue = dueInvoices.reduce((sum, invoice) => sum + (invoice.months_due || 0), 0)
  const lastSeen = member.last_seen ? new Date(member.last_seen) : null
  const daysSinceLastSeen = lastSeen ? Math.floor((Date.now() - lastSeen.getTime()) / (1000 * 60 * 60 * 24)) : null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-success text-success-foreground"
      case "inactive": return "bg-warning text-warning-foreground"
      case "expired": return "bg-destructive text-destructive-foreground"
      default: return "bg-secondary text-secondary-foreground"
    }
  }

  return (
    <Dialog open={!!member} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Member Demographics - {member.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    Member ID
                  </div>
                  <div className="font-mono text-lg font-bold">{member.member_id}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    Status
                  </div>
                  <Badge className={getStatusColor(member.status || 'inactive')}>
                    {member.status || 'Unknown'}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Father Name: {member.father_name || <span className="text-muted-foreground italic">Not provided</span>}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{member.email || <span className="text-muted-foreground italic">Not provided</span>}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{member.phone || <span className="text-muted-foreground italic">Not provided</span>}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined: {member.join_date ? new Date(member.join_date).toLocaleDateString() : <span className="text-muted-foreground italic">Invalid Date</span>}</span>
                </div>
                {member.biometric_id && (
                  <div className="flex items-center gap-3">
                    <Fingerprint className="h-4 w-4 text-muted-foreground" />
                    <span>Biometric ID: {member.biometric_id}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Plan Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Plan Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Current Plan:</span>
                  <div className="font-medium">
                    <Badge variant="outline" className="ml-2">
                      {member.plan_name || <span className="text-muted-foreground italic">Not assigned</span>}
                    </Badge>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Activity Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">Last Seen:</span>
                  <div className="font-medium">
                    {lastSeen ? (
                      <>
                        {lastSeen.toLocaleDateString()} at {lastSeen.toLocaleTimeString()}
                        <span className="text-sm text-muted-foreground ml-2">
                          ({daysSinceLastSeen === 0 ? 'Today' : 
                            daysSinceLastSeen === 1 ? 'Yesterday' : 
                            `${daysSinceLastSeen} days ago`})
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
                {dueInvoices.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {totalMonthsDue} Month{totalMonthsDue > 1 ? 's' : ''} Due
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loading text="Loading payment information..." />
              ) : (
                <div className="space-y-4">
                  {totalMonthsDue > 0 && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <div className="flex items-center gap-2 text-destructive mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">Outstanding Dues</span>
                      </div>
                      <div className="text-2xl font-bold text-destructive">
                        {totalMonthsDue} Month{totalMonthsDue > 1 ? 's' : ''}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {dueInvoices.length} due invoice{dueInvoices.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium mb-3">Recent Payment Records</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {invoices.slice(0, 5).map((invoice) => (
                        <div key={invoice.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                          <div>
                            <div className="font-medium">
                              {invoice.months_due || 1} Month{(invoice.months_due || 1) > 1 ? 's' : ''}
                            </div>
                            {invoice.due_date && (
                              <div className="text-sm text-muted-foreground">
                                Due: {new Date(invoice.due_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <Badge 
                            variant={invoice.status === 'paid' ? 'default' : 'destructive'}
                          >
                            {invoice.status}
                          </Badge>
                        </div>
                      ))}
                      {invoices.length === 0 && (
                        <div className="text-center text-muted-foreground py-4">
                          No payment records found
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}