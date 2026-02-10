# Setup Flowchart

Visual guide for setting up the biometric listener.

## 🎯 Complete Setup Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    START: Setup Biometric Listener               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Node.js        │
                    │ Installed?     │
                    └───┬────────┬───┘
                        │        │
                    NO  │        │  YES
                        │        │
                        ▼        ▼
              ┌─────────────┐   │
              │ Install     │   │
              │ Node.js     │   │
              │ from        │   │
              │ nodejs.org  │   │
              └──────┬──────┘   │
                     │          │
                     └──────┬───┘
                            │
                            ▼
                   ┌────────────────┐
                   │ cd biometric-  │
                   │ listener       │
                   └────────┬───────┘
                            │
                            ▼
                   ┌────────────────┐
                   │ npm install    │
                   └────────┬───────┘
                            │
                            ▼
                   ┌────────────────┐
                   │ Get Supabase   │
                   │ Service Key    │
                   │ from Dashboard │
                   └────────┬───────┘
                            │
                            ▼
                   ┌────────────────┐
                   │ Edit .env      │
                   │ Add Service    │
                   │ Key            │
                   └────────┬───────┘
                            │
                            ▼
                   ┌────────────────┐
                   │ npm test       │
                   └────┬───────┬───┘
                        │       │
                   FAIL │       │ PASS
                        │       │
                        ▼       ▼
              ┌─────────────┐  │
              │ Check:      │  │
              │ • Network   │  │
              │ • Creds     │  │
              │ • Device    │  │
              └──────┬──────┘  │
                     │         │
                     └────┬────┘
                          │
                          ▼
                 ┌────────────────┐
                 │ npm start      │
                 └────────┬───────┘
                          │
                          ▼
                 ┌────────────────┐
                 │ Connected?     │
                 └───┬────────┬───┘
                     │        │
                 NO  │        │  YES
                     │        │
                     ▼        ▼
           ┌─────────────┐   │
           │ Troubleshoot│   │
           │ See         │   │
           │ TROUBLE-    │   │
           │ SHOOTING.md │   │
           └──────┬──────┘   │
                  │          │
                  └────┬─────┘
                       │
                       ▼
              ┌────────────────┐
              │ Scan Finger    │
              │ on Device      │
              └────────┬───────┘
                       │
                       ▼
              ┌────────────────┐
              │ Event          │
              │ Received?      │
              └───┬────────┬───┘
                  │        │
              NO  │        │  YES
                  │        │
                  ▼        ▼
        ┌─────────────┐   │
        │ Check:      │   │
        │ • Enrolled  │   │
        │ • Emp No    │   │
        │ • Debug Log │   │
        └──────┬──────┘   │
               │          │
               └────┬─────┘
                    │
                    ▼
           ┌────────────────┐
           │ Check-in       │
           │ Saved?         │
           └───┬────────┬───┘
               │        │
           NO  │        │  YES
               │        │
               ▼        ▼
     ┌─────────────┐   │
     │ Check:      │   │
     │ • Member ID │   │
     │ • Database  │   │
     │ • Supabase  │   │
     └──────┬──────┘   │
            │          │
            └────┬─────┘
                 │
                 ▼
        ┌────────────────┐
        │ Dashboard      │
        │ Updates?       │
        └───┬────────┬───┘
            │        │
        NO  │        │  YES
            │        │
            ▼        ▼
  ┌─────────────┐   │
  │ Check:      │   │
  │ • Realtime  │   │
  │ • Browser   │   │
  │ • Console   │   │
  └──────┬──────┘   │
         │          │
         └────┬─────┘
              │
              ▼
     ┌────────────────┐
     │ Configure      │
     │ Auto-Start?    │
     └───┬────────┬───┘
         │        │
     NO  │        │  YES
         │        │
         │        ▼
         │  ┌─────────────┐
         │  │ Choose:     │
         │  │ • Startup   │
         │  │ • Service   │
         │  └──────┬──────┘
         │         │
         │         ▼
         │  ┌─────────────┐
         │  │ Install     │
         │  │ Auto-Start  │
         │  └──────┬──────┘
         │         │
         └────┬────┘
              │
              ▼
     ┌────────────────┐
     │ ✅ COMPLETE!   │
     │ System Ready   │
     └────────────────┘
```

## 🔍 Decision Points

### 1. Node.js Installed?

**Check:**
```bash
node --version
```

**If NO:**
- Download from https://nodejs.org/
- Install LTS version
- Restart terminal

**If YES:**
- Continue to next step

---

### 2. npm test - PASS or FAIL?

**If PASS:**
```
✅ Device is reachable
✅ Authentication successful
✅ Event stream supported
```
Continue to next step

**If FAIL:**
```
❌ Connection failed
❌ Authentication failed
❌ Event stream not found
```

**Troubleshoot:**
- Check network: `ping 192.168.1.64`
- Verify credentials in `.env`
- Check device is powered on
- Ensure same network

---

### 3. Connected to Event Stream?

**If YES:**
```
✅ Connected to device event stream
👂 Listening for biometric events...
```
Continue to next step

**If NO:**
```
❌ Connection failed
```

**Troubleshoot:**
- Run `npm test` again
- Check firewall settings
- Verify device IP
- Check network cable

---

### 4. Event Received?

**If YES:**
```
🔔 Event received: AccessControl | Employee: 1001
```
Continue to next step

**If NO:**
```
(nothing happens when scanning)
```

**Troubleshoot:**
- Verify fingerprint is enrolled
- Check employee number is set
- Enable debug mode: `LOG_LEVEL=debug`
- Try scanning multiple times

---

### 5. Check-in Saved?

**If YES:**
```
✅ Check-in recorded for John Doe (ID: 1001)
```
Continue to next step

**If NO:**
```
⚠️ Member not found for employee number: 1001
```

**Troubleshoot:**
- Check member exists in database
- Verify `member_id` matches employee number
- Check Supabase connection
- Verify service role key

---

### 6. Dashboard Updates?

**If YES:**
```
Dashboard shows:
- ⚡ Lightning bolt icon
- New check-in appears
- Today's count increases
```
System is working! Configure auto-start

**If NO:**
```
Dashboard doesn't update
```

**Troubleshoot:**
- Check for ⚡ icon
- Verify Supabase realtime enabled
- Check browser console (F12)
- Try refresh (F5)

---

### 7. Configure Auto-Start?

**Option A: No Auto-Start**
- Manual start each time
- Good for testing
- Run: `npm start`

**Option B: Startup Folder**
- Auto-start on login
- Simple setup
- Steps:
  1. Press `Win + R`
  2. Type: `shell:startup`
  3. Drag `start.bat` into folder

**Option C: Windows Service**
- Auto-start on boot
- Runs 24/7
- Requires admin
- Run: `npm run install-service`

---

## 🎯 Quick Path (No Issues)

If everything works perfectly:

```
1. Install Node.js (5 min)
   ↓
2. npm install (2 min)
   ↓
3. Get Supabase key (2 min)
   ↓
4. Edit .env (1 min)
   ↓
5. npm test (30 sec)
   ✅ PASS
   ↓
6. npm start (30 sec)
   ✅ Connected
   ↓
7. Scan finger (5 sec)
   ✅ Event received
   ✅ Check-in saved
   ✅ Dashboard updates
   ↓
8. Configure auto-start (2 min)
   ↓
✅ DONE! (Total: ~13 minutes)
```

## 🆘 Troubleshooting Path

If you encounter issues:

```
Issue Detected
   ↓
Check Error Message
   ↓
┌─────────────────────────────────┐
│ Common Issues:                  │
│                                 │
│ • Connection timeout            │
│   → Check network               │
│                                 │
│ • 401 Unauthorized              │
│   → Check credentials           │
│                                 │
│ • No events                     │
│   → Check enrollment            │
│                                 │
│ • Member not found              │
│   → Check member_id             │
│                                 │
│ • Dashboard not updating        │
│   → Check realtime              │
└─────────────────────────────────┘
   ↓
See TROUBLESHOOTING.md
   ↓
Fix Issue
   ↓
Retry from Failed Step
   ↓
Continue Setup
```

## 📋 Verification Checklist

At each step, verify:

**After npm install:**
- [ ] `node_modules/` folder exists
- [ ] No error messages
- [ ] Dependencies installed

**After npm test:**
- [ ] All 3 tests pass
- [ ] Device info displayed
- [ ] "ALL TESTS PASSED" message

**After npm start:**
- [ ] "Connected" message appears
- [ ] "Listening" message appears
- [ ] No error messages

**After fingerprint scan:**
- [ ] Event log appears
- [ ] Employee number shown
- [ ] Check-in saved message

**After dashboard check:**
- [ ] ⚡ icon visible
- [ ] Check-in appears
- [ ] Count increases

**After auto-start setup:**
- [ ] Service installed (if using service)
- [ ] Shortcut created (if using startup)
- [ ] Test restart to verify

---

## 🎉 Success Path

```
┌─────────────────────────────────────────┐
│         ✅ SETUP COMPLETE!              │
│                                         │
│  Your system is now:                    │
│  • Connected to device                  │
│  • Processing events in real-time       │
│  • Saving to database                   │
│  • Updating dashboard instantly         │
│  • Running 24/7 (if auto-start)         │
│                                         │
│  Next Steps:                            │
│  1. Enroll all members                  │
│  2. Train staff                         │
│  3. Monitor for first few days          │
│  4. Enjoy real-time attendance! 🚀      │
└─────────────────────────────────────────┘
```

---

**Follow this flowchart for a smooth setup experience!** 📊
