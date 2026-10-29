"""
Builds the web-ready images of the experience.

  1. Lula: background removal (rembg, model u2net_human_seg), white "sticker" outline,
     trimmed WebP cut-outs in assets/lula/ + round face crops (face-*.webp).
  2. Couple: re-encodes photos/me.* and photos/her.* into light WebP files in assets/couple/.

Requirements:  pip install "rembg[cpu]" pillow opencv-python numpy
Usage:         python scripts/fetch-lula.py   (once)
               python scripts/prepare-images.py [--only-couple]
"""
import glob, json, os, sys

import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, ".cache", "lula-raw")
LULA_OUT = os.path.join(ROOT, "assets", "lula")
COUPLE_IN = os.path.join(ROOT, "photos")
COUPLE_OUT = os.path.join(ROOT, "assets", "couple")

# max output height per variant (the giant face zoom needs more pixels than the tiny dancers)
SIZES = {"jersey-full": 1100, "jersey-thumbs": 1100, "official-body": 1400, "official-face": 1200,
         "laugh": 1000, "cap-thumb": 1000, "fists": 900}
# where Haar detection fails (cap, microphone): face centre x, y and crop size, as fractions of height/width
FACE_HINTS = {"cap-thumb": (0.49, 0.40, 0.52)}
ROUND_FACES = {"official-body"}  # round photo crops actually used (planet, close-up)
NO_HEAD = {"official-body"}


def sticker(rgba: Image.Image, outline_ratio=0.012) -> Image.Image:
    """Adds a clean white outline around the alpha, like a cut-out sticker."""
    w, h = rgba.size
    r = max(3, int(max(w, h) * outline_ratio))
    alpha = np.array(rgba.split()[-1])
    hard = (alpha > 110).astype(np.uint8) * 255
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
    grown = cv2.dilate(hard, k)
    grown = cv2.GaussianBlur(grown, (0, 0), r * 0.18)
    pad = r + 4
    canvas = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    white = Image.new("RGBA", (w, h), (255, 253, 247, 255))
    white.putalpha(Image.fromarray(grown))
    canvas.alpha_composite(white, (pad, pad))
    canvas.alpha_composite(rgba, (pad, pad))
    return canvas


def trim(im: Image.Image) -> Image.Image:
    bbox = im.split()[-1].point(lambda a: 255 if a > 8 else 0).getbbox()
    return im.crop(bbox) if bbox else im


def detect_face(rgb: np.ndarray):
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    casc = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    faces = casc.detectMultiScale(gray, scaleFactor=1.08, minNeighbors=6, minSize=(60, 60))
    if len(faces) == 0:
        return None
    return max(faces, key=lambda f: f[2] * f[3])


def lula():
    from rembg import new_session, remove

    os.makedirs(LULA_OUT, exist_ok=True)
    session = new_session("u2net_human_seg")
    meta = json.load(open(os.path.join(RAW, "meta.json"), encoding="utf-8"))
    faces = {}
    for name, info in meta.items():
        src = Image.open(os.path.join(RAW, info["file"])).convert("RGB")
        cut = remove(src, session=session, post_process_mask=True)
        # face position: manual hint (cx, cy, size as fractions of the height) or Haar detection
        if name in FACE_HINTS:
            hx, hy, hs = FACE_HINTS[name]
            cx, cy, s = hx * src.width, hy * src.height, hs * src.height
        else:
            f = detect_face(np.array(src))
            if f is None:
                cx = None
            else:
                x, y, w, h = map(int, f)
                cx, cy, s = x + w / 2, y + h * 0.52, max(w, h) * 1.75
        if cx is not None:
            # round-able square photo crop (keeps the background, used for planets / coins / meteors)
            box = (int(cx - s / 2), int(cy - s / 2), int(cx + s / 2), int(cy + s / 2))
            if name in ROUND_FACES:
                src.crop(box).resize((560, 560), Image.LANCZOS).save(os.path.join(LULA_OUT, f"face-{name}.webp"), quality=84)
            # transparent head sticker (hair to neck), used for peeking / orbiting heads
            if name not in NO_HEAD:
                hb = (int(cx - s * 0.62), int(cy - s * 0.62), int(cx + s * 0.62), int(cy + s * 0.58))
                head = trim(cut.crop(hb))
                head.thumbnail((520, 520), Image.LANCZOS)
                sticker(head, 0.03).save(os.path.join(LULA_OUT, f"head-{name}.webp"), quality=86, method=6)
            faces[name] = True
        cut = trim(cut)
        target_h = SIZES.get(name, 1000)
        if cut.height > target_h:
            cut = cut.resize((round(cut.width * target_h / cut.height), target_h), Image.LANCZOS)
        out = sticker(cut)
        out.save(os.path.join(LULA_OUT, f"{name}.webp"), quality=86, method=6)
        print(f"lula/{name}.webp {out.size}", "face" if name in faces else "no-face")
    # attribution file kept next to the images
    lines = ["# Lula photos — sources and licences", "",
             "Cut-outs (background removed, white outline added) derived from the files below.",
             "Derivatives of CC BY-SA files are shared under the same licence.", ""]
    for name, info in meta.items():
        lines.append(f"- `{name}.webp` / `face-{name}.webp` — [{info['title'][5:]}]({info['page']}) — "
                     f"{info['artist']} — {info['license']}")
    open(os.path.join(LULA_OUT, "ATTRIBUTION.md"), "w", encoding="utf-8").write("\n".join(lines) + "\n")
    json.dump({k: {"license": v["license"], "artist": v["artist"], "page": v["page"]} for k, v in meta.items()},
              open(os.path.join(LULA_OUT, "credits.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)


def couple():
    os.makedirs(COUPLE_OUT, exist_ok=True)
    for who in ("me", "her"):
        files = [p for p in glob.glob(os.path.join(COUPLE_IN, who + ".*"))]
        if not files:
            print(f"(no photos/{who}.* — the experience will use a placeholder)")
            continue
        im = Image.open(files[0]).convert("RGB")
        if im.height > 1280:
            im = im.resize((round(im.width * 1280 / im.height), 1280), Image.LANCZOS)
        im = im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=40, threshold=2))
        im.save(os.path.join(COUPLE_OUT, f"{who}.webp"), quality=84, method=6)
        print(f"couple/{who}.webp {im.size}")


if __name__ == "__main__":
    couple()
    if "--only-couple" not in sys.argv:
        lula()
