---
name: kbn-dev-status
description: >
  Show the current status of the local Kibana dev environment.
  Use when the user types /kbn-dev-status or asks "is kibana running",
  "kibana status", "what's the state of kbn".
disable-model-invocation: true
allowed-tools: Bash(yarn kbn-dev-ctl *)
---

# Kibana Status

Run `yarn kbn-dev-ctl status --json` from the kibana repo root and present a
concise summary. Do NOT show raw JSON.

```
!`yarn kbn-dev-ctl status --json 2>/dev/null || echo '{"running": false}'`
```

Format the output as:

| Component | Status | Ready |
|-----------|--------|-------|
| ES Serverless | up/down | yes/no |
| ES Stateful | up/down | yes/no |
| Optimizer | up/down | — |
| Kibana SLS | up/down | yes/no |
| Kibana Stack | up/down | yes/no |

Add URLs for ready Kibana instances:
- Serverless: http://localhost:5601
- Stateful: http://localhost:5611

If not running, say "Kibana is not running. Start with /kbn-dev"
