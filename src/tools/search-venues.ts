import { z } from 'zod';
import { apiGet, ApiError } from '../lib/api-client.js';
import { mapVenueList, type RawVenue } from '../lib/mappers.js';

export const searchVenuesInputShape = {
  query: z
    .string()
    .optional()
    .describe('Search term like cuisine type, venue name, or food style'),
  latitude: z.number().optional().describe('Latitude for location-based search'),
  longitude: z.number().optional().describe('Longitude for location-based search'),
  category: z
    .string()
    .optional()
    .describe(
      'Category filter: Breakfast, Brunch, Coffee & Tea, Lunch, Dinner, Drinks, Food Truck'
    ),
  limit: z
    .number()
    .min(1)
    .max(50)
    .default(10)
    .describe('Max results to return'),
};

export const searchVenuesDescription =
  'Search for restaurants, bars, cafés and other hospitality venues in the UK. ' +
  'Returns a list of venues matching the query.';

const searchVenuesSchema = z.object(searchVenuesInputShape);
type SearchVenuesInput = z.infer<typeof searchVenuesSchema>;

export async function runSearchVenues(input: SearchVenuesInput) {
  const { query, latitude, longitude, category, limit } = input;

  try {
    let venues: RawVenue[];

    if (query) {
      venues = await apiGet<RawVenue[]>('/landing/places/search', {
        q: query,
        length: limit,
        latitude,
        longitude,
      });
    } else if (category) {
      venues = await apiGet<RawVenue[]>('/landing/places/highlights', {
        category,
        start: 0,
        length: limit,
        latitude,
        longitude,
      });
    } else {
      venues = await apiGet<RawVenue[]>('/landing/places/highlights', {
        start: 0,
        length: limit,
        latitude,
        longitude,
      });
    }

    return {
      count: Array.isArray(venues) ? venues.length : 0,
      venues: mapVenueList(venues),
    };
  } catch (err) {
    const message =
      err instanceof ApiError
        ? err.message
        : 'Unexpected error while searching venues';
    console.error(`[${new Date().toISOString()}] search_venues failed:`, err);
    throw new Error(message);
  }
}
