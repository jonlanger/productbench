#!/usr/bin/env bash
# Durable batched capture → private Vercel Blob.
# Keep this in a long-lived terminal (Cursor background shell or OS terminal).
# Short-lived agent shells that background with `&` will SIGHUP the job.
#
#   npm run capture:batches
#   npm run capture:batches -- --exclude=6sense,notion --limit=25
#   npm run capture:batches -- --limit=25 --no-skip-captured --offset=0
#
set -u
cd "$(dirname "$0")/.."

EXCLUDE="${EXCLUDE:-6sense,hugging-face,notion,replicate,replit,salesforce}"
LIMIT="${LIMIT:-25}"
OFFSET="${OFFSET:-0}"
SKIP_CAPTURED="${SKIP_CAPTURED:-1}"
LOG="${LOG:-/tmp/productbench-capture-batches.log}"

while [ $# -gt 0 ]; do
  case "$1" in
    --exclude=*) EXCLUDE="${1#*=}"; shift ;;
    --limit=*) LIMIT="${1#*=}"; shift ;;
    --offset=*) OFFSET="${1#*=}"; shift ;;
    --log=*) LOG="${1#*=}"; shift ;;
    --skip-captured) SKIP_CAPTURED=1; shift ;;
    --no-skip-captured) SKIP_CAPTURED=0; shift ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 1
      ;;
  esac
done

batch=1
echo "Batch runner started pid=$$ at $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$LOG"
echo "exclude=$EXCLUDE limit=$LIMIT offset=$OFFSET skip_captured=$SKIP_CAPTURED log=$LOG" | tee -a "$LOG"

while true; do
  echo "" | tee -a "$LOG"
  echo "======== BATCH $batch · limit=$LIMIT skip=$SKIP_CAPTURED offset=$OFFSET · $(date -u +%Y-%m-%dT%H:%M:%SZ) ========" | tee -a "$LOG"

  args=(--all --exclude="$EXCLUDE" --limit="$LIMIT")
  if [ "$SKIP_CAPTURED" = "1" ]; then
    args+=(--skip-captured)
  elif [ "$OFFSET" -gt 0 ]; then
    args+=(--offset="$OFFSET")
  fi

  tmp_out="$(mktemp)"
  set +e
  npm run capture:ui -- "${args[@]}" 2>&1 | tee -a "$LOG" | tee "$tmp_out"
  code=${PIPESTATUS[0]}
  set -e

  echo "======== BATCH $batch exit=$code ========" | tee -a "$LOG"

  if grep -q "Nothing to capture\." "$tmp_out"; then
    rm -f "$tmp_out"
    echo "No more products in queue — done." | tee -a "$LOG"
    break
  fi
  rm -f "$tmp_out"

  if [ "$code" -ne 0 ]; then
    echo "Stopping after batch failure." | tee -a "$LOG"
    exit "$code"
  fi

  # With --skip-captured, each run pulls the next uncaptured slice (offset stays 0).
  if [ "$SKIP_CAPTURED" != "1" ]; then
    OFFSET=$((OFFSET + LIMIT))
  fi
  batch=$((batch + 1))
done

echo "All batches complete at $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$LOG"
