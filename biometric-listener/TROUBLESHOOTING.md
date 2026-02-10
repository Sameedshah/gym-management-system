# Troubleshooting Guide

Quick reference for common issues and solutions.

## 🔍 Quick Diagnostics

### Run Connection Test
```bash
cd biometric-listener
npm test
```

This will check:
- ✅ Network connectivity
- ✅ Device authentication
- ✅ Event stream support
- ✅ Device information

## 🚨 Common Issues

### 1. Can't Connect to Device

**Symptoms:**
```
❌ Connection failed: connect ETIMEDOUT
❌ Connection failed: connect ECONNREFUSED
```

**Diagnostic Steps:**

1. **Test network connectivity:**
   ```bash
   ping 192.168.1.64
   ```
   - ✅ Getting replies? Network is good
   - ❌ Request timeout? Network issue

2. **Check device power:**
   - Is power LED on?
   - Is network LED blinking?
   - Try power cycle (unplug, wait 10s, plug back)

3. **Verify IP address:**
   ```bash
   # Check your computer's IP
   ipconfig
   
   # Should be same subnet (e.g., 192.168.1.x)
   ```

4. **Check firewall:**
   ```bash
   # Windows: Temporarily disable firewall
   # Test if connection works
   # If yes, add exception for Node.js
   ```

5. **Try different port:**
   - Edit `.env`: `DEVICE_PORT=8080`
   - Some devices use port 8080 instead of 80

**Solutions:**
- Ensure device and PC on same network
- Check network cable connections
- Verify device IP hasn't changed
- Disable firewall temporarily to test
- Try accessing device in browser: `http://192.168.1.64`

---

### 2. Authentication Failed (401)

**Symptoms:**
```
❌ Connection failed: Request failed with status code 401
❌ Authentication failed
```

**Diagnostic Steps:**

1. **Verify credentials in `.env`:**
   ```env
   DEVICE_USERNAME=admin
   DEVICE_PASSWORD=@Smgym7?
   ```

2. **Check for special characters:**
   - Password has special chars? Ensure no typos
   - Try wrapping in quotes: `DEVICE_PASSWORD="@Smgym7?"`

3. **Try default credentials:**
   ```env
   DEVICE_USERNAME=admin
   DEVICE_PASSWORD=12345
   ```

4. **Check device label:**
   - Look for sticker on device
   - May have default password printed

**Solutions:**
- Verify username/password are correct
- Try default credentials (admin/12345)
- Reset device to factory defaults
- Check device documentation for default password
- Contact device administrator

---

### 3. Connected But No Events

**Symptoms:**
```
✅ Connected to device event stream
👂 Listening for biometric events...
(nothing happens when scanning)
```

**Diagnostic Steps:**

1. **Enable debug mode:**
   ```env
   # In .env file
   LOG_LEVEL=debug
   ```
   Restart listener and check for detailed logs

2. **Verify fingerprint enrollment:**
   - Is fingerprint enrolled in device?
   - Does employee have employee number set?
   - Try enrolling test fingerprint

3. **Check employee number:**
   - Device shows employee number when scanning?
   - Note the number shown

4. **Test with multiple scans:**
   - Try scanning 3-5 times
   - Try different fingers
   - Try different enrolled users

5. **Check device event settings:**
   - If device has UI, check event settings
   - Ensure access control events are enabled

**Solutions:**
- Enroll fingerprint with employee number
- Verify employee number is set correctly
- Enable debug logging to see raw events
- Check device event configuration
- Try different enrolled user

---

### 4. Member Not Found

**Symptoms:**
```
🔔 Event received: AccessControl | Employee: 1001
⚠️ Member not found for employee number: 1001
```

**Diagnostic Steps:**

1. **Check database for member:**
   - Go to Supabase Dashboard
   - Open `members` table
   - Search for `member_id = "1001"`

2. **Verify member_id field:**
   ```sql
   SELECT id, name, member_id 
   FROM members 
   WHERE member_id = '1001'
   ```

3. **Check employee number on device:**
   - What number is shown when scanning?
   - Does it match `member_id` in database?

**Solutions:**
- Create member in dashboard with matching `member_id`
- Update existing member's `member_id` to match device
- Ensure employee number on device matches database
- Check for leading zeros (e.g., "0001" vs "1001")

**Example Fix:**
```sql
-- Update member's member_id to match device
UPDATE members 
SET member_id = '1001' 
WHERE name = 'John Doe'
```

---

### 5. Database Connection Failed

**Symptoms:**
```
❌ Error saving attendance: Invalid API key
❌ Error saving attendance: Failed to fetch
```

**Diagnostic Steps:**

1. **Verify Supabase URL:**
   ```env
   SUPABASE_URL=https://rhnerzynwcmwzorumqdq.supabase.co
   ```

2. **Check service role key:**
   - Go to Supabase Dashboard
   - Settings → API
   - Copy **service_role** key (NOT anon key!)
   - Paste in `.env`:
     ```env
     SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```

3. **Test Supabase connection:**
   ```bash
   # Try accessing Supabase in browser
   https://rhnerzynwcmwzorumqdq.supabase.co
   ```

4. **Check internet connection:**
   ```bash
   ping supabase.co
   ```

**Solutions:**
- Verify `SUPABASE_URL` is correct
- Use service_role key, not anon key
- Check internet connection
- Verify Supabase project is active
- Check for typos in `.env` file

---

### 6. Duplicate Check-ins

**Symptoms:**
```
✅ Check-in recorded for John Doe
✅ Check-in recorded for John Doe (again, within 1 minute)
```

**This is actually PREVENTED by the system!**

The listener has built-in duplicate prevention:
- Checks for existing check-ins within 1-minute window
- Skips duplicate events automatically
- Logs: "⏭️ Duplicate check-in prevented"

**If you're seeing duplicates:**
1. Check logs for "Duplicate prevented" messages
2. Verify duplicate prevention is working
3. Check if events are coming from different devices
4. Ensure only one listener is running

---

### 7. Service Won't Start

**Symptoms:**
```
❌ Service failed to start
❌ Error 1053: The service did not respond
```

**Diagnostic Steps:**

1. **Check if already running:**
   ```bash
   # Open Services (services.msc)
   # Look for "Hikvision Biometric Listener"
   # If running, stop it first
   ```

2. **Test manual start:**
   ```bash
   npm start
   # If this works, service installation issue
   ```

3. **Check Node.js path:**
   ```bash
   where node
   # Should show: C:\Program Files\nodejs\node.exe
   ```

4. **Run as Administrator:**
   - Right-click Command Prompt
   - "Run as Administrator"
   - Try install again

**Solutions:**
- Stop existing service before reinstalling
- Ensure Node.js is in system PATH
- Run installation as Administrator
- Check Event Viewer for detailed errors
- Try uninstall then reinstall

---

### 8. High CPU/Memory Usage

**Symptoms:**
```
Listener using 50%+ CPU
Memory usage growing over time
```

**Diagnostic Steps:**

1. **Check for connection loops:**
   - Look for repeated connection attempts
   - Check for rapid reconnection

2. **Enable debug logging:**
   ```env
   LOG_LEVEL=debug
   ```
   Look for unusual patterns

3. **Check event frequency:**
   - Are events coming too frequently?
   - Is device sending duplicate events?

**Solutions:**
- Increase reconnect delay in `.env`:
  ```env
  RECONNECT_DELAY=10000  # 10 seconds
  ```
- Restart listener
- Check device for issues
- Update Node.js to latest LTS
- Check for memory leaks in logs

---

### 9. Dashboard Not Updating

**Symptoms:**
```
✅ Check-in recorded for John Doe
(but dashboard doesn't show it)
```

**Diagnostic Steps:**

1. **Check dashboard connection:**
   - Look for ⚡ lightning bolt icon
   - Should be visible on dashboard

2. **Check browser console:**
   - Press F12
   - Look for errors in Console tab
   - Look for WebSocket connection

3. **Verify Supabase realtime:**
   - Go to Supabase Dashboard
   - Database → Replication
   - Ensure realtime is enabled for `checkins` table

4. **Test manual refresh:**
   - Refresh browser (F5)
   - Does check-in appear now?

**Solutions:**
- Enable Supabase realtime for `checkins` table
- Check browser console for errors
- Verify WebSocket connection
- Try different browser
- Clear browser cache

---

### 10. Listener Keeps Disconnecting

**Symptoms:**
```
✅ Connected to device event stream
⚠️ Event stream ended
🔄 Reconnecting in 5 seconds...
(repeats frequently)
```

**Diagnostic Steps:**

1. **Check network stability:**
   ```bash
   ping 192.168.1.64 -t
   # Watch for packet loss or high latency
   ```

2. **Check device logs:**
   - If device has UI, check system logs
   - Look for connection errors

3. **Verify device isn't rebooting:**
   - Check device uptime
   - Look for power issues

4. **Check for network congestion:**
   - Are other devices having issues?
   - Is network overloaded?

**Solutions:**
- Use wired Ethernet (not WiFi)
- Check network cable quality
- Verify device power supply
- Increase reconnect delay
- Check for network interference
- Update device firmware

---

## 🔧 Advanced Diagnostics

### Check Listener Status
```bash
# If running as service
services.msc
# Find "Hikvision Biometric Listener"
# Check status and startup type

# If running manually
# Check if process is running
tasklist | findstr node
```

### View Detailed Logs
```bash
# Manual mode
npm start
# Logs appear in console

# Service mode
eventvwr.msc
# Windows Logs → Application
# Look for "Hikvision Biometric Listener"
```

### Test Individual Components

**1. Test Device Connectivity:**
```bash
ping 192.168.1.64
telnet 192.168.1.64 80
```

**2. Test Device Authentication:**
```bash
npm test
```

**3. Test Database Connection:**
```bash
# In Node.js console
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(
  'https://rhnerzynwcmwzorumqdq.supabase.co',
  'your_service_role_key'
)
const { data, error } = await supabase.from('members').select('*').limit(1)
console.log(data, error)
```

**4. Test Event Stream:**
```bash
# Use curl or Postman
curl -u admin:@Smgym7? http://192.168.1.64/ISAPI/Event/notification/alertStream
```

---

## 📋 Diagnostic Checklist

When troubleshooting, check these in order:

- [ ] Device is powered on (LED indicators)
- [ ] Network cable connected properly
- [ ] Device and PC on same network
- [ ] Can ping device IP address
- [ ] Credentials in `.env` are correct
- [ ] Supabase URL and key are correct
- [ ] Node.js is installed (v16+)
- [ ] Dependencies installed (`npm install`)
- [ ] Fingerprint is enrolled in device
- [ ] Employee number is set on device
- [ ] Member exists in database with matching `member_id`
- [ ] Supabase realtime is enabled
- [ ] No firewall blocking connections
- [ ] Only one listener instance running

---

## 🆘 Getting Help

If you're still stuck:

1. **Gather information:**
   - Error messages from console
   - Output from `npm test`
   - Device model and firmware version
   - Node.js version (`node --version`)
   - Operating system

2. **Enable debug logging:**
   ```env
   LOG_LEVEL=debug
   ```

3. **Check documentation:**
   - `README.md` - Complete guide
   - `QUICK_SETUP.md` - Setup instructions
   - `ARCHITECTURE.md` - System design
   - `docs/ISAPI_EVENT_STREAM_GUIDE.md` - Technical details

4. **Test each component:**
   - Device connectivity
   - Authentication
   - Event stream
   - Database connection
   - Dashboard updates

5. **Review logs carefully:**
   - Look for patterns
   - Note exact error messages
   - Check timestamps

---

## ✅ Verification Steps

After fixing an issue, verify:

1. **Connection test passes:**
   ```bash
   npm test
   # Should show: 🎉 ALL TESTS PASSED!
   ```

2. **Listener connects:**
   ```bash
   npm start
   # Should show: ✅ Connected to device event stream
   ```

3. **Events are received:**
   - Scan fingerprint
   - Check console for event log
   - Should show: 🔔 Event received

4. **Check-ins are saved:**
   - Event should show: ✅ Check-in recorded
   - Check Supabase dashboard
   - Verify record in `checkins` table

5. **Dashboard updates:**
   - Open dashboard in browser
   - Look for ⚡ lightning bolt
   - Scan fingerprint
   - Check-in should appear within 3 seconds

---

**Most issues are related to network connectivity, credentials, or member_id mismatches. Start with the basics!** 🔍
