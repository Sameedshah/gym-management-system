"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck } from "@/components/ui/icons"
import { Loading } from "@/components/ui/loading"

export function DashboardStats() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient()

      try {
        // Get member statistics
        const { data: members } = await supabase.from("members").select("status")

        const { data: todayCheckIns } = await supabase
          .from("checkins")
          .select("id")
          .gte("check_in_time", new Date().toISOString().split("T")[0])

        const totalMembers = members?.length || 0
        const activeMembers = members?.filter((m) => m.status === "active").length || 0
        const expiredMembers = members?.filter((m) => m.status === "expired").length || 0
        const todayCheckInsCount = todayCheckIns?.length || 0

        // Calculate new registrations in last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const { data: newRegistrations } = await supabase
          .from("members")
          .select("id")
          .gte("created_at", thirtyDaysAgo.toISOString())
        
        const newRegistrationsCount = newRegistrations?.length || 0
        
        // Calculate previous 30 days for comparison
        const sixtyDaysAgo = new Date()
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
        
        const { data: previousPeriodRegistrations } = await supabase
          .from("members")
          .select("id")
          .gte("created_at", sixtyDaysAgo.toISOString())
          .lt("created_at", thirtyDaysAgo.toISOString())
        
        const previousPeriodCount = previousPeriodRegistrations?.length || 0
        const registrationPercentageChange = previousPeriodCount > 0 
          ? ((newRegistrationsCount - previousPeriodCount) / previousPeriodCount * 100).toFixed(1)
          : newRegistrationsCount > 0 ? "100" : "0"

        const statsData = [
          {
            title: "New Registrations Last 30 Days",
            value: newRegistrationsCount.toString(),
            description: `New members joined recently`,
            icon: Users,
            trend: `${registrationPercentageChange > 0 ? '+' : ''}${registrationPercentageChange}% vs previous 30 days`,
          },
          {
            title: "Today's Check-ins",
            value: todayCheckInsCount.toString(),
            description: "Members visited today",
            icon: UserCheck,
            trend: `Real-time data`,
          },
        ]

        setStats(statsData)
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <Loading text="Loading dashboard stats..." />
  }

  if (!stats) {
    return <div>Error loading dashboard stats</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {stats.map((stat: any) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            <p className="text-xs text-success mt-1">{stat.trend}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}