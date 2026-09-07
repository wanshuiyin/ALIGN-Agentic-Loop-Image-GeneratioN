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
# Edge can keep its regular profile running after a headless screenshot.
case "${browser_bin##*/}" in
  *[Ee]dge*) private_mode=--inprivate ;;
  *)        private_mode=--incognito ;;
esac
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
if [[ ! "$virtual_time_budget" =~ ^[1-9][0-9]*$ ]]; then
  printf 'VIRTUAL_TIME_BUDGET_MS must be a positive integer: %s\n' "$virtual_time_budget" >&2
  exit 2
fi
browser_profile=$profile_dir
if command -v cygpath >/dev/null 2>&1; then
  page_url="file:///$(cygpath -m "$page")"
  browser_profile="$(cygpath -w "$profile_dir")"
else
  page_url="file://$page"
fi

run_browser() {
  if command -v cygpath >/dev/null 2>&1; then
    # Start-Process -Wait waits for Windows GUI applications and their children.
    # Quote each native argument so paths containing spaces stay together.
    local browser_arguments
    printf -v browser_arguments '"%s" ' "$@"
    ALIGN_RENDER_BROWSER="$(cygpath -w "$browser_bin")" \
    ALIGN_RENDER_ARGUMENTS="$browser_arguments" \
      powershell.exe -NoLogo -NoProfile -NonInteractive -Command '
        $ErrorActionPreference = "Stop"
        $process = Start-Process -FilePath $env:ALIGN_RENDER_BROWSER -ArgumentList $env:ALIGN_RENDER_ARGUMENTS -Wait -PassThru
        exit $process.ExitCode
      '
  else
    "$browser_bin" "$@"
  fi
}

render() {
  local name=$1 hash=$2 size=$3
  local output="$out_dir/$name.png"
  local output_tmp="$out_dir/$name.tmp.$$.png"
  local browser_output=$output_tmp
  local browser_log="$output_tmp.log"

  if command -v cygpath >/dev/null 2>&1; then
    browser_output="$(cygpath -w "$output_tmp")"
  fi

  if ! run_browser --headless=new --disable-gpu --hide-scrollbars --no-first-run "$private_mode" \
    --user-data-dir="$browser_profile" \
    --window-size="$size" --virtual-time-budget="$virtual_time_budget" \
    --screenshot="$browser_output" "$page_url#$hash" >"$browser_log" 2>&1; then
    printf 'Browser render failed for %s.\n' "$name" >&2
    cat -- "$browser_log" >&2
    rm -f -- "$output_tmp" "$browser_log"
    return 1
  fi

  if [[ ! -s "$output_tmp" ]]; then
    printf 'Browser exited without creating a screenshot for %s.\n' "$name" >&2
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
