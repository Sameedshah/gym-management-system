# ZKTeco K40 Quick Reference Card

Quick commands and troubleshooting for ZKTeco K40 biometric system.

## 🚀 Quick Commands

```bash
# Install dependencies
npm install

# Test connection
npm test

# Start listener (manual)
npm start

# Install as Windows Service (run as Admin)
npm run install-service

# Uninstall service (run as Admin)
npm run uninstall-service
```

## 📝 Configuration

**File:** `.env`

```env
DEVICE_IP=192.168.1.201
DEVICE_PORT=4370
DEVICE_PASSWORD=0
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
POLL_INTERVAL=10
LOG_LEVEL=info
```

## 🔍 Diagnostics

```bash
# Test device connectivity
ping 192.168.1.201

# Test connection
npm test

# Enable debug logging
# Edit .env: LOG_LEVEL=debug
npm start

# Check service status
services.msc
# Find "ZKTeco Biometric Listener"
```

## 🗄️ Database Queries

```sql
-- Check member exists
SELECT * FROM members WHERE member_id = '1001';

-- View recent check-ins
SELECT m.name, c.check_in_time, c.entry_method
FROM checkins c
JOIN members m ON c.member_id = m.id
ORDER BY c.check_in_time DESC
LIMIT 10;

-- Update member_id
UPDATE members SET member_id = '1001' WHERE email = 'john@example.com';

-- Check for duplicates
SELECT member_id, check_in_time, COUNT(*)
FROM checkins
GROUP BY member_id, check_in_time
HAVING COUNT(*) > 1;
```

## 🆘 Quick Troubleshooting

| Problem | Quick Fix |
|---------|-----------|
| Connection failed | `ping 192.168.1.201` |
| Member not found | Check `member_id` matches device user ID |
| No logs | Verify fingerprint enrolled on device |
| Service won't start | Run as Administrator |
| Slow sync | Reduce `POLL_INTERVAL` to 5 |
| High CPU | Increase `POLL_INTERVAL` to 30 |

## 📊 Status Indicators

**Listener Console:**
```
✅ Connected to ZKTeco K40 device     → Working
🚀 Listener is running!                → Working
[SUCCESS] Attendance saved             → Working
[ERROR] Connection failed              → Check device
[ERROR] Member not found               → Check member_id
```

**Device:**
- Green LED = Ready
- Beep on scan = Recognized
- Red LED = Error

## 🔑 Key Concepts

**Device User ID = member_id**
- Device: User enrolled with ID `1001`
- Database: Member with `member_id = "1001"`
- Must match exactly!

**Polling:**
- Listener checks device every 10 seconds
- Fetches new attendance logs
- Saves to database

**Duplicate Prevention:**
- Ignores scans within 1 minute
- Prevents accidental double check-ins

## 📞 Quick Links

- **Quick Setup:** `QUICK_SETUP.md`
- **Full README:** `README.md`
- **Troubleshooting:** `TROUBLESHOOTING.md`
- **Device Setup:** `../ZKTECO_DEVICE_SETUP_GUIDE.md`
- **Software Setup:** `../ZKTECO_SOFTWARE_SETUP_GUIDE.md`

## 🎯 Common Tasks

**Enroll new member:**
1. Add to database, note `member_id` (e.g., "1003")
2. Device menu → User → New User
3. Enter ID: `1003`
4. Enroll fingerprint
5. Test scan

**Check service status:**
1. Press `Win + R`
2. Type: `services.msc`
3. Find "ZKTeco Biometric Listener"
4. Check status is "Running"

**View logs (service mode):**
1. Press `Win + R`
2. Type: `eventvwr.msc`
3. Windows Logs → Application
4. Filter by "ZKTeco Biometric Listener"

**Restart service:**
```bash
# In Services (services.msc)
Right-click → Restart
```

## 🔧 Performance Tuning

**Faster updates:**
```env
POLL_INTERVAL=5  # Check every 5 seconds
```

**Less network traffic:**
```env
POLL_INTERVAL=30  # Check every 30 seconds
```

**Debug mode:**
```env
LOG_LEVEL=debug  # Detailed logging
```

**Production mode:**
```env
LOG_LEVEL=info  # Normal logging
```

## ✅ Health Check

System is healthy when:
- ✅ `npm test` passes
- ✅ Listener shows "Connected"
- ✅ Scan triggers log output
- ✅ Database record created
- ✅ Dashboard updates
- ✅ Service status "Running"

## 🚨 Emergency

**System not working:**
1. Stop listener (Ctrl+C or stop service)
2. Power cycle device (unplug 30 sec)
3. Run `npm test`
4. If passes, start listener
5. Test with one scan

**Complete reset:**
```bash
# Stop service
services.msc → Stop

# Clear device logs
Device menu → Data → Clear Attendance

# Restart service
services.msc → Start

# Test
npm test
```

---

**Print this card and keep it handy!** 📋
