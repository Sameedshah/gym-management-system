"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Fingerprint, Wifi, WifiOff, Save, TestTube, RefreshCw, Users, Clock, Zap } from "lucide-react"
import { toast } from "sonner"

interface BiometricSettings {
  enabled: boolean
  deviceIP: string
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
    deviceIP: "192.168.1.201",
    password: "0",
    port: 4370,
    autoSync: true,
    syncInterval: 3
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
          ZKTeco K40 Biometric Scanner Settings
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
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Device Configuration</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/api/docs/setup-guide', '_blank')}
            >
              📖 Setup Guide
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deviceIP">Device IP Address</Label>
              <Input
                id="deviceIP"
                placeholder="192.168.1.201"
                value={settings.deviceIP}
                onChange={(e) => setSettings({ ...settings, deviceIP: e.target.value })}
                disabled={!settings.enabled}
              />
              <p className="text-xs text-muted-foreground">
                ZKTeco K40 device IP address
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                placeholder="4370"
                value={settings.port}
                onChange={(e) => setSettings({ ...settings, port: Number(e.target.value) })}
                disabled={!settings.enabled}
              />
              <p className="text-xs text-muted-foreground">
                Default: 4370 (TCP)
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="password">Device Password</Label>
              <Input
                id="password"
                type="text"
                placeholder="0"
                value={settings.password}
                onChange={(e) => setSettings({ ...settings, password: e.target.value })}
                disabled={!settings.enabled}
              />
              <p className="text-xs text-muted-foreground">
                Default password is "0" (zero). No username required for ZKTeco devices.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleTestConnection}
              disabled={!settings.enabled || isTesting || !settings.deviceIP || !settings.password}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {isTesting ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Setup Guides Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Setup & Configuration Guides</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">1</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Complete Setup Guide</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Full installation from device setup to listener service
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="mt-2 h-7 text-xs"
                    onClick={() => window.open('https://github.com/Sameedshah/gym-management-system/blob/master/biometric-listener/README.md', '_blank')}
                  >
                    📖 Full Guide
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">2</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Device Setup</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Configure ZKTeco K40 device and enroll fingerprints
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="mt-2 h-7 text-xs"
                    onClick={() => window.open('https://github.com/Sameedshah/gym-management-system/blob/master/docs/ZKTECO_DEVICE_SETUP_GUIDE.md', '_blank')}
                  >
                    🔧 Device Guide
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-sm">3</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Listener Service</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Install and configure background listener service
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="mt-2 h-7 text-xs"
                    onClick={() => window.open('https://github.com/Sameedshah/gym-management-system/blob/master/biometric-listener/QUICK_SETUP.md', '_blank')}
                  >
                    ⚡ Quick Setup
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Listener Service Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Background Listener Service</h3>
          
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">Near Real-time Updates (3-5 seconds)</h4>
                <p className="text-sm text-blue-700 mt-1">
                  The ZKTeco K40 listener service polls the device every 3 seconds for new attendance logs.
                </p>
                <div className="mt-3 space-y-2">
                  <div className="text-xs">
                    <span className="font-medium">Service Location:</span>
                    <code className="ml-2 px-2 py-1 bg-blue-100 rounded text-blue-800 text-xs">
                      biometric-listener/
                    </code>
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Installation:</span>
                    <code className="ml-2 px-2 py-1 bg-blue-100 rounded text-blue-800 text-xs">
                      cd biometric-listener && npm install && npm start
                    </code>
                  </div>
                  <div className="text-xs text-blue-600">
                    ✅ Auto-reconnect • ✅ Duplicate prevention • ✅ Windows Service support
                  </div>
                </div>
              </div>
            </div>
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
            <Label htmlFor="syncInterval">Listener Poll Interval (seconds)</Label>
            <Input
              id="syncInterval"
              type="number"
              min="2"
              max="10"
              value={settings.syncInterval}
              onChange={(e) => setSettings({ ...settings, syncInterval: Number(e.target.value) })}
              disabled={!settings.enabled || !settings.autoSync}
            />
            <p className="text-xs text-muted-foreground">
              How often the listener polls the device (2-10 seconds). Default: 3 seconds for near real-time.
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