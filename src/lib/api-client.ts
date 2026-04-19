const DEFAULT_BASE_URL = 'https://api.plateful.uk/api';

export const apiBaseUrl = (process.env.LARAVEL_API_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message: string, readonly status?: number, readonly cause?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiEnvelope<T> {
  code: number;
  data: T;
  message?: string;
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const url = buildUrl(path, params);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'plateful-public-mcp/1.0',
      },
    });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Laravel API fetch failed: ${url}`, err);
    throw new ApiError('Plateful API is temporarily unavailable', undefined, err);
  }

  if (!response.ok) {
    console.error(
      `[${new Date().toISOString()}] Laravel API returned ${response.status} for ${url}`
    );
    throw new ApiError(
      `Plateful API returned ${response.status}`,
      response.status
    );
  }

  let payload: ApiEnvelope<T>;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch (err) {
    throw new ApiError('Plateful API returned an invalid JSON response', response.status, err);
  }

  if (payload.code !== 200) {
    throw new ApiError(
      payload.message ?? `Plateful API returned code ${payload.code}`,
      response.status
    );
  }

  return payload.data;
}
