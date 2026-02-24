import { BrandConfig } from "@/types";

/** Parse a hex color (#RRGGBB or #RGB) to [r, g, b] */
function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace(/^#/, "");
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  const num = parseInt(h, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/** Lighten an RGB color by mixing with white. amount 0–1 */
function lighten(rgb: [number, number, number], amount: number): [number, number, number] {
  return rgb.map((c) => Math.round(c + (255 - c) * amount)) as [number, number, number];
}

/** Darken an RGB color by mixing with black. amount 0–1 */
function darken(rgb: [number, number, number], amount: number): [number, number, number] {
  return rgb.map((c) => Math.round(c * (1 - amount))) as [number, number, number];
}

function rgbString(rgb: [number, number, number]): string {
  return `${rgb[0]} ${rgb[1]} ${rgb[2]}`;
}

/**
 * Derive CSS custom property values from a BrandConfig.
 * Returns a Record suitable for setting as inline style on a wrapper element.
 */
export function computeBrandCssVars(brand: BrandConfig): Record<string, string> {
  const vars: Record<string, string> = {};

  if (brand.primaryColor) {
    const primary = hexToRgb(brand.primaryColor);
    vars["--brand-primary-rgb"] = rgbString(primary);
    vars["--brand-primary-light-rgb"] = rgbString(lighten(primary, 0.2));
    vars["--brand-primary-glow-rgb"] = rgbString(lighten(primary, 0.35));
    vars["--brand-primary-soft-rgb"] = rgbString(lighten(primary, 0.85));
    vars["--brand-primary-bg-rgb"] = rgbString(lighten(primary, 0.92));
    // Hex values for gradients
    const toHex = (rgb: [number, number, number]) =>
      "#" + rgb.map((c) => c.toString(16).padStart(2, "0")).join("");
    vars["--brand-primary"] = toHex(primary);
    vars["--brand-primary-light"] = toHex(lighten(primary, 0.2));
    vars["--brand-primary-glow"] = toHex(lighten(primary, 0.35));
  }

  if (brand.accentColor) {
    const accent = hexToRgb(brand.accentColor);
    vars["--brand-navy-rgb"] = rgbString(accent);
    vars["--brand-navy-dark-rgb"] = rgbString(darken(accent, 0.3));
    // Hex for gradients
    const toHex = (rgb: [number, number, number]) =>
      "#" + rgb.map((c) => c.toString(16).padStart(2, "0")).join("");
    vars["--brand-navy"] = toHex(accent);
    vars["--brand-navy-mid"] = toHex(lighten(accent, 0.3));
  }

  return vars;
}
