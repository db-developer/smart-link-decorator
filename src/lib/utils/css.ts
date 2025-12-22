import { PrefixMapping } from "../types/PrefixMapping.js";

/**
 * Generates the complete CSS block for a single mapping configuration.
 *
 * The function creates CSS rules for:
 *  - the Obsidian editor (live Markdown, CodeMirror)
 *  - the rendered preview mode
 * including hover effects.
 *
 * The rules are constructed based on the properties of the provided `PrefixMapping`.
 *
 * Expected structure of `mapping`:
 *  - mapping.linkType: string  
 *        The active type that is targeted via the `data-sld-type` attribute.
 *
 *  - mapping.color?: string  
 *        Text color for links of this type. Applied only if a value exists.
 *
 *  - mapping.background?: string  
 *        Background color for links. Used in both normal and hover states.
 *
 *  - mapping.underline: boolean  
 *        Determines whether the link is underlined (`underline`) or not (`none`).
 *
 * Logic:
 *  - Selectors target both editor link rendering and preview link elements.
 *  - The `data-sld-type` attribute is used to style the mapping type selectively.
 *  - Optional colors are applied only if defined in the mapping.
 *  - Hover effects use `color-mix` to lighten the background color by approximately 70% toward white.
 *
 * @param mapping - A single PrefixMapping object containing configuration
 *                  for link type, colors, background, and underline.
 * @returns A string containing fully usable CSS that can be directly
 *          inserted into a <style> element.
 */
export function getDynamicCSS(mapping:PrefixMapping): string {
  return `
  /* --- Editor (Live Markdown) for ${mapping.linkType} --- */
  .cm-s-obsidian span.cm-hmd-internal-link.cm-link-alias [data-sld-type*="${mapping.linkType}"] > a.cm-underline {
    ${mapping.color ? `color: ${mapping.color};` : ''}
    ${mapping.background ? `background-color: ${mapping.background};` : ''}
    border-radius: 11px;
    font-size: 14px;
    padding: 2px 7px 4px 7px;
    text-decoration: ${mapping.underline ? `underline` : `none`} !important;
  }
  /* Editor Hover-Effekt (Live Markdown) for ${mapping.linkType} */
  .cm-s-obsidian span.cm-hmd-internal-link.cm-link-alias [data-sld-type*="${mapping.linkType}"] > a.cm-underline:hover {
    ${mapping.background ? `background-color: color-mix(in srgb, ${mapping.background} 70%, white);` : ''}
    text-decoration: ${mapping.underline ? `underline` : `none`} !important;
  }
  /* --- Preview (gerendert) for ${mapping.linkType} --- */
  span[data-sld-type*="${mapping.linkType}"] a.internal-link {
    ${mapping.color ? `color: ${mapping.color};` : ''}
    ${mapping.background ? `background-color: ${mapping.background};` : ''}
    border-radius: 11px;
    font-size: 14px;
    padding: 2px 7px 4px 7px;
    text-decoration: ${mapping.underline ? `underline` : `none`} !important;
  }
  /* Preview Hover-Effekt (gerendert) for ${mapping.linkType} */
  span[data-sld-type*="${mapping.linkType}"] a.internal-link:hover {
    ${mapping.background ? `background-color: color-mix(in srgb, ${mapping.background} 70%, white);` : ''}
    text-decoration: ${mapping.underline ? `underline` : `none`} !important;
  }`.replace(/^\s*$/gm, ""); // leere Zeilen entfernen
}

/**
 *  Returns the CSS string for the SmartLinkDecorator settings tab.
 *  @returns {string} The CSS styles for the settings tab.
 */
export function getSettingsTabCSS(): string {
  return `
    /* ===============================
      CSS Variablen für Spalten & Zeilen
      =============================== */
    :root {
      --smartlink-header-row-height: 30px;
      --smartlink-row-height: 40px;
      --smartlink-max-rows: 6;

      --col-prefix: 40px;
      --col-emoji: 48px;
      --col-linktype: 200px;
      --col-color: 80px;        /* Font color */
      --col-background: 80px;   /* Background color */
      --col-underline: 60px;
      --col-delete: 32px;
    }

    /* ===============================
      Scroll-Wrapper mit fixer Höhe
      =============================== */
    .smartlink-grid-wrapper {
      height: calc(var(--smartlink-row-height) * var(--smartlink-max-rows));
      min-height: calc(var(--smartlink-row-height) * var(--smartlink-max-rows));
      max-height: calc(var(--smartlink-row-height) * var(--smartlink-max-rows));

      overflow: auto; /* vertikal + horizontal */
      border: 1px solid var(--background-modifier-border);
      border-radius: 6px;
      padding: 0 4px 4px 4px; /* oben 0, verhindert Spalt */
      box-sizing: border-box;
    }

    /* ===============================
      Sticky Header
      =============================== */
    .smartlink-grid-header {
      position: sticky;
      top: 0;
      z-index: 2;

      background-color: var(--background-primary);
      border-bottom: 1px solid var(--background-modifier-border);
      padding-left: calc(var(--size-4-3) + var(--size-4-3)); /* Obsidian spacing token + zusätzliches Padding*/
      box-sizing: border-box;
      display: flex;
      align-items: center;
      height: var(--smartlink-header-row-height);
    }

    .smartlink-grid-header .smartlink-grid > div {
      width: 100%;
      text-align: left;
      box-sizing: border-box;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
    }

    /* ===============================
      Grid für Header & Controls
      =============================== */
    .smartlink-grid,
    .smartlink-grid-header .smartlink-grid {
      display: grid;
      grid-template-columns:
        var(--col-prefix)
        var(--col-emoji)
        var(--col-linktype)
        var(--col-color)
        var(--col-background)
        var(--col-underline)
        var(--col-delete);
      gap: 8px;
      align-items: center;
      width: max-content;
      justify-items: start;
    }

    /* ===============================
      Controls pro Zeile
      =============================== */
    .smartlink-grid-row {
      min-height: var(--smartlink-row-height);
      display: flex;
      align-items: center;
      margin: 0;
    }

    .smartlink-grid-row .setting-item-control,
    .smartlink-grid-row .setting-item-control > * {
      margin: 0 !important;
      justify-content: flex-start !important;
      align-items: center;
      width: 100% !important;
      box-sizing: border-box;
    }

    /* Text-Input */
    .smartlink-grid-row input[type="text"] {
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      padding: 0 4px;
    }

    /* Color Picker */
    .smartlink-grid-row input[type="color"] {
      box-sizing: border-box;
      justify-self: center;
      padding: 0;
    }

    /* Toggle */
    .smartlink-grid-row .checkbox-container {
      justify-self: center;
      margin: 0 !important;
    }

    /* Delete Button */
    .smartlink-grid-row button {
      justify-self: start;
      margin: 0 !important;
    }

    /* Hover für Zeilen */
    .smartlink-grid-row:hover {
      background-color: var(--background-modifier-hover);
    }
  `;  
}