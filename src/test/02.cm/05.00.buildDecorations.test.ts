import { EditorState          } from "@codemirror/state";
import { EditorView, 
         DecorationSet        } from "@codemirror/view";
import { markdown, 
         markdownLanguage     } from "@codemirror/lang-markdown";
import { buildLinkDecorations } from "../../lib/cm/buildDecorations";
import { SLD_SettingsFacet    } from "../../lib/cm/SettingsFacet";


const docText = `
This is some text with an internal link [[TestPrefix|📌 Foo]] inside.
Another link [[#Tag|🔖 Bar]] here.
`;

// Mock matchesInternalLink & parseWikiLink falls nötig
// Hier nehmen wir an, sie funktionieren korrekt mit realem Text
describe( "Running 02.cm/05.00.buildDecorations.test.ts", () => {
  /**
   * Testing function buildInternalLinkDecorations
   */
  describe("Testing function buildLinkDecorations", () => {
    test("buildLinkDecorations is defined and is a function", () => {
      expect(buildLinkDecorations).toBeDefined();
      expect(typeof buildLinkDecorations).toBe("function");
    });

    test.skip("buildInternalLinkDecorations returns a DecorationSet with correct data-sld-type for internal links", () => {
      // Erstelle einen minimalen EditorState mit Markdown
      const state = EditorState.create({
        doc: docText,
        extensions: [
          markdown({ base: markdownLanguage }),
          SLD_SettingsFacet.of([
            { prefix: "TestPrefix", emoji: "📌", linkType: "internal", color: "#ff0000", background: "rgb(255,255,255)", backgroundAlpha: 1, underline: true },
            { prefix: "#Tag", emoji: "🔖", linkType: "tag", color: "#ff0000", background: "rgb(255,255,255)", backgroundAlpha: 1, underline: true }
          ]),
        ],
      });

      const view = new EditorView({ state });

      const decoSet: DecorationSet = buildLinkDecorations(view);

      expect(typeof decoSet).toBe("object");

      // Sammle alle data-sld-type Attribute aus den Decorations
      const types: string[] = [];
      const iter = decoSet.iter();
      
      console.log( "=============>", iter.value );
     
      while (iter.value) {
        const attr = iter.value.spec.attributes?.["data-sld-type"];
        console.log( "=============>", iter.value.spec.attributes );
        if (attr) types.push(attr);
        iter.next(); // Cursor zum nächsten Range bewegen
      }
      // Prüfen, dass beide linkTypes dekoriert wurden
      expect(types).toContain("internal");
      expect(types).toContain("tag");
    });

    test("buildInternalLinkDecorations returns empty DecorationSet if no internal links present", () => {
      const state = EditorState.create({
        doc: "Just some text without links.",
        extensions: [markdown({ base: markdownLanguage }), SLD_SettingsFacet.of([])],
      });

      const view = new EditorView({ state });

      const decoSet = buildLinkDecorations(view);

      expect(decoSet.size).toBe(0);
    });

    test.skip("decorations cover correct ranges in document", () => {
      const docText = "Link: [[Test|📌 Foo]] in text.";
      const state = EditorState.create({
        doc: docText,
        extensions: [
          markdown({ base: markdownLanguage }),
          SLD_SettingsFacet.of([{ prefix: "Test", emoji: "📌", linkType: "internal", color: "#ff0000", 
                                  background: "rgb(255,255,255)", backgroundAlpha: 1, underline: true }]),
        ],
      });
      const view = new EditorView({ state });

      const decoSet = buildLinkDecorations(view);

      const ranges: [number, number][] = [];
      const iter = decoSet.iter();

      while (iter.value) {
        ranges.push([iter.from, iter.to]);
        iter.next();
      }

      // Der Link [[Test|📌 Foo]] sollte genau die Position im Doc abdecken
      const expectedStart = docText.indexOf("[[Test|📌 Foo]]");
      const expectedEnd = expectedStart + "[[Test|📌 Foo]]".length;

      expect(ranges).toContainEqual([expectedStart, expectedEnd]);
    });
  });
});