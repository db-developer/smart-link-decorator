import { EditorState } from "@codemirror/state";

import { SLD_SettingsFacet } from "../../lib/cm/SettingsFacet";
import type { PrefixMapping } from "../../lib/types/PrefixMapping";

/**
 * Helper function to read the facet value from an EditorState.
 */
function getFacetValue(state: EditorState): PrefixMapping[] {
  return state.facet(SLD_SettingsFacet);
}

describe( "Running 05.cm/01.00.SettingsFacet.test.ts", () => {
  /**
   * Testing SettingsFacet
   */
  describe("Testing SettingsFacet", () => {
    /*
    test("buildLinkDecorations is defined and is a function", () => {
      expect(buildLinkDecorations).toBeDefined();
      expect(typeof buildLinkDecorations).toBe("function");
    });
    */

    test("returns an empty array when no extensions contribute", () => {
      const state = EditorState.create();
      expect(getFacetValue(state)).toEqual([]);
    });
    
    test("returns the same array when a single extension contributes", () => {
      const mappings: PrefixMapping[] = [
        { prefix: ">", emoji: "📍", linkType: "location", color: "#000000", background: "#ffffff", backgroundAlpha: 1, underline: false }
      ];

      const state = EditorState.create({
        extensions: [SLD_SettingsFacet.of(mappings)]
      });

      expect(getFacetValue(state)).toEqual(mappings);
    });

    test("flattens multiple PrefixMapping arrays from different extensions", () => {
      const first: PrefixMapping[] = [
        { prefix: ">", emoji: "📍", linkType: "location", color: "#000000", background: "#ffffff", backgroundAlpha: 1, underline: false }
      ];

      const second: PrefixMapping[] = [
        { prefix: "@", emoji: "👤", linkType: "person", color: "#111111", background: "#eeeeee", backgroundAlpha: 0.8, underline: true }
      ];

      const state = EditorState.create({
        extensions: [SLD_SettingsFacet.of(first), SLD_SettingsFacet.of(second)]
      });

      expect(getFacetValue(state)).toEqual([...first, ...second]);
    });

    test("preserves the contribution order of extensions", () => {
      const first: PrefixMapping[] = [
        { prefix: "A", emoji: "🅰️", linkType: "a", color: "#000", background: "#fff", backgroundAlpha: 1, underline: false }
      ];

      const second: PrefixMapping[] = [
        { prefix: "B", emoji: "🅱️", linkType: "b", color: "#000", background: "#fff", backgroundAlpha: 1, underline: false }
      ];

      const state = EditorState.create({
        extensions: [SLD_SettingsFacet.of(first), SLD_SettingsFacet.of(second)]
      });

      const result = getFacetValue(state);

      expect(result[0].prefix).toBe("A");
      expect(result[1].prefix).toBe("B");
    });

    test("keeps only the last PrefixMapping when multiple entries share the same prefix", () => {
      const first: PrefixMapping[] = [
        { prefix: ">", emoji: "📍", linkType: "location", color: "#000000", background: "#ffffff", backgroundAlpha: 1, underline: false }
      ];

      const second: PrefixMapping[] = [
        { prefix: ">", emoji: "🧭", linkType: "navigation", color: "#ff0000", background: "#000000", backgroundAlpha: 0.5, underline: true }
      ];

      const state = EditorState.create({
        extensions: [SLD_SettingsFacet.of(first), SLD_SettingsFacet.of(second)]
      });

      const result = getFacetValue(state);

      // Expect only one entry for the prefix ">"
      expect(result).toHaveLength(1);

      // Expect the last contribution to win
      expect(result[0]).toEqual(second[0]);
    });
  });
});
