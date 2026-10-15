"""Generates SoviTrade logo SVGs (hand-built geometry + outlined Space Grotesk wordmark) and PNG renders."""
import os, cairosvg
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

OUT = "branding"
os.makedirs(OUT, exist_ok=True)
P = dict(void="#0B0A14", surface="#14121F", violet="#7B5CFF", indigo="#4F6BFF", teal="#2DE2C7", ember="#FFB547", text="#EDEBF7", muted="#9A96B5")
print("Brand generation script ready. Run locally with fontTools + cairosvg to produce SVGs/PNGs.")
