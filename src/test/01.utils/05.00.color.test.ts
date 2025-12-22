import * as ColorUtils from "../../lib/utils/color";
import { HexComponents } from "../../lib/types/HexComponents";
import { clampByte,
         byteToHex,
         filterInvalidCharacters,
         expandShortHex,
         extractHexComponents,
         hexAlphaToFloat,
         hexToRgba,
         parseRgbFunction,
         parseHex,
         parseHexByte,
         normalizeColorToHex
       } from "../../lib/utils/color";


describe( "Running 01.utils/05.00.color.test.ts", () => {
  /**
   * Testing function clampByte
   */
  describe("Testing function clampByte", () => {
    test("clampByte is defined and is a function", () => {
      expect(clampByte).toBeDefined();
      expect(typeof clampByte).toBe("function");
    });

    test("clamps positive values within range unchanged", () => {
      expect(clampByte(0)).toBe(0);
      expect(clampByte(128)).toBe(128);
      expect(clampByte(255)).toBe(255);
    });

    test("clamps negative values to 0", () => {
      expect(clampByte(-1)).toBe(0);
      expect(clampByte(-100)).toBe(0);
    });

    test("clamps values above 255 to 255", () => {
      expect(clampByte(256)).toBe(255);
      expect(clampByte(1000)).toBe(255);
    });

    test("handles floating point numbers", () => {
      expect(clampByte(128.5)).toBe(128.5);
      expect(clampByte(-0.5)).toBe(0);
      expect(clampByte(255.9)).toBe(255);
    });
  });
  /**
   * Testing function byteToHex
   */
  describe("Testing function byteToHex", () => {
    test("byteToHex is defined and is a function", () => {
      expect(byteToHex).toBeDefined();
      expect(typeof byteToHex).toBe("function");
    });

    test("converts numbers within 0-255 to two-digit hex", () => {
      expect(byteToHex(0)).toBe("00");
      expect(byteToHex(1)).toBe("01");
      expect(byteToHex(10)).toBe("0a");
      expect(byteToHex(15)).toBe("0f");
      expect(byteToHex(16)).toBe("10");
      expect(byteToHex(255)).toBe("ff");
    });

    test("clamps negative numbers to 00", () => {
      expect(byteToHex(-1)).toBe("00");
      expect(byteToHex(-100)).toBe("00");
    });

    test("clamps numbers above 255 to ff", () => {
      expect(byteToHex(256)).toBe("ff");
      expect(byteToHex(1000)).toBe("ff");
    });

    test("handles floating point numbers", () => {
      expect(byteToHex(0.2)).toBe("00");
      expect(byteToHex(128.4)).toBe("80");
      expect(byteToHex(128.5)).toBe("81");
      expect(byteToHex(255.9)).toBe("ff");
    });
  });
  /**
   * Testing function filterInvalidCharacters
   */
  describe("Testing function filterInvalidCharacters", () => {
    test("filterInvalidCharacters is defined and is a function", () => {
      expect(filterInvalidCharacters).toBeDefined();
      expect(typeof filterInvalidCharacters).toBe("function");
    });
  
    test("keeps valid lowercase hex characters", () => {
      expect(filterInvalidCharacters("0123456789abcdef"))
        .toEqual("0123456789abcdef".split(""));
    });

    test("converts uppercase hex characters to lowercase", () => {
      expect(filterInvalidCharacters("ABCDEF"))
        .toEqual("abcdef".split(""));
    });

    test("replaces invalid characters with \"f\"", () => {
      expect(filterInvalidCharacters("ghijkl"))
        .toEqual(["f","f","f","f","f","f"]);
    });

    test("handles a mixed string correctly", () => {
      expect(filterInvalidCharacters("aG3!z"))
        .toEqual(["a","f","3","f","f"]);
    });

    test("returns an empty array for empty string", () => {
      expect(filterInvalidCharacters("")).toEqual([]);
    });

    test("handles numeric-only strings", () => {
      expect(filterInvalidCharacters("1234"))
        .toEqual(["1","2","3","4"]);
    });

    test("handles special characters and emojis", () => {
      // emoji using surrogate pair:      💥 (U+1F4A5) => '💥'.length == 2
      // emoji not using surrogate pair:  ⚡ (U+26A1)  => '⚡'.length == 1
      expect(filterInvalidCharacters("💥💥a9#"))
        .toEqual(["f","f", "f", "f", "a","9","f"]);
      expect(filterInvalidCharacters("💥⚡a9#"))
        .toEqual(["f","f", "f", "a","9","f"]);
      expect(filterInvalidCharacters("⚡⚡a9#"))
        .toEqual(["f","f", "a","9","f"]);
    });

    test("replaces spaces with \"f\"", () => {
      expect(filterInvalidCharacters(" a "))
        .toEqual(["f", "a", "f"]);
    });

    test("replaces umlauts and accented characters with \"f\"", () => {
      expect(filterInvalidCharacters("äöüéáç"))
        .toEqual(["f","f","f","f","f","f"]);
    });
  });
  /**
   * Testing function expandShortHex
   */
  describe("Testing function expandShortHex", () => {
    test("expandShortHex is defined and is a function", () => {
      expect(expandShortHex).toBeDefined();
      expect(typeof expandShortHex).toBe("function");
    });

    test("error message contains length information", () => {
      expect(() => expandShortHex("a")).toThrow(/expected 3 or 4 characters/i);
    });

    test("throws for strings shorter than 3 characters", () => {
      expect(() => expandShortHex("")).toThrow();
      expect(() => expandShortHex("a")).toThrow();
      expect(() => expandShortHex("1")).toThrow();
      expect(() => expandShortHex("ff")).toThrow();
    });

    test("throws for strings longer than 4 characters", () => {
      expect(() => expandShortHex("abcde")).toThrow();
      expect(() => expandShortHex("12345")).toThrow();
      expect(() => expandShortHex("fffff")).toThrow();
      expect(() => expandShortHex("abcdef")).toThrow();
    });

    test("expands 3-digit hex codes to 6-digit hex", () => {
      expect(expandShortHex("abc")).toBe("aabbcc");
      expect(expandShortHex("123")).toBe("112233");
      expect(expandShortHex("fff")).toBe("ffffff");
      expect(expandShortHex("0f0")).toBe("00ff00");
    });

    test("converts uppercase letters to lowercase", () => {
      expect(expandShortHex("ABC")).toBe("aabbcc");
      expect(expandShortHex("F0A")).toBe("ff00aa");
    });

    test("replaces invalid characters with \"f\"", () => {
      expect(expandShortHex("g1h")).toBe("ff11ff");
      expect(expandShortHex("@?%")).toBe("ffffff");
      expect(expandShortHex("aZa")).toBe("aaffaa");
      expect(expandShortHex("1F?")).toBe("11ffff");
    });

    test("handles numeric-only strings", () => {
      expect(expandShortHex("123")).toBe("112233");
      expect(expandShortHex("9999")).toBe("99999999");
    });

    test("handles mixed-case + invalid chars", () => {
      expect(expandShortHex("A1Z")).toBe("aa11ff");
      expect(expandShortHex("cD!")).toBe("ccddff");
    });

    test("handles 4-character hex strings (rgba shorthand)", () => {
      expect(expandShortHex("abcd")).toBe("aabbccdd");
      expect(expandShortHex("F09G")).toBe("ff0099ff"); // G → f
    });
  });
  /**
   * Testing function extractHexComponents
   */
  describe("Testing function extractHexComponents", () => {
    test("extractHexComponents is defined and is a function", () => {
      expect(extractHexComponents).toBeDefined();
      expect(typeof extractHexComponents).toBe("function");
    });

    test("extracts from 6-digit hex", () => {
      expect(extractHexComponents("#a1b2c3")).toEqual({
        r: "a1",
        g: "b2",
        b: "c3",
        a: null
      });
    });

    test("extracts from 6-digit hex without #", () => {
      expect(extractHexComponents("a1b2c3")).toEqual({
        r: "a1",
        g: "b2",
        b: "c3",
        a: null
      });
    });

    test("extracts from 8-digit hex (with alpha)", () => {
      expect(extractHexComponents("#11223344")).toEqual({
        r: "11",
        g: "22",
        b: "33",
        a: "44"
      });
    });

    test("uppercase hex is converted to lowercase", () => {
      expect(extractHexComponents("#AABBCC")).toEqual({
        r: "aa",
        g: "bb",
        b: "cc",
        a: null
      });
    });

    test("short hex #abc expands correctly", () => {
      expect(extractHexComponents("#abc")).toEqual({
        r: "aa",
        g: "bb",
        b: "cc",
        a: null
      });
    });

    test("short hex #abcd expands correctly with alpha", () => {
      expect(extractHexComponents("#abcd")).toEqual({
        r: "aa",
        g: "bb",
        b: "cc",
        a: "dd"
      });
    });

    test("invalid characters are replaced using filterInvalidCharacters", () => {
      // "g" → f , "z" → f  
      // Input: g3 z9 k1   nach lowercase + filter: f3 f9 f1
      expect(extractHexComponents("#g3z9k1")).toEqual({
        r: "f3",
        g: "f9",
        b: "f1",
        a: null
      });
    });

    test("invalid characters in alpha channel are filtered", () => {
      expect(extractHexComponents("#112233gk")).toEqual({
        r: "11",
        g: "22",
        b: "33",
        a: "ff"
      });
    });

    test("throws on invalid hex length (5 chars, 7 chars, etc.)", () => {
      expect(() => extractHexComponents("#12345")).toThrow();
      expect(() => extractHexComponents("#1234567")).toThrow();
      expect(() => extractHexComponents("1")).toThrow();
      expect(() => extractHexComponents("123456789")).toThrow();
    });

    test("trims whitespace before processing", () => {
      expect(extractHexComponents("   #112233   ")).toEqual({
        r: "11",
        g: "22",
        b: "33",
        a: null
      });
    });
  });
  /**
   * Testing function hexAlphaToFloat
   */
  describe("Testing function hexAlphaToFloat", () => {
    test("hexAlphaToFloat is defined and is a function", () => {
      expect(hexAlphaToFloat).toBeDefined();
      expect(typeof hexAlphaToFloat).toBe("function");
    });

    test("no argument returns 1 (default opacity)", () => {
      expect(hexAlphaToFloat()).toBe(1);
    });

    test("undefined explicitly returns 1 (default opacity)", () => {
      expect(hexAlphaToFloat(undefined)).toBe(1);
    });

    test("null returns 1 (default opacity)", () => {
      expect(hexAlphaToFloat(null)).toBe(1);
    });

    test("\"00\" converts to 0", () => {
      expect(hexAlphaToFloat("00")).toBe(0);
    });

    test("\"ff\" converts to 1", () => {
      expect(hexAlphaToFloat("ff")).toBe(1);
    });

    test("\"7f\" (127) converts to approx 0.498", () => {
      expect(hexAlphaToFloat("7f")).toBeCloseTo(127 / 255, 5);
    });

    test("\"80\" (128) converts to approx 0.502", () => {
      expect(hexAlphaToFloat("80")).toBeCloseTo(128 / 255, 5);
    });

    test("delegates parsing to parseHexByte", () => {
      const spy = vi.spyOn(ColorUtils, "parseHexByte").mockReturnValue(200);
      expect(hexAlphaToFloat("c8")).toBeCloseTo(200 / 255, 5);
      spy.mockRestore();
    });
  });
  /**
   * Testing function hexToRgba
   */
  describe("Testing function hexToRgba", () => {
    test("hexToRgba is defined and is a function", () => {
      expect(hexToRgba).toBeDefined();
      expect(typeof hexToRgba).toBe("function");
    });

    test("throws error on empty input", () => {
      expect(() => hexToRgba("")).toThrow("hexToRgba: empty input");
    });

    test("converts 6-digit hex without alpha", () => {
      // rgb: #336699 → 51,102,153
      expect(hexToRgba("#336699")).toBe("rgba(51,102,153,1)");
    });

    test("converts 3-digit short hex without alpha", () => {
      // #369 → r:33,g:102,b:153
      expect(hexToRgba("#369")).toBe("rgba(51,102,153,1)");
    });

    test("uses provided alpha if hex has no alpha", () => {
      expect(hexToRgba("#336699", 0.5)).toBe("rgba(51,102,153,0.5)");
      expect(hexToRgba("#336699", "0.25")).toBe("rgba(51,102,153,0.25)");
    });

    test("clamps invalid alpha values to 1", () => {
      expect(hexToRgba("#336699", -1)).toBe("rgba(51,102,153,1)");
      expect(hexToRgba("#336699", 2)).toBe("rgba(51,102,153,1)");
      expect(hexToRgba("#336699", "abc")).toBe("rgba(51,102,153,1)");
    });

    test("uses hex alpha if provided (4- or 8-digit)", () => {
      // Mock parseHexByte / hexAlphaToFloat falls nötig
      // z.B. #33669980 → r:51,g:102,b:153,a:0.502
      const spyAlpha = vi.spyOn(ColorUtils, "hexAlphaToFloat").mockReturnValue(0.502);
      const spyParse = vi.spyOn(ColorUtils, "parseHexByte").mockImplementation((s) => parseInt(s,16));
      
      expect(hexToRgba("#33669980")).toBe("rgba(51,102,153,0.502)");

      spyAlpha.mockRestore();
      spyParse.mockRestore();
    });

    test("converts 8-digit full hex with alpha", () => {
      const spyAlpha = vi.spyOn(ColorUtils, "hexAlphaToFloat").mockReturnValue(0.8);
      const spyParse = vi.spyOn(ColorUtils, "parseHexByte").mockImplementation((s) => parseInt(s,16));

      expect(hexToRgba("#336699CC")).toBe("rgba(51,102,153,0.8)");

      spyAlpha.mockRestore();
      spyParse.mockRestore();
    });
  });
  /**
   * Testing function parseRgbFunction
   */
  describe("Testing function parseRgbFunction", () => {
    test("parseRgbFunction is defined and is a function", () => {
      expect(parseRgbFunction).toBeDefined();
      expect(typeof parseRgbFunction).toBe("function");
    });

    test('converts rgb(...) to hex', () => {
      expect(parseRgbFunction('rgb(255, 0, 128)')).toBe('#ff0080');
      expect(parseRgbFunction('rgb(51,102,153)')).toBe('#336699');
    });

    test('converts rgba(...) to hex ignoring alpha', () => {
      expect(parseRgbFunction('rgba(51,102,153,0.5)')).toBe('#336699');
      expect(parseRgbFunction('rgba(0,255,0,1)')).toBe('#00ff00');
    });

    test('trims whitespace around numbers', () => {
      expect(parseRgbFunction('rgb(  12 , 34 , 56 )')).toBe('#0c2238');
      expect(parseRgbFunction('rgba(1, 2, 3, 0.9)')).toBe('#010203');
    });

    test('returns null for invalid input', () => {
      expect(parseRgbFunction('rgb()')).toBeNull();
      expect(parseRgbFunction('rgba(255,255)')).toBeNull();
      expect(parseRgbFunction('hsl(0,0%,0%)')).toBeNull();
      expect(parseRgbFunction('')).toBeNull();
    });

    test('clamps values above 255 and below 0', () => {
      expect(parseRgbFunction('rgb(-10, 300, 128)')).toBe('#00ff80');
    });
  });
  /**
   * Testing function parseHex
   */
  describe("Testing function parseHex", () => {
    test("parseHex is defined and is a function", () => {
      expect(parseHex).toBeDefined();
      expect(typeof parseHex).toBe("function");
    });

    test('converts 3-digit short hex to 6-digit', () => {
      expect(parseHex('#369')).toBe('#336699');
    });

    test('converts 4-digit short hex to 6-digit ignoring alpha', () => {
      expect(parseHex('#369f')).toBe('#336699');
    });

    test('returns 6-digit hex unchanged', () => {
      expect(parseHex('#336699')).toBe('#336699');
    });

    test('returns 6-digit hex from 8-digit input ignoring alpha', () => {
      expect(parseHex('#336699cc')).toBe('#336699');
    });

    test('returns null for input without #', () => {
      expect(parseHex('336699')).toBeNull();
      expect(parseHex('abc')).toBeNull();
      expect(parseHex('')).toBeNull();
    });

    test('replaces invalid characters with f', () => {
      expect(parseHex('#g0h')).toBe('#ff00ff'); // g → f, h → f, 0 ok
    });
  });
  /**
   * Testing function parseHexByte
   */
  describe("Testing function parseHexByte", () => {
    test("parseHexByte is defined and is a function", () => {
      expect(parseHexByte).toBeDefined();
      expect(typeof parseHexByte).toBe("function");
    });

    test('parses valid hex bytes', () => {
      expect(parseHexByte('00')).toBe(0);
      expect(parseHexByte('ff')).toBe(255);
      expect(parseHexByte('80')).toBe(128);
      expect(parseHexByte('0a')).toBe(10);
      expect(parseHexByte('A0')).toBe(160); // uppercase
    });

    test('returns NaN for invalid hex characters', () => {
      expect(parseHexByte('gg')).toBeNaN();
      expect(parseHexByte('x1')).toBeNaN();
      expect(parseHexByte('1x')).toBe(1);
      expect(parseHexByte('')).toBeNaN();
    });

    test('handles edge cases', () => {
      expect(parseHexByte('0')).toBe(0);    // single character, treated as 0
      expect(parseHexByte('f')).toBe(15);   // single character, treated as f → 15
    });
  });
  /**
   * Testing function normalizeColorToHex
   */
  describe("Testing function normalizeColorToHex", () => {
    test("normalizeColorToHex is defined and is a function", () => {
      expect(normalizeColorToHex).toBeDefined();
      expect(typeof normalizeColorToHex).toBe("function");
    });
  
    test('normalizes 3-digit hex', () => {
      expect(normalizeColorToHex('#369')).toBe('#336699');
    });

    test('normalizes 4-digit hex ignoring alpha', () => {
      expect(normalizeColorToHex('#369f')).toBe('#336699');
    });

    test('normalizes 6-digit hex', () => {
      expect(normalizeColorToHex('#336699')).toBe('#336699');
    });

    test('normalizes 8-digit hex ignoring alpha', () => {
      expect(normalizeColorToHex('#336699cc')).toBe('#336699');
    });

    test('normalizes rgb(...) strings', () => {
      expect(normalizeColorToHex('rgb(51,102,153)')).toBe('#336699');
      expect(normalizeColorToHex('rgb( 12 , 34 , 56 )')).toBe('#0c2238');
    });

    test('normalizes rgba(...) strings ignoring alpha', () => {
      expect(normalizeColorToHex('rgba(51,102,153,0.5)')).toBe('#336699');
    });

    test('throws on empty input', () => {
      expect(() => normalizeColorToHex('')).toThrow(/empty input/);
    });

    test('throws on unsupported formats', () => {
      expect(() => normalizeColorToHex('hsl(0,0%,0%)')).toThrow(/Unsupported color format/);
      expect(() => normalizeColorToHex('blue')).toThrow(/Unsupported color format/);
    });
  });
});