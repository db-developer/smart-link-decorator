import type { I18NResource } from "./I18NResource";

/**
 * English language resource object for the plugin.
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
export const en: I18NResource = {
  // [SETTINGS]
  "settings.header": "Smart Link Decorator Settings",
  "settings.table.header.prefix":          "Prefix",
  "settings.table.header.emoji":           "Emoji",
  "settings.table.header.linktype":        "Link-Type",
  "settings.table.header.textcolor":       "Text Color",
  "settings.table.header.background":      "Background",
  "settings.table.header.backgroundalpha": "Alpha",
  "settings.table.header.underline":       "Underline",
  "settings.table.header.delete":          "Delete",
  "settings.control.placeholder.prefix":   "-",
  "settings.control.tooltip.prefix":       "Prefix used für this type of link",
  "settings.control.placeholder.emoji":    "-",
  "settings.control.tooltip.emoji":        "Emoji used für this type of link",
  "settings.control.placeholder.linktype": "The type of this link" ,
  "settings.control.tooltip.linktype":     "The type of this link" ,
  "settings.control.tooltip.delete":       "Delete mapping",
  "settings.text.button.append":           "Append new mapping",
};