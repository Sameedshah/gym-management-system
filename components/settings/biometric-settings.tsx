"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Fingerprint, Wifi, WifiOff, Save, TestTube, RefreshCw, Users, Clock } from "lucide-react"
import { toast } from "sonner"

interface BiometricSettings {
  enabled: boolean
  deviceIP: string
  username: string
  password: string
  port: number
  autoSync: boolean
  syncInterval: number
}

interface DeviceStatus {
  connected: boolean
  deviceInfo?: any
  userCount?: number
  lastSync?: string
}

export function BiometricSettings() {
  const [settings, setSettings] = useState<BiometricSettings>({
    enabled: false,
    deviceIP: "192.168.1.64",
    username: "gymapi",
    password: "",
    port: 80,
    autoSync: true,
    syncInterval: 5
  })
  
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    connected: false
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  // Load settings on component mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings/biometric')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || settings)
        setDeviceStatus(data.status || deviceStatus)
      }
    } catch (error) {
      console.error('Failed to load biometric settings:', error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings/biometric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success('Biometric settings saved successfully')
        await loadSettings() // Reload to get updated status
      } else {
        toast.error(result.error || 'Failed to save settings')
      }
    } catch (error) {
      toast.error('Failed to save biometric settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    try {
      const response = await fetch('/api/biometric/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceIP: settings.deviceIP,
          username: settings.username,
          password: settings.password,
          port: settings.port
        })
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success('Device connection successful!')
        setDeviceStatus({
          connected: true,
          deviceInfo: result.deviceInfo,
          userCount: result.userCount
        })
      } else {
        toast.error(result.error || 'Connection failed')
        setDeviceStatus({ connected: false })
      }
    } catch (error) {
      toast.error('Failed to test connection')
      setDeviceStatus({ connected: false })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSyncAttendance = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/biometric/sync-attendance', {
        method: 'POST'
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success(`Synced ${result.syncedCount} attendance records`)
        setDeviceStatus(prev => ({
          ...prev,
          lastSync: new Date().toISOString()
        }))
      } else {
        toast.error(result.error || 'Sync failed')
      }
    } catch (error) {
      toast.error('Failed to sync attendance')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Biometric Scanner Settings
        </CardTitle>
        <div className="flex items-center gap-2">
          {deviceStatus.connected ? (
            <Badge variant="default" className="bg-green-500">
              <Wifi className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary">
              <WifiOff className="h-3 w-3 mr-1" />
              Disconnected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Biometric System */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Biometric System</Label>
            <p className="text-sm text-muted-foreground">
              Enable fingerprint scanner integration for member check-ins
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
          />
        </div>

        <Separator />

        {/* Device Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Device Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deviceIP">Device IP Address</Label>
              <Input
                id="deviceIP"
                placeholder="192.168.1.64"
                value={settings.deviceIP}
                onChange={(e) => setSettings({ ...settings, deviceIP: e.target.value })}
                disabled={!settings.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                placeholder="80"
                value={settings.port}
                onChange={(e) => setSettings({ ...settings, port: Number(e.target.value) })}
                disabled={!settings.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="gymapi"
                value={settings.username}
                onChange={(e) => setSettings({ ...settings, username: e.target.value })}
                disabled={!settings.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter device password"
                value={settings.password}
                onChange={(e) => setSettings({ ...settings, password: e.target.value })}
                disabled={!settings.enabled}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleTestConnection}
              disabled={!settings.enabled || isTesting || !settings.deviceIP || !settings.username || !settings.password}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {isTesting ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Sync Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Sync Settings</h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Sync Attendance</Label>
              <p className="text-sm text-muted-foreground">
                Automatically sync attendance records from the device
              </p>
            </div>
            <Switch
              checked={settings.autoSync}
              onCheckedChange={(checked) => setSettings({ ...settings, autoSync: checked })}
              disabled={!settings.enabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="syncInterval">Sync Interval (minutes)</Label>
            <Input
              id="syncInterval"
              type="number"
              min="1"
              max="60"
              value={settings.syncInterval}
              onChange={(e) => setSettings({ ...settings, syncInterval: Number(e.target.value) })}
              disabled={!settings.enabled || !settings.autoSync}
            />
            <p className="text-xs text-muted-foreground">
              How often to sync attendance records (1-60 minutes)
            </p>
          </div>

          <Button 
            variant="outline" 
            onClick={handleSyncAttendance}
            disabled={!settings.enabled || !deviceStatus.connected || isSyncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>

        <Separator />

        {/* Device Status */}
        {deviceStatus.connected && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Device Status</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Enrolled Users</p>
                  <p className="text-lg font-bold">{deviceStatus.userCount || 0}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Wifi className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Connection</p>
                  <p className="text-lg font-bold text-green-500">Online</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Sync</p>
                  <p className="text-sm">
                    {deviceStatus.lastSync 
                      ? new Date(deviceStatus.lastSync).toLocaleString()
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
            </div>

            {deviceStatus.deviceInfo && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Device Information</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Model: {deviceStatus.deviceInfo.DeviceInfo?.model?.[0] || 'Unknown'}</p>
                  <p>Serial: {deviceStatus.deviceInfo.DeviceInfo?.serialNumber?.[0] || 'Unknown'}</p>
                  <p>Firmware: {deviceStatus.deviceInfo.DeviceInfo?.firmwareVersion?.[0] || 'Unknown'}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}