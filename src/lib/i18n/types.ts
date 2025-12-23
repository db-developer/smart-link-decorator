import { I18N_KEYS } from "./keys";

/**
 * Represents all valid translation keys defined in `I18N_KEYS`.
 *
 * This type is automatically derived from the values of the `I18N_KEYS` object,
 * ensuring type safety when looking up localized strings.
 *
 * Using this type guarantees that only keys defined in `I18N_KEYS` can be passed
 * to functions like `i18n`, preventing typos and invalid lookups at compile time.
 *
 * Example usage:
 * ```ts
 * function getTranslation(key: I18NKey) {
 *   return i18n(key, app);
 * }
 * ```
 */
export type I18NKey = typeof I18N_KEYS[keyof typeof I18N_KEYS];
