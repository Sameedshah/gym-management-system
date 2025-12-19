"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserCheck, Clock, AlertTriangle } from "@/components/ui/icons"
import { Loading } from "@/components/ui/loading"
import { MemberDemographicsDialog } from "@/components/members/member-demographics-dialog"
import type { Member } from "@/lib/types"

export function RecentCheckIns() {
  const [checkIns, setCheckIns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [showDemographics, setShowDemographics] = useState(false)

  useEffect(() => {
    async function fetchCheckIns() {
      const supabase = createClient()

      try {
        // Fetch check-ins with member data and their overdue invoices
        const { data } = await supabase
          .from("checkins")
          .select(`
            *,
            member:members(*)
          `)
          .order("checked_in_at", { ascending: false })
          .limit(10)

        if (data) {
          // For each check-in, fetch due invoices for the member
          const checkInsWithDues = await Promise.all(
            data.map(async (checkIn) => {
              const { data: dueInvoices } = await supabase
                .from("invoices")
                .select("months_due")
                .eq("member_id", checkIn.member_id)
                .eq("status", "due")

              const totalMonthsDue = dueInvoices?.reduce((sum, invoice) => sum + (invoice.months_due || 1), 0) || 0
              
              return {
                ...checkIn,
                monthsDue: totalMonthsDue,
                hasDues: totalMonthsDue > 0
              }
            })
          )

          setCheckIns(checkInsWithDues)
        }
      } catch (error) {
        console.error('Error fetching check-ins:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCheckIns()
  }, [])

  const handleMemberClick = (member: Member) => {
    setSelectedMember(member)
    setShowDemographics(true)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Recent Check-ins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Loading text="Loading check-ins..." />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Recent Check-ins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {checkIns && checkIns.length > 0 ? (
              checkIns.map((checkIn: any) => (
                <div key={checkIn.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <UserCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{checkIn.member?.name}</p>
                        <Badge variant="outline" className="text-xs">
                          ID: {checkIn.member?.member_id}
                        </Badge>
                        {checkIn.hasDues && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {checkIn.monthsDue} month(s) due
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">Standard member</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">{new Date(checkIn.checked_in_at).toLocaleTimeString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(checkIn.checked_in_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleMemberClick(checkIn.member)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent check-ins</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showDemographics && (
        <MemberDemographicsDialog
          member={selectedMember}
          onClose={() => {
            setShowDemographics(false)
            setSelectedMember(null)
          }}
        />
      )}
    </>
  )
}