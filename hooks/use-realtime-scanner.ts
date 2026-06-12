"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ScannerStatus {
  connected: boolean
  deviceInfo?: {
    name: string
    model: string
    ip: string
  }
  stats?: {
    enrolledUsers: number
    todayScans: number
    lastScan: string | null
    lastSync: string | null
  }
  lastUpdated: string
}

export function useRealtimeScanner() {
  const [scannerStatus, setScannerStatus] = useState<ScannerStatus>({
    connected: false,
    lastUpdated: new Date().toISOString()
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load initial status
    loadScannerStatus()
    
    // Set up real-time updates for check-ins (affects scanner stats)
    const supabase = createClient()
    
    const channel = supabase
      .channel('scanner-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'checkins'
        },
        () => {
          // When new check-in happens, update scanner stats
          updateScannerStats()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'biometric_devices'
        },
        () => {
          // When device settings change, reload status
          loadScannerStatus()
        }
      )
      .subscribe()
    
    // Periodic status check (every 2 minutes)
    const interval = setInterval(loadScannerStatus, 120000)
    
    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  const loadScannerStatus = async () => {
    try {
      const response = await fetch('/api/biometric/status')
      const data = await response.json()
      
      setScannerStatus({
        connected: data.connected,
        deviceInfo: data.deviceInfo,
        stats: data.stats,
        lastUpdated: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to load scanner status:', error)
      setScannerStatus(prev => ({
        ...prev,
        connected: false,
        lastUpdated: new Date().toISOString()
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const updateScannerStats = async () => {
    try {
      const supabase = createClient()
      
      // Get today's scan count
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { data: todayCheckins } = await supabase
        .from('checkins')
        .select('id')
        .gte('check_in_time', today.toISOString())
        .eq('entry_method', 'biometric')
      
      // Get last scan
      const { data: lastCheckin } = await supabase
        .from('checkins')
        .select('check_in_time')
        .eq('entry_method', 'biometric')
        .order('check_in_time', { ascending: false })
        .limit(1)
        .single()
      
      setScannerStatus(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          todayScans: todayCheckins?.length || 0,
          lastScan: lastCheckin?.check_in_time || null
        } as any,
        lastUpdated: new Date().toISOString()
      }))
      
    } catch (error) {
      console.error('Failed to update scanner stats:', error)
    }
  }

  const refreshStatus = () => {
    setIsLoading(true)
    loadScannerStatus()
  }

  return {
    scannerStatus,
    isLoading,
    refreshStatus
  }
}