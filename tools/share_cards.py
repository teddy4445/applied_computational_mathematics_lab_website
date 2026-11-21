"""Branded link previews: the 1200x630 image that LinkedIn, X, WhatsApp, Slack and others show when a page is shared.

Every card has the same frame: the ACML logo and name, a kicker line (what the page is), the title, the site address,
and a picture panel on the right (the paper's featured figure, the project image, a play button for a video, or the
lab's mark for other pages). Used by tools/build_papers.py, build_projects.py and build_watch_pages.py, and by
tools/build_share_cards.py for the site's other pages. Fonts: tools/fonts (Inter, SIL Open Font License).
"""
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = Path(__file__).resolve().parent / 'fonts'
W, H = 1200, 630
SPLIT = 676                        # left text column | right picture panel
PAD = 64
INK, MUTED, BLUE = (17, 24, 39), (107, 114, 128), (37, 99, 235)
NAVY_TOP, NAVY_BOTTOM = (30, 58, 138), (15, 23, 42)
VERSION = 1                        # bump to make the builders redraw every card


def font(weight, size):
    return ImageFont.truetype(str(FONTS / f'Inter-{weight}.otf'), size)


def logo(color, height):
    """The ACML logo (img/logo.png, black on transparent) recoloured."""
    src = Image.open(ROOT / 'img' / 'logo.png').convert('RGBA')
    alpha = src.getchannel('A')
    box = alpha.getbbox()
    alpha = alpha.crop(box)
    w = round(alpha.width * height / alpha.height)
    alpha = alpha.resize((w, height), Image.LANCZOS)
    out = Image.new('RGBA', alpha.size, color + (255,))
    out.putalpha(alpha)
    return out


def wrap(draw, text, fnt, width):
    words, lines, line = text.split(), [], ''
    for w in words:
        trial = f'{line} {w}'.strip()
        if draw.textlength(trial, font=fnt) <= width or not line:
            line = trial
        else:
            lines.append(line)
            line = w
    if line:
        lines.append(line)
    return lines


def fit_title(draw, text, width, max_h, sizes=(58, 54, 50, 46, 42, 38, 35, 32)):
    for size in sizes:
        fnt = font('Bold', size)
        lines = wrap(draw, text, fnt, width)
        if len(lines) * size * 1.18 <= max_h:
            return fnt, size, lines
    fnt, size = font('Bold', sizes[-1]), sizes[-1]
    lines = wrap(draw, text, fnt, width)
    keep = max(1, int(max_h // (size * 1.18)))
    lines = lines[:keep]
    while lines and draw.textlength(lines[-1] + '…', font=fnt) > width:
        lines[-1] = lines[-1].rsplit(' ', 1)[0] if ' ' in lines[-1] else lines[-1][:-1]
    lines[-1] = lines[-1].rstrip(',;:') + '…'
    return fnt, size, lines


def clip_line(draw, text, fnt, width):
    if draw.textlength(text, font=fnt) <= width:
        return text
    while text and draw.textlength(text + '…', font=fnt) > width:
        text = text[:-1]
    return text.rstrip(' ·,') + '…'


def gradient(size, top, bottom):
    w, h = size
    g = Image.new('RGB', (1, h))
    for y in range(h):
        t = y / max(1, h - 1)
        g.putpixel((0, y), tuple(round(a + (b - a) * t) for a, b in zip(top, bottom)))
    return g.resize((w, h))


def motif(panel):
    """A quiet pattern for the navy panels: a dot grid and two smooth curves."""
    d = ImageDraw.Draw(panel, 'RGBA')
    w, h = panel.size
    for x in range(24, w, 32):
        for y in range(24, h, 32):
            d.ellipse((x - 1.6, y - 1.6, x + 1.6, y + 1.6), fill=(147, 197, 253, 46))
    for k, (amp, phase, alpha) in enumerate(((60, 0.0, 70), (40, 1.7, 45))):
        pts = [(x, h * (0.72 + 0.06 * k) - amp * math.sin(x / w * 2.2 * math.pi + phase)) for x in range(0, w + 1, 6)]
        d.line(pts, fill=(147, 197, 253, alpha), width=3)


def picture_panel(kind, image=None, badge=None):
    pw = W - SPLIT
    if kind == 'figure' and image:
        panel = Image.new('RGB', (pw, H), (239, 246, 255))
        fig = Image.open(image).convert('RGB')
        box_w, box_h = pw - 2 * 40, H - 2 * 48
        fig.thumbnail((box_w - 32, box_h - 32), Image.LANCZOS)
        cw, ch = fig.width + 32, fig.height + 32
        x0, y0 = (pw - cw) // 2, (H - ch) // 2
        shadow = Image.new('RGBA', (pw, H), (0, 0, 0, 0))
        ImageDraw.Draw(shadow).rounded_rectangle((x0 + 4, y0 + 10, x0 + cw + 4, y0 + ch + 10), 22, fill=(30, 58, 138, 60))
        shadow = shadow.filter(ImageFilter.GaussianBlur(14))
        panel = Image.alpha_composite(panel.convert('RGBA'), shadow)
        ImageDraw.Draw(panel).rounded_rectangle((x0, y0, x0 + cw, y0 + ch), 18, fill=(255, 255, 255, 255))
        panel.paste(fig, (x0 + 16, y0 + 16))
        return panel.convert('RGB')
    if kind == 'cover' and image:
        im = Image.open(image).convert('RGB')
        scale = max(pw / im.width, H / im.height)
        im = im.resize((math.ceil(im.width * scale), math.ceil(im.height * scale)), Image.LANCZOS)
        x, y = (im.width - pw) // 2, (im.height - H) // 2
        return im.crop((x, y, x + pw, y + H))
    panel = gradient((pw, H), NAVY_TOP, NAVY_BOTTOM)          # RGB: drawing in 'RGBA' mode blends into it
    motif(panel)
    if kind == 'video':
        cx, cy, r = pw // 2, H // 2 - 30, 92
        glow = Image.new('RGBA', panel.size, (0, 0, 0, 0))
        ImageDraw.Draw(glow).ellipse((cx - r - 26, cy - r - 26, cx + r + 26, cy + r + 26), fill=(96, 165, 250, 90))
        panel = Image.alpha_composite(panel.convert('RGBA'), glow.filter(ImageFilter.GaussianBlur(22))).convert('RGB')
        d = ImageDraw.Draw(panel)
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(255, 255, 255, 255))
        tri = [(cx - 26, cy - 40), (cx - 26, cy + 40), (cx + 44, cy)]
        d.polygon(tri, fill=BLUE)
        if badge:
            f = font('SemiBold', 26)
            da = ImageDraw.Draw(panel, 'RGBA')
            tw = da.textlength(badge, font=f)
            bx, by = cx - tw / 2 - 22, cy + r + 44
            da.rounded_rectangle((bx, by, bx + tw + 44, by + 50), 25, fill=(255, 255, 255, 40), outline=(255, 255, 255, 90), width=2)
            da.text((cx, by + 25), badge, font=f, fill=(255, 255, 255, 255), anchor='mm')
    else:
        mark = logo((255, 255, 255), 190)
        panel.paste(mark, ((pw - mark.width) // 2, (H - mark.height) // 2 - 10), mark)
    return panel


def make_card(dst, title, kicker, kind='page', image=None, badge=None, subtitle=None):
    """kind: 'figure' (image = a figure, shown on a white card), 'cover' (image fills the panel), 'video' (play button,
    badge = e.g. "Short · 1:13"), 'page' (the lab's mark). subtitle: a short line under the title (pages)."""
    card = Image.new('RGB', (W, H), (255, 255, 255))
    if kind in ('figure', 'cover') and image and not Path(image).exists():
        kind = 'page'
    card.paste(picture_panel(kind, image, badge), (SPLIT, 0))
    d = ImageDraw.Draw(card)
    d.rectangle((0, 0, W, 7), fill=BLUE)
    text_w = SPLIT - 2 * PAD + 8
    mark = logo(INK, 46)
    card.paste(mark, (PAD, 52), mark)
    d.text((PAD + mark.width + 18, 52 + 23), clip_line(d, 'Applied Computational Mathematics Laboratory', font('Medium', 19), text_w - mark.width - 18),
           font=font('Medium', 19), fill=MUTED, anchor='lm')
    kf = font('SemiBold', 18)
    klines = wrap(d, kicker.upper(), kf, text_w)
    if len(klines) > 2:
        klines = [klines[0], clip_line(d, ' '.join(klines[1:]), kf, text_w)]
    y = 146
    for line in klines:
        d.text((PAD, y), line, font=kf, fill=BLUE)
        y += 26
    top, bottom = y + 18, 530
    sub_lines, sf = [], font('Medium', 25)
    if subtitle:
        sub_lines = wrap(d, subtitle, sf, text_w)[:3]
        bottom -= 22 + 34 * len(sub_lines)
    fnt, size, lines = fit_title(d, title, text_w, bottom - top)
    y = top
    for line in lines:
        d.text((PAD, y), line, font=fnt, fill=INK)
        y += round(size * 1.18)
    if sub_lines:
        y += 14
        for i, line in enumerate(sub_lines):
            if i == len(sub_lines) - 1 and len(wrap(d, subtitle, sf, text_w)) > len(sub_lines):
                line = clip_line(d, line + ' …', sf, text_w)
            d.text((PAD, y), line, font=sf, fill=MUTED)
            y += 34
    d.line((PAD, 552, PAD + 56, 552), fill=BLUE, width=4)
    d.text((PAD, 568), 'acml.teddylazebnik.com', font=font('SemiBold', 21), fill=INK)
    Path(dst).parent.mkdir(parents=True, exist_ok=True)
    card.save(dst, 'JPEG', quality=86, optimize=True, progressive=True)
    return dst


def stale(dst, *sources):
    """True when the card is missing or older than any of its sources or this module."""
    dst = Path(dst)
    if not dst.exists():
        return True
    t = dst.stat().st_mtime
    deps = [Path(__file__)] + [Path(s) for s in sources if s]
    return any(p.exists() and p.stat().st_mtime > t for p in deps)
