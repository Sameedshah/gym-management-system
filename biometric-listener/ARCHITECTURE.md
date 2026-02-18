# System Architecture - ZKTeco K40 Integration

## 🏗️ Complete System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GYM ATTENDANCE SYSTEM                             │
│              (ZKTeco K40 Near Real-time Architecture)                │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│   GYM MEMBER    │
│                 │
│  👤 John Doe    │
│  Device ID: 1001│
└────────┬────────┘
         │
         │ Scans Fingerprint
         ▼
┌─────────────────┐
│   ZKTECO K40    │
│   FINGERPRINT   │  📍 Location: Gym Entrance
│     DEVICE      │  🌐 IP: 192.168.1.201
│                 │  🔌 Port: 4370 (TCP)
│  Standalone     │  🔑 Password: 0
│  Access Control │  📊 Protocol: ZKTeco Proprietary
└────────┬────────┘
         │
         │ TCP Socket Connection
         │ (Polling every 3 seconds)
         │ Protocol: zklib
         │
         ▼
┌─────────────────┐
│   NODE.JS       │
│   LISTENER      │  💻 Runs on: Your PC/Server
│                 │  📂 Location: biometric-listener/
│  • index.js     │  🔄 Status: Always Running
│  • zklib        │  ⚡ Delay: 3-5 seconds
│  • TCP Client   │  🔌 Connection: Persistent polling
│  • Auto-reconnect│ 🛡️ Duplicate Prevention
│  • Log Parser   │  📊 Poll Interval: 3 seconds
└────────┬────────┘
         │
         │ HTTPS POST
         │ (Attendance Data)
         │
         ▼
┌─────────────────┐
│   SUPABASE      │
│   DATABASE      │  ☁️ Cloud: PostgreSQL
│                 │  🌐 URL: your-project.supabase.co
│  Tables:        │  🔐 Auth: Service Role Key
│  • members      │  ⚡ Realtime: Enabled
│  • checkins     │  🛡️ RLS: Enabled
│  • invoices     │  📊 WebSocket: Active
└────────┬────────┘
         │
         │ Realtime Subscription
         │ (WebSocket)
         │
         ▼
┌─────────────────┐
│   DASHBOARD     │
│   (Next.js)     │  🌐 Deployed: Vercel
│                 │  📱 Responsive: Yes
│  Components:    │  🌙 Dark Mode: Yes
│  • Scanner Status│ ⚡ Real-time: Active
│  • Recent Checkins│ 🔔 Notifications: Yes
│  • Statistics   │  🎨 UI: Professional
└─────────────────┘
         │
         │ Browser
         │
         ▼
┌─────────────────┐
│   GYM STAFF     │
│                 │
│  👨‍💼 Admin       │
│  Monitoring     │
└─────────────────┘
```

## 🔄 Event Flow (Detailed)

### 1. Fingerprint Scan
```
Member scans finger on K40 device
↓
Device captures fingerprint
↓
Device matches against enrolled templates
↓
Match found: Device User ID 1001
↓
Device stores log in internal memory
```

### 2. Log Storage (Device Side)
```
K40 stores attendance log:
{
  deviceUserId: 1001,
  recordTime: "2024-02-10T14:30:00",
  verifyMode: 1 (fingerprint),
  inOutMode: 0 (check-in)
}
↓
Log stored in device RAM
↓
Waiting for listener to poll
```

### 3. Polling & Retrieval
```
Node.js listener polls device (every 3 seconds)
↓
Send: "Get attendance logs" command
↓
Device responds with new logs
↓
Listener receives log data
↓
Parse binary data to JavaScript object
```

### 4. Database Lookup
```
Query Supabase:
SELECT * FROM members 
WHERE member_id = '1001'
↓
Member found: John Doe
↓
Check for duplicates (1-min window)
↓
No duplicate found
```

### 5. Check-in Creation
```
INSERT INTO checkins:
{
  member_id: "uuid-john-doe",
  check_in_time: "2024-02-10T14:30:00",
  entry_method: "biometric",
  device_name: "ZKTeco K40",
  notes: "Device User ID: 1001"
}
↓
Database insert successful
↓
Update member.last_seen
```

### 6. Real-time Broadcast
```
Supabase Realtime detects INSERT
↓
Broadcast to all subscribed clients
↓
Dashboard receives event via WebSocket
↓
React hook updates state
↓
UI re-renders with new check-in
```

### 7. UI Update
```
Dashboard shows:
✅ John Doe checked in at 2:30 PM
⚡ Real-time indicator active
🔔 Browser notification (optional)
📊 Today's count: +1
```

**Total Time: 3-5 seconds** ⚡

## 🔌 Connection Types

### TCP Socket (Listener → K40 Device)
```
Type: TCP Socket (Polling)
Direction: Listener → Device
Protocol: ZKTeco Proprietary
Port: 4370
Auth: Password (default: 0)
Format: Binary
Persistence: Reconnects automatically
Poll Interval: 3 seconds
Library: zklib (npm package)
```

### Database Connection (Listener → Supabase)
```
Type: HTTP REST API
Direction: Listener → Supabase
Protocol: HTTPS
Auth: Service Role Key
Format: JSON
Operations: SELECT, INSERT, UPDATE
```

### Realtime Subscription (Dashboard → Supabase)
```
Type: WebSocket
Direction: Supabase → Dashboard
Protocol: WSS (Secure WebSocket)
Auth: Anon Key + RLS
Format: JSON
Events: INSERT, UPDATE, DELETE
Channels: checkins-realtime
```

## 🛡️ Security Layers

### Layer 1: Device Authentication
```
TCP Connection
↓
Password: 0 (default)
↓
Binary protocol
↓
Local network only
```

### Layer 2: Database Security
```
Supabase Service Role Key
↓
Full database access
↓
Row Level Security (RLS)
↓
Policy enforcement
```

### Layer 3: Network Security
```
Internal network only
↓
No internet exposure
↓
Firewall rules
↓
VPN for remote access (optional)
```

### Layer 4: Application Security
```
Environment variables
↓
.env file (not committed)
↓
Secure credential storage
↓
Input validation
```

## 📊 Data Flow

### Member Enrollment
```
1. Admin creates member in dashboard
   ↓
2. Member record saved to Supabase
   {
     name: "John Doe",
     member_id: "1001",  ← Must match device!
     email: "john@example.com"
   }
   ↓
3. Admin enrolls fingerprint on K40 device
   - Device User ID: 1001  ← Must match member_id!
   - Scan finger 3 times
   ↓
4. Device stores fingerprint template
   ↓
5. System ready for attendance
```

### Attendance Recording
```
1. Member scans finger
   ↓
2. Device matches fingerprint
   ↓
3. Device stores log in memory
   ↓
4. Listener polls device (3 seconds)
   ↓
5. Listener retrieves new logs
   ↓
6. Database lookup by member_id
   ↓
7. Check-in record created
   ↓
8. Dashboard updates in real-time
   ↓
9. Staff sees attendance (3-5 sec delay)
```

## 🔄 Error Handling

### Connection Loss
```
Device connection drops
↓
Listener detects timeout
↓
Log: "Failed to connect"
↓
Wait 5 seconds
↓
Attempt reconnection (max 5 attempts)
↓
Success: Resume polling
```

### Member Not Found
```
Log received: Device User ID 9999
↓
Database query: No match
↓
Log: "⚠️ Member not found: 9999"
↓
Event skipped (not saved)
↓
Continue polling
```

### Duplicate Event
```
Log received: Device User ID 1001
↓
Check recent check-ins (1-min window)
↓
Duplicate found
↓
Log: "Skipping duplicate"
↓
Event skipped
↓
Continue polling
```

## 📈 Performance Characteristics

### Latency Breakdown
```
Fingerprint Scan:        0ms (instant)
Device Processing:       100-500ms
Device Log Storage:      50ms
Polling Wait:            0-3000ms (avg 1500ms)
Network Transfer:        10-50ms
Listener Processing:     50-100ms
Database Insert:         100-300ms
Realtime Broadcast:      50-100ms
Dashboard Update:        50-100ms
─────────────────────────────────
Total Delay:             ~3-5 seconds ⚡
```

### Resource Usage
```
Node.js Listener:
├── CPU: < 1% (idle), ~3% (polling)
├── Memory: 30-50 MB
├── Network: < 1 KB/s (polling)
└── Disk: Negligible

K40 Device:
├── CPU: < 5%
├── Memory: Internal RAM
├── Storage: 3000+ fingerprints
└── Logs: 100,000+ records

Dashboard:
├── CPU: < 5% (browser)
├── Memory: 100-200 MB (browser)
├── Network: < 1 KB/s (realtime)
└── Disk: Cache only
```

### Scalability Limits
```
Single K40 Device:
├── Max fingerprints: 3,000
├── Max logs: 100,000
├── Max scans/hour: 100+
└── Max scans/day: 2,000+

Single Listener:
├── Devices supported: 1
├── Polls/minute: 20
├── Events/second: 5+
└── Uptime: 99%+

Database:
├── Check-ins/day: 10,000+
├── Total members: 100,000+
└── Concurrent viewers: Unlimited
```

## 🎯 System Requirements

### Hardware Requirements
```
Listener PC:
├── CPU: Any modern processor
├── RAM: 2 GB minimum, 4 GB recommended
├── Disk: 500 MB free space
├── Network: Ethernet (recommended)
└── OS: Windows 10/11, Linux, macOS

K40 Device:
├── Model: ZKTeco K40
├── Firmware: Latest version
├── Network: Ethernet connection
├── Power: 12V DC adapter
└── Capacity: 3,000 fingerprints
```

### Software Requirements
```
Listener:
├── Node.js: 16+ (18 LTS recommended)
├── npm: 8+
├── zklib: 1.0.8+
└── Dependencies: See package.json

Dashboard:
├── Next.js: 14+
├── React: 18+
└── Modern browser (Chrome, Firefox, Safari)

Database:
├── Supabase: Latest
├── PostgreSQL: 14+
└── Realtime: Enabled
```

### Network Requirements
```
Bandwidth:
├── Minimum: 1 Mbps
├── Recommended: 10 Mbps
└── Latency: < 100ms

Connectivity:
├── Device → Listener: Same LAN (required)
├── Listener → Supabase: Internet
└── Dashboard → Supabase: Internet

Ports:
├── K40 Device: 4370 (TCP)
├── Supabase: 443 (HTTPS)
└── Realtime: 443 (WSS)
```

## 🎊 Success Metrics

### System Health
```
✅ Listener connected to K40 device
✅ Polling active (every 3 seconds)
✅ Database connection stable
✅ Dashboard showing ⚡ indicator
✅ Check-ins appearing in 3-5 seconds
✅ No errors in logs
✅ Uptime > 99%
```

### Performance Metrics
```
✅ Event latency < 5 seconds
✅ Database response < 500ms
✅ Dashboard update < 1 second
✅ CPU usage < 5%
✅ Memory usage < 100 MB
✅ No connection drops
✅ No duplicate events
```

### Business Metrics
```
✅ All members enrolled
✅ Staff trained on system
✅ 100% attendance accuracy
✅ Zero manual check-ins needed
✅ Real-time reporting available
✅ System runs 24/7
✅ Professional appearance
```

## 🔧 Technical Limitations

### ZKTeco K40 Constraints
```
❌ No push events (must poll)
❌ No event stream API
❌ Binary protocol only
❌ Limited to local network
✅ Reliable and stable
✅ Industry standard
✅ Cost-effective
```

### Polling vs Real-time
```
True Real-time (Hikvision):
├── Push events: Instant
├── Delay: 1-2 seconds
└── Protocol: HTTP Event Stream

Near Real-time (ZKTeco K40):
├── Polling: Every 3 seconds
├── Delay: 3-5 seconds
└── Protocol: TCP Socket

Conclusion: 3-5 second delay is acceptable
for gym attendance tracking
```

---

**This architecture provides professional near real-time attendance tracking with ZKTeco K40 at an affordable cost!** 🚀
