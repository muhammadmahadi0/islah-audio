/**
 * Race a promise against a timeout. youtubei.js calls accept no abort
 * signal, so a stalled upstream would otherwise hang the serverless
 * function until the platform kills it.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * fetch() never times out on its own — on a stalled mobile network the
 * promise hangs forever and the UI spins forever. Always go through here.
 */
export async function fetchJson<T = any>(url: string, ms = 15000): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    return (await res.json()) as T;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new Error(`Timed out after ${ms}ms: ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
