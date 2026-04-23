---
name: kbn-dev
description: >
  Start, stop, restart, and manage local Kibana dev instances (serverless
  on :5601, stateful on :5611). Use when the user wants to start kibana,
  restart kibana, stop kibana, view logs, or debug startup failures.
  Trigger words: "start kibana", "restart kibana", "stop kibana",
  "kbn-dev", "spin up kibana", "kibana logs", "es logs".
  For status-only queries ("is kibana running", "kibana status"), prefer
  the /kbn-dev-status skill instead.
allowed-tools: >
  Bash(source * && yarn kbn-dev-ctl *)
  Bash(source * && yarn kbn-dev *)
  Bash(yarn kbn-dev-ctl *)
  Bash(yarn kbn-dev *)
  Bash(curl *)
  Bash(lsof *)
  Bash(kill *)
  Bash(tail *)
  Bash(grep *)
---

# Kibana Dev Environment

Dual-mode Kibana dev launcher: serverless (:5601) + stateful (:5611).

`yarn kbn-dev` starts everything. `yarn kbn-dev-ctl` controls it.

**All commands must run from the kibana repo root.** Verify before
running: `grep -q '"name": "kibana"' package.json 2>/dev/null || echo "NOT in kibana root — cd there first"`

## nvm — MUST prefix all yarn commands

Agent shells don't load nvm. Yarn rejects commands if node doesn't match
`.nvmrc`. **Prefix every yarn call with:**

```bash
source "${NVM_DIR:-$HOME/.nvm}/nvm.sh" --no-use && nvm use --silent && yarn ...
```

Source nvm once per shell session, then run yarn commands normally.

## Current status

```
!`source "${NVM_DIR:-$HOME/.nvm}/nvm.sh" --no-use 2>/dev/null && nvm use --silent 2>/dev/null; yarn kbn-dev-ctl status --json 2>/dev/null || echo '{"running": false, "state": "not_running"}'`
```

## Commands

| Action | Command |
|--------|---------|
| Start | `yarn kbn-dev --quiet` |
| Start clean | `yarn kbn-dev --quiet --clean` |
| Status | `yarn kbn-dev-ctl status --json` |
| Logs | `yarn kbn-dev-ctl logs <component> [--tail N] [--grep PAT]` |
| Restart | `yarn kbn-dev-ctl restart <serverless\|stateful\|all>` |
| Stop | `yarn kbn-dev-ctl stop` |

Components: `essls`, `esstack`, `optimizer`, `kbnsls`, `kbnstack`, `main`, `all`

## Starting Kibana

Check status first. If already running, tell the user. If not:

1. Say: "Spinning up Kibana, standby... (run /kbn-dev-status to check)"
2. Run `yarn kbn-dev --quiet` in background.
3. Poll silently:
   ```bash
   source "${NVM_DIR:-$HOME/.nvm}/nvm.sh" --no-use && nvm use --silent
   for i in $(seq 1 40); do
     sleep 15
     kbn_state=$(yarn kbn-dev-ctl status --json 2>/dev/null)
     sls=$(echo "$kbn_state" | grep -c '"kbnsls".*"ready": true')
     stack=$(echo "$kbn_state" | grep -c '"kbnstack".*"ready": true')
     is_running=$(echo "$kbn_state" | grep -c '"running": true')
     if [ "$sls" -gt 0 ] && [ "$stack" -gt 0 ]; then break; fi
     if [ "$is_running" = "0" ] && [ $i -gt 2 ]; then break; fi
   done
   ```
4. Report: both ready → URLs. Neither → "check logs". One failed → offer restart.

State progression: `starting` → `es_starting` → `optimizer_ready` → `running`.

**Never** show raw JSON or intermediate polls. One message at start, one when done.

## Viewing logs

**"Open the logs":** Requires interactive terminal. Tell the user:
> Run `yarn kbn-dev-ctl attach` in your terminal.

**Inline logs (what you CAN do):**
```bash
yarn kbn-dev-ctl logs kbnsls --tail 50
yarn kbn-dev-ctl logs all --grep "ERROR|FATAL"
```

Do NOT open terminal tabs, run AppleScript, or `tail -f` manually.

## Failure quick-ref

- **Node mismatch**: `nvm install $(cat .nvmrc)`
- **Port in use**: `yarn kbn-dev-ctl restart all`
- **Docker not running**: start Docker
- **After branch switch**: `yarn kbn-dev --quiet --clean`
- **Vault failed**: `KBN_INFERENCE_URL="" yarn kbn-dev --quiet`

For detailed diagnosis, read [failure-modes.md](failure-modes.md).

## Auth & browser interaction

For login screens, curl auth examples, and browser automation guidance,
read [browser-auth.md](browser-auth.md).

| Instance | URL | Login |
|----------|-----|-------|
| Serverless | http://localhost:5601 | select "admin" role (no password) |
| Stateful | http://localhost:5611 | elastic / changeme |

## Proactive monitoring

After editing `.ts`, `.tsx`, `.yml`, or config files, silently run
`yarn kbn-dev-ctl status --json`. If a component is down, restart and
tell the user briefly: "Kibana SLS crashed, restarting..."
