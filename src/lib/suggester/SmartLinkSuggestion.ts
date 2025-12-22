import type { TFile } from "obsidian";

/**
 * Represents a single suggestion item produced by the SmartLink suggester.
 *
 * This interface deliberately wraps a {@link TFile} instead of extending it,
 * because a suggestion is not just a file reference but also carries
 * contextual information about *why* the file matched the user's input.
 *
 * The additional metadata stored here is later consumed by:
 * - {@link getSuggestions} to construct the suggestion list
 * - {@link renderSuggestion} to decide how the entry should be displayed
 * - {@link selectSuggestion} to determine how the link should be inserted
 */
export interface SmartLinkSuggestion {
  /**
   * The underlying file this suggestion refers to.
   *
   * This is the actual {@link TFile} that will be linked when the suggestion
   * is selected, regardless of whether the match was based on the filename
   * or on one of its aliases.
   */
  file: TFile;

  /**
   * The human-readable name that should be displayed in the suggestion list.
   *
   * Depending on the match type, this can be:
   * - the file's basename (if the filename matched the query)
   * - a specific alias that matched the query
   *
   * This value is purely presentational and does not affect link resolution.
   */
  displayName: string;

  /**
   * Describes how this file matched the user's query.
   *
   * - `"filename"` indicates that the file's basename matched the query
   * - `"alias"` indicates that one of the file's aliases matched the query
   *
   * This flag allows downstream logic (especially rendering and selection)
   * to adapt behavior or visuals based on the match origin.
   */
  matchType: "filename" | "alias";
}