"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const POLL_INTERVAL_MS = 2 * 60 * 1000 // 2 minutes

interface CheckinData {
  id: string
  member_id: string
  check_in_time: string
  entry_method: string
  device_name: string
  member?: {
    name: string
    member_id: string
    months_due?: number
  }
}

interface UseRealtimeCheckinsReturn {
  recentCheckins: CheckinData[]
  todayCount: number
  isConnected: boolean
}

export function useRealtimeCheckins(): UseRealtimeCheckinsReturn {
  const [recentCheckins, setRecentCheckins] = useState<CheckinData[]>([])
  const [todayCount, setTodayCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)

  const fetchTodayCheckins = async () => {
    const supabase = createClient()

    try {
      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)

      const { data: checkins } = await supabase
        .from('checkins')
        .select(`
          id,
          member_id,
          check_in_time,
          entry_method,
          device_name,
          members (
            name,
            member_id
          )
        `)
        .gte('check_in_time', startOfToday.toISOString())
        .order('check_in_time', { ascending: false })
        .limit(10)

      if (checkins) {
        const memberIds = checkins.map(c => c.member_id).filter(Boolean)
        const { data: overdueInvoices } = await supabase
          .from('invoices')
          .select('member_id, months_due')
          .in('member_id', memberIds)
          .eq('status', 'due')

        const monthsDueByMember = overdueInvoices?.reduce((acc, inv) => {
          acc[inv.member_id] = (acc[inv.member_id] || 0) + (inv.months_due || 0)
          return acc
        }, {} as Record<string, number>) || {}

        const formattedCheckins = checkins.map(checkin => ({
          ...checkin,
          member: checkin.members ? {
            name: (checkin.members as any).name,
            member_id: (checkin.members as any).member_id,
            months_due: monthsDueByMember[checkin.member_id] || 0
          } : undefined
        }))

        setRecentCheckins(formattedCheckins)
        setTodayCount(formattedCheckins.length)
      }

      setIsConnected(true)
    } catch (error) {
      console.error('Failed to fetch checkins:', error)
      setIsConnected(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchTodayCheckins()

    // Poll every 2 minutes
    const pollInterval = setInterval(fetchTodayCheckins, POLL_INTERVAL_MS)

    // Reset at midnight
    const scheduleMidnightReset = () => {
      const midnight = new Date()
      midnight.setHours(24, 0, 0, 0)
      const msUntilMidnight = midnight.getTime() - Date.now()

      return setTimeout(() => {
        setRecentCheckins([])
        setTodayCount(0)
        fetchTodayCheckins()
        midnightTimer = scheduleMidnightReset()
      }, msUntilMidnight)
    }

    let midnightTimer = scheduleMidnightReset()

    return () => {
      clearInterval(pollInterval)
      clearTimeout(midnightTimer)
    }
  }, [])

  return {
    recentCheckins,
    todayCount,
    isConnected
  }
}
