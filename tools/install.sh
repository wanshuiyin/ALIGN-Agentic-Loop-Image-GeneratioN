#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: bash tools/install.sh <claude|codex> <project-directory>

Link both ALIGN skills into a project's skill directory:
  bash tools/install.sh claude ~/your-project   # .claude/skills/
  bash tools/install.sh codex ~/your-project    # .agents/skills/

Use ~ as the project directory to install for all your projects.
Keep the ALIGN checkout: git pull updates the linked skills.
EOF
}

if [[ "${1:-}" == --help || "${1:-}" == -h ]]; then
  usage
  exit 0
fi
if [[ $# -ne 2 || -z "$2" ]]; then
  usage >&2
  exit 2
fi

case "$1" in
  claude) source_dir=skills; target_dir=.claude/skills; suffix='' ;;
  codex) source_dir=skills_codex; target_dir=.agents/skills; suffix=-codex ;;
  *) usage >&2; exit 2 ;;
esac

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
mkdir -p -- "$2"
project_root="$(cd -- "$2" && pwd -P)"
destination="$project_root/$target_dir"

# Check for existing skills before creating either link.
for task in reference-art-loop method-figure-loop; do
  source_path="$repo_root/$source_dir/$task$suffix"
  target_path="$destination/$task$suffix"
  if [[ ! -f "$source_path/SKILL.md" ]]; then
    printf 'Missing skill: %s/SKILL.md\nRun this installer from a complete ALIGN checkout.\n' "$source_path" >&2
    exit 1
  fi
  if [[ -L "$target_path" && "$target_path" -ef "$source_path" ]]; then
    continue
  fi
  if [[ -e "$target_path" || -L "$target_path" ]]; then
    printf 'Already exists: %s\nMove it aside before installing the ALIGN skill here.\n' "$target_path" >&2
    exit 1
  fi
done

mkdir -p -- "$destination"
for task in reference-art-loop method-figure-loop; do
  source_path="$repo_root/$source_dir/$task$suffix"
  target_path="$destination/$task$suffix"
  if [[ -L "$target_path" && "$target_path" -ef "$source_path" ]]; then
    printf 'Already linked: %s\n' "$target_path"
  else
    ln -s -- "$source_path" "$target_path"
    printf 'Linked: %s -> %s\n' "$target_path" "$source_path"
  fi
done
