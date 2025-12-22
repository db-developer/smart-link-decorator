import { matchesInternalLink } from "../../lib/cm/buildDecorations";

const START  = "formatting-link_formatting-link-start";   // [[
const PREFIX = "hmd-internal-link_link-has-alias";        // prefix
const PIPE   = "hmd-internal-link_link-alias-pipe";       // |
const ALIAS  = "hmd-internal-link_link-alias";            // alias
const END    = "formatting-link_formatting-link-end";     // ]]

// Mock matchesInternalLink & parseWikiLink falls nötig
// Hier nehmen wir an, sie funktionieren korrekt mit realem Text
describe( "Running 02.cm/05.10.buildDecorations.test.ts", () => {
  /**
   * Testing function buildInternalLinkDecorations
   */
  describe("Testing function matchesInternalLink", () => {
    test("matchesInternalLink is defined and is a function", () => {
      expect(matchesInternalLink).toBeDefined();
      expect(typeof matchesInternalLink).toBe("function");
    });

    test("returns a cloned cursor if nodes match expected sequence", () => {
      const nodes = [
        { type: { name: START  }},
        { type: { name: PREFIX }},
        { type: { name: PIPE   }},
        { type: { name: ALIAS  }},
        { type: { name: END    }}
      ];

      let index = 0;

      const cursor = {
        node: {
          cursor() {
            return cursor; // simplified clone
          },
          type: nodes[index].type,
        },
        nextSibling() {
          index++;
          if (index >= nodes.length) return false;
          this.node.type = nodes[index].type;
          return true;
        },
      };

      const result = matchesInternalLink(cursor as any);
      expect(result).not.toBeNull();
      expect(result).toHaveProperty("node");
    });

    test("returns null if node sequence does not match", () => {
      const nodes = [
        { type: { name: START   }},
        { type: { name: "WRONG" }}
      ];

      let index = 0;
      const cursor = {
        node: { cursor() { return cursor; }, type: nodes[index].type },
        nextSibling() {
          index++;
          if (index >= nodes.length) return false;
          this.node.type = nodes[index].type;
          return true;
        },
      };

      const result = matchesInternalLink(cursor as any);
      expect(result).toBeNull();
    });
  });
});
