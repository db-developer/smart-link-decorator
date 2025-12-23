import { en                } from "./en";
import { de                } from "./de";

import type { I18NResource } from "./I18NResource";

/**
 * Collection of all language resource objects available in the plugin.
 *
 * Each property corresponds to a language code (e.g., "en", "de") and maps
 * to an `I18NResource` object containing all localized strings for that language.
 *
 * This object is used by the i18n system to retrieve translations based on
 * the current language setting, with fallback support if a language is missing.
 *
 * Example usage:
 * ```ts
 * const resource = RESOURCES["en"];
 * const translatedString = resource["settings.title"];
 * ```
 */
export const RESOURCES: Record<string, I18NResource> = {
  en,
  de,
};

/**
 * The default language code used when no translation is available
 * for the currently selected language.
 *
 * This ensures that the plugin always has a valid set of strings to display,
 * preventing missing text or runtime errors in the UI.
 *
 * Example usage:
 * ```ts
 * const lang = window.localStorage.getItem("language") ?? FALLBACK_LANGUAGE;
 * const resource = RESOURCES[lang] ?? RESOURCES[FALLBACK_LANGUAGE];
 * ```
 */
export const FALLBACK_LANGUAGE = "en";
