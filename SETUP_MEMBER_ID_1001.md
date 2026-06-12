# Setup Member ID to Start from 1001

## Quick Setup

To configure your database so that member IDs start from 1001, follow these steps:

### Step 1: Run the SQL Script

1. Open your Supabase Dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `setup-member-id-generation.sql`
4. Click "Run" to execute the script

### Step 2: Verify Setup

After running the script, you should see:
- ✅ Trigger created successfully
- ✅ Next member ID will be 1001 (or the next available number if you already have members)

### How It Works

The SQL script creates:
1. A function `generate_numeric_member_id()` that generates sequential numeric IDs starting from 1001
2. A trigger that automatically assigns member IDs when new members are created
3. The trigger runs before each INSERT, so you don't need to manually set member_id

### Testing

After setup, when you add a new member through the dashboard:
1. The member_id field will be automatically generated
2. First member will get ID: 1001
3. Second member will get ID: 1002
4. And so on...

### Notes

- If you already have members in the database, the next ID will be MAX(existing_id) + 1
- Member IDs are purely numeric (no "GM" prefix)
- This is compatible with ZKTeco K40 biometric devices which require numeric User IDs
