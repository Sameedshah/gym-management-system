"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, RefreshCw, Copy, Eye, EyeOff } from "lucide-react"

export function BridgeSettings() {
  const [bridgeToken, setBridgeToken] = useState("abc123def456ghi789jkl012mno345pqr678stu901vwx234yz")
  const [isConnected, setIsConnected] = useState(true)
  const [showToken, setShowToken] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  const handleRegenerateToken = async () => {
    setIsRegenerating(true)
    // Simulate token regeneration
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setBridgeToken(Math.random().toString(36).substring(2, 50))
    setIsRegenerating(false)
  }

  const handleCopyToken = () => {
    navigator.clipboard.writeText(bridgeToken)
  }

  const maskedToken = `${bridgeToken.substring(0, 8)}${"*".repeat(bridgeToken.length - 16)}${bridgeToken.substring(bridgeToken.length - 8)}`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isConnected ? <Wifi className="h-5 w-5 text-success" /> : <WifiOff className="h-5 w-5 text-destructive" />}
          Scanner Bridge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Connection Status</h4>
            <p className="text-sm text-muted-foreground">Scanner bridge connection state</p>
          </div>
          <Badge variant={isConnected ? "default" : "destructive"}>{isConnected ? "Connected" : "Disconnected"}</Badge>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bridgeToken">Bridge Token</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="bridgeToken"
                  type={showToken ? "text" : "password"}
                  value={showToken ? bridgeToken : maskedToken}
                  readOnly
                  className="font-mono text-sm pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button variant="outline" size="icon" onClick={handleCopyToken}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Use this token to authenticate your scanner bridge device</p>
          </div>

          <Button variant="outline" onClick={handleRegenerateToken} disabled={isRegenerating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? "animate-spin" : ""}`} />
            {isRegenerating ? "Regenerating..." : "Regenerate Token"}
          </Button>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Bridge Configuration</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Endpoint:</span>
              <span className="font-mono">wss://api.gym.com/bridge</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Protocol:</span>
              <span>WebSocket</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Ping:</span>
              <span>2 seconds ago</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
