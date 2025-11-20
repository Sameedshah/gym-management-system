# Biometric Integration Setup Guide

## Production Setup Checklist

### 1. Database Setup
Run the biometric integration SQL script:

```sql
-- Execute this in your Supabase SQL Editor
-- File: scripts/004_biometric_integration.sql
```

This will:
- Add biometric fields to members table
- Create system_settings table
- Add entry_method to checkins table
- Set up proper indexes and RLS policies

### 2. Environment Variables
Add these to your `.env.local` file:

```env
# Optional: For production cron job security
CRON_SECRET=your-secret-key-here

# Base URL for cron jobs (auto-detected in most cases)
NEXTAUTH_URL=https://your-domain.com
```

### 3. Hardware Setup

#### Hikvision Device Configuration
1. **Connect Device to Network**
   - Connect via Ethernet cable
   - Power on the device
   - Note the IP address (usually shown on device screen)

2. **Access Device Web Interface**
   ```
   URL: http://192.168.1.64 (or your device IP)
   Default Username: admin
   Default Password: 12345
   ```

3. **Enable ISAPI Service**
   - Go to Configuration → Network → Advanced Settings
   - Enable "ISAPI Service"
   - Set ISAPI Port: 80 (default)
   - Save settings

4. **Create API User Account**
   - Go to Configuration → User Management
   - Add new user:
     - Username: `gymapi`
     - Password: `GymAPI@2025` (use strong password)
     - User Level: Operator
     - Permissions: Access Control Management
   - Save user

5. **Network Settings**
   - Ensure device is on same network as your server
   - Configure static IP if needed
   - Test connectivity with ping

### 4. Application Configuration

#### Access Settings Page
1. Navigate to `/settings` in your gym management system
2. Scroll to "Biometric Scanner Settings" section

#### Configure Device Connection
1. **Enable Biometric System**: Toggle ON
2. **Device Configuration**:
   - Device IP Address: `192.168.1.64` (your device IP)
   - Port: `80`
   - Username: `gymapi`
   - Password: `GymAPI@2025`

3. **Test Connection**: Click "Test Connection" button
   - Should show "Connected" status
   - Display device information
   - Show enrolled user count

4. **Sync Settings**:
   - Auto Sync Attendance: Enable
   - Sync Interval: 5 minutes (recommended)

5. **Save Settings**: Click "Save Settings"

### 5. Member Enrollment

#### Enroll Member Fingerprints
1. Go to Members page
2. Find the member you want to enroll
3. Click the three-dot menu (⋯) next to member
4. Click "Enroll Fingerprint"
5. Follow the enrollment dialog:
   - Click "Start Enrollment"
   - Guide member to place finger on scanner
   - Follow device prompts (usually 3-4 scans)
   - Confirm enrollment success

#### Verify Enrollment
- Member status should show "Enrolled" badge
- Device user count should increase
- Test attendance scanning

### 6. Testing the System

#### Test Attendance Scanning
1. Have enrolled member scan fingerprint on device
2. Check dashboard for new check-in notification
3. Verify check-in appears in recent activity
4. Confirm entry method shows "biometric"

#### Manual Sync Test
1. Go to Settings → Biometric Scanner Settings
2. Click "Sync Now" button
3. Should show number of records synced
4. Check dashboard for updated attendance

#### Automated Sync Verification
- Wait 5 minutes (or your configured interval)
- Check "Last Sync" time in settings
- Verify new attendance records appear automatically

### 7. Production Deployment

#### Vercel Deployment (Recommended)
The system includes automatic cron job setup for Vercel:

```json
// vercel.json (already included)
{
  "crons": [
    {
      "path": "/api/cron/sync-attendance",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

#### Other Deployment Platforms
For other platforms, set up a cron job to call:
```bash
curl -X GET https://your-domain.com/api/cron/sync-attendance
```

### 8. Monitoring and Maintenance

#### Health Checks
- Monitor device connection status in settings
- Check sync success rates
- Review error logs for failed enrollments

#### Regular Maintenance
- Clean scanner surface weekly
- Update device firmware quarterly
- Backup device user database monthly
- Review and rotate API credentials annually

#### Troubleshooting Common Issues

**Device Not Connecting**
- Verify IP address and network connectivity
- Check username/password credentials
- Ensure ISAPI service is enabled
- Restart device if necessary

**Enrollment Failures**
- Clean scanner surface
- Ensure good finger placement
- Try different finger if needed
- Check device storage capacity

**Sync Issues**
- Verify device time synchronization
- Check network connectivity
- Review error logs in browser console
- Test manual sync first

**Performance Issues**
- Monitor device storage usage
- Clean old attendance records if needed
- Optimize sync interval based on usage
- Consider multiple devices for large gyms

### 9. Security Considerations

#### Network Security
- Use VPN for remote device access
- Implement firewall rules
- Regular firmware updates
- Monitor device access logs

#### Data Protection
- Encrypt biometric data transmission
- Secure API endpoints with authentication
- Regular database backups
- Comply with biometric data regulations

#### Access Control
- Use strong passwords for device access
- Limit API user permissions
- Regular credential rotation
- Monitor unauthorized access attempts

### 10. Scaling for Multiple Locations

#### Multi-Device Setup
- Configure each device with unique IP
- Use device-specific API users
- Implement device grouping in settings
- Monitor all devices from central dashboard

#### Load Balancing
- Distribute enrollment across devices
- Implement failover mechanisms
- Monitor device performance
- Plan for peak usage times

## Support and Troubleshooting

### Getting Help
1. Check device status in settings page
2. Review browser console for errors
3. Test connection manually
4. Check network connectivity
5. Verify device configuration

### Common Error Messages

**"Device not connected"**
- Check IP address and network
- Verify credentials
- Ensure ISAPI service enabled

**"Enrollment failed"**
- Clean scanner surface
- Check device storage
- Try different finger placement

**"Sync failed"**
- Verify device connectivity
- Check time synchronization
- Review error logs

### Performance Optimization

**For High-Traffic Gyms**
- Increase sync frequency during peak hours
- Use multiple scanner devices
- Implement device load balancing
- Monitor response times

**For Multiple Locations**
- Configure per-location device groups
- Implement centralized monitoring
- Use location-specific sync schedules
- Plan for network latency

This biometric integration provides seamless fingerprint-based attendance tracking for your gym management system. The system is production-ready with proper error handling, security measures, and automated synchronization.