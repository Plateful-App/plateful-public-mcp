import { z } from 'zod';
import { apiGet, ApiError } from '../lib/api-client.js';
import { mapVenueDetail, type RawVenue } from '../lib/mappers.js';

export const getVenueInputShape = {
  venue_id: z.number().describe('The venue ID'),
};

export const getVenueDescription =
  'Get detailed information about a specific venue including opening hours, contact details, and description.';

const getVenueSchema = z.object(getVenueInputShape);
type GetVenueInput = z.infer<typeof getVenueSchema>;

export async function runGetVenue(input: GetVenueInput) {
  try {
    const venue = await apiGet<RawVenue>(`/landing/place/${input.venue_id}`);
    return mapVenueDetail(venue);
  } catch (err) {
    const message =
      err instanceof ApiError
        ? err.message
        : 'Unexpected error while fetching venue';
    console.error(`[${new Date().toISOString()}] get_venue failed:`, err);
    throw new Error(message);
  }
}
