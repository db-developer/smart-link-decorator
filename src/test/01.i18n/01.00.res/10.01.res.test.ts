import { RESOURCES,
         FALLBACK_LANGUAGE } from "../../../lib/i18n/res";

describe("Running 01.i18n/05.01.resources.test.ts", () => {

  test("RESOURCES exists and is an object", () => {
    expect(RESOURCES).toBeDefined();
    expect(typeof RESOURCES).toBe("object");
  });

  test("FALLBACK_LANGUAGE exists and is a string", () => {
    expect(FALLBACK_LANGUAGE).toBeDefined();
    expect(typeof FALLBACK_LANGUAGE).toBe("string");
  });

  test("RESOURCES contains en and de", () => {
    expect(RESOURCES).toHaveProperty("en");
    expect(RESOURCES).toHaveProperty("de");
  });

  test("RESOURCES values are of type I18NResource", () => {
    Object.entries(RESOURCES).forEach(([lang, resource]) => {
      // Typensicherheit
      expect(resource).toBeDefined();
      // Laufzeitprüfung
      expect(typeof resource).toBe("object");
      // Alle Keys sollten mindestens 1 Eintrag haben
      expect(Object.keys(resource).length).toBeGreaterThan(0);
    });
  });

});
