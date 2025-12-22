import { RangeSetBuilder  } from "@codemirror/state";
import { decorate         } from "../../lib/cm/buildDecorations";

describe( "Running 02.cm/05.12.buildDecorations.test.ts", () => {

  // Mock RangeSetBuilder and Decoration
  vi.mock("@codemirror/state", () => {
    class MockRangeSetBuilder {
      add = vi.fn().mockReturnThis();
    }
    const mockFacet = {
      define: vi.fn(),
    };
    return {
      RangeSetBuilder: MockRangeSetBuilder,
      Facet: mockFacet
    };
  });

  vi.mock("@codemirror/view", () => {
    const mockDecoration = {
      mark: vi.fn((spec) => spec),
    };
    const mockViewPlugin = {
      fromClass: vi.fn(),
    };
    return {
      Decoration: mockDecoration,
      ViewPlugin: mockViewPlugin,
    };    
  });
  
  describe("Testing function decorate", () => {

    test("decorate is defined and is a function", () => {
      expect(decorate).toBeDefined();
      expect(typeof decorate).toBe("function");
    });

    test("should add a decoration if the alias starts with a matching prefix", () => {
      const builder = new RangeSetBuilder() as any; // Type Assertion, da der Mock nicht den vollständigen Typ abdeckt
      const settings = [{ prefix: "test", emoji: "", linkType: "type1" }];
      const spec = { attributes: { class: "test-class" } };
      const alias = "test-alias";
      const startFrom = 0;
      const endTo = 10;

      decorate(builder, settings, spec, alias, startFrom, endTo);

      expect(builder.add).toHaveBeenCalledWith(
        startFrom,
        endTo,
        expect.objectContaining({
          attributes: { class: "test-class", "data-sld-type": "type1" },
        })
      );
    });

    test("should add a decoration if the alias starts with a matching emoji", () => {
      const builder = new RangeSetBuilder();
      const settings = [{ prefix: "", emoji: "😊", linkType: "type2" }];
      const spec = { attributes: { class: "test-class" } };
      const alias = "😊-alias";
      const startFrom = 0;
      const endTo = 10;

      decorate(builder, settings, spec, alias, startFrom, endTo);

      expect(builder.add).toHaveBeenCalledWith(
        startFrom,
        endTo,
        expect.objectContaining({
          attributes: { class: "test-class", "data-sld-type": "type2" },
        })
      );
    });

    test("should not add a decoration if the alias does not match any prefix or emoji", () => {
      const builder = new RangeSetBuilder();
      const settings = [{ prefix: "other", emoji: "😊", linkType: "type3" }];
      const spec = { attributes: { class: "test-class" } };
      const alias = "no-match";
      const startFrom = 0;
      const endTo = 10;

      decorate(builder, settings, spec, alias, startFrom, endTo);

      expect(builder.add).not.toHaveBeenCalled();
    });

    test("should handle multiple settings correctly", () => {
      const builder = new RangeSetBuilder();
      const settings = [
        { prefix: "test1", emoji: "", linkType: "type1" },
        { prefix: "test2", emoji: "", linkType: "type2" },
      ];
      const spec = { attributes: { class: "test-class" } };
      const alias = "test1-alias";
      const startFrom = 0;
      const endTo = 10;

      decorate(builder, settings, spec, alias, startFrom, endTo);

      expect(builder.add).toHaveBeenCalledWith(
        startFrom,
        endTo,
        expect.objectContaining({
          attributes: { class: "test-class", "data-sld-type": "type1" },
        })
      );
    });

    test("should override attributes correctly", () => {
      const builder = new RangeSetBuilder();
      const settings = [{ prefix: "test", emoji: "", linkType: "type1" }];
      const spec = { attributes: { class: "test-class", "data-sld-type": "old-type" } };
      const alias = "test-alias";
      const startFrom = 0;
      const endTo = 10;

      decorate(builder, settings, spec, alias, startFrom, endTo);

      expect(builder.add).toHaveBeenCalledWith(
        startFrom,
        endTo,
        expect.objectContaining({
          attributes: { class: "test-class", "data-sld-type": "type1" },
        })
      );
    });

  });
});