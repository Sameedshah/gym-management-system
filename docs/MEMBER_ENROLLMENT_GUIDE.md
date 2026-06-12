# Complete Member Enrollment & Check-in Guide
## ZKTeco K40 - Step by Step

**Last Updated:** February 18, 2026

---

## Overview

To get attendance tracking working, you need to:
1. Register member in dashboard (get member_id)
2. Enroll fingerprint on K40 device (use same member_id)
3. Start listener service
4. Member scans finger → Attendance appears!

---

## Part 1: Register Member in Dashboard

### Step 1: Go to Members Page

1. Open your dashboard: `http://localhost:3000` (or your domain)
2. Click "Members" in the sidebar
3. Click "Add Member" button (top right)

### Step 2: Fill Member Details

```
Name: John Doe
Email: john@example.com (optional)
Phone: +1234567890 (optional)
Member ID: 1001 ⚠️ IMPORTANT!
Membership Type: Standard
Join Date: Today's date
Status: Active
```

**⚠️ IMPORTANT: Skip Fingerprint Enrollment in Dashboard!**

If your dashboard has a "Enroll Fingerprint" or "Biometric Enrollment" section:
- **SKIP IT!** ❌ Don't use it
- This is for different device types
- ZKTeco K40 fingerprints are enrolled directly on the device
- Just fill in the basic member information above

### Step 3: Important - Member ID

**⚠️ CRITICAL:** The `member_id` field MUST match the "User ID" you'll use on the K40 device.

**Example:**
- Dashboard member_id: `1001`
- K40 Device User ID: `1001`
- ✅ These MUST be identical!

**Tips:**
- Use simple numbers: 1001, 1002, 1003, etc.
- Don't use special characters
- Keep it short (max 8 digits)
- Write it down - you'll need it for the device!

### Step 4: Save Member

1. Click "Save" or "Add Member"
2. Member appears in the members list
3. Note down the member_id (e.g., 1001)

**What You Just Did:**
- ✅ Created member record in database
- ✅ Assigned member_id: 1001
- ❌ Did NOT enroll fingerprint (that's next step on device)

---

## Part 2: Enroll Fingerprint on K40 Device

### Method A: Using Device Menu (Recommended)

#### Step 1: Access Device Menu

1. Go to the K40 device
2. Press the "MENU" button (or touch screen menu icon)
3. Enter admin password if prompted (default: 0)

#### Step 2: Navigate to User Management

```
Menu → User Management → New User
```

Or:
```
Menu → User → Enroll User
```

(Menu structure may vary by firmware version)

#### Step 3: Enter User ID

```
User ID: 1001
```

**⚠️ IMPORTANT:** This MUST match the member_id from dashboard!

#### Step 4: Enroll Fingerprint

1. Device will prompt: "Place finger"
2. Place member's finger on the scanner
3. Device beeps and shows: "Place finger again"
4. Place the SAME finger again
5. Device beeps and shows: "Place finger again" (3rd time)
6. Place the SAME finger one more time
7. Device shows: "Success!" or "Enrolled"

**Tips:**
- Use index finger (most common)
- Press firmly but not too hard
- Keep finger flat on scanner
- Don't move finger during scan
- If it fails, try again

#### Step 5: Confirm and Save

1. Device may ask for name (optional)
2. Press "OK" or "Save"
3. User is now enrolled!

### Method B: Using ZKTeco Software (Alternative)

If you have ZKAccess or ZKBio software installed:

1. Open ZKAccess/ZKBio software
2. Connect to device (IP: 192.168.1.201)
3. Go to "User Management"
4. Click "Add User"
5. Enter User ID: 1001
6. Click "Enroll Fingerprint"
7. Follow on-screen instructions
8. Upload to device

---

## Part 3: Start Listener Service

### Step 1: Open Terminal/Command Prompt

```bash
# Navigate to project folder
cd D:\gym-management-dashboard

# Go to listener folder
cd biometric-listener
```

### Step 2: Install Dependencies (First Time Only)

```bash
npm install
```

Wait for installation to complete.

### Step 3: Configure Environment

Make sure your `.env` file has correct settings:

```env
DEVICE_IP=192.168.1.201
DEVICE_PORT=4370
DEVICE_PASSWORD=0
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
POLL_INTERVAL=3
```

### Step 4: Start Listener

```bash
npm start
```

You should see:
```
[INFO] ZKTeco K40 Biometric Attendance Listener
[INFO] Device: 192.168.1.201:4370
[INFO] Poll Interval: 3 seconds
[SUCCESS] ✅ Connected to ZKTeco K40 device
[INFO] Device Model: K40
[SUCCESS] 🚀 Listener is running! Press Ctrl+C to stop.
```

**Keep this terminal window open!** The listener must run continuously.

---

## Part 4: Test Check-in

### Step 1: Member Scans Finger

1. Go to the K40 device
2. Member places enrolled finger on scanner
3. Device beeps and shows: "Verified" or "Success"
4. Device may show member name/ID

### Step 2: Check Listener Logs

In the terminal, you should see (within 3-5 seconds):

```
[INFO] Found 1 attendance log(s)
[DEBUG] Processing log: User ID 1001 at 2024-02-18T14:30:00
[SUCCESS] ✅ Attendance saved for John Doe at 2:30:00 PM
```

### Step 3: Check Dashboard

1. Go to dashboard: `http://localhost:3000/dashboard`
2. Look at "Recent Check-ins" section
3. You should see:
   ```
   ✅ John Doe checked in at 2:30 PM
   👆 Biometric
   ID: 1001
   ```

**⚡ Real-time:** Dashboard updates automatically (no refresh needed!)

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    MEMBER ENROLLMENT FLOW                    │
└─────────────────────────────────────────────────────────────┘

Step 1: Dashboard Registration
┌──────────────────────┐
│   Dashboard          │
│   Add Member         │
│   member_id: 1001    │  ← Write this down!
│   Name: John Doe     │
└──────────┬───────────┘
           │
           ▼
Step 2: Device Enrollment
┌──────────────────────┐
│   K40 Device         │
│   Menu → User        │
│   User ID: 1001      │  ← Must match!
│   Scan finger 3x     │
└──────────┬───────────┘
           │
           ▼
Step 3: Start Listener
┌──────────────────────┐
│   Terminal           │
│   cd biometric-      │
│     listener         │
│   npm start          │
└──────────┬───────────┘
           │
           ▼
Step 4: Check-in
┌──────────────────────┐
│   Member scans       │
│   finger on K40      │
└──────────┬───────────┘
           │
           ▼ (3-5 seconds)
┌──────────────────────┐
│   Dashboard shows    │
│   ✅ John Doe        │
│   checked in!        │
└──────────────────────┘
```

---

## Troubleshooting

### Problem 1: Member Not Found

**Symptom:**
```
[ERROR] ⚠️ Member not found for device user ID: 1001
```

**Solution:**
1. Check member exists in dashboard
2. Verify member_id in database matches device user ID
3. member_id must be exact match (case-sensitive)
4. Check spelling and numbers

**How to Fix:**
```sql
-- Check in Supabase SQL Editor
SELECT id, name, member_id FROM members WHERE member_id = '1001';
```

If not found, update member:
1. Go to Members page
2. Click Edit on member
3. Set member_id to 1001
4. Save

### Problem 2: Fingerprint Won't Enroll

**Symptom:** Device keeps saying "Try again" or "Failed"

**Solutions:**
1. Clean the scanner surface
2. Clean member's finger (dry it)
3. Press finger firmly but not too hard
4. Keep finger flat and still
5. Try different finger
6. Check device has space (max 3,000 fingerprints)

### Problem 3: Device Says "Duplicate ID"

**Symptom:** "User ID already exists"

**Solutions:**
1. User ID 1001 is already enrolled
2. Either:
   - Use different ID (1002, 1003, etc.)
   - Delete existing user from device
   - Update dashboard member_id to match existing device user

### Problem 4: Listener Not Connecting

**Symptom:**
```
[ERROR] Failed to connect: connect ETIMEDOUT
```

**Solutions:**
1. Check device is powered on
2. Verify IP address: `ping 192.168.1.201`
3. Check device and PC on same network
4. Verify port 4370 is accessible
5. Check firewall settings
6. Try device IP in browser: `http://192.168.1.201`

### Problem 5: Check-in Not Appearing

**Symptom:** Finger scans successfully but no dashboard update

**Checklist:**
1. ✅ Listener service is running?
2. ✅ Listener shows "Connected to device"?
3. ✅ Member_id matches device user ID?
4. ✅ Member exists in database?
5. ✅ Dashboard is open and showing real-time indicator (⚡)?
6. ✅ Check listener logs for errors?

---

## Multiple Members

### Enrolling Multiple Members

Repeat the process for each member:

| Dashboard | Device | Status |
|-----------|--------|--------|
| member_id: 1001, Name: John Doe | User ID: 1001 | ✅ Enrolled |
| member_id: 1002, Name: Jane Smith | User ID: 1002 | ✅ Enrolled |
| member_id: 1003, Name: Bob Wilson | User ID: 1003 | ✅ Enrolled |

**Tips:**
- Keep a spreadsheet of member_id assignments
- Use sequential numbers (easier to manage)
- Test each enrollment before moving to next
- Keep member_id and device user ID in sync

---

## Best Practices

### 1. Member ID Strategy

**Good:**
```
1001, 1002, 1003, 1004... (sequential)
```

**Bad:**
```
ABC123, john-doe, random-uuid (complex)
```

### 2. Fingerprint Tips

- Enroll index finger (most used)
- Consider enrolling 2 fingers per person (backup)
- Clean scanner weekly
- Re-enroll if recognition fails frequently

### 3. Testing

After enrolling each member:
1. Test fingerprint scan immediately
2. Verify check-in appears in dashboard
3. Check listener logs for any errors
4. Document any issues

### 4. Backup

Keep a record of:
- Member name → member_id mapping
- Which finger was enrolled
- Enrollment date
- Any special notes

---

## Quick Reference Card

### For Gym Staff

**Adding New Member:**

1. Dashboard: Add member with member_id (e.g., 1001)
2. Device: Menu → User → New User → ID: 1001
3. Scan finger 3 times
4. Test: Member scans finger
5. Verify: Check dashboard for check-in

**If Check-in Doesn't Appear:**

1. Check listener is running (terminal window)
2. Verify member_id matches device user ID
3. Check listener logs for errors
4. Try scanning again

**Emergency:**

- Restart listener: Ctrl+C, then `npm start`
- Check device connection: `ping 192.168.1.201`
- Manual check-in: Use dashboard "Add Check-in" button

---

## Video Tutorial (Recommended)

For visual learners, search YouTube for:
- "ZKTeco K40 fingerprint enrollment"
- "ZKTeco user registration tutorial"
- "How to enroll fingerprint ZKTeco"

---

## Support

If you're still having issues:

1. Check listener logs for specific errors
2. Verify all configuration in `.env` file
3. Test device connection: `npm run test`
4. Check Supabase database for member records
5. Review audit reports in `audit-docs/` folder

---

## Summary Checklist

Before first check-in, verify:

- [ ] Member registered in dashboard with member_id
- [ ] Fingerprint enrolled on K40 with matching User ID
- [ ] Listener service running (`npm start`)
- [ ] Listener shows "Connected to device"
- [ ] Dashboard open and showing ⚡ real-time indicator
- [ ] Member_id in dashboard = User ID on device

**If all checked, member can scan and check-in will appear in 3-5 seconds!**

---

*Created by: Kiro AI Assistant*  
*Date: February 18, 2026*
