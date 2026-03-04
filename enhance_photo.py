#!/usr/bin/env python3
"""
Professional Photo Enhancement Script

Transforms casual indoor photos into professional-quality portraits by applying
a multi-stage pipeline: white balance, exposure, contrast, color grading,
skin smoothing, simulated bokeh, sharpening, and vignetting.

Usage:
    python enhance_photo.py input.jpg                  # outputs enhanced.jpg
    python enhance_photo.py input.jpg output.jpg       # custom output name
    python enhance_photo.py input.jpg output.jpg --preset studio   # studio preset
    python enhance_photo.py input.jpg output.jpg --preset editorial # editorial preset

Presets:
    studio    - Clean, bright, flattering (default)
    editorial - Moodier, higher contrast, deeper color grading
"""

import sys
import argparse
import numpy as np
import cv2
from PIL import Image, ImageEnhance
from pathlib import Path


# ---------------------------------------------------------------------------
# Core Enhancement Functions
# ---------------------------------------------------------------------------

def auto_white_balance(img, strength=0.6):
    """Gray-world white balance with limited correction range."""
    result = img.astype(np.float32)
    avg = result.mean(axis=(0, 1))
    gray_avg = avg.mean()
    scale = gray_avg / (avg + 1e-6)
    scale = 1.0 + (scale - 1.0) * strength
    scale = np.clip(scale, 0.85, 1.15)
    for c in range(3):
        result[:, :, c] *= scale[c]
    return np.clip(result, 0, 255).astype(np.uint8)


def adaptive_exposure(img, clip_limit=2.5, grid_size=8):
    """CLAHE-based adaptive exposure in LAB space."""
    lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(grid_size, grid_size))
    l = clahe.apply(l)
    return cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2RGB)


def lift_shadows(img, amount=15):
    """Gently raise shadow detail without blowing highlights."""
    result = img.astype(np.float32)
    luminance = 0.299 * result[:, :, 0] + 0.587 * result[:, :, 1] + 0.114 * result[:, :, 2]
    shadow_mask = np.clip(1.0 - luminance / 100.0, 0, 1)
    for c in range(3):
        result[:, :, c] += shadow_mask * amount
    return np.clip(result, 0, 255).astype(np.uint8)


def s_curve_contrast(img, strength=0.25):
    """Classic S-curve: deepens shadows, opens highlights."""
    lut = np.zeros(256, dtype=np.uint8)
    for i in range(256):
        n = i / 255.0
        curved = n + strength * np.sin(2 * np.pi * n) / (2 * np.pi)
        lut[i] = np.clip(int(curved * 255), 0, 255)
    return cv2.LUT(img, lut)


def warm_color_grade(img, warmth=0.06):
    """Subtle shift toward warmer tones for a flattering portrait look."""
    result = img.astype(np.float32)
    result[:, :, 0] += warmth * 255 * 0.5   # Red lift
    result[:, :, 1] += warmth * 255 * 0.15  # Green slight lift
    result[:, :, 2] -= warmth * 255 * 0.25  # Blue reduction
    return np.clip(result, 0, 255).astype(np.uint8)


def split_tone(img, shadow_hue=(200, 15), highlight_hue=(30, 10)):
    """Split toning: cool shadows, warm highlights (hue in degrees, strength 0-255)."""
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
    result = img.astype(np.float32)

    shadow_mask = np.clip(1.0 - gray * 2, 0, 1) * (shadow_hue[1] / 255.0)
    highlight_mask = np.clip(gray * 2 - 1, 0, 1) * (highlight_hue[1] / 255.0)

    shadow_rgb = hsv_to_rgb_single(shadow_hue[0] / 360.0, 0.4, 1.0)
    highlight_rgb = hsv_to_rgb_single(highlight_hue[0] / 360.0, 0.3, 1.0)

    for c in range(3):
        result[:, :, c] += shadow_mask * shadow_rgb[c] * 20
        result[:, :, c] += highlight_mask * highlight_rgb[c] * 15

    return np.clip(result, 0, 255).astype(np.uint8)


def hsv_to_rgb_single(h, s, v):
    """Convert a single HSV color to RGB (0-255 range)."""
    import colorsys
    r, g, b = colorsys.hsv_to_rgb(h, s, v)
    return (r * 255, g * 255, b * 255)


def skin_smooth(img, strength=0.35):
    """Bilateral filter smoothing that preserves edges and texture."""
    smooth = cv2.bilateralFilter(img, 9, 55, 55)
    detail = cv2.subtract(img, smooth)
    blended = cv2.addWeighted(img, 1.0 - strength, smooth, strength, 0)
    blended = cv2.add(blended, (detail * 0.4).astype(np.uint8))
    return blended


def simulate_bokeh(img, blur_sigma=14, subject_y_ratio=0.42, subject_x_ratio=0.5,
                   ellipse_ry=0.38, ellipse_rx=0.30, feather=45):
    """
    Simulate shallow depth-of-field by blurring outside the subject area.
    The mask is an ellipse centered on the subject with heavy feathering.
    """
    h, w = img.shape[:2]
    blurred = cv2.GaussianBlur(img, (0, 0), blur_sigma)

    y, x = np.ogrid[:h, :w]
    cy, cx = h * subject_y_ratio, w * subject_x_ratio
    ry, rx = h * ellipse_ry, w * ellipse_rx

    dist = np.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2)
    mask = np.clip(dist - 0.7, 0, 1)
    mask = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), feather)
    mask = np.clip(mask, 0, 0.85)  # Never fully lose the background

    result = img.astype(np.float32) * (1 - mask[:, :, np.newaxis]) + \
             blurred.astype(np.float32) * mask[:, :, np.newaxis]
    return np.clip(result, 0, 255).astype(np.uint8)


def sharpen(img, amount=0.45, radius=1.5):
    """Unsharp mask sharpening for crisp subject detail."""
    blurred = cv2.GaussianBlur(img, (0, 0), radius)
    result = cv2.addWeighted(img, 1.0 + amount, blurred, -amount, 0)
    return np.clip(result, 0, 255).astype(np.uint8)


def vignette(img, strength=0.30):
    """Radial darkening at edges to focus attention on the subject."""
    h, w = img.shape[:2]
    y, x = np.ogrid[:h, :w]
    cy, cx = h / 2, w / 2
    r = np.sqrt((x - cx) ** 2 / (cx ** 2) + (y - cy) ** 2 / (cy ** 2))
    mask = 1.0 - np.clip(r - 0.55, 0, None) * strength * 1.6
    mask = np.clip(mask, 1.0 - strength, 1.0)
    mask = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), 30)

    result = img.astype(np.float32)
    for c in range(3):
        result[:, :, c] *= mask
    return np.clip(result, 0, 255).astype(np.uint8)


def reduce_noise(img, strength=5):
    """Light denoising to clean up sensor noise without losing detail."""
    return cv2.fastNlMeansDenoisingColored(img, None, strength, strength, 7, 21)


# ---------------------------------------------------------------------------
# Presets
# ---------------------------------------------------------------------------

PRESETS = {
    "studio": {
        "wb_strength": 0.5,
        "clahe_clip": 2.2,
        "shadow_lift": 12,
        "s_curve": 0.22,
        "warmth": 0.05,
        "split_shadow": (210, 12),
        "split_highlight": (35, 8),
        "skin_strength": 0.35,
        "bokeh_sigma": 12,
        "sharpen_amount": 0.4,
        "vignette_strength": 0.28,
        "denoise": 4,
        "saturation": 1.08,
        "brightness": 1.03,
    },
    "editorial": {
        "wb_strength": 0.4,
        "clahe_clip": 2.8,
        "shadow_lift": 8,
        "s_curve": 0.32,
        "warmth": 0.04,
        "split_shadow": (220, 18),
        "split_highlight": (25, 12),
        "skin_strength": 0.25,
        "bokeh_sigma": 16,
        "sharpen_amount": 0.5,
        "vignette_strength": 0.38,
        "denoise": 3,
        "saturation": 1.05,
        "brightness": 1.0,
    },
}


def enhance(input_path, output_path, preset_name="studio"):
    """Full professional enhancement pipeline."""
    p = PRESETS[preset_name]
    print(f"Loading: {input_path}")
    print(f"Preset:  {preset_name}\n")

    img = np.array(Image.open(input_path).convert("RGB"))

    steps = [
        ("White balance correction",   lambda i: auto_white_balance(i, p["wb_strength"])),
        ("Noise reduction",            lambda i: reduce_noise(i, p["denoise"])),
        ("Adaptive exposure (CLAHE)",   lambda i: adaptive_exposure(i, p["clahe_clip"])),
        ("Shadow recovery",            lambda i: lift_shadows(i, p["shadow_lift"])),
        ("S-curve contrast",           lambda i: s_curve_contrast(i, p["s_curve"])),
        ("Warm color grading",         lambda i: warm_color_grade(i, p["warmth"])),
        ("Split toning",              lambda i: split_tone(i, p["split_shadow"], p["split_highlight"])),
        ("Skin smoothing",            lambda i: skin_smooth(i, p["skin_strength"])),
        ("Bokeh simulation",          lambda i: simulate_bokeh(i, p["bokeh_sigma"])),
        ("Sharpening",                lambda i: sharpen(i, p["sharpen_amount"])),
        ("Vignette",                  lambda i: vignette(i, p["vignette_strength"])),
    ]

    for idx, (name, fn) in enumerate(steps, 1):
        print(f"  [{idx:2d}/{len(steps)}] {name}...")
        img = fn(img)

    result = Image.fromarray(img)
    result = ImageEnhance.Color(result).enhance(p["saturation"])
    result = ImageEnhance.Brightness(result).enhance(p["brightness"])

    result.save(output_path, "JPEG", quality=95, subsampling=0)
    w, h = result.size
    print(f"\nDone! Saved: {output_path}  ({w}x{h})")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Professional photo enhancement")
    parser.add_argument("input", help="Input image path")
    parser.add_argument("output", nargs="?", default="enhanced.jpg", help="Output image path (default: enhanced.jpg)")
    parser.add_argument("--preset", choices=list(PRESETS.keys()), default="studio",
                        help="Enhancement preset (default: studio)")
    args = parser.parse_args()

    if not Path(args.input).exists():
        print(f"Error: '{args.input}' not found.")
        sys.exit(1)

    enhance(args.input, args.output, args.preset)


if __name__ == "__main__":
    main()
