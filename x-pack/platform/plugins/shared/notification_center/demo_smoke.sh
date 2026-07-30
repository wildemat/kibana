#!/usr/bin/env bash
#
# Notification Center demo smoke test — NOT COMMITTED, local dry-run only.
#
# Walks the demo beats against a running local Kibana. Uses the kibana-api common
# wrapper with SESSION auth (basic provider) so the read-state it mutates is the
# SAME user profile the browser badge reads — plain HTTP Basic is a different auth
# realm with no profile, and mutations there return 403.
#
# IMPORTANT — target a BASIC-AUTH instance:
#   - Serverless :5601 (default here) works out of the box: basic provider, session
#     login succeeds, browser + curl share the elastic profile.
#   - The stateful :5611 instance defaults to the SAML Mock IdP (trial license), so
#     session login 404s and this script cannot authenticate. To run the curl/skill
#     beats on stateful, start it basic-auth: `kbn-dev ... --license basic`.
#   The bell/flyout UI itself works on either instance (log in via the browser).
#
# Usage:
#   bash x-pack/platform/plugins/shared/notification_center/demo_smoke.sh
#   KIBANA_URL=http://localhost:5611 bash .../demo_smoke.sh   # basic-auth stateful
set -euo pipefail

export KIBANA_USE_SESSION=true
export KIBANA_URL="${KIBANA_URL:-http://localhost:5601}"
REPO_ROOT="$(git rev-parse --show-toplevel)"
source "$REPO_ROOT/scripts/kibana_api_common.sh"

NC="$KIBANA_URL/internal/notification_center"
APIV=(-H "elastic-api-version: 1")
JSON=(-H "content-type: application/json")

count()  { kibana_curl "${APIV[@]}" "$NC/notifications/_unread_count" | jq -r '.unreadCount'; }
titles() { kibana_curl "${APIV[@]}" "$NC/notifications?perPage=100${1:-}" \
             | jq -r '.notifications[] | "  [\(.severity)] \(.notification_id)  isRead=\(.isRead)"'; }

echo "== Beat 0: warm-up list (stamps the read marker so the backlog isn't unread) =="
kibana_curl "${APIV[@]}" "$NC/notifications?perPage=1" >/dev/null
echo "   marker stamped."

echo "== Beat 1: seed a variety (all severities, both kinds, 3 namespaces) =="
kibana_curl "${APIV[@]}" -X POST "$NC/_demo/seed" | jq

echo "== Beat 2: unread count + list =="
echo "   unread = $(count)"
titles

echo "== Beat 3: collapse — re-seed; state ids stay ONE row (latest content) =="
kibana_curl "${APIV[@]}" -X POST "$NC/_demo/seed" >/dev/null
echo "   diskWatermark:data-node-7:high rows (expect 1):"
kibana_curl "${APIV[@]}" "$NC/notifications?perPage=100" \
  | jq -r '[.notifications[] | select(.notification_id=="elasticsearch:diskWatermark:data-node-7:high")] | length'

echo "== Beat 4: mark ONE read (the high-watermark state) =="
kibana_curl "${APIV[@]}" "${JSON[@]}" -X POST "$NC/notifications/_mark_read" \
  -d '{"notificationIds":["elasticsearch:diskWatermark:data-node-7:high"]}' | jq
echo "   unread now = $(count)"

echo "== Beat 5: mark ALL read =="
kibana_curl "${APIV[@]}" -X POST "$NC/notifications/_mark_all_read" | jq
echo "   unread now = $(count)  (expect 0)"

echo "== Beat 6: re-push of a persisting state does NOT un-read it =="
echo "   re-seeding (re-pushes the same state ids + new timeseries occurrences)..."
kibana_curl "${APIV[@]}" -X POST "$NC/_demo/seed" >/dev/null
echo "   diskWatermark:data-node-7:high isRead (expect true — earliest doc precedes the marker):"
kibana_curl "${APIV[@]}" "$NC/notifications?perPage=100" \
  | jq -r '.notifications[] | select(.notification_id=="elasticsearch:diskWatermark:data-node-7:high") | .isRead'
echo "   unread now = $(count)  (only the fresh timeseries occurrences, not the re-pushed state)"

echo "== Beat 7: validation rejects an unregistered type =="
kibana_curl "${APIV[@]}" -X POST "$NC/_demo/seed?invalid=true" | jq '.rejectionMessage'

echo "== done =="
