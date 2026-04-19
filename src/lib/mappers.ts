const IMAGE_BASE = 'https://cdn.plateful.uk/images/places/';

const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export interface RawVenue {
  id: number;
  name?: string;
  description?: string | null;
  address?: string | null;
  post_code?: string | null;
  postal_code?: string | null;
  city?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  phone?: string | null;
  website?: string | null;
  booking_url?: string | null;
  image_path?: string | null;
  image?: string | null;
  tags?: Array<{ id: number; name: string } | string> | null;
  categories?: Array<{ id: number; name: string } | string> | null;
  opening_times?: Array<RawOpeningTime> | null;
  [key: string]: unknown;
}

export interface RawOpeningTime {
  week_day?: number;
  weekday?: number;
  day?: number;
  open?: string | null;
  close?: string | null;
  is_closed?: boolean;
}

export interface MappedVenue {
  id: number;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  image_url: string | null;
  categories: string[];
}

export interface MappedVenueDetail extends MappedVenue {
  postal_code: string | null;
  booking_url: string | null;
  opening_hours: Array<{
    day: string;
    week_day: number;
    open: string | null;
    close: string | null;
  }>;
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildImageUrl(raw: Pick<RawVenue, 'image_path' | 'image'>): string | null {
  const path = raw.image_path ?? raw.image ?? null;
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${IMAGE_BASE}${path.replace(/^\/+/, '')}`;
}

function extractCategoryNames(raw: RawVenue): string[] {
  const source = raw.tags ?? raw.categories ?? [];
  if (!Array.isArray(source)) return [];
  return source
    .map((item) => (typeof item === 'string' ? item : item?.name))
    .filter((name): name is string => typeof name === 'string' && name.length > 0);
}

export function mapVenueSummary(raw: RawVenue): MappedVenue {
  return {
    id: raw.id,
    name: raw.name ?? '',
    description: raw.description ?? null,
    address: raw.address ?? null,
    city: raw.city ?? null,
    latitude: toNumberOrNull(raw.latitude),
    longitude: toNumberOrNull(raw.longitude),
    phone: raw.phone ?? null,
    website: raw.website ?? null,
    image_url: buildImageUrl(raw),
    categories: extractCategoryNames(raw),
  };
}

export function mapVenueDetail(raw: RawVenue): MappedVenueDetail {
  const summary = mapVenueSummary(raw);
  const openingSource = Array.isArray(raw.opening_times) ? raw.opening_times : [];

  const opening_hours = openingSource.map((slot) => {
    const weekDay =
      typeof slot.week_day === 'number'
        ? slot.week_day
        : typeof slot.weekday === 'number'
          ? slot.weekday
          : typeof slot.day === 'number'
            ? slot.day
            : 0;
    const safeIndex = Math.max(0, Math.min(6, weekDay));
    return {
      day: DAY_NAMES[safeIndex],
      week_day: weekDay,
      open: slot.is_closed ? null : slot.open ?? null,
      close: slot.is_closed ? null : slot.close ?? null,
    };
  });

  return {
    ...summary,
    postal_code: raw.postal_code ?? raw.post_code ?? null,
    booking_url: raw.booking_url ?? null,
    opening_hours,
  };
}

export function mapVenueList(raws: RawVenue[] | undefined | null): MappedVenue[] {
  if (!Array.isArray(raws)) return [];
  return raws.map(mapVenueSummary);
}
