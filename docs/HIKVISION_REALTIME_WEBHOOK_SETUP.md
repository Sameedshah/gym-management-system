# Hikvision Real-Time Webhook Setup Guide

This guide shows you how to configure your Hikvision biometric device to send **real-time push notifications** to your gym management system instead of using inefficient polling/cron jobs.

## 🚀 Why Real-Time Push is Better

### ❌ Old Approach (Cron/Polling)
- Runs every 5 minutes (limited on Vercel Hobby)
- Wastes server resources
- Delayed attendance updates
- Can miss events between polls

### ✅ New Approach (Real-Time Push)
- **Instant** attendance updates
- Zero server resource waste
- Never miss any events
- Works on all hosting plans
- Enterprise-grade architecture

## Architecture Overview

```
Fingerprint Device → HTTP Push → Your Server → Database → Real-time UI Updates
     (Instant)        (Webhook)     (Process)    (Store)     (Live Updates)
```

## Step 1: Configure Hikvision Device for HTTP Notifications

### Access Device Web Interface
1. Open browser and go to `http://[DEVICE_IP]`
2. Login with your admin credentials

### Enable HTTP Notification
1. Go to **Configuration** → **Event** → **Basic Event** → **Access Control**
2. Find **Card Reader Event** or **Access Control Event**
3. Enable the event type you want to monitor
4. Click **Save**

### Configure HTTP Action
1. Go to **Configuration** → **Event** → **Basic Event** → **HTTP**
2. Click **Add** to create a new HTTP notification
3. Configure the following:

#### HTTP Notification Settings
```
HTTP Name: GymAttendanceWebhook
HTTP URL: https://your-app-domain.vercel.app/api/webhooks/hikvision
HTTP Method: POST
HTTP Version: HTTP/1.1
Content Type: application/json
```

#### Authentication (if needed)
```
Username: [leave blank or set custom]
Password: [leave blank or set custom]
```

#### Message Content
Select **JSON** format and use this template:
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

### Link Event to HTTP Action
1. Go back to **Configuration** → **Event** → **Basic Event** → **Access Control**
2. Select your access control event
3. In **Linkage Action**, check **HTTP Notification**
4. Select your **GymAttendanceWebhook** from the dropdown
5. Click **Save**

## Step 2: Test the Webhook

### Test from Device Interface
1. In the HTTP notification settings, click **Test**
2. Check your server logs to see if the webhook was received

### Test with Real Fingerprint Scan
1. Have someone scan their fingerprint on the device
2. Check your gym management dashboard
3. The attendance should appear **instantly** without any delay

## Step 3: Verify Real-Time Updates

### Check Dashboard
- Go to your gym dashboard
- Look for the ⚡ (lightning bolt) icon next to "Scanner Status"
- This indicates real-time updates are active

### Test Real-Time Flow
1. Open dashboard in browser
2. Scan fingerprint on device
3. Watch attendance appear instantly on dashboard
4. No refresh needed - it updates live!

## Advanced Configuration

### Multiple Devices
For multiple scanners, repeat the HTTP notification setup on each device:
```
Device 1: Main Entrance Scanner
Device 2: Gym Floor Scanner  
Device 3: Locker Room Scanner
```

All will send to the same webhook endpoint.

### Custom Event Filtering
You can configure different events:
- **Card Reader Event**: For card-based access
- **Face Recognition Event**: For face scanners
- **Fingerprint Event**: For fingerprint scanners
- **Door Event**: For door open/close

### Webhook Security
Add authentication to your webhook:
1. Set username/password in device HTTP settings
2. Verify credentials in your webhook handler
3. Use HTTPS for encrypted communication

## Troubleshooting

### Webhook Not Received
1. **Check URL**: Ensure webhook URL is correct and accessible
2. **Check Firewall**: Device must be able to reach your server
3. **Check Device Logs**: Look for HTTP notification errors
4. **Test Connectivity**: Try accessing your webhook URL from device network

### Events Not Triggering
1. **Verify Event Configuration**: Ensure access control events are enabled
2. **Check Linkage**: Verify HTTP notification is linked to the event
3. **Test Event**: Manually trigger event to test

### Real-Time Updates Not Working
1. **Check Supabase Connection**: Verify database connection
2. **Check Browser Console**: Look for WebSocket connection errors
3. **Verify Permissions**: Ensure Supabase RLS policies allow real-time subscriptions

## Webhook Payload Examples

### Successful Fingerprint Scan
```json
{
  "eventType": "attendance",
  "employeeNo": "1001",
  "time": "2024-01-26T10:30:00Z",
  "eventCode": "1",
  "doorName": "Main Entrance",
  "deviceIP": "192.168.1.64"
}
```

### Failed Access Attempt
```json
{
  "eventType": "attendance",
  "employeeNo": "unknown",
  "time": "2024-01-26T10:30:00Z",
  "eventCode": "0",
  "doorName": "Main Entrance",
  "deviceIP": "192.168.1.64"
}
```

## Monitoring and Logs

### Server-Side Monitoring
Your webhook endpoint logs all events:
```
🔔 Hikvision webhook received
✅ Check-in recorded for John Doe
📊 Real-time update sent to dashboard
```

### Device-Side Monitoring
Check device logs for HTTP notification status:
- **Success**: HTTP 200 response
- **Failed**: Connection timeout or error response

## Benefits of This Setup

### For Users
- ⚡ **Instant Updates**: See attendance immediately
- 🔄 **No Refresh Needed**: Dashboard updates automatically
- 📱 **Mobile Friendly**: Works on all devices
- 🔔 **Real-Time Notifications**: Optional browser notifications

### For Administrators
- 💰 **Cost Effective**: Works on free hosting plans
- 🚀 **Scalable**: Handles unlimited devices and users
- 🔧 **Reliable**: No missed events or polling failures
- 📊 **Enterprise Grade**: Same architecture used by major systems

### For Developers
- 🏗️ **Modern Architecture**: Event-driven, not polling-based
- 🔌 **Easy Integration**: Standard HTTP webhooks
- 🛠️ **Maintainable**: Less complex than cron jobs
- 📈 **Performance**: Minimal server resource usage

---

## Quick Setup Checklist

- [ ] Device HTTP notification configured
- [ ] Webhook URL set to your server endpoint
- [ ] Event linkage configured
- [ ] Test webhook received successfully
- [ ] Real-time dashboard updates working
- [ ] ⚡ Lightning bolt icon visible on dashboard
- [ ] Fingerprint scan appears instantly

**🎉 Congratulations!** You now have a real-time, enterprise-grade attendance system that updates instantly without any polling or cron jobs!