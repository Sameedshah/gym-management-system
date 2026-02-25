import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentCheckIns } from "@/components/dashboard/recent-checkins"
import { NotificationCard } from "@/components/dashboard/notification-card"
import { AdminOverview } from "@/components/admin/admin-overview"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Dashboard" description="Real-time gym management overview" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <DashboardStats />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <AdminOverview />
                  <RecentCheckIns />
                </div>

                <div>
                  <NotificationCard />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
