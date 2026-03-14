#!/bin/bash
# PostToolUse hook: Auto-format edited files
# Only runs on files within src/dashboard that have supported extensions

FILEPATH="$TOOL_FILEPATH"

# Skip if no filepath
[ -z "$FILEPATH" ] && exit 0

# Only format dashboard files (where prettier/eslint are available)
case "$FILEPATH" in
  */src/dashboard/*.ts|*/src/dashboard/*.tsx|*/src/dashboard/*.js|*/src/dashboard/*.jsx|*/src/dashboard/*.css|*/src/dashboard/*.json)
    # Check if npx is available and prettier is installed
    if command -v npx &>/dev/null && [ -f "src/dashboard/node_modules/.bin/prettier" ]; then
      npx --prefix src/dashboard prettier --write "$FILEPATH" 2>/dev/null || true
    fi
    ;;
esac

exit 0
