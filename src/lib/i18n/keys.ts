/**
 * Centralized mapping of translation keys to their string identifiers.
 *
 * This object serves as the single source of truth for all i18n keys used
 * throughout the plugin. Each property corresponds to a key that can be
 * used to look up localized strings in the language resource files.
 *
 * The `as const` assertion ensures that the property values are treated
 * as literal types, enabling type-safe usage with TypeScript.
 *
 * Example usage:
 * ```ts
 * const titleKey = I18N_KEYS.SETTINGS_TITLE;
 * const localizedString = i18n(titleKey, app);
 * ```
 */
export const I18N_KEYS = {
  SETTINGS_HEADER:                        "settings.header",
  SETTINGS_TABLE_HEADER_PREFIX:           "settings.table.header.prefix",
  SETTINGS_TABLE_HEADER_EMOJI:            "settings.table.header.emoji",
  SETTINGS_TABLE_HEADER_LINKTYPE:         "settings.table.header.linktype",
  SETTINGS_TABLE_HEADER_TEXTCOLOR:        "settings.table.header.textcolor",
  SETTINGS_TABLE_HEADER_BACKGROUND:       "settings.table.header.background",
  SETTINGS_TABLE_HEADER_BACKGROUNDALPHA:  "settings.table.header.backgroundalpha",
  SETTINGS_TABLE_HEADER_UNDERLINE:        "settings.table.header.underline",
  SETTINGS_TABLE_HEADER_DELETE:           "settings.table.header.delete",
  SETTINGS_CONTROL_PLACEHOLDER_PREFIX:    "settings.control.placeholder.prefix",
  SETTINGS_CONTROL_TOOLTIP_PREFIX:        "settings.control.tooltip.prefix",
  SETTINGS_CONTROL_PLACEHOLDER_EMOJI:     "settings.control.placeholder.emoji",
  SETTINGS_CONTROL_TOOLTIP_EMOJI:         "settings.control.tooltip.emoji",
  SETTINGS_CONTROL_PLACEHOLDER_LINKTYPE:  "settings.control.placeholder.linktype",
  SETTINGS_CONTROL_TOOLTIP_LINKTYPE:      "settings.control.tooltip.linktype",
  SETTINGS_CONTROL_TOOLTIP_DELETE:        "settings.control.tooltip.delete",
  SETTINGS_CONTROL_TEXT_APPEND:           "settings.text.button.append"
} as const;
