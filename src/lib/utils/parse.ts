// Reusable, precompiled regex for Obsidian-style wiki links [[TeilA|TeilB]]
const WIKI_LINK_REGEX = /^\[\[([^|\]]*)\|([^\]]*)\]\]$/;

/**
 * Extracts the two components of an Obsidian-style wiki link of the form [[TeilA|TeilB]].
 *
 * @param linkString - The full link string to parse, e.g., "[[InhaltA|InhaltB]]"
 * @returns An array [TeilA, TeilB]. If a part is missing, it is replaced with an empty string.
 *
 * Only the strict pattern with both parts separated by "|" is supported.
 */
export function parseWikiLink(linkString: string): [string, string] {
  const match = linkString.match(WIKI_LINK_REGEX);

  const filename = match?.[1] ?? ""; // if first group is missing, return empty string
  const alias    = match?.[2] ?? ""; // if second group is missing, return empty string

  return [filename, alias];
}