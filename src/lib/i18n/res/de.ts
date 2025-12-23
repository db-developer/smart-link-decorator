import type { I18NResource } from "./I18NResource";

/**
 * German language resource object for the plugin.
 *
 * This object implements the `I18NResource` type and provides
 * all localized strings for the German language.
 *
 * Each property corresponds to a translation key, ensuring
 * type-safe access to all required translations.
 *
 * Example usage:
 * ```ts
 * const title = de["settings.title"];
 * ```
 */
export const de: I18NResource = {
  // [SETTINGS]
  "settings.header": "Smart Link Decorator Einstellungen",
  "settings.table.header.prefix":          "Prefix",
  "settings.table.header.emoji":           "Emoji",
  "settings.table.header.linktype":        "Link-Typ",
  "settings.table.header.textcolor":       "Textfarbe",
  "settings.table.header.background":      "Hintergrund",
  "settings.table.header.backgroundalpha": "Transparenz",
  "settings.table.header.underline":       "Unterstreichung",
  "settings.table.header.delete":          "Löschen",
  "settings.control.placeholder.prefix":   "-",
  "settings.control.tooltip.prefix":       "Präfix für den Link",
  "settings.control.placeholder.emoji":    "-",
  "settings.control.tooltip.emoji":        "Emoji für den Link",
  "settings.control.placeholder.linktype": "link-type",
  "settings.control.tooltip.linktype":     "Art des internen Links",
  "settings.control.tooltip.delete":       "Mapping löschen",
  "settings.text.button.append":           "Neues Mapping hinzufügen"
};