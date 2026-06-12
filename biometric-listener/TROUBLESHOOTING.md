# ZKTeco K40 Troubleshooting Guide

Common issues and solutions for ZKTeco K40 biometric attendance system.

## 🔍 Diagnostic Tools

### Quick Health Check

```bash
# Test device connection
npm test

# Start with debug logging
# Edit .env: LOG_LEVEL=debug
npm start
```

### Network Test

```bash
# Test device reachability
ping 192.168.1.201

# Test port (Windows)
Test-NetConnection -ComputerName 192.168.1.201 -Port 4370
```

## ❌ Connection Issues

### Error: "Connection failed: connect ETIMEDOUT"

**Symptoms:**
- Can't connect to device
- Timeout errors
- Connection hangs

**Solutions:**

1. **Verify device IP:**
   ```bash
   ping 192.168.1.201
   ```
   - If no reply, check device IP address
   - Check device is on same network
   - Verify IP in `.env` matches device

2. **Check device power:**
   - Ensure device is powered on
   - Check LED indicators are lit
   - Try power cycling device

3. **Check network cable:**
   - Verify Ethernet cable is connected
   - Try different cable
   - Check cable is not damaged
   - Try different network port on router

4. **Check firewall:**
   ```bash
   # Windows Firewall
   # Allow Node.js through firewall
   # Or temporarily disable to test
   ```

5. **Verify port:**
   - Default ZKTeco port is `4370`
   - Check device settings
   - Verify `.env` has correct port

### Error: "Authentication failed"

**Symptoms:**
- Connection established but auth fails
- 401 or authentication errors

**Solutions:**

1. **Check device password:**
   - Default is `0`
   - Verify password in `.env`
   - Try device default: `0` or `1234`

2. **Reset device password:**
   - Access device menu
   - System → Password
   - Reset to default

3. **Check device settings:**
   - Ensure TCP/IP is enabled
   - Verify communication settings
   - Check device is not locked

### Error: "Socket hang up" or "ECONNRESET"

**Symptoms:**
- Connection drops randomly
- Socket errors
- Intermittent connectivity

**Solutions:**

1. **Check network stability:**
   - Test continuous ping: `ping -t 192.168.1.201`
   - Look for packet loss
   - Check for network congestion

2. **Increase timeout:**
   Edit `.env`:
   ```env
   DEVICE_TIMEOUT=10000  # 10 seconds
   ```

3. **Check device load:**
   - Device may be overloaded
   - Reduce polling frequency
   - Check device storage

4. **Restart device:**
   - Power cycle device
   - Wait 60 seconds
   - Restart listener

## 👤 Member/User Issues

### Error: "Member not found for device user ID: 1001"

**Symptoms:**
- Fingerprint scan works on device
- Listener receives log
- No database record created
- Error in logs

**Solutions:**

1. **Verify member exists:**
   ```sql
   SELECT * FROM members WHERE member_id = '1001';
   ```
   - Should return one row
   - If empty, member doesn't exist

2. **Check member_id format:**
   - Must be string: `"1001"` not `1001`
   - Must match exactly (case-sensitive)
   - No extra spaces or characters

3. **Update member_id:**
   ```sql
   UPDATE members
   SET member_id = '1001'
   WHERE email = 'john@example.com';
   ```

4. **Check device user ID:**
   ```bash
   npm test
   # Look for enrolled users and their IDs
   ```

5. **Verify Supabase connection:**
   - Check `SUPABASE_URL` is correct
   - Verify `SUPABASE_SERVICE_KEY` is valid
   - Test database connection

### Error: "Duplicate attendance record"

**Symptoms:**
- Multiple records for same scan
- Records within 1 minute of each other

**Solutions:**

1. **Check duplicate prevention:**
   - System prevents duplicates within 1 minute
   - This is normal behavior
   - If seeing duplicates, check logs

2. **Verify device time:**
   - Device time must be accurate
   - Check device: System → Date/Time
   - Sync with NTP if available

3. **Check listener instances:**
   - Ensure only one listener is running
   - Stop duplicate services
   - Check Task Manager for multiple node processes

## 📊 Attendance Log Issues

### Problem: No attendance logs received

**Symptoms:**
- Listener connected
- Fingerprint scan works on device
- No logs in listener console
- No database records

**Solutions:**

1. **Verify fingerprint enrollment:**
   - Check user is enrolled on device
   - Test fingerprint recognition
   - Re-enroll if needed

2. **Check device user ID:**
   - User must have ID assigned
   - Check device: User → View User
   - Verify ID is set

3. **Check device storage:**
   - Device may be full
   - Clear old logs if needed
   - Check device capacity

4. **Enable debug mode:**
   Edit `.env`:
   ```env
   LOG_LEVEL=debug
   ```
   - Restart listener
   - Look for detailed logs

5. **Check attendance settings:**
   - Device: Attendance → Settings
   - Ensure logging is enabled
   - Verify log storage is internal

### Problem: Old logs keep appearing

**Symptoms:**
- Same attendance logs processed multiple times
- Historical logs appearing

**Solutions:**

1. **Clear device logs:**
   - Device menu: Data → Clear Attendance
   - Or uncomment in `index.js`:
   ```javascript
   await zkInstance.clearAttendanceLog();
   ```

2. **Check last processed log:**
   - Listener tracks last processed log
   - Restart listener to reset
   - Check for duplicate prevention

## 🔧 Service Issues

### Problem: Service won't install

**Symptoms:**
- `npm run install-service` fails
- Permission errors
- Service not appearing in Services

**Solutions:**

1. **Run as Administrator:**
   - Right-click Command Prompt
   - Select "Run as Administrator"
   - Try install again

2. **Check Node.js installation:**
   ```bash
   node --version
   npm --version
   ```
   - Should show version numbers
   - Reinstall Node.js if needed

3. **Check node-windows:**
   ```bash
   npm install node-windows
   ```

4. **Manual service creation:**
   - Use Windows Task Scheduler
   - Create task to run `start.bat` on startup

### Problem: Service won't start

**Symptoms:**
- Service installed but won't start
- Status shows "Stopped"
- Errors in Event Viewer

**Solutions:**

1. **Check Event Viewer:**
   - Open `eventvwr.msc`
   - Windows Logs → Application
   - Look for errors from service

2. **Verify .env file:**
   - Ensure `.env` exists
   - Check all variables are set
   - No syntax errors

3. **Check file paths:**
   - Service must find `index.js`
   - Verify working directory
   - Check file permissions

4. **Test manually first:**
   ```bash
   npm start
   ```
   - If works manually, service should work
   - If fails, fix errors first

### Problem: Service stops randomly

**Symptoms:**
- Service starts but stops after a while
- Intermittent operation
- No obvious errors

**Solutions:**

1. **Check logs:**
   - Event Viewer for errors
   - Look for crash reports
   - Check for memory issues

2. **Increase memory:**
   Edit `install-service.js`:
   ```javascript
   nodeOptions: [
     '--max_old_space_size=4096'  // Increase if needed
   ]
   ```

3. **Check device connection:**
   - Service may stop on connection loss
   - Verify network stability
   - Check reconnection logic

4. **Monitor resources:**
   - Task Manager → Details
   - Look for node.exe
   - Check CPU/memory usage

## 🗄️ Database Issues

### Error: "Failed to save attendance"

**Symptoms:**
- Listener receives log
- Member found
- Database insert fails

**Solutions:**

1. **Check Supabase connection:**
   ```bash
   # Test in browser
   https://your-project.supabase.co
   ```

2. **Verify service role key:**
   - Must be service_role key (not anon)
   - Check key is valid
   - Regenerate if needed

3. **Check RLS policies:**
   ```sql
   -- Service role should bypass RLS
   -- But verify policies exist
   SELECT * FROM pg_policies WHERE tablename = 'checkins';
   ```

4. **Check table schema:**
   ```sql
   -- Verify columns exist
   \d checkins
   ```

5. **Check foreign key:**
   ```sql
   -- Verify member_id exists
   SELECT id FROM members WHERE id = 'uuid-here';
   ```

### Error: "Supabase client error"

**Symptoms:**
- Can't connect to Supabase
- API errors
- Timeout errors

**Solutions:**

1. **Check Supabase status:**
   - Visit status.supabase.com
   - Check for outages

2. **Verify URL:**
   - Must be full URL with https://
   - No trailing slash
   - Correct project subdomain

3. **Check API key:**
   - Must be service_role key
   - Copy entire key (very long)
   - No extra spaces

4. **Test connection:**
   ```javascript
   // Add to test-connection.js
   const { createClient } = require('@supabase/supabase-js');
   const supabase = createClient(url, key);
   const { data, error } = await supabase.from('members').select('count');
   console.log(data, error);
   ```

## ⚡ Performance Issues

### Problem: Slow attendance sync

**Symptoms:**
- Long delay between scan and database
- Slow polling
- Laggy updates

**Solutions:**

1. **Reduce poll interval:**
   Edit `.env`:
   ```env
   POLL_INTERVAL=5  # Check every 5 seconds
   ```

2. **Check network speed:**
   - Test ping time to device
   - Check internet speed to Supabase
   - Optimize network

3. **Check device response:**
   - Enable debug mode
   - Look for slow queries
   - Check device load

4. **Optimize database:**
   ```sql
   -- Add indexes
   CREATE INDEX idx_members_member_id ON members(member_id);
   CREATE INDEX idx_checkins_member_id ON checkins(member_id);
   ```

### Problem: High CPU/memory usage

**Symptoms:**
- Node process using lots of resources
- Computer slows down
- Service crashes

**Solutions:**

1. **Increase poll interval:**
   ```env
   POLL_INTERVAL=30  # Less frequent polling
   ```

2. **Check for memory leaks:**
   - Restart service daily
   - Monitor memory over time
   - Update dependencies

3. **Reduce logging:**
   ```env
   LOG_LEVEL=info  # Less verbose
   ```

4. **Check for infinite loops:**
   - Review logs for repeated errors
   - Check reconnection logic
   - Verify error handling

## 🔐 Security Issues

### Problem: Unauthorized access

**Symptoms:**
- Unknown attendance records
- Suspicious activity
- Security concerns

**Solutions:**

1. **Change device password:**
   - Device menu: System → Password
   - Use strong password
   - Update `.env`

2. **Secure .env file:**
   - Never commit to git
   - Restrict file permissions
   - Keep service key secret

3. **Check RLS policies:**
   ```sql
   -- Verify policies are correct
   SELECT * FROM pg_policies;
   ```

4. **Monitor access:**
   - Check Supabase logs
   - Review attendance records
   - Look for anomalies

## 📱 Device Issues

### Problem: Device not responding

**Symptoms:**
- Device frozen
- No response to scans
- Display blank or stuck

**Solutions:**

1. **Power cycle device:**
   - Unplug power
   - Wait 30 seconds
   - Plug back in
   - Wait for boot

2. **Check device status:**
   - Look at LED indicators
   - Check display
   - Listen for beeps

3. **Factory reset (last resort):**
   - Device menu: System → Reset
   - Will erase all data
   - Re-enroll users after

### Problem: Fingerprint not recognized

**Symptoms:**
- Enrolled finger not recognized
- Multiple scan attempts needed
- Inconsistent recognition

**Solutions:**

1. **Clean scanner:**
   - Use soft cloth
   - Remove dust/dirt
   - Dry thoroughly

2. **Clean finger:**
   - Wash and dry hands
   - Remove moisture
   - Avoid lotion

3. **Re-enroll fingerprint:**
   - Delete old enrollment
   - Enroll again
   - Use different finger if needed

4. **Check scanner quality:**
   - Scanner may be damaged
   - Contact ZKTeco support
   - Consider replacement

## 🆘 Emergency Procedures

### Complete System Reset

If nothing works:

1. **Stop listener:**
   ```bash
   # Manual: Ctrl+C
   # Service: services.msc → Stop
   ```

2. **Power cycle device:**
   - Unplug for 30 seconds
   - Plug back in

3. **Clear device logs:**
   - Device menu: Data → Clear Attendance

4. **Restart listener:**
   ```bash
   npm start
   ```

5. **Test with one user:**
   - Enroll test user
   - Scan fingerprint
   - Verify attendance

### Get Help

1. **Check documentation:**
   - README.md
   - QUICK_SETUP.md
   - Device manual

2. **Enable debug mode:**
   ```env
   LOG_LEVEL=debug
   ```

3. **Collect information:**
   - Error messages
   - Log output
   - Device model/firmware
   - Network configuration

4. **Contact support:**
   - ZKTeco: support@zkteco.com
   - Supabase: support@supabase.io

## 📋 Diagnostic Checklist

When troubleshooting, check:

- [ ] Device is powered on
- [ ] Network cable connected
- [ ] Can ping device IP
- [ ] Device password correct
- [ ] Node.js installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file exists and configured
- [ ] Supabase credentials valid
- [ ] Members have matching member_id
- [ ] Fingerprints enrolled on device
- [ ] Device user IDs assigned
- [ ] Connection test passes (`npm test`)
- [ ] No firewall blocking
- [ ] Only one listener running
- [ ] Device time accurate
- [ ] Database tables exist
- [ ] RLS policies configured

## 🎯 Prevention Tips

**Avoid issues:**

1. **Use static IP** for device
2. **Regular backups** of database
3. **Monitor logs** daily
4. **Update firmware** periodically
5. **Clean scanner** weekly
6. **Test regularly** with known users
7. **Document changes** to configuration
8. **Train staff** on proper usage

---

**Still stuck?** Run `npm test` and share the output for diagnosis.
