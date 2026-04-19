import { z } from 'zod';
import { apiGet, ApiError } from '../lib/api-client.js';
import { mapVenueList, type RawVenue } from '../lib/mappers.js';

export const getVenuesNearbyInputShape = {
  latitude: z.number().describe('Latitude of the location'),
  longitude: z.number().describe('Longitude of the location'),
  radius_km: z
    .number()
    .min(0.5)
    .max(50)
    .default(5)
    .describe('Search radius in kilometres'),
  category: z.string().optional().describe('Optional category filter'),
  limit: z
    .number()
    .min(1)
    .max(50)
    .default(10)
    .describe('Max results to return'),
};

export const getVenuesNearbyDescription =
  "Find venues near a specific location. Useful for 'restaurants near me' type queries.";

const getVenuesNearbySchema = z.object(getVenuesNearbyInputShape);
type GetVenuesNearbyInput = z.infer<typeof getVenuesNearbySchema>;

export async function runGetVenuesNearby(input: GetVenuesNearbyInput) {
  const { latitude, longitude, radius_km, category, limit } = input;

  try {
    const venues = await apiGet<RawVenue[]>('/landing/places/highlights', {
      latitude,
      longitude,
      radius_km,
      category,
      start: 0,
      length: limit,
    });

    return {
      count: Array.isArray(venues) ? venues.length : 0,
      latitude,
      longitude,
      radius_km,
      venues: mapVenueList(venues),
    };
  } catch (err) {
    const message =
      err instanceof ApiError
        ? err.message
        : 'Unexpected error while finding nearby venues';
    console.error(`[${new Date().toISOString()}] get_venues_nearby failed:`, err);
    throw new Error(message);
  }
}
