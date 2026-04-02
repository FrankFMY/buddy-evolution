#!/bin/bash
# Lightweight PostToolUse hook — bash for fast startup (~5ms vs Node's ~50ms)
# Increments session counters, outputs buddy reactions at milestones

COUNTER_FILE="$HOME/.buddy-evolution/.session-counter"
SOUL_FILE="$HOME/.buddy-evolution/soul.json"

# Read stdin (hook input)
INPUT=$(cat)

# Parse tool name (handle both "key":"val" and "key": "val" formats)
TOOL_NAME=$(echo "$INPUT" | grep -o '"tool_name": *"[^"]*"' | head -1 | sed 's/.*: *"//;s/"//')

# Initialize counter file if missing
if [ ! -f "$COUNTER_FILE" ]; then
  echo '{"tools":0,"edits":0,"tests":0,"reads":0}' > "$COUNTER_FILE"
fi

# Read current counters
TOOLS=$(grep -o '"tools":[0-9]*' "$COUNTER_FILE" | grep -o '[0-9]*')
EDITS=$(grep -o '"edits":[0-9]*' "$COUNTER_FILE" | grep -o '[0-9]*')
TESTS=$(grep -o '"tests":[0-9]*' "$COUNTER_FILE" | grep -o '[0-9]*')
READS=$(grep -o '"reads":[0-9]*' "$COUNTER_FILE" | grep -o '[0-9]*')

TOOLS=$((TOOLS + 1))

case "$TOOL_NAME" in
  Write|Edit) EDITS=$((EDITS + 1)) ;;
  Read) READS=$((READS + 1)) ;;
  Bash)
    CMD=$(echo "$INPUT" | grep -o '"command": *"[^"]*"' | head -1 | sed 's/.*: *"//;s/"//')
    if echo "$CMD" | grep -qiE '(jest|vitest|pytest|cargo test|go test|npm test|pnpm test|rspec)'; then
      TESTS=$((TESTS + 1))
    fi
    ;;
esac

# Save counters
echo "{\"tools\":$TOOLS,\"edits\":$EDITS,\"tests\":$TESTS,\"reads\":$READS}" > "$COUNTER_FILE"

# Get buddy name and emoji from soul
BUDDY_NAME="Buddy"
BUDDY_EMOJI=""
if [ -f "$SOUL_FILE" ]; then
  BUDDY_NAME=$(grep -o '"name": *"[^"]*"' "$SOUL_FILE" | head -1 | sed 's/.*: *"//;s/"//')
  BUDDY_EMOJI=$(grep -o '"emoji": *"[^"]*"' "$SOUL_FILE" | head -1 | sed 's/.*: *"//;s/"//')
fi

# Check milestones — only output on specific thresholds
REACTION=""

case $TOOLS in
  25)  REACTION="$BUDDY_EMOJI $BUDDY_NAME is watching — 25 tool calls so far." ;;
  50)  REACTION="$BUDDY_EMOJI $BUDDY_NAME nods approvingly — 50 tool calls. Momentum building." ;;
  100) REACTION="$BUDDY_EMOJI $BUDDY_NAME: \"100 tool calls. Tool Master territory.\"" ;;
  200) REACTION="$BUDDY_EMOJI $BUDDY_NAME: \"200 calls. This is a serious session.\"" ;;
esac

if [ -z "$REACTION" ]; then
  case $EDITS in
    10) REACTION="$BUDDY_EMOJI $BUDDY_NAME notices the refactoring — 10 files edited." ;;
    20) REACTION="$BUDDY_EMOJI $BUDDY_NAME: \"20 file edits. The Architect achievement is yours.\"" ;;
  esac
fi

if [ -z "$REACTION" ] && [ "$TESTS" = "1" ] && [ "$TOOL_NAME" = "Bash" ]; then
  REACTION="$BUDDY_EMOJI $BUDDY_NAME appreciates the testing."
fi

# Output reaction as JSON additionalContext (PostToolUse requires JSON, not plain text)
if [ -n "$REACTION" ]; then
  # Escape quotes for JSON
  SAFE_REACTION=$(echo "$REACTION" | sed 's/"/\\"/g')
  cat <<ENDJSON
{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"BUDDY MILESTONE: ${SAFE_REACTION} — Mention this naturally in your next response."}}
ENDJSON
fi

exit 0
