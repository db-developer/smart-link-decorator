/**
 * Defines a mapping between a prefix character and its replacement/visual styling.
 *
 * This interface is used by SmartLink plugins to interpret aliases in wikilinks
 * and render or replace them appropriately.
 *
 * Fields:
 * - prefix: The character that triggers this mapping (e.g., "@", ">").
 * - emoji: The replacement string (usually an emoji) for the alias.
 * - linkType: A logical type identifier for the link (e.g., "person", "location").
 * - color: The text color to use when displaying the link.
 * - background: The background color in CSS format (e.g., "#RRGGBB" or "#RRGGBBAA").
 * - backgroundAlpha: Numeric alpha value (0–1) for dynamic styling or transparency.
 * - underline: Boolean indicating whether the link should be underlined.
 *
 * Notes:
 * - This structure allows the plugin to dynamically replace or style
 *   aliases in wikilinks based on user-defined or default mappings.
 * - The combination of background and backgroundAlpha facilitates
 *   fine-grained control of transparency in rendered elements.
 */
export interface PrefixMapping {
  prefix: string;
  emoji: string;
  linkType: string;
  color: string;
  background: string;
  backgroundAlpha: number;
  underline: boolean;
}