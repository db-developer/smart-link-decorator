import { DecorationSet,
         EditorView,
         ViewPlugin,
         ViewUpdate           } from "@codemirror/view";
import { buildLinkDecorations } from "./buildDecorations";
import { SLD_SettingsFacet    } from "./SettingsFacet";

/**
 * CodeMirror 6 ViewPlugin for decorating links based on prefix mappings.
 *
 * This plugin observes the editor state and applies dynamic decorations
 * to Markdown links according to the current settings stored in
 * `SLD_SettingsFacet`.
 *
 * Key insights into CM6 architecture:
 * - ViewPlugins encapsulate per-editor logic and can maintain local state.
 * - Decorations are stored in a `DecorationSet` and rendered efficiently
 *   by CodeMirror; they are immutable and replaced on state changes.
 * - `update()` is called on every transaction. Here, it selectively rebuilds
 *   decorations only if relevant changes occur:
 *    1. `docChanged` – the text document was modified.
 *    2. `viewportChanged` – the visible portion of the editor changed.
 *    3. Facet value changed – new prefix mappings were applied via a Compartment.
 *
 * Behavior:
 * - On construction, the plugin reads the current facet value and generates
 *   initial decorations.
 * - On updates, it recalculates decorations only if necessary to minimize
 *   performance overhead.
 */
export const CMLinkDecoratorPlugin = ViewPlugin.fromClass(
  class {
    /** Holds the current set of decorations applied to the editor */
    decorations: DecorationSet;

    constructor(view: EditorView) {
      // Retrieve the current settings from the SLD_SettingsFacet
      const settings = view.state.facet(SLD_SettingsFacet);
      // Build initial decorations based on the editor state and settings
      this.decorations = buildLinkDecorations(view, settings);
    }

    /**
     * Called whenever the editor state changes.
     *
     * Rebuilds the decorations only if:
     * - The document content changed
     * - The viewport changed (new lines became visible)
     * - The SLD_SettingsFacet value changed (e.g., new mappings applied)
     */
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || 
          update.startState.facet(SLD_SettingsFacet) !== update.state.facet(SLD_SettingsFacet)) {
        const settings = update.state.facet(SLD_SettingsFacet);
        this.decorations = buildLinkDecorations(update.view, settings);
      }
    }
  },
  {
    /*
     * Tells CodeMirror how to retrieve the decorations for rendering.
     * This method is called automatically by the editor's rendering pipeline.
     */
    decorations: (instance) => instance.decorations,
  }
);