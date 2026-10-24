#!/usr/bin/env bash
# Run every Timbre gate: the build check, the unit tests, the MCP server's tests, then the browser
# gates one at a time (each launches one headless browser and closes its whole process tree when
# done): levels, loops (every bed's seamless loop), page, copy, and the MCP kit check (a generated kit
# renders what Copy renders).
#
#   bash gates/run_all.sh
#
# On a machine where browser jobs must queue, set TIMBRE_BROWSER_WRAP to a command prefix that
# waits for the queue and then runs the command, for example:
#   TIMBRE_BROWSER_WRAP="node /path/to/guard_wait.mjs 1800 600" bash gates/run_all.sh
set -u
cd "$(dirname "$0")/.."
WRAP=${TIMBRE_BROWSER_WRAP:-}
fail=0
step() {
  echo
  echo "== $*"
  "$@" || { echo "!! failed: $*"; fail=1; }
}
step node build.mjs --check
step node --test --test-reporter=spec gates/build.test.mjs gates/copy.test.mjs gates/core.test.mjs gates/wav.test.mjs gates/voice.test.mjs gates/website.test.mjs
step npm test --prefix mcp-server
for g in gates/check_levels.mjs gates/check_loops.mjs gates/check_page.mjs gates/check_copy.mjs mcp-server/scripts/check_kit.mjs; do
  # shellcheck disable=SC2086  # WRAP is a command prefix and must split into words
  step $WRAP node "$g"
done
# the level gate rewrites catalog/levels.json when a measurement changed: the manifest embeds it
if ! node build.mjs --check >/dev/null 2>&1; then
  echo
  echo "!! catalog/levels.json changed: run node build.mjs and commit catalog/"
  fail=1
fi
echo
if [ "$fail" -eq 0 ]; then echo "all gates passed"; else echo "some gates FAILED"; fi
exit "$fail"
