# Recovery Playbook (Time-boxed: 1-2 Days)

## Goal
Recover writings/thoughts/program content from any available source before full rebuild.

## Sources To Check
- Local machine: old exports, shell history, copied notes, markdown drafts.
- Git history: previous commits/branches containing content payloads.
- CI/deploy artifacts: historical package bundles containing static content.
- Public web caches: Wayback snapshots and search cache for published pages.
- AWS support artifacts: request evidence of backups/snapshots from pre-deactivation period.

## Output Format
Store reconstructed items in `recovered-content/` as JSON with provenance metadata:
- `source`: where data came from.
- `confidence`: `high | medium | low`.
- `last_verified`: ISO timestamp.

## Exit Criteria
- Stop after 2 days or earlier if no additional high-confidence sources remain.
- Continue migration regardless of recovery result.
