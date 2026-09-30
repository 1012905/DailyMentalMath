#!/usr/bin/env python3
"""Fetch + vendor the webfonts used by 口算天天练 (DailyMentalMath).

Why this script exists
----------------------
`index.html` used to pull Inter / Noto Sans SC from fonts.googleapis.com. The web
build must work fully offline (GitHub Pages + PWA), so the fonts are downloaded
once and committed under `public/fonts/`.

Why `text=` instead of the default unicode-range slices
-------------------------------------------------------
Google serves Noto Sans SC as ~101 unicode-range slices (~5 MB total). Rendering
this app's 360-odd Chinese characters spans 24 of those slices, i.e. ~1.29 MB of
woff2 before the first paragraph is painted. Passing the app's exact character
set through the `text=` parameter makes Google emit a single variable woff2 that
is ~10x smaller (~122 kB) and covers every string the app can display.

The generated CSS carries **no unicode-range**, so a character that is not in the
subset simply falls through to the next family in the stack (see `--font-sans`
in `src/styles/tokens.css`: system-ui / PingFang SC / Microsoft YaHei). Missing
glyphs therefore degrade to the system CJK face — never tofu.

Usage
-----
    python scripts/fetch-fonts.py            # (re)generate public/fonts/*
    python scripts/fetch-fonts.py --check    # report only, no writes

Re-run this whenever Chinese copy is added to `src/` — the subset is derived from
the source tree, so new strings need a new run. `npm run fonts` wraps it.

Requires network access (fonts.googleapis.com / fonts.gstatic.com) and `curl`
on PATH (curl is only a fallback for environments where urllib is blocked).
"""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "src"
OUT_DIR = ROOT / "public" / "fonts"
INDEX_HTML = ROOT / "index.html"

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
CSS_URL = "https://fonts.googleapis.com/css2?family={family}&display=swap&text={text}"

CJK_RANGES = (
    (0x2E80, 0x2EFF),   # CJK Radicals Supplement
    (0x3000, 0x303F),   # CJK punctuation （）《》、。
    (0x3040, 0x30FF),   # kana (harmless, keeps the scope honest)
    (0x3400, 0x4DBF),   # CJK Ext A
    (0x4E00, 0x9FFF),   # CJK Unified Ideographs
    (0xF900, 0xFAFF),   # CJK Compatibility Ideographs
    (0xFE30, 0xFE4F),   # CJK Compatibility Forms
    (0xFF00, 0xFFEF),   # Halfwidth and Fullwidth Forms （１２３ＡＢＣ）
)

# Ranges Inter genuinely covers: Latin-1/Extended, general punctuation,
# currency, letterlike symbols, arrows and math operators. Everything else
# non-ASCII (CJK, box drawing, dingbats, emoji) is offered to Noto Sans SC,
# which silently ignores whatever it does not have — same as the CDN did.
INTER_RANGES = (
    (0x00A0, 0x024F),
    (0x0250, 0x02FF),
    (0x0300, 0x036F),
    (0x1E00, 0x1EFF),
    (0x2000, 0x206F),
    (0x2070, 0x209F),
    (0x20A0, 0x20BF),
    (0x2100, 0x214F),
    (0x2190, 0x21FF),
    (0x2200, 0x22FF),
    (0x2C60, 0x2C7F),
    (0xA720, 0xA7FF),
)

# Always shipped as UI punctuation the runtime can produce even if it is not a
# literal in the source (dates, counts, operators, ellipsis).
EXTRA_PUNCT = "…—–·×÷°±≈≤≥≠√∞→←↑↓•“”‘’「」『』（）【】《》、，。！？：；·"

# Insurance against Chinese copy that did not exist in `src/` when this script
# last ran: common 教学/UI vocabulary. Costs a few kB; prevents a new word from
# falling back to the system face.
SAFETY_HANZI = (
    "一二三四五六七八九十百千万亿零两半双单个把只条张次遍些每多少更最太真很挺"
    "练习题目答案计算口算心算加减乘除运算法则结果正误对错分数成绩统计记录历史"
    "时间秒分钟时小时平均速度准确正确错误连续连击累计总共合计排名榜单排行第一"
    "开始结束暂停继续重来再来重新下一上一返回退出关闭提交确认取消保存清除重置"
    "设置选项开关主题主题色颜色深浅亮暗语言中文英文简体繁体帮助关于版本更新"
    "挑战每日今日昨天明天本周上周本月年度日历年月日星期周天早中晚夜上午下午"
    "成就徽章解锁奖励进度目标完成度等级经验星级收藏分享邀请好友加入注册登录"
    "网络离线在线安装升级提示警告错误失败成功完成进行中等待加载中暂无数据空"
    "简简单单难难度容易简单普通困难极限挑战模式自由限时冲刺错题重练复习巩固"
    "题库随机生成抽取抽样检验规律技巧方法思路步骤过程讲解演示例子图示表格图表"
    "键盘输入点击触碰按下滑动屏幕手机电脑平板浏览器网页桌面客户端应用程序"
    "速度提升提高降低减少增加变快变慢稳定保持达到超过不足剩余还有需要必须"
    "秒表计时倒计时提醒通知音效声音震动动画效果过渡渐变阴影圆角边框间距行高"
    "字号字体粗体细体斜体下划线居中左右对齐顶部底部中间内容标题副标题说明"
    "孩子学生家长老师小朋友年级学校课程作业课堂练习册每日天天坚持习惯"
)

FACE_TMPL = """@font-face {{
  font-family: '{family}';
  font-style: normal;
  font-weight: {weight};
  font-display: swap;
  src: url('./{filename}') format('woff2');
}}
"""


def collect_charset() -> tuple[set[str], set[str]]:
    """(every char the bundled app can render, non-ASCII chars only)"""
    chars: set[str] = set()
    for pattern in ("*.js", "*.jsx", "*.css", "*.html"):
        targets = list(SRC_DIR.rglob(pattern))
        if pattern == "*.html":
            targets.append(INDEX_HTML)
        for path in targets:
            try:
                chars.update(path.read_text(encoding="utf-8"))
            except (OSError, UnicodeDecodeError):
                continue
    non_ascii = {c for c in chars if ord(c) > 0x7F}
    return chars, non_ascii


def in_cjk_scope(ch: str) -> bool:
    cp = ord(ch)
    return any(lo <= cp <= hi for lo, hi in CJK_RANGES)


def in_inter_scope(ch: str) -> bool:
    cp = ord(ch)
    return 0x20 <= cp <= 0x7E or any(lo <= cp <= hi for lo, hi in INTER_RANGES)


def build_texts() -> tuple[str, str]:
    """Return (inter_text, noto_text) — the `text=` payload for each family."""
    _, non_ascii = collect_charset()
    inter = {chr(c) for c in range(0x20, 0x7F)} | set(EXTRA_PUNCT)
    inter |= {c for c in non_ascii if in_inter_scope(c)}
    # Everything non-ASCII is also offered to Noto Sans SC: it carries the CJK
    # surface plus the monochrome symbols (✅ ❌ ➕ ✖ ─ ▸ …) that Google's CDN
    # served from this family before, and it silently ignores the rest (emoji
    # live in the system emoji font either way).
    noto = set(non_ascii) | set(SAFETY_HANZI)
    return "".join(sorted(inter)), "".join(sorted(noto))


def http_get(url: str, timeout: int = 120) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def download(url: str, timeout: int = 120) -> bytes:
    """urllib first, `curl` as a fallback (some proxies break urllib)."""
    try:
        return http_get(url, timeout)
    except (urllib.error.URLError, OSError, TimeoutError) as exc:
        if not shutil.which("curl"):
            raise
        print(f"    urllib failed ({exc}); retrying with curl", file=sys.stderr)
        proc = subprocess.run(
            ["curl", "-fsSL", "-m", str(timeout), "-A", UA, url],
            capture_output=True,
        )
        if proc.returncode != 0:
            raise RuntimeError(
                f"curl failed for {url}: {proc.stderr.decode('utf-8', 'replace')[:300]}"
            )
        return proc.stdout


def fetch_face(family_query: str, text: str) -> tuple[str, str]:
    """Resolve the css2 entry for `family_query` + `text` to (woff2 url, weight)."""
    url = CSS_URL.format(family=family_query, text=urllib.parse.quote(text, safe=""))
    css = http_get(url).decode("utf-8")
    faces = re.findall(
        r"@font-face\s*\{(.*?)\}", css, re.S
    )
    if not faces:
        raise RuntimeError(f"no @font-face returned for {family_query}")
    src = re.search(r"url\((https://[^)]+)\)\s*format\('woff2'\)", faces[0])
    weight = re.search(r"font-weight:\s*([^;]+);", faces[0])
    if not src:
        raise RuntimeError(f"no woff2 url in response for {family_query}")
    return src.group(1), (weight.group(1).strip() if weight else "400")


def verify_coverage() -> int:
    """Assert the generated woff2 actually contain every char in src/.

    Needs `fonttools` + `brotli` (verification-only, not a project dependency):
        python -m pip install fonttools brotli
    """
    try:
        from fontTools.ttLib import TTFont  # noqa: PLC0415
    except ImportError:
        print("fonttools not installed — skipping cmap verification", file=sys.stderr)
        return 0

    chars, _ = collect_charset()
    covered: set[int] = set()
    for name in ("inter-var-subset.woff2", "noto-sans-sc-subset.woff2"):
        path = OUT_DIR / name
        if not path.exists():
            print(f"MISSING FILE: {path}", file=sys.stderr)
            return 1
        font = TTFont(path, lazy=True)
        covered |= set(font.getBestCmap())
        font.close()

    ignore = {0x09, 0x0A, 0x0D, 0x20, 0xFE0F, 0x200D, 0x20E3}
    missing = sorted(
        {c for c in chars if ord(c) not in covered and ord(c) not in ignore}
    )
    emoji = {c for c in missing if ord(c) >= 0x1F000 or unicodedata_category(c) == "So"}
    if missing:
        print(f"NOT covered by the vendored fonts ({len(missing)}):")
        for ch in missing:
            print(f"  U+{ord(ch):04X}  {ch}  {'(symbol/emoji → system fallback)' if ch in emoji else ''}")
    hard = [c for c in missing if c not in emoji]
    if hard:
        print(f"!! {len(hard)} text character(s) are NOT in the subset — re-run without "
              f"--check, or extend SAFETY_HANZI.", file=sys.stderr)
        return 1
    print(f"OK: every text character used by src/ is present "
          f"({len(chars) - len(missing)}/{len(chars)}; "
          f"{len(emoji)} symbol/emoji left to the system font, as before)")
    return 0


def unicodedata_category(ch: str) -> str:
    import unicodedata  # noqa: PLC0415

    return unicodedata.category(ch)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="report only, do not write files")
    ap.add_argument("--verify", action="store_true",
                    help="check the vendored woff2 cover every char in src/ (needs fonttools)")
    args = ap.parse_args()

    if args.verify:
        return verify_coverage()

    inter_text, noto_text = build_texts()
    _, non_ascii = collect_charset()
    print(f"source: {len(non_ascii)} distinct non-ASCII chars in src/ + index.html")
    print(f"text= payload: Inter {len(inter_text)} chars, Noto Sans SC {len(noto_text)} chars")

    plan = [
        ("Inter", "Inter:wght@100..900", inter_text, "inter-var-subset.woff2"),
        ("Noto Sans SC", "Noto+Sans+SC:wght@100..900", noto_text, "noto-sans-sc-subset.woff2"),
    ]

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    css_out = [
        "/* Self-hosted webfonts for 口算天天练 (DailyMentalMath).",
        " * Generated by `npm run fonts` (scripts/fetch-fonts.py) — do not edit by hand.",
        " * Source: Google Fonts, variable weight axis 100-900, subset to the exact",
        " * character set used by src/ (plus a common-hanzi safety margin).",
        " * Every url() below is relative, so the site works offline and under a",
        " * GitHub Pages project sub-path. Missing glyphs fall through to the next",
        " * family in --font-sans (system CJK), never to tofu. */",
        "",
    ]

    failures: list[str] = []
    total = 0
    for family, query, text, filename in plan:
        print(f"[{family}] resolving css2 …")
        try:
            url, weight = fetch_face(query, text)
        except Exception as exc:  # noqa: BLE001
            failures.append(f"{family}: css2 lookup failed: {exc}")
            print(f"    !! FAILED css lookup: {exc}", file=sys.stderr)
            continue

        dest = OUT_DIR / filename
        if dest.exists() and dest.stat().st_size > 0 and not args.check:
            print(f"    {filename} already present ({dest.stat().st_size / 1024:.1f} kB), refreshing")
        try:
            data = download(url)
        except Exception as exc:  # noqa: BLE001
            failures.append(f"{family}: download failed: {exc}")
            print(f"    !! FAILED download: {exc}", file=sys.stderr)
            continue

        if len(data) < 1000:
            failures.append(f"{family}: suspiciously small payload ({len(data)} B)")
            print(f"    !! FAILED: payload only {len(data)} B", file=sys.stderr)
            continue

        if args.check:
            print(f"    would write {filename}  {len(data) / 1024:.1f} kB")
        else:
            dest.write_bytes(data)
            print(f"    wrote {filename}  {len(data) / 1024:.1f} kB  (weight {weight})")
        total += len(data)
        css_out.append(FACE_TMPL.format(family=family, weight=weight, filename=filename))

    if not args.check and not failures:
        (OUT_DIR / "fonts.css").write_text(
            "\n".join(css_out).rstrip() + "\n", encoding="utf-8"
        )
        print(f"\nwrote public/fonts/fonts.css — {total / 1024:.1f} kB of woff2")

    if failures:
        print("FAILURES:\n  " + "\n  ".join(failures), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
