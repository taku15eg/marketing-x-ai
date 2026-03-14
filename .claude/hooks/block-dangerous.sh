#!/bin/bash
# PreToolUse hook: Block dangerous commands
# Exit 2 = block execution, Exit 0 = allow

INPUT="$TOOL_INPUT"

# Block destructive filesystem operations
if echo "$INPUT" | grep -qE 'rm\s+-rf\s+/|rm\s+-rf\s+/\*'; then
  echo "BLOCKED: Recursive delete of root filesystem"
  exit 2
fi

# Block piping remote content to shell
if echo "$INPUT" | grep -qE 'curl\s+.*\|\s*bash|wget\s+.*\|\s*bash'; then
  echo "BLOCKED: Piping remote content to shell"
  exit 2
fi

# Block direct writes to env files
if echo "$INPUT" | grep -qE '>\s*\.env|>\s*\.env\.local|>\s*\.env\.production'; then
  echo "BLOCKED: Direct write to environment file. Use Edit tool instead."
  exit 2
fi

# Block operations on credential files
if echo "$INPUT" | grep -qE '>\s*.*\.(pem|key|p12|pfx)'; then
  echo "BLOCKED: Write to credential file"
  exit 2
fi

exit 0
