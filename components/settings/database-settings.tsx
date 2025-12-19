"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database, RefreshCw, Trash2, Download } from "lucide-react"

export function DatabaseSettings() {
  const [isRunningMaintenance, setIsRunningMaintenance] = useState(false)
  const [stats, setStats] = useState({
    totalMembers: 156,
    totalInvoices: 342,
    totalCheckIns: 1247,
    databaseSize: "2.4 MB",
    lastBackup: "2 hours ago",
  })

  const handleRunMaintenance = async () => {
    setIsRunningMaintenance(true)
    const supabase = createClient()

    try {
      // Run maintenance functions
      await supabase.rpc("update_invoice_status")
      await supabase.rpc("expire_inactive_members")

      // Simulate maintenance time
      await new Promise((resolve) => setTimeout(resolve, 2000))
    } catch (error) {
      console.error("Maintenance error:", error)
    } finally {
      setIsRunningMaintenance(false)
    }
  }

  const handleExportData = () => {
    // Simulate data export
    const data = {
      members: stats.totalMembers,
      invoices: stats.totalInvoices,
      checkIns: stats.totalCheckIns,
      exportDate: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `gym-data-export-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <div className="text-xs text-muted-foreground">Members</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            <div className="text-xs text-muted-foreground">Invoices</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{stats.totalCheckIns}</div>
            <div className="text-xs text-muted-foreground">Check-ins</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{stats.databaseSize}</div>
            <div className="text-xs text-muted-foreground">DB Size</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Database Status</h4>
              <p className="text-sm text-muted-foreground">Connection and health status</p>
            </div>
            <Badge className="bg-success text-success-foreground">Healthy</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Last Backup</h4>
              <p className="text-sm text-muted-foreground">Automatic backup status</p>
            </div>
            <span className="text-sm">{stats.lastBackup}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleRunMaintenance} disabled={isRunningMaintenance}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunningMaintenance ? "animate-spin" : ""}`} />
            {isRunningMaintenance ? "Running..." : "Run Maintenance"}
          </Button>

          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>

          <Button variant="outline" className="text-destructive hover:text-destructive bg-transparent">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Old Data
          </Button>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Maintenance Tasks</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Update overdue invoice statuses</li>
            <li>• Expire inactive members (90+ days)</li>
            <li>• Clean up old check-in records</li>
            <li>• Optimize database indexes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
