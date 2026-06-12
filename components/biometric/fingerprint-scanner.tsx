"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Fingerprint, Wifi, WifiOff, Scan, CheckCircle, XCircle, Loader2 } from "lucide-react"

interface FingerprintScannerProps {
  onScanComplete?: (biometricData: {
    biometric_id: string
    fingerprint_data: string
    scanner_device_id: string
  }) => void
  onError?: (error: string) => void
}

export function FingerprintScanner({ onScanComplete, onError }: FingerprintScannerProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null)
  const [deviceInfo, setDeviceInfo] = useState<any>(null)

  // Simulate scanner connection
  const connectToScanner = async () => {
    try {
      setIsConnected(false)
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulate successful connection
      setIsConnected(true)
      setDeviceInfo({
        device_id: 'FP_SCANNER_001',
        model: 'BioMax Pro 3000',
        firmware: '2.1.4',
        status: 'Ready'
      })
    } catch (error) {
      onError?.('Failed to connect to fingerprint scanner')
    }
  }

  // Simulate fingerprint scanning
  const startScan = async () => {
    if (!isConnected) {
      onError?.('Scanner not connected')
      return
    }

    setIsScanning(true)
    setScanResult(null)

    try {
      // Simulate scanning process
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Simulate successful scan (90% success rate)
      if (Math.random() > 0.1) {
        const biometricData = {
          biometric_id: `BIO_${Date.now().toString().slice(-8)}`,
          fingerprint_data: generateMockFingerprintData(),
          scanner_device_id: deviceInfo.device_id
        }
        
        setScanResult('success')
        onScanComplete?.(biometricData)
      } else {
        setScanResult('error')
        onError?.('Fingerprint scan failed. Please try again.')
      }
    } catch (error) {
      setScanResult('error')
      onError?.('Scanner error occurred')
    } finally {
      setIsScanning(false)
    }
  }

  const generateMockFingerprintData = () => {
    // Generate mock fingerprint template data
    const template = Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('')
    return `FP_TEMPLATE_${template}`
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Fingerprint Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-success" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? 'Ready' : 'Offline'}
          </Badge>
        </div>

        {/* Device Information */}
        {deviceInfo && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Device:</span>
              <span>{deviceInfo.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID:</span>
              <span className="font-mono">{deviceInfo.device_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Firmware:</span>
              <span>{deviceInfo.firmware}</span>
            </div>
          </div>
        )}

        {/* Scan Area */}
        <div className="relative">
          <div className={`
            aspect-square w-32 mx-auto rounded-lg border-2 border-dashed 
            flex items-center justify-center transition-all duration-300
            ${isScanning ? 'border-primary bg-primary/5 animate-pulse' : 
              scanResult === 'success' ? 'border-success bg-success/5' :
              scanResult === 'error' ? 'border-destructive bg-destructive/5' :
              'border-muted-foreground/30'}
          `}>
            {isScanning ? (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            ) : scanResult === 'success' ? (
              <CheckCircle className="h-8 w-8 text-success" />
            ) : scanResult === 'error' ? (
              <XCircle className="h-8 w-8 text-destructive" />
            ) : (
              <Fingerprint className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          
          {isScanning && (
            <div className="text-center mt-2">
              <p className="text-sm text-muted-foreground">
                Place finger on scanner...
              </p>
            </div>
          )}
        </div>

        {/* Scan Results */}
        {scanResult && (
          <Alert>
            <AlertDescription>
              {scanResult === 'success' 
                ? 'Fingerprint captured successfully!' 
                : 'Scan failed. Please try again.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {!isConnected ? (
            <Button onClick={connectToScanner} className="w-full">
              <Wifi className="h-4 w-4 mr-2" />
              Connect Scanner
            </Button>
          ) : (
            <Button 
              onClick={startScan} 
              disabled={isScanning}
              className="w-full"
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Scan className="h-4 w-4 mr-2" />
                  Start Scan
                </>
              )}
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Ensure finger is clean and dry</p>
          <p>• Press firmly on the scanner surface</p>
          <p>• Hold still until scan completes</p>
        </div>
      </CardContent>
    </Card>
  )
}