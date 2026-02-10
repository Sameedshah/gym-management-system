# Hikvision Device Troubleshooting Flowchart

## 🔍 Problem Diagnosis Flow

```
START: Device Not Working
         |
         v
    Power LED On?
         |
    NO ──┴── Check power adapter connection
         |   Check power outlet
         |   Try different power adapter
         |   → If still no power: Hardware fault
         |
    YES ──┴── Network LED Active?
              |
         NO ──┴── Check Ethernet cable
              |   Try different cable
              |   Check router port
              |   Check cable crimping
              |   → If still no network: Network issue
              |
         YES ──┴── Can Ping Device?
                   |
              NO ──┴── Check IP address with SADP
                   |   Check router DHCP list
                   |   Try factory reset
                   |   → If still can't ping: IP conflict
                   |
              YES ──┴── Web Interface Accessible?
                        |
                   NO ──┴── Try different browser
                        |   Clear browser cache
                        |   Check firewall
                        |   Try HTTP instead of HTTPS
                        |   → If still no access: Browser issue
                        |
                   YES ──┴── Can Login?
                             |
                        NO ──┴── Try default credentials
                             |   Check device label
                             |   Factory reset device
                             |   → If still can't login: Password issue
                             |
                        YES ──┴── ISAPI Working?
                                  |
                             NO ──┴── Enable ISAPI service
                                  |   Check port 80 open
                                  |   Test with curl command
                                  |   → If still not working: Service issue
                                  |
                             YES ──┴── Webhook Configured?
                                       |
                                  NO ──┴── Configure HTTP notification
                                       |   Set webhook URL
                                       |   Link event to HTTP
                                       |   → Follow webhook setup guide
                                       |
                                  YES ──┴── Webhook Receiving Data?
                                            |
                                       NO ──┴── Test webhook URL
                                            |   Check server logs
                                            |   Verify internet connection
                                            |   → Check webhook configuration
                                            |
                                       YES ──┴── Real-time Updates Working?
                                                 |
                                            NO ──┴── Check browser console
                                                 |   Verify Supabase connection
                                                 |   Look for ⚡ indicator
                                                 |   → Check real-time setup
                                                 |
                                            YES ──┴── SUCCESS! ✅
                                                      System fully operational
```

---

## 🚨 Common Error Codes & Solutions

### Network Errors

#### Error: "Connection Timeout"
```
Cause: Device not reachable on network
Solutions:
1. Check Ethernet cable connection
2. Verify device IP address
3. Test with ping command
4. Check router configuration
```

#### Error: "Network Unreachable"
```
Cause: Device on different network segment
Solutions:
1. Check IP address and subnet mask
2. Verify gateway configuration
3. Ensure device and computer on same network
4. Check VLAN settings if applicable
```

### Authentication Errors

#### Error: "401 Unauthorized"
```
Cause: Invalid username or password
Solutions:
1. Verify credentials (admin/12345 default)
2. Check device label for default password
3. Try different user account
4. Factory reset if password forgotten
```

#### Error: "403 Forbidden"
```
Cause: User lacks required permissions
Solutions:
1. Check user permission settings
2. Use admin account for configuration
3. Verify API user has all permissions
4. Re-create user account if needed
```

### Service Errors

#### Error: "404 Not Found" (ISAPI)
```
Cause: ISAPI service not enabled
Solutions:
1. Enable ISAPI in device settings
2. Verify ISAPI port (usually 80)
3. Restart device after enabling
4. Check firmware version compatibility
```

#### Error: "500 Internal Server Error"
```
Cause: Device internal error
Solutions:
1. Restart device (power cycle)
2. Check device logs
3. Update firmware if available
4. Factory reset as last resort
```

### Webhook Errors

#### Error: "Webhook Not Received"
```
Cause: HTTP notification not configured
Solutions:
1. Configure HTTP notification in device
2. Verify webhook URL is correct
3. Check event linkage configuration
4. Test webhook with manual trigger
```

#### Error: "Connection Refused"
```
Cause: Server not accessible from device
Solutions:
1. Verify server is running
2. Check firewall settings
3. Test webhook URL from device network
4. Ensure HTTPS certificate is valid
```

---

## 🔧 Step-by-Step Diagnostic Commands

### 1. Network Connectivity Test
```bash
# Test basic connectivity
ping 192.168.1.64

# Test port connectivity
telnet 192.168.1.64 80

# Test HTTP response
curl -i http://192.168.1.64/

# Expected: HTTP/1.1 200 OK or 401 Unauthorized
```

### 2. ISAPI Service Test
```bash
# Test device info endpoint
curl -u admin:12345 http://192.168.1.64/ISAPI/System/deviceInfo

# Test user count endpoint
curl -u admin:12345 http://192.168.1.64/ISAPI/AccessControl/UserInfo/Count

# Expected: XML response with device/user information
```

### 3. Webhook Test
```bash
# Test webhook endpoint
curl -X POST https://your-app.vercel.app/api/webhooks/hikvision \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'

# Expected: {"success": true, "message": "Webhook processed successfully"}
```

### 4. Real-time Test
```javascript
// Browser console test
fetch('/api/biometric/status')
  .then(r => r.json())
  .then(console.log)

// Expected: {success: true, connected: true, ...}
```

---

## 🛠️ Hardware Diagnostic Checklist

### Power System
- [ ] Power adapter connected securely
- [ ] Power LED indicator on (green/blue)
- [ ] Correct voltage (usually 12V DC)
- [ ] Power outlet working (test with other device)

### Network Connection
- [ ] Ethernet cable connected both ends
- [ ] Network LED activity (blinking/solid)
- [ ] Cable not damaged or bent sharply
- [ ] Router port working (test with other device)

### Physical Installation
- [ ] Device mounted securely
- [ ] No physical damage visible
- [ ] Scanner surface clean
- [ ] Adequate lighting (for face recognition)

---

## 📊 Performance Monitoring

### Key Metrics to Monitor
```
Network Response Time: < 100ms
Webhook Success Rate: > 95%
Real-time Update Delay: < 2 seconds
Device Uptime: > 99%
```

### Monitoring Commands
```bash
# Check response time
ping -c 10 192.168.1.64

# Monitor webhook logs
tail -f /var/log/webhook.log

# Check device status
curl -s http://192.168.1.64/ISAPI/System/status
```

---

## 🚑 Emergency Recovery Procedures

### Complete System Failure
1. **Power cycle device** (unplug 30 seconds)
2. **Factory reset** (hold reset button 15 seconds)
3. **Reconfigure from scratch** using setup guide
4. **Test each component** individually

### Network Issues
1. **Check physical connections** first
2. **Test with different cable** and port
3. **Verify network settings** on device
4. **Contact network administrator** if needed

### Software Issues
1. **Clear browser cache** and cookies
2. **Try different browser** or incognito mode
3. **Check server logs** for errors
4. **Restart application server** if needed

### Data Loss Prevention
1. **Export user data** before major changes
2. **Backup device configuration** regularly
3. **Document all settings** for quick recovery
4. **Test backup procedures** periodically

---

## 📞 When to Call for Help

### Hardware Issues
- Power LED never turns on
- Physical damage to device
- Repeated hardware failures
- Environmental issues (overheating, water damage)

### Network Issues
- Complex network topology
- VLAN or advanced routing needed
- Firewall configuration required
- Internet connectivity problems

### Software Issues
- Firmware corruption
- Database connectivity problems
- SSL certificate issues
- Advanced configuration needed

### Integration Issues
- Custom API development needed
- Third-party system integration
- Advanced reporting requirements
- Scalability planning

---

## ✅ Success Verification

After resolving any issues, verify these indicators:

### Hardware Level
- ✅ All LED indicators normal
- ✅ Device responds to ping
- ✅ Physical installation secure

### Software Level
- ✅ Web interface accessible
- ✅ ISAPI endpoints responding
- ✅ User authentication working

### Integration Level
- ✅ Webhook receiving data
- ✅ Real-time updates working
- ✅ Dashboard showing live data

### User Level
- ✅ Fingerprint enrollment works
- ✅ Attendance tracking accurate
- ✅ Reports generating correctly

**🎯 If all indicators are ✅, your system is fully operational!**