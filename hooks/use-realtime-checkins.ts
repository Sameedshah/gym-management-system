"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

interface CheckinData {
  id: string
  member_id: string
  check_in_time: string
  entry_method: string
  device_name: string
  member?: {
    name: string
    member_id: string
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
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    const supabase = createClient()
    
    // Load initial data
    loadInitialData()
    
    // Set up real-time subscription
    const checkinChannel = supabase
      .channel('checkins-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'checkins'
        },
        async (payload) => {
          console.log('🔔 New check-in received:', payload)
          
          // Get member details for the new check-in
          const { data: memberData } = await supabase
            .from('members')
            .select('name, member_id')
            .eq('id', payload.new.member_id)
            .single()
          
          const newCheckin: CheckinData = {
            ...payload.new as CheckinData,
            member: memberData || undefined
          }
          
          // Add to recent check-ins (keep only last 10)
          setRecentCheckins(prev => [newCheckin, ...prev.slice(0, 9)])
          
          // Update today's count if it's today
          const checkinDate = new Date(payload.new.check_in_time)
          const today = new Date()
          if (checkinDate.toDateString() === today.toDateString()) {
            setTodayCount(prev => prev + 1)
          }
          
          // Show notification (optional)
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Check-in', {
              body: `${memberData?.name || 'Member'} checked in`,
              icon: '/favicon.ico'
            })
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
        setIsConnected(status === 'SUBSCRIBED')
      })
    
    setChannel(checkinChannel)
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    
    return () => {
      if (checkinChannel) {
        supabase.removeChannel(checkinChannel)
      }
    }
  }, [])

  const loadInitialData = async () => {
    const supabase = createClient()
    
    try {
      // Load recent check-ins with member details
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
        .order('check_in_time', { ascending: false })
        .limit(10)
      
      if (checkins) {
        const formattedCheckins = checkins.map(checkin => ({
          ...checkin,
          member: checkin.members ? {
            name: (checkin.members as any).name,
            member_id: (checkin.members as any).member_id
          } : undefined
        }))
        setRecentCheckins(formattedCheckins)
      }
      
      // Load today's count
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { data: todayCheckins } = await supabase
        .from('checkins')
        .select('id')
        .gte('check_in_time', today.toISOString())
      
      setTodayCount(todayCheckins?.length || 0)
      
    } catch (error) {
      console.error('Failed to load initial checkin data:', error)
    }
  }

  return {
    recentCheckins,
    todayCount,
    isConnected
  }
}