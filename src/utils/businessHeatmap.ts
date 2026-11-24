export type HeatmapLocation = {
  latitude: number;
  longitude: number;
};

export type HeatmapFeature = {
  name: string;
  code?: string;
  continent?: string;
  adminLevel?: string;
  geometry: Geometry;
};

export type CountedHeatmapFeature = HeatmapFeature & { count: number };
export type HeatmapCluster = HeatmapLocation & { count: number };

type Position = [number, number, ...number[]];
type PolygonCoordinates = Position[][];
type Geometry = {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: PolygonCoordinates | PolygonCoordinates[];
};
type GeoJsonFeature = {
  properties: Record<string, string>;
  geometry: Geometry;
};
type GeoJsonFeatureCollection = { features: GeoJsonFeature[] };
type MapBounds = {
  minLongitude: number;
  maxLongitude: number;
  minLatitude: number;
  maxLatitude: number;
};

const geometryBoundsCache = new WeakMap<Geometry, MapBounds>();

const worldData = require('../../assets/geo/worldCountries.json') as GeoJsonFeatureCollection;
const admin1Data = require('../../assets/geo/naturalEarthAdmin1.json') as GeoJsonFeatureCollection;
const countyData = require('../../assets/geo/kenyaCounties.json') as GeoJsonFeatureCollection;
const subcountyData = require('../../assets/geo/kenyaSubcounties.json') as GeoJsonFeatureCollection;

const worldFeatures: HeatmapFeature[] = worldData.features.map(feature => ({
  name: feature.properties.ADMIN,
  code: feature.properties.ADM0_A3,
  continent: feature.properties.CONTINENT,
  geometry: feature.geometry,
}));

const globalAdmin1Features: HeatmapFeature[] = admin1Data.features.map(feature => ({
  name: feature.properties.name,
  code: feature.properties.adm0_a3,
  adminLevel: feature.properties.type_en || feature.properties.type || 'Region',
  geometry: feature.geometry,
}));

const kenyaCounties: HeatmapFeature[] = countyData.features.map(feature => ({
  name: feature.properties.shapeName,
  code: 'KEN',
  adminLevel: 'County',
  geometry: feature.geometry,
}));

const kenyaSubcounties: HeatmapFeature[] = subcountyData.features.map(feature => ({
  name: feature.properties.shapeName,
  code: 'KEN',
  adminLevel: 'Sub-county',
  geometry: feature.geometry,
}));

const getPolygons = (geometry: Geometry): PolygonCoordinates[] =>
  geometry.type === 'Polygon'
    ? [geometry.coordinates as PolygonCoordinates]
    : geometry.coordinates as PolygonCoordinates[];

const pointInRing = (longitude: number, latitude: number, ring: Position[]) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crosses = (yi > latitude) !== (yj > latitude)
      && longitude < ((xj - xi) * (latitude - yi)) / ((yj - yi) || Number.EPSILON) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
};

const getFeatureBounds = (feature: HeatmapFeature): MapBounds => {
  const cached = geometryBoundsCache.get(feature.geometry);
  if (cached) return cached;

  const bounds: MapBounds = {
    minLongitude: Infinity,
    maxLongitude: -Infinity,
    minLatitude: Infinity,
    maxLatitude: -Infinity,
  };
  for (const polygon of getPolygons(feature.geometry)) {
    for (const ring of polygon) {
      for (const [longitude, latitude] of ring) {
        bounds.minLongitude = Math.min(bounds.minLongitude, longitude);
        bounds.maxLongitude = Math.max(bounds.maxLongitude, longitude);
        bounds.minLatitude = Math.min(bounds.minLatitude, latitude);
        bounds.maxLatitude = Math.max(bounds.maxLatitude, latitude);
      }
    }
  }
  geometryBoundsCache.set(feature.geometry, bounds);
  return bounds;
};

const featureContainsPoint = (feature: HeatmapFeature, longitude: number, latitude: number) => {
  const bounds = getFeatureBounds(feature);
  if (
    longitude < bounds.minLongitude
    || longitude > bounds.maxLongitude
    || latitude < bounds.minLatitude
    || latitude > bounds.maxLatitude
  ) return false;
  return getPolygons(feature.geometry).some(polygon =>
    pointInRing(longitude, latitude, polygon[0])
    && !polygon.slice(1).some(hole => pointInRing(longitude, latitude, hole))
  );
};

const distanceToFeature = (feature: HeatmapFeature, longitude: number, latitude: number) => {
  const longitudeScale = Math.cos((latitude * Math.PI) / 180);
  const x = longitude * longitudeScale;
  let minimumDistance = Infinity;
  for (const polygon of getPolygons(feature.geometry)) {
    for (const ring of polygon) {
      for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
        const [startLongitude, startLatitude] = ring[previous];
        const [endLongitude, endLatitude] = ring[index];
        const startX = startLongitude * longitudeScale;
        const endX = endLongitude * longitudeScale;
        const deltaX = endX - startX;
        const deltaY = endLatitude - startLatitude;
        const segmentLength = deltaX * deltaX + deltaY * deltaY;
        const proportion = segmentLength
          ? Math.max(0, Math.min(1, ((x - startX) * deltaX + (latitude - startLatitude) * deltaY) / segmentLength))
          : 0;
        const offsetX = x - (startX + proportion * deltaX);
        const offsetY = latitude - (startLatitude + proportion * deltaY);
        minimumDistance = Math.min(minimumDistance, offsetX * offsetX + offsetY * offsetY);
      }
    }
  }
  return minimumDistance;
};

const assignLocationsToFeatures = (
  features: HeatmapFeature[],
  locations: HeatmapLocation[],
  assignToNearest: boolean
) => {
  const assigned = features.map((): HeatmapLocation[] => []);
  for (const location of locations) {
    let index = features.findIndex(feature =>
      featureContainsPoint(feature, location.longitude, location.latitude)
    );
    if (index < 0 && assignToNearest && features.length) {
      // Simplified coastlines can leave valid city GPS points just outside their administrative polygon.
      let minimumDistance = Infinity;
      features.forEach((feature, featureIndex) => {
        const distance = distanceToFeature(feature, location.longitude, location.latitude);
        if (distance < minimumDistance) {
          minimumDistance = distance;
          index = featureIndex;
        }
      });
    }
    if (index >= 0) assigned[index].push(location);
  }
  return assigned;
};

const getGeometryBounds = (features: HeatmapFeature[]): MapBounds | undefined => {
  const bounds: MapBounds = {
    minLongitude: Infinity,
    maxLongitude: -Infinity,
    minLatitude: Infinity,
    maxLatitude: -Infinity,
  };
  for (const feature of features) {
    const featureBounds = getFeatureBounds(feature);
    bounds.minLongitude = Math.min(bounds.minLongitude, featureBounds.minLongitude);
    bounds.maxLongitude = Math.max(bounds.maxLongitude, featureBounds.maxLongitude);
    bounds.minLatitude = Math.min(bounds.minLatitude, featureBounds.minLatitude);
    bounds.maxLatitude = Math.max(bounds.maxLatitude, featureBounds.maxLatitude);
  }
  return Number.isFinite(bounds.minLongitude) ? bounds : undefined;
};

export const getCountryFeatures = () => worldFeatures;

export const getAdmin1Features = (countryCode: string) =>
  countryCode === 'KEN'
    ? kenyaCounties
    : globalAdmin1Features.filter(feature => feature.code === countryCode);

const getRingCentroid = (ring: Position[]): [number, number] => {
  let area = 0;
  let longitude = 0;
  let latitude = 0;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const [x1, y1] = ring[previous];
    const [x2, y2] = ring[index];
    const cross = x1 * y2 - x2 * y1;
    area += cross;
    longitude += (x1 + x2) * cross;
    latitude += (y1 + y2) * cross;
  }
  if (!area) return [ring[0][0], ring[0][1]];
  return [longitude / (3 * area), latitude / (3 * area)];
};

const getFeatureCentroid = (feature: HeatmapFeature): [number, number] => {
  const largestRing = getPolygons(feature.geometry)
    .map(polygon => polygon[0])
    .sort((a, b) => Math.abs(getRingArea(b)) - Math.abs(getRingArea(a)))[0];
  return getRingCentroid(largestRing);
};

const getRingArea = (ring: Position[]) => {
  let area = 0;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    area += ring[previous][0] * ring[index][1] - ring[index][0] * ring[previous][1];
  }
  return area / 2;
};

export const getAdmin2Features = (countryCode: string, parent: HeatmapFeature) => {
  if (countryCode !== 'KEN') return [];
  return kenyaSubcounties.filter(feature => {
    const [longitude, latitude] = getFeatureCentroid(feature);
    return featureContainsPoint(parent, longitude, latitude);
  });
};

export const countLocationsByFeature = (
  features: HeatmapFeature[],
  locations: HeatmapLocation[],
  assignToNearest = false
): CountedHeatmapFeature[] => {
  const assigned = assignLocationsToFeatures(features, locations, assignToNearest);
  return features.map((feature, index) => ({ ...feature, count: assigned[index].length }));
};

export const locationsWithinFeature = (
  feature: HeatmapFeature,
  locations: HeatmapLocation[]
) => locations.filter(location =>
  featureContainsPoint(feature, location.longitude, location.latitude)
);

export const locationsAssignedToFeature = (
  features: HeatmapFeature[],
  selectedFeature: HeatmapFeature,
  locations: HeatmapLocation[]
) => {
  const selectedIndex = features.findIndex(feature => feature.geometry === selectedFeature.geometry);
  if (selectedIndex < 0) return [];
  return assignLocationsToFeatures(features, locations, true)[selectedIndex];
};

export const clusterLocations = (
  locations: HeatmapLocation[],
  level: 'world' | 'continent' | 'country' | 'admin1' | 'admin2'
): HeatmapCluster[] => {
  const precision = level === 'world' ? 0 : level === 'continent' ? 1 : level === 'country' ? 2 : 3;
  const clusters = new Map<string, HeatmapCluster>();
  for (const location of locations) {
    const latitude = Number(location.latitude.toFixed(precision));
    const longitude = Number(location.longitude.toFixed(precision));
    const key = `${latitude},${longitude}`;
    const cluster = clusters.get(key);
    if (cluster) cluster.count += 1;
    else clusters.set(key, { latitude, longitude, count: 1 });
  }
  return Array.from(clusters.values());
};

export const getMapBounds = (
  features: HeatmapFeature[],
  locations: HeatmapLocation[],
  worldView = false
): MapBounds => {
  if (worldView) {
    return { minLongitude: -180, maxLongitude: 180, minLatitude: -85, maxLatitude: 85 };
  }

  const bounds = getGeometryBounds(features) || {
    minLongitude: Infinity,
    maxLongitude: -Infinity,
    minLatitude: Infinity,
    maxLatitude: -Infinity,
  };
  for (const location of locations) {
    bounds.minLongitude = Math.min(bounds.minLongitude, location.longitude);
    bounds.maxLongitude = Math.max(bounds.maxLongitude, location.longitude);
    bounds.minLatitude = Math.min(bounds.minLatitude, location.latitude);
    bounds.maxLatitude = Math.max(bounds.maxLatitude, location.latitude);
  }
  if (!Number.isFinite(bounds.minLongitude)) {
    return { minLongitude: -180, maxLongitude: 180, minLatitude: -85, maxLatitude: 85 };
  }

  const longitudePadding = Math.max((bounds.maxLongitude - bounds.minLongitude) * 0.06, 0.15);
  const latitudePadding = Math.max((bounds.maxLatitude - bounds.minLatitude) * 0.06, 0.15);
  return {
    minLongitude: bounds.minLongitude - longitudePadding,
    maxLongitude: bounds.maxLongitude + longitudePadding,
    minLatitude: bounds.minLatitude - latitudePadding,
    maxLatitude: bounds.maxLatitude + latitudePadding,
  };
};

export const getGeometryPolygons = (geometry: Geometry): PolygonCoordinates[] => getPolygons(geometry);
