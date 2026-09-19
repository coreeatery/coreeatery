#!/usr/bin/env bash
set +e

ROOT="$(pwd)"
OUT="COREÉATERY_FULL_AUDIT_$(date +%Y%m%d_%H%M%S).txt"

exec > >(tee "$OUT") 2>&1

echo "============================================================"
echo "             COREÉATERY FULL PROJECT AUDIT"
echo "============================================================"
echo "Generated : $(date)"
echo "Project   : $ROOT"
echo "============================================================"

section() {
  echo
  echo "============================================================"
  echo "$1"
  echo "============================================================"
}

safe_run() {
  echo
  echo "\$ $*"
  "$@" 2>&1
  echo "[exit=$?]"
}

section "1. ENVIRONMENT"

echo "OS:"
uname -a

echo
echo "Node:"
node --version 2>&1

echo
echo "NPM:"
npm --version 2>&1

echo
echo "Vite:"
npx vite --version 2>&1

echo
echo "Supabase CLI:"
supabase --version 2>&1

echo
echo "Git:"
git --version 2>&1

echo
echo "Working directory:"
pwd

section "2. GIT STATUS"

safe_run git status --short

echo
echo "HEAD:"
git log -1 --oneline 2>&1

echo
echo "Recent commits:"
git log -10 --oneline 2>&1

echo
echo "Remote:"
git remote -v 2>&1

echo
echo "Branch:"
git branch -vv 2>&1

section "3. PROJECT TREE"

echo "Source files:"
find src -type f 2>/dev/null | sort

echo
echo "Public files:"
find public -type f 2>/dev/null | sort

echo
echo "Supabase files:"
find supabase -type f \
  ! -path '*/.temp/*' \
  ! -name '*.dump' \
  2>/dev/null | sort

section "4. PACKAGE.JSON"

cat package.json 2>/dev/null

section "5. VITE CONFIG"

cat vite.config.js 2>/dev/null

section "6. INDEX.HTML"

cat index.html 2>/dev/null

section "7. ROUTER"

cat src/app/router/index.jsx 2>/dev/null

section "8. AUTH / ROLES / PERMISSIONS"

echo "--- roles.js ---"
cat src/features/auth/roles.js 2>/dev/null

echo
echo "--- permissions.js ---"
cat src/features/auth/permissions.js 2>/dev/null

echo
echo "--- ProtectedRoute ---"
cat src/components/auth/ProtectedRoute.jsx 2>/dev/null

section "9. ALL PAGE COMPONENTS"

for f in $(find src/pages -type f -name '*.jsx' 2>/dev/null | sort); do
  echo
  echo "------------------------------------------------------------"
  echo "FILE: $f"
  echo "------------------------------------------------------------"
  cat "$f"
done

section "10. ALL FEATURE LOGIC"

for f in $(find src/features -type f \( -name '*.js' -o -name '*.jsx' \) 2>/dev/null | sort); do
  echo
  echo "------------------------------------------------------------"
  echo "FILE: $f"
  echo "------------------------------------------------------------"
  cat "$f"
done

section "11. COMPONENTS"

for f in $(find src/components -type f -name '*.jsx' 2>/dev/null | sort); do
  echo
  echo "------------------------------------------------------------"
  echo "FILE: $f"
  echo "------------------------------------------------------------"
  cat "$f"
done

section "12. OFFLINE / PWA"

echo "--- manifest ---"
cat public/manifest.webmanifest 2>/dev/null

echo
echo "--- service worker ---"
cat public/sw.js 2>/dev/null

echo
echo "--- offline feature ---"
for f in $(find src/features/offline -type f 2>/dev/null | sort); do
  echo
  echo "FILE: $f"
  cat "$f"
done

section "13. DATABASE MIGRATIONS"

for f in $(find supabase/migrations -type f -name '*.sql' 2>/dev/null | sort); do
  echo
  echo "------------------------------------------------------------"
  echo "MIGRATION: $f"
  echo "------------------------------------------------------------"
  cat "$f"
done

section "14. SUPABASE PROJECT"

echo "--- linked project ---"
supabase status 2>&1

echo
echo "--- migration list ---"
supabase migration list 2>&1

section "15. DATABASE SCHEMA AUDIT"

echo "Attempting database inspection through Supabase CLI."

if command -v psql >/dev/null 2>&1; then
  echo
  echo "psql available."
  echo "Database connection is intentionally NOT created automatically."
  echo "No password/connection string is collected by this audit."
else
  echo
  echo "psql not available."
fi

section "16. SOURCE CODE SEARCH"

echo "--- TODO / FIXME / TEMP ---"
grep -RniE 'TODO|FIXME|TEMP|HACK|XXX' \
  src supabase public \
  --exclude-dir=node_modules \
  --exclude-dir=.temp \
  2>/dev/null || true

echo
echo "--- console usage ---"
grep -RniE 'console\.(log|warn|error)' \
  src \
  --exclude-dir=node_modules \
  2>/dev/null || true

echo
echo "--- localhost usage ---"
grep -RniE 'localhost|127\.0\.0\.1' \
  src public \
  --exclude-dir=node_modules \
  2>/dev/null || true

echo
echo "--- public Supabase URL references ---"
grep -RniE 'supabase\.co|VITE_SUPABASE' \
  src public \
  --exclude-dir=node_modules \
  2>/dev/null || true

section "17. SECURITY SCAN"

echo "--- service_role references ---"
grep -Rni 'service_role' \
  src public supabase \
  --exclude-dir=node_modules \
  --exclude-dir=.temp \
  2>/dev/null || true

echo
echo "--- secret-like variable names ---"
grep -RniE 'SECRET|PASSWORD|PRIVATE_KEY|ACCESS_TOKEN|ANON_KEY|API_KEY' \
  src public supabase \
  --exclude-dir=node_modules \
  --exclude-dir=.temp \
  2>/dev/null || true

echo
echo "--- env files present ---"
find . -maxdepth 2 \
  -type f \
  \( -name '.env' -o -name '.env.local' -o -name '.env.production' \) \
  -print 2>/dev/null

echo
echo "NOTE: contents of env files are NEVER printed."

section "18. ROUTE / FEATURE KEYWORD AUDIT"

echo "--- routes ---"
grep -RniE 'path:|createBrowserRouter|RouteObject|/admin|/cashier|/menu|reservasi' \
  src/app/router src \
  --exclude-dir=node_modules \
  2>/dev/null || true

echo
echo "--- inventory ---"
grep -RniE 'inventory|stock|supplier|purchase' src supabase \
  --exclude-dir=node_modules \
  --exclude-dir=.temp \
  2>/dev/null || true

echo
echo "--- kitchen ---"
grep -RniE 'kitchen|ticket|recipe' src supabase \
  --exclude-dir=node_modules \
  --exclude-dir=.temp \
  2>/dev/null || true

echo
echo "--- automation ---"
grep -RniE 'automation|notification|summary|schedule|cron|expiry' \
  src supabase \
  --exclude-dir=node_modules \
  --exclude-dir=.temp \
  2>/dev/null || true

echo
echo "--- offline ---"
grep -RniE 'offline|IndexedDB|indexedDB|sync|queue|serviceWorker|serviceWorker' \
  src public \
  --exclude-dir=node_modules \
  2>/dev/null || true

section "19. DATABASE OBJECT KEYWORD AUDIT"

grep -RniE \
  'create table|create function|create or replace function|enable row level security|create policy|grant execute|inventory_items|purchase_orders|suppliers|kitchen_tickets|notifications|daily_sales_summaries|cash_register' \
  supabase/migrations \
  --exclude-dir=.temp \
  2>/dev/null || true

section "20. LINT"

npm run lint 2>&1
LINT_EXIT=$?

echo
echo "LINT_EXIT=$LINT_EXIT"

section "21. PRODUCTION BUILD"

npm run build 2>&1
BUILD_EXIT=$?

echo
echo "BUILD_EXIT=$BUILD_EXIT"

section "22. BUILD OUTPUT"

if [ -d dist ]; then
  echo "dist exists: YES"
  echo
  du -sh dist 2>/dev/null
  echo
  find dist -maxdepth 2 -type f 2>/dev/null | sort
else
  echo "dist exists: NO"
fi

section "23. GIT TRACKING CHECK"

echo "--- ignored files ---"
git status --ignored --short 2>/dev/null | head -100

echo
echo "--- untracked files ---"
git status --short 2>/dev/null

section "24. FILE SIZE AUDIT"

echo "--- largest source files ---"
find src -type f -print0 2>/dev/null |
  xargs -0 du -h 2>/dev/null |
  sort -h |
  tail -30

echo
echo "--- largest public files ---"
find public -type f -print0 2>/dev/null |
  xargs -0 du -h 2>/dev/null |
  sort -h |
  tail -30

section "25. FEATURE CHECKLIST"

cat <<'CHECKLIST'
COREÉATERY TARGET

1. WEBSITE
[ ] Public homepage
[ ] Menu
[ ] Menu detail
[ ] Gallery
[ ] Reservation
[ ] Responsive UI
[ ] ID/EN language

2. WEB APPLICATION
[ ] Authentication
[ ] Role-based access
[ ] Admin dashboard
[ ] Cashier dashboard
[ ] Management controls
[ ] Error/loading/empty states

3. POS
[ ] New order
[ ] Order detail
[ ] Order status
[ ] Payment
[ ] Cash payment
[ ] Cash register
[ ] Shift opening
[ ] Shift closing
[ ] Cash movement
[ ] Payment integrity
[ ] Transaction history
[ ] Sales reports

4. BUSINESS SYSTEM
[ ] Dashboard
[ ] Sales reporting
[ ] Reservation management
[ ] Menu management
[ ] Promotion
[ ] Gallery/CMS
[ ] Inventory
[ ] Inventory movement
[ ] Recipe/BOM
[ ] Supplier
[ ] Purchasing
[ ] Purchase receiving
[ ] Business settings

5. KITCHEN
[ ] Kitchen ticket
[ ] Kitchen queue
[ ] Order-to-kitchen flow
[ ] Kitchen status
[ ] Recipe consumption
[ ] Stock deduction

6. AUTOMATION
[ ] Shift auto-expiry
[ ] Scheduled operations
[ ] Daily sales summary
[ ] Low-stock alert
[ ] Closing report
[ ] Operational notifications
[ ] Automated inventory consumption

7. MOBILE
[ ] PWA
[ ] Installable
[ ] Mobile owner dashboard
[ ] Mobile cashier
[ ] Mobile kitchen
[ ] Responsive operational UI

8. OFFLINE-FIRST
[ ] Local database
[ ] Offline order
[ ] Offline queue
[ ] Sync engine
[ ] Conflict handling
[ ] Retry mechanism
[ ] Offline payment strategy
[ ] Data integrity after reconnect

9. SECURITY
[ ] RLS all business tables
[ ] Role permissions
[ ] No service-role frontend
[ ] No secrets in frontend
[ ] Secure storage
[ ] Secure RPC
[ ] Input validation
[ ] Transaction integrity
[ ] Authorization checks
[ ] Audit trail

10. PRODUCTION
[ ] Build passes
[ ] Lint passes
[ ] Vercel deployment
[ ] Production smoke test
[ ] Auth smoke test
[ ] POS smoke test
[ ] Payment smoke test
[ ] Shift smoke test
[ ] Admin smoke test
[ ] Offline smoke test
[ ] Mobile smoke test
CHECKLIST

section "26. FINAL STATUS"

echo "LINT_EXIT=$LINT_EXIT"
echo "BUILD_EXIT=$BUILD_EXIT"
echo
echo "Audit file:"
echo "$ROOT/$OUT"
echo
echo "IMPORTANT:"
echo "- This audit does not modify database schema."
echo "- This audit does not push Git commits."
echo "- This audit does not deploy."
echo "- Environment secrets are not printed."
echo "============================================================"

