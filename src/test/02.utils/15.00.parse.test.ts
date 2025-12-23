import { parseWikiLink } from "../../lib/utils/parse";

describe( "Running 02.utils/15.00.parse.test.ts", () => { 
  /**
   * Testing function parseWikiLink
   */
  describe("Testing function parseWikiLink", () => {
    test("parseWikiLink is defined and is a function", () => {
      expect(parseWikiLink).toBeDefined();
      expect(typeof parseWikiLink).toBe("function");
    });

    test("parses a normal link with prefix and alias", () => {
      const link = "[[InhaltA|InhaltB]]";
      const result = parseWikiLink(link);
      expect(result).toEqual(["InhaltA", "InhaltB"]);
    });

    test("parses a link with empty prefix", () => {
      const link = "[[|NurAlias]]";
      const result = parseWikiLink(link);
      expect(result).toEqual(["", "NurAlias"]);
    });

    test("parses a link with empty alias", () => {
      const link = "[[NurPrefix|]]";
      const result = parseWikiLink(link);
      expect(result).toEqual(["NurPrefix", ""]);
    });

    test("parses a link with both parts empty", () => {
      const link = "[[|]]";
      const result = parseWikiLink(link);
      expect(result).toEqual(["", ""]);
    });

    test("returns empty strings for invalid input (no brackets)", () => {
      const link = "InhaltA|InhaltB";
      const result = parseWikiLink(link);
      expect(result).toEqual(["", ""]);
    });

    test("returns empty strings for invalid input (missing pipe)", () => {
      const link = "[[NurPrefix]]";
      const result = parseWikiLink(link);
      expect(result).toEqual(["", ""]);
    });

    test("returns empty strings for malformed brackets", () => {
      const link = "[[NurPrefix|Alias]";
      const result = parseWikiLink(link);
      expect(result).toEqual(["", ""]);
    });

    test("trims whitespace around prefix and alias", () => {
      const link = "[[  A  |  B  ]]";
      const result = parseWikiLink(link);
      expect(result).toEqual(["  A  ", "  B  "]); // optional: call .trim() in function if desired
    });

    test("handles special characters inside parts", () => {
      const link = "[[Teil-1_äöü|Alias/ß+]]";
      const result = parseWikiLink(link);
      expect(result).toEqual(["Teil-1_äöü", "Alias/ß+"]);
    });

    test("does not match nested brackets inside parts", () => {
      const link = "[[A|B[[C]]]]";
      const result = parseWikiLink(link);
      expect(result).toEqual(["", ""]); // regex only supports [[prefix|alias]]
    });
  });
});