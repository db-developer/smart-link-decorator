import type { App } from "obsidian";
import type { I18NKey } from "./types";
import { RESOURCES, FALLBACK_LANGUAGE } from "./res";

export { I18N_KEYS } from "./keys";

/**
 * Retrieves the localized string for a given key based on the current Obsidian language setting.
 *
 * @param key - The translation key to look up. Must be one of the defined I18NKey values.
 * @param app - The current Obsidian App instance, required to access runtime context.
 * @returns The localized string corresponding to the provided key.  
 *          Falls die aktuelle Sprache nicht verfügbar ist, wird die Fallback-Sprache (`FALLBACK_LANGUAGE`) verwendet.
 *
 * @remarks
 * This function reads the current language from `window.localStorage` under the key `"language"`.
 * If the language is not set or not supported, it falls back to `FALLBACK_LANGUAGE`.
 *
 * Example usage:
 * ```ts
 * import { i18n, I18N_KEYS } from "<?>/i18n";
 * new Setting(containerEl)
 *   .setName(i18n(I18N_KEYS.SETTINGS_TITLE, app))
 *   .setDesc(i18n(I18N_KEYS.SETTINGS_DESCRIPTION, app));
 * ```
 */
export function i18n(key: I18NKey): string {
  const lang     = window.localStorage.getItem("language") ?? FALLBACK_LANGUAGE;
  const resource = RESOURCES[lang] ?? RESOURCES[FALLBACK_LANGUAGE];

  return resource[key];
}