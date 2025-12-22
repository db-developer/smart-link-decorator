import { Facet         } from "@codemirror/state";
import { PrefixMapping } from "../types/PrefixMapping";

/**
 * Facet for collecting and merging all registered PrefixMappings.
 *
 * Multiple extensions may contribute arrays of PrefixMapping objects.
 * When combining these contributions:
 * - all arrays are flattened
 * - entries are de-duplicated by `prefix`
 * - if multiple entries share the same prefix, the last contribution wins
 *
 * This matches the common CodeMirror convention that later extensions
 * override earlier ones.
 */
export const SLD_SettingsFacet = Facet.define<PrefixMapping[], PrefixMapping[]>({
  combine: values => {
    const byPrefix = new Map<string, PrefixMapping>();

    for (const mappings of values) {
      for (const mapping of mappings) {
        // Later mappings with the same prefix override earlier ones
        byPrefix.set(mapping.prefix, mapping);
      }
    }

    return Array.from(byPrefix.values());
  }
});
