"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, Scan, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface ScannerStatusData {
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
}

export function ScannerStatus() {
  const [statusData, setStatusData] = useState<ScannerStatusData>({
    connected: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isTestingScanner, setIsTestingScanner] = useState(false)

  // Load scanner status on component mount and set up real-time updates
  useEffect(() => {
    loadScannerStatus()
    
    // Set up periodic status updates
    const interval = setInterval(loadScannerStatus, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  const loadScannerStatus = async () => {
    try {
      const response = await fetch('/api/biometric/status')
      const data = await response.json()
      
      setStatusData({
        connected: data.connected,
        deviceInfo: data.deviceInfo,
        stats: data.stats
      })
    } catch (error) {
      console.error('Failed to load scanner status:', error)
      setStatusData({ connected: false })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestScan = async () => {
    if (!statusData.connected) {
      toast.error('Scanner is not connected')
      return
    }

    setIsTestingScanner(true)

    try {
      const response = await fetch('/api/biometric/sync-attendance', {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Test scan completed successfully')
        // Refresh status to get updated stats
        await loadScannerStatus()
      } else {
        toast.error(result.error || 'Test scan failed')
      }
    } catch (error) {
      toast.error('Failed to perform test scan')
    } finally {
      setIsTestingScanner(false)
    }
  }

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Never'
    
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`
    return `${Math.floor(diffMins / 1440)} days ago`
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Scanner Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Scanner Status
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadScannerStatus}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {statusData.connected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">
              {statusData.deviceInfo?.name || 'Main Entrance'}
            </span>
          </div>
          <Badge variant={statusData.connected ? "default" : "destructive"}>
            {statusData.connected ? "Connected" : "Offline"}
          </Badge>
        </div>

        {statusData.connected && statusData.deviceInfo && (
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Model:</span>
              <span>{statusData.deviceInfo.model}</span>
            </div>
            <div className="flex justify-between">
              <span>IP Address:</span>
              <span className="font-mono">{statusData.deviceInfo.ip}</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Last Scan:</span>
            <span>{formatTimeAgo(statusData.stats?.lastScan || null)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Today's Scans:</span>
            <span>{statusData.stats?.todayScans || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Enrolled Users:</span>
            <span>{statusData.stats?.enrolledUsers || 0}</span>
          </div>
          {statusData.stats?.lastSync && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Sync:</span>
              <span>{formatTimeAgo(statusData.stats.lastSync)}</span>
            </div>
          )}
        </div>

        <Button
          onClick={handleTestScan}
          disabled={isTestingScanner || !statusData.connected}
          className="w-full"
          variant="outline"
        >
          {isTestingScanner ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Syncing Attendance...
            </>
          ) : (
            <>
              <Scan className="h-4 w-4 mr-2" />
              Sync Attendance
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground">
          <p>Real-time scanner connection status and testing panel.</p>
          <p className="mt-1">Use "Sync Attendance" to fetch latest attendance records.</p>
        </div>
      </CardContent>
    </Card>
  )
}
