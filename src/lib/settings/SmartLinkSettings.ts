import { PrefixMapping } from "../types/PrefixMapping";

/**
 * Represents the settings for the Smart Link system.
 *
 * Fields:
 * - mappings: An array of PrefixMapping objects, each defining a
 *   prefix and its corresponding replacement (e.g., emoji). These
 *   mappings are used by plugins like CMLinkAliasReplacementPlugin
 *   to resolve aliases dynamically.
 *
 * - loaded: A boolean flag indicating whether the settings have
 *   been fully loaded and are ready to use. This allows plugins
 *   to avoid acting on incomplete or uninitialized configuration.
 */
export interface SmartLinkSettings {
  mappings: PrefixMapping[];
  loaded: boolean;
}

/**
 * Default configuration for SmartLinkSettings.
 *
 * Provides an initial set of prefix-to-emoji mappings that the plugin
 * uses to resolve aliases in wikilinks.
 *
 * Notes:
 * - Each mapping defines a prefix character, an associated emoji
 *   (or replacement string), a logical link type, a text color, a
 *   background color with optional alpha transparency, and whether
 *   the link should be underlined.
 *
 * - Emoji length considerations:
 *   - The emoji "🧑" (U+1F9D1) is represented as a surrogate pair in UTF-16
 *     and counts as two code units internally. 
 *   - The emoji "📌" (U+1F4CC) is also a surrogate pair of two code units.
 *   - While both appear as a single character visually, their UTF-16
 *     representation may affect string slicing or indexing if not handled
 *     correctly. CM6 handles this gracefully for cursor positions, but
 *     awareness is important when doing direct string manipulation.
 *
 * - The `loaded` flag is initially false and should be set to true
 *   once the configuration is fully initialized.
 */
export const DEFAULT_SETTINGS: SmartLinkSettings = {
  mappings: [
    { prefix: "@", emoji: "🧑", linkType: "person",   color: "#ffb347", background: "rgba(255,165,0,0.15)",  backgroundAlpha: 0.15, underline: false },
    { prefix: ">", emoji: "📌", linkType: "location", color: "#4fc3f7", background: "rgba(79,195,247,0.15)", backgroundAlpha: 0.15, underline: false }
  ],
  loaded: false
};
