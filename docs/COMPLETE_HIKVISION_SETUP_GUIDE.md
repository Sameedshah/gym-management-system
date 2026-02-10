# Complete Hikvision Biometric Device Setup Guide

This is the **ultimate guide** for setting up your Hikvision biometric device from scratch - from unboxing to real-time attendance tracking.

## 📋 What You'll Need

### Hardware Requirements
- ✅ Hikvision biometric device (fingerprint/face scanner)
- ✅ Power adapter (usually 12V DC, included with device)
- ✅ Ethernet cable (Cat5e or Cat6)
- ✅ Network router/switch with available port
- ✅ Computer/laptop for configuration
- ✅ Screwdriver (for mounting, if needed)

### Network Requirements
- ✅ Router with DHCP enabled
- ✅ Internet connection
- ✅ Available IP address range (e.g., 192.168.1.x)

### Software Requirements
- ✅ Web browser (Chrome, Firefox, Safari)
- ✅ Your gym management system deployed online

---

## 🔧 Phase 1: Physical Installation & Network Connection

### Step 1: Unbox and Inspect Device
1. **Unpack the device** and check all components:
   - Biometric scanner unit
   - Power adapter (12V DC)
   - Mounting screws and brackets
   - Quick start guide
   - Warranty card

2. **Inspect for damage** - check for cracks, loose parts, or shipping damage

### Step 2: Choose Installation Location
1. **Near network connection**: Within reach of Ethernet cable
2. **Stable power source**: Close to power outlet
3. **User-friendly height**: 
   - Fingerprint scanners: 120-140cm from floor
   - Face scanners: 140-160cm from floor
4. **Protected from weather**: If installing outdoors, ensure weatherproof rating
5. **Good lighting**: Adequate lighting for face recognition (if applicable)

### Step 3: Physical Mounting (Optional)
1. **Mark mounting holes** using the device as a template
2. **Drill holes** appropriate for your wall type:
   - Drywall: Use wall anchors
   - Concrete: Use concrete screws
   - Metal: Use self-tapping screws
3. **Mount the device** securely using provided screws
4. **Test stability** - device should not wobble or move

### Step 4: Network Cable Connection
1. **Prepare Ethernet cable**:
   - Use Cat5e or Cat6 cable
   - Maximum length: 100 meters (328 feet)
   - Ensure cable is not damaged

2. **Connect cable**:
   - **Device end**: Plug into Ethernet port on device (usually RJ45)
   - **Router end**: Plug into available port on router/switch
   - **Check connection**: LED lights should appear on both ends

3. **Cable management**:
   - Secure cable to prevent damage
   - Use cable clips or conduit if needed
   - Avoid sharp bends or pinch points

### Step 5: Power Connection
1. **Connect power adapter**:
   - Plug DC connector into device power port
   - Plug AC adapter into wall outlet
   - **Check polarity** - ensure correct positive/negative connection

2. **Power on device**:
   - Look for power LED indicator (usually green or blue)
   - Device should boot up (30-60 seconds)
   - Listen for startup sounds or beeps

3. **Verify network connection**:
   - Network LED should be solid or blinking
   - If no network LED, check cable connections

---

## 🌐 Phase 2: Network Configuration & Device Discovery

### Step 1: Find Device IP Address

#### Method 1: Using Device Display (if available)
1. Navigate to **System** → **Network** on device screen
2. Note the IP address displayed
3. Write down: IP, Subnet Mask, Gateway

#### Method 2: Using SADP Tool (Recommended)
1. **Download SADP** from Hikvision website:
   ```
   https://www.hikvision.com/en/support/tools/hikvision-tools/
   ```
2. **Install and run SADP**
3. **Scan network** - SADP will automatically find devices
4. **Locate your device** in the list
5. **Note the IP address** and device status

#### Method 3: Router Admin Panel
1. **Access router admin** (usually http://192.168.1.1)
2. **Login** with admin credentials
3. **Check connected devices** or DHCP client list
4. **Look for Hikvision device** or device MAC address
5. **Note the assigned IP address**

#### Method 4: Network Scanner
1. **Download Advanced IP Scanner** (free tool)
2. **Set scan range** to your network (e.g., 192.168.1.1-254)
3. **Start scan**
4. **Look for Hikvision** in manufacturer column
5. **Note the IP address**

### Step 2: Test Network Connectivity
1. **Ping test** from your computer:
   ```bash
   ping 192.168.1.64
   ```
   (Replace with your device IP)

2. **Expected result**: Should get replies like:
   ```
   Reply from 192.168.1.64: bytes=32 time=1ms TTL=64
   ```

3. **If ping fails**:
   - Check cable connections
   - Verify device is powered on
   - Check if device and computer are on same network
   - Try different Ethernet cable

---

## 🔄 Phase 3: Factory Reset (If Needed)

### When to Reset Device
- Device not responding to network
- Forgotten admin password
- Previous configuration conflicts
- Device showing errors

### Hardware Reset Method
1. **Locate reset button** (usually small recessed button)
2. **Power on device** and wait for full boot
3. **Press and hold reset button** for 10-15 seconds
4. **Use paperclip or small tool** to press button
5. **Release button** when device restarts
6. **Wait for reboot** (1-2 minutes)

### Software Reset Method (if accessible)
1. **Access web interface** at device IP
2. **Login** with admin credentials
3. **Go to System** → **Maintenance** → **Default**
4. **Select "Restore to factory defaults"**
5. **Confirm reset** and wait for reboot

### After Reset
1. **Device returns to default settings**:
   - Default IP: Usually 192.168.1.64
   - Default username: admin
   - Default password: 12345 (or check device label)
2. **Scan network again** to find new IP
3. **Access web interface** with default credentials

---

## 🖥️ Phase 4: Web Interface Configuration

### Step 1: Access Device Web Interface
1. **Open web browser** (Chrome recommended)
2. **Navigate to device IP**: `http://192.168.1.64`
3. **Accept security warnings** (device uses self-signed certificate)

### Step 2: Initial Login
1. **Default credentials**:
   - Username: `admin`
   - Password: `12345` (or check device label)
2. **Login** to device interface
3. **Change default password** when prompted (required for security)

### Step 3: Basic Network Configuration
1. **Go to Configuration** → **Network** → **Basic Settings** → **TCP/IP**
2. **Set static IP** (recommended):
   ```
   IP Address: 192.168.1.64
   Subnet Mask: 255.255.255.0
   Gateway: 192.168.1.1
   DNS Server: 8.8.8.8
   ```
3. **Click Save** and wait for device to restart

### Step 4: Create API User Account
1. **Go to Configuration** → **System** → **User Management**
2. **Click Add** to create new user
3. **Configure user**:
   ```
   User Name: gymapi
   Password: [create strong password]
   Confirm Password: [repeat password]
   Level: Operator
   User Type: Normal
   ```
4. **Set permissions** (check all boxes):
   - ✅ Remote Control
   - ✅ Remote Parameters Settings
   - ✅ Remote Camera Control
   - ✅ Remote Serial Port Control
   - ✅ Remote Alarm Control
   - ✅ Remote Log Search
   - ✅ Remote User Management
5. **Click OK** to save user

### Step 5: Enable ISAPI Service
1. **Go to Configuration** → **Network** → **Advanced Settings** → **Integration Protocol**
2. **Enable ISAPI** checkbox
3. **Set ISAPI Port**: `80` (default)
4. **Click Save**

---

## 🔔 Phase 5: Real-Time Webhook Configuration

### Step 1: Enable Access Control Events
1. **Go to Configuration** → **Event** → **Basic Event** → **Access Control**
2. **Find "Card Reader Event"** or **"Access Control Event"**
3. **Enable the event** checkbox
4. **Set event conditions** (usually default is fine)
5. **Click Save**

### Step 2: Configure HTTP Notification
1. **Go to Configuration** → **Event** → **Basic Event** → **HTTP**
2. **Click Add** to create new HTTP notification
3. **Configure HTTP settings**:
   ```
   HTTP Name: GymAttendanceWebhook
   HTTP URL: https://your-app-domain.vercel.app/api/webhooks/hikvision
   HTTP Method: POST
   HTTP Version: HTTP/1.1
   Content Type: application/json
   ```

4. **Message Content** - Select **JSON** format:
   ```json
   {
     "eventType": "attendance",
     "employeeNo": "$<employeeNoString>",
     "time": "$<time>",
     "eventCode": "$<major>",
     "doorName": "$<doorName>",
     "deviceIP": "$<ipAddress>"
   }
   ```

5. **Click Save**

### Step 3: Link Event to HTTP Action
1. **Go back to Configuration** → **Event** → **Basic Event** → **Access Control**
2. **Select your access control event**
3. **In Linkage Action section**, check **"HTTP Notification"**
4. **Select "GymAttendanceWebhook"** from dropdown
5. **Click Save**

### Step 4: Test Webhook
1. **In HTTP notification settings**, click **"Test"** button
2. **Check your server logs** for webhook receipt
3. **Expected log**: `🔔 Hikvision webhook received`

---

## 👤 Phase 6: User Enrollment & Testing

### Step 1: Enroll Test User
1. **Go to Configuration** → **Person** → **Person Management**
2. **Click Add** to create new person
3. **Fill details**:
   ```
   Employee No: 1001
   Name: Test User
   Card No: [leave blank]
   ```
4. **Click Save**

### Step 2: Enroll Fingerprint
1. **Select the test user** from list
2. **Click "Fingerprint"** tab
3. **Click "Enroll"** button
4. **Follow device prompts** to scan finger multiple times
5. **Verify enrollment** successful

### Step 3: Test Real-Time Flow
1. **Open your gym dashboard** in browser
2. **Look for ⚡ lightning bolt** icon (indicates real-time active)
3. **Scan enrolled fingerprint** on device
4. **Watch dashboard** - attendance should appear **instantly**
5. **Check browser console** for real-time updates

---

## 🔍 Phase 7: Troubleshooting & Verification

### Network Connectivity Issues
```bash
# Test device ping
ping 192.168.1.64

# Test port connectivity
telnet 192.168.1.64 80

# Test HTTP response
curl http://192.168.1.64/ISAPI/System/deviceInfo
```

### Web Interface Issues
- **Can't access web interface**:
  - Verify IP address is correct
  - Try different browser
  - Clear browser cache
  - Check firewall settings

- **Login fails**:
  - Try default credentials (admin/12345)
  - Check device label for default password
  - Perform factory reset if needed

### Webhook Issues
- **Webhook not received**:
  - Verify webhook URL is correct and accessible
  - Check device can reach internet
  - Test webhook URL in browser
  - Check server logs for errors

- **Events not triggering**:
  - Verify access control events are enabled
  - Check event linkage configuration
  - Test with manual fingerprint scan
  - Check device event logs

### Real-Time Updates Not Working
- **Dashboard not updating**:
  - Check browser console for errors
  - Verify Supabase connection
  - Look for ⚡ lightning bolt icon
  - Test with browser refresh

---

## ✅ Final Verification Checklist

### Hardware Setup
- [ ] Device physically mounted securely
- [ ] Power connected and LED indicators on
- [ ] Ethernet cable connected properly
- [ ] Network LEDs showing activity

### Network Configuration
- [ ] Device has static IP address
- [ ] Can ping device from computer
- [ ] Web interface accessible
- [ ] ISAPI service enabled

### User Management
- [ ] API user account created (gymapi)
- [ ] User has proper permissions
- [ ] Can authenticate via ISAPI

### Webhook Configuration
- [ ] HTTP notification configured
- [ ] Webhook URL points to your server
- [ ] Event linkage properly set up
- [ ] Test webhook successful

### Real-Time Testing
- [ ] Test user enrolled with fingerprint
- [ ] Dashboard shows ⚡ real-time indicator
- [ ] Fingerprint scan appears instantly on dashboard
- [ ] No browser refresh needed for updates

### Gym System Integration
- [ ] Device settings saved in gym system
- [ ] Connection test successful
- [ ] Scanner status shows "Connected"
- [ ] Today's scan count updating

---

## 📞 Support & Maintenance

### Regular Maintenance
- **Weekly**: Check device connectivity and clean scanner surface
- **Monthly**: Verify webhook is receiving events
- **Quarterly**: Update device firmware if available
- **Annually**: Review and update user permissions

### Getting Help
1. **Check device logs** in web interface
2. **Review server logs** for webhook errors
3. **Test individual components** (network, power, software)
4. **Contact support** with specific error messages and device model

### Emergency Procedures
- **Device offline**: Check power and network connections
- **Webhook stopped**: Verify server is running and accessible
- **Mass enrollment needed**: Use bulk import features
- **System migration**: Export user data before changes

---

## 🎉 Congratulations!

You now have a **fully configured, enterprise-grade, real-time biometric attendance system**!

### What You've Achieved:
- ⚡ **Instant attendance updates** (no delays)
- 🏢 **Enterprise architecture** (same as major systems)
- 💰 **Cost-effective solution** (works on free hosting)
- 🔄 **Real-time dashboard** (updates like WhatsApp)
- 🛡️ **Secure configuration** (proper user management)
- 📊 **Professional setup** (ready for production use)

### Next Steps:
1. **Enroll all gym members** using the enrollment process
2. **Train staff** on the dashboard and features
3. **Monitor system** for first few days
4. **Scale up** by adding more devices if needed

**Your gym now has a modern, real-time attendance system that rivals enterprise solutions!** 🚀