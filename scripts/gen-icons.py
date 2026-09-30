#!/usr/bin/env python3
"""Generate every icon + the social card for 口算天天练 (DailyMentalMath).

Design language (must stay in sync with src/styles/tokens.css):
    暖纸感浅色底 #FBF7F0  ·  浓墨黑 #1A1714  ·  单一朱红强调 #E4572E
    secondary: 成功 #2F9E6B  ·  错误 #D64545

Everything is drawn from scratch with Pillow — nothing is downloaded. The mark is
a geometric division sign (two dots + a rounded bar), so no font is required for
the icon; the social card does need a CJK face and looks for the same typeface
the web app self-hosts (Noto Sans SC), then for the usual Windows fallbacks.

Usage
-----
    python scripts/gen-icons.py              # write public/*.png + public/favicon.svg
    python scripts/gen-icons.py --preview    # also write icons-preview.png (design review)
    npm run icons                            # wrapper

Outputs
-------
    public/favicon.svg            vector source (hand-authored below, 512 viewBox)
    public/favicon-32.png         32x32   browser tab
    public/apple-touch-icon.png   180x180 iOS home screen (full-bleed square, iOS masks it)
    public/icon-192.png           192x192 PWA "any"
    public/icon-512.png           512x512 PWA "any"
    public/icon-maskable-512.png  512x512 PWA "maskable" (mark inside the 80% safe zone)
    public/og-image.png           1200x630 Open Graph / Twitter card
"""

from __future__ import annotations

import argparse
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"

# --------------------------------------------------------------------------- #
# palette
# --------------------------------------------------------------------------- #
PAPER = (251, 247, 240, 255)        # #FBF7F0
INK = (26, 23, 20, 255)             # #1A1714
VERMILION = (228, 87, 46, 255)      # #E4572E
OK = (47, 158, 107, 255)            # #2F9E6B
BAD = (214, 69, 69, 255)            # #D64545

SS = 4  # supersampling factor

# --------------------------------------------------------------------------- #
# mark geometry, expressed in fractions of the mark box
# --------------------------------------------------------------------------- #
DOT_R = 0.146          # dot radius
DOT_DY = 0.316         # dot centre offset from the mark centre
BAR_HALF_H = 0.076     # half thickness of the bar
BAR_HALF_W = 0.455     # half length of the bar


def draw_divide_mark(d: ImageDraw.ImageDraw, cx: float, cy: float, size: float, color) -> None:
    """Geometric ÷ centred on (cx, cy) inside a box of `size`."""
    r = DOT_R * size
    for sign in (-1, 1):
        y = cy + sign * DOT_DY * size
        d.ellipse((cx - r, y - r, cx + r, y + r), fill=color)
    h = BAR_HALF_H * size
    w = BAR_HALF_W * size
    d.rounded_rectangle((cx - w, cy - h, cx + w, cy + h), radius=h, fill=color)


def rounded_tile(pixel_size: int, radius_ratio: float, fill) -> Image.Image:
    """RGBA image of a rounded square, `pixel_size` px on a side (already scaled)."""
    img = Image.new("RGBA", (pixel_size, pixel_size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle(
        (0, 0, pixel_size - 1, pixel_size - 1),
        radius=radius_ratio * pixel_size,
        fill=fill,
    )
    return img


def icon_image(size: int, *, style: str = "any") -> Image.Image:
    """The app tile.

    style="any"       rounded paper tile + thick vermilion keyline + ink ÷, with
                      transparent corners (browser tab, PWA "any" icon).
    style="maskable"  full-bleed paper square with the same keyline and mark
                      inside the 80% safe zone — the platform applies its own
                      mask, so rounded corners here would show as dark notches.
                      Also used for apple-touch-icon (iOS masks it too).
    style="solid"     inverted: vermilion tile + paper ÷. Used on the social
                      card, where it has to hold its own against paper.
    """
    px = size * SS

    if style == "solid":
        img = rounded_tile(px, 0.225, VERMILION)
        d = ImageDraw.Draw(img)
        draw_divide_mark(d, px / 2, px / 2, 0.62 * px, PAPER)
        return img.resize((size, size), Image.LANCZOS)

    if style == "maskable":
        img = Image.new("RGBA", (px, px), PAPER)
        d = ImageDraw.Draw(img)
        ring = 0.030 * px
        d.rounded_rectangle(
            (ring, ring, px - 1 - ring, px - 1 - ring),
            radius=0.20 * px,
            outline=VERMILION,
            width=int(0.052 * px),
        )
        draw_divide_mark(d, px / 2, px / 2, 0.44 * px, INK)
        return img.resize((size, size), Image.LANCZOS)

    img = rounded_tile(px, 0.225, PAPER)
    d = ImageDraw.Draw(img)
    ring = 0.052 * px
    d.rounded_rectangle(
        (ring, ring, px - 1 - ring, px - 1 - ring),
        radius=0.185 * px,
        outline=VERMILION,
        width=int(0.075 * px),
    )
    draw_divide_mark(d, px / 2, px / 2, 0.50 * px, INK)
    return img.resize((size, size), Image.LANCZOS)


FAVICON_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img"
     aria-label="口算天天练">
  <title>口算天天练</title>
  <!-- 暖纸感底 #FBF7F0 + 朱红强调 #E4572E + 浓墨黑 #1A1714 · 几何除号 -->
  <rect x="0" y="0" width="512" height="512" rx="115" fill="#FBF7F0"/>
  <rect x="27" y="27" width="458" height="458" rx="95" fill="none"
        stroke="#E4572E" stroke-width="38"/>
  <circle cx="256" cy="174" r="37" fill="#1A1714"/>
  <rect x="23" y="217" width="466" height="39" rx="19" fill="#1A1714"/>
  <circle cx="256" cy="338" r="37" fill="#1A1714"/>
</svg>
"""


# --------------------------------------------------------------------------- #
# fonts for the social card
# --------------------------------------------------------------------------- #
CJK_FONT_CANDIDATES = (
    r"C:\Windows\Fonts\NotoSansSC-VF.ttf",
    r"C:\Windows\Fonts\msyhbd.ttc",
    r"C:\Windows\Fonts\msyh.ttc",
    r"C:\Windows\Fonts\simhei.ttf",
    r"C:\Windows\Fonts\Dengb.ttf",
    r"C:\Windows\Fonts\Deng.ttf",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    "/System/Library/Fonts/PingFang.ttc",
)
LATIN_FONT_CANDIDATES = (
    r"C:\Windows\Fonts\segoeuib.ttf",
    r"C:\Windows\Fonts\arialbd.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
)


def load_font(candidates, size: int, *, variable_weight: str | None = None) -> ImageFont.FreeTypeFont:
    for path in candidates:
        if not Path(path).exists():
            continue
        font = ImageFont.truetype(path, size)
        if variable_weight:
            try:
                font.set_variation_by_name(variable_weight)
            except Exception:  # noqa: BLE001 - not a variable font, fine
                pass
        return font
    raise SystemExit(
        "no CJK-capable font found; edit CJK_FONT_CANDIDATES in scripts/gen-icons.py"
    )


def og_image() -> Image.Image:
    W, H = 1200, 630
    img = Image.new("RGBA", (W * 2, H * 2), PAPER)
    d = ImageDraw.Draw(img, "RGBA")

    # --- warm paper wash: soft vermilion glow bottom-right, paper-deep top-left
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((W * 1.05, H * 0.95, W * 2.30, H * 2.10), fill=(228, 87, 46, 30))
    glow = glow.filter(ImageFilter.GaussianBlur(90))
    img = Image.alpha_composite(img, glow)
    d = ImageDraw.Draw(img, "RGBA")

    # --- faint equation wallpaper (character, not noise)
    eq_font = load_font(CJK_FONT_CANDIDATES, 96, variable_weight="Bold")
    for text, (x, y), color in (
        ("25 + 37", (430, 22), (228, 87, 46, 20)),
        ("12 × 4", (905, 118), (26, 23, 20, 14)),
        ("96 ÷ 3", (880, 430), (26, 23, 20, 14)),
    ):
        d.text((x * 2, y * 2), text, font=eq_font, fill=color)

    # --- app mark, top-left
    mark_box = 138
    mark = icon_image(mark_box, style="solid")
    img.alpha_composite(mark, (88 * 2, 82 * 2))

    tx = 88 * 2
    # --- eyebrow, vertically centred on the mark
    small = load_font(CJK_FONT_CANDIDATES, 32, variable_weight="Medium")
    d.text(
        (tx + (mark_box + 28) * 2, (82 + mark_box / 2) * 2 - 40),
        "100 以内 · 心算训练",
        font=small,
        fill=(26, 23, 20, 175),
    )

    # --- title 口算天天练
    title_font = load_font(CJK_FONT_CANDIDATES, 132, variable_weight="Black")
    d.text((tx, 218 * 2), "口算天天练", font=title_font, fill=INK)

    # --- vermilion rule under the title
    d.rounded_rectangle((tx, 386 * 2, tx + 300 * 2, 386 * 2 + 14 * 2), radius=7 * 2, fill=VERMILION)

    # --- subtitle
    sub_font = load_font(CJK_FONT_CANDIDATES, 46, variable_weight="Regular")
    d.text((tx, 424 * 2), "100以内加减乘除 · 17题型 · 4模式", font=sub_font, fill=(26, 23, 20, 205))

    # --- footer chips
    chip_font = load_font(CJK_FONT_CANDIDATES, 28, variable_weight="Medium")
    chips = [("答对", OK, "＋"), ("答错", BAD, "－")]
    x = tx
    for label, color, sign in chips:
        w = d.textlength(label, font=chip_font)
        d.rounded_rectangle(
            (x, 540 * 2, x + (w + 92 * 2), 540 * 2 + 50 * 2), radius=25 * 2,
            fill=(color[0], color[1], color[2], 26),
        )
        d.text((x + 20 * 2, 550 * 2), sign, font=chip_font, fill=color)
        d.text((x + 50 * 2, 552 * 2), label, font=chip_font, fill=INK)
        x += w + 92 * 2 + 20 * 2

    url_font = load_font(LATIN_FONT_CANDIDATES, 28)
    url = "1012905.github.io/DailyMentalMath"
    uw = d.textlength(url, font=url_font)
    d.text((W * 2 - 88 * 2 - uw, 560 * 2), url, font=url_font, fill=(26, 23, 20, 140))

    return img.resize((W, H), Image.LANCZOS)


def contact_sheet(path: Path) -> None:
    """Design-review sheet — written to the temp dir, never shipped."""
    tiles = [
        ("192 any", icon_image(192)),
        ("512 any", icon_image(512).resize((192, 192), Image.LANCZOS)),
        ("maskable", icon_image(192, style="maskable")),
        ("apple", icon_image(192, style="maskable")),
        ("32", icon_image(32).resize((192, 192), Image.NEAREST)),
    ]
    sheet = Image.new("RGBA", (192 * len(tiles) + 20 * (len(tiles) + 1), 1100), (255, 255, 255, 255))
    for i, (_, tile) in enumerate(tiles):
        sheet.alpha_composite(tile, (20 + i * 212, 20))
    og = og_image().resize((1000, 525), Image.LANCZOS)
    sheet.alpha_composite(og.convert("RGBA"), (20, 240))
    sheet.save(path)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", action="store_true", help="also write icons-preview.png")
    args = ap.parse_args()

    PUBLIC.mkdir(parents=True, exist_ok=True)

    (PUBLIC / "favicon.svg").write_text(FAVICON_SVG, encoding="utf-8")

    outputs = [
        ("favicon-32.png", icon_image(32)),
        ("apple-touch-icon.png", icon_image(180, style="maskable")),
        ("icon-192.png", icon_image(192)),
        ("icon-512.png", icon_image(512)),
        ("icon-maskable-512.png", icon_image(512, style="maskable")),
        ("og-image.png", og_image()),
    ]
    for name, image in outputs:
        dest = PUBLIC / name
        image.save(dest, optimize=True)
        print(f"{name:26s} {image.size[0]}x{image.size[1]}  {dest.stat().st_size / 1024:7.1f} kB")
    print(f"{'favicon.svg':26s} (vector source)")

    if args.preview:
        dest = Path(tempfile.gettempdir()) / "dmm-icons-preview.png"
        contact_sheet(dest)
        print(f"design review sheet -> {dest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
