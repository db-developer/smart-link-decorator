import { I18N_KEYS } from "../../lib/i18n/keys"

describe( "Running 01.i18n/10.00.keys.test.ts", () => {
  describe("Testing I18N_KEYS", () => {

    test("I18N_KEYS is defined and is a function", () => {
      expect(I18N_KEYS).toBeDefined();
      expect(typeof I18N_KEYS).toBe("object");
      expect(I18N_KEYS).not.toBeNull();
      expect(Array.isArray(I18N_KEYS)).toBe(false);
    });

    test("I18N_KEYS contains all expected keys", () => {
      const expectedKeys = [
        "SETTINGS_HEADER",
        "SETTINGS_TABLE_HEADER_PREFIX",
        "SETTINGS_TABLE_HEADER_EMOJI",
        "SETTINGS_TABLE_HEADER_LINKTYPE",
        "SETTINGS_TABLE_HEADER_TEXTCOLOR",
        "SETTINGS_TABLE_HEADER_BACKGROUND",
        "SETTINGS_TABLE_HEADER_BACKGROUNDALPHA",
        "SETTINGS_TABLE_HEADER_UNDERLINE",
        "SETTINGS_TABLE_HEADER_DELETE",
        "SETTINGS_CONTROL_PLACEHOLDER_PREFIX",
        "SETTINGS_CONTROL_TOOLTIP_PREFIX",
        "SETTINGS_CONTROL_PLACEHOLDER_EMOJI",
        "SETTINGS_CONTROL_TOOLTIP_EMOJI",
        "SETTINGS_CONTROL_PLACEHOLDER_LINKTYPE",
        "SETTINGS_CONTROL_TOOLTIP_LINKTYPE",
        "SETTINGS_CONTROL_TOOLTIP_DELETE",
        "SETTINGS_CONTROL_TEXT_APPEND"
      ];

      expectedKeys.forEach(key => {
        expect(I18N_KEYS).toHaveProperty(key);
      });
    });

    test("all I18N_KEYS values are strings", () => {
      Object.values(I18N_KEYS).forEach(value => {
        expect(typeof value).toBe("string");
      });
    });

    test("all I18N_KEYS values use the expected namespace prefix", () => {
      Object.values(I18N_KEYS).forEach(value => {
        expect(value).toMatch(/^settings\./);
      });
    });

    test("I18N_KEYS does not contain duplicate values", () => {
      const values = Object.values(I18N_KEYS);
      const uniqueValues = new Set(values);

      expect(uniqueValues.size).toBe(values.length);
    });
  });
});
