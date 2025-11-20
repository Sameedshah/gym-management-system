"use client"

import { useState } from "react"
import { useClerk } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Settings, Save, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

export function SystemSettings() {
  const [settings, setSettings] = useState({
    gymName: "FitLife Gym",
    adminEmail: "admin@gym.com",
    autoExpireMembers: true,
    membershipExpiryDays: 90,
    notificationSound: true,
    realTimeUpdates: true,
  })
  const [isSaving, setIsSaving] = useState(false)
  const { signOut } = useClerk()
  const router = useRouter()

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate saving settings
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  const handleLogout = async () => {
    await signOut()
    router.push("/sign-in")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          General Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="gymName">Gym Name</Label>
            <Input
              id="gymName"
              value={settings.gymName}
              onChange={(e) => setSettings({ ...settings, gymName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminEmail">Admin Email</Label>
            <Input
              id="adminEmail"
              type="email"
              value={settings.adminEmail}
              onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDays">Membership Expiry (Days)</Label>
            <Input
              id="expiryDays"
              type="number"
              min="1"
              value={settings.membershipExpiryDays}
              onChange={(e) => setSettings({ ...settings, membershipExpiryDays: Number.parseInt(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              Members will be marked as expired after this many days of inactivity
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-expire Members</Label>
              <p className="text-sm text-muted-foreground">Automatically mark inactive members as expired</p>
            </div>
            <Switch
              checked={settings.autoExpireMembers}
              onCheckedChange={(checked) => setSettings({ ...settings, autoExpireMembers: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notification Sound</Label>
              <p className="text-sm text-muted-foreground">Play sound for new check-in notifications</p>
            </div>
            <Switch
              checked={settings.notificationSound}
              onCheckedChange={(checked) => setSettings({ ...settings, notificationSound: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Real-time Updates</Label>
              <p className="text-sm text-muted-foreground">Enable live dashboard updates</p>
            </div>
            <Switch
              checked={settings.realTimeUpdates}
              onCheckedChange={(checked) => setSettings({ ...settings, realTimeUpdates: checked })}
            />
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>

          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
