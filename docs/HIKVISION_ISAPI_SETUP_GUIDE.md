# Hikvision ISAPI Setup Guide for Gym Management System

This guide will help you set up your Hikvision biometric device to work with the gym management system using ISAPI (Internet Server Application Programming Interface).

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Device Network Configuration](#device-network-configuration)
3. [ISAPI User Setup](#isapi-user-setup)
4. [Testing ISAPI Connection](#testing-isapi-connection)
5. [Gym System Configuration](#gym-system-configuration)
6. [Troubleshooting](#troubleshooting)
7. [Supported Devices](#supported-devices)

## Prerequisites

### Hardware Requirements
- Hikvision biometric device (fingerprint scanner/access control)
- Network connection (Ethernet cable)
- Computer/laptop for configuration
- Router/switch for network connectivity

### Software Requirements
- Web browser (Chrome, Firefox, Safari)
- Hikvision device configuration software (optional)
- Network scanner tool (optional)

## Device Network Configuration

### Step 1: Connect the Device
1. Connect your Hikvision device to your network using an Ethernet cable
2. Power on the device and wait for it to boot up (usually 30-60 seconds)
3. The device should obtain an IP address automatically via DHCP

### Step 2: Find the Device IP Address

#### Method 1: Using Device Display (if available)
1. Navigate to **Network Settings** on the device display
2. Note down the IP address shown

#### Method 2: Using SADP Tool
1. Download Hikvision SADP (Search Active Device Protocol) tool
2. Run SADP and it will automatically discover Hikvision devices on your network
3. Note the IP address of your device

#### Method 3: Using Network Scanner
1. Use a network scanner tool like Advanced IP Scanner
2. Scan your network range (e.g., 192.168.1.1-254)
3. Look for devices with "Hikvision" in the manufacturer field

#### Method 4: Check Router Admin Panel
1. Log into your router's admin panel
2. Check the connected devices list
3. Look for a device with "Hikvision" or similar name

### Step 3: Access Device Web Interface
1. Open a web browser
2. Navigate to `http://[DEVICE_IP_ADDRESS]`
3. You should see the Hikvision login page

## ISAPI User Setup

### Step 1: Initial Device Login
1. Use default credentials:
   - **Username**: `admin`
   - **Password**: Check device label or use `12345`
2. You'll be prompted to change the password on first login

### Step 2: Create ISAPI User Account
1. After logging in, go to **Configuration** → **System** → **User Management**
2. Click **Add** to create a new user
3. Configure the user with these settings:
   - **User Name**: `gymapi` (or your preferred name)
   - **Password**: Create a strong password
   - **Confirm Password**: Repeat the password
   - **Level**: Select **Operator** or **User**
   - **User Type**: **Normal**

### Step 3: Set User Permissions
Ensure the ISAPI user has these permissions:
- ✅ **Remote Control**: For device control
- ✅ **Remote Parameters Settings**: For configuration
- ✅ **Remote Camera Control**: If applicable
- ✅ **Remote Serial Port Control**: For communication
- ✅ **Remote Alarm Control**: For events
- ✅ **Remote Log Search**: For attendance logs
- ✅ **Remote User Management**: For fingerprint enrollment

### Step 4: Enable ISAPI Service
1. Go to **Configuration** → **Network** → **Advanced Settings** → **Integration Protocol**
2. Enable **ISAPI**
3. Set **ISAPI Port** to `80` (default) or your preferred port
4. Click **Save**

### Step 5: Configure Network Settings
1. Go to **Configuration** → **Network** → **Basic Settings** → **TCP/IP**
2. Set a static IP address (recommended):
   - **IP Address**: `192.168.1.64` (or your preferred IP)
   - **Subnet Mask**: `255.255.255.0`
   - **Gateway**: Your router's IP (e.g., `192.168.1.1`)
   - **DNS Server**: `8.8.8.8` or your router's IP
3. Click **Save**

## Testing ISAPI Connection

### Step 1: Test Basic Connectivity
Open a web browser and navigate to:
```
http://[DEVICE_IP]/ISAPI/System/deviceInfo
```

You should see XML response with device information.

### Step 2: Test Authentication
Use a tool like Postman or curl to test authentication:

```bash
curl -u gymapi:yourpassword http://192.168.1.64/ISAPI/System/deviceInfo
```

### Step 3: Test User List API
```bash
curl -u gymapi:yourpassword http://192.168.1.64/ISAPI/AccessControl/UserInfo/Count
```

This should return the number of enrolled users.

### Step 4: Test Attendance Log API
```bash
curl -u gymapi:yourpassword "http://192.168.1.64/ISAPI/AccessControl/AcsEvent?format=json&startTime=2024-01-01T00:00:00&endTime=2024-12-31T23:59:59"
```

## Gym System Configuration

### Step 1: Access Gym System Settings
1. Log into your gym management system
2. Navigate to **Settings** → **Biometric Scanner Settings**

### Step 2: Configure Device Connection
Fill in the following details:
- **Enable Biometric System**: ✅ Turn ON
- **Device IP Address**: `192.168.1.64` (your device IP)
- **Port**: `80` (or your configured port)
- **Username**: `gymapi` (the ISAPI user you created)
- **Password**: The password for the ISAPI user

### Step 3: Test Connection
1. Click **Test Connection** button
2. You should see "Device connection successful!" message
3. The system will display device information and enrolled user count

### Step 4: Configure Sync Settings
- **Auto Sync Attendance**: ✅ Enable for automatic sync
- **Sync Interval**: Set to `5` minutes (or your preference)

### Step 5: Save Settings
Click **Save Settings** to store the configuration.

## Troubleshooting

### Common Issues and Solutions

#### 1. Cannot Access Device Web Interface
**Problem**: Browser shows "This site can't be reached"
**Solutions**:
- Verify device IP address
- Check network cable connection
- Ensure device and computer are on same network
- Try different web browser
- Disable firewall temporarily

#### 2. Authentication Failed
**Problem**: "401 Unauthorized" error
**Solutions**:
- Verify username and password
- Check if user account is enabled
- Ensure user has proper permissions
- Try default credentials (admin/12345)

#### 3. ISAPI Service Not Available
**Problem**: "404 Not Found" for ISAPI URLs
**Solutions**:
- Enable ISAPI service in device settings
- Check if ISAPI port is correct
- Restart the device
- Update device firmware

#### 4. Connection Timeout
**Problem**: Requests timeout or take too long
**Solutions**:
- Check network connectivity
- Verify device is powered on
- Reduce sync interval
- Check for network congestion

#### 5. No Attendance Data
**Problem**: Sync shows 0 records
**Solutions**:
- Verify users are enrolled with fingerprints
- Check attendance log date range
- Ensure users are actually using the device
- Verify device clock is correct

### Network Troubleshooting Commands

#### Ping Test
```bash
ping 192.168.1.64
```

#### Port Test
```bash
telnet 192.168.1.64 80
```

#### Network Scan
```bash
nmap -p 80 192.168.1.64
```

## Supported Devices

### Tested Hikvision Models
- DS-K1T321MX (Face Recognition Terminal)
- DS-K1T804MF (Fingerprint Terminal)
- DS-K1T671M (Card Reader Terminal)
- DS-K1A8503MF (Fingerprint Access Controller)
- DS-K2604 (Network Access Controller)

### Firmware Requirements
- Minimum firmware version: V4.0.0
- Recommended: Latest available firmware
- ISAPI version: 2.0 or higher

## API Endpoints Used

The gym system uses these ISAPI endpoints:

### Device Information
```
GET /ISAPI/System/deviceInfo
```

### User Count
```
GET /ISAPI/AccessControl/UserInfo/Count
```

### User List
```
GET /ISAPI/AccessControl/UserInfo/Search
```

### Attendance Events
```
GET /ISAPI/AccessControl/AcsEvent
```

### Add User
```
POST /ISAPI/AccessControl/UserInfo/Record
```

### Delete User
```
DELETE /ISAPI/AccessControl/UserInfo/Delete
```

## Security Considerations

### Network Security
- Use strong passwords for ISAPI user
- Consider using HTTPS if supported
- Restrict network access to device
- Regular firmware updates

### User Management
- Create dedicated ISAPI user (don't use admin)
- Limit user permissions to minimum required
- Regular password changes
- Monitor access logs

## Support and Maintenance

### Regular Maintenance
- Check device connectivity weekly
- Monitor sync logs for errors
- Update firmware quarterly
- Backup device configuration

### Getting Help
- Check device manual for specific model
- Contact Hikvision technical support
- Review gym system logs for errors
- Test with Postman/curl for API issues

---

## Quick Setup Checklist

- [ ] Device connected to network and powered on
- [ ] Device IP address identified
- [ ] Web interface accessible
- [ ] ISAPI user created with proper permissions
- [ ] ISAPI service enabled
- [ ] Static IP configured (recommended)
- [ ] Connection tested with curl/Postman
- [ ] Gym system configured with device details
- [ ] Test connection successful in gym system
- [ ] Auto sync enabled and working
- [ ] Users enrolled and tested

---

**Need Help?** If you encounter issues not covered in this guide, please check the device manual or contact technical support with your specific device model and firmware version.