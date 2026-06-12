"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Fingerprint, Wifi, WifiOff, Users, Clock, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface BiometricStatus {
  enabled: boolean
  connected: boolean
  deviceInfo?: any
  userCount?: number
  lastSync?: string
}

export function BiometricStatus() {
  const [status, setStatus] = useState<BiometricStatus>({
    enabled: false,
    connected: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/settings/biometric')
      if (response.ok) {
        const data = await response.json()
        setStatus({
          enabled: data.settings?.enabled || false,
          connected: data.status?.connected || false,
          deviceInfo: data.status?.deviceInfo,
          userCount: data.status?.userCount || 0,
          lastSync: data.status?.lastSync
        })
      }
    } catch (error) {
      console.error('Failed to load biometric status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/biometric/sync-attendance', {
        method: 'POST'
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success(`Synced ${result.syncedCount} attendance records`)
        await loadStatus() // Refresh status
      } else {
        toast.error(result.error || 'Sync failed')
      }
    } catch (error) {
      toast.error('Failed to sync attendance')
    } finally {
      setIsSyncing(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Biometric Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!status.enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Biometric Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Badge variant="secondary">Disabled</Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Enable in settings to use fingerprint scanning
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Biometric Scanner
        </CardTitle>
        <div className="flex items-center gap-2">
          {status.connected ? (
            <Badge variant="default" className="bg-green-500">
              <Wifi className="h-3 w-3 mr-1" />
              Online
            </Badge>
          ) : (
            <Badge variant="destructive">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.connected ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Enrolled</p>
                  <p className="text-lg font-bold">{status.userCount}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Sync</p>
                  <p className="text-xs text-muted-foreground">
                    {status.lastSync 
                      ? new Date(status.lastSync).toLocaleTimeString()
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSync}
              disabled={isSyncing}
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">
              Device not connected. Check settings.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}