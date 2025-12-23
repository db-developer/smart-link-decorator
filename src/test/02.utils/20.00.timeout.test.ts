import { debounce } from "../../lib/utils/timeout";

describe( "Running 02.utils/20.00.timeout.test.ts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });
  
  /**
   * Testing function debounce
   */
  describe("Testing function debounce", () => {
    test("debounce is defined and is a function", () => {
      expect(debounce).toBeDefined();
      expect(typeof debounce).toBe("function");
    });
  });

  describe("debounce", () => {
    test("führt die Funktion einmal aus, wenn nur einmal aufgerufen", async () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 50);

      debounced();

      // alle Timer sofort laufen lassen
      vi.advanceTimersByTime(60);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    test("führt nur den letzten Aufruf aus, wenn schnell mehrfach aufgerufen", async () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 50);

      debounced();
      debounced();
      debounced();

      vi.advanceTimersByTime(60);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    test("überträgt die Parameter korrekt", async () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 50);

      debounced("a", 42);
      vi.advanceTimersByTime(60);

      expect(fn).toHaveBeenCalledWith("a", 42);
    });

    test("führt die Funktion erneut aus, wenn nach Debounce-Zeit wieder aufgerufen", async () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 50);

      debounced();
      vi.advanceTimersByTime(60);
      debounced();
      vi.advanceTimersByTime(60);

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });  
});