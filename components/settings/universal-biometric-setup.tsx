"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Fingerprint, Wifi, WifiOff, Save, TestTube, RefreshCw, 
  Users, Clock, Plus, Trash2, Settings, HelpCircle, CheckCircle2 
} from "lucide-react"
import { toast } from "sonner"

interface BiometricDevice {
  id: string
  device_name: string
  device_type: string
  device_ip: string
  device_port: number
  username: string
  password: string
  is_active: boolean
  is_connected: boolean
  auto_sync: boolean
  sync_interval: number
  enrolled_users_count?: number
  last_sync?: string
}

const DEVICE_TYPES = [
  { value: 'hikvision', label: 'Hikvision', guide: 'DS-K1T804 series and compatible models' },
  { value: 'zkteco', label: 'ZKTeco', guide: 'F18, F19, and compatible models' },
  { value: 'suprema', label: 'Suprema', guide: 'BioStation series' },
  { value: 'anviz', label: 'Anviz', guide: 'W1, W2 series' },
  { value: 'essl', label: 'eSSL', guide: 'X990, K90 series' },
  { value: 'generic', label: 'Generic/Other', guide: 'Custom configuration' }
]

const SETUP_GUIDES = {
  hikvision: {
    steps: [
      'Connect device to network via Ethernet',
      'Access web interface at http://[device-ip]',
      'Login with admin credentials (default: admin/12345)',
      'Go to Configuration → Network → Advanced Settings',
      'Enable "ISAPI Service" and set port to 80',
      'Create API user: Configuration → User Management',
      'Set username and password (e.g., gymapi/YourPassword)',
      'Grant "Operator" level permissions',
      'Save settings and test connection'
    ],
    defaultPort: 80,
    apiType: 'ISAPI'
  },
  zkteco: {
    steps: [
      'Connect device to network',
      'Access device menu and note IP address',
      'Enable "Web Server" in device settings',
      'Access web interface at http://[device-ip]',
      'Login with admin credentials',
      'Enable "SDK" or "API" access',
      'Create API user with appropriate permissions',
      'Note the communication port (usually 4370)',
      'Test connection from application'
    ],
    defaultPort: 4370,
    apiType: 'SDK'
  },
  suprema: {
    steps: [
      'Connect device to network',
      'Install BioStar 2 software (if required)',
      'Access device web interface',
      'Enable API access in settings',
      'Generate API key or create API user',
      'Configure network settings',
      'Set communication port',
      'Test API connection'
    ],
    defaultPort: 443,
    apiType: 'REST API'
  },
  generic: {
    steps: [
      'Refer to your device manual for network setup',
      'Identify the API type (REST, SOAP, SDK)',
      'Enable API/SDK access in device settings',
      'Create API credentials',
      'Note IP address and port number',
      'Test basic connectivity (ping)',
      'Configure authentication method',
      'Test API connection'
    ],
    defaultPort: 80,
    apiType: 'Various'
  }
}

export function UniversalBiometricSetup() {
  const [devices, setDevices] = useState<BiometricDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState<BiometricDevice | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  const [formData, setFormData] = useState({
    device_name: '',
    device_type: 'hikvision',
    device_ip: '',
    device_port: 80,
    username: '',
    password: '',
    auto_sync: true,
    sync_interval: 5,
    is_active: true
  })

  useEffect(() => {
    loadDevices()
  }, [])

  const loadDevices = async () => {
    try {
      const response = await fetch('/api/biometric/devices')
      if (response.ok) {
        const data = await response.json()
        setDevices(data.devices || [])
      }
    } catch (error) {
      console.error('Failed to load devices:', error)
    }
  }

  const handleDeviceTypeChange = (type: string) => {
    const guide = SETUP_GUIDES[type as keyof typeof SETUP_GUIDES] || SETUP_GUIDES.generic
    setFormData({
      ...formData,
      device_type: type,
      device_port: guide.defaultPort
    })
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    try {
      const response = await fetch('/api/biometric/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success('Device connection successful!')
      } else {
        toast.error(result.error || 'Connection failed')
      }
    } catch (error) {
      toast.error('Failed to test connection')
    } finally {
      setIsTesting(false)
    }
  }

  const handleSaveDevice = async () => {
    if (!formData.device_name || !formData.device_ip || !formData.username || !formData.password) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSaving(true)
    try {
      const url = selectedDevice 
        ? `/api/biometric/devices/${selectedDevice.id}`
        : '/api/biometric/devices'
      
      const response = await fetch(url, {
        method: selectedDevice ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success(selectedDevice ? 'Device updated successfully' : 'Device added successfully')
        await loadDevices()
        setIsAddingNew(false)
        setSelectedDevice(null)
        resetForm()
      } else {
        toast.error(result.error || 'Failed to save device')
      }
    } catch (error) {
      toast.error('Failed to save device')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to delete this device?')) return

    try {
      const response = await fetch(`/api/biometric/devices/${deviceId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Device deleted successfully')
        await loadDevices()
      } else {
        toast.error('Failed to delete device')
      }
    } catch (error) {
      toast.error('Failed to delete device')
    }
  }

  const resetForm = () => {
    setFormData({
      device_name: '',
      device_type: 'hikvision',
      device_ip: '',
      device_port: 80,
      username: '',
      password: '',
      auto_sync: true,
      sync_interval: 5,
      is_active: true
    })
  }

  const currentGuide = SETUP_GUIDES[formData.device_type as keyof typeof SETUP_GUIDES] || SETUP_GUIDES.generic

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Biometric Devices Setup
        </CardTitle>
        <CardDescription>
          Configure fingerprint scanners for automated attendance tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="devices" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="devices">My Devices</TabsTrigger>
            <TabsTrigger value="setup">Add New Device</TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="space-y-4">
            {devices.length === 0 ? (
              <Alert>
                <HelpCircle className="h-4 w-4" />
                <AlertDescription>
                  No devices configured yet. Add your first biometric device to get started.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {devices.map((device) => (
                  <Card key={device.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{device.device_name}</h3>
                            {device.is_connected ? (
                              <Badge variant="default" className="bg-green-500">
                                <Wifi className="h-3 w-3 mr-1" />
                                Online
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <WifiOff className="h-3 w-3 mr-1" />
                                Offline
                              </Badge>
                            )}
                            {!device.is_active && (
                              <Badge variant="outline">Disabled</Badge>
                            )}
                          </div>
                          
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Type: {DEVICE_TYPES.find(t => t.value === device.device_type)?.label}</p>
                            <p>IP: {device.device_ip}:{device.device_port}</p>
                            <p>Enrolled Users: {device.enrolled_users_count || 0}</p>
                            {device.last_sync && (
                              <p>Last Sync: {new Date(device.last_sync).toLocaleString()}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDevice(device)
                              setFormData(device)
                              setIsAddingNew(true)
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDevice(device.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="setup" className="space-y-6">
            {/* Device Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="device_type">Device Type *</Label>
              <Select value={formData.device_type} onValueChange={handleDeviceTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEVICE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.guide}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Setup Guide */}
            <Alert>
              <HelpCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Setup Guide for {DEVICE_TYPES.find(t => t.value === formData.device_type)?.label}:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    {currentGuide.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                  <p className="text-xs mt-2">API Type: {currentGuide.apiType} | Default Port: {currentGuide.defaultPort}</p>
                </div>
              </AlertDescription>
            </Alert>

            <Separator />

            {/* Device Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="device_name">Device Name *</Label>
                <Input
                  id="device_name"
                  placeholder="e.g., Main Entrance Scanner"
                  value={formData.device_name}
                  onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="device_ip">Device IP Address *</Label>
                <Input
                  id="device_ip"
                  placeholder="192.168.1.64"
                  value={formData.device_ip}
                  onChange={(e) => setFormData({ ...formData, device_ip: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="device_port">Port</Label>
                <Input
                  id="device_port"
                  type="number"
                  value={formData.device_port}
                  onChange={(e) => setFormData({ ...formData, device_port: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  placeholder="API username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="API password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sync_interval">Sync Interval (minutes)</Label>
                <Input
                  id="sync_interval"
                  type="number"
                  min="1"
                  max="60"
                  value={formData.sync_interval}
                  onChange={(e) => setFormData({ ...formData, sync_interval: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Switches */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Sync Attendance</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync attendance records
                  </p>
                </div>
                <Switch
                  checked={formData.auto_sync}
                  onCheckedChange={(checked) => setFormData({ ...formData, auto_sync: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Device</Label>
                  <p className="text-sm text-muted-foreground">
                    Activate this device for use
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleTestConnection}
                disabled={isTesting || !formData.device_ip || !formData.username || !formData.password}
              >
                <TestTube className="h-4 w-4 mr-2" />
                {isTesting ? 'Testing...' : 'Test Connection'}
              </Button>

              <Button 
                onClick={handleSaveDevice}
                disabled={isSaving}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : selectedDevice ? 'Update Device' : 'Add Device'}
              </Button>

              {(isAddingNew || selectedDevice) && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsAddingNew(false)
                    setSelectedDevice(null)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}