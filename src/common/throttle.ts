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

export function eagerDebouncer(
  func: () => void | Thenable<void>,
  wait: number,
): () => "immediately" | "delayed" {
  let isRunning = false;
  let runAgain = false;

  async function run() {
    runAgain = false;
    try {
      await func();
    } finally {
      setTimeout(() => {
        if (runAgain) {
          runAgain = false;
          run();
        } else {
          isRunning = false;
        }
      }, wait);
    }
  }

  return () => {
    if (isRunning) {
      runAgain = true;
      return "delayed";
    } else {
      isRunning = true;
      runAgain = false;
      run();
      return "immediately";
    }
  };
}
