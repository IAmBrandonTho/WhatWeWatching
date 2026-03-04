#!/usr/bin/env python3
"""
Professional Photo Enhancer
Applies portrait photography enhancements: bokeh background blur,
color grading, subject sharpening, and vignette.

Usage:
    python3 enhance_photo.py <input_image> [output_image]

Example:
    python3 enhance_photo.py photo.jpg photo_enhanced.jpg
"""

import sys
import os
import argparse
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw
import cv2


# ─── CLI ──────────────────────────────────────────────────────────────────────

def parse_args():
    p = argparse.ArgumentParser(description='Make a photo look professionally taken.')
    p.add_argument('input',  help='Input image path (JPG/PNG/WebP)')
    p.add_argument('output', nargs='?', help='Output image path (default: <input>_enhanced.jpg)')
    p.add_argument('--blur',     type=int, default=22,  help='Bokeh blur radius (0–50, default 22)')
    p.add_argument('--contrast', type=float, default=1.28, help='Contrast multiplier (1.0 = no change, default 1.28)')
    p.add_argument('--saturation', type=float, default=1.20, help='Saturation multiplier (default 1.20)')
    p.add_argument('--warmth', type=int, default=12, help='Warmth adjustment -40..40 (default 12)')
    p.add_argument('--sharpen', type=float, default=0.45, help='Sharpness 0..1 (default 0.45)')
    p.add_argument('--vignette', type=float, default=0.48, help='Vignette strength 0..1 (default 0.48)')
    p.add_argument('--exposure', type=float, default=1.06, help='Exposure multiplier (default 1.06)')
    p.add_argument('--no-segment', action='store_true', help='Skip ML segmentation, use elliptical mask fallback')
    return p.parse_args()


# ─── SEGMENTATION ─────────────────────────────────────────────────────────────

def segment_person(img_cv):
    """
    Use rembg (U2Net) to get a person alpha mask.
    Returns a float32 mask (0=background, 1=person) same HxW as input.
    Falls back to an elliptical mask if rembg is unavailable or fails.
    """
    try:
        from rembg import remove
        from PIL import Image as PILImage
        import io

        h, w = img_cv.shape[:2]
        print('  Running AI background segmentation (this takes ~5s on first run)…')

        img_pil = PILImage.fromarray(cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB))
        result  = remove(img_pil)           # RGBA output, alpha = person mask

        alpha = np.array(result)[:, :, 3].astype(np.float32) / 255.0
        print('  Segmentation complete.')
        return alpha

    except Exception as e:
        print(f'  Segmentation unavailable ({e}), using soft-focus ellipse fallback.')
        return None


def ellipse_mask(h, w):
    """Generate a soft elliptical mask covering a full-body standing pose."""
    cy, cx = int(h * 0.47), int(w * 0.50)
    ry, rx = int(h * 0.50), int(w * 0.40)

    y_idx, x_idx = np.ogrid[:h, :w]
    dist = ((x_idx - cx) / rx) ** 2 + ((y_idx - cy) / ry) ** 2
    mask = np.clip(1.5 - dist, 0, 1).astype(np.float32)
    # Gaussian feather
    mask_img = Image.fromarray((mask * 255).astype(np.uint8))
    mask_img = mask_img.filter(ImageFilter.GaussianBlur(radius=max(w, h) * 0.06))
    return np.array(mask_img).astype(np.float32) / 255.0


# ─── BOKEH BLUR ───────────────────────────────────────────────────────────────

def apply_bokeh(img_cv, mask, blur_radius, feather=8):
    """Blend sharp foreground over blurred background using person mask."""
    if blur_radius == 0:
        return img_cv.copy()

    # Blur the full image (simulate out-of-focus background)
    k = blur_radius * 2 + 1
    blurred = cv2.GaussianBlur(img_cv, (k, k), blur_radius)

    # Feather the mask edges for natural depth-of-field falloff
    feather_px = max(1, feather)
    kf = feather_px * 2 + 1
    soft_mask = cv2.GaussianBlur(mask, (kf, kf), feather_px)
    soft_mask = np.clip(soft_mask, 0, 1)

    m3 = soft_mask[:, :, np.newaxis]  # broadcast to 3 channels
    composite = img_cv.astype(np.float32) * m3 + blurred.astype(np.float32) * (1 - m3)
    return composite.astype(np.uint8)


# ─── SHARPENING (Unsharp Mask) ────────────────────────────────────────────────

def apply_sharpen(img_cv, mask, strength):
    """Unsharp mask applied only to the person region."""
    if strength == 0:
        return img_cv.copy()

    blur_mild = cv2.GaussianBlur(img_cv, (0, 0), 2.0)
    usm = cv2.addWeighted(img_cv, 1 + strength * 1.5, blur_mild, -strength * 1.5, 0)

    m3 = np.clip(mask, 0, 1)[:, :, np.newaxis]
    result = img_cv.astype(np.float32) * (1 - m3) + usm.astype(np.float32) * m3
    return np.clip(result, 0, 255).astype(np.uint8)


# ─── COLOUR GRADING ───────────────────────────────────────────────────────────

def s_curve(arr, strength):
    """Sigmoid-like S-curve: lift shadows, boost midtones, ease highlights."""
    if strength == 0:
        return arr
    x = arr / 255.0
    curve = np.where(x < 0.5, 2 * x**2, 1 - (-2*x + 2)**2 / 2)
    shadow_lift = 0.035 * max(0, strength)
    y = shadow_lift + (1 - shadow_lift) * (x + strength * (curve - x))
    return np.clip(y * 255, 0, 255)


def apply_color_grade(img_cv, cfg):
    """
    Apply professional colour grading in float32 space:
    exposure → S-curve contrast → warmth → saturation
    """
    img_f = img_cv.astype(np.float32)

    # Exposure
    if cfg.exposure != 1.0:
        img_f = np.clip(img_f * cfg.exposure, 0, 255)

    # S-curve contrast (on each channel)
    con_strength = (cfg.contrast - 1.0) * 0.8
    img_f[:,:,0] = s_curve(img_f[:,:,0], con_strength)
    img_f[:,:,1] = s_curve(img_f[:,:,1], con_strength)
    img_f[:,:,2] = s_curve(img_f[:,:,2], con_strength)

    # Warmth shift (in BGR order — cv2 uses BGR)
    if cfg.warmth != 0:
        brightness = img_f.mean(axis=2, keepdims=True) / 255.0
        hi_blend   = brightness ** 2 * (abs(cfg.warmth) / 40.0)
        all_blend  = brightness * (abs(cfg.warmth) / 40.0) * 0.4
        if cfg.warmth > 0:
            img_f[:,:,2] = np.clip(img_f[:,:,2] + (hi_blend[:,:,0]*18 + all_blend[:,:,0]*5), 0, 255)  # R
            img_f[:,:,1] = np.clip(img_f[:,:,1] + all_blend[:,:,0]*3, 0, 255)                          # G
            img_f[:,:,0] = np.clip(img_f[:,:,0] - (hi_blend[:,:,0]*14 + all_blend[:,:,0]*4), 0, 255)  # B
        else:
            img_f[:,:,2] = np.clip(img_f[:,:,2] - (hi_blend[:,:,0]*12 + all_blend[:,:,0]*4), 0, 255)
            img_f[:,:,1] = np.clip(img_f[:,:,1] + all_blend[:,:,0]*2, 0, 255)
            img_f[:,:,0] = np.clip(img_f[:,:,0] + (hi_blend[:,:,0]*14 + all_blend[:,:,0]*4), 0, 255)

    # Saturation (in HSV space)
    img_u8 = np.clip(img_f, 0, 255).astype(np.uint8)
    if cfg.saturation != 1.0:
        hsv = cv2.cvtColor(img_u8, cv2.COLOR_BGR2HSV).astype(np.float32)
        hsv[:,:,1] = np.clip(hsv[:,:,1] * cfg.saturation, 0, 255)
        img_u8 = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

    return img_u8


# ─── VIGNETTE ─────────────────────────────────────────────────────────────────

def apply_vignette(img_cv, strength):
    """Radial dark vignette, blended with multiply mode."""
    h, w = img_cv.shape[:2]
    cx, cy = w / 2, h / 2

    y_idx, x_idx = np.ogrid[:h, :w]
    # Normalised distance from centre (0 = centre, 1 = corner)
    dist = np.sqrt(((x_idx - cx) / (w * 0.5))**2 +
                   ((y_idx - cy) / (h * 0.5))**2)

    # Map distance to vignette intensity
    vig = np.clip(1 - (dist - 0.55) * 2.0, 0, 1).astype(np.float32)
    vig = vig ** (1 - strength * 0.5)   # ease-in for stronger darkening at edges

    # Smooth
    ksize = int(min(w, h) * 0.15) | 1
    vig = cv2.GaussianBlur(vig, (ksize, ksize), ksize * 0.5)

    # Combine: darken (multiply)
    result = img_cv.astype(np.float32) * vig[:, :, np.newaxis]
    return np.clip(result, 0, 255).astype(np.uint8)


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def main():
    args = parse_args()

    # Resolve output path
    if not args.output:
        base, ext = os.path.splitext(args.input)
        args.output = base + '_enhanced.jpg'

    # Load image
    print(f'Loading: {args.input}')
    img = cv2.imread(args.input)
    if img is None:
        sys.exit(f'Error: cannot load image "{args.input}"')

    H, W = img.shape[:2]
    print(f'  Size: {W}×{H}px')

    # Segmentation
    print('Segmenting person…')
    if args.no_segment:
        mask = ellipse_mask(H, W)
    else:
        mask = segment_person(img)
        if mask is None:
            mask = ellipse_mask(H, W)

    # Bokeh blur
    print(f'Applying bokeh blur (radius={args.blur})…')
    img = apply_bokeh(img, mask, blur_radius=args.blur, feather=8)

    # Sharpening
    print(f'Sharpening subject (strength={args.sharpen})…')
    img = apply_sharpen(img, mask, strength=args.sharpen)

    # Colour grade
    print('Applying professional colour grade…')
    img = apply_color_grade(img, args)

    # Vignette
    print(f'Adding vignette (strength={args.vignette})…')
    img = apply_vignette(img, strength=args.vignette)

    # Save
    print(f'Saving: {args.output}')
    cv2.imwrite(args.output, img, [cv2.IMWRITE_JPEG_QUALITY, 95])
    print('Done!')


if __name__ == '__main__':
    main()
