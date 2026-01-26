"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, Scan, Loader2, RefreshCw, Zap } from "lucide-react"
import { toast } from "sonner"
import { useRealtimeScanner } from "@/hooks/use-realtime-scanner"

export function ScannerStatus() {
  const { scannerStatus, isLoading, refreshStatus } = useRealtimeScanner()

  const handleSyncAttendance = async () => {
    if (!scannerStatus.connected) {
      toast.error('Scanner is not connected')
      return
    }

    try {
      const response = await fetch('/api/biometric/sync-attendance', {
        method: 'POST'
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Synced ${result.syncedCount || 0} attendance records`)
        refreshStatus()
      } else {
        toast.error(result.error || 'Sync failed')
      }
    } catch (error) {
      toast.error('Failed to sync attendance')
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
            {scannerStatus.connected && (
              <Zap className="h-4 w-4 text-green-500" title="Real-time updates active" />
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshStatus}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {scannerStatus.connected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">
              {scannerStatus.deviceInfo?.name || 'Main Entrance'}
            </span>
          </div>
          <Badge variant={scannerStatus.connected ? "default" : "destructive"}>
            {scannerStatus.connected ? "Connected" : "Offline"}
          </Badge>
        </div>

        {scannerStatus.connected && scannerStatus.deviceInfo && (
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Model:</span>
              <span>{scannerStatus.deviceInfo.model}</span>
            </div>
            <div className="flex justify-between">
              <span>IP Address:</span>
              <span className="font-mono">{scannerStatus.deviceInfo.ip}</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Last Scan:</span>
            <span>{formatTimeAgo(scannerStatus.stats?.lastScan || null)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Today's Scans:</span>
            <span className="font-bold text-green-600">
              {scannerStatus.stats?.todayScans || 0}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Enrolled Users:</span>
            <span>{scannerStatus.stats?.enrolledUsers || 0}</span>
          </div>
          {scannerStatus.stats?.lastSync && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last Sync:</span>
              <span>{formatTimeAgo(scannerStatus.stats.lastSync)}</span>
            </div>
          )}
        </div>

        <Button
          onClick={handleSyncAttendance}
          disabled={!scannerStatus.connected}
          className="w-full"
          variant="outline"
        >
          <Scan className="h-4 w-4 mr-2" />
          Manual Sync
        </Button>

        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-1 mb-1">
            <Zap className="h-3 w-3 text-green-500" />
            <span>Real-time push updates active</span>
          </div>
          <p>Device pushes attendance instantly to server.</p>
          <p className="mt-1">Manual sync available for backup.</p>
        </div>
      </CardContent>
    </Card>
  )
}
