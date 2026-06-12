# ZKTeco K40 Complete Integration Guide

Complete end-to-end guide for implementing ZKTeco K40 biometric attendance system with your gym management software.

## 📖 Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Requirements](#requirements)
4. [Installation Steps](#installation-steps)
5. [Configuration](#configuration)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Maintenance](#maintenance)
9. [Troubleshooting](#troubleshooting)

## 🎯 Overview

### What This System Does

Your ZKTeco K40 biometric attendance system provides:

✅ **Automated Check-ins** - Members scan fingerprint, attendance recorded automatically
✅ **Real-time Sync** - Attendance appears in dashboard within 10-15 seconds
✅ **Offline Capable** - Device stores logs locally, syncs when connection restored
✅ **Secure** - Biometric authentication, encrypted database
✅ **Scalable** - Support multiple devices, unlimited members
✅ **Reliable** - 24/7 operation, automatic reconnection

### How It Works

```
Member scans fingerprint
         ↓
ZKTeco K40 verifies locally (< 1 second)
         ↓
Device stores attendance log
         ↓
Listener polls device every 10 seconds
         ↓
Listener fetches new logs
         ↓
Listener matches device user ID to member_id
         ↓
Listener saves to Supabase database
         ↓
Dashboard updates in real-time
         ↓
Staff sees attendance instantly
```

**Total time: 10-15 seconds from scan to dashboard**

## 🏗️ System Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                    Your Gym Network                      │
│                                                          │
│  ┌──────────────┐         ┌──────────────┐             │
│  │  ZKTeco K40  │◄───────►│   Listener   │             │
│  │  Fingerprint │  TCP/IP │   Service    │             │
│  │    Device    │  :4370  │  (Node.js)   │             │
│  └──────────────┘         └──────┬───────┘             │
│   192.168.1.201                   │                      │
│                                   │ HTTPS                │
└───────────────────────────────────┼──────────────────────┘
                                    │
                                    ▼
                        ┌───────────────────┐
                        │    Supabase       │
                        │    Database       │
                        │   (PostgreSQL)    │
                        └─────────┬─────────┘
                                  │
                                  │ Realtime
                                  │ WebSocket
                                  ▼
                        ┌───────────────────┐
                        │   Next.js App     │
                        │   (Dashboard)     │
                        │     Vercel        │
                        └───────────────────┘
```

### Data Flow

1. **Enrollment Phase:**
   - Member registers in software → Gets `member_id` (e.g., "1001")
   - Member enrolls fingerprint on device → Uses same ID (1001)
   - System links device user to database member

2. **Check-in Phase:**
   - Member scans finger → Device verifies (< 1 sec)
   - Device stores log → User ID + timestamp
   - Listener polls device → Fetches new logs (every 10 sec)
   - Listener finds member → Matches device ID to `member_id`
   - Listener saves attendance → Inserts to `checkins` table
   - Database triggers realtime → Pushes to connected clients
   - Dashboard updates → Shows new check-in

### Technology Stack

**Device:**
- ZKTeco K40 fingerprint scanner
- TCP/IP communication
- ZKTeco protocol

**Listener Service:**
- Node.js runtime
- zklib library (device communication)
- @supabase/supabase-js (database)
- Windows Service (24/7 operation)

**Database:**
- Supabase (PostgreSQL)
- Row Level Security (RLS)
- Realtime subscriptions

**Frontend:**
- Next.js (React framework)
- Vercel (hosting)
- Real-time updates

## 📋 Requirements

### Hardware

- **ZKTeco K40** fingerprint device
- **Computer/Server** for listener service:
  - Windows PC (can be old laptop)
  - Or Raspberry Pi with Windows IoT
  - Or dedicated mini PC
- **Network infrastructure:**
  - Router with available Ethernet port
  - Stable internet connection
  - Power outlet near device

### Software

- **Node.js** 14 or higher
- **npm** (comes with Node.js)
- **Windows** operating system (for service)
- **Supabase** account and project

### Network

- Device and listener on same network
- Static IP for device (recommended)
- Port 4370 accessible
- Internet access for Supabase

### Database

- Supabase project created
- Tables: `members`, `checkins`
- Service role API key

## 🚀 Installation Steps

### Phase 1: Device Setup (30 minutes)

**See:** `ZKTECO_DEVICE_SETUP_GUIDE.md`

1. **Physical installation:**
   - Mount device on wall or place on desk
   - Connect power adapter
   - Connect Ethernet cable
   - Power on device

2. **Network configuration:**
   - Find device IP address
   - Set static IP: `192.168.1.201`
   - Test connectivity: `ping 192.168.1.201`

3. **Device configuration:**
   - Set date and time
   - Configure communication (port 4370)
   - Set device password
   - Enable attendance logging

4. **User enrollment:**
   - Enroll test user with ID `1001`
   - Test fingerprint recognition
   - Verify device stores logs

### Phase 2: Database Setup (15 minutes)

**See:** `ZKTECO_SOFTWARE_SETUP_GUIDE.md`

1. **Create/verify tables:**
   ```sql
   -- Members table with member_id
   CREATE TABLE members (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     name TEXT NOT NULL,
     email TEXT,
     member_id TEXT UNIQUE,  -- Links to device user ID
     phone TEXT,
     status TEXT DEFAULT 'active',
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Checkins table
   CREATE TABLE checkins (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     member_id UUID REFERENCES members(id),
     check_in_time TIMESTAMPTZ NOT NULL,
     check_out_time TIMESTAMPTZ,
     entry_method TEXT DEFAULT 'manual',
     device_name TEXT,
     notes TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **Add indexes:**
   ```sql
   CREATE INDEX idx_members_member_id ON members(member_id);
   CREATE INDEX idx_checkins_member_id ON checkins(member_id);
   CREATE INDEX idx_checkins_check_in_time ON checkins(check_in_time);
   ```

3. **Configure RLS:**
   ```sql
   ALTER TABLE members ENABLE ROW LEVEL SECURITY;
   ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Service role full access to members"
     ON members FOR ALL TO service_role USING (true) WITH CHECK (true);

   CREATE POLICY "Service role full access to checkins"
     ON checkins FOR ALL TO service_role USING (true) WITH CHECK (true);
   ```

4. **Enable realtime:**
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE checkins;
   ```

### Phase 3: Listener Setup (10 minutes)

**See:** `zkteco-listener/QUICK_SETUP.md`

1. **Install dependencies:**
   ```bash
   cd zkteco-listener
   npm install
   ```

2. **Configure environment:**
   ```bash
   copy .env.example .env
   ```

   Edit `.env`:
   ```env
   DEVICE_IP=192.168.1.201
   DEVICE_PORT=4370
   DEVICE_PASSWORD=0
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your_service_role_key
   POLL_INTERVAL=10
   LOG_LEVEL=info
   ```

3. **Test connection:**
   ```bash
   npm test
   ```

4. **Start listener:**
   ```bash
   npm start
   ```

### Phase 4: Member Linking (5 minutes)

1. **Check device users:**
   ```bash
   npm test
   # Note user IDs: 1001, 1002, etc.
   ```

2. **Update database:**
   ```sql
   UPDATE members SET member_id = '1001' WHERE email = 'john@example.com';
   UPDATE members SET member_id = '1002' WHERE email = 'jane@example.com';
   ```

3. **Verify mapping:**
   ```sql
   SELECT id, name, email, member_id FROM members WHERE member_id IS NOT NULL;
   ```

## ⚙️ Configuration

### Device Configuration

**Access device menu:**
- Press Menu button
- Enter password (default: `0`)

**Key settings:**
- System → Date/Time → Set accurate time
- Communication → Network → IP: 192.168.1.201, Port: 4370
- Attendance → Settings → Enable logging

### Listener Configuration

**Environment variables (`.env`):**

```env
# Device connection
DEVICE_IP=192.168.1.201        # Device IP address
DEVICE_PORT=4370               # Device port (default)
DEVICE_PASSWORD=0              # Device password
DEVICE_TIMEOUT=5000            # Connection timeout (ms)

# Database connection
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...    # Service role key

# Polling settings
POLL_INTERVAL=10               # Check device every X seconds

# Logging
LOG_LEVEL=info                 # info or debug
```

**Tuning poll interval:**
- `5` seconds = Faster updates, more traffic
- `10` seconds = Balanced (recommended)
- `30` seconds = Slower updates, less traffic

### Database Configuration

**RLS policies:**
- Service role bypasses RLS (full access)
- Authenticated users read-only
- Anonymous users no access

**Realtime:**
- Enable on `checkins` table
- Dashboard subscribes to INSERT events
- Updates appear instantly

## 🧪 Testing

### Test 1: Device Connection

```bash
cd zkteco-listener
npm test
```

**Expected output:**
```
✅ Socket connection established
✅ Device information retrieved
✅ Found X enrolled user(s)
✅ Found X attendance log(s)
🎉 ALL TESTS PASSED!
```

### Test 2: Member Lookup

```sql
-- Verify member exists with correct member_id
SELECT * FROM members WHERE member_id = '1001';
```

### Test 3: End-to-End Attendance

1. Start listener: `npm start`
2. Scan enrolled fingerprint
3. Watch console:
   ```
   [INFO] Found 1 attendance log(s)
   [SUCCESS] ✅ Attendance saved for John Doe
   ```
4. Check database:
   ```sql
   SELECT * FROM checkins ORDER BY check_in_time DESC LIMIT 1;
   ```
5. Check dashboard - should show new attendance

### Test 4: Error Handling

1. Scan unknown fingerprint (not in database)
2. Should see: `Member not found for device user ID: XXXX`
3. No database record created (correct behavior)

### Test 5: Duplicate Prevention

1. Scan fingerprint
2. Wait 30 seconds
3. Scan same fingerprint again
4. Second scan should be ignored (within 1-minute window)

## 🚀 Deployment

### Option 1: Manual Start (Development)

**Use for:** Testing, development

```bash
npm start
```

**Pros:** Easy to test, see logs
**Cons:** Must keep terminal open

### Option 2: Windows Startup (Simple)

**Use for:** Small gyms, single-user

1. Press `Win + R`
2. Type: `shell:startup`
3. Drag `start.bat` to folder

**Pros:** Auto-starts on login
**Cons:** Only runs when logged in

### Option 3: Windows Service (Production)

**Use for:** Production, 24/7 operation

```bash
# Run as Administrator
cd zkteco-listener
npm run install-service
```

**Pros:** 
- Runs 24/7
- Auto-starts on boot
- Runs when logged out

**Cons:**
- Requires admin rights
- Harder to see logs

**Manage service:**
1. Open Services: `services.msc`
2. Find "ZKTeco Biometric Listener"
3. Right-click → Start/Stop/Restart

### Option 4: Dedicated PC (Recommended)

**Use for:** Professional deployment

**Setup:**
1. Use old laptop or mini PC
2. Install Windows + Node.js
3. Copy `zkteco-listener` folder
4. Install as Windows Service
5. Keep powered on 24/7

**Benefits:**
- Always on, always connected
- Reliable operation
- Low power consumption
- Isolated from other tasks

## 🔧 Maintenance

### Daily Tasks

- Check dashboard for attendance
- Verify system is running
- Look for any errors

### Weekly Tasks

- Clean fingerprint scanner
- Check service status
- Review attendance logs
- Verify all members can check in

### Monthly Tasks

- Backup database
- Review system performance
- Update member enrollments
- Check device storage

### Quarterly Tasks

- Update device firmware
- Rotate Supabase keys
- Review security settings
- Train new staff

### As Needed

- Enroll new members
- Remove inactive members
- Adjust polling interval
- Troubleshoot issues

## 🆘 Troubleshooting

**See:** `zkteco-listener/TROUBLESHOOTING.md`

### Quick Fixes

**Connection failed:**
```bash
ping 192.168.1.201
```

**Member not found:**
```sql
SELECT * FROM members WHERE member_id = '1001';
```

**Service not running:**
```bash
services.msc
# Find "ZKTeco Biometric Listener"
# Right-click → Start
```

**Enable debug mode:**
```env
LOG_LEVEL=debug
```

### Common Issues

1. **Device not responding** → Power cycle device
2. **Member not found** → Check `member_id` matches
3. **No logs received** → Verify fingerprint enrolled
4. **Service won't start** → Run as Administrator
5. **Slow sync** → Reduce `POLL_INTERVAL`

## ✅ Production Checklist

Before going live:

### Device
- [ ] Physically installed and secure
- [ ] Power connected and stable
- [ ] Network cable connected
- [ ] Static IP configured (192.168.1.201)
- [ ] Date/time accurate
- [ ] Password changed from default
- [ ] Test user enrolled and working

### Database
- [ ] Tables created with correct schema
- [ ] Indexes added
- [ ] RLS policies configured
- [ ] Realtime enabled
- [ ] Service role key obtained
- [ ] Test member added with member_id

### Listener
- [ ] Dependencies installed
- [ ] `.env` configured correctly
- [ ] Connection test passes
- [ ] Service installed (if using)
- [ ] Auto-start configured
- [ ] Logs accessible

### Testing
- [ ] Test scan creates database record
- [ ] Dashboard shows attendance
- [ ] Realtime updates working
- [ ] Unknown user handled correctly
- [ ] Duplicate prevention works
- [ ] Service runs 24/7

### Documentation
- [ ] Staff trained on system
- [ ] Troubleshooting guide accessible
- [ ] Device credentials documented
- [ ] Emergency procedures known

### Monitoring
- [ ] Service status monitoring
- [ ] Error alerting configured
- [ ] Backup procedures in place
- [ ] Support contacts documented

## 📊 Success Metrics

When system is working correctly:

✅ **Connection:** Listener shows "Connected to ZKTeco K40 device"
✅ **Recognition:** Fingerprint scan triggers device beep (< 1 second)
✅ **Logging:** Listener logs "Attendance saved" message
✅ **Database:** New record in `checkins` table
✅ **Dashboard:** Attendance appears within 10-15 seconds
✅ **Reliability:** Service runs 24/7 without intervention
✅ **Accuracy:** No missed scans, no false positives

## 📈 Scaling

### Multiple Devices

To add more devices:

1. **Install additional devices:**
   - Assign different IPs (192.168.1.202, etc.)
   - Configure same as first device

2. **Run multiple listeners:**
   - Copy `zkteco-listener` folder
   - Configure each with different device IP
   - Install each as separate service

3. **Update database:**
   - Add `device_name` to distinguish devices
   - Track which device recorded attendance

### Multiple Locations

For gyms with multiple locations:

1. **Each location has:**
   - Own ZKTeco device
   - Own listener service
   - Same Supabase database

2. **Centralized dashboard:**
   - View all locations
   - Filter by device/location
   - Unified reporting

## 🔐 Security Best Practices

### Device Security

- Change default password
- Restrict physical access
- Keep firmware updated
- Monitor access logs

### Network Security

- Use internal network only
- Don't expose to internet
- Enable firewall rules
- Use VPN for remote access

### Database Security

- Keep service key secret
- Never commit `.env` to git
- Rotate keys periodically
- Monitor access logs
- Enable RLS policies

### Data Privacy

- Store only necessary data
- Comply with privacy laws
- Secure member information
- Regular security audits

## 📞 Support

### Documentation

- **Quick Setup:** `zkteco-listener/QUICK_SETUP.md`
- **Device Setup:** `ZKTECO_DEVICE_SETUP_GUIDE.md`
- **Software Setup:** `ZKTECO_SOFTWARE_SETUP_GUIDE.md`
- **Troubleshooting:** `zkteco-listener/TROUBLESHOOTING.md`
- **Full README:** `zkteco-listener/README.md`

### Resources

- **ZKTeco:** https://www.zkteco.com
- **Supabase:** https://supabase.com/docs
- **Node.js:** https://nodejs.org/docs

### Getting Help

1. Check troubleshooting guide
2. Run connection test: `npm test`
3. Enable debug mode
4. Review logs
5. Contact support

## 🎉 Conclusion

You now have a complete, production-ready biometric attendance system!

**What you've built:**
- ✅ Automated fingerprint check-ins
- ✅ Real-time attendance tracking
- ✅ Secure, reliable operation
- ✅ Professional-grade system
- ✅ Scalable architecture

**Next steps:**
1. Complete testing with all members
2. Train staff on system usage
3. Monitor for first week
4. Optimize based on usage
5. Scale as needed

**Congratulations!** Your gym now has enterprise-grade biometric attendance tracking! 🚀

---

**Questions?** Check the documentation or run `npm test` to diagnose issues.
