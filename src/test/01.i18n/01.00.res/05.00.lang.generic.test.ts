import { I18N_KEYS         } from "../../../lib/i18n/keys";
// Sprachdateien importieren
import { en                } from "../../../lib/i18n/res/en";
import { de                } from "../../../lib/i18n/res/de";

import type { I18NResource } from "../../../lib/i18n/res/I18NResource";

// Liste aller Sprachressourcen
const LANGS: Record<string, I18NResource> = {
  en,
  de,
};

describe("Running 01.i18n/01.00.res/05.00.lang.generic.test.ts", () => {
  Object.entries(LANGS).forEach(([langCode, resource]) => {
    describe(`Testing ${langCode} I18NResource`, () => {

      test(`${langCode} exists and is an object`, () => {
        expect(resource).toBeDefined();
        expect(typeof resource).toBe("object");
      });

      test(`${langCode} contains all keys from I18N_KEYS`, () => {
        Object.values(I18N_KEYS).forEach(key => {
          expect(resource).toHaveProperty(key);
        });
      });

      test(`all ${langCode} values are non-empty strings`, () => {
        Object.entries(resource).forEach(([key, value]) => {
          expect(typeof value).toBe("string");
          expect(value.trim().length).toBeGreaterThan(0);
        });
      });

      test(`${langCode} does not contain unknown extra keys`, () => {
        const extraKeys = Object.keys(resource).filter(k => !Object.values(I18N_KEYS).includes(k as any));
        expect(extraKeys).toHaveLength(0);
      });

    });
  });
});
