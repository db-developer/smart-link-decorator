import { RangeSetBuilder   } from "@codemirror/state";
import {
         Decoration,
         DecorationSet,
         EditorView        } from "@codemirror/view";
import { syntaxTree        } from "@codemirror/language";
import { TreeCursor        } from "@lezer/common";
import { PrefixMapping     } from "../types/PrefixMapping";
import { parseWikiLink     } from "../utils/parse";

// Required by parameter `spec` of function decorate()
type MarkDecorationSpec = Parameters<typeof Decoration.mark>[0];

// Node-Typen für Obsidian-internen Wiki-Link       => [[prefix|alias]]
// START  = "formatting-link_formatting-link-start" => [[
// PREFIX = "hmd-internal-link_link-has-alias"      =>  prefix
// PIPE   = "hmd-internal-link_link-alias-pipe"     => |
// ALIAS  = "hmd-internal-link_link-alias"          => alias
// END    = "formatting-link_formatting-link-end"   => ]]

const FLINK         = "formatting-link";
const FLINKSTART    = "formatting-link-start";
const FLINKEND      = "formatting-link-end";
const ILINK         = "hmd-internal-link";
const LINKHASALIAS  = "link-has-alias";
const LINKALIASPIPE = "link-alias-pipe";
const LINKALIAS     = "link-alias";

/**
 * Extracts semantic fragments from the current `TreeCursor` node type.
 *
 * The fragment list is derived by splitting the node type name at
 * underscore (`_`) characters. This is typically used to interpret
 * compound grammar node names such as:
 *
 * `formatting-link_formatting-link-start`
 *
 * which results in:
 *
 * `["formatting-link", "formatting-link-start"]`
 *
 * @param cursor - The `TreeCursor` positioned at the node whose type name
 *                 should be analyzed.
 * @returns An array of string fragments in declaration order.
 *
 * @remarks
 * - The cursor is not mutated by this function.
 * - No validation is performed; the result reflects the raw node type name.
 */
export function getFragments(cursor: TreeCursor): string[] {
  return cursor.node.type.name.split("_");
}

/**
 * Determines whether a fragment list represents the start of a formatting link.
 *
 * The function checks for the simultaneous presence of the required
 * formatting-link identifiers within the provided fragment array.
 * Both constants must be present for the fragment set to be considered
 * a formatting-link start.
 *
 * @param fragments - An array of semantic fragments derived from a node type
 *                    (typically produced by {@link getFragments}).
 * @returns `true` if the fragments indicate a formatting-link start,
 *          otherwise `false`.
 *
 * @remarks
 * - The check is order-independent.
 * - The input array is not modified.
 * - Missing or partial fragment sets will always yield `false`.
 */
export function isFLinkStart(fragments: string[]): boolean {
  return fragments.includes(FLINK) && fragments.includes(FLINKSTART);
}

/**
 * Determines whether a fragment list represents the end of a formatting link.
 *
 * The function evaluates the provided fragment array for the presence of
 * all required formatting-link end identifiers. Both constants must be
 * present for the fragments to be interpreted as a formatting-link end.
 *
 * @param fragments - An array of semantic fragments derived from a node type
 *                    (typically produced by {@link getFragments}).
 * @returns `true` if the fragments indicate a formatting-link end,
 *          otherwise `false`.
 *
 * @remarks
 * - The evaluation is order-independent.
 * - The input array remains unchanged.
 * - Incomplete or mismatched fragment sets will always return `false`.
 */
export function isFLinkEnd(fragments: string[]): boolean {
  return fragments.includes(FLINK) && fragments.includes(FLINKEND);
}

/**
 * Determines whether a fragment list represents an internal link with an alias.
 *
 * The function checks whether the provided fragment array contains the
 * required identifiers for an internal link that defines an alias.
 * Both constants must be present for the fragments to match this condition.
 *
 * @param fragments - An array of semantic fragments derived from a node type
 *                    (typically produced by {@link getFragments}).
 * @returns `true` if the fragments indicate an internal link with an alias,
 *          otherwise `false`.
 *
 * @remarks
 * - The evaluation is order-independent.
 * - The input array is not modified.
 * - Fragment sets lacking either identifier will always return `false`.
 */
export function isInternalLinkWithAlias(fragments: string[]): boolean {
  return fragments.includes(ILINK) && fragments.includes(LINKHASALIAS);
}

/**
 * Determines whether a fragment list represents an internal link using a pipe-based alias.
 *
 * The function evaluates the provided fragment array for the presence of
 * the required identifiers that denote an internal link whose alias is
 * separated using a pipe (`|`) syntax.
 *
 * @param fragments - An array of semantic fragments derived from a node type
 *                    (typically produced by {@link getFragments}).
 * @returns `true` if the fragments indicate an internal link with a pipe-based alias,
 *          otherwise `false`.
 *
 * @remarks
 * - The evaluation is order-independent.
 * - The input array remains unchanged.
 * - Fragment sets missing either identifier will always return `false`.
 */
export function isInternalLinksPipe(fragments: string[]): boolean {
  return fragments.includes(ILINK) && fragments.includes(LINKALIASPIPE);
}

/**
 * Determines whether a fragment list represents an internal link with an alias.
 *
 * The function checks the provided fragment array for the presence of
 * the identifiers that indicate an internal link defining an alias
 * (not necessarily pipe-separated).
 *
 * @param fragments - An array of semantic fragments derived from a node type
 *                    (typically produced by {@link getFragments}).
 * @returns `true` if the fragments indicate an internal link with an alias,
 *          otherwise `false`.
 *
 * @remarks
 * - The evaluation is order-independent.
 * - The input array is not modified.
 * - Fragment sets lacking either identifier will always return `false`.
 */
export function isInternalLinksAlias(fragments: string[]): boolean {
  return fragments.includes(ILINK) && fragments.includes(LINKALIAS);
}

/**
 * Executes a continuation handler if the current cursor node matches a condition.
 *
 * This function extracts fragments from the current `TreeCursor` node using
 * {@link getFragments} and passes them to the provided `match` callback.
 * If `match` returns `true`, the function delegates further processing
 * to the `next` callback, passing the current cursor. Otherwise, it returns `null`.
 *
 * @param cursor - The `TreeCursor` positioned at the node to evaluate.
 * @param match - A predicate function that receives the node fragments and
 *                returns `true` if the continuation should proceed.
 * @param next - A callback function invoked when `match` returns `true`.
 *               It receives the current cursor and must return either
 *               a `TreeCursor` or `null`.
 * @returns The result of the `next` callback if `match` succeeds, otherwise `null`.
 *
 * @remarks
 * - The cursor is not mutated by this function.
 * - The function is commonly used for recursive or chained tree traversal.
 * - All non-matching paths immediately return `null`.
 */
export function onMatchContinue(
  cursor: TreeCursor,
  match: (fragments: string[]) => boolean,
  next: (cursor: TreeCursor) => TreeCursor | null
): TreeCursor | null {
  // Step 1: extract fragments
  const fragments = getFragments(cursor)

  // Step 2: pass fragments to matcher
  if (!match(fragments)) return null;

  // Step 4: delegate to recursive handler
  return next(cursor);
}

/**
 * Attempts to match a complete internal formatting link sequence starting from the current cursor.
 *
 * This function performs a stepwise traversal of the syntax tree using a cloned `TreeCursor`
 * and evaluates each node against a predefined sequence of predicates:
 * 1. {@link isFLinkStart} – detects the start of a formatting link.
 * 2. {@link isInternalLinkWithAlias} – detects an internal link that defines an alias.
 * 3. {@link isInternalLinksPipe} – detects an internal link using a pipe-based alias.
 * 4. {@link isInternalLinksAlias} – detects an internal link with a standard alias.
 * 5. {@link isFLinkEnd} – detects the end of a formatting link.
 *
 * The function uses {@link onMatchContinue} to perform controlled continuation
 * only when each predicate matches. If at any point a match fails or there is no
 * next sibling, the function returns `null`.
 *
 * @param cursor - The `TreeCursor` positioned at the node where the matching attempt should begin.
 * @returns A cloned `TreeCursor` positioned at the end node of the matched internal link sequence
 *          if the full sequence matches; otherwise, `null`.
 *
 * @remarks
 * - The input cursor is not mutated; all operations are performed on independent clones.
 * - Matching is strictly sequential and order-dependent.
 * - Each step only proceeds if the previous predicate succeeds and a next sibling exists.
 * - Useful for parsing structured markdown links with alias syntax in a syntax tree.
 *
 * @example
 * ```ts
 * const matchCursor = matchesInternalLink(cursor);
 * if (matchCursor) {
 *   // Successfully matched a full internal link sequence
 *   const endNode = matchCursor.node;
 * }
 * ```
 */
export function matchesInternalLink(cursor: TreeCursor): TreeCursor | null {
  const probe = cursor.node.cursor(); // independent clone
  
  return onMatchContinue(probe, (fragments) => {return isFLinkStart(fragments)}, (cursor)=> {
    if (!cursor.nextSibling()) return null;
    else return onMatchContinue( cursor, (fragments) => {return isInternalLinkWithAlias(fragments)}, (cursor)=> {
      if (!cursor.nextSibling()) return null;
      else return onMatchContinue( cursor, (fragments) => {return isInternalLinksPipe(fragments)}, (cursor)=> {
        if (!cursor.nextSibling()) return null;
        else return onMatchContinue( cursor, (fragments) => {return isInternalLinksAlias(fragments)}, (cursor)=> {
          if (!cursor.nextSibling()) return null;
          else return onMatchContinue( cursor, (fragments) => {return isFLinkEnd(fragments)}, (cursor)=> {
            return cursor.node.cursor(); // independant clone
          });
        });
      });
    });
  });
}

/**
 * Adds a mark decoration to the given RangeSetBuilder if the provided alias
 * text matches any prefix rule defined in the given settings.
 *
 * The function performs a simple prefix-based classification of internal links:
 * it compares the resolved alias text against each configured `PrefixMapping`
 * entry. If the alias begins with either the mapping's `prefix` or its `emoji`,
 * a decoration is created using the supplied `MarkDecorationSpec` and added to
 * the given range within the builder.
 *
 * Notes:
 * - This function does not modify or inspect the document itself—only the
 *   alias text, which must already have been extracted by the caller.
 * - All decorations created share the same spec object; the function makes no
 *   assumptions about what attributes the spec contains.
 * - Multiple mappings may match the same alias; in that case, the builder will
 *   receive multiple decorations for the same range.
 *
 * @param builder
 *   An instance of `RangeSetBuilder<Decoration>` that accumulates decorations
 *   before finalizing them into a `DecorationSet`.
 *
 * @param settings
 *   An array of `PrefixMapping` entries that define which prefixes (plain-text
 *   or emoji) should trigger decorations.
 *
 * @param spec
 *   A `MarkDecorationSpec` object that is passed directly into
 *   `Decoration.mark`. The caller controls the produced decoration’s CSS class,
 *   attributes, etc.
 *
 * @param alias
 *   The alias portion of a wiki link (e.g. `InhaltB` from `[[InhaltA|InhaltB]]`).
 *   Matching is performed exclusively against this value.
 *
 * @param startFrom
 *   The inclusive start position (in document coordinates) at which the
 *   decoration should be applied.
 *
 * @param endTo
 *   The exclusive end position (in document coordinates) defining the
 *   decoration’s extent.
 */
export function decorate(builder: RangeSetBuilder<Decoration>, settings: PrefixMapping[], spec: MarkDecorationSpec, alias: string, startFrom: number, endTo: number) {
  for (const setting of settings) {
    if (alias.startsWith(setting.prefix) || alias.startsWith(setting.emoji)) {
        const attributes = {"data-sld-type": setting.linkType}
        const newspec    = {...spec, attributes: { ...spec.attributes || {}, ...attributes }}
        const decoration = Decoration.mark( newspec );
        return builder.add(startFrom, endTo, decoration);
    }
  }
}

/**
 * Traverses the syntax tree to find all wiki links and invokes a callback for each match.
 *
 * This function recursively walks the tree starting from the provided `TreeCursor`,
 * identifying wiki links of the form `[[filename|alias]]` using {@link matchesInternalLink}.
 * For each complete wiki link found, it extracts the source text, parses the filename
 * and alias, and invokes the provided callback with this information.
 *
 * @param view - The `EditorView` containing the document.
 * @param cursor - A `TreeCursor` positioned at the root or starting node for traversal.
 * @param callback - A function invoked for each matched wiki link. Receives:
 *                   - `startFrom`: the start position of the link in the document.
 *                   - `endTo`: the end position of the link in the document.
 *                   - `fname`: the filename part of the link.
 *                   - `alias`: the alias part of the link.
 *
 * @remarks
 * - Traversal is depth-first and recursive.
 * - Child nodes are recursively visited before moving to next siblings.
 * - The function relies on {@link matchesInternalLink} to detect complete wiki link structures.
 * - The document is not modified; only read access is performed.
 *
 * @example
 * ```ts
 * findWikiLinks(view, treeCursor, (from, to, fname, alias) => {
 *   console.log(`Found wiki link: ${fname} with alias: ${alias} at ${from}-${to}`);
 * });
 * ```
 */
export function findWikiLinks(view: EditorView, cursor: TreeCursor,
  callback: (startFrom: number, endTo: number, fname: string, alias: string) => void
) {
  /**
   * Internal recursive function to traverse the syntax tree.
   * @param {TreeCursor} cursor - The current cursor position in the tree.
   */  
  const traverse = (cursor: TreeCursor) => {
    do {
      // Check if the current node points to a wiki link ("[[prefix|alias]]")
      const matchCursor = matchesInternalLink(cursor);

      // Verify the next siblings form a complete wiki link structure
      if (matchCursor) {
        const from = cursor.node.from;
        const to   = matchCursor.node.to;

        const linkText = view.state.sliceDoc(from, to);
        const [fname, alias] = parseWikiLink(linkText);
        callback(from, to, fname, alias);
      }

      // Recursively traverse child nodes if they exist
      if (cursor.firstChild()) {
        traverse(cursor);
        cursor.parent();
      }
    } while (cursor.nextSibling());
  };

  // Start the traversal from the provided cursor
  traverse(cursor);
}

/**
 * Builds editor decorations for all wiki links in the current document.
 *
 * This function traverses the syntax tree of the editor using `findWikiLinks`,
 * and applies decorations to each detected wiki link based on the provided settings.
 *
 * @param view - The `EditorView` containing the document and its state.
 * @param settings - An array of `PrefixMapping` objects defining how different
 *                   link prefixes should be decorated.
 * @returns A `DecorationSet` containing all the generated decorations.
 *
 * @remarks
 * - Uses a `RangeSetBuilder` to efficiently accumulate decorations.
 * - The cursor from the syntax tree is used to locate all wiki links.
 * - Delegates the actual decoration logic to the `decorate` function.
 * - The returned `DecorationSet` can be used directly in an EditorView plugin.
 */
export function buildLinkDecorations(view: EditorView, settings: PrefixMapping[]): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const tree = syntaxTree(view.state);
  const cursor = tree.cursor();

  findWikiLinks(view, cursor, (startFrom, endTo, fname, alias) => {
    decorate(builder, settings, {}, alias, startFrom, endTo);
  });

  return builder.finish();
}