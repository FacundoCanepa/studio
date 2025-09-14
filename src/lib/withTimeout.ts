// [504]
export async function withTimeout<T>(
  promise: Promise<T>,
  ms = 8000,
  reason = "Timeout"
): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(reason)), ms);
  });
  try {
    const res = await Promise.race([promise, timeout]);
    return res as T;
  } finally {
    clearTimeout(timeoutId!);
  }
}
