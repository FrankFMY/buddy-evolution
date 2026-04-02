#!/bin/bash
# PostToolUse hook — personality-aware milestone reactions
# Bash for fast startup (~5ms). Tracks session counters, outputs JSON at milestones.

COUNTER_FILE="$HOME/.buddy-evolution/.session-counter"
SOUL_FILE="$HOME/.buddy-evolution/soul.json"

INPUT=$(cat)

# Parse tool info (handle both "key":"val" and "key": "val")
TOOL_NAME=$(echo "$INPUT" | grep -o '"tool_name": *"[^"]*"' | head -1 | sed 's/.*: *"//;s/"//')
FILE_PATH=$(echo "$INPUT" | grep -o '"file_path": *"[^"]*"' | head -1 | sed 's/.*: *"//;s/"//')
CMD=$(echo "$INPUT" | grep -o '"command": *"[^"]*"' | head -1 | sed 's/.*: *"//;s/"//')

# Init counter
if [ ! -f "$COUNTER_FILE" ]; then
  echo '{"tools":0,"edits":0,"tests":0,"reads":0,"rejects":0,"firstFile":"","lastReactedTool":0}' > "$COUNTER_FILE"
fi

# Read counters
TOOLS=$(grep -o '"tools":[0-9]*' "$COUNTER_FILE" | grep -o '[0-9]*')
EDITS=$(grep -o '"edits":[0-9]*' "$COUNTER_FILE" | grep -o '[0-9]*')
TESTS=$(grep -o '"tests":[0-9]*' "$COUNTER_FILE" | grep -o '[0-9]*')
READS=$(grep -o '"reads":[0-9]*' "$COUNTER_FILE" | grep -o '[0-9]*')
REJECTS=$(grep -o '"rejects":[0-9]*' "$COUNTER_FILE" | grep -o '[0-9]*')
FIRST_FILE=$(grep -o '"firstFile":"[^"]*"' "$COUNTER_FILE" | sed 's/.*:"//;s/"//')
LAST_REACTED=$(grep -o '"lastReactedTool":[0-9]*' "$COUNTER_FILE" | grep -o '[0-9]*')

TOOLS=${TOOLS:-0}; EDITS=${EDITS:-0}; TESTS=${TESTS:-0}; READS=${READS:-0}; REJECTS=${REJECTS:-0}; LAST_REACTED=${LAST_REACTED:-0}
TOOLS=$((TOOLS + 1))
IS_TEST=0

case "$TOOL_NAME" in
  Write|Edit)
    EDITS=$((EDITS + 1))
    # Track first file of session
    if [ -z "$FIRST_FILE" ] && [ -n "$FILE_PATH" ]; then
      FIRST_FILE="$FILE_PATH"
    fi
    ;;
  Read) READS=$((READS + 1)) ;;
  Bash)
    if echo "$CMD" | grep -qiE '(jest|vitest|pytest|cargo test|go test|npm test|pnpm test|rspec|mocha)'; then
      TESTS=$((TESTS + 1)); IS_TEST=1
    fi
    ;;
esac

# Check for rejection in tool response
if echo "$INPUT" | grep -q '"is_error": *true\|was rejected\|doesn.t want to proceed'; then
  REJECTS=$((REJECTS + 1))
fi

# Save counters
SAFE_FIRST=$(echo "$FIRST_FILE" | sed 's/"/\\"/g')
echo "{\"tools\":$TOOLS,\"edits\":$EDITS,\"tests\":$TESTS,\"reads\":$READS,\"rejects\":$REJECTS,\"firstFile\":\"$SAFE_FIRST\",\"lastReactedTool\":$LAST_REACTED}" > "$COUNTER_FILE"

# Read buddy identity
BUDDY_NAME="Buddy"; BUDDY_EMOJI=""; PERSONALITY="bold"
if [ -f "$SOUL_FILE" ]; then
  BUDDY_NAME=$(grep -o '"name": *"[^"]*"' "$SOUL_FILE" | head -1 | sed 's/.*: *"//;s/"//')
  BUDDY_EMOJI=$(grep -o '"emoji": *"[^"]*"' "$SOUL_FILE" | head -1 | sed 's/.*: *"//;s/"//')
  PERSONALITY=$(grep -o '"personality": *"[^"]*"' "$SOUL_FILE" | head -1 | sed 's/.*: *"//;s/"//')
fi

B="$BUDDY_EMOJI $BUDDY_NAME"
REACTION=""

# === MILESTONE REACTIONS (personality-aware) ===

# Tool count milestones
case $TOOLS in
  25)
    case $PERSONALITY in
      bold)        REACTION="$B: \"25 tools in. Let's keep this momentum.\"" ;;
      analytical)  REACTION="$B notes: 25 tool calls logged this session." ;;
      playful)     REACTION="$B: \"25 tools! We're just warming up 🔥\"" ;;
      sarcastic)   REACTION="$B: \"Only 25? I expected more by now.\"" ;;
      enthusiastic) REACTION="$B: \"25 tool calls! Great start! Keep going!\"" ;;
      gentle)      REACTION="$B: \"Nice steady pace — 25 calls so far.\"" ;;
      stoic)       REACTION="$B: 25." ;;
      mischievous) REACTION="$B: \"25 already? Didn't even notice, did you?\"" ;;
      protective)  REACTION="$B: \"25 calls — how are you feeling? Hydrated?\"" ;;
      *)           REACTION="$B is watching — 25 tool calls." ;;
    esac ;;
  50)
    case $PERSONALITY in
      bold)        REACTION="$B: \"50. Halfway to Tool Master. Push through.\"" ;;
      analytical)  REACTION="$B: 50 tool calls. Current rate: productive." ;;
      sarcastic)   REACTION="$B: \"50 calls and counting. Your fingers must love this.\"" ;;
      enthusiastic) REACTION="$B: \"50!! You're on FIRE! 🔥\"" ;;
      *)           REACTION="$B nods — 50 tool calls. Building momentum." ;;
    esac ;;
  100)
    case $PERSONALITY in
      bold)        REACTION="$B: \"100. Tool Master territory. This is what we do.\"" ;;
      analytical)  REACTION="$B: 100 tool calls. Tool Master achievement threshold reached." ;;
      sarcastic)   REACTION="$B slow claps: \"100. I'm almost impressed.\"" ;;
      *)           REACTION="$B: 100 tool calls. Serious session." ;;
    esac ;;
  200)
    case $PERSONALITY in
      bold)        REACTION="$B: \"200 calls. This session is legendary.\"" ;;
      protective)  REACTION="$B: \"200 calls... maybe take a quick break?\"" ;;
      *)           REACTION="$B: 200 tool calls. Massive session." ;;
    esac ;;
esac

# Edit milestones
if [ -z "$REACTION" ]; then
  case $EDITS in
    1)
      # First edit of session — mention the file
      if [ -n "$FILE_PATH" ]; then
        BASENAME=$(basename "$FILE_PATH")
        case $PERSONALITY in
          bold)       REACTION="$B: \"First blood — $BASENAME. Let's go.\"" ;;
          analytical) REACTION="$B: Session's first edit — $BASENAME." ;;
          curious)    REACTION="$B: \"Starting with $BASENAME — interesting choice.\"" ;;
          *)          REACTION="$B sees you working on $BASENAME." ;;
        esac
      fi ;;
    10)
      case $PERSONALITY in
        bold)       REACTION="$B: \"10 files. The Architect grind begins.\"" ;;
        analytical) REACTION="$B: 10 file edits. 10 more for The Architect." ;;
        *)          REACTION="$B notices the refactoring — 10 files edited." ;;
      esac ;;
    20)
      case $PERSONALITY in
        bold)       REACTION="$B: \"20 edits. The Architect is YOURS. Take it.\"" ;;
        enthusiastic) REACTION="$B: \"🏆 20 FILE EDITS! THE ARCHITECT!!!\"" ;;
        *)          REACTION="$B: 20 file edits — The Architect achievement!" ;;
      esac ;;
  esac
fi

# First test of session
if [ -z "$REACTION" ] && [ "$IS_TEST" = "1" ] && [ "$TESTS" = "1" ]; then
  case $PERSONALITY in
    bold)       REACTION="$B: \"Tests. Good. Ship with confidence.\"" ;;
    analytical) REACTION="$B: First test run detected this session." ;;
    sarcastic)  REACTION="$B: \"Oh look, tests. How responsible of you.\"" ;;
    *)          REACTION="$B appreciates the testing." ;;
  esac
fi

# Rejection streak (3+ in a row without reaction)
if [ -z "$REACTION" ] && [ "$REJECTS" -ge 3 ] && [ $((TOOLS - LAST_REACTED)) -ge 5 ]; then
  case $PERSONALITY in
    bold)       REACTION="$B: \"Hitting walls? Good. That's where breakthroughs happen.\"" ;;
    gentle)     REACTION="$B: \"Some resistance — that's okay. You'll get through it.\"" ;;
    sarcastic)  REACTION="$B: \"$REJECTS rejections. The code is fighting back.\"" ;;
    protective) REACTION="$B: \"$REJECTS rejected calls — deep breath. You've got this.\"" ;;
    *)          REACTION="$B: $REJECTS rejected calls but still going. Persistence." ;;
  esac
  LAST_REACTED=$TOOLS
fi

# Avoid reacting too often (minimum 12 tool calls between non-milestone reactions)
if [ -n "$REACTION" ] && [ $((TOOLS - LAST_REACTED)) -lt 12 ]; then
  # Always allow: tool count milestones, first edit, first test, rejections
  IS_PRIORITY=0
  case $TOOLS in 25|50|100|200) IS_PRIORITY=1 ;; esac
  case $EDITS in 1|10|20) IS_PRIORITY=1 ;; esac
  [ "$IS_TEST" = "1" ] && [ "$TESTS" = "1" ] && IS_PRIORITY=1
  [ "$REJECTS" -ge 3 ] && IS_PRIORITY=1
  [ "$IS_PRIORITY" = "0" ] && REACTION=""
fi

# Update lastReactedTool if we're reacting
if [ -n "$REACTION" ]; then
  LAST_REACTED=$TOOLS
  echo "{\"tools\":$TOOLS,\"edits\":$EDITS,\"tests\":$TESTS,\"reads\":$READS,\"rejects\":$REJECTS,\"firstFile\":\"$SAFE_FIRST\",\"lastReactedTool\":$LAST_REACTED}" > "$COUNTER_FILE"

  # Output to BOTH stderr (user sees in terminal) AND stdout JSON (Claude sees in context)
  echo "$REACTION" >&2

  SAFE_REACTION=$(echo "$REACTION" | sed 's/"/\\"/g')
  cat <<ENDJSON
{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"BUDDY REACTION: ${SAFE_REACTION} — Weave this naturally into your next response."}}
ENDJSON
fi

exit 0
