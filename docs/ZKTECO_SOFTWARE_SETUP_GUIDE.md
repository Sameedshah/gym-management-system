# ZKTeco K40 Software Setup Guide

Complete guide for configuring the software side of your ZKTeco K40 biometric attendance system.

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ ZKTeco K40 device installed and configured
- ✅ Device connected to network with static IP
- ✅ At least one test user enrolled on device
- ✅ Node.js 14+ installed on your computer
- ✅ Supabase project created
- ✅ Database tables set up

## 🗄️ Database Setup

### Step 1: Verify Database Schema

Your database should have these tables:

**members table:**
```sql
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  member_id TEXT UNIQUE,  -- CRITICAL: Must match device user ID
  phone TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**checkins table:**
```sql
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id),
  check_in_time TIMESTAMPTZ NOT NULL,
  check_out_time TIMESTAMPTZ,
  entry_method TEXT DEFAULT 'manual',  -- 'biometric' for fingerprint
  device_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 2: Add Indexes (Performance)

```sql
-- Index for faster member lookups by device ID
CREATE INDEX idx_members_member_id ON members(member_id);

-- Index for faster checkin queries
CREATE INDEX idx_checkins_member_id ON checkins(member_id);
CREATE INDEX idx_checkins_check_in_time ON checkins(check_in_time);
```

### Step 3: Enable Row Level Security (RLS)

```sql
-- Enable RLS on tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

-- Policy for service role (full access)
CREATE POLICY "Service role has full access to members"
  ON members FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to checkins"
  ON checkins FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policies for authenticated users (read-only)
CREATE POLICY "Authenticated users can view members"
  ON members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view checkins"
  ON checkins FOR SELECT
  TO authenticated
  USING (true);
```

### Step 4: Enable Realtime (Optional but Recommended)

```sql
-- Enable realtime for checkins table
ALTER PUBLICATION supabase_realtime ADD TABLE checkins;
```

This allows your dashboard to update instantly when new attendance is recorded.

## 🔑 Get Supabase Credentials

### Step 1: Get Project URL

1. Go to Supabase Dashboard
2. Select your project
3. Go to **Settings → API**
4. Copy **Project URL**
   - Example: `https://abcdefgh.supabase.co`

### Step 2: Get Service Role Key

1. In same API settings page
2. Find **Project API keys** section
3. Copy **service_role** key (NOT anon key!)
   - Starts with `eyJ...`
   - This key has full database access

**⚠️ IMPORTANT:** 
- Service role key bypasses RLS
- Keep it secret and secure
- Never commit to git
- Never expose in frontend code

## 💻 Listener Service Setup

### Step 1: Navigate to Listener Folder

```bash
cd zkteco-listener
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- `zklib` - ZKTeco device communication
- `@supabase/supabase-js` - Database client
- `dotenv` - Environment variables
- `node-windows` - Windows service support

### Step 3: Create Environment File

Copy the example file:

```bash
copy .env.example .env
```

### Step 4: Configure Environment Variables

Edit `.env` file with your settings:

```env
# ============================================
# ZKTeco Device Configuration
# ============================================
DEVICE_IP=192.168.1.201
DEVICE_PORT=4370
DEVICE_PASSWORD=0
DEVICE_TIMEOUT=5000

# ============================================
# Supabase Configuration
# ============================================
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# Polling Configuration
# ============================================
# How often to check device for new logs (seconds)
POLL_INTERVAL=10

# ============================================
# Logging
# ============================================
# Options: info, debug
LOG_LEVEL=info
```

**Configuration Tips:**

**DEVICE_IP:**
- Use the static IP you set on device
- Must be reachable from this computer
- Test with: `ping 192.168.1.201`

**DEVICE_PORT:**
- Default is `4370` for ZKTeco
- Don't change unless you modified device settings

**DEVICE_PASSWORD:**
- Default is `0`
- Use the password you set on device
- If you didn't set one, use `0`

**POLL_INTERVAL:**
- `5` = Check every 5 seconds (faster, more traffic)
- `10` = Check every 10 seconds (recommended)
- `30` = Check every 30 seconds (slower, less traffic)

**LOG_LEVEL:**
- `info` = Normal logging (recommended)
- `debug` = Detailed logging (for troubleshooting)

### Step 5: Test Connection

```bash
npm test
```

**Expected output:**
```
============================================================
ZKTeco K40 Connection Test
============================================================
Device IP: 192.168.1.201
Device Port: 4370
Timeout: 5000ms
============================================================

📡 Step 1: Testing network connectivity...
✅ ZKLib instance created

🔌 Step 2: Connecting to device...
✅ Socket connection established

📋 Step 3: Getting device information...
✅ Device information retrieved:
   Model: K40
   Firmware: Ver 6.60
   Serial Number: ABCD1234567
   Platform: ZEM560

👥 Step 4: Getting user count...
✅ Found 5 enrolled user(s)
   Sample users:
   - User ID: 1001, Name: John Doe
   - User ID: 1002, Name: Jane Smith
   ... and 3 more

📊 Step 5: Getting attendance logs...
✅ Found 10 attendance log(s)
   Recent logs:
   - User ID: 1001, Time: 2024-02-18T09:30:00
   - User ID: 1002, Time: 2024-02-18T09:35:00

🔌 Step 6: Disconnecting...
✅ Disconnected successfully

============================================================
🎉 ALL TESTS PASSED!
============================================================

Your ZKTeco K40 device is ready to use.
Run "npm start" to begin monitoring attendance.
```

**If test fails:**
- Check device IP and port
- Verify device is powered on
- Test network: `ping 192.168.1.201`
- Check firewall settings
- Verify device password

## 👥 Member Setup

### Critical: Link Members to Device Users

**The device user ID MUST match the member_id in your database!**

### Step 1: Check Device User IDs

Run the connection test to see enrolled users:

```bash
npm test
```

Look for the user list:
```
👥 Step 4: Getting user count...
✅ Found 5 enrolled user(s)
   Sample users:
   - User ID: 1001, Name: John Doe
   - User ID: 1002, Name: Jane Smith
```

### Step 2: Update Database Member IDs

For each member, set their `member_id` to match the device user ID:

```sql
-- Example: Update member to match device user ID 1001
UPDATE members
SET member_id = '1001'
WHERE email = 'john@example.com';

-- Example: Update member to match device user ID 1002
UPDATE members
SET member_id = '1002'
WHERE email = 'jane@example.com';
```

**Or via Supabase Dashboard:**
1. Go to Table Editor
2. Open `members` table
3. Edit each member
4. Set `member_id` to match device user ID
5. Save

### Step 3: Verify Mapping

```sql
-- Check all members have member_id set
SELECT id, name, email, member_id
FROM members
WHERE member_id IS NOT NULL;
```

### Step 4: Enrollment Workflow (New Members)

**For new members joining your gym:**

1. **Register in software:**
   - Add member to database
   - Assign next available member_id (e.g., "1003")

2. **Enroll on device:**
   - Go to device menu
   - Add new user with ID `1003`
   - Enroll fingerprint
   - Save

3. **Test:**
   - Member scans fingerprint
   - Check listener logs
   - Verify attendance in database

## 🚀 Start Listener Service

### Option 1: Manual Start (Testing)

**Best for:** Testing and development

```bash
npm start
```

**Expected output:**
```
============================================================
ZKTeco K40 Biometric Attendance Listener
============================================================
Device: 192.168.1.201:4370
Poll Interval: 10 seconds
Log Level: info
============================================================
[INFO] 2024-02-18T10:00:00.000Z - Connecting to ZKTeco device...
[SUCCESS] 2024-02-18T10:00:01.000Z - ✅ Connected to ZKTeco K40 device
[INFO] 2024-02-18T10:00:01.000Z - Device Model: K40
[INFO] 2024-02-18T10:00:01.000Z - Firmware Version: Ver 6.60
[INFO] 2024-02-18T10:00:01.000Z - Starting attendance polling...
[SUCCESS] 2024-02-18T10:00:01.000Z - 🚀 Listener is running! Press Ctrl+C to stop.
```

**To stop:** Press `Ctrl+C`

### Option 2: Windows Startup (Simple Production)

**Best for:** Small gyms, single-user setups

1. Press `Win + R`
2. Type: `shell:startup`
3. Press Enter
4. Drag `start.bat` into the Startup folder

**Pros:**
- Auto-starts when you login
- Easy to set up
- No admin rights needed

**Cons:**
- Only runs when you're logged in
- Stops when you log out

### Option 3: Windows Service (Full Production)

**Best for:** Real production deployment, 24/7 operation

**Install service:**
```bash
# Open Command Prompt as Administrator
# Right-click Command Prompt → Run as Administrator

cd zkteco-listener
npm run install-service
```

**Expected output:**
```
============================================================
Installing ZKTeco Biometric Listener as Windows Service
============================================================

⚠️  IMPORTANT: You must run this as Administrator!

Installing...

✅ Service installed successfully!

Starting service...
✅ Service started successfully!

Service Details:
  Name: ZKTeco Biometric Listener
  Description: Real-time attendance monitoring for ZKTeco K40

The service will now run automatically on Windows startup.

To manage the service:
  1. Open Services (services.msc)
  2. Find "ZKTeco Biometric Listener"
  3. Right-click to Start/Stop/Restart

To uninstall: npm run uninstall-service
```

**Manage service:**
1. Press `Win + R`
2. Type: `services.msc`
3. Press Enter
4. Find "ZKTeco Biometric Listener"
5. Right-click for options:
   - Start
   - Stop
   - Restart
   - Properties

**Uninstall service:**
```bash
# Run as Administrator
npm run uninstall-service
```

### Option 4: Dedicated PC (Recommended for Production)

**Best for:** Professional gym environment

**Setup:**
1. Use old laptop or mini PC
2. Install Windows
3. Install Node.js
4. Copy `zkteco-listener` folder
5. Install as Windows Service
6. Keep powered on 24/7

**Benefits:**
- Always on, always connected
- Reliable 24/7 operation
- Low power consumption
- Professional setup
- Isolated from other tasks

## 🧪 Testing End-to-End

### Test 1: Manual Attendance

1. Start listener (if not running)
2. Watch console output
3. Scan enrolled fingerprint on device
4. Observe logs:

```
[INFO] 2024-02-18T10:05:00.000Z - Fetching attendance logs...
[INFO] 2024-02-18T10:05:01.000Z - Found 1 attendance log(s)
[DEBUG] 2024-02-18T10:05:01.000Z - Processing log: User ID 1001 at 2024-02-18T10:05:00
[SUCCESS] 2024-02-18T10:05:02.000Z - ✅ Attendance saved for John Doe at 2/18/2024, 10:05:00 AM
```

### Test 2: Database Verification

Check database for new record:

```sql
SELECT 
  c.id,
  m.name,
  m.member_id,
  c.check_in_time,
  c.entry_method,
  c.device_name
FROM checkins c
JOIN members m ON c.member_id = m.id
ORDER BY c.check_in_time DESC
LIMIT 10;
```

Should see new record with:
- `entry_method = 'biometric'`
- `device_name = 'ZKTeco K40'`
- Recent timestamp

### Test 3: Dashboard Update

1. Open your dashboard
2. Navigate to attendance/check-ins page
3. Should see new attendance record
4. If realtime enabled, updates instantly
5. If not, refresh page to see update

### Test 4: Multiple Scans

1. Scan fingerprint
2. Wait 10-15 seconds
3. Scan again
4. Verify both records appear
5. Check no duplicates within 1 minute

### Test 5: Unknown User

1. Enroll test user on device with ID `9999`
2. Don't add to database
3. Scan fingerprint
4. Check logs:

```
[ERROR] 2024-02-18T10:10:00.000Z - ⚠️ Member not found for device user ID: 9999
[INFO] 2024-02-18T10:10:00.000Z - Please ensure member_id in database matches device user ID
```

5. No database record should be created

## 📊 Monitoring

### View Logs (Manual Mode)

```bash
npm start
# Logs appear in console
```

### View Logs (Service Mode)

1. Open Event Viewer: `eventvwr.msc`
2. Navigate to: Windows Logs → Application
3. Filter by source: "ZKTeco Biometric Listener"
4. View service logs and errors

### Enable Debug Mode

Edit `.env`:
```env
LOG_LEVEL=debug
```

Restart service to see detailed logs:
- Connection attempts
- Raw device responses
- Database queries
- Processing steps

### Check Service Status

```bash
# Open Services
services.msc

# Find "ZKTeco Biometric Listener"
# Status should be "Running"
# Startup Type should be "Automatic"
```

## 🔧 Configuration Tuning

### Adjust Polling Interval

**For faster updates:**
```env
POLL_INTERVAL=5  # Check every 5 seconds
```

**For less network traffic:**
```env
POLL_INTERVAL=30  # Check every 30 seconds
```

**Trade-offs:**
- Lower = Faster updates, more network traffic
- Higher = Slower updates, less network traffic
- Recommended: 10 seconds (balanced)

### Adjust Connection Timeout

**For slow networks:**
```env
DEVICE_TIMEOUT=10000  # 10 seconds
```

**For fast networks:**
```env
DEVICE_TIMEOUT=3000  # 3 seconds
```

## 🆘 Troubleshooting

### Listener Won't Start

**Check:**
1. `.env` file exists
2. All variables are set
3. Node.js is installed
4. Dependencies installed: `npm install`

### Connection Fails

**Check:**
1. Device IP is correct
2. Device is powered on
3. Network connection: `ping 192.168.1.201`
4. Port 4370 is not blocked
5. Device password is correct

### Member Not Found

**Error:** `Member not found for device user ID: 1001`

**Fix:**
1. Check member exists in database
2. Verify `member_id = "1001"` (as string)
3. Check spelling/formatting
4. Run query:
```sql
SELECT * FROM members WHERE member_id = '1001';
```

### No Logs Received

**Check:**
1. Fingerprint is enrolled on device
2. Device user ID is set
3. Scan multiple times
4. Enable debug mode
5. Check device storage not full

### Duplicate Records

**If seeing duplicates:**
1. Check duplicate prevention is working
2. Verify timestamps are correct
3. Check device time is accurate
4. Review logs for errors

## ✅ Production Checklist

Before going live:

### Device Setup
- [ ] Device installed and mounted
- [ ] Power connected and stable
- [ ] Network connection working
- [ ] Static IP configured
- [ ] Date/time accurate
- [ ] All members enrolled

### Database Setup
- [ ] Tables created with correct schema
- [ ] Indexes added for performance
- [ ] RLS policies configured
- [ ] Realtime enabled (optional)
- [ ] Service role key obtained

### Software Setup
- [ ] Listener installed
- [ ] Dependencies installed
- [ ] `.env` configured correctly
- [ ] Connection test passes
- [ ] Member IDs match device IDs

### Testing
- [ ] Test scan creates record
- [ ] Dashboard shows attendance
- [ ] Multiple scans work
- [ ] Unknown user handled correctly
- [ ] Duplicate prevention works

### Deployment
- [ ] Service installed (if using)
- [ ] Auto-start configured
- [ ] Monitoring set up
- [ ] Staff trained
- [ ] Documentation accessible

## 🎉 Success!

When everything is working:

✅ Listener shows "Connected to ZKTeco K40 device"
✅ Fingerprint scan triggers log output
✅ Attendance appears in database within 10-15 seconds
✅ Dashboard updates with new check-in
✅ No errors in logs
✅ Service runs 24/7 reliably

## 📞 Next Steps

1. **Train staff** on system usage
2. **Monitor** for first few days
3. **Adjust** polling interval if needed
4. **Scale** by adding more devices
5. **Optimize** based on usage patterns

## 📚 Additional Resources

- **Device Setup:** `ZKTECO_DEVICE_SETUP_GUIDE.md`
- **Listener README:** `zkteco-listener/README.md`
- **Troubleshooting:** `zkteco-listener/TROUBLESHOOTING.md`
- **ZKTeco Support:** https://www.zkteco.com

---

**Congratulations!** Your ZKTeco K40 biometric attendance system is now fully operational! 🚀
