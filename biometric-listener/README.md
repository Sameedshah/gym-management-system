# Hikvision Biometric Event Listener

Real-time biometric attendance event listener for Hikvision fingerprint devices using ISAPI event stream.

## 🎯 What This Does

- Connects to your Hikvision fingerprint device via ISAPI
- Listens for real-time fingerprint scan events
- Automatically saves attendance to Supabase database
- Dashboard updates instantly via Supabase realtime
- Auto-reconnects if connection drops
- Can run as Windows Service (auto-start on boot)

## 📋 Prerequisites

- Node.js 16+ installed
- Hikvision fingerprint device on same network
- Device credentials (username/password)
- Supabase service role key

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd biometric-listener
npm install
```

### 2. Configure Environment

Edit `.env` file with your settings:

```env
# Device Configuration
DEVICE_IP=192.168.1.64
DEVICE_USERNAME=admin
DEVICE_PASSWORD=@Smgym7?
DEVICE_PORT=80

# Supabase Configuration
SUPABASE_URL=https://rhnerzynwcmwzorumqdq.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

**⚠️ IMPORTANT:** Get your Supabase Service Role Key:
1. Go to Supabase Dashboard
2. Project Settings → API
3. Copy "service_role" key (NOT the anon key!)

### 3. Test Run

```bash
npm start
```

You should see:
```
✅ Connected to device event stream
👂 Listening for biometric events...
```

### 4. Test with Fingerprint Scan

- Scan a fingerprint on the device
- Watch the console for event logs
- Check your dashboard - attendance should appear instantly!

## 🔧 Installation Options

### Option A: Manual Start (Testing)

Double-click `start.bat` or run:
```bash
npm start
```

**Pros:** Easy to test and debug
**Cons:** Must manually start each time

### Option B: Windows Startup Folder (Simple Auto-Start)

1. Press `Win + R`
2. Type: `shell:startup`
3. Create shortcut to `start.bat` in this folder
4. Listener will start when you login to Windows

**Pros:** Simple, no admin rights needed
**Cons:** Only runs when you're logged in

### Option C: Windows Service (Production - Recommended)

Install as Windows Service (runs 24/7, even when logged out):

```bash
# Run as Administrator
npm run install-service
```

**Pros:** 
- Auto-starts on Windows boot
- Runs in background
- Runs even when logged out
- Production-ready

**Cons:** 
- Requires admin privileges
- Harder to see logs

To uninstall service:
```bash
# Run as Administrator
npm run uninstall-service
```

## 📊 Monitoring

### View Logs (Manual Mode)
Logs appear in console when running `npm start`

### View Logs (Service Mode)
1. Open Event Viewer (eventvwr.msc)
2. Windows Logs → Application
3. Look for "Hikvision Biometric Listener" events

### Check Service Status
1. Press `Win + R`
2. Type: `services.msc`
3. Find "Hikvision Biometric Listener"
4. Status should be "Running"

## 🔍 Troubleshooting

### Connection Issues

**Problem:** Can't connect to device
```
❌ Connection failed: connect ETIMEDOUT
```

**Solutions:**
- Verify device IP: `ping 192.168.1.64`
- Check device is powered on
- Ensure laptop and device on same network
- Try accessing device in browser: `http://192.168.1.64`

### Authentication Issues

**Problem:** 401 Unauthorized
```
❌ Connection failed: Request failed with status code 401
```

**Solutions:**
- Verify username/password in `.env`
- Check device credentials haven't changed
- Try logging into device directly

### No Events Received

**Problem:** Connected but no events appear
```
✅ Connected to device event stream
👂 Listening for biometric events...
(nothing happens when scanning)
```

**Solutions:**
- Verify fingerprint is enrolled in device
- Check device event settings are enabled
- Try scanning multiple times
- Check device logs for errors

### Database Issues

**Problem:** Events received but not saving
```
⚠️ Member not found for employee number: 1001
```

**Solutions:**
- Verify member exists in database with matching `member_id`
- Check Supabase service key is correct
- Verify database connection

## 🎛️ Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEVICE_IP` | Device IP address | 192.168.1.64 |
| `DEVICE_USERNAME` | Device username | admin |
| `DEVICE_PASSWORD` | Device password | - |
| `DEVICE_PORT` | Device HTTP port | 80 |
| `SUPABASE_URL` | Supabase project URL | - |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | - |
| `RECONNECT_DELAY` | Reconnect delay (ms) | 5000 |
| `LOG_LEVEL` | Log level (info/debug) | info |

### Debug Mode

For detailed logs, set in `.env`:
```env
LOG_LEVEL=debug
```

## 🔄 How It Works

```
1. Fingerprint Scan on Device
   ↓
2. Device sends event via ISAPI stream
   ↓
3. Listener receives event (1-2 seconds)
   ↓
4. Parse employee number and time
   ↓
5. Find member in database
   ↓
6. Insert check-in record
   ↓
7. Supabase realtime triggers
   ↓
8. Dashboard updates instantly ⚡
```

## 📝 Event Flow

```javascript
// Device sends XML event:
<EventNotificationAlert>
  <employeeNoString>1001</employeeNoString>
  <dateTime>2024-02-10T14:30:00</dateTime>
  <doorName>Main Entrance</doorName>
</EventNotificationAlert>

// Listener processes:
- Finds member with member_id = "1001"
- Creates check-in record
- Updates member last_seen

// Dashboard shows:
✅ John Doe checked in at 2:30 PM
```

## 🛡️ Security Notes

- `.env` file contains sensitive credentials - never commit to git
- Service role key has full database access - keep secure
- Device password should be strong
- Consider running on dedicated PC for production

## 🎉 Success Indicators

When everything is working:

✅ Console shows: "Connected to device event stream"
✅ Fingerprint scan triggers event log
✅ Dashboard shows ⚡ lightning bolt (real-time active)
✅ Attendance appears instantly on dashboard
✅ No browser refresh needed

## 📞 Support

If you encounter issues:

1. Check logs for error messages
2. Verify all configuration settings
3. Test device connectivity with ping
4. Ensure member_id matches employee number
5. Check Supabase connection

## 🔧 Maintenance

### Regular Tasks
- **Weekly:** Check listener is running
- **Monthly:** Review logs for errors
- **Quarterly:** Update dependencies (`npm update`)

### Restart Service
```bash
# In services.msc, right-click service
# Select "Restart"
```

### Update Configuration
1. Stop service/listener
2. Edit `.env` file
3. Restart service/listener

## 🚀 Production Deployment

For a real gym environment:

1. **Use dedicated PC/Raspberry Pi**
   - Always on, always connected
   - Reliable network connection
   - UPS backup recommended

2. **Install as Windows Service**
   - Auto-starts on boot
   - Runs in background
   - Production-ready

3. **Monitor regularly**
   - Check logs weekly
   - Verify events are processing
   - Test with fingerprint scans

4. **Backup configuration**
   - Save `.env` file securely
   - Document device settings
   - Keep credentials safe

---

**Your gym now has enterprise-grade real-time attendance tracking!** 🎉
