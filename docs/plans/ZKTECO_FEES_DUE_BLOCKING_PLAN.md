# Plan: Fees-Due Blocking on ZKTeco K40 + Instant Check-ins

> Hand this whole file to Claude Code on the Windows gym laptop:
> "Read `docs/plans/ZKTECO_FEES_DUE_BLOCKING_PLAN.md` and work as per the plan."

---

## Outcome

1. A member whose fees are due **as per the blocking rule** is refused by the ZKTeco K40 (error beep / "Invalid", no "Thank you") within ~30 seconds of becoming due. They are re-allowed within ~30 seconds of paying. Their fingerprints are never deleted, so nobody re-enrolls.
2. Check-ins appear on the web dashboard **~1–2 seconds** after the finger scan, without a page refresh.
3. Front-desk staff can override a block ("Allow entry anyway") from the web app. Optionally, a red full-screen alert with sound appears on the dashboard when a member with dues checks in (soft-alert mode).

## Context

**Physical setup (Windows gym laptop):**
- A ZKTeco K40 fingerprint attendance machine is connected to the laptop **by a LAN cable directly**. The laptop reaches Supabase over **Wi-Fi**.
- A **Node.js script runs continuously on this laptop**. It reads attendance logs from the K40 (ZK protocol, TCP port 4370) and inserts rows into the Supabase `checkins` table.
- That script is **not** in the git repo. Find it on this laptop first: look for a folder containing `node-zklib`, `zkteco-js` or `zklib` in `package.json`. The repo docs (`docs/ZKTECO_*.md`) describe a `zkteco-listener/` folder that was never committed, so treat those docs as outdated hints, not truth.

**Enrollment flow today:**
- Staff add a member in the web app, which generates a **Member ID** (`members.member_id`, a 4-digit string such as `1001`).
- Staff then create a user on the K40 with the **same User ID** and enroll the fingerprint.
- So **K40 User ID == `members.member_id`**. This is the join key for everything below. Note: `checkins.member_id` and `invoices.member_id` are the member's **UUID** (`members.id`), not the 4-digit ID.

**Web app:** this repo, `gym-management-system`. Next.js 14 App Router, Supabase (`@supabase/supabase-js`), Clerk auth, multi-tenant (`organization_id` on tables).

**Relevant schema** (from `scripts/00_multi_tenant_setup.sql`; the live DB has drifted before, e.g. `monthly_fee` exists while `fee_amount` doesn't, so **verify against the live DB**):
- `members`: `id uuid`, `organization_id`, `member_id varchar` (device user ID), `name`, `status` (active/inactive/expired/suspended), `biometric_id`, `biometric_enrolled`, `monthly_fee`
- `invoices`: `member_id uuid → members.id`, `months_due int`, `status` (paid/due/overdue/cancelled), `due_date date`, `paid_date`
- `checkins`: `member_id uuid`, `check_in_time timestamptz`, `entry_method`, `device_name`, `scanner_id`

**Already done (2026-10-01, on the Linux dev PC):**
- `hooks/use-realtime-checkins.ts` was rewritten. It uses a Supabase Realtime INSERT subscription on `checkins` again, keeps 2-minute polling only as a fallback while the channel is down, de-duplicates rows, and fixes a bug where "X today" was capped at 10. The dashboard list still intentionally shows the latest 10 (`MAX_RECENT`).
- `alter publication supabase_realtime add table public.checkins;` **has been run** on the live Supabase DB.
- The green ⚡ icon on "Recent Check-ins" = realtime connected.
- Monthly dues are generated automatically by a Supabase **pg_cron** job (commit `95c96ac`). This means on the 1st of each month most members get a new `due` invoice.

**K40 hardware facts:**
- The K40 has no USB port for a PC connection (its USB port only takes flash drives). PC communication is TCP/IP only.
- The K40 decides accept/reject **locally** at scan time and cannot ask our server. Blocking therefore works by **changing the user's state on the device in advance** (disable/enable), driven by the laptop script.
- A disabled user's scan is usually **not logged**, so the dashboard won't see blocked attempts. That's why soft-alert mode exists.
- Whether "disable user" works over the SDK depends on K40 firmware. The fallback is assigning the user to an access-control group/time zone that never allows entry, which gives the same beep/refusal.

**Open decisions. Ask the user BEFORE coding Phase 2+** (they were asked but haven't answered yet):
1. **Blocking rule:** when is a member "blocked"? Options:
   - (a) any `due` invoice past `due_date` + N grace days (suggest N = 5)
   - (b) total `months_due >= 2`
   - (c) any `due`/`overdue` invoice immediately. **Warn the user** that (c) blocks almost everyone on the 1st because pg_cron creates dues automatically.
2. **Mode:** hard block (device refuses), soft alert (device accepts, dashboard shows red alert and plays a sound), or **both**.
3. K40 firmware version (Menu → System Info → Device Info). Record it in the README.

## Constraints

- **Never delete K40 users, fingerprint templates, or attendance logs.** Never call clear-data, clear-attendance, factory-reset or delete-user functions. Blocking = disable/enable or access-group change only.
- **Back up the device before the first write:** export all users (ID, name, privilege, card, password flag) and, if the library supports it, fingerprint templates to a timestamped JSON file in the listener folder (gitignored). Confirm the backup file is non-empty before any write.
- **Never change admin/superuser accounts on the device** (privilege/role = admin, 14 in the ZK protocol). Never block a user whose ID has no matching `members.member_id`; log it and skip.
- **One TCP connection to the K40 at a time.** The ZK protocol does not tolerate concurrent sockets. Serialize all device commands (realtime log listener + enable/disable) through one connection and queue.
- **Keep Supabase egress low.** The sync loop must fetch only `member_id` + `blocked` (a small view or RPC), never `SELECT *`. Poll every 30 s. Only send device commands for members whose state **changed** (keep a local cache file of the last applied state).
- **Fail open, not closed:** if Supabase is unreachable, leave device states as they are. Never mass-disable on an empty or failed response. If one sync would change more than 30% of users, abort that cycle and log a warning.
- Secrets (Supabase service role key, device IP/comm key) stay in the listener's `.env`. Never commit them. Never print them in logs.
- The listener must keep running as it does today (same start method, e.g. Windows Service / pm2 / startup script). Don't break the existing check-in push while adding features. Keep the current behavior working at every step.
- Match existing code style in the repo (TypeScript, Supabase client from `lib/supabase/*`, shadcn/ui components).
- Commit the listener into this repo under `zkteco-listener/` (without `.env`, `node_modules`, backups or state files) so it is version-controlled from now on.

## Authority

**You MAY, without asking:**
- Read anything on the laptop and in the repo. Run read-only device commands (connect, get info, get users, get attendance).
- Copy the existing listener script into `zkteco-listener/` and refactor it.
- Install npm packages in the listener folder.
- Create a **test user** on the K40 (ID `9999`, name `TEST BLOCK`), and disable/enable/delete **only that test user**, to verify firmware capability.
- Write new SQL migration files in `scripts/`, and Next.js code (UI toggle, alert component, API routes).
- Create commits on a feature branch `feat/zk-fees-due-blocking`.

**You MUST ask the user first:**
- The open decisions in Context (blocking rule, mode, firmware) before Phase 2.
- Running any SQL migration against the **live** Supabase DB. Show the SQL, then run it after approval (or let the user run it in the Supabase SQL editor).
- The first time hard-blocking is enabled against **real** members. Start with a dry-run mode that only logs "would disable 1023", and get approval after showing the dry-run list.
- Restarting or reinstalling the running listener service.
- Pushing to GitHub or merging to `main`.

**You MUST NOT:**
- Delete or overwrite device users/fingerprints/logs (see Constraints).
- Change the pg_cron dues job or invoice generation logic.
- Disable RLS or loosen database policies.

## Deliverables

**Phase 0 – Discover (report back before building):**
- Location of the current listener script, its library (`node-zklib` / `zkteco-js` / other) and version, how it reads logs (timer polling vs real-time events, interval), how it maps the device user ID to `members` and inserts into `checkins`, and how it is kept running.
- K40 firmware version and device info.
- Live DB check: confirm the `members.member_id`, `invoices.status/months_due/due_date` columns exist, and confirm `checkins` is in `supabase_realtime`.
- Answers to the open decisions.

**Phase 1 – Capability test:** `zkteco-listener/tools/test-block.js`
- Backs up the device users. Creates test user 9999. Disables it, prints the instruction "scan now, expect refusal", re-enables it, prints "scan now, expect accept".
- Run it with the user physically scanning. Record which method worked (SDK disable flag vs access group/time zone) in `zkteco-listener/README.md`.

**Phase 2 – Database (migration file, run only after approval):** `scripts/005_device_access.sql`
- `members.entry_override_until date null`: staff override, allows entry until that date even with dues.
- View or RPC `device_access_list` (scoped by `organization_id`) returning only `member_id` (the 4-digit text) and `blocked boolean`, computed from the agreed blocking rule, `members.status` (non-active ⇒ blocked) and the override.

**Phase 3 – Listener upgrade:** `zkteco-listener/`
- Switch check-in capture to **real-time device events** (e.g. `getRealTimeLogs`) if it currently polls on a timer. Keep a periodic catch-up read of logs to fill gaps after disconnects, de-duplicated against `checkins`.
- **Access sync loop** every 30 s: fetch `device_access_list` → diff with `state/applied-access.json` → enable/disable changed users through the serialized device queue → save state → log each change (`[access] 1023 DISABLED (2 months due)`).
- Full reconcile on startup and after reconnect.
- `.env` flags: `ACCESS_SYNC_ENABLED`, `ACCESS_SYNC_DRY_RUN=true` (default), `ACCESS_SYNC_INTERVAL_MS=30000`.
- Auto-reconnect to the device and to Supabase. Logs written to a rotating file.
- `README.md`: setup, `.env.example`, how to run and install as a service, how blocking works, how to roll back (set `ACCESS_SYNC_ENABLED=false` and run `tools/enable-all.js`, which re-enables every non-admin user).

**Phase 4 – Web app (this Next.js repo):**
- Member detail/edit: an **"Allow entry until…"** control writing `entry_override_until`, plus a "Blocked on device" badge.
- If the mode includes soft alert: in `components/dashboard/recent-checkins.tsx`, when a realtime check-in arrives for a member with `months_due > 0`, show a red full-screen overlay (name, Member ID, months due, amount) with a loud sound. Auto-dismiss after ~8 s or on click. Use the existing `useRealtimeCheckins` hook and don't add extra polling.

**Final report to the user:** what changed, how to switch blocking on/off, how to override a member, and how to roll back.

## Verification

Do every step physically with the user at the device, and report the result of each one:

1. **Instant check-ins:** open the dashboard and confirm the green ⚡ is shown. Scan a paid member → the row appears in ≤ 3 s with no refresh, and "X today" goes up by 1.
2. **Capability test:** `node tools/test-block.js`. Test user 9999 is refused (error beep) while disabled and accepted after re-enable. Then delete test user 9999.
3. **Dry run:** with `ACCESS_SYNC_DRY_RUN=true`, the log lists exactly the members the agreed rule should block. Cross-check 3 of them against the Payments page. The user approves the list.
4. **Hard block live** (on one consenting/test member first): create a due invoice that matches the rule → within ~30 s the log shows `DISABLED`. Scanning gives the error beep, with no "Thank you".
5. **Payment unblocks:** mark the invoice paid in the web app → within ~30 s the log shows `ENABLED`. The same finger is accepted without re-enrolling.
6. **Override:** set "Allow entry until tomorrow" on a blocked member → enabled within ~30 s. After the date passes (or the override is cleared), they're blocked again.
7. **Fail-open:** disconnect the laptop Wi-Fi for 2 minutes → no device users change state, the device keeps working offline, and check-ins buffered on the device appear on the dashboard after reconnect.
8. **Device unplugged:** pull the LAN cable for 1 minute → the listener logs the reconnect attempts and recovers by itself. No crash, no duplicate check-ins.
9. **Admin safety:** device admin accounts are untouched (compare with the backup JSON).
10. **Restart persistence:** reboot the laptop → the listener starts by itself, and the access sync and realtime check-ins work again.
11. **Soft alert** (if chosen): a member with dues scans → the red overlay and sound appear on the dashboard within ~3 s.
12. `npm run build` passes for the Next.js app. The listener runs with no errors for 30 minutes of normal use.
