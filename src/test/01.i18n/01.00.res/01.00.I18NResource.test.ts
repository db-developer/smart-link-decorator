import { I18N_KEYS         } from "../../../lib/i18n/keys";

import type { I18NKey      } from "../../../lib/i18n/types";
import type { I18NResource } from "../../../lib/i18n/res/I18NResource";

describe("Running 01.i18n/04.00.resource-types.test.ts", () => {
  describe("Testing I18NResource", () => {

    test("I18NResource enforces all I18NKey entries", () => {
      const resource: I18NResource = {
        [I18N_KEYS.SETTINGS_HEADER]: "Settings",
        [I18N_KEYS.SETTINGS_TABLE_HEADER_PREFIX]: "Prefix",
        [I18N_KEYS.SETTINGS_TABLE_HEADER_EMOJI]: "Emoji",
        [I18N_KEYS.SETTINGS_TABLE_HEADER_LINKTYPE]: "Link type",
        [I18N_KEYS.SETTINGS_TABLE_HEADER_TEXTCOLOR]: "Text color",
        [I18N_KEYS.SETTINGS_TABLE_HEADER_BACKGROUND]: "Background",
        [I18N_KEYS.SETTINGS_TABLE_HEADER_BACKGROUNDALPHA]: "Background alpha",
        [I18N_KEYS.SETTINGS_TABLE_HEADER_UNDERLINE]: "Underline",
        [I18N_KEYS.SETTINGS_TABLE_HEADER_DELETE]: "Delete",
        [I18N_KEYS.SETTINGS_CONTROL_PLACEHOLDER_PREFIX]: "Prefix placeholder",
        [I18N_KEYS.SETTINGS_CONTROL_TOOLTIP_PREFIX]: "Prefix tooltip",
        [I18N_KEYS.SETTINGS_CONTROL_PLACEHOLDER_EMOJI]: "Emoji placeholder",
        [I18N_KEYS.SETTINGS_CONTROL_TOOLTIP_EMOJI]: "Emoji tooltip",
        [I18N_KEYS.SETTINGS_CONTROL_PLACEHOLDER_LINKTYPE]: "Link type placeholder",
        [I18N_KEYS.SETTINGS_CONTROL_TOOLTIP_LINKTYPE]: "Link type tooltip",
        [I18N_KEYS.SETTINGS_CONTROL_TOOLTIP_DELETE]: "Delete tooltip",
        [I18N_KEYS.SETTINGS_CONTROL_TEXT_APPEND]: "Append",
      };

      expectTypeOf(resource).toEqualTypeOf<I18NResource>();
    });

    test("I18NResource does not allow missing keys", () => {
      // @ts-expect-error – missing required I18NKey entry
      const incomplete: I18NResource = {
        [I18N_KEYS.SETTINGS_HEADER]: "Settings",
      };
      void incomplete;
    });

    test("I18NResource does not allow additional keys", () => {
      // @ts-expect-error – additional keys are not allowed
      const invalid: I18NResource = {
        [I18N_KEYS.SETTINGS_HEADER]: "Settings",
        foo: "bar",
      };
      void invalid;
    });

    test("I18NResource values must be strings", () => {
      // @ts-expect-error – values must be strings
      const invalid: I18NResource = {
        [I18N_KEYS.SETTINGS_HEADER]: 123,
      };
      void invalid;
    });

    test("I18NResource keys are exactly I18NKey", () => {
      type ResourceKeys = keyof I18NResource;

      expectTypeOf<ResourceKeys>().toEqualTypeOf<I18NKey>();
    });

  });
});