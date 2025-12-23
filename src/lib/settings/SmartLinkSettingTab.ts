import { PluginSettingTab, 
         App,
         Setting,
         setTooltip,
         ButtonComponent,
         ColorComponent,
         TextComponent,
         ToggleComponent     } from "obsidian";
import   SmartLinkDecorator    from "../main";
import { I18N_KEYS,
         i18n                } from "../i18n" 
import { PrefixMapping       } from "../types/PrefixMapping";
import { getSettingsTabCSS   } from "../utils/css";
import { hexToRgba, 
         normalizeColorToHex } from "../utils/color";

/**
 * Obsidian settings tab for the SmartLink system.
 *
 * This class extends Obsidian's PluginSettingTab to provide a UI
 * for configuring SmartLink-related options.
 *
 * Responsibilities:
 * - Render settings controls for the SmartLinkDecorator plugin
 * - Allow users to view and modify prefix mappings, colors, and
 *   other visual or behavioral options
 * - Persist changes to the plugin's settings storage
 *
 * Fields:
 * - plugin: Reference to the main SmartLinkDecorator plugin instance.
 *   This allows the settings tab to read current settings, apply
 *   updates, and trigger any necessary refreshes in the plugin.
 *
 * Note:
 * - This class is purely for the Obsidian settings UI and does not
 *   interact with CodeMirror directly.
 */
export class SmartLinkSettingTab extends PluginSettingTab {
  plugin: SmartLinkDecorator;

  /**
   * Constructs a new SmartLinkSettingTab.
   *
   * @param app - The Obsidian App instance, required by PluginSettingTab.
   * @param plugin - The main SmartLinkDecorator plugin instance.
   *
   * Responsibilities:
   * - Pass the app and plugin references to the base PluginSettingTab constructor.
   * - Store a reference to the SmartLinkDecorator plugin instance for
   *   use when rendering and updating settings.
   *
   * Note:
   * - This constructor does not perform any UI rendering itself;
   *   that is handled in the display() method.
   */
  constructor(app: App, plugin: SmartLinkDecorator) {
    super(app, plugin);
    this.plugin = plugin;
  }

  /**
   * Persists the current plugin settings and reapplies dynamic CSS.
   *
   * This method performs two steps in order:
   * 1) Save the plugin's settings asynchronously to storage.
   * 2) Re-inject dynamic CSS to reflect any changes in colors, backgrounds,
   *    or other style-related settings.
   *
   * Notes:
   * - The method is async because saving settings may involve
   *   asynchronous I/O.
   * - Re-injecting CSS after saving ensures that any changes
   *   made by the user in the settings tab take immediate effect
   *   in the editor or UI.
   */
  private async save() {
    // Persist settings to Obsidian storage first
    await this.plugin.saveSettings();

    // Then re-apply dynamic CSS to reflect updated visual settings
    this.plugin.injectDynamicCSS();
  } 

  /**
   * Renders the settings UI inside the Obsidian settings tab.
   *
   * Responsibilities:
   * - Clear any existing content in the container element.
   * - Create and append DOM elements for each configurable option
   *   (e.g., prefix mappings, colors, visual styles).
   * - Attach event listeners to handle user input and update plugin
   *   settings in real time or via the save() method.
   *
   * Notes:
   * - This method is called by Obsidian when the settings tab is
   *   opened or needs to be refreshed.
   * - All interactions here should be non-blocking and synchronous
   *   except when explicitly awaiting save operations.
   */
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: i18n(I18N_KEYS.SETTINGS_HEADER)});

    // Scroll-Wrapper
    const gridWrapper = containerEl.createDiv("smartlink-grid-wrapper");

    /* === Sticky Header === */
    const headerRow  = gridWrapper.createDiv("smartlink-grid-header");

    const headerGrid = headerRow.createDiv("smartlink-grid");
                       headerGrid.createDiv({ text: i18n(I18N_KEYS.SETTINGS_TABLE_HEADER_PREFIX)});
                       headerGrid.createDiv({ text: i18n(I18N_KEYS.SETTINGS_TABLE_HEADER_EMOJI)});
                       headerGrid.createDiv({ text: i18n(I18N_KEYS.SETTINGS_TABLE_HEADER_LINKTYPE)});
                       headerGrid.createDiv({ text: i18n(I18N_KEYS.SETTINGS_TABLE_HEADER_TEXTCOLOR)});
                       headerGrid.createDiv({ text: i18n(I18N_KEYS.SETTINGS_TABLE_HEADER_BACKGROUND)});
                       headerGrid.createDiv({ text: i18n(I18N_KEYS.SETTINGS_TABLE_HEADER_UNDERLINE)});
                       headerGrid.createDiv({ text: " " }); // Delete

    this.plugin.settings.mappings.forEach((mapping: PrefixMapping, index: number) => {

      // Eine Setting-Zeile pro Mapping
      const setting = new Setting(gridWrapper)
        .setClass("smartlink-grid-row");

      // Grid-Container innerhalb der Setting-Zeile
      const grid = setting.controlEl.createDiv("smartlink-grid");

      // Präfix
      new TextComponent(grid)
        .setPlaceholder(i18n(I18N_KEYS.SETTINGS_CONTROL_PLACEHOLDER_PREFIX))
        .setValue(mapping.prefix ?? "")
        .then(tc => {
          tc.inputEl.maxLength = 1;
          setTooltip(tc.inputEl, i18n(I18N_KEYS.SETTINGS_CONTROL_TOOLTIP_PREFIX));
          tc.inputEl.addEventListener("blur", async e => {
            mapping.prefix = (e.target as HTMLInputElement).value.slice(0, 1);
            await this.save();
          });
        });

      // Emoji
      new TextComponent(grid)
        .setPlaceholder(i18n(I18N_KEYS.SETTINGS_CONTROL_PLACEHOLDER_EMOJI))
        .setValue(mapping.emoji ?? "")
        .then(tc => {
          tc.inputEl.maxLength = 2;
          setTooltip(tc.inputEl, i18n(I18N_KEYS.SETTINGS_CONTROL_TOOLTIP_EMOJI));
          tc.inputEl.addEventListener("blur", async e => {
            mapping.emoji = (e.target as HTMLInputElement).value.slice(0, 2);
            await this.save();
          });
        });

      // Link-Type
      new TextComponent(grid)
        .setPlaceholder(i18n(I18N_KEYS.SETTINGS_CONTROL_PLACEHOLDER_LINKTYPE))
        .setValue(mapping.linkType ?? "")
        .then(tc => {
          setTooltip(tc.inputEl, i18n(I18N_KEYS.SETTINGS_CONTROL_TOOLTIP_LINKTYPE));
          tc.inputEl.addEventListener("blur", async e => {
            mapping.linkType = (e.target as HTMLInputElement).value;
            await this.save();
          });
        });

      // Farbe
      new ColorComponent(grid)
        .setValue(normalizeColorToHex(mapping.color) ?? "#000000")
        .onChange(async val => {
          mapping.color = val;
          await this.save();
        });

      // Hintergrund
      new ColorComponent(grid)
        .setValue(normalizeColorToHex(mapping.background) ?? "#ffffff")
        .onChange(async val => {
          mapping.background = hexToRgba(val, mapping.backgroundAlpha ?? 1);
          await this.save();
        });

      // Underline
      new ToggleComponent(grid)
        .setValue(mapping.underline ?? false)
        .onChange(async val => {
          mapping.underline = val;
          await this.save();
        });

      // Delete-Button
      new ButtonComponent(grid)
        .setIcon("trash")
        .setTooltip(i18n(I18N_KEYS.SETTINGS_CONTROL_TOOLTIP_DELETE))
        .onClick(async () => {
          this.plugin.settings.mappings.splice(index, 1);
          await this.plugin.saveSettings();
          this.display();
        });
    });

    // Neues Mapping
    new Setting(containerEl).addButton(btn =>
      btn
        .setButtonText(i18n(I18N_KEYS.SETTINGS_CONTROL_TEXT_APPEND))
        .setCta()
        .onClick(async () => {
          this.plugin.settings.mappings.push({
            prefix: "",
            emoji: "",
            linkType: "",
            color: "#000000",
            background: "#ffffff",
            backgroundAlpha: 0.15,
            underline: false
          });
          await this.plugin.saveSettings();
          this.display();
        })
    );

    this.addStyling(containerEl);
  }

  /**
   * Injects the CSS required for the settings tab into the given container.
   *
   * The style element is added only once per container, identified by a
   * fixed STYLE_ID, to avoid duplicate CSS injection on re-render
   * (e.g. when display() is called multiple times).
   *
   * The actual CSS is provided by getSettingsTabCSS() to keep styling
   * concerns separated from the UI logic.
   */
  private addStyling(containerEl: HTMLElement): void {
    const STYLE_ID = "smartlink-decorator-settings-style";

    if (containerEl.querySelector(`#${STYLE_ID}`)) {
      return;
    }

    const styleEl = containerEl.createEl("style");
    styleEl.id = STYLE_ID;

    styleEl.textContent = getSettingsTabCSS();
  }
}
