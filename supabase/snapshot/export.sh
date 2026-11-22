#!/usr/bin/env bash
# Re-exports the production public schema into public.sql through the Supabase Management API.
# Needs a Supabase access token: either SUPABASE_ACCESS_TOKEN, or a proxy that injects it (Claude cloud env).
set -euo pipefail
cd "$(dirname "$0")"
REF="${SUPABASE_PROJECT_REF:-ckyvpcyuqniiqfzmoidu}"
AUTH=()
[ -n "${SUPABASE_ACCESS_TOKEN:-}" ] && AUTH=(-H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}")
python3 -c "import json,sys;print(json.dumps({'query':open('export-ddl.sql').read(),'read_only':True}))" \
  | curl -sSf -X POST "https://api.supabase.com/v1/projects/${REF}/database/query" \
      -H 'content-type: application/json' "${AUTH[@]}" --data-binary @- \
  | python3 -c "import json,sys;open('public.sql','w').write(json.load(sys.stdin)[0]['ddl']+'\n')"
echo "public.sql updated"
