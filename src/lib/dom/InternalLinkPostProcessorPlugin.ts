import { MarkdownPostProcessorContext } from "obsidian";
import { MarkdownPostProcessorPlugin  } from "./MarkdownPostProcessorPlugin";
import { SmartLinkSettings            } from "../settings/SmartLinkSettings";

/**
 * Factory-based export of the InternalLinkPostProcessorPlugin.
 *
 * This plugin is used by Obsidian as a MarkdownPostProcessor.
 * It encapsulates all logic for internal links that start with certain emoji prefixes.
 * 
 * How it works:
 * 1. `MarkdownPostProcessorPlugin.fromClass` creates an anonymous subclass of the
 *    abstract base plugin class `MarkdownPostProcessorPlugin`.
 * 2. The anonymous class implements the actual post-processing logic:
 *    - Settings management (`_settings`, getter/setter)
 *    - Collection and filtering of internal links
 *    - Creation of wrapper spans for links
 *    - Setting/updating of `data-sld-type` attributes
 * 3. The resulting plugin object can be registered directly in Obsidian
 *    (e.g., via `registerMarkdownPostProcessor`).
 *
 * Benefits of this approach:
 * - CM6-style factory: the class is dynamically created, multiple instances are possible
 * - Encapsulation: all methods and settings remain private/protected; public API
 *   is limited to `postProcess` and settings getter/setter
 * - Reusability: other plugins could use the same factory to create
 *   customized post-processor classes.
 *
 * @type {typeof MarkdownPostProcessorPlugin}
 */
export const InternalLinkPostProcessorPlugin = MarkdownPostProcessorPlugin.fromClass(
  // Anonymous class that implements the internal link post-processing logic
  class {
    private _settings!: SmartLinkSettings;

    // Setter for plugin settings, converting from unknown to SmartLinkSettings
    public set settings(settings: unknown) {
      this._settings = settings as SmartLinkSettings;
    }

    // Getter for plugin settings
    public get settings(): SmartLinkSettings {
      return this._settings;
    }

    /**
     * Returns all known emoji prefixes from the current settings.
     * Used to filter internal links based on these prefixes.
     */
    public getKnownPrefixes(): string[] {
      // fallback in case settings are missing
      return this.settings?.mappings.map(m => m.emoji) || [];
    }

    /**
     * Collects all internal links within the given DOM element.
     * @param el Root element of the rendered Markdown block
     * @returns NodeList of all <a class="internal-link"> elements
     */
    public getAllInternalLinks(el: HTMLElement): NodeListOf<HTMLAnchorElement> {
      return el.querySelectorAll<HTMLAnchorElement>("a.internal-link");
    }

    /**
     * Filters the given links based on known emoji prefixes.
     * Normalizes link text (trimming and removing zero-width characters).
     * @param links Array of links to check
     * @param prefixes Array of known emoji prefixes
     * @returns Array of objects { el, index }, where index refers to the matching prefix
     */
    public filterLinks(
      links: readonly HTMLAnchorElement[],
      prefixes: readonly string[]
    ): { el: HTMLAnchorElement; index: number }[] {
      const result: { el: HTMLAnchorElement; index: number }[] = [];

      for (const link of links) {
        // Normalize text: remove zero-width characters + trim
        const text = link.textContent?.replace(/\u200B/g, "").trim() ?? "";
        if (!text) continue;

        // Check if text starts with a known emoji prefix
        const idx = prefixes.findIndex(prefix => text.startsWith(prefix));
        if (idx === -1) continue;

        result.push({ el: link, index: idx });
      }

      return result;
    }

    /**
     * Ensures that the given <span> has the "data-sld-type" attribute
     * and that its value matches the current linkType from the settings.
     * @param node Object containing the link, the surrounding span, and the index
     * @returns the same object for chaining
     */
    public setDataSldType(
      node: { el: HTMLAnchorElement; span: HTMLSpanElement; index: number }
    ): { el: HTMLAnchorElement; span: HTMLSpanElement; index: number } {
      const TYPE: string = "data-sld-type";
      const span = node.span;
      const mapping = this.settings.mappings[node.index];

      const value = span.getAttribute(TYPE);
      // Set or update the attribute only if it differs from the current linkType
      if (value !== mapping.linkType) {
        span.setAttribute(TYPE, mapping.linkType);
      }
      return node;
    }    

    /**
     * Ensures that the link is wrapped in a <span>.
     * If no parent <span> exists, one is created and inserted between the link and its parent.
     * Afterwards, the "data-sld-type" attribute is set/updated.
     * @param node Object containing the link and index
     * @returns Object containing the link, span, and index
     */
    public ensureSpanWrapper(
      node: { el: HTMLAnchorElement; index: number }
    ): { el: HTMLAnchorElement; span: HTMLSpanElement; index: number } {
      const SPAN: string = "span";
      // Check if a parent span exists
      let parentSpan = node.el.parentElement;
      if (!parentSpan || parentSpan.tagName.toLowerCase() !== SPAN) {
        // Create a new span
        const span = document.createElement(SPAN);

        // Insert the link into the new span
        const originalParent = node.el.parentElement;
        if (originalParent) {
          originalParent.replaceChild(span, node.el);
        }
        span.appendChild(node.el);

        parentSpan = span;
      }
      const item = { el: node.el, span: parentSpan as HTMLSpanElement, index: node.index };
      // Set or update the data-sld-type attribute
      return this.setDataSldType(item);
    }

    /**
     * Main method called by Obsidian during the Markdown post-processing pipeline.
     * Executes the full internal link processing:
     * - collects all internal links
     * - filters by known emoji prefixes
     * - wraps links in <span> if needed
     * - sets/updates data-sld-type attribute
     */
    public onPostProcess(el: HTMLElement, ctx: MarkdownPostProcessorContext): void {
      const emojis: string[] = this.getKnownPrefixes();
      const links: { el: HTMLAnchorElement; index: number }[] = this.filterLinks(
        Array.from(this.getAllInternalLinks(el)),
        emojis
      );

      // Ensure each link is wrapped in a <span> and has the data-sld-type set
      links.forEach(node => this.ensureSpanWrapper(node));
    }
  }
);
