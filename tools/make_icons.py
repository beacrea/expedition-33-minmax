"""
Regenerate the PWA icon set.

    pip install pillow
    python3 tools/make_icons.py

Writes into icons/. Requires a bold serif TTF; override with the FONT env var
if the default Noto path does not exist on your machine (on macOS, try
/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf).
"""
from PIL import Image, ImageDraw, ImageFont
import os

BG = (15, 17, 21)        # --bg  #0f1115
GOLD = (201, 161, 90)    # --accent #c9a15a
FONT = os.environ.get(
    "FONT", "/usr/share/fonts/truetype/noto/NotoSerif-Bold.ttf"
)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "icons")
SS = 4  # supersample factor

os.makedirs(OUT, exist_ok=True)


def make(size, frame=True, content_scale=1.0, filename=None):
    """Render one icon. content_scale shrinks the artwork for maskable safe zones."""
    S = size * SS
    img = Image.new("RGB", (S, S), BG)
    d = ImageDraw.Draw(img)

    c = S / 2.0
    span = S * content_scale  # width available to the artwork

    if frame:
        inset = (S - span) / 2 + span * 0.09
        w = max(1, int(span * 0.022))
        r = span * 0.18
        d.rounded_rectangle(
            [inset, inset, S - inset, S - inset],
            radius=r, outline=GOLD, width=w,
        )

    # "33" centred using the glyph bounding box (not the font line box),
    # so it is optically centred rather than baseline-centred.
    fs = int(span * 0.46)
    font = ImageFont.truetype(FONT, fs)
    text = "33"
    l, t, rr, b = d.textbbox((0, 0), text, font=font)
    d.text((c - (rr + l) / 2.0, c - (b + t) / 2.0), text, font=font, fill=GOLD)

    img = img.resize((size, size), Image.LANCZOS)
    path = os.path.join(OUT, filename)
    img.save(path, "PNG", optimize=True)
    print(f"{filename}  {size}x{size}  {os.path.getsize(path)} bytes")


# Standard "any purpose" icons — full bleed with a gold frame.
make(192, frame=True, content_scale=1.0, filename="icon-192.png")
make(512, frame=True, content_scale=1.0, filename="icon-512.png")

# Maskable — artwork confined to the centre 80% safe zone so Android can
# crop to a circle/squircle without clipping the frame or the digits.
make(512, frame=True, content_scale=0.78, filename="icon-maskable-512.png")

# iOS home screen. Opaque, no alpha; iOS applies its own corner rounding,
# so the frame sits further in to avoid being clipped at the corners.
make(180, frame=True, content_scale=0.92, filename="apple-touch-icon.png")
