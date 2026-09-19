#!/data/data/com.termux/files/usr/bin/bash

set +e

ROOT="$(pwd)"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
REPORT="AUDIT_PUBLIC_CMS_${TIMESTAMP}.txt"

{
  echo "============================================================"
  echo "COREÉATERY PUBLIC WEBSITE + CMS AUDIT"
  echo "============================================================"
  echo "Date: $(date)"
  echo "Root: $ROOT"
  echo

  echo "============================================================"
  echo "1. GIT STATUS"
  echo "============================================================"
  git status --short
  echo
  echo "HEAD:"
  git log -1 --oneline
  echo
  echo "REMOTE:"
  git remote -v
  echo

  echo "============================================================"
  echo "2. PROJECT STRUCTURE"
  echo "============================================================"
  find src -maxdepth 4 -type f \
    \( -name "*.jsx" -o -name "*.tsx" -o -name "*.js" -o -name "*.ts" -o -name "*.css" \) \
    | sort
  echo

  echo "============================================================"
  echo "3. ROUTES AND NAVIGATION"
  echo "============================================================"
  grep -RInE \
    "createBrowserRouter|BrowserRouter|Routes|Route|path=|navigate\\(" \
    src \
    --include="*.jsx" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.ts" \
    2>/dev/null
  echo

  echo "============================================================"
  echo "4. PUBLIC PAGE COMPONENTS"
  echo "============================================================"
  find src -type f \
    | grep -Ei \
    "home|homepage|hero|menu|about|contact|location|gallery|reservation|footer|navbar|public" \
    | sort
  echo

  echo "============================================================"
  echo "5. ADMIN AND MANAGER COMPONENTS"
  echo "============================================================"
  find src -type f \
    | grep -Ei \
    "admin|manager|cms|dashboard|content|editor|media" \
    | sort
  echo

  echo "============================================================"
  echo "6. THEME AND DARK/LIGHT MODE"
  echo "============================================================"
  grep -RInE \
    "dark:|darkMode|theme|localStorage|prefers-color-scheme|classList|document.documentElement|bg-black|bg-white|bg-gray|text-white|text-black" \
    src \
    --include="*.jsx" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.ts" \
    --include="*.css" \
    2>/dev/null
  echo

  echo "============================================================"
  echo "7. HARDCODED PUBLIC CONTENT CANDIDATES"
  echo "============================================================"
  grep -RInE \
    "Enjoy the|Ultimate Dining|Make a Reservation|Explore Menu|Contemporary Dining|Delicious food|Opening Hours|About Us|Contact Us|Featured|Bestseller" \
    src \
    --include="*.jsx" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.ts" \
    2>/dev/null
  echo

  echo "============================================================"
  echo "8. SUPABASE USAGE"
  echo "============================================================"
  grep -RInE \
    "createClient|supabase|\\.from\\(|\\.rpc\\(|storage\\.from|auth\\." \
    src \
    --include="*.jsx" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.ts" \
    2>/dev/null
  echo

  echo "============================================================"
  echo "9. CMS AND CONTENT TABLE REFERENCES"
  echo "============================================================"
  grep -RInEi \
    "site_settings|settings|page_sections|homepage|hero|gallery|promotions|restaurant_info|business_hours|content|media" \
    src supabase \
    --include="*.jsx" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.ts" \
    --include="*.sql" \
    2>/dev/null
  echo

  echo "============================================================"
  echo "10. DATABASE MIGRATIONS"
  echo "============================================================"
  find supabase/migrations -maxdepth 1 -type f \
    -name "*.sql" \
    | sort
  echo

  echo "============================================================"
  echo "11. STORAGE BUCKETS AND MEDIA"
  echo "============================================================"
  grep -RInEi \
    "bucket|storage|upload|image_url|imageUrl|video_url|media" \
    src supabase \
    --include="*.jsx" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.ts" \
    --include="*.sql" \
    2>/dev/null
  echo

  echo "============================================================"
  echo "12. AUTHENTICATION AND ROLE PERMISSIONS"
  echo "============================================================"
  grep -RInEi \
    "admin|manager|cashier|role|is_admin|user_roles|permission|RLS|policy" \
    src supabase \
    --include="*.jsx" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.ts" \
    --include="*.sql" \
    2>/dev/null
  echo

  echo "============================================================"
  echo "13. PUBLIC PAGE DATABASE QUERIES"
  echo "============================================================"
  grep -RInE \
    "\\.from\\(" \
    src \
    --include="*.jsx" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.ts" \
    2>/dev/null
  echo

  echo "============================================================"
  echo "14. PACKAGE AND BUILD CONFIGURATION"
  echo "============================================================"
  if [ -f package.json ]; then
    cat package.json
  fi
  echo

  echo "============================================================"
  echo "15. POSSIBLE PUBLIC PAGE FILES WITH LINE COUNTS"
  echo "============================================================"
  find src -type f \
    \( -name "*.jsx" -o -name "*.tsx" -o -name "*.js" -o -name "*.ts" \) \
    | grep -Ei \
    "home|hero|menu|about|contact|gallery|reservation|navbar|footer" \
    | while read -r FILE; do
      printf "%6s lines  %s\n" "$(wc -l < "$FILE")" "$FILE"
    done
  echo

  echo "============================================================"
  echo "AUDIT FINISHED"
  echo "============================================================"

} > "$REPORT" 2>&1

echo "Audit selesai."
echo "File laporan:"
echo "$ROOT/$REPORT"
