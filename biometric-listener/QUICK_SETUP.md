# ZKTeco K40 Quick Setup (5 Minutes)

Get your ZKTeco K40 biometric attendance system running in 5 minutes!

## ⚡ Prerequisites

- ZKTeco K40 device connected to network
- Device IP: `192.168.1.201` (or note your IP)
- Node.js installed
- Supabase project ready

## 🚀 Setup Steps

### 1. Install Dependencies (1 minute)

```bash
cd zkteco-listener
npm install
```

### 2. Configure Environment (2 minutes)

Copy example file:
```bash
copy .env.example .env
```

Edit `.env`:
```env
# Device
DEVICE_IP=192.168.1.201
DEVICE_PORT=4370
DEVICE_PASSWORD=0

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here

# Polling
POLL_INTERVAL=10
```

**Get Supabase credentials:**
1. Go to Supabase Dashboard
2. Settings → API
3. Copy Project URL
4. Copy service_role key (NOT anon key!)

### 3. Test Connection (1 minute)

```bash
npm test
```

**Expected:**
```
✅ Socket connection established
✅ Device information retrieved
✅ Found X enrolled user(s)
🎉 ALL TESTS PASSED!
```

**If fails:**
- Check device IP: `ping 192.168.1.201`
- Verify device is powered on
- Check device password

### 4. Link Members (1 minute)

**CRITICAL:** Device user ID must match database `member_id`!

**Check device users:**
```bash
npm test
# Look for: User ID: 1001, Name: John Doe
```

**Update database:**
```sql
UPDATE members
SET member_id = '1001'
WHERE email = 'john@example.com';
```

### 5. Start Listener (30 seconds)

**Option A: Manual (Testing)**
```bash
npm start
```

**Option B: Double-click**
- Double-click `start.bat`

**Option C: Windows Service (Production)**
```bash
# Run as Administrator
npm run install-service
```

## ✅ Verify It's Working

1. **Check console:**
   ```
   ✅ Connected to ZKTeco K40 device
   🚀 Listener is running!
   ```

2. **Scan fingerprint** on device

3. **Watch logs:**
   ```
   [INFO] Found 1 attendance log(s)
   [SUCCESS] ✅ Attendance saved for John Doe
   ```

4. **Check database:**
   ```sql
   SELECT * FROM checkins ORDER BY check_in_time DESC LIMIT 1;
   ```

5. **Check dashboard** - should show new attendance!

## 🎉 Done!

Your system is now running! Attendance will sync every 10 seconds.

## 🆘 Quick Troubleshooting

**Connection failed?**
```bash
ping 192.168.1.201
```

**Member not found?**
- Check `member_id` matches device user ID
- Device ID must be string: `"1001"` not `1001`

**No logs?**
- Verify fingerprint is enrolled
- Check device user ID is set
- Enable debug mode: `LOG_LEVEL=debug`

## 📚 Full Documentation

- **Device Setup:** `../ZKTECO_DEVICE_SETUP_GUIDE.md`
- **Software Setup:** `../ZKTECO_SOFTWARE_SETUP_GUIDE.md`
- **Full README:** `README.md`
- **Troubleshooting:** `TROUBLESHOOTING.md`

---

**Need help?** Check the full documentation or run `npm test` to diagnose issues.
