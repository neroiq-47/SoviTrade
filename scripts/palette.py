from PIL import Image, ImageDraw, ImageFont
F="/usr/share/fonts/truetype/sand-box/google/"
def font(p,s,w=None):
    f=ImageFont.truetype(F+p,s)
    if w:
        try: f.set_variation_by_axes([w] if 'opsz' not in p else [14,w])
        except Exception: pass
    return f
print("Palette generator ready. Requires Space Grotesk and other fonts locally.")
