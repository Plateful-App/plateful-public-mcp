import { apiGet, ApiError } from '../lib/api-client.js';

interface RawCategory {
  id: number;
  name: string;
}

export const getVenueCategoriesInputShape = {};

export const getVenueCategoriesDescription =
  'List all available venue categories for filtering.';

export async function runGetVenueCategories() {
  try {
    const categories = await apiGet<RawCategory[]>('/landing/place-categories');
    const list = Array.isArray(categories)
      ? categories.map((c) => ({ id: c.id, name: c.name }))
      : [];
    return { count: list.length, categories: list };
  } catch (err) {
    const message =
      err instanceof ApiError
        ? err.message
        : 'Unexpected error while fetching categories';
    console.error(`[${new Date().toISOString()}] get_venue_categories failed:`, err);
    throw new Error(message);
  }
}
