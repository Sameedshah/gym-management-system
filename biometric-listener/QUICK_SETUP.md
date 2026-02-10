# ⚡ Quick Setup Guide

Get your real-time biometric listener running in 5 minutes!

## Step 1: Install Node.js (if not installed)

Download from: https://nodejs.org/
- Choose LTS version (recommended)
- Run installer with default settings

## Step 2: Get Supabase Service Key

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **Settings** → **API**
4. Copy the **service_role** key (NOT anon key!)
5. Keep it safe - you'll need it in Step 4

## Step 3: Install Dependencies

Open Command Prompt in `biometric-listener` folder:

```bash
cd biometric-listener
npm install
```

Wait for installation to complete (1-2 minutes).

## Step 4: Configure Settings

Edit `.env` file and add your Supabase service key:

```env
# Device is already configured
DEVICE_IP=192.168.1.64
DEVICE_USERNAME=admin
DEVICE_PASSWORD=@Smgym7?

# ADD YOUR SUPABASE KEY HERE:
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_actual_key_here
```

## Step 5: Test Run

```bash
npm start
```

You should see:
```
✅ Connected to device event stream
👂 Listening for biometric events...
```

## Step 6: Test with Fingerprint

1. Scan a fingerprint on the device
2. Watch the console - you should see:
   ```
   🔔 Event received: AccessControl | Employee: 1001 | Time: 2024-02-10T14:30:00
   ✅ Check-in recorded for John Doe (ID: 1001)
   ```
3. Check your dashboard - attendance should appear instantly!

## Step 7: Auto-Start on Windows Boot (Optional)

### Simple Method (Startup Folder):
1. Press `Win + R`
2. Type: `shell:startup`
3. Drag `start.bat` into this folder
4. Done! Will start when you login

### Advanced Method (Windows Service):
```bash
# Run Command Prompt as Administrator
npm run install-service
```

Service will now auto-start on Windows boot!

## ✅ Success Checklist

- [ ] Node.js installed
- [ ] Dependencies installed (`npm install`)
- [ ] Supabase service key added to `.env`
- [ ] Test run successful (`npm start`)
- [ ] Fingerprint scan creates attendance
- [ ] Dashboard shows attendance instantly
- [ ] Auto-start configured (optional)

## 🆘 Quick Troubleshooting

**Can't connect to device:**
```bash
ping 192.168.1.64
```
If no response, check device power and network cable.

**401 Unauthorized:**
- Verify device password in `.env` is correct
- Try logging into device directly

**Member not found:**
- Ensure member exists in database
- Check `member_id` matches employee number on device

**Need help?** Check `README.md` for detailed troubleshooting.

---

**That's it! Your real-time biometric system is now running!** 🎉
