import { Plugin,
         MarkdownView,
         WorkspaceLeaf                   } from "obsidian";
import { Compartment,
         StateEffect                     } from "@codemirror/state";
import { EditorView                      } from "@codemirror/view";
import { CMLinkAliasReplacementPlugin    } from "./cm/CMLinkAliasReplacementPlugin";
import { CMLinkDecoratorPlugin           } from "./cm/CMLinkDecoratorPlugin";
import { SLD_SettingsFacet               } from "./cm/SettingsFacet";
import { MarkdownPostProcessorPlugin     } from "./dom/MarkdownPostProcessorPlugin";
import { InternalLinkPostProcessorPlugin } from "./dom/InternalLinkPostProcessorPlugin";
import { SmartLinkSettings, 
         DEFAULT_SETTINGS                } from "./settings/SmartLinkSettings";
import { SmartLinkSettingTab             } from "./settings/SmartLinkSettingTab";
import { SmartLinkSuggester              } from "./suggester/SmartLinkSuggester";
import { getDynamicCSS                   } from "./utils/css";

/**
 * Smart Link Decorator Plugin for Obsidian.
 *
 * This plugin enhances Markdown editors with dynamic link decorations
 * based on user-configurable prefix mappings. It integrates deeply
 * with CodeMirror 6, using:
 *
 * - A dedicated `SLD_SettingsFacet` to store prefix mapping configurations.
 * - A `Compartment` per editor to allow dynamic reconfiguration without
 *   rebuilding the entire editor state.
 * - A `CMLinkDecoratorPlugin` ViewPlugin to apply decorations and react
 *   to facet changes.
 *
 * Key responsibilities:
 * 1. Persist and manage plugin settings (_settings).
 * 2. Inject dynamic CSS rules derived from the mappings.
 * 3. Ensure all open and future Markdown editors observe the latest settings.
 * 4. Clean up resources on plugin unload (e.g., disconnecting MutationObservers).
 *
 * Notes:
 * - Uses WeakMaps/WeakSets to track per-editor and per-leaf state without
 *   preventing garbage collection.
 * - Lifecycle methods (onload/onunload) manage initialization and cleanup.
 * - Settings changes propagate via the settings compartment, triggering
 *   editor plugin updates deterministically.
 */
export default class SmartLinkDecorator extends Plugin {
  // Initialized during onload(); guaranteed to be available for the plugin lifetime.
  private suggester!: SmartLinkSuggester;
  
  // Holds the current plugin settings.
  // Initialized with a copy of the default settings and updated when the user
  // changes configuration options.
  private _settings: SmartLinkSettings = { ...DEFAULT_SETTINGS };

  // Maps individual CodeMirror EditorView instances to their corresponding
  // configuration compartments.
  // A WeakMap is used so entries are automatically garbage-collected when
  // an EditorView is destroyed.
  private cmCompartmentMap = new WeakMap<EditorView, Compartment>();

  // Tracks Markdown views that have already been processed by the plugin
  // to avoid duplicate initialization or observer attachment.
  // WeakSet ensures no strong references are kept to closed views.
  private processedLeaves = new WeakSet<MarkdownView>();

  // Compartment used to dynamically reconfigure CodeMirror extensions that
  // depend on plugin settings (e.g. SLD_SettingsFacet) without rebuilding
  // the entire editor configuration.
  private settingsCompartment = new Compartment();

  /**
   * Getter for plugin settings
   */
  public get settings(): SmartLinkSettings {
    return this._settings;
  }

  /**
   * Updates the plugin settings and triggers persistence and propagation.
   *
   * Assigning to this setter replaces the entire settings object and
   * immediately persists the new state. It also propagates all relevant
   * changes (editor reconfiguration, dynamic CSS updates) via `saveSettings()`.
   *
   * Note:
   * - This setter is intentionally side-effectful.
   * - Callers should treat setting assignment as a commit operation.
   */
  public set settings(settings: SmartLinkSettings) {
    this._settings = settings;
    this.saveSettings();
  }

  /**
   * Plugin entry point.
   *
   * This method is called by Obsidian when the plugin is loaded.
   * It initializes persistent settings, registers editor extensions,
   * injects dynamic styling, and sets up observers for newly created views.
   */
  async onload() {
    const pluginName = "Smart Link Decorator";
    try {
      console.log("⚠️ " + pluginName + " starting up...");

      // Load persisted plugin settings asynchronously and merge them
      // with the default settings. Defaults act as a safety net for
      // newly introduced options.
      const loaded = await this.loadData();
      if ( loaded ) {
          this._settings = { ...DEFAULT_SETTINGS, ...loaded, loaded: true };
      }

      // Register the plugin's settings tab in Obsidian's settings UI.
      this.addSettingTab(new SmartLinkSettingTab(this.app, this));

      // Initialize and register the editor suggester.
      // registerEditorSuggest() binds the suggester to the editor lifecycle and
      // ensures automatic cleanup when the plugin is unloaded.
      this.suggester = new SmartLinkSuggester(this.app, this);
      this.registerEditorSuggest(this.suggester);

      // Register a Markdown post-processor with Obsidian
      // This will be called for each rendered Markdown block
      this.registerMarkdownPostProcessor((el, ctx) => {
        // Initialize the InternalLinkPostProcessorPlugin with the current plugin settings
        // `init` creates an instance and injects the settings
        // Next: Execute the post-processing on the current Markdown element
        // `el` is the root HTMLElement of the Markdown block
        // `ctx` is the Obsidian post-processing context for this block
        MarkdownPostProcessorPlugin.init(InternalLinkPostProcessorPlugin, this._settings).postProcess(el, ctx);
      });

      // Register CodeMirror 6 extensions.
      //
      // - CMLinkDecoratorPlugin implements the editor behavior.
      // - settingsCompartment wraps the settings facet to allow
      //   dynamic reconfiguration when plugin settings change.
      this.registerEditorExtension([
        CMLinkDecoratorPlugin,
        CMLinkAliasReplacementPlugin,
        this.settingsCompartment.of(
          SLD_SettingsFacet.of(this.settings.mappings)
        )
      ]);

      // Inject dynamic CSS rules derived from the current settings.
      this.injectDynamicCSS();

      // Initialize observers that attach the CMLinkDecoratorPlugin to
      // newly created Markdown views (e.g. pane switches or new tabs).
      //
      // Preconditions:
      // - Settings are loaded.
      // - Dynamic CSS is already injected.
      this.initViewObservers();

      console.log("✅ " + pluginName + " successfully started up. Plugin loaded.");
    }
    catch (error) {
      console.error("❌ " + pluginName + " failed to load:", error);
      return;
    }
  }

  /**
   * Cleans up all resources allocated by the plugin.
   *
   * This method is called when the plugin is unloaded (e.g. app shutdown
   * or plugin reload). Only resources with external lifecycles need to be
   * explicitly released.
   */
  onunload() {
    /**
     * No further cleanup is required:
     *
     * - WeakMap (cmCompartmentMap) and WeakSet (processedLeaves)
     *   are garbage-collected automatically once their keys disappear.
     *
     * - settingsCompartment is a CodeMirror configuration primitive
     *   without external resources.
     *
     * - _settings is plain data.
     * 
     * - suggester cannot be null and will be re-assigned in next onload
     *   (if required)
     */
  }

  /**
   * Loads persisted plugin settings and applies them as the current configuration.
   *
   * This method merges the stored settings with the default settings to ensure
   * that newly introduced options always have valid fallback values.
   * Assigning to the `settings` property triggers persistence and propagation
   * via the settings setter.
   */
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  /**
   * Persists plugin settings and propagates all relevant changes.
   *
   * This method performs three distinct steps:
   * 1. Saves the current settings object to Obsidian's persistent storage.
   * 2. Re-injects dynamic CSS rules that depend on the updated settings.
   * 3. Updates all open Markdown editors by reconfiguring the CodeMirror
   *    settings compartment, ensuring that editor plugins receive the
   *    new facet values without rebuilding the entire editor configuration.
   *
   * Note:
   * - Editor updates are handled explicitly via `updateAllEditors()`,
   *   replacing the need for a global `workspace.updateOptions()` call.
   */
  async saveSettings() {
    await this.saveData(this.settings);
    this.injectDynamicCSS();
    this.updateAllEditors();
  }

  /**
   * Propagates updated plugin settings to all open Markdown editors.
   *
   * This method iterates over every active Markdown view and dispatches a
   * CodeMirror transaction that reconfigures the settings compartment.
   * Only the compartment containing `SLD_SettingsFacet` is reconfigured,
   * leaving all other editor extensions and plugins untouched.
   *
   * The reconfiguration causes CodeMirror to:
   * - rebuild the facet value using the new `mappings`
   * - trigger `update()` calls in interested ViewPlugins
   *
   * Notes:
   * - Each Markdown view owns its own EditorState and must be updated individually.
   * - Optional chaining (`?.`) guards against views that do not currently expose
   *   a CodeMirror EditorView.
   */
  updateAllEditors() {
    for (const view of this.getAllMarkdownViews()) {
      this.getMarkdownViewsEditorView(view)?.dispatch({
        effects: this.settingsCompartment.reconfigure(
          SLD_SettingsFacet.of(this.settings.mappings)
        )
      });
    }
  }

  /**
   * Injects or updates dynamic CSS rules based on the current plugin settings.
   *
   * This method ensures that a single <style> element with a stable ID exists
   * in the document head and updates its contents whenever settings change.
   * The generated CSS reflects the current prefix mappings and is applied
   * globally across all editors.
   *
   * Notes:
   * - The style element is reused on subsequent calls to avoid DOM clutter.
   * - CSS generation is driven entirely by the current `settings.mappings`.
   */
  public injectDynamicCSS() {
      const styleId = "sld-dynamic-styles";
      let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

      if (!styleEl) {
          styleEl = document.createElement("style");
          styleEl.id = styleId;
          document.head.appendChild(styleEl);
      }

      // Generate CSS rules for each prefix mapping configuration and
      // replace the complete stylesheet content atomically.
      styleEl.innerHTML = this.settings.mappings.map(mapping => {
        return getDynamicCSS(mapping);
      }).join("\n");
  }

  /**
   * Returns all currently open Markdown views.
   *
   * Obsidian may have multiple Markdown editors open at the same time
   * (splits, panes, background tabs). Each view represents one editor
   * instance with its own lifecycle.
   */
  getAllMarkdownViews(): MarkdownView[] {
    return this.app.workspace.getLeavesOfType("markdown")
      .map(leaf => leaf.view)
      .filter((view): view is MarkdownView => view instanceof MarkdownView);
  }
  
  /**
   * Initializes observers for MarkdownView leaves to automatically attach
   * the CM link plugin to their EditorView instances.
   *
   * This method performs two main tasks:
   *
   * 1. **Initial processing of already open MarkdownViews**
   *    - Iterates through all leaves in the workspace.
   *    - For each leaf that is a MarkdownView and has not yet been processed,
   *      retrieves the underlying CodeMirror EditorView and installs the plugin.
   *    - Marks the leaf as processed to prevent duplicate installations.
   *
   * 2. **Observation of newly activated leaves**
   *    - Registers a listener on the "active-leaf-change" event.
   *    - When a leaf becomes active, it checks if it is a MarkdownView and not
   *      already processed.
   *    - Installs the plugin on the underlying EditorView if applicable.
   *
   * Notes:
   * - The helper function `processLeaf` encapsulates the logic for a single leaf.
   *   It uses an arrow function to correctly capture the plugin instance `this`.
   * - The WeakSet `processedLeaves` tracks leaves that already received the
   *   plugin to avoid re-installation.
   * - The old "layout-change" listener is removed, because it triggers for many
   *   unrelated layout modifications and is too broad for this use case.
   */
  private initViewObservers() {
    // Helper function to process a single leaf
    const processLeaf = (leaf: WorkspaceLeaf | null) => {
      const mdView = leaf?.view;

      // Skip if leaf is null, not a MarkdownView, or already processed
      if (!mdView || !(mdView instanceof MarkdownView) ||
          this.processedLeaves.has(mdView)) return;

      // Retrieve the underlying EditorView and install the plugin
      const editor = this.getMarkdownViewsEditorView(mdView);
      if (editor) {
        this.addCMLinkPluginToEditor(editor);
        this.processedLeaves.add(mdView);
      }
    }

    // Initial processing: handle all already open leaves (MarkdownViews)
    this.app.workspace.iterateAllLeaves(leaf => processLeaf(leaf));

    // Observe newly activated leaves (MarkdownView) for dynamic plugin installation
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", leaf => processLeaf(leaf))
    );
  }

  /**
   * Attaches or updates the CodeMirror link decorator plugin for a given editor.
   *
   * This method ensures that each EditorView has its own dedicated Compartment.
   * The compartment allows dynamic reconfiguration of editor extensions
   * (e.g. settings-dependent facets) without rebuilding the entire editor state.
   */
  addCMLinkPluginToEditor(editor: EditorView) {
    // Retrieve or create the compartment associated with this EditorView.
    // The WeakMap guarantees automatic cleanup when the editor is destroyed.
    let compartment = this.cmCompartmentMap.get(editor);

    if (!compartment) {
      compartment = new Compartment();
      this.cmCompartmentMap.set(editor, compartment);

      // Perform the initial attachment of the compartment to the editor.
      // `appendConfig` is used to add the compartment without affecting
      // existing editor extensions.
      editor.dispatch({
        effects: StateEffect.appendConfig.of([
          compartment.of([
            CMLinkDecoratorPlugin,
            CMLinkAliasReplacementPlugin
          ])
        ])
      });
    }

    // Reconfigure the compartment with the current settings.
    //
    // This updates the settings facet and ensures that the link decorator
    // plugin observes the latest prefix mappings.
    //
    // Note:
    // - Reconfiguration only affects this compartment.
    // - Other plugins and editor extensions remain untouched.
    editor.dispatch({
      effects: compartment.reconfigure([
        SLD_SettingsFacet.of(this.settings.mappings),
        CMLinkDecoratorPlugin,
        CMLinkAliasReplacementPlugin
      ])
    });
  }
  
  /**
   * Returns the underlying CodeMirror EditorView instance for the provided
   * Obsidian MarkdownView.
   *
   * Obsidian does not officially expose a typed CM6 EditorView. Access therefore
   * relies on an untyped `editor` container and an internal property (`cm`).
   * Both accesses use `any` because the Obsidian API does not provide stable
   * type information for these fields.
   *
   * @param mdv The MarkdownView instance or null.
   * @returns The EditorView instance if available; otherwise null.
   *
   * Notes:
   * - The method returns null if `md` or `md.editor` is not defined.
   * - This implementation depends on internal Obsidian structures. Any changes
   *   in the Obsidian core may break this access pattern.
   */
  private getMarkdownViewsEditorView(mdv: MarkdownView | null): EditorView | null {
    return (mdv?.editor as any)?.cm as EditorView | null;
  }
}