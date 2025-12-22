import { HexComponents } from "../types/HexComponents";

/**
 * Clamp a number to the valid RGB byte range (0–255).
 *
 * Behavior:
 * - Accepts any number (integer or float).  
 * - Values below 0 are clamped to 0.  
 * - Values above 255 are clamped to 255.  
 * - Values within 0–255 are returned unchanged.  
 * - Floats are accepted and returned as floats; rounding is **not** performed.
 *   If integer values are needed (e.g., for hex conversion), the calling function
 *   must handle rounding separately.
 *
 * @param n  A number representing a color component or other byte value.
 * @returns  The number clamped to the range 0–255, as a float if the input was a float.
 *
 * @example
 * clampByte(-5)     // returns 0
 * clampByte(128.7)  // returns 128.7
 * clampByte(300)    // returns 255
 * clampByte(0)      // returns 0
 * clampByte(255)    // returns 255
 */
export function clampByte(n: number): number {
    return Math.max(0, Math.min(255, n));
}

/**
 * Convert a number in the range 0–255 to a 2-digit hexadecimal string.
 *
 * Behavior:
 * - Accepts any number (integer or float). 
 * - The number is first clamped to the valid byte range 0–255 using `clampByte`.
 * - The value is then rounded to the nearest integer because hex color components
 *   cannot have fractional values.
 * - Converts the integer to a hexadecimal string.
 * - Ensures the string has exactly 2 characters, padding with a leading '0' if necessary.
 *
 * @param n  A number representing a color component (0–255), may be float or out of bounds.
 * @returns  A 2-character string representing the number in hexadecimal (00–ff).
 *
 * @example
 * byteToHex(0)    // returns "00"
 * byteToHex(255)  // returns "ff"
 * byteToHex(16.7) // returns "11" (rounded)
 * byteToHex(-5)   // returns "00" (clamped)
 * byteToHex(300)  // returns "ff" (clamped)
 */
export function byteToHex(n: number): string {
  return Math.round(clampByte(n)).toString(16).padStart(2, "0");
}

/**
 * Filter invalid characters from a hex string.
 *
 * Converts a string into an array of valid hex characters (0–9, a–f).
 *
 * Behavior:
 * - Converts all letters to lowercase.
 * - Splits the input string into individual characters.
 * - Replaces any character not in the range 0–9 or a–f (case-insensitive) with 'f'.
 * - Useful for sanitizing user input or partial/short hex codes before further processing.
 *
 * @param input  A string that may contain hex characters and/or invalid characters.
 * @returns      An array of single-character strings, each guaranteed to be a valid hex character (0–9, a–f).
 *                Invalid characters are replaced with 'f'.
 *
 * @example
 * filterInvalidCharacters('A3!C')   // returns ['a','3','f','c']
 * filterInvalidCharacters('💥⚡a9#') // returns ['f','f','a','9','f']
 */export function filterInvalidCharacters(input: string): string[] {
    return input.toLowerCase().split("")
                .map(c => (/[0-9a-f]/.test(c) ? c : "f")); // alles außer 0–9a–f/A–F → "f"
}

/**
 * Expand short hex color notation to full length.
 *
 * Converts:
 * - 3-digit hex `#rgb` → 6-digit hex `#rrggbb`
 * - 4-digit hex `#rgba` → 8-digit hex `#rrggbbaa`
 *
 * Behavior:
 * - Only accepts strings of length 3 or 4 (excluding leading '#').
 * - Each character is duplicated to form the full hex pair:
 *      - e.g., '3' → '33', 'f' → 'ff'
 * - Invalid characters (anything outside 0–9, a–f, A–F) are replaced with 'f' by `filterInvalidCharacters`.
 * - Throws an error if input length is not 3 or 4.
 *
 * @param hex  A 3- or 4-character string representing a short hex color (without leading '#').
 * @returns    A string of 6 or 8 valid hex characters representing the expanded color.
 */
export function expandShortHex(hex: string): string {
  if (hex.length < 3 || hex.length > 4) {
      throw new Error(`expandShortHex(): expected 3 or 4 characters, got ${hex.length}`);
  }
  else return filterInvalidCharacters(hex).map(c => c + c).join("");
}

/**
 * Extract RGB(A) components from any valid hex color string.
 *
 * Supports the following hex formats:
 * - 3-digit short hex: `#rgb` → expanded to `#rrggbb`
 * - 4-digit short hex with alpha: `#rgba` → expanded to `#rrggbbaa`
 * - 6-digit full hex: `#rrggbb`
 * - 8-digit full hex with alpha: `#rrggbbaa`
 *
 * Behavior:
 * - Leading/trailing whitespace is ignored.
 * - A leading '#' is optional.
 * - Short hex forms (3- or 4-digit) are expanded to full 6- or 8-digit hex.
 * - Invalid hex characters (anything outside 0–9, a–f, A–F) are replaced with 'f'.
 * - If the hex string contains 8 digits, the 7th and 8th characters are treated as alpha; otherwise alpha is `null`.
 * - Throws an error if the input is not a valid hex format (after trimming and optional expansion).
 *
 * @param hexColor  A string representing a hex color (`#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`).
 * @returns         An object `{ r, g, b, a }` with:
 *                    - `r`, `g`, `b` → strings of 2 valid hex characters each
 *                    - `a` → string of 2 valid hex characters if alpha is present, otherwise `null`
 */
export function extractHexComponents(hexColor: string): HexComponents {
    let hex = hexColor.trim().toLowerCase().replace("#", "");

    if (hex.length <= 4) {
        hex = expandShortHex(hex); // rrggbb oder rrg gbbaa
    }

    if (hex.length !== 6 && hex.length !== 8) {
        throw new Error(`extractHexComponents: unsupported hex format: ${hexColor}`);
    }

    const r = filterInvalidCharacters(hex.slice(0, 2)).join("");
    const g = filterInvalidCharacters(hex.slice(2, 4)).join("");
    const b = filterInvalidCharacters(hex.slice(4, 6)).join("");
    const a = hex.length === 8 ? filterInvalidCharacters(hex.slice(6, 8)).join("") : null;

    return { r, g, b, a };
}

/**
 * Convert a hexadecimal alpha component ("00"–"ff") into a floating-point opacity value.
 *
 * - Accepts a 2-digit hex alpha string (e.g., `"00"`, `"ff"`, `"7f"`).
 * - Returns a value between **0 and 1**, inclusive.
 * - `"00"` maps to `0`, `"ff"` maps to `1`.
 * - If `hexA` is `null`, the function returns `null` instead of a number.
 * - If `hexA` is not a valid hex byte, the underlying `parseHexByte()` implementation
 *   determines the resulting behavior (likely clamping, defaulting, or error).
 *
 * @param hexA  A 2-character hex string representing an alpha value, or `null`.
 * @returns     A number between 0 and 1, or `null` if input is `null`.
 */
export function hexAlphaToFloat(hexA?: string | null): number {
    return parseHexByte(hexA ?? "ff") / 255;
}

/**
 * Convert a hex color string into an `rgba(r,g,b,a)` string.
 *
 * Supports any valid CSS-style hex format:
 * - 3-digit short hex: `#rgb`
 * - 4-digit short hex with alpha: `#rgba`
 * - 6-digit full hex: `#rrggbb`
 * - 8-digit full hex with alpha: `#rrggbbaa`
 *
 * Behavior:
 * - If the hex string includes an alpha component, it overrides the `alpha` parameter.
 * - The `alpha` parameter is optional, defaults to 1, and is used only if the hex color
 *   does not provide an alpha value.
 * - Invalid or missing `alpha` parameter values (e.g., NaN, <0, >1) are clamped to 1.
 * - Der Alpha-Wert wird implizit übergeben um bei Color-Pickern, die keine Alpha-Unterstützung bieten,
 *   zusätzlich einen Alpha-Wert setzen zu können.
 * - Throws an error if `hexColor` is empty or not provided.
 *
 * @param hexColor  A string representing a hex color (`#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`).
 * @param alpha     Optional alpha value (number 0–1 or string) used if hex has no alpha; defaults to 1.
 * @returns         A string in the form `rgba(r,g,b,a)`.
 */
export function hexToRgba(hexColor: string, alpha: number | string = 1): string {
    if (!hexColor) {
        throw new Error("hexToRgba: empty input");
    }

    const { r, g, b, a } = extractHexComponents(hexColor);

    const rDec = parseHexByte(r);
    const gDec = parseHexByte(g);
    const bDec = parseHexByte(b);

    // If hex has alpha → override
    let pAlpha = hexAlphaToFloat(a);
    if (a == null) {
      // Otherwise use provided alpha (default = 1)
      pAlpha =
          typeof alpha === "number"
              ? alpha
              : parseFloat(alpha);

      if (isNaN(pAlpha) || pAlpha < 0 || pAlpha > 1) {
          pAlpha = 1;
      }
    }
    return `rgba(${rDec},${gDec},${bDec},${Number(pAlpha.toFixed(3))})`;
}

/**
 * Convert a CSS `rgb(...)` or `rgba(...)` string to a 6-digit hex color `#rrggbb`.
 *
 * Behavior:
 * - Supports strings in the format `rgb(r,g,b)` or `rgba(r,g,b,a)` (alpha is ignored).
 * - Extracts the first three numeric values (red, green, blue).
 * - Each value is clamped to 0–255 and converted to a 2-digit hex string using `byteToHex`.
 * - Returns the concatenated hex string in the form `#rrggbb`.
 * - Returns `null` if the input does not match a valid `rgb(...)` or `rgba(...)` pattern.
 *
 * @param input  A string representing a CSS `rgb(...)` or `rgba(...)` color.
 * @returns      A 6-digit hex string `#rrggbb`, or `null` if input is invalid.
 *
 * @example
 * parseRgbFunction('rgb(255, 0, 128)')      // returns "#ff0080"
 * parseRgbFunction('rgba(51,102,153,0.5)')  // returns "#336699"
 * parseRgbFunction('invalid')                 // returns null
 */
export function parseRgbFunction(input: string): string | null {
    const m = input.match(/rgba?\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)/);
    if (!m) return null;

    const [r, g, b] = m.slice(1, 4).map(Number);
    return `#${byteToHex(r)}${byteToHex(g)}${byteToHex(b)}`;
}

/**
 * Convert any hex color variant to a standard 6-digit hex string `#rrggbb`.
 *
 * Supports:
 * - 3-digit short hex: `#rgb` → expanded internally to `#rrggbb`
 * - 4-digit short hex with alpha: `#rgba` → expanded internally to `#rrggbbaa` (alpha ignored)
 * - 6-digit full hex: `#rrggbb`
 * - 8-digit full hex with alpha: `#rrggbbaa` (alpha ignored)
 *
 * Behavior:
 * - Leading/trailing whitespace should be trimmed before calling (not handled internally).  
 * - Only strings starting with `#` are processed; otherwise returns `null`.
 * - Uses `extractHexComponents` to parse and sanitize the hex digits.
 * - Returns a 6-digit hex string `#rrggbb`, ignoring any alpha component.
 * - Invalid characters in the input are replaced with 'f' by `extractHexComponents`.
 *
 * @param input  A string representing a hex color (`#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`).
 * @returns      A 6-digit hex string `#rrggbb`, or `null` if the input does not start with `#`.
 *
 * @example
 * parseHex('#369')       // returns '#336699'
 * parseHex('#369f')      // returns '#336699' (alpha ignored)
 * parseHex('#336699')    // returns '#336699'
 * parseHex('#336699cc')  // returns '#336699' (alpha ignored)
 * parseHex('336699')     // returns null (missing #)
 */
export function parseHex(input: string): string | null {
    if (!input.startsWith("#")) return null;
    const { r, g, b, a } = extractHexComponents(input);
    return "#" + r + g + b;
}

/**
 * Parse a single hex byte (00–ff) into a decimal number (0–255).
 *
 * Behavior:
 * - Accepts a 2-character hexadecimal string (case-insensitive).
 * - Returns the decimal numeric value corresponding to the hex string.
 * - Does **not** perform clamping; invalid hex strings may result in `NaN`.
 * - Useful for converting sanitized hex components into RGB values.
 *
 * @param hex  A 2-character string representing a hex byte ('00'–'ff').
 * @returns    The decimal number 0–255.
 *
 * @example
 * parseHexByte('00') // returns 0
 * parseHexByte('ff') // returns 255
 * parseHexByte('80') // returns 128
 * parseHexByte('0a') // returns 10
 * parseHexByte('g0') // returns NaN (invalid character)
 */
export function parseHexByte(hex: string): number {
    return parseInt(hex, 16);
}

/**
 * Normalize various color formats into a valid 6-digit HTML hex color (#rrggbb).
 *
 * Behavior:
 * - Accepts:
 *   1. Hex strings: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`
 *   2. CSS `rgb(...)` or `rgba(...)` strings
 * - Trims leading/trailing whitespace and converts input to lowercase.
 * - Uses `parseHex` for hex inputs and `parseRgbFunction` for rgb/rgba inputs.
 * - Returns a 6-digit hex string `#rrggbb`.
 * - Throws an error for empty input or unsupported formats.
 *
 * @param input  A string representing a color in hex or rgb(a) format.
 * @returns      A normalized 6-digit hex string `#rrggbb`.
 *
 * @example
 * normalizeColorToHex('#369')          // returns '#336699'
 * normalizeColorToHex('#336699cc')     // returns '#336699'
 * normalizeColorToHex('rgb(51,102,153)')   // returns '#336699'
 * normalizeColorToHex('rgba(51,102,153,0.5)') // returns '#336699'
 * normalizeColorToHex('')              // throws Error
 * normalizeColorToHex('hsl(0,0%,0%)') // throws Error
 */
export function normalizeColorToHex(input: string): string {
    if (!input) throw new Error("normalizeColorToHex: empty input");

    const value = input.trim().toLowerCase();

    // 1) Check hex-like input
    const hexResult = parseHex(value);
    if (hexResult) return hexResult;

    // 2) Check rgb(...) / rgba(...)
    const rgbResult = parseRgbFunction(value);
    if (rgbResult) return rgbResult;

    throw new Error(`normalizeColorToHex: Unsupported color format: ${input}`);
}
