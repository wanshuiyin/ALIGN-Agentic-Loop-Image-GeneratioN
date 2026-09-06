#!/usr/bin/env bash
set -euo pipefail

# Render the eight views + the full scroll into $1 (default review/).
# view-left = the colophon and 漢陽 shops; view-qingchuan = 晴川閣 and 龜山.
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
out_dir=${1:-review}
mkdir -p -- "$out_dir"
out_dir="$(cd -- "$out_dir" && pwd -P)"

find_browser() {
  local candidate resolved

  if [[ -n "${BROWSER_BIN:-}" ]]; then
    if [[ -x "$BROWSER_BIN" ]]; then
      printf '%s\n' "$BROWSER_BIN"
      return
    fi
    if resolved="$(command -v "$BROWSER_BIN" 2>/dev/null)"; then
      printf '%s\n' "$resolved"
      return
    fi
    printf 'BROWSER_BIN is not executable: %s\n' "$BROWSER_BIN" >&2
    return 1
  fi

  for candidate in microsoft-edge-stable microsoft-edge msedge google-chrome-stable google-chrome chromium chromium-browser; do
    if resolved="$(command -v "$candidate" 2>/dev/null)"; then
      printf '%s\n' "$resolved"
      return
    fi
  done

  for candidate in \
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
    "/c/Program Files/Microsoft/Edge/Application/msedge.exe" \
    "/c/Program Files/Google/Chrome/Application/chrome.exe" \
    "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"; do
    if [[ -x "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return
    fi
  done

  printf 'No Chromium browser found. Set BROWSER_BIN to an Edge, Chrome, or Chromium executable.\n' >&2
  return 1
}

browser_bin="$(find_browser)"
page="$script_dir/qingming-wuhan-preview.html"
if [[ ! -f "$page" ]]; then
  printf 'Missing page: %s\nRun tools_assemble.sh first.\n' "$page" >&2
  exit 1
fi

profile_dir="$(mktemp -d "$out_dir/.chromium-profile.XXXXXX")"
cleanup_profile() {
  rm -rf -- "$profile_dir" 2>/dev/null || true
}
trap cleanup_profile EXIT

virtual_time_budget=${VIRTUAL_TIME_BUDGET_MS:-240000}
render_timeout=${RENDER_TIMEOUT_SECONDS:-360}
if [[ ! "$virtual_time_budget" =~ ^[1-9][0-9]*$ ]]; then
  printf 'VIRTUAL_TIME_BUDGET_MS must be a positive integer: %s\n' "$virtual_time_budget" >&2
  exit 2
fi
if [[ ! "$render_timeout" =~ ^[1-9][0-9]*$ ]]; then
  printf 'RENDER_TIMEOUT_SECONDS must be a positive integer: %s\n' "$render_timeout" >&2
  exit 2
fi

browser_profile=$profile_dir
if command -v cygpath >/dev/null 2>&1; then
  page_url="file:///$(cygpath -m "$page")"
  browser_profile="$(cygpath -w "$profile_dir")"
else
  page_url="file://$page"
fi

render() {
  local name=$1 hash=$2 size=$3
  local output="$out_dir/$name.png"
  local output_tmp="$output.tmp.$$"
  local browser_output=$output_tmp
  local browser_log="$output_tmp.log"
  local waited=0 wait_limit=$((render_timeout * 10))

  if command -v cygpath >/dev/null 2>&1; then
    browser_output="$(cygpath -w "$output_tmp")"
  fi

  if ! "$browser_bin" --headless=new --disable-gpu --hide-scrollbars --no-first-run \
    --user-data-dir="$browser_profile" \
    --window-size="$size" --virtual-time-budget="$virtual_time_budget" \
    --screenshot="$browser_output" "$page_url#$hash" >"$browser_log" 2>&1; then
    printf 'Browser render failed for %s.\n' "$name" >&2
    cat -- "$browser_log" >&2
    rm -f -- "$output_tmp" "$browser_log"
    return 1
  fi

  # Windows GUI executables can return control to Git Bash before the headless
  # child writes its screenshot. Wait for the promised artifact, with a cap.
  while [[ ! -s "$output_tmp" && "$waited" -lt "$wait_limit" ]]; do
    sleep 0.1
    waited=$((waited + 1))
  done

  if [[ ! -s "$output_tmp" ]]; then
    printf 'Browser reported success but did not create %s within %s seconds.\n' "$output_tmp" "$render_timeout" >&2
    cat -- "$browser_log" >&2
    rm -f -- "$output_tmp" "$browser_log"
    return 1
  fi
  rm -f -- "$browser_log"
  mv -- "$output_tmp" "$output"
  printf 'Rendered %s\n' "$output"
}

render view-bridge       "p=1&cam=0.577" 1000,700
render view-right        "p=1&cam=1"     1000,700
render view-hubuxiang    "p=1&cam=0.901" 1000,700
render view-hanzhengjie  "p=1&cam=0.259" 1000,700
render view-jianghanguan "p=1&cam=0.145" 1000,700
render view-left         "p=1&cam=0"     1000,700
render view-huanghelou   "p=1&cam=0.727" 1000,700
render view-qingchuan    "p=1&cam=0.465" 1000,700
render full              "full=1"        5300,560
