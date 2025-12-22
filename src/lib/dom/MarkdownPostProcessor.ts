import { MarkdownPostProcessorContext } from 'obsidian';

/**
 * Interface for a MarkdownPostProcessor.
 * Specifies that implementors must provide a hook method 
 * onPostProcess that is called during processing.
 */
export interface MarkdownPostProcessor {
  /**
   * Obsidian plugin settings
   */
  settings: unknown;
  /**
   * Hook method invoked by the Markdown rendering pipeline.
   *
   * This method is called exactly once per post-processing run and must not
   * be invoked manually. Implementations should perform all DOM-related
   * transformations here.
   *
   * @param el  Root HTML element of the rendered Markdown block.
   *            All DOM mutations must be scoped to this subtree.
   * @param ctx Rendering context provided by Obsidian for the current
   *            Markdown post-processing pass.
   */
  onPostProcess(el: HTMLElement, ctx: MarkdownPostProcessorContext): void;
}
