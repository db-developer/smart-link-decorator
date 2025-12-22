import { findWikiLinks } from "../../lib/cm/buildDecorations";

describe( "Running 02.cm/05.12.buildDecorations.test.ts", () => {

  // Mock für EditorView
  const mockView = {
    state: {
      sliceDoc: vi.fn((from: number, to: number) => `[[link|Alias]]`),
    },
  };

  // Mock für TreeCursor
  class MockTreeCursor {
    node = { type: { name: "" }, from: 0, to: 0, cursor: () => this };
    firstChild = vi.fn().mockReturnValue(false);
    nextSibling = vi.fn().mockReturnValue(false);
    parent = vi.fn();

    constructor(nodeType: string, from: number, to: number) {
      this.node.type.name = nodeType;
      this.node.from = from;
      this.node.to = to;
    }
  }

 // Mock für matchesInternalLink
  vi.mock("./matchesInternalLink", () => ({
    default: vi.fn().mockReturnValue(true),
  }));

  // Mock für parseWikiLink
  vi.mock("./parseWikiLink", () => ({
    default: vi.fn().mockReturnValue(["link", "Alias"]),
  }));

  describe("Testing function findWikiLinks", () => {

    test("findWikiLinks is defined and is a function", () => {
      expect(findWikiLinks).toBeDefined();
      expect(typeof findWikiLinks).toBe("function");
    });

    test.skip("should call callback for a valid wiki link", () => {
      const callback = vi.fn();
      const cursor = new MockTreeCursor("formatting-link_formatting-link-start", 0, 10);

      // Mock für firstChild/nextSibling anpassen, um Traversierung zu simulieren
      cursor.firstChild = vi.fn().mockReturnValue(false);
      cursor.nextSibling = vi.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);

      findWikiLinks(mockView as any, cursor as any, callback);

      expect(callback).toHaveBeenCalledWith(0, 10, "link", "Alias");
    });

    test("should not call callback if no START node is found", () => {
      const callback = vi.fn();
      const cursor = new MockTreeCursor("other-node", 0, 10);

      findWikiLinks(mockView as any, cursor as any, callback);

      expect(callback).not.toHaveBeenCalled();
    });

    test.skip("should not call callback if matchesInternalLink returns false", () => {
      const callback = vi.fn();
      const cursor = new MockTreeCursor("formatting-link_formatting-link-start", 0, 10);
      vi.mocked(matchesInternalLink).mockReturnValue(false);

      findWikiLinks(mockView as any, cursor as any, callback);

      expect(callback).not.toHaveBeenCalled();
    });
  });
});