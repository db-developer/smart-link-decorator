import type { I18NKey } from "../types";

/**
 * Represents a complete set of localized strings for a single language.
 *
 * Each property key corresponds to an `I18NKey` and maps to its
 * localized string value. Using this type ensures that all required
 * translation keys are present and correctly typed for a language.
 *
 * This type is used to define language resource objects, which are
 * then stored in `RESOURCES` for use by the i18n system.
 *
 * Example usage:
 * ```ts
 * const enResource: I18NResource = {
 *   "settings.title": "Settings",
 *   "button.add": "Add",
 *   // ... all other keys must be included
 * };
 * ```
 */
export type I18NResource = {
  [K in I18NKey]: string;
};
