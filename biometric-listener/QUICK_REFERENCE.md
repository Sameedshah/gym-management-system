# ⚡ Quick Reference Card

One-page reference for common tasks and commands.

## 🚀 Quick Commands

```bash
# Install dependencies
npm install

# Test connection
npm test

# Start listener (manual)
npm start

# Install as Windows Service (Admin required)
npm run install-service

# Uninstall Windows Service (Admin required)
npm run uninstall-service

# Start with debug logging
# (Edit .env: LOG_LEVEL=debug, then)
npm start
```

## 📁 Important Files

| File | Purpose |
|------|---------|
| `.env` | Configuration (credentials, settings) |
| `index.js` | Main listener code |
| `package.json` | Dependencies and scripts |
| `start.bat` | Quick start script for Windows |
| `test-connection.js` | Connection testing tool |
| `README.md` | Complete documentation |
| `TROUBLESHOOTING.md` | Problem solving guide |

## 🔧 Configuration (.env)

```env
# Device Settings
DEVICE_IP=192.168.1.64          # Device IP address
DEVICE_USERNAME=admin            # Device username
DEVICE_PASSWORD=@Smgym7?        # Device password
DEVICE_PORT=80                   # HTTP port (usually 80)

# Supabase Settings
SUPABASE_URL=https://rhnerzynwcmwzorumqdq.supabase.co
SUPABASE_SERVICE_KEY=your_key   # Service role key (NOT anon!)

# Optional Settings
RECONNECT_DELAY=5000            # Reconnect delay in ms (5 seconds)
LOG_LEVEL=info                  # Log level: info or debug
```

## 🔍 Diagnostic Commands

```bash
# Test device connectivity
ping 192.168.1.64

# Test port access
telnet 192.168.1.64 80

# Check Node.js version
node --version

# Check npm version
npm --version

# View running Node processes
tasklist | findstr node

# Check if service is running
services.msc
# Look for "Hikvision Biometric Listener"
```

## 📊 Log Messages

### Success Messages
```
✅ Connected to device event stream
👂 Listening for biometric events...
🔔 Event received: AccessControl | Employee: 1001
✅ Check-in recorded for John Doe (ID: 1001)
```

### Warning Messages
```
⚠️ Event stream ended
🔄 Reconnecting in 5 seconds...
⚠️ Member not found for employee number: 1001
⏭️ Duplicate check-in prevented for John Doe
```

### Error Messages
```
❌ Connection failed: connect ETIMEDOUT
❌ Authentication failed
❌ Failed to insert check-in: [error details]
❌ Error saving attendance: [error details]
```

## 🆘 Quick Troubleshooting

| Problem | Quick Fix |
|---------|-----------|
| Can't connect | `ping 192.168.1.64` - Check network |
| 401 Error | Verify credentials in `.env` |
| No events | Check fingerprint is enrolled |
| Member not found | Verify `member_id` matches employee number |
| Service won't start | Run as Administrator |
| High CPU | Increase `RECONNECT_DELAY` |

## 🎯 Common Tasks

### Start Listener Manually
```bash
cd biometric-listener
npm start
```

### Stop Listener
```
Press Ctrl+C in terminal
```

### Restart Service
```bash
# Method 1: Services GUI
services.msc
# Right-click "Hikvision Biometric Listener" → Restart

# Method 2: Command line (Admin)
net stop "Hikvision Biometric Listener"
net start "Hikvision Biometric Listener"
```

### View Service Logs
```bash
# Open Event Viewer
eventvwr.msc
# Navigate to: Windows Logs → Application
# Filter by: "Hikvision Biometric Listener"
```

### Update Configuration
```bash
# 1. Stop listener/service
# 2. Edit .env file
# 3. Restart listener/service
```

### Enable Debug Logging
```bash
# Edit .env
LOG_LEVEL=debug

# Restart listener
npm start
```

## 📋 Pre-Flight Checklist

Before starting listener:

- [ ] Node.js installed (v16+)
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file configured
- [ ] Device IP is correct
- [ ] Device credentials are correct
- [ ] Supabase service key added
- [ ] Device is powered on
- [ ] Device is on same network
- [ ] Can ping device IP

## 🔄 Event Flow

```
1. Member scans finger
   ↓
2. Device sends event (1-2 sec)
   ↓
3. Listener receives event
   ↓
4. Parse employee number
   ↓
5. Find member in database
   ↓
6. Insert check-in record
   ↓
7. Dashboard updates (real-time)
   ↓
8. Staff sees attendance (instant)
```

## 🎯 Success Indicators

System is working when:

✅ Console shows: "Connected to device event stream"
✅ Fingerprint scan triggers event log
✅ Event log shows employee number
✅ Check-in is saved to database
✅ Dashboard shows ⚡ lightning bolt
✅ Attendance appears within 3 seconds
✅ No errors in console

## 📞 Quick Links

- **Setup**: `QUICK_SETUP.md`
- **Full Guide**: `README.md`
- **Troubleshooting**: `TROUBLESHOOTING.md`
- **Architecture**: `ARCHITECTURE.md`
- **Get Started**: `../GET_STARTED.md`

## 🔑 Important Notes

1. **Member ID must match Employee Number**
   - Database `member_id` = Device Employee No
   - Example: Both should be "1001"

2. **Use Service Role Key**
   - NOT the anon key
   - Found in Supabase Dashboard → Settings → API

3. **Keep Listener Running**
   - Use Windows Service for 24/7 operation
   - Or use Startup Folder for auto-start

4. **Network Requirements**
   - Device and PC must be on same network
   - Use wired Ethernet (recommended)
   - Avoid WiFi for reliability

5. **Security**
   - Never commit `.env` to git
   - Keep credentials secure
   - Use strong device password

## 💡 Pro Tips

- **Test first**: Always run `npm test` before starting
- **Debug mode**: Enable when troubleshooting
- **Monitor logs**: Check regularly for errors
- **Backup config**: Save `.env` file securely
- **Document changes**: Note any configuration changes
- **Test recovery**: Verify auto-reconnect works
- **Plan maintenance**: Schedule updates during off-hours

---

**Keep this card handy for quick reference!** 📌
