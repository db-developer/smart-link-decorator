import { App,
         CachedMetadata,
         Editor,
         EditorPosition,
         EditorSuggest,
         EditorSuggestContext,
         EditorSuggestTriggerInfo,
         TFile                     } from "obsidian";
import { SmartLinkSuggestion       } from "./SmartLinkSuggestion"

import type SmartLinkDecorator       from "../main";
import type { PrefixMapping        } from "../types/PrefixMapping";

/**
 * Provides editor-based suggestions for SmartLink triggers.
 * 
 * Extends Obsidian's EditorSuggest to offer a list of files based
 * on the prefix mappings defined in the plugin settings.
 */
export class SmartLinkSuggester extends EditorSuggest<SmartLinkSuggestion> {
  // Reference to the main plugin instance, providing access to 
  // settings, vault, and core plugin functionality needed by 
  // the SmartLinkSuggester.
  private plugin: SmartLinkDecorator;

  // Character that starts all triggers; used to detect the 
  // beginning of a SmartLink trigger.
  private static readonly TRIGGER_START = "@";

  // Matches alphanumeric characters and common trigger-related symbols: _, -, >
  private static readonly TRIGGER_QUERY_REGEX = /^[\w\-\_>]+/;

  /**
   * Creates a new SmartLinkSuggester instance.
   *
   * @param app - The Obsidian App instance.
   * @param plugin - The main SmartLinkDecorator plugin instance.
   */
  constructor(app: App, plugin: SmartLinkDecorator) {
    super(app);
    this.plugin = plugin;
  }

  /**
   * Constructs the full query string for the suggestion, including
   * characters before and after the cursor, starting right after the trigger character.
   *
   * This version uses the class static regex to determine valid characters
   * after the cursor.
   *
   * @param line - The full text of the current line.
   * @param atPos - The position of the trigger character (e.g., '@').
   * @param cursorCh - The current cursor position within the line.
   * @returns The complete query string to use in EditorSuggestContext.
   */
  private buildQuery(line: string, atPos: number, cursorCh: number): string {
    // Extract the part before the cursor
    const beforeCursor = line.slice(atPos + 1, cursorCh);

    // Extract the part after the cursor using the static regex
    const afterCursorMatch = line.slice(cursorCh).match(SmartLinkSuggester.TRIGGER_QUERY_REGEX);
    const afterCursor = afterCursorMatch ? afterCursorMatch[0] : "";

    // Combine both parts to form the full query
    return beforeCursor + afterCursor;
  }

  /**
   * Determines whether the editor cursor is currently positioned after a valid
   * SmartLink trigger sequence and, if so, returns the trigger context required
   * by Obsidian to activate the suggestion list.
   *
   * This method is invoked by Obsidian on nearly every editor interaction
   * (cursor movement, text input, deletion, etc.).
   *
   * The responsibility of this method is NOT to generate suggestions, but solely
   * to decide whether a suggestion context exists and to define the textual range
   * ("token") that Obsidian should treat as the active query.
   *
   * Trigger rules:
   * - The trigger must start with the trigger character (e.g. '@').
   * - The trigger character must be located at the beginning of a line or be
   *   preceded by a whitespace character.
   * - The character immediately following the trigger character determines
   *   whether the trigger is semantically valid (via {@link isTrigger}).
   * - If any of these conditions fail, no suggestion context is created.
   *
   * If a trigger is detected, the returned {@link EditorSuggestTriggerInfo}
   * defines:
   * - `start`: the position of the trigger character ('@')
   * - `end`:   the current cursor position
   *
   * Obsidian will automatically extract the substring between `start` and `end`
   * and expose it as {@link EditorSuggestContext.query} in {@link getSuggestions}.
   *
   * @param cursor - The current cursor position within the editor.
   * @param editor - The active editor instance.
   * @returns A trigger context if a valid SmartLink trigger is detected;
   *          otherwise `null`.
   */
  public onTrigger(
    cursor: EditorPosition,
    editor: Editor
  ): EditorSuggestTriggerInfo | null {
    // Retrieve the full text of the current line.
    // If the line cannot be resolved, no trigger is possible.
    const line = editor.getLine(cursor.line);
    if (!line) return null;

    // Start scanning backwards from the character immediately
    // before the cursor position.
    let atPos = cursor.ch - 1;

    // Walk backwards through the line until we either:
    // - find a valid trigger start
    // - hit a whitespace boundary
    // - reach the beginning of the line
    while (atPos >= 0) {
      const char = line.charAt(atPos);

      // A whitespace indicates a token boundary.
      // If we encounter it before finding a trigger character,
      // the current cursor position is not part of a trigger.
      if (char === ' ') {
        return null;
      }

      // Check for the trigger start character (e.g. '@').
      if (char === SmartLinkSuggester.TRIGGER_START) {
        // The trigger start must either be at the beginning of the line
        // or be preceded by a whitespace character.
        // This prevents triggering inside words or paths.
        if (atPos > 0 && line.charAt(atPos - 1) !== ' ') {
          return null;
        }

        // Determine the character immediately following the trigger start.
        // This character defines whether the trigger is semantically valid.
        const charAfterAt = line.charAt(atPos + 1);
        if (!charAfterAt) return null;

        // Validate the trigger mode using the configured prefix mappings.
        // If no mapping exists, the trigger is ignored.
        if (!this.isTrigger(charAfterAt)) {
          return null;
        }

        // A valid trigger has been detected.
        // Define the range that Obsidian should treat as the active query.
        return {
          start: {
            line: cursor.line,
            ch: atPos
          },
          end: cursor,
          query: this.buildQuery(line, atPos, cursor.ch)
        }; // muss sein, damit die property 'query' fehlen kann *sigh*
      }

      // Continue scanning backwards.
      atPos--;
    }

    // Reached the beginning of the line without finding a valid trigger.
    return null;
  }

  /**
   * Checks whether the given metadata contains a matching tag.
   *
   * Considers both inline markdown tags and frontmatter tags and compares
   * them against the original and normalized tag values.
   *
   * @param cache - Cached metadata of the markdown file.
   * @param original - Original tag value as defined by the mapping.
   * @param normalized - Normalized tag value for comparison.
   * @returns True if a matching tag is found; otherwise, false.
   */
  private hasTag(cache: CachedMetadata, original: string, normalized: string): boolean {
    // strip leading '#' from inline tags!
    const inlineTags = cache.tags?.map(t => t.tag.replace(/^#/, "")) ?? [];
    // frontmatter tags don't use a leading '#'
    const fmTags     = cache.frontmatter?.tags;
    // make some tag smoothie...
    const tags       = [ ...inlineTags, ...(Array.isArray(fmTags) ? fmTags : fmTags ? [fmTags] : [])];
    
    return tags.includes(original) || tags.includes(normalized);
  }

  /**
   * Checks whether the frontmatter contains a boolean flag matching the link type.
   *
   * Supports both "isLocation" and "is[location]" style properties and performs
   * case-insensitive matching. Only boolean true values are accepted.
   *
   * @param cache - Cached metadata of the markdown file.
   * @param original - Original link type value.
   * @param normalized - Normalized link type value.
   * @returns True if a matching frontmatter flag exists and is true.
   */
  private hasFlag(cache: CachedMetadata, original: string, normalized: string): boolean {
    const fm = cache.frontmatter;
    if (!fm) return false;

    // Normalize all expected keys to lowercase
    const expectedKeys = new Set([
      `is${original}`.toLowerCase(),
      `is${normalized}`.toLowerCase(),
      `is[${original}]`.toLowerCase(),
      `is[${normalized}]`.toLowerCase()
    ]);

    for (const [key, value] of Object.entries(fm)) {
      if (value !== true) continue;
      if (expectedKeys.has(key.toLowerCase())) return true;
    }
    return false;
  }

  /**
   * Checks whether the given query string is contained in any alias
   * defined in the file's cached metadata.
   *
   * The first character of the query string is treated as a prefix indicator
   * and is removed before comparison.
   *
   * Aliases are read from frontmatter and may be defined either as a single
   * string or as an array of strings.
   *
   * The comparison is performed case-insensitively and matches if the query
   * occurs anywhere within an alias.
   *
   * @param cache - The cached metadata of the file.
   * @param str - The query string from the suggestion context.
   * @returns `true` if any alias contains the query string, otherwise `false`.
   */
  private aliasContains(cache: CachedMetadata, str: string): boolean {
    if (!str || str.length < 2) {
      return false;
    }

    // Remove the prefix character (first character of the query)
    const query = str.slice(1).toLowerCase();
    if (!query) return false;

    return this.hasMatchingAlias(cache, query);
  }

  /**
   * Checks whether the given file name starts with the provided query string.
   *
   * The first character of the query string is treated as a prefix indicator
   * and is therefore removed before comparison.
   *
   * The comparison is performed against the file's base name (without path)
   * and is case-insensitive.
   *
   * @param file - The file to compare against.
   * @param str - The query string from the suggestion context.
   * @returns `true` if the file name starts with the query (excluding the prefix),
   *          otherwise `false`.
   */
  private fileStartsWith(file: TFile, str: string): boolean {
    if (!str || str.length < 2) {
      return false;
    }

    // Remove the prefix character (first character of the query)
    const query = str.slice(1);

    // Extract the file name without its extension
    const fileName = file.basename;

    // Perform a case-insensitive "starts with" comparison
    return fileName.toLowerCase().startsWith(query.toLowerCase());
  }

  /**
   * Returns the first alias that contains the given query string.
   *
   * The provided aliases value may be either a single string or an array of
   * strings (as commonly found in frontmatter metadata). This method normalizes
   * the input into an array and performs a case-insensitive substring search.
   *
   * The query is expected to be already normalized (e.g. trigger prefix removed)
   * before being passed to this method.
   *
   * If multiple aliases match the query, the first matching alias (in declaration
   * order) is returned.
   *
   * @param aliases - A single alias string or an array of alias strings extracted
   *                  from file frontmatter metadata.
   * @param query   - The normalized query string used to search within aliases.
   * @returns The first alias that contains the query string, or null if no match
   *          is found.
   */
  private getAliasListFirstMatch(aliases: any, query: string): string | null {
    if (!aliases) return null;

    // Normalize aliases into an array of strings
    const aliasList = Array.isArray(aliases) ? aliases : [aliases];

    for (const alias of aliasList) {
      if (typeof alias === "string" && alias.toLowerCase().includes(query)) {
        return alias;
      }
    }
    return null;
  }

  /**
   * Finds the first alias of a file that matches the given query string.
   *
   * The comparison is performed as a case-insensitive "starts with" match.
   * The query is expected to include the trigger prefix as its first character,
   * which will be removed before matching against aliases.
   *
   * If multiple aliases match, the first matching alias (in declaration order)
   * is returned.
   *
   * @param cache - The CachedMetadata of the file whose aliases should be inspected.
   * @param query - The raw query string from the EditorSuggestContext.
   * @returns The matching alias string, or null if no alias matches the query.
   */
  private findMatchingAlias(cache: CachedMetadata, query: string): string | null {
    const aliases = cache.frontmatter?.aliases;
    if (!aliases) return null;

    // Remove the trigger prefix (e.g. "@") from the query
    const needle = query.slice(1).toLowerCase();
    if (!needle) return null;

    return this.getAliasListFirstMatch(aliases, needle);
  }

  /**
   * Determines whether the given query string matches any alias in the file's
   * cached metadata.
   *
   * This method delegates the actual search to {@link findMatchingAlias} and
   * converts its result into a boolean value. It returns `true` if a matching
   * alias is found, or `false` if no match exists.
   *
   * @param cache - The cached metadata of the file to inspect for aliases.
   * @param query - The raw query string from the EditorSuggestContext, including
   *                the trigger prefix.
   * @returns `true` if at least one alias matches the query; otherwise `false`.
   */  
  private hasMatchingAlias(cache: CachedMetadata, query: string): boolean {
    return this.findMatchingAlias(cache, query) ? true : false;
  }

  /**
   * Builds the list of smart link suggestions based on the current editor context.
   *
   * This method is invoked by Obsidian after a trigger has been detected via
   * {@link onTrigger}. It evaluates all markdown files in the vault and returns
   * a list of {@link SmartLinkSuggestion} objects that satisfy both:
   *
   * 1. Structural constraints defined by the active PrefixMapping
   *    (e.g. required tags or flags).
   * 2. Textual matching against the user's query, either by:
   *    - matching the beginning of the file's basename, or
   *    - matching one of the file's aliases.
   *
   * For each matching file, the method enriches the result with contextual
   * metadata describing *how* the match occurred (filename vs. alias), which
   * is later used by rendering and selection logic.
   *
   * The returned suggestions are intentionally ordered by match type, giving
   * filename matches precedence over alias matches.
   *
   * @param context - The EditorSuggestContext provided by Obsidian, containing
   *                  the current query string and editor state.
   * @returns An array of SmartLinkSuggestion objects to be displayed in the
   *          suggestion list.
   */
  public getSuggestions(context: EditorSuggestContext): SmartLinkSuggestion[] {
    const mapping = this.getMappingFromContext(context);
    if (!mapping) return [];

    // Original tag (link type) as defined in settings
    const original = mapping.linkType;
    // Normalized tag variant used for case-insensitive matching
    const normalized = original.toLowerCase();

    const suggestions: SmartLinkSuggestion[] = [];

    for (const file of this.app.vault.getMarkdownFiles()) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (!cache) continue;

      const hasTag  = this.hasTag(cache, original, normalized);
      const hasFlag = this.hasFlag(cache, original, normalized);

      // Skip files that do not satisfy tag/flag constraints
      if (!hasTag && !hasFlag) continue;

      const fileMatch  = this.fileStartsWith(file, context.query);
      const aliasMatch = this.aliasContains(cache, context.query);

      if (fileMatch) {
        suggestions.push({
          file,
          displayName: file.basename,
          matchType: "filename"
        });
        continue;
      }

      if (aliasMatch) {
        const alias = this.findMatchingAlias(cache, context.query);
        if (!alias) continue;

        suggestions.push({
          file,
          displayName: alias,
          matchType: "alias"
        });
      }
    }

    suggestions.sort((a, b) => {
      const query = context.query.slice(1).toLowerCase();

      const score = (s: SmartLinkSuggestion) => {
        const name = s.displayName.toLowerCase();
        let baseScore = 0;

        if (name.startsWith(query)) baseScore = 2;
        else if (name.includes(query)) baseScore = 1;

        // Penalize longer display names: subtract the extra length
        const lengthPenalty = name.length - query.length;

        return baseScore - lengthPenalty;
      };

      const scoreA = score(a);
      const scoreB = score(b);

      // Descending by score
      if (scoreB !== scoreA) return scoreB - scoreA;

      // Alphabetical tie-breaker
      return a.displayName.localeCompare(b.displayName);
    });    

    return suggestions;
  }

  /**
   * Renders a single smart link suggestion in the suggestion list.
   *
   * The display is enriched with visual cues based on how the match was
   * determined:
   * - If the match was based on the file name, the display name is shown
   *   normally.
   * - If the match was based on an alias, the display name is rendered in
   *   italic to indicate that the suggestion originates from an alias.
   *
   * The file path is shown in a smaller font below the display name.
   *
   * @param suggestion - The SmartLinkSuggestion object to render.
   * @param el - The HTML element provided by Obsidian to append content to.
   */  
  public renderSuggestion(suggestion: SmartLinkSuggestion, el: HTMLElement): void {
    el.addClass("smartlink-suggestion");

    // Determine the class for the title: italic if matched by alias
    const titleClass = "smartlink-suggestion-title" +
      (suggestion.matchType === "alias" ? " smartlink-suggestion-alias" : "");

    el.createEl("div", {
      text: suggestion.displayName,
      cls: titleClass
    });

    el.createEl("small", {
      text: suggestion.file.path,
      cls: "smartlink-suggestion-path"
    });
  }

  /**
   * Handles the selection of a smart link suggestion by the user.
   *
   * This method constructs a Markdown link using the selected file and its
   * display name, optionally prefixed with an emoji from the active mapping.
   * It then replaces the text range in the editor corresponding to the
   * trigger token with the constructed link.
   *
   * Both file name matches and alias matches are correctly handled via
   * suggestion.displayName. If either the editor context or the mapping
   * cannot be retrieved, the method safely returns without performing any
   * action.
   *
   * @param suggestion - The SmartLinkSuggestion object selected by the user.
   * @param evt - The mouse or keyboard event that triggered the selection.
   */
  selectSuggestion(suggestion: SmartLinkSuggestion, evt: MouseEvent | KeyboardEvent): void {
    const context = this.context;
    if (!context) return;

    const mapping = this.getMappingFromContext(context);
    if (!mapping) return;

    const link = `[[${suggestion.file.basename}|${mapping.emoji} ${suggestion.displayName}]]`;

    context.editor.replaceRange(link, context.start, context.end);
  }

  /**
   * Determines whether the given character represents a valid trigger prefix.
   *
   * A character is considered a trigger if it matches the `prefix` of any
   * configured {@link PrefixMapping} in the plugin settings.
   *
   * @param char - The single character immediately following the trigger start (e.g. '@').
   * @returns `true` if a matching PrefixMapping exists; otherwise `false`.
   */
  private isTrigger(char: string): boolean {
    if (!char || char.length !== 1) {
      return false;
    }

    return this.findMappingByPrefix(char) !== null;
  }  
  /**
   * Finds a PrefixMapping in the plugin's settings that matches the given prefix.
   *
   * @param prefix - The single-character prefix to look for.
   * @returns The corresponding PrefixMapping if found; otherwise, null.
   */
  private findMappingByPrefix(prefix: string): PrefixMapping | null {
    return (
      this.plugin.settings.mappings.find(
        m => m.prefix === prefix
      ) ?? null
    );
  }

  /**
   * Extracts the mapping prefix from the current editor suggest context.
   *
   * Removes the leading trigger character and returns the first remaining
   * character, which represents the configured mapping prefix.
   *
   * @param context - Editor suggest context at the cursor position.
   * @returns The extracted prefix character, or null if none can be derived.
   */
  private getQueryPrefix(context: EditorSuggestContext): string | null {
    let query = context.query ?? "";
    if (!query) return null;

    // Remove leading trigger character if present
    if (query.startsWith(SmartLinkSuggester.TRIGGER_START)) {
      query = query.slice(1);
    }

    if (!query) return null;

    // The first character of the remaining string is the prefix
    return query.charAt(0);
  }

  /**
   * Resolves the active prefix mapping from the editor suggest context.
   *
   * Extracts the prefix character from the current query and looks up the
   * corresponding prefix mapping defined in the plugin settings.
   *
   * @param context - Editor suggest context at the cursor position.
   * @returns The matching PrefixMapping, or null if none is found.
   */  
  private getMappingFromContext(context: EditorSuggestContext): PrefixMapping | null {
    const prefix = this.getQueryPrefix(context);
    if (!prefix) return null;

    return this.findMappingByPrefix(prefix);
  }
}
