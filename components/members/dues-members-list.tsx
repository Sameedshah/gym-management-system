"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Mail, AlertTriangle, Send } from "lucide-react"
import type { Member, Invoice } from "@/lib/types"
import { Loading } from "@/components/ui/loading"

interface DuesMember extends Member {
  monthsDue: number
  lastReminderSent?: string
}

export function DuesMembersList() {
  const [duesMembers, setDuesMembers] = useState<DuesMember[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [sendingReminders, setSendingReminders] = useState<string[]>([])

  useEffect(() => {
    fetchDuesMembers()
  }, [])

  const fetchDuesMembers = async () => {
    const supabase = createClient()
    
    try {
      // Get all members
      const { data: members } = await supabase
        .from("members")
        .select("*")
        .eq("status", "active")

      // Get all due invoices
      const { data: dueInvoices } = await supabase
        .from("invoices")
        .select("*")
        .eq("status", "due")

      if (members && dueInvoices) {
        const duesData: DuesMember[] = []
        
        for (const member of members) {
          const memberDues = dueInvoices.filter(inv => inv.member_id === member.id)
          const totalMonthsDue = memberDues.reduce((sum, inv) => sum + (inv.months_due || 1), 0)
          
          if (totalMonthsDue > 0) {
            const lastReminder = memberDues
              .filter(inv => inv.last_reminder_sent)
              .sort((a, b) => new Date(b.last_reminder_sent!).getTime() - new Date(a.last_reminder_sent!).getTime())[0]
            
            duesData.push({
              ...member,
              monthsDue: totalMonthsDue,
              lastReminderSent: lastReminder?.last_reminder_sent
            })
          }
        }
        
        setDuesMembers(duesData)
      }
    } catch (error) {
      console.error('Error fetching dues members:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = duesMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.member_id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sendEmailReminder = async (member: DuesMember) => {
    setSendingReminders(prev => [...prev, member.id])
    
    try {
      const supabase = createClient()
      
      // Update all due invoices for this member
      const { error } = await supabase
        .from("invoices")
        .update({
          email_sent: true,
          last_reminder_sent: new Date().toISOString(),
          reminder_count: 1
        })
        .eq("member_id", member.id)
        .eq("status", "due")

      if (error) throw error

      // Update local state
      setDuesMembers(prev => 
        prev.map(m => 
          m.id === member.id 
            ? { ...m, lastReminderSent: new Date().toISOString() }
            : m
        )
      )

      alert(`Email reminder sent successfully to ${member.name}`)
    } catch (error) {
      console.error('Error sending email reminder:', error)
      alert('Failed to send email reminder')
    } finally {
      setSendingReminders(prev => prev.filter(id => id !== member.id))
    }
  }

  const sendBulkEmailReminders = async () => {
    setSendingReminders(filteredMembers.map(m => m.id))
    
    try {
      for (const member of filteredMembers) {
        await sendEmailReminder(member)
        // Add delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      alert(`Bulk email reminders sent to ${filteredMembers.length} members`)
    } catch (error) {
      alert('Error sending bulk reminders')
    } finally {
      setSendingReminders([])
    }
  }

  const formatLastReminder = (dateString?: string) => {
    if (!dateString) return "Never"
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return "Today"
    if (days === 1) return "Yesterday"
    return `${days} days ago`
  }

  if (loading) {
    return <Loading text="Loading dues members..." />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Members with Dues ({filteredMembers.length})
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10"
              />
            </div>
            {filteredMembers.length > 0 && (
              <Button 
                onClick={sendBulkEmailReminders}
                disabled={sendingReminders.length > 0}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Send All Email Reminders
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Months Due</TableHead>
                <TableHead>Last Reminder</TableHead>
                <TableHead className="w-[120px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {member.member_id || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{member.plan_name || "Not Set"}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive">
                      {member.monthsDue} month{member.monthsDue > 1 ? 's' : ''}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatLastReminder(member.lastReminderSent)}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendEmailReminder(member)}
                      disabled={sendingReminders.includes(member.id)}
                      className="flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      {sendingReminders.includes(member.id) ? "Sending..." : "Email"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No members with dues found</p>
            {searchTerm && (
              <p className="text-sm mt-2">Try adjusting your search terms</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}