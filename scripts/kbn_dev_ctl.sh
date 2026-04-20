#!/bin/bash
# ---------------------------------------------------------------------------
# kbn-dev-ctl — query and control a kbn-dev instance
#
# Usage:
#   yarn kbn-dev-ctl status [--json]            Show component health
#   yarn kbn-dev-ctl logs <component>           Tail the last 50 lines of a component log
#     [--tail N]                         Number of lines (default 50)
#     [--follow]                         Follow (tail -f)
#     [--grep PATTERN]                   Filter lines
#   yarn kbn-dev-ctl restart <component>        Restart kbnsls or kbnstack
#   yarn kbn-dev-ctl stop                       Stop the entire kbn-dev instance
#
# Components: essls, esstack, optimizer, kbnsls, kbnstack, all
#
# The log directory defaults to ~/.kbn/logs (override with KBN_LOG_DIR).
# All commands work from any directory.
# ---------------------------------------------------------------------------

set -euo pipefail

# --- Locate log directory ---------------------------------------------------
find_log_dir() {
  local d="${KBN_LOG_DIR:-$HOME/.kbn/logs}"
  mkdir -p "$d" 2>/dev/null
  echo "$d"
}

LOG_DIR="$(find_log_dir)"
STATUS_FILE="$LOG_DIR/status.json"

# --- Helpers ----------------------------------------------------------------
component_log() {
  local comp="$1"
  case "$comp" in
    essls)     echo "$LOG_DIR/essls.log" ;;
    esstack)   echo "$LOG_DIR/esstack.log" ;;
    optimizer) echo "$LOG_DIR/optimizer.log" ;;
    kbnsls)    echo "$LOG_DIR/kbnsls.log" ;;
    kbnstack)  echo "$LOG_DIR/kbnstack.log" ;;
    main)      echo "$LOG_DIR/main.log" ;;
    *)         echo "ERROR: Unknown component '$comp'" >&2
               echo "  Valid: essls, esstack, optimizer, kbnsls, kbnstack, main" >&2
               exit 1 ;;
  esac
}

pid_alive() {
  local pid="$1"
  [ -n "$pid" ] && [ "$pid" != "null" ] && kill -0 "$pid" 2>/dev/null
}

port_listening() {
  local port="$1"
  lsof -ti "tcp:$port" >/dev/null 2>&1
}

check_ready() {
  local logfile="$1" pattern="$2"
  grep -q "$pattern" "$logfile" 2>/dev/null
}

# --- status -----------------------------------------------------------------
cmd_status() {
  local json_mode=false
  [ "${1:-}" = "--json" ] && json_mode=true

  local main_pid=""
  [ -f "$LOG_DIR/kbn.pid" ] && main_pid=$(cat "$LOG_DIR/kbn.pid" 2>/dev/null)
  local main_alive=false
  pid_alive "$main_pid" && main_alive=true

  local state="unknown"
  [ -f "$STATUS_FILE" ] && state=$(grep -o '"state": *"[^"]*"' "$STATUS_FILE" 2>/dev/null | head -1 | sed 's/.*: *"//;s/"//')

  local essls_pid="" esstack_pid="" optimizer_pid="" kbnsls_pid="" kbnstack_pid=""
  if [ -f "$STATUS_FILE" ]; then
    essls_pid=$(grep -o '"essls".*"pid": *"[^"]*"' "$STATUS_FILE" 2>/dev/null | grep -o '"pid": *"[^"]*"' | head -1 | sed 's/.*"pid": *"//;s/"//g')
    esstack_pid=$(grep -o '"esstack".*"pid": *"[^"]*"' "$STATUS_FILE" 2>/dev/null | grep -o '"pid": *"[^"]*"' | head -1 | sed 's/.*"pid": *"//;s/"//g')
    optimizer_pid=$(grep -o '"optimizer".*"pid": *"[^"]*"' "$STATUS_FILE" 2>/dev/null | grep -o '"pid": *"[^"]*"' | head -1 | sed 's/.*"pid": *"//;s/"//g')
    kbnsls_pid=$(grep -o '"kbnsls".*"pid": *"[^"]*"' "$STATUS_FILE" 2>/dev/null | grep -o '"pid": *"[^"]*"' | head -1 | sed 's/.*"pid": *"//;s/"//g')
    kbnstack_pid=$(grep -o '"kbnstack".*"pid": *"[^"]*"' "$STATUS_FILE" 2>/dev/null | grep -o '"pid": *"[^"]*"' | head -1 | sed 's/.*"pid": *"//;s/"//g')
  fi

  local essls_alive=false esstack_alive=false optimizer_alive=false
  local kbnsls_alive=false kbnstack_alive=false
  pid_alive "$essls_pid" && essls_alive=true
  pid_alive "$esstack_pid" && esstack_alive=true
  pid_alive "$optimizer_pid" && optimizer_alive=true
  pid_alive "$kbnsls_pid" && kbnsls_alive=true
  pid_alive "$kbnstack_pid" && kbnstack_alive=true

  local p5601=false p5611=false p9200=false p9201=false
  port_listening 5601 && p5601=true
  port_listening 5611 && p5611=true
  port_listening 9200 && p9200=true
  port_listening 9201 && p9201=true

  local essls_ready=false esstack_ready=false kbnsls_ready=false kbnstack_ready=false
  if [ "$essls_alive" = true ] || [ "$p9200" = true ]; then
    check_ready "$LOG_DIR/essls.log" "succ Serverless ES cluster running" && essls_ready=true
  fi
  if [ "$esstack_alive" = true ] || [ "$p9201" = true ]; then
    check_ready "$LOG_DIR/esstack.log" "succ ES cluster is ready" && esstack_ready=true
  fi
  # Kibana ready = log says available AND port is actually open.
  # The log check alone is unreliable after restarts (stale messages).
  if [ "$p5601" = true ]; then
    check_ready "$LOG_DIR/kbnsls.log" "\[INFO \]\[status\] Kibana is now available" && kbnsls_ready=true
  fi
  if [ "$p5611" = true ]; then
    check_ready "$LOG_DIR/kbnstack.log" "\[INFO \]\[status\] Kibana is now available" && kbnstack_ready=true
  fi

  if [ "$json_mode" = true ]; then
    cat <<EOF
{
  "running": $main_alive,
  "state": "$state",
  "pid": ${main_pid:-null},
  "log_dir": "$LOG_DIR",
  "components": {
    "essls":     { "pid": ${essls_pid:-null},     "alive": $essls_alive,     "ready": $essls_ready,     "port_open": $p9200  },
    "esstack":   { "pid": ${esstack_pid:-null},   "alive": $esstack_alive,   "ready": $esstack_ready,   "port_open": $p9201  },
    "optimizer": { "pid": ${optimizer_pid:-null},  "alive": $optimizer_alive  },
    "kbnsls":    { "pid": ${kbnsls_pid:-null},    "alive": $kbnsls_alive,    "ready": $kbnsls_ready,    "port_open": $p5601, "url": "http://localhost:5601" },
    "kbnstack":  { "pid": ${kbnstack_pid:-null},  "alive": $kbnstack_alive,  "ready": $kbnstack_ready,  "port_open": $p5611, "url": "http://localhost:5611" }
  }
}
EOF
    return
  fi

  echo ""
  echo "kbn-dev status"
  echo "=========="
  if [ "$main_alive" = true ]; then
    echo "  Controller:   running (PID $main_pid, state: $state)"
  else
    echo "  Controller:   not running"
  fi
  echo ""

  local fmt="  %-12s  %-8s  %-8s  %s\n"
  printf "$fmt" "COMPONENT" "PROCESS" "READY" "PORT"
  printf "$fmt" "---------" "-------" "-----" "----"
  printf "$fmt" "essls"     "$([ "$essls_alive" = true ] && echo "up" || echo "down")"     "$([ "$essls_ready" = true ] && echo "yes" || echo "no")"     "9200 $([ "$p9200" = true ] && echo "open" || echo "closed")"
  printf "$fmt" "esstack"   "$([ "$esstack_alive" = true ] && echo "up" || echo "down")"   "$([ "$esstack_ready" = true ] && echo "yes" || echo "no")"   "9201 $([ "$p9201" = true ] && echo "open" || echo "closed")"
  printf "$fmt" "optimizer" "$([ "$optimizer_alive" = true ] && echo "up" || echo "down")"  "-"                                                            "-"
  printf "$fmt" "kbnsls"    "$([ "$kbnsls_alive" = true ] && echo "up" || echo "down")"    "$([ "$kbnsls_ready" = true ] && echo "yes" || echo "no")"    "5601 $([ "$p5601" = true ] && echo "open" || echo "closed")"
  printf "$fmt" "kbnstack"  "$([ "$kbnstack_alive" = true ] && echo "up" || echo "down")"  "$([ "$kbnstack_ready" = true ] && echo "yes" || echo "no")"  "5611 $([ "$p5611" = true ] && echo "open" || echo "closed")"
  echo ""
  echo "  Logs: $LOG_DIR"
  echo ""
}

# --- logs -------------------------------------------------------------------
cmd_logs() {
  local comp="${1:-}"
  shift || true

  if [ -z "$comp" ]; then
    echo "Usage: yarn kbn-dev-ctl logs <component> [--tail N] [--follow] [--grep PATTERN]"
    echo "Components: essls, esstack, optimizer, kbnsls, kbnstack, main, all"
    exit 1
  fi

  local tail_n=50 follow=false grep_pattern=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --tail)   tail_n="$2"; shift 2 ;;
      --follow) follow=true; shift ;;
      --grep)   grep_pattern="$2"; shift 2 ;;
      *)        echo "Unknown option: $1" >&2; exit 1 ;;
    esac
  done

  local components
  if [ "$comp" = "all" ]; then
    components="essls esstack optimizer kbnsls kbnstack"
  else
    components="$comp"
  fi

  for c in $components; do
    local logfile
    logfile=$(component_log "$c")
    if [ ! -f "$logfile" ]; then
      echo "[$c] Log file not found: $logfile"
      continue
    fi

    if [ "$comp" = "all" ]; then
      echo ""
      echo "=== $c ==="
    fi

    if [ "$follow" = true ]; then
      if [ -n "$grep_pattern" ]; then
        tail -f "$logfile" | grep --line-buffered "$grep_pattern"
      else
        tail -f "$logfile"
      fi
    else
      local content
      content=$(tail -n "$tail_n" "$logfile")
      if [ -n "$grep_pattern" ]; then
        echo "$content" | grep "$grep_pattern" || true
      else
        echo "$content"
      fi
    fi
  done
}

# --- restart ----------------------------------------------------------------
cmd_restart() {
  local comp="${1:-}"
  if [ "$comp" != "kbnsls" ] && [ "$comp" != "kbnstack" ]; then
    echo "Usage: yarn kbn-dev-ctl restart <kbnsls|kbnstack>"
    echo "  Only Kibana processes support restart (ES clusters and optimizer stay running)."
    exit 1
  fi

  local port pidfile
  if [ "$comp" = "kbnsls" ]; then
    port=5601
    pidfile="$LOG_DIR/kbnsls.pid"
  else
    port=5611
    pidfile="$LOG_DIR/kbnstack.pid"
  fi

  echo "Restarting $comp..."

  # Kill the Kibana process listening on its port
  local kbn_port_pid
  kbn_port_pid=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -1)
  if [ -n "$kbn_port_pid" ]; then
    echo "  Killing PID $kbn_port_pid on port $port"
    kill "$kbn_port_pid" 2>/dev/null || true
    sleep 2
    if kill -0 "$kbn_port_pid" 2>/dev/null; then
      echo "  Force-killing PID $kbn_port_pid"
      kill -9 "$kbn_port_pid" 2>/dev/null || true
    fi
  else
    echo "  No process listening on port $port"
  fi

  # Verify the ES cluster backing this Kibana instance is reachable
  local es_port
  [ "$comp" = "kbnsls" ] && es_port=9200 || es_port=9201
  local es_code
  es_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$es_port" 2>/dev/null || echo "000")
  if [ "$es_code" = "000" ]; then
    echo ""
    echo "  ERROR: ES on port $es_port is not responding."
    echo "  Kibana cannot start without ES. A full restart is needed:"
    echo "    yarn kbn-dev-ctl stop && yarn kbn-dev"
    exit 1
  fi
  echo "  The monitor_process loop will auto-restart $comp."
  echo "  Watch the logs: tail -f $(component_log "$comp")"
}

# --- stop -------------------------------------------------------------------
cmd_stop() {
  local main_pid=""
  [ -f "$LOG_DIR/kbn.pid" ] && main_pid=$(cat "$LOG_DIR/kbn.pid" 2>/dev/null)

  if [ -z "$main_pid" ] || ! kill -0 "$main_pid" 2>/dev/null; then
    echo "No running kbn-dev instance found."
    return
  fi

  echo "Stopping kbn-dev (PID $main_pid)..."
  kill "$main_pid" 2>/dev/null
  echo "Sent SIGTERM. Cleanup will handle child processes."
}

# --- Main dispatch ----------------------------------------------------------
case "${1:-status}" in
  status)  shift 2>/dev/null || true; cmd_status "$@" ;;
  logs)    shift; cmd_logs "$@" ;;
  attach)  exec tmux attach -t kbn-logs ;;
  restart) shift; cmd_restart "$@" ;;
  stop)    cmd_stop ;;
  -h|--help|help)
    echo "Usage: yarn kbn-dev-ctl <command> [options]"
    echo ""
    echo "Commands:"
    echo "  status [--json]              Show component health"
    echo "  logs <component> [options]   View component logs"
    echo "  attach                       Attach to the tmux log viewer"
    echo "  restart <kbnsls|kbnstack>    Restart a Kibana instance"
    echo "  stop                         Stop the kbn-dev instance"
    echo ""
    echo "Components: essls, esstack, optimizer, kbnsls, kbnstack, main, all"
    echo ""
    echo "Log options:"
    echo "  --tail N       Number of lines (default 50)"
    echo "  --follow       Follow (tail -f)"
    echo "  --grep PATTERN Filter lines"
    ;;
  *)
    echo "Unknown command: $1" >&2
    echo "Run 'yarn kbn-dev-ctl help' for usage." >&2
    exit 1
    ;;
esac
