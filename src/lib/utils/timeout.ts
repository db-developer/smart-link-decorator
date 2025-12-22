/**
 * Creates a debounced version of a function.
 *
 * This function is currently not used and only remains in the source
 * in case it might be needed elsewhere in the future.
 *
 * Debouncing ensures that the provided function `fn` is only executed
 * after a waiting period (`delay` in milliseconds) has passed
 * without additional calls.
 *
 * Typical use case: Preventing excessive function calls in response
 * to events such as scroll, input, resize, or DOM mutations.
 *
 * @template T - The type of the original function with arbitrary parameters
 * @param fn - The function to debounce
 * @param delay - Time in milliseconds to wait after the last call
 * @returns A new function that applies the debouncing logic
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
) {
  let timer: number | null = null;

  return (...args: Parameters<T>) => {
    if (timer !== null) {
      window.clearTimeout(timer);
    }
    timer = window.setTimeout(() => {
      fn(...args);
    }, delay);
  };
}