const DEFAULT_OSRM_BASE_URL = 'https://router.project-osrm.org';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const OSRM_BASE_URL = trimTrailingSlash(
  process.env.EXPO_PUBLIC_OSRM_BASE_URL || DEFAULT_OSRM_BASE_URL
);

export const isUsingDefaultOsrmBaseUrl = OSRM_BASE_URL === DEFAULT_OSRM_BASE_URL;

if (!__DEV__ && isUsingDefaultOsrmBaseUrl) {
  console.warn('OSRM base URL is using default public endpoint. Set EXPO_PUBLIC_OSRM_BASE_URL for production.');
}

export const buildOsrmRouteUrl = (
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number },
  options: { overview?: 'false' | 'full'; geometries?: 'geojson' | 'polyline' } = {}
) => {
  const overview = options.overview ?? 'full';
  const geometries = options.geometries;
  const queryParts = [`overview=${overview}`];

  if (geometries) {
    queryParts.push(`geometries=${geometries}`);
  }

  return `${OSRM_BASE_URL}/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?${queryParts.join('&')}`;
};