# Database Migration Guide

## Overview
This guide will help you migrate your existing Utang Tracker data to support multiple groups while keeping all your current users and transactions together in one default group.

## Prerequisites
- Access to your Supabase dashboard
- Existing users and transactions in your database

## Migration Steps

### Step 1: Run Main Schema Migration
1. Go to your Supabase dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `database-schema-groups.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Ctrl+Enter)
7. You should see "Success. No rows returned"

### Step 2: Create Default Group for Existing Users

Run these queries **ONE BY ONE** in the SQL Editor:

#### Query 1: Create your default group
```sql
INSERT INTO groups (name, code)
VALUES ('Capareda Boarding House', 'CAREDA');
```

#### Query 2: Assign all existing users to the default group
```sql
UPDATE users 
SET group_id = (SELECT id FROM groups WHERE code = 'CAREDA')
WHERE group_id IS NULL;
```

#### Query 3: Assign all existing transactions to the default group
```sql
UPDATE transactions 
SET group_id = (SELECT id FROM groups WHERE code = 'CAREDA')
WHERE group_id IS NULL;
```

#### Query 4: Verify the migration
```sql
SELECT 
  'Users with group' as type,
  COUNT(*) as count
FROM users 
WHERE group_id IS NOT NULL

UNION ALL

SELECT 
  'Transactions with group' as type,
  COUNT(*) as count
FROM transactions 
WHERE group_id IS NOT NULL;
```

You should see:
- Users with group: 7 (or your actual user count)
- Transactions with group: (your actual transaction count)

### Step 3: Update Your Browser

After running the migration:

1. **Clear your localStorage** (important!):
   - Open your app in the browser
   - Press F12 to open DevTools
   - Go to **Application** tab
   - Click **Local Storage** → your domain
   - Right-click → **Clear**

2. **Refresh the page**

3. **Join your default group**:
   - Click "Continue" on landing page
   - Click "Join Existing Group"
   - Enter code: `CAREDA`
   - You should see all your existing users!

## What This Does

- ✅ Creates a "Capareda Boarding House" group with code `CAREDA`
- ✅ Assigns all your existing 7 users to this group
- ✅ Assigns all your existing transactions to this group
- ✅ Keeps all your data intact and working
- ✅ Allows you to create/join other groups later

## Troubleshooting

**Q: I don't see my users after joining the group**
- Make sure you cleared localStorage
- Make sure you joined using code `CAREDA` (all caps)
- Check that Query 2 ran successfully (should return "UPDATE X" where X = number of users)

**Q: Can I change the group name or code?**
- Yes! Update Query 1 with your preferred name/code
- Use a 6-character code (letters and numbers, no special chars)

**Q: What if I want multiple existing groups?**
- Create additional groups with different codes
- Manually assign specific users to different groups using UPDATE queries

**Q: Can I verify which group my users belong to?**
```sql
SELECT u.name, g.name as group_name, g.code 
FROM users u 
JOIN groups g ON u.group_id = g.id;
```

## Next Steps

After successful migration:
- Your existing system continues working as before
- All 7 users see each other's transactions
- You can now create/join additional groups for other communities
- Each group is completely isolated from others
- Share group codes to invite people to specific groups

## Rollback (if needed)

If something goes wrong and you want to undo:
```sql
-- Remove group assignments
UPDATE users SET group_id = NULL;
UPDATE transactions SET group_id = NULL;

-- Delete the group
DELETE FROM groups WHERE code = 'CAREDA';
```

Then clear localStorage and refresh.
