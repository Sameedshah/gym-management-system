"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { CheckIn, Member } from "@/lib/types"
import { UserCheck, Clock, AlertCircle } from "@/components/ui/icons"

interface CheckInWithMember extends CheckIn {
  member: Member
  feeStatus: "paid" | "due"
}

export function NotificationCard() {
  const [latestCheckIn, setLatestCheckIn] = useState<CheckInWithMember | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Subscribe to new check-ins
    const channel = supabase
      .channel("checkins")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "checkins",
        },
        async (payload) => {
          console.log("[v0] New check-in received:", payload)

          // Fetch member details and fee status
          const { data: member } = await supabase.from("members").select("*").eq("id", payload.new.member_id).single()

          if (member) {
            // Get latest invoice to determine fee status
            const { data: invoice } = await supabase
              .from("invoices")
              .select("status")
              .eq("member_id", member.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single()

            const checkInWithMember: CheckInWithMember = {
              ...(payload.new as CheckIn),
              member,
              feeStatus: invoice?.status || "due",
            }

            setLatestCheckIn(checkInWithMember)
            setIsVisible(true)

            // Auto-hide after 10 seconds
            setTimeout(() => {
              setIsVisible(false)
            }, 10000)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (!isVisible || !latestCheckIn) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Real-time Check-ins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Waiting for member check-ins...</p>
            <p className="text-sm mt-2">New check-ins will appear here in real-time</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-success text-success-foreground"
      case "due":
        return "bg-warning text-warning-foreground"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "due":
        return <AlertCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-primary" />
          New Check-in Alert
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{latestCheckIn.member.name}</h3>
              <p className="text-sm text-muted-foreground">Member</p>
              <p className="text-xs text-muted-foreground">Just checked in • {latestCheckIn.scanner_id}</p>
            </div>
          </div>

          <div className="text-right">
            <Badge className={getStatusColor(latestCheckIn.feeStatus)}>
              {getStatusIcon(latestCheckIn.feeStatus)}
              <span className="ml-1 capitalize">{latestCheckIn.feeStatus}</span>
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">Payment Status</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
