# Hikvision Finger Scanner Integration Guide

## Overview
This guide explains how to integrate Hikvision Finger Scanner Attendance Device with your gym management system using ISAPI (Internet Server Application Programming Interface).

## Prerequisites

### Hardware Requirements
- Hikvision Finger Scanner Attendance Device (DS-K1T804 series or similar)
- Network connection (Ethernet/WiFi)
- Power supply for the device

### Software Requirements
- Node.js application with network access
- Hikvision device with ISAPI support
- Device firmware version 5.0 or higher

## Device Setup

### 1. Network Configuration
```bash
# Default device IP (check device label)
Device IP: 192.168.1.64
Username: admin
Password: 12345 (change immediately)
```

### 2. Enable ISAPI Services
1. Access device web interface: `http://192.168.1.64`
2. Login with admin credentials
3. Go to **Configuration** → **Network** → **Advanced Settings**
4. Enable **ISAPI Service**
5. Set **ISAPI Port**: 80 (default)

### 3. Create Device User Account
```bash
# Create dedicated API user
Username: gymapi
Password: GymAPI@2025
Permissions: Operator level
```

## ISAPI Integration

### 1. Install Required Dependencies
```bash
npm install axios xml2js form-data
npm install @types/xml2js --save-dev
```

### 2. Create Hikvision Service

Create `lib/hikvision-service.ts`:

```typescript
import axios, { AxiosInstance } from 'axios'
import { parseString } from 'xml2js'
import FormData from 'form-data'

export class HikvisionService {
  private client: AxiosInstance
  private deviceIP: string
  private username: string
  private password: string

  constructor(deviceIP: string, username: string, password: string) {
    this.deviceIP = deviceIP
    this.username = username
    this.password = password
    
    this.client = axios.create({
      baseURL: `http://${deviceIP}`,
      auth: {
        username: this.username,
        password: this.password
      },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/xml'
      }
    })
  }

  // Test device connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/ISAPI/System/deviceInfo')
      return response.status === 200
    } catch (error) {
      console.error('Device connection failed:', error)
      return false
    }
  }

  // Get device information
  async getDeviceInfo() {
    try {
      const response = await this.client.get('/ISAPI/System/deviceInfo')
      return this.parseXMLResponse(response.data)
    } catch (error) {
      throw new Error(`Failed to get device info: ${error}`)
    }
  }

  // Add user with fingerprint
  async addUser(userData: {
    employeeNo: string
    name: string
    userType: string
  }) {
    const userXML = `
      <?xml version="1.0" encoding="UTF-8"?>
      <User>
        <employeeNo>${userData.employeeNo}</employeeNo>
        <name>${userData.name}</name>
        <userType>${userData.userType}</userType>
        <Valid>
          <enable>true</enable>
          <beginTime>2024-01-01T00:00:00</beginTime>
          <endTime>2030-12-31T23:59:59</endTime>
        </Valid>
      </User>
    `

    try {
      const response = await this.client.post('/ISAPI/AccessControl/UserInfo/Record', userXML)
      return this.parseXMLResponse(response.data)
    } catch (error) {
      throw new Error(`Failed to add user: ${error}`)
    }
  }

  // Enroll fingerprint for user
  async enrollFingerprint(employeeNo: string, fingerIndex: number = 1) {
    const enrollXML = `
      <?xml version="1.0" encoding="UTF-8"?>
      <FingerPrintEnroll>
        <employeeNo>${employeeNo}</employeeNo>
        <fingerPrintID>${fingerIndex}</fingerPrintID>
      </FingerPrintEnroll>
    `

    try {
      const response = await this.client.put('/ISAPI/AccessControl/FingerPrintEnroll', enrollXML)
      return this.parseXMLResponse(response.data)
    } catch (error) {
      throw new Error(`Failed to enroll fingerprint: ${error}`)
    }
  }

  // Get attendance records
  async getAttendanceRecords(startTime: string, endTime: string) {
    const searchXML = `
      <?xml version="1.0" encoding="UTF-8"?>
      <AcsEventCond>
        <searchID>001</searchID>
        <searchResultPosition>0</searchResultPosition>
        <maxResults>100</maxResults>
        <major>5</major>
        <minor>75</minor>
        <startTime>${startTime}</startTime>
        <endTime>${endTime}</endTime>
      </AcsEventCond>
    `

    try {
      const response = await this.client.post('/ISAPI/AccessControl/AcsEvent', searchXML)
      return this.parseXMLResponse(response.data)
    } catch (error) {
      throw new Error(`Failed to get attendance records: ${error}`)
    }
  }

  // Delete user
  async deleteUser(employeeNo: string) {
    try {
      const response = await this.client.delete(`/ISAPI/AccessControl/UserInfo/Record?format=json&employeeNo=${employeeNo}`)
      return response.status === 200
    } catch (error) {
      throw new Error(`Failed to delete user: ${error}`)
    }
  }

  // Parse XML response to JSON
  private parseXMLResponse(xmlData: string): Promise<any> {
    return new Promise((resolve, reject) => {
      parseString(xmlData, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }
}
```

### 3. Environment Configuration

Add to `.env.local`:
```env
# Hikvision Device Configuration
HIKVISION_DEVICE_IP=192.168.1.64
HIKVISION_USERNAME=gymapi
HIKVISION_PASSWORD=GymAPI@2025
HIKVISION_ENABLED=true
```

### 4. Create API Endpoints

Create `app/api/biometric/enroll/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { HikvisionService } from '@/lib/hikvision-service'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { memberId, memberName } = await request.json()

    if (!process.env.HIKVISION_ENABLED) {
      return NextResponse.json({ error: 'Biometric system disabled' }, { status: 400 })
    }

    const hikvision = new HikvisionService(
      process.env.HIKVISION_DEVICE_IP!,
      process.env.HIKVISION_USERNAME!,
      process.env.HIKVISION_PASSWORD!
    )

    // Test connection
    const isConnected = await hikvision.testConnection()
    if (!isConnected) {
      return NextResponse.json({ error: 'Device not connected' }, { status: 500 })
    }

    // Add user to device
    const userResult = await hikvision.addUser({
      employeeNo: memberId,
      name: memberName,
      userType: 'normal'
    })

    // Start fingerprint enrollment
    const enrollResult = await hikvision.enrollFingerprint(memberId)

    // Update member record in database
    const supabase = createClient()
    await supabase
      .from('members')
      .update({
        biometric_id: memberId,
        scanner_device_id: process.env.HIKVISION_DEVICE_IP
      })
      .eq('member_id', memberId)

    return NextResponse.json({
      success: true,
      message: 'Fingerprint enrollment started',
      userResult,
      enrollResult
    })

  } catch (error) {
    console.error('Biometric enrollment error:', error)
    return NextResponse.json(
      { error: 'Enrollment failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

Create `app/api/biometric/sync-attendance/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { HikvisionService } from '@/lib/hikvision-service'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.HIKVISION_ENABLED) {
      return NextResponse.json({ error: 'Biometric system disabled' }, { status: 400 })
    }

    const hikvision = new HikvisionService(
      process.env.HIKVISION_DEVICE_IP!,
      process.env.HIKVISION_USERNAME!,
      process.env.HIKVISION_PASSWORD!
    )

    // Get attendance records from last 24 hours
    const endTime = new Date().toISOString()
    const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const records = await hikvision.getAttendanceRecords(startTime, endTime)
    
    const supabase = createClient()
    let syncedCount = 0

    // Process each attendance record
    if (records.AcsEvent?.InfoList?.[0]?.Item) {
      for (const item of records.AcsEvent.InfoList[0].Item) {
        const employeeNo = item.employeeNoString?.[0]
        const time = item.time?.[0]
        
        if (employeeNo && time) {
          // Find member by biometric_id
          const { data: member } = await supabase
            .from('members')
            .select('id, name')
            .eq('biometric_id', employeeNo)
            .single()

          if (member) {
            // Check if check-in already exists
            const { data: existingCheckin } = await supabase
              .from('checkins')
              .select('id')
              .eq('member_id', member.id)
              .eq('check_in_time', time)
              .single()

            if (!existingCheckin) {
              // Create new check-in record
              await supabase
                .from('checkins')
                .insert({
                  member_id: member.id,
                  check_in_time: time,
                  scanner_id: process.env.HIKVISION_DEVICE_IP,
                  entry_method: 'biometric',
                  notes: 'Auto-synced from biometric device'
                })

              syncedCount++
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} attendance records`,
      syncedCount
    })

  } catch (error) {
    console.error('Attendance sync error:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

## Frontend Integration

### 1. Add Biometric Enrollment to Member Form

Update `components/members/add-member-dialog.tsx`:

```typescript
// Add biometric enrollment button
const handleBiometricEnroll = async (memberId: string, memberName: string) => {
  try {
    const response = await fetch('/api/biometric/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, memberName })
    })

    const result = await response.json()
    
    if (result.success) {
      toast.success('Fingerprint enrollment started. Please place finger on scanner.')
    } else {
      toast.error(result.error || 'Enrollment failed')
    }
  } catch (error) {
    toast.error('Failed to start enrollment')
  }
}
```

### 2. Add Attendance Sync Button

Create `components/biometric/sync-attendance.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Fingerprint, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export function SyncAttendanceButton() {
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/biometric/sync-attendance', {
        method: 'POST'
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success(`Synced ${result.syncedCount} attendance records`)
      } else {
        toast.error(result.error || 'Sync failed')
      }
    } catch (error) {
      toast.error('Failed to sync attendance')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Button onClick={handleSync} disabled={syncing} variant="outline">
      {syncing ? (
        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Fingerprint className="h-4 w-4 mr-2" />
      )}
      {syncing ? 'Syncing...' : 'Sync Attendance'}
    </Button>
  )
}
```

## Automated Attendance Sync

### 1. Create Cron Job API

Create `app/api/cron/sync-attendance/route.ts`:

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Call the sync attendance API
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/biometric/sync-attendance`, {
      method: 'POST'
    })

    const result = await response.json()
    
    return NextResponse.json({
      success: true,
      message: 'Cron job executed',
      result
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    )
  }
}
```

### 2. Setup Vercel Cron (if using Vercel)

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-attendance",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

## Troubleshooting

### Common Issues

1. **Device Not Responding**
   - Check network connectivity
   - Verify IP address and credentials
   - Ensure ISAPI service is enabled

2. **Authentication Failed**
   - Verify username/password
   - Check user permissions on device
   - Reset device credentials if needed

3. **Fingerprint Enrollment Fails**
   - Ensure device has storage space
   - Check fingerprint quality
   - Try different finger positions

4. **Attendance Records Not Syncing**
   - Verify time synchronization
   - Check device storage capacity
   - Ensure proper XML parsing

### Device Commands

```bash
# Test device connectivity
curl -u admin:password http://192.168.1.64/ISAPI/System/deviceInfo

# Get user list
curl -u admin:password http://192.168.1.64/ISAPI/AccessControl/UserInfo/Count

# Get attendance events
curl -u admin:password -X POST http://192.168.1.64/ISAPI/AccessControl/AcsEvent \
  -H "Content-Type: application/xml" \
  -d @attendance_search.xml
```

## Security Considerations

1. **Change Default Passwords**
   - Device admin password
   - API user credentials

2. **Network Security**
   - Use VPN for remote access
   - Implement firewall rules
   - Regular firmware updates

3. **Data Protection**
   - Encrypt biometric data
   - Secure API endpoints
   - Regular backups

## Best Practices

1. **Regular Maintenance**
   - Clean fingerprint scanner surface
   - Update device firmware
   - Monitor device storage

2. **User Training**
   - Proper finger placement
   - Multiple finger enrollment
   - Backup authentication methods

3. **Monitoring**
   - Device connectivity alerts
   - Failed authentication logs
   - Regular sync verification

## Integration Workflow

### Adding New Member
1. Create member in gym system
2. Call biometric enrollment API
3. Guide member through fingerprint scanning
4. Verify enrollment success
5. Test attendance scanning

### Daily Operations
1. Automated attendance sync every 5 minutes
2. Real-time check-in notifications
3. Manual sync option available
4. Attendance reports generation

This integration provides seamless biometric attendance tracking for your gym management system using Hikvision devices and ISAPI protocol.