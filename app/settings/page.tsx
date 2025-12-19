import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { SystemSettings } from "@/components/settings/system-settings"
import { BiometricSettings } from "@/components/settings/biometric-settings"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function SettingsPage() {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Settings" description="Configure your gym management system" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-2xl font-bold">System Settings</h2>
                <p className="text-muted-foreground">Configure your gym management system</p>
              </div>

              <div className="grid gap-6">
                <SystemSettings />
                <BiometricSettings />
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
