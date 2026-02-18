# ZKTeco K40 Device Setup Guide

Complete guide for setting up your ZKTeco K40 fingerprint device for attendance tracking.

## 📦 What You'll Need

- ZKTeco K40 fingerprint device
- Power adapter (included with device)
- Ethernet cable (for network connection)
- Network router with available port
- Computer for configuration
- This software installed

## 🔧 Physical Installation

### Step 1: Unbox and Inspect

1. Remove device from packaging
2. Check for any physical damage
3. Ensure all accessories are included:
   - Power adapter
   - Mounting bracket
   - Screws and anchors
   - User manual

### Step 2: Choose Installation Location

**Considerations:**
- Near entrance/exit for easy access
- Within reach (chest to shoulder height)
- Protected from direct sunlight
- Away from water/moisture
- Near power outlet
- Within network cable reach

**Recommended Height:** 120-150 cm (4-5 feet) from floor

### Step 3: Mount Device

**Option A: Wall Mount**
1. Mark mounting holes on wall
2. Drill holes and insert anchors
3. Attach mounting bracket
4. Secure device to bracket
5. Ensure device is level

**Option B: Desktop Stand**
1. Place device on stable surface
2. Ensure it won't be knocked over
3. Route cables safely

### Step 4: Connect Power

1. Plug power adapter into device
2. Connect to power outlet
3. Device should power on (LED lights up)
4. Wait for boot sequence (30-60 seconds)

### Step 5: Connect to Network

**Option A: Ethernet (Recommended)**
1. Connect Ethernet cable to device
2. Connect other end to router
3. Device will obtain IP via DHCP

**Option B: WiFi (if supported)**
1. Access device menu
2. Navigate to Network Settings
3. Select WiFi network
4. Enter password

## 🌐 Network Configuration

### Step 1: Find Device IP Address

**Method 1: Check Router**
1. Log into your router admin panel
2. Look for connected devices
3. Find "ZKTeco" or device MAC address
4. Note the IP address (e.g., 192.168.1.201)

**Method 2: Device Menu**
1. Press Menu button on device
2. Navigate to System → Network
3. View IP address on screen

**Method 3: ZKTeco Software**
1. Download "ZKAccess 3.5" from ZKTeco website
2. Run device discovery tool
3. Software will find device on network

### Step 2: Set Static IP (Recommended)

**Why:** Prevents IP from changing, ensures reliable connection

**Option A: Router DHCP Reservation**
1. Log into router admin panel
2. Find DHCP settings
3. Add reservation for device MAC address
4. Assign IP: `192.168.1.201`
5. Save and reboot router

**Option B: Device Static IP**
1. Access device menu
2. Navigate to Network Settings
3. Change from DHCP to Static
4. Set IP: `192.168.1.201`
5. Set Subnet: `255.255.255.0`
6. Set Gateway: `192.168.1.1` (your router IP)
7. Save settings

### Step 3: Test Network Connection

**From your computer:**
```bash
ping 192.168.1.201
```

Expected output:
```
Reply from 192.168.1.201: bytes=32 time<1ms TTL=64
Reply from 192.168.1.201: bytes=32 time<1ms TTL=64
```

✅ If you see replies, network is working!
❌ If timeout, check cables and IP address

## 👤 Device Configuration

### Step 1: Access Device Menu

1. Press **Menu** button on device
2. Default admin password: `0` or `1234`
3. If prompted, enter password

### Step 2: Set Date and Time

**Important:** Device time must be accurate for attendance logs!

1. Navigate to: **System → Date/Time**
2. Set current date
3. Set current time
4. Set timezone
5. Enable NTP sync (if available)
6. Save settings

### Step 3: Configure Communication

1. Navigate to: **Communication → Network**
2. Verify settings:
   - IP Address: `192.168.1.201`
   - Port: `4370` (default)
   - Protocol: TCP/IP
3. Save if changed

### Step 4: Set Device Password

**Important:** Change default password for security!

1. Navigate to: **System → Password**
2. Enter new password (remember this!)
3. Confirm password
4. Save settings

**Note:** You'll need this password in `.env` file

### Step 5: Configure Attendance Settings

1. Navigate to: **Attendance → Settings**
2. Enable attendance logging
3. Set log storage: Internal memory
4. Enable real-time mode (if available)
5. Save settings

## 👆 Enroll Users (Fingerprints)

### Method 1: Device Menu (Simple)

1. Press **Menu** on device
2. Navigate to: **User → New User**
3. Enter User ID (e.g., `1001`)
   - **CRITICAL:** This must match `member_id` in database!
4. Enter name (optional)
5. Select **Enroll Fingerprint**
6. Follow on-screen instructions:
   - Place finger on scanner
   - Lift and place again (3 times)
   - Device confirms enrollment
7. Save user

**Repeat for each member**

### Method 2: Software (Bulk Enrollment)

1. Download "ZKAccess 3.5" software
2. Connect to device
3. Import user list from CSV
4. Enroll fingerprints in batch
5. Upload to device

### Best Practices for Enrollment

**Finger Selection:**
- Use index or middle finger
- Choose finger without cuts/scars
- Avoid thumb (often dirty)

**Scanning Tips:**
- Clean finger before scanning
- Press firmly but not too hard
- Center finger on scanner
- Keep finger flat
- Don't move during scan

**Quality Check:**
- Scan should complete in 1-2 seconds
- Device should beep/confirm
- Test immediately after enrollment
- Re-enroll if recognition fails

## 🔗 Connect to Software

### Step 1: Install Listener Service

```bash
cd zkteco-listener
npm install
```

### Step 2: Configure Connection

Edit `zkteco-listener/.env`:

```env
DEVICE_IP=192.168.1.201
DEVICE_PORT=4370
DEVICE_PASSWORD=your_password_here
```

### Step 3: Test Connection

```bash
cd zkteco-listener
npm test
```

Expected output:
```
✅ Socket connection established
✅ Device information retrieved
✅ Found X enrolled user(s)
🎉 ALL TESTS PASSED!
```

### Step 4: Start Monitoring

```bash
npm start
```

## ✅ Verification Checklist

Before going live, verify:

### Physical Setup
- [ ] Device mounted securely
- [ ] Power connected and stable
- [ ] Network cable connected (or WiFi configured)
- [ ] Device boots successfully
- [ ] LED indicators working

### Network Setup
- [ ] Device has IP address
- [ ] IP is static or reserved
- [ ] Can ping device from computer
- [ ] Port 4370 is accessible
- [ ] No firewall blocking connection

### Device Configuration
- [ ] Date and time are correct
- [ ] Timezone is set properly
- [ ] Communication port is 4370
- [ ] Attendance logging is enabled
- [ ] Device password is set

### User Enrollment
- [ ] At least one test user enrolled
- [ ] User ID matches database `member_id`
- [ ] Fingerprint recognition works
- [ ] Test scan triggers attendance log

### Software Connection
- [ ] Listener service installed
- [ ] `.env` file configured
- [ ] Connection test passes
- [ ] Listener starts successfully
- [ ] Test scan creates database record

## 🔍 Testing Procedure

### Test 1: Device Functionality

1. Power on device
2. Wait for boot (30-60 seconds)
3. Check display shows ready state
4. Press finger on scanner
5. Device should beep/respond

### Test 2: Network Connectivity

```bash
ping 192.168.1.201
```

Should see replies without packet loss.

### Test 3: Software Connection

```bash
cd zkteco-listener
npm test
```

Should pass all tests.

### Test 4: End-to-End Attendance

1. Start listener: `npm start`
2. Scan enrolled fingerprint on device
3. Watch listener console for log
4. Check database for new record
5. Verify dashboard shows attendance

**Expected timeline:**
- Scan finger → Device beeps (instant)
- Listener detects log (10 seconds)
- Database record created (1 second)
- Dashboard updates (1 second)
- **Total: ~12 seconds**

## 🆘 Common Issues

### Device Won't Power On

**Symptoms:** No lights, no display

**Solutions:**
1. Check power adapter is plugged in
2. Try different power outlet
3. Check power adapter voltage
4. Inspect power cable for damage
5. Contact ZKTeco support if hardware issue

### Can't Find IP Address

**Symptoms:** Device not showing in router

**Solutions:**
1. Ensure Ethernet cable is connected
2. Check cable is not damaged
3. Try different network port on router
4. Restart device
5. Use ZKTeco discovery software

### Fingerprint Won't Enroll

**Symptoms:** Enrollment fails repeatedly

**Solutions:**
1. Clean scanner surface
2. Clean finger (wash and dry)
3. Try different finger
4. Press more firmly
5. Ensure finger is centered
6. Check device storage not full

### Device Not Responding

**Symptoms:** Can ping but can't connect

**Solutions:**
1. Verify port 4370 is correct
2. Check device password
3. Restart device
4. Check firewall settings
5. Try from different computer

### Attendance Not Saving

**Symptoms:** Scan works but no database record

**Solutions:**
1. Check listener is running
2. Verify user ID matches `member_id`
3. Check Supabase connection
4. Enable debug mode
5. Check database permissions

## 📊 Device Specifications

### ZKTeco K40

**Fingerprint Sensor:**
- Type: Optical sensor
- Resolution: 500 DPI
- Verification time: < 1 second
- False acceptance rate: < 0.001%
- False rejection rate: < 1%

**Capacity:**
- Fingerprint templates: 3,000
- Transaction logs: 100,000
- Users: 3,000

**Communication:**
- TCP/IP: Yes
- USB: Yes (optional)
- RS232/485: Optional
- Wiegand: Optional

**Power:**
- Input: DC 12V 3A
- Consumption: < 10W

**Environment:**
- Operating temp: 0°C to 45°C
- Storage temp: -20°C to 60°C
- Humidity: 20% to 80%

## 🔐 Security Best Practices

### Device Security

1. **Change default password** immediately
2. **Disable unused features** (USB, etc.)
3. **Keep firmware updated**
4. **Restrict physical access** to device
5. **Monitor access logs** regularly

### Network Security

1. **Use internal network only** (don't expose to internet)
2. **Enable firewall rules** (allow only necessary ports)
3. **Use VPN** for remote access
4. **Segment network** (separate IoT devices)
5. **Monitor network traffic**

### Data Security

1. **Encrypt database connections**
2. **Use strong passwords**
3. **Rotate credentials** periodically
4. **Backup data** regularly
5. **Audit access logs**

## 📞 Support Resources

### ZKTeco Resources

- **Website:** https://www.zkteco.com
- **Support:** support@zkteco.com
- **Downloads:** https://www.zkteco.com/en/download
- **Manual:** Included with device

### Software Resources

- **Listener README:** `zkteco-listener/README.md`
- **Software Setup:** `ZKTECO_SOFTWARE_SETUP_GUIDE.md`
- **Troubleshooting:** `zkteco-listener/TROUBLESHOOTING.md`

### Getting Help

1. Check device manual
2. Review troubleshooting section
3. Test connection: `npm test`
4. Enable debug mode
5. Contact ZKTeco support for hardware issues

## 🎉 You're Ready!

Once you've completed this guide:

✅ Device is physically installed
✅ Network connection is working
✅ Device is configured properly
✅ Users are enrolled with fingerprints
✅ Software can connect to device
✅ Test attendance is working

**Next step:** Follow the Software Setup Guide to complete integration!

---

**Need help?** Check the troubleshooting section or contact support.
