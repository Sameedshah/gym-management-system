# 🚀 Get Started with Real-Time Biometric Attendance

Your complete guide to setting up enterprise-grade real-time attendance tracking.

## 📋 What You Have

A complete **real-time biometric attendance system** that works with your Hikvision fingerprint device (192.168.1.64) using ISAPI event stream.

### System Components

1. **Hikvision Fingerprint Device** (DS-K1T8xx series)
   - IP: 192.168.1.64
   - Username: admin
   - Password: @Smgym7?

2. **Node.js Event Listener** (`biometric-listener/`)
   - Connects to device via ISAPI
   - Processes fingerprint events
   - Saves to database in real-time

3. **Supabase Database** (Cloud)
   - Stores members and check-ins
   - Real-time subscriptions enabled
   - Instant dashboard updates

4. **Next.js Dashboard** (Vercel)
   - Real-time attendance display
   - Member management
   - Statistics and reports

## ⚡ Quick Start (5 Minutes)

### Step 1: Install Node.js

If not already installed:
1. Download from: https://nodejs.org/
2. Choose LTS version (18.x recommended)
3. Run installer with default settings
4. Verify installation:
   ```bash
   node --version
   # Should show: v18.x.x or higher
   ```

### Step 2: Install Listener Dependencies

```bash
cd biometric-listener
npm install
```

Wait 1-2 minutes for installation to complete.

### Step 3: Get Supabase Service Key

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **Settings** → **API**
4. Copy the **service_role** key (NOT the anon key!)
5. Keep it safe for next step

### Step 4: Configure Environment

Edit `biometric-listener/.env` file:

```env
# Device (already configured)
DEVICE_IP=192.168.1.64
DEVICE_USERNAME=admin
DEVICE_PASSWORD=@Smgym7?
DEVICE_PORT=80

# Supabase (add your key here)
SUPABASE_URL=https://rhnerzynwcmwzorumqdq.supabase.co
SUPABASE_SERVICE_KEY=paste_your_service_role_key_here

# Optional settings
RECONNECT_DELAY=5000
LOG_LEVEL=info
```

### Step 5: Test Connection

```bash
npm test
```

Expected output:
```
🔍 Testing Hikvision Device Connection...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Device IP: 192.168.1.64:80
👤 Username: admin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test 1: Network Connectivity
─────────────────────────────
✅ Device is reachable!
✅ Device requires authentication (expected)

Test 2: Authentication
─────────────────────────────
✅ Authentication successful!
✅ Credentials are correct

Device Information:
─────────────────────────────
📱 Model: DS-K1T804MF
🔢 Serial: DS-K1T804MF20210101AAWRXXXXXXXXX
💾 Firmware: V3.2.5

Test 3: Event Stream Support
─────────────────────────────
✅ Event stream endpoint is accessible!
✅ Device supports ISAPI event notifications

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 ALL TESTS PASSED!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 You can now run: npm start
```

### Step 6: Start Listener

```bash
npm start
```

Expected output:
```
[INFO] 🚀 Starting Hikvision Event Listener...
[INFO] 📡 Device: 192.168.1.64:80
[INFO] 👤 Username: admin
[INFO] 🔌 Connecting to device event stream...
[INFO] ✅ Connected to device event stream
[INFO] 👂 Listening for biometric events...
[INFO] ✨ Hikvision Biometric Listener started successfully
[INFO] 💡 Press Ctrl+C to stop
```

### Step 7: Test with Fingerprint

1. **Scan a fingerprint** on the device
2. **Watch the console** - you should see:
   ```
   [INFO] 🔔 Event received: AccessControl | Employee: 1001 | Time: 2024-02-10T14:30:00
   [INFO] ✅ Check-in recorded for John Doe (ID: 1001)
   ```
3. **Check your dashboard** - attendance should appear instantly!

### Step 8: Configure Auto-Start (Optional)

Choose one method:

**Method A: Startup Folder (Simple)**
1. Press `Win + R`
2. Type: `shell:startup`
3. Drag `start.bat` into this folder
4. Done! Starts when you login

**Method B: Windows Service (Production)**
```bash
# Run Command Prompt as Administrator
cd biometric-listener
npm run install-service
```

Service will auto-start on Windows boot!

## ✅ Success Checklist

Verify everything is working:

- [ ] Node.js installed (v16+)
- [ ] Dependencies installed (`npm install`)
- [ ] Supabase service key added to `.env`
- [ ] Connection test passed (`npm test`)
- [ ] Listener connected (`npm start`)
- [ ] Fingerprint scan creates event log
- [ ] Check-in saved to database
- [ ] Dashboard shows attendance instantly
- [ ] Dashboard shows ⚡ lightning bolt icon
- [ ] Auto-start configured (optional)

## 📚 Documentation

### Quick References
- **5-Minute Setup**: `biometric-listener/QUICK_SETUP.md`
- **Complete Guide**: `biometric-listener/README.md`
- **Troubleshooting**: `biometric-listener/TROUBLESHOOTING.md`

### Technical Documentation
- **Architecture**: `biometric-listener/ARCHITECTURE.md`
- **ISAPI Guide**: `docs/ISAPI_EVENT_STREAM_GUIDE.md`
- **Device Setup**: `docs/COMPLETE_HIKVISION_SETUP_GUIDE.md`
- **System Overview**: `BIOMETRIC_REALTIME_SOLUTION.md`

### Main Project
- **Project README**: `README.md`
- **Quick Start**: `QUICK_START.md`

## 🎯 Next Steps

### 1. Enroll Members

For each gym member:

1. **Create member in dashboard:**
   - Go to Members → Add Member
   - Fill in details
   - **Important**: Set `Member ID` (e.g., "1001")

2. **Enroll fingerprint on device:**
   - Access device enrollment (via keypad or app)
   - Create new user
   - **Important**: Set Employee No to match Member ID (e.g., "1001")
   - Scan finger 3 times
   - Save

3. **Test:**
   - Scan enrolled finger
   - Check dashboard for attendance
   - Should appear within 2-3 seconds

### 2. Train Staff

Show your staff:
- How to view real-time attendance
- How to check member details
- How to handle issues
- Where to find reports

### 3. Monitor System

First few days:
- Check listener is running
- Verify all check-ins are recorded
- Watch for any errors in logs
- Ensure dashboard updates properly

### 4. Production Deployment

For reliable 24/7 operation:

**Option A: Dedicated PC**
- Use old laptop or desktop
- Install as Windows Service
- Keep powered on 24/7
- Connect to UPS (recommended)

**Option B: Raspberry Pi**
- Low power consumption
- Reliable operation
- Cost-effective ($35-55)
- Easy to set up

## 🆘 Common Issues

### "Can't connect to device"
```bash
# Test network
ping 192.168.1.64

# If no response:
# - Check device power
# - Verify network cable
# - Ensure same network
```

### "Authentication failed"
```bash
# Verify credentials in .env
# Try default: admin/12345
# Check device label for password
```

### "Member not found"
```bash
# Ensure member exists in database
# Verify member_id matches employee number
# Check Supabase dashboard
```

### "Dashboard not updating"
```bash
# Check for ⚡ lightning bolt icon
# Verify Supabase realtime enabled
# Check browser console (F12)
# Try refresh (F5)
```

**Full troubleshooting guide**: `biometric-listener/TROUBLESHOOTING.md`

## 🎉 You're Ready!

Your gym now has:

✅ **Enterprise-grade** real-time attendance
✅ **Instant updates** (2-3 second delay)
✅ **Professional dashboard** with live stats
✅ **Reliable system** with auto-reconnect
✅ **Cost-effective** solution (runs on free tier)
✅ **Scalable** architecture (add more devices easily)

## 📞 Support

If you need help:

1. **Check documentation** (see above)
2. **Run diagnostics**: `npm test`
3. **Enable debug mode**: Set `LOG_LEVEL=debug` in `.env`
4. **Review logs** for error messages
5. **Check troubleshooting guide**

## 🚀 Advanced Features

Once basic system is working:

### Multiple Devices
Run multiple listeners for multiple doors:
```bash
# Device 1 (Main Entrance)
cd biometric-listener-1
npm start

# Device 2 (Back Door)
cd biometric-listener-2
npm start
```

### Custom Notifications
Add email/SMS notifications when members check in:
- Edit `index.js`
- Add notification logic in `saveAttendance()`
- Use services like Twilio, SendGrid, etc.

### Advanced Analytics
- Export check-in data
- Generate reports
- Track attendance patterns
- Monitor peak hours

### Integration
- Connect to payment systems
- Integrate with access control
- Link to membership management
- Add to mobile app

---

## 🎊 Congratulations!

You've successfully set up an **enterprise-grade real-time biometric attendance system**!

Your gym now has the same technology used by major corporations, but at a fraction of the cost.

**Welcome to the future of gym management!** 🚀

---

**Quick Links:**
- 📖 [Complete Setup Guide](biometric-listener/README.md)
- ⚡ [Quick Setup (5 min)](biometric-listener/QUICK_SETUP.md)
- 🔧 [Troubleshooting](biometric-listener/TROUBLESHOOTING.md)
- 🏗️ [Architecture](biometric-listener/ARCHITECTURE.md)
- 📚 [ISAPI Guide](docs/ISAPI_EVENT_STREAM_GUIDE.md)
