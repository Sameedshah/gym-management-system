"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  CreditCard, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Clock,
  CheckCircle
} from "lucide-react"
import type { Member, Invoice } from "@/lib/types"
import { Loading } from "@/components/ui/loading"
import { EmailReminderButton } from "./email-reminder-button"

export function AdminOverview() {
  const [stats, setStats] = useState<any>(null)
  const [dueMembers, setDueMembers] = useState<any[]>([])
  const [expiredMembers, setExpiredMembers] = useState<Member[]>([])
  const [dailyPayments, setDailyPayments] = useState<any[]>([])
  const [monthlyPayments, setMonthlyPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      // Fetch all required data in parallel
      const [
        membersResult,
        todayPaymentsResult,
        monthlyPaymentsResult
      ] = await Promise.all([
        supabase.from("members").select("*"),
        supabase.from("invoices").select("*, member:members(*)")
          .eq("status", "paid")
          .gte("paid_date", new Date().toISOString().split('T')[0]),
        supabase.from("invoices").select("*, member:members(*)")
          .eq("status", "paid")
          .gte("paid_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
      ])

      const members = membersResult.data || []
      const todayPayments = todayPaymentsResult.data || []
      const monthlyPayments = monthlyPaymentsResult.data || []

      // Calculate stats
      const activeMembers = members.filter(m => m.status === 'active')
      const expiredMembersList = members.filter(m => m.status === 'expired')



      // Get members with dues (consolidated dues and overdues into single "due" status)
      const dueInvoicesResult = await supabase
        .from("invoices")
        .select("*, member:members(*)")
        .eq("status", "due")

      const dueInvoices = dueInvoicesResult.data || []
      
      // Group due invoices by member (unified dues system)
      const membersWithDues = []
      const memberDuesMap = new Map()

      for (const invoice of dueInvoices) {
        const memberId = invoice.member_id
        if (!memberDuesMap.has(memberId)) {
          memberDuesMap.set(memberId, {
            member_id: memberId,
            member: invoice.member,
            totalMonthsDue: 0,
            invoiceCount: 0
          })
        }
        
        const memberDue = memberDuesMap.get(memberId)
        memberDue.totalMonthsDue += (invoice.months_due || 1)
        memberDue.invoiceCount += 1
      }

      const membersWithDuesArray = Array.from(memberDuesMap.values())

      // Daily payments summary
      const dailyPaymentsSummary = todayPayments.reduce((acc, payment) => {
        acc.totalMonths += (payment.months_due || 1)
        acc.count += 1
        return acc
      }, { totalMonths: 0, count: 0 })

      // Monthly payments summary
      const monthlyPaymentsSummary = monthlyPayments.reduce((acc, payment) => {
        acc.totalMonths += (payment.months_due || 1)
        acc.count += 1
        return acc
      }, { totalMonths: 0, count: 0 })

      setStats({
        totalMembers: members.length,
        activeMembers: activeMembers.length,
        expiredMembers: expiredMembersList.length,
        totalMonthsDue: membersWithDuesArray.reduce((sum, m) => sum + m.totalMonthsDue, 0),
        membersWithDues: membersWithDuesArray.length,
        dailyMonthsPaid: dailyPaymentsSummary.totalMonths,
        dailyPaymentCount: dailyPaymentsSummary.count,
        monthlyMonthsPaid: monthlyPaymentsSummary.totalMonths,
        monthlyPaymentCount: monthlyPaymentsSummary.count
      })

      setDueMembers(membersWithDuesArray.sort((a, b) => b.totalMonthsDue - a.totalMonthsDue))
      setExpiredMembers(expiredMembersList)
      setDailyPayments(todayPayments.slice(0, 10))
      setMonthlyPayments(monthlyPayments.slice(0, 20))

    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }



  if (loading) {
    return <Loading text="Loading admin overview..." />
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <div className="text-sm text-muted-foreground">Members with Dues</div>
            </div>
            <div className="text-2xl font-bold text-destructive">{stats?.membersWithDues}</div>
            <div className="text-xs text-muted-foreground">
              {stats?.totalMonthsDue || 0} months due total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <div className="text-sm text-muted-foreground">Today's Payments</div>
            </div>
            <div className="text-2xl font-bold text-success">
              {stats?.dailyMonthsPaid || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              months paid ({stats?.dailyPaymentCount} payments)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div className="text-sm text-muted-foreground">Total Members</div>
            </div>
            <div className="text-2xl font-bold">{stats?.totalMembers}</div>
            <div className="text-xs text-muted-foreground">
              {stats?.activeMembers} active, {stats?.expiredMembers} expired
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Views */}
      <Tabs defaultValue="dues" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dues">Members with Dues</TabsTrigger>
          <TabsTrigger value="payments">Daily Payments</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
          <TabsTrigger value="expired">Expired Members</TabsTrigger>
        </TabsList>

        <TabsContent value="dues" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Members with Outstanding Dues ({dueMembers.length})
                </CardTitle>
                {dueMembers.length > 0 && (
                  <EmailReminderButton 
                    dueMembers={dueMembers} 
                    onRemindersSent={fetchAllData}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              {dueMembers.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {dueMembers.map((memberDue) => (
                    <div key={memberDue.member_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          {memberDue.member?.member_id}
                        </Badge>
                        <div>
                          <div className="font-medium">{memberDue.member?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {memberDue.totalMonthsDue} month{memberDue.totalMonthsDue > 1 ? 's' : ''} due
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-destructive">
                          {memberDue.totalMonthsDue} month{memberDue.totalMonthsDue > 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {memberDue.invoiceCount} invoice{memberDue.invoiceCount > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
                  <p>All members are up to date with payments!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Payment Entries ({stats?.dailyPaymentCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dailyPayments.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {dailyPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          {payment.invoice_number || `INV-${payment.id.slice(-8)}`}
                        </Badge>
                        <div>
                          <div className="font-medium">{payment.member?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {payment.description || 'Payment received'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-success">
                          {payment.months_due || 1} month{(payment.months_due || 1) > 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(payment.paid_date).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payments received today</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                This Month's Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-success/10 rounded-lg">
                  <div className="text-2xl font-bold text-success">
                    {stats?.monthlyMonthsPaid || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Months Paid</div>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {stats?.monthlyPaymentCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Payments</div>
                </div>
              </div>

              {monthlyPayments.length > 0 && (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  <h4 className="font-medium">Recent Monthly Payments</h4>
                  {monthlyPayments.slice(0, 10).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {payment.member?.member_id}
                        </Badge>
                        <span className="text-sm">{payment.member?.name}</span>
                      </div>
                      <div className="text-sm font-medium">
                        {payment.months_due || 1} month{(payment.months_due || 1) > 1 ? 's' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Expired Members ({expiredMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expiredMembers.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {expiredMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          {member.member_id}
                        </Badge>
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">Expired</Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          Last seen: {member.last_seen 
                            ? new Date(member.last_seen).toLocaleDateString()
                            : 'Never'
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
                  <p>No expired members!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}