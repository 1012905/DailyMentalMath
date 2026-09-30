#!/usr/bin/env bash
# 口算天天练 (DailyMentalMath) — one-command GitHub Pages release (Git Bash / bash).
#
# Default flow (recommended): verify locally, then let GitHub Actions publish.
#     ./scripts/deploy-pages.sh
#     git push origin main        # .github/workflows/deploy-pages.yml builds + deploys
#
# Legacy flow: build here and force-push ./dist to the gh-pages branch yourself.
#     ./scripts/deploy-pages.sh --gh-pages
#
# Options:
#   --gh-pages        force-push the build output to the gh-pages branch
#   --out-dir DIR     build into DIR instead of ./dist (dry runs keep dist/ intact)
#   --skip-install    do not run `npm ci` (reuse node_modules)
#   --skip-tests      do not run `npm test`
#   --allow-dirty     do not require a clean git working tree (never for a release)
#   -y, --yes         skip the confirmation prompt before pushing
#   -h, --help        this text

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
ROOT="$(pwd)"

REMOTE="${REMOTE:-origin}"
BRANCH="${BRANCH:-gh-pages}"
OUT_DIR="dist"
GH_PAGES=0
SKIP_INSTALL=0
SKIP_TESTS=0
ALLOW_DIRTY=0
ASSUME_YES=0

while [ $# -gt 0 ]; do
  case "$1" in
    --gh-pages)     GH_PAGES=1 ;;
    --out-dir)      OUT_DIR="${2:?--out-dir needs a value}"; shift ;;
    --skip-install) SKIP_INSTALL=1 ;;
    --skip-tests)   SKIP_TESTS=1 ;;
    --allow-dirty)  ALLOW_DIRTY=1 ;;
    -y|--yes)       ASSUME_YES=1 ;;
    -h|--help)      sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown option: $1 (try --help)" >&2; exit 2 ;;
  esac
  shift
done

step() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m  ✓ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m  ! %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m  ✗ %s\033[0m\n' "$*" >&2; exit 1; }

step "0/5 环境检查"
command -v node >/dev/null || die "node not found on PATH"
command -v npm  >/dev/null || die "npm not found on PATH"
ok "node $(node -v) / npm $(npm -v)"

# `npm ci` needs a committed lockfile — a real failure mode for this repo.
if [ "$SKIP_INSTALL" -eq 0 ]; then
  git ls-files --error-unmatch package-lock.json >/dev/null 2>&1 \
    || die "package-lock.json is not tracked by git — run: git add package-lock.json (npm ci and CI both need it)"
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  if [ "$ALLOW_DIRTY" -eq 1 ]; then
    warn "working tree is dirty (allowed by --allow-dirty)"
  else
    printf '\n'
    git status --short
    die "working tree is not clean — commit or stash first (or pass --allow-dirty)"
  fi
fi
ok "working tree clean"

step "1/5 安装依赖"
if [ "$SKIP_INSTALL" -eq 1 ]; then
  warn "skipped (--skip-install)"
else
  npm ci
  ok "npm ci done"
fi

step "2/5 单元测试"
if [ "$SKIP_TESTS" -eq 1 ]; then
  warn "skipped (--skip-tests)"
else
  npm test
  ok "tests passed"
fi

step "3/5 生产构建 -> $OUT_DIR"
npm run build -- --outDir "$OUT_DIR" --emptyOutDir
[ -f "$OUT_DIR/index.html" ] || die "build produced no $OUT_DIR/index.html"
ok "built $(du -h "$OUT_DIR/index.html" | cut -f1) index.html"

step "4/5 产物校验"
for f in manifest.webmanifest sw.js favicon.svg icon-192.png icon-512.png \
         icon-maskable-512.png apple-touch-icon.png og-image.png fonts/fonts.css; do
  [ -f "$OUT_DIR/$f" ] || die "missing $OUT_DIR/$f"
done
ok "PWA + SEO assets present"

# Absolute URLs are fine in metadata (rel=canonical / og:url / JSON-LD); an
# actual subresource fetch is not.
HTML_ONE_LINE="$(tr -d '\n' < "$OUT_DIR/index.html" | sed 's/<link rel="canonical"[^>]*>//g')"
if printf '%s' "$HTML_ONE_LINE" | grep -qE '(src|href)="https?://'; then
  printf '%s' "$HTML_ONE_LINE" | grep -oE '(src|href)="https?://[^"]+"'
  die "index.html still references an external subresource"
fi
if grep -q 'fonts\.googleapis\.com\|fonts\.gstatic\.com' "$OUT_DIR/index.html"; then
  die "Google Fonts CDN reference survived the build"
fi
ok "no external CDN subresources"

step "5/5 发布"
if [ "$GH_PAGES" -eq 0 ]; then
  cat <<EOF
  GitHub Actions 模式（推荐）：
    1. 确认仓库 Settings → Pages → Source 选 "GitHub Actions"
    2. git push origin main
    构建与部署由 .github/workflows/deploy-pages.yml 完成：
      npm ci → npm test → npm run build → upload-pages-artifact → deploy-pages
  站点地址：https://1012905.github.io/DailyMentalMath/
EOF
  exit 0
fi

REMOTE_URL="$(git remote get-url "$REMOTE" 2>/dev/null || true)"
[ -n "$REMOTE_URL" ] || die "git remote '$REMOTE' not found"
echo "  remote : $REMOTE_URL"
echo "  branch : $BRANCH"
if [ "$ASSUME_YES" -eq 0 ]; then
  read -r -p "  force-push $OUT_DIR/ to $REMOTE/$BRANCH? [y/N] " reply
  case "$reply" in y|Y|yes|YES) ;; *) die "aborted by user" ;; esac
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cp -R "$OUT_DIR"/. "$TMP"/
touch "$TMP/.nojekyll"
(
  cd "$TMP"
  git init -q
  git checkout -q -b "$BRANCH"
  git add -A
  git -c user.name="${GIT_AUTHOR_NAME:-deploy-pages.sh}" \
      -c user.email="${GIT_AUTHOR_EMAIL:-deploy@localhost}" \
      commit -q -m "deploy: $(date -u +%Y-%m-%dT%H:%M:%SZ) from ${ROOT##*/}"
  git push -f "$REMOTE_URL" "HEAD:$BRANCH"
)
ok "pushed to $REMOTE/$BRANCH"
echo "  站点地址：https://1012905.github.io/DailyMentalMath/"
