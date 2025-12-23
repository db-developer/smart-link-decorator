import { PrefixMapping } from "../../lib/types/PrefixMapping";
import { getDynamicCSS } from "../../lib/utils/css";


function makeMapping(partial: Partial<PrefixMapping>): PrefixMapping {
  return {
    prefix: "default",
    linkType: "default",
    emoji: "",
    color: "",
    background: "",
    backgroundAlpha: 0.15,
    underline: true,
    ...partial
  };
}

describe( "Running 02.utils/08.00.css.test.ts", () => { 
  /**
   * Testing function getDynamicCSS
   */
  describe("Testing function getDynamicCSS", () => {
    test("getDynamicCSS is defined and is a function", () => {
      expect(getDynamicCSS).toBeDefined();
      expect(typeof getDynamicCSS).toBe("function");
    });

    test("returns a non-empty CSS string", () => {
      const css = getDynamicCSS(makeMapping({
        linkType: "person",
        color: "#ff0000",
        background: "rgba(10,10,10,0.2)",
        underline: true
      }));

      expect(typeof css).toBe("string");
      expect(css.length).toBeGreaterThan(10);
    });

    test("injects linkType into all selector occurrences", () => {
      const css = getDynamicCSS(makeMapping({
        linkType: "task",
        color: "#123456",
        background: "yellow",
        underline: false
      }));

      expect(css).toContain('[data-sld-type*="task"]');
      expect(css.match(/task/g)?.length).toBeGreaterThan(1); // mehrfach im CSS
    });

    test("includes color and background only if provided", () => {
      const css = getDynamicCSS(makeMapping({
        linkType: "note",
        // keine color, keine background
        underline: true
      }));

      expect(css).not.toContain("color:");
      expect(css).not.toContain("background-color:");
    });

    test("underline true → text-decoration: underline", () => {
      const css = getDynamicCSS(makeMapping({
        linkType: "u",
        underline: true
      }));

      expect(css).toContain("text-decoration: underline");
    });

    test("underline false → text-decoration: none", () => {
      const css = getDynamicCSS(makeMapping({
        linkType: "u2",
        underline: false
      }));

      // sicherstellen, dass es NUR "none" ist
      expect(css).toMatch(/text-decoration:\s*none/);
    });

    test("background is used in color-mix hover rule", () => {
      const css = getDynamicCSS(makeMapping({
        linkType: "hover-test",
        color: "#111",
        background: "rgb(200,200,200)",
        underline: true
      }));

      expect(css).toContain("color-mix(in srgb, rgb(200,200,200) 70%");
    });
  });
});
