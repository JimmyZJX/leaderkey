import { log } from "./global";

export async function* throttler(ms: number) {
  let lastYieldTime = 0;

  while (true) {
    const currentTime = performance.now();
    const timeSinceLastYield = currentTime - lastYieldTime;

    if (timeSinceLastYield < ms) {
      // If not enough time has passed, wait for the remaining time
      const timeToWait = ms - timeSinceLastYield;
      await new Promise((resolve) => setTimeout(resolve, timeToWait));
    }

    // Update the last yield time to now
    lastYieldTime = performance.now();

    // Yield control back to the caller
    yield;
  }
}

export function eagerDebouncer(ms: number): (f: () => void) => "immediately" | "delayed" {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastCallTime = 0;

  return (f: () => void) => {
    const currentTime = performance.now();
    const timeSinceLastCall = currentTime - lastCallTime;
    lastCallTime = currentTime;

    // Clear any existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (timeSinceLastCall >= ms) {
      // If enough time has passed since the last call, execute immediately
      log("eagerDebouncer: immediate execution");
      f();
      return "immediately";
    } else {
      // Otherwise, set a timeout to execute after the remaining time
      timeoutId = setTimeout(() => {
        lastCallTime = performance.now();
        log("eagerDebouncer: delayed execution");
        f();
        timeoutId = null;
      }, ms);
      return "delayed";
    }
  };
}
