import { i18n               } from "../../lib/i18n";
import { I18N_KEYS          } from "../../lib/i18n/keys";
import { FALLBACK_LANGUAGE, 
         RESOURCES          } from "../../lib/i18n/res";

import type { I18NKey       } from "../../lib/i18n/types";

describe("Running 01.i18n/12.00.i18n.test.ts", () => {
  describe("Testing i18n()", () => {

    beforeEach(() => {
      window.localStorage.clear();
    });

    test("i18n is defined and is a function", () => {
      expect(i18n).toBeDefined();
      expect(typeof i18n).toBe("function");
    });

    test("i18n accepts valid I18NKey", () => {
      const key: I18NKey = I18N_KEYS.SETTINGS_HEADER;
      const result = i18n(key);

      expect(typeof result).toBe("string");
    });

    test("i18n returns translation for fallback language if no language is set", () => {
      const key = I18N_KEYS.SETTINGS_HEADER;

      const expected =
        RESOURCES[FALLBACK_LANGUAGE][key];

      expect(i18n(key)).toBe(expected);
    });

    test("i18n uses language from localStorage when available", () => {
      const lang = Object.keys(RESOURCES)[0];
      const key = I18N_KEYS.SETTINGS_HEADER;

      window.localStorage.setItem("language", lang);

      expect(i18n(key)).toBe(RESOURCES[lang][key]);
    });

    test("i18n falls back if language in localStorage is unknown", () => {
      const key = I18N_KEYS.SETTINGS_HEADER;

      window.localStorage.setItem("language", "__invalid__");

      expect(i18n(key)).toBe(
        RESOURCES[FALLBACK_LANGUAGE][key]
      );
    });

    test("i18n does not accept invalid keys (compile time)", () => {
      // @ts-expect-error – invalid I18N key must be rejected
      i18n("settings.this.key.does.not.exist");
    });

  });
});