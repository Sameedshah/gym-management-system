"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Fallback poll, only active while the realtime channel is down
const FALLBACK_POLL_INTERVAL_MS = 2 * 60 * 1000 // 2 minutes
const MAX_RECENT = 10

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

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function useRealtimeCheckins(): UseRealtimeCheckinsReturn {
  const [recentCheckins, setRecentCheckins] = useState<CheckinData[]>([])
  const [todayCount, setTodayCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let pollInterval: ReturnType<typeof setInterval> | null = null
    // Ids already counted today, so a realtime event racing a refetch isn't counted twice
    const seenIds = new Set<string>()

    const fetchTodayCheckins = async () => {
      try {
        const since = startOfToday().toISOString()

        const [{ data: checkins }, { count }] = await Promise.all([
          supabase
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
            .gte('check_in_time', since)
            .order('check_in_time', { ascending: false })
            .limit(MAX_RECENT),
          supabase
            .from('checkins')
            .select('id', { count: 'exact', head: true })
            .gte('check_in_time', since),
        ])

        if (checkins) {
          checkins.forEach(c => seenIds.add(c.id))
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

          setRecentCheckins(checkins.map(checkin => ({
            ...checkin,
            member: checkin.members ? {
              name: (checkin.members as any).name,
              member_id: (checkin.members as any).member_id,
              months_due: monthsDueByMember[checkin.member_id] || 0
            } : undefined
          })))
        }

        setTodayCount(count ?? 0)
      } catch (error) {
        console.error('Failed to fetch checkins:', error)
      }
    }

    // A single new row arrives over realtime; only look up its member and dues
    const handleInsert = async (row: CheckinData) => {
      if (new Date(row.check_in_time) < startOfToday() || seenIds.has(row.id)) return
      seenIds.add(row.id)

      const [{ data: memberData }, { data: overdueInvoices }] = await Promise.all([
        supabase
          .from('members')
          .select('name, member_id')
          .eq('id', row.member_id)
          .single(),
        supabase
          .from('invoices')
          .select('months_due')
          .eq('member_id', row.member_id)
          .eq('status', 'due'),
      ])

      const monthsDue = overdueInvoices?.reduce((sum, inv) => sum + (inv.months_due || 0), 0) || 0
      const newCheckin: CheckinData = {
        id: row.id,
        member_id: row.member_id,
        check_in_time: row.check_in_time,
        entry_method: row.entry_method,
        device_name: row.device_name,
        member: memberData ? { ...memberData, months_due: monthsDue } : undefined,
      }

      setRecentCheckins(prev =>
        [newCheckin, ...prev.filter(c => c.id !== newCheckin.id)]
          .sort((a, b) => b.check_in_time.localeCompare(a.check_in_time))
          .slice(0, MAX_RECENT)
      )
      setTodayCount(prev => prev + 1)
    }

    const startFallbackPolling = () => {
      if (!pollInterval) pollInterval = setInterval(fetchTodayCheckins, FALLBACK_POLL_INTERVAL_MS)
    }

    const stopFallbackPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null
      }
    }

    fetchTodayCheckins()

    const channel = supabase
      .channel('checkins-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'checkins' },
        payload => { handleInsert(payload.new as CheckinData) }
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          stopFallbackPolling()
          // Catch up on anything inserted while the channel was down
          fetchTodayCheckins()
        } else {
          setIsConnected(false)
          startFallbackPolling()
        }
      })

    // Reset at midnight
    const scheduleMidnightReset = (): ReturnType<typeof setTimeout> => {
      const midnight = new Date()
      midnight.setHours(24, 0, 0, 0)

      return setTimeout(() => {
        seenIds.clear()
        setRecentCheckins([])
        setTodayCount(0)
        fetchTodayCheckins()
        midnightTimer = scheduleMidnightReset()
      }, midnight.getTime() - Date.now())
    }

    let midnightTimer = scheduleMidnightReset()

    return () => {
      stopFallbackPolling()
      clearTimeout(midnightTimer)
      supabase.removeChannel(channel)
    }
  }, [])

  return {
    recentCheckins,
    todayCount,
    isConnected
  }
}
