"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, Scan, Loader2 } from "@/components/ui/icons"

export function ScannerStatus() {
  const [isConnected, setIsConnected] = useState(true)
  const [isTestingScanner, setIsTestingScanner] = useState(false)

  const handleTestScan = async () => {
    setIsTestingScanner(true)
    const supabase = createClient()

    try {
      // Get a random active member for testing
      const { data: members } = await supabase.from("members").select("id").eq("status", "active").limit(1)

      if (members && members.length > 0) {
        // Insert a test check-in
        const { error } = await supabase.from("checkins").insert({
          member_id: members[0].id,
          scanner_id: "test_scanner",
          checked_in_at: new Date().toISOString(),
        })

        if (error) {
          console.error("[v0] Test scan error:", error)
        } else {
          console.log("[v0] Test scan successful")
        }
      }
    } catch (error) {
      console.error("[v0] Test scan failed:", error)
    } finally {
      setTimeout(() => {
        setIsTestingScanner(false)
      }, 2000)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          Scanner Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnected ? <Wifi className="h-4 w-4 text-success" /> : <WifiOff className="h-4 w-4 text-destructive" />}
            <span className="text-sm">Main Entrance</span>
          </div>
          <Badge variant={isConnected ? "default" : "destructive"}>{isConnected ? "Connected" : "Offline"}</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Last Scan:</span>
            <span>2 minutes ago</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Today's Scans:</span>
            <span>47</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Bridge Token:</span>
            <span className="font-mono text-xs">abc123...def</span>
          </div>
        </div>

        <Button
          onClick={handleTestScan}
          disabled={isTestingScanner}
          className="w-full bg-transparent"
          variant="outline"
        >
          {isTestingScanner ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing Scanner...
            </>
          ) : (
            <>
              <Scan className="h-4 w-4 mr-2" />
              Test Scan
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground">
          <p>Scanner bridge connection status and testing panel.</p>
          <p className="mt-1">Use "Test Scan" to simulate a member check-in.</p>
        </div>
      </CardContent>
    </Card>
  )
}
