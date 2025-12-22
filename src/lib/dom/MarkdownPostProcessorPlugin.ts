import { MarkdownPostProcessorContext } from "obsidian";
import { MarkdownPostProcessor        } from "./MarkdownPostProcessor"

/**
 * Abstract base class for MarkdownPostProcessor plugins.
 * Provides a Template Method pattern, instance encapsulation, and CM6-style fromClass factory.
 */
export abstract class MarkdownPostProcessorPlugin {
  // Private member for Obsidian Plugin settings
  private _settings!: unknown;

  // Private members for DOM element and context
  private _el!: HTMLElement;
  private _ctx!: MarkdownPostProcessorContext;

  // Protected readonly processor instance
  protected readonly processor: MarkdownPostProcessor;

  /**
   * Constructor
   * @param processor Optional internal processor instance (passed from fromClass wrapper)
   */
  protected constructor(processor: MarkdownPostProcessor) {
    this.processor = processor;
    // settings are not available at this point!
    // Error: this.processor.settings = this._settings;
  }

  /**
   * Protected getter for obsidian settings
   */
  protected get settings(): unknown {
    return this._settings;
  }

  /**
   * Public Template Method.
   * Orchestrates the post-processing step.
   */
  public postProcess(el: HTMLElement, ctx: MarkdownPostProcessorContext): void {
    this.processor.settings = this._settings;
    this.processor.onPostProcess(el, ctx);
  }

  /**
   * CM6-style static factory method.
   * Wraps a subclass into an anonymous processor class.
   */
  public static fromClass<T extends MarkdownPostProcessor>(
    ProcessorClass: new () => T
  ): new () => MarkdownPostProcessorPlugin {
    return class extends MarkdownPostProcessorPlugin {
      constructor() {
        // Create internal processor instance and pass to base constructor
        super(new ProcessorClass());
      }
    };
  }

  public static init(ProcessorPluginClass: new () => MarkdownPostProcessorPlugin, settings: unknown): MarkdownPostProcessorPlugin {
    const  instance = new ProcessorPluginClass();
           instance._settings = settings;
    return instance;
  }
}
