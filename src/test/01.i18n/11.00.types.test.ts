import { I18N_KEYS    } from "../../lib/i18n/keys";
import type { I18NKey } from "../../lib/i18n/types";

describe("Running 01.i18n/11.00.types.test.ts", () => {
  describe("Testing I18NKey", () => {

    test("I18NKey is a union of all values of I18N_KEYS", () => {
      type KeysFromObject = typeof I18N_KEYS[keyof typeof I18N_KEYS];

      expectTypeOf<I18NKey>().toEqualTypeOf<KeysFromObject>();
    });

    test("valid I18N_KEYS values are assignable to I18NKey", () => {
      const key: I18NKey = I18N_KEYS.SETTINGS_HEADER;
      expect(key).toBe("settings.header");
    });

    test("invalid keys are rejected at compile time", () => {
      // @ts-expect-error – invalid i18n key must not be assignable
      const key: I18NKey = "settings.this.does.not.exist";
      void key;
    });

  });
});