# ZKTeco K40 Biometric Attendance Listener

Real-time biometric attendance listener for ZKTeco K40 fingerprint devices.

## 🎯 What This Does

- Connects to ZKTeco K40 device via TCP socket (port 4370)
- Polls attendance logs every 3 seconds (near real-time)
- Automatically saves attendance to Supabase database
- Dashboard updates instantly via Supabase realtime
- Auto-reconnects if connection drops
- Can run as Windows Service (auto-start on boot)

## 📋 Prerequisites

- Node.js 16+ installed
- ZKTeco K40 device on same network (192.168.1.201:4370)
- Device configured and fingerprints enrolled
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
DEVICE_IP=192.168.1.201
DEVICE_PORT=4370
DEVICE_PASSWORD=0
DEVICE_TIMEOUT=5000

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here

# Polling (3 seconds = near real-time)
POLL_INTERVAL=3
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
✅ Connected to ZKTeco K40 device
Device Model: K40
🚀 Listener is running!
```

### 4. Test with Fingerprint Scan

- Scan a fingerprint on the K40 device
- Wait 3-5 seconds
- Check console for event logs
- Check dashboard - attendance should appear!

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

## 📊 How It Works

```
1. Fingerprint Scan on K40 Device
   ↓
2. Device stores log in internal memory
   ↓
3. Listener polls device every 3 seconds
   ↓
4. New log detected
   ↓
5. Parse employee number and time
   ↓
6. Find member in database (by member_id)
   ↓
7. Insert check-in record
   ↓
8. Supabase realtime triggers
   ↓
9. Dashboard updates instantly ⚡
```

**Total Delay: 3-5 seconds** (near real-time)

## 🔍 Troubleshooting

### Connection Issues

**Problem:** Can't connect to device
```
❌ Failed to connect: connect ETIMEDOUT
```

**Solutions:**
- Verify device IP: `ping 192.168.1.201`
- Check device is powered on
- Ensure laptop and device on same network
- Verify port 4370 is accessible
- Check firewall settings

### Member Not Found

**Problem:** Events received but not saving
```
⚠️ Member not found for device user ID: 1001
```

**Solutions:**
- Verify member exists in database
- Check `member_id` in database matches device user ID
- Device user ID must be string, not number
- Example: Device User ID "1001" = member_id "1001"

### Slow Updates

**Problem:** Attendance appears after 10+ seconds

**Solutions:**
- Check POLL_INTERVAL in .env (should be 3)
- Verify listener is running
- Check network latency
- Restart listener service

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Recommended |
|----------|-------------|---------|-------------|
| `DEVICE_IP` | K40 IP address | 192.168.1.201 | Your device IP |
| `DEVICE_PORT` | K40 TCP port | 4370 | 4370 (standard) |
| `DEVICE_PASSWORD` | Device password | 0 | 0 (default) |
| `DEVICE_TIMEOUT` | Connection timeout (ms) | 5000 | 5000 |
| `SUPABASE_URL` | Supabase project URL | - | Required |
| `SUPABASE_SERVICE_KEY` | Service role key | - | Required |
| `POLL_INTERVAL` | Poll frequency (seconds) | 3 | 2-5 seconds |
| `LOG_LEVEL` | Log verbosity | info | info/debug |

### Performance Tuning

**For faster updates (2-second delay):**
```env
POLL_INTERVAL=2
```

**For lower network usage (5-second delay):**
```env
POLL_INTERVAL=5
```

**⚠️ Don't go below 2 seconds** - may overload device

## 🛡️ Security Notes

- `.env` file contains sensitive credentials - never commit to git
- Service role key has full database access - keep secure
- Device password should be changed from default
- Consider running on dedicated PC for production

## 🎉 Success Indicators

When everything is working:

✅ Console shows: "Connected to ZKTeco K40 device"
✅ Fingerprint scan triggers event log within 3-5 seconds
✅ Dashboard shows ⚡ lightning bolt (real-time active)
✅ Attendance appears on dashboard
✅ No browser refresh needed

## 📞 Support

If you encounter issues:

1. Check logs for error messages
2. Verify all configuration settings
3. Test device connectivity: `ping 192.168.1.201`
4. Ensure member_id matches device user ID exactly
5. Check Supabase connection
6. Verify device has attendance logs: Check device admin panel

## 🔧 Maintenance

### Regular Tasks
- **Daily:** Verify listener is running
- **Weekly:** Check logs for errors
- **Monthly:** Update dependencies (`npm update`)

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

**Your gym now has professional real-time attendance tracking with ZKTeco K40!** 🎉
