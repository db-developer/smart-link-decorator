import { EditorView,
         ViewPlugin,
         ViewUpdate        } from "@codemirror/view";
import { SLD_SettingsFacet } from "./SettingsFacet";

/**
 * CodeMirror 6 ViewPlugin that observes editor updates in order to
 * replace alias prefixes inside completed wikilinks with their
 * corresponding emoji (or other replacement strings).
 *
 * The plugin itself is stateless with regard to configuration:
 * all settings are retrieved dynamically from `SLD_SettingsFacet`,
 * ensuring immediate reaction to configuration changes without
 * recreating the plugin.
 *
 * Responsibilities:
 * - Detect completion of wikilinks via user input (e.g. typing "]]")
 * - Detect when the caret leaves an existing wikilink
 * - Parse aliases of the form [[target|:alias]]
 * - Schedule text replacements in a CM6-compliant, non-reentrant way
 *
 * This plugin does not perform any rendering or decoration. It
 * modifies document content only, and only in response to explicit
 * user-driven editor actions.
 */
export const CMLinkAliasReplacementPlugin = ViewPlugin.fromClass(
  class {
    constructor(view: EditorView) {
      // const mappings = view.state.facet(SLD_SettingsFacet);
    }

    /**
     * Main update hook of the ViewPlugin.
     *
     * This method is invoked by CodeMirror for every editor update,
     * including document changes, selection changes, and viewport updates.
     *
     * The plugin reacts only to:
     * 1) User-driven document changes, in order to detect completed wikilinks
     *    (e.g. when the user finishes typing "]]").
     * 2) Selection changes, in order to detect when the caret leaves an
     *    existing wikilink.
     *
     * No document mutations are performed synchronously within this method.
     * Any required text changes are scheduled asynchronously to comply with
     * CodeMirror's non-reentrant update constraints.
     */
    update(update: ViewUpdate): void {
      // 1) React to user-driven document changes
      // We are only interested in text changes caused by explicit user input.
      // Non-user transactions (e.g. programmatic changes) are ignored.
      if (update.docChanged) {
        for (const tr of update.transactions) {
          if (!tr.isUserEvent("input")) continue;
          this.handleLinkCompletion(update);
        }
      }

      // 2) React to selection changes
      // This is used to detect when the caret exits an existing wikilink,
      // which may also trigger alias replacement.
      if (update.selectionSet) {
        this.handleCaretExit(update);
      }
    }

    /**
     * Handles detection of a completed wikilink immediately after user input.
     *
     * This method is invoked when the document has changed due to user input.
     * It specifically checks whether the user has just finished typing the
     * closing delimiter of a wikilink ("]]").
     *
     * Preconditions:
     * - The selection must be a collapsed cursor (no active range selection).
     * - The last two characters before the cursor must be "]]".
     *
     * If a syntactically valid, non-nested wikilink was completed, alias
     * processing is triggered.
     */
    private handleLinkCompletion(update: ViewUpdate): void {
      const state = update.state;
      const sel = state.selection.main;

      // Ignore range selections; only a single caret position is relevant.
      if (!sel.empty) return;

      const cursorPos = sel.from;

      // Read the last two characters before the cursor to detect "]]".
      const tail = state.doc.sliceString(
        Math.max(0, cursorPos - 2),
        cursorPos
      );

      // Abort unless the wikilink closing delimiter was just typed.
      if (tail !== "]]") return;

      // Attempt to extract the completed wikilink ending at the cursor.
      // This also validates basic structure and guards against nesting.
      const link = this.extractCompletedWikilink(
        state.doc.toString(),
        cursorPos
      );
      if (!link) return;

      // A valid wikilink was completed; process any alias replacement logic.
      this.processAlias(update, link);
    }

    /**
     * Handles detection of the caret leaving an existing wikilink.
     *
     * This method is triggered on selection updates and compares the previous
     * and current cursor positions in order to detect a transition from
     * "inside a wikilink" to "outside a wikilink".
     *
     * Preconditions:
     * - Both the previous and current selections must be collapsed (caret only).
     * - The caret position must actually change.
     *
     * If the caret was previously located inside a wikilink and has moved
     * outside of it, alias processing is triggered.
     */
    private handleCaretExit(update: ViewUpdate): void {
      const prevSel = update.startState.selection.main;
      const nextSel = update.state.selection.main;

      // Ignore range selections; only single-caret movements are relevant.
      if (!prevSel.empty || !nextSel.empty) return;

      const prevPos = prevSel.from;
      const nextPos = nextSel.from;

      // Abort if the caret did not actually move.
      if (prevPos === nextPos) return;

      const doc = update.state.doc.toString();

      // Check whether the previous caret position was inside a wikilink.
      const link = this.findEnclosingWikilink(doc, prevPos);
      if (!link) return;

      // Abort if the caret is still inside the same wikilink
      if (nextPos >= link.from && nextPos <= link.to) return;

      // Abort if the caret is still inside the same wikilink
      this.processAlias(update, link);
    }

    /**
     * Performs alias resolution and schedules the corresponding text replacement.
     *
     * Given a completed or exited wikilink, this method:
     * - Extracts alias information from the link text
     * - Resolves the alias prefix to a replacement string (e.g. an emoji)
     * - Applies the replacement to the document
     *
     * Document mutations are deliberately deferred via `setTimeout` in order
     * to avoid reentrant updates. CodeMirror does not allow dispatching a new
     * update while another update cycle is still in progress.
     *
     * If no valid alias is found, or if the replacement would be a no-op,
     * the method exits without modifying the document.
     */
    private processAlias(
      update: ViewUpdate,
      link: { from: number; to: number; text: string }
    ): void {
      // Attempt to extract alias metadata (position and prefix length)
      // from the wikilink text.
      const aliasInfo = this.extractAlias(update, link.text, link.from);
      if (!aliasInfo) return;

      // Resolve the alias to its replacement string (e.g. an emoji).
      const replacement = this.resolveEmoji(update, aliasInfo.alias);
      if (!replacement) return;

      // Abort if the alias already matches the replacement to avoid
      // unnecessary dispatches and potential feedback loops.
      if (aliasInfo.alias === replacement) return;

      // CodeMirror forbids dispatching a new update while an update is
      // already being processed. Deferring the dispatch ensures that
      // the current update cycle has fully completed.
      const view = update.view;
      setTimeout(() => {
        view.dispatch({
          changes: {
            from: aliasInfo.from,
            to: aliasInfo.from + aliasInfo.prefixLength,
            insert: replacement,
          },
          // Preserve the current selection after the text replacement.
          selection: update.state.selection,
          userEvent: "input",
        });
      }, 0);
    }

    /**
     * Attempts to extract a completed, non-nested wikilink ending at the
     * given cursor position.
     *
     * The method searches backwards from the cursor for the most recent
     * opening wikilink delimiter ("[[") and validates that:
     * - The text between the opening delimiter and the cursor ends with "]]"
     * - No additional opening delimiter occurs inside the link, preventing
     *   nested or malformed wikilinks
     *
     * If these conditions are met, the wikilink range and its raw text are
     * returned. Otherwise, the method returns null.
     */
    private extractCompletedWikilink(
      doc: string,
      cursorPos: number
    ): { from: number; to: number; text: string } | null {
      // Find the last opening delimiter before the cursor position
      const open = doc.lastIndexOf("[[", cursorPos - 1);
      if (open === -1) return null;

      // Find the last opening delimiter before the cursor position
      const text = doc.slice(open, cursorPos);

      // Find the last opening delimiter before the cursor position
      if (!text.endsWith("]]")) return null;

      // Reject nested or malformed wikilinks by disallowing additional
      // opening delimiters inside the candidate link text.      
      if (text.indexOf("[[", 2) !== -1) return null;

      // Return the absolute document range and the raw wikilink text.
      return { from: open, to: cursorPos, text };
    }

    /**
     * Attempts to find a wikilink that encloses the given document position.
     *
     * The method determines whether the specified position lies within the
     * bounds of a syntactically valid wikilink of the form [[...]].
     *
     * It does so by:
     * - Searching backwards from the position for the nearest opening delimiter ("[[")
     * - Searching forwards from that opening delimiter for the corresponding closing delimiter ("]]")
     * - Verifying that the given position lies within the resulting range
     *
     * If a valid enclosing wikilink is found, its document range and raw text
     * are returned. Otherwise, the method returns null.
     */
    private findEnclosingWikilink(
      doc: string,
      pos: number
    ): { from: number; to: number; text: string } | null {
      // Find the nearest opening delimiter at or before the given position.
      const open = doc.lastIndexOf("[[", pos);
      if (open === -1) return null;

      // Find the corresponding closing delimiter after the opening delimiter.
      const close = doc.indexOf("]]", open);
      if (close === -1) return null;

      const to = close + 2;

      // Abort if the position does not lie within the link boundaries.
      if (pos < open || pos > to) return null;

      // Return the absolute document range and the raw wikilink text
      return { from: open, to, text: doc.slice(open, to) };
    }

    /**
     * Extracts alias information from a completed wikilink, based on the
     * configured prefix mappings from SLD_SettingsFacet.
     *
     * This method performs the following steps:
     * 1) Locate the '|' character that separates the target page from the alias.
     * 2) Extract the alias text that follows the pipe and ends before "]]".
     * 3) Retrieve the current mappings from the SLD_SettingsFacet.
     * 4) Find the mapping whose prefix matches the start of the alias.
     *
     * Returns an object containing:
     * - alias: the extracted alias string
     * - from: the absolute document position where the alias starts
     * - prefixLength: the length of the matching prefix, used for replacement
     *
     * Returns null if:
     * - No '|' character is found
     * - The alias is empty
     * - No mapping matches the alias prefix
     */
    private extractAlias(
      update: ViewUpdate,
      linkText: string,
      linkFrom: number
    ): { alias: string; from: number; prefixLength: number } | null {
      // Find the pipe character separating the target from the alias
      const pipeIndex = linkText.indexOf("|");
      if (pipeIndex === -1) return null;

      // Determine the starting position of the alias inside the link text
      const aliasStart = pipeIndex + 1;

      // Extract the alias substring, excluding the closing "]]"
      const alias = linkText.slice(aliasStart, -2);
      if (!alias) return null;

      // Retrieve the current prefix mappings from the facet
      const mappings = update.state.facet(SLD_SettingsFacet);

      // Find the mapping whose prefix matches the start of the alias
      const mapping = mappings.find( m =>
        alias.startsWith(m.prefix)
      );
      if (!mapping) return null;

      // Return alias information including absolute start position and prefix length
      return { alias, from: linkFrom + aliasStart, prefixLength: mapping.prefix.length };
    }

    /**
     * Resolves the emoji (or other replacement string) corresponding to a given alias.
     *
     * This method:
     * 1) Retrieves the current prefix mappings from the SLD_SettingsFacet.
     * 2) Finds the first mapping whose prefix matches the start of the alias.
     * 3) Returns the associated emoji (or replacement string) if a mapping exists.
     *
     * Returns null if no matching mapping is found.
     *
     * Note:
     * - This method is stateless and reads settings dynamically from the editor state.
     * - It does not modify the document; it only performs lookup logic.
     */
    private resolveEmoji(update: ViewUpdate, alias: string): string | null {
      // Retrieve current prefix mappings from the facet
      const mappings = update.state.facet(SLD_SettingsFacet);

      // Find the first mapping whose prefix matches the alias
      const mapping = mappings.find(m => alias.startsWith(m.prefix));

      // Return the emoji if found, otherwise null
      return mapping?.emoji ?? null;
    }
  }
);
