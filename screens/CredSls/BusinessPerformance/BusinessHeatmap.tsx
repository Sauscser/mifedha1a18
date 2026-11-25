import React, { useMemo, useRef, useState } from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Polygon } from 'react-native-svg';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import {
  countLocationsByFeature,
  getAdmin1Features,
  getAdmin2Features,
  getCountryFeatures,
  getGeometryPolygons,
  getMapBounds,
  HeatmapFeature,
  HeatmapLocation,
  locationsAssignedToFeature,
  locationsWithinFeature,
} from '../../../src/utils/businessHeatmap';
import { useBusinessPerformanceTranslation } from './translation';

type Props = {
  locations: HeatmapLocation[];
};

const MAP_HEIGHT = 240;
const MAP_WIDTH = Math.min(Dimensions.get('window').width - 36, 720);
const continentOrder = [
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'Oceania',
  'South America',
  'Antarctica',
];
const continentColors: Record<string, string> = {
  Africa: '#d9a441',
  Asia: '#6f9f73',
  Europe: '#6d91bd',
  'North America': '#c77a70',
  Oceania: '#9a82b5',
  'South America': '#61a6a0',
  Antarctica: '#aab8c2',
};

const BusinessHeatmap = ({ locations }: Props) => {
  const t = useBusinessPerformanceTranslation();
  const [continent, setContinent] = useState<string>();
  const [country, setCountry] = useState<HeatmapFeature>();
  const [admin1, setAdmin1] = useState<HeatmapFeature>();
  const [admin2, setAdmin2] = useState<HeatmapFeature>();
  const [zoom, setZoom] = useState(1);
  const pinchStartZoom = useRef(1);

  const validLocations = useMemo(
    () => locations.filter(({ latitude, longitude }) =>
      Number.isFinite(latitude)
      && Number.isFinite(longitude)
      && latitude >= -90
      && latitude <= 90
      && longitude >= -180
      && longitude <= 180
    ),
    [locations]
  );
  const allCountries = useMemo(() => getCountryFeatures(), []);
  const countedCountries = useMemo(
    () => countLocationsByFeature(allCountries, validLocations),
    [allCountries, validLocations]
  );
  const availableContinents = useMemo(
    () => continentOrder.filter(option =>
      allCountries.some(feature => feature.continent === option)
    ),
    [allCountries]
  );

  const countriesInView = useMemo(
    () => countedCountries.filter(feature =>
      !continent || feature.continent === continent
    ),
    [countedCountries, continent]
  );
  const countryLocations = useMemo(
    () => country ? locationsWithinFeature(country, validLocations) : [],
    [country, validLocations]
  );
  const countryAdmin1Features = useMemo(
    () => country ? getAdmin1Features(country.code || '') : [],
    [country]
  );
  const countryAdmin1 = useMemo(
    () => countLocationsByFeature(countryAdmin1Features, countryLocations, true),
    [countryAdmin1Features, countryLocations]
  );
  const admin1Locations = useMemo(
    () => admin1
      ? locationsAssignedToFeature(countryAdmin1Features, admin1, countryLocations)
      : [],
    [admin1, countryAdmin1Features, countryLocations]
  );
  const admin2Features = useMemo(
    () => admin1 && country ? getAdmin2Features(country.code || '', admin1) : [],
    [admin1, country]
  );
  const admin1Children = useMemo(
    () => countLocationsByFeature(admin2Features, admin1Locations, true),
    [admin1Locations, admin2Features]
  );
  const admin2Locations = useMemo(
    () => admin2
      ? locationsAssignedToFeature(admin2Features, admin2, admin1Locations)
      : [],
    [admin2, admin1Locations, admin2Features]
  );

  const childFeatures = admin1
    ? admin1Children
    : country
      ? countryAdmin1
      : countriesInView;
  const displayedFeatures = admin2
    ? [{ ...admin2, count: admin2Locations.length }]
    : admin1
      ? (admin1Children.length ? admin1Children : [{ ...admin1, count: admin1Locations.length }])
      : country
        ? (countryAdmin1.length ? countryAdmin1 : [{ ...country, count: countryLocations.length }])
        : continent
          ? countriesInView
          : countedCountries;
  const visibleLocations = admin2
    ? admin2Locations
    : admin1
      ? admin1Locations
      : country
        ? countryLocations
        : continent
          ? countriesInView.flatMap(feature => locationsWithinFeature(feature, validLocations))
          : validLocations;
  const bounds = useMemo(
    () => getMapBounds(displayedFeatures, visibleLocations, !continent && !country),
    [displayedFeatures, visibleLocations, continent, country]
  );
  const mapWidth = MAP_WIDTH * zoom;
  const mapHeight = MAP_HEIGHT * zoom;
  const visibleLocationCount = visibleLocations.length;
  const updateZoom = (value: number) => {
    const nextZoom = Math.min(3, Math.max(1, value));
    pinchStartZoom.current = nextZoom;
    setZoom(nextZoom);
  };
  const handlePinch = (event: { nativeEvent: { scale: number } }) => {
    setZoom(Math.min(3, Math.max(1, pinchStartZoom.current * event.nativeEvent.scale)));
  };
  const handlePinchStateChange = (event: { nativeEvent: { state: number } }) => {
    if (event.nativeEvent.state === State.BEGAN) {
      pinchStartZoom.current = zoom;
    }
  };
  const localizedContinent = (value: string) => {
    const keys: Record<string, 'africa' | 'asia' | 'europe' | 'northAmerica' | 'southAmerica' | 'oceania' | 'antarctica'> = {
      Africa: 'africa',
      Asia: 'asia',
      Europe: 'europe',
      'North America': 'northAmerica',
      'South America': 'southAmerica',
      Oceania: 'oceania',
      Antarctica: 'antarctica',
    };
    const key = keys[value];
    return key ? t(key) : value;
  };
  const localizedBoundary = (label?: string) => {
    const normalized = label?.toLowerCase() || '';
    if (normalized.includes('sub-county')) return t('subcountyLabel');
    if (normalized.includes('county')) return t('countyLabel');
    if (normalized.includes('state')) return t('stateLabel');
    if (normalized.includes('province')) return t('provinceLabel');
    if (normalized.includes('territory')) return t('territoryLabel');
    if (normalized.includes('district')) return t('districtLabel');
    if (normalized.includes('municipality')) return t('municipalityLabel');
    if (normalized.includes('region')) return t('regionLabel');
    return t('regionLabel');
  };

  const project = (longitude: number, latitude: number) => ({
    x: ((longitude - bounds.minLongitude) / (bounds.maxLongitude - bounds.minLongitude)) * mapWidth,
    y: mapHeight - ((latitude - bounds.minLatitude) / (bounds.maxLatitude - bounds.minLatitude)) * mapHeight,
  });

  const reset = () => {
    setContinent(undefined);
    setCountry(undefined);
    setAdmin1(undefined);
    setAdmin2(undefined);
  };
  const selectContinent = (value: string) => {
    setContinent(value);
    setCountry(undefined);
    setAdmin1(undefined);
    setAdmin2(undefined);
  };
  const selectCountry = (value: HeatmapFeature) => {
    setContinent(value.continent);
    setCountry(value);
    setAdmin1(undefined);
    setAdmin2(undefined);
  };
  const selectAdmin1 = (value: HeatmapFeature) => {
    setAdmin1(value);
    setAdmin2(undefined);
  };
  const selectFeature = (feature: HeatmapFeature) => {
    if (!continent) {
      if (feature.continent && availableContinents.includes(feature.continent)) {
        selectContinent(feature.continent);
      }
    } else if (!country) selectCountry(feature);
    else if (!admin1 && countryAdmin1.length) selectAdmin1(feature);
    else if (admin1 && admin1Children.length) setAdmin2(feature);
  };

  const contextLabel = admin2
    ? `${localizedBoundary(admin2.adminLevel)}: ${admin2.name}`
    : admin1
      ? `${localizedBoundary(admin1.adminLevel)}: ${admin1.name}`
      : country
        ? `${t('countryLabel')}: ${country.name}`
        : continent
          ? `${t('continentLabel')}: ${localizedContinent(continent)}`
          : t('world');
  const nextLevelLabel = admin1
    ? localizedBoundary(admin1Children[0]?.adminLevel || 'Sub-region')
    : country
      ? localizedBoundary(countryAdmin1[0]?.adminLevel || 'Region')
      : t('countryLabel');
  const levelDescription = admin2
    ? t('selectedArea')
    : admin1
      ? admin1Children.length ? `${nextLevelLabel} ${t('regionsWithLocations')}` : t('noFinerBoundaries')
      : country
        ? countryAdmin1.length ? `${nextLevelLabel} ${t('regionsWithLocations')}` : t('noRegionalBoundaries')
        : continent
          ? t('countriesWithLocations')
          : t('countriesWithLocations');
  return (
    <View style={{ marginTop: 18, padding: 14, borderRadius: 12, backgroundColor: '#f8fafb' }}>
      <Text style={{ fontWeight: '800', color: '#243a4a', fontSize: 16 }}>{t('customerHeatmap')}</Text>
      <Text style={{ color: '#63727d', fontSize: 12, marginTop: 5 }}>
        {t('locationPrivacy')}
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={reset}
          style={{
            backgroundColor: !continent ? '#1678b9' : '#e8eef2',
            paddingVertical: 7,
            paddingHorizontal: 10,
            borderRadius: 16,
            marginRight: 6,
          }}
        >
          <Text style={{ color: !continent ? '#fff' : '#344955', fontSize: 11, fontWeight: '700' }}>
            {t('allLocations')}
          </Text>
        </TouchableOpacity>
        {availableContinents.map(option => (
          <TouchableOpacity
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: continent === option }}
            onPress={() => selectContinent(option)}
            style={{
              backgroundColor: continent === option ? '#1678b9' : '#e8eef2',
              paddingVertical: 7,
              paddingHorizontal: 10,
              borderRadius: 16,
              marginRight: 6,
            }}
          >
            <Text style={{ color: continent === option ? '#fff' : '#344955', fontSize: 11, fontWeight: '700' }}>
              {localizedContinent(option)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
        <TouchableOpacity onPress={reset} accessibilityRole="button">
          <Text style={{ color: '#1678b9', fontSize: 12, fontWeight: '700' }}>{t('world')}</Text>
        </TouchableOpacity>
        {continent && (
          <Text style={{ color: '#63727d', fontSize: 12 }}>  ›  {localizedContinent(continent)}</Text>
        )}
        {country && (
          <>
            <Text style={{ color: '#63727d', fontSize: 12 }}>  ›  </Text>
            <TouchableOpacity onPress={() => { setAdmin1(undefined); setAdmin2(undefined); }} accessibilityRole="button">
              <Text style={{ color: admin1 ? '#1678b9' : '#344955', fontSize: 12, fontWeight: '700' }}>
                {country.name}
              </Text>
            </TouchableOpacity>
          </>
        )}
        {admin1 && (
          <>
            <Text style={{ color: '#63727d', fontSize: 12 }}>  ›  </Text>
            <TouchableOpacity onPress={() => setAdmin2(undefined)} accessibilityRole="button">
              <Text style={{ color: admin2 ? '#1678b9' : '#344955', fontSize: 12, fontWeight: '700' }}>
                {admin1.name}
              </Text>
            </TouchableOpacity>
          </>
        )}
        {admin2 && <Text style={{ color: '#344955', fontSize: 12 }}>  ›  {admin2.name}</Text>}
      </ScrollView>

      {childFeatures.length > 0 && !admin2 && (country || continent) && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 9 }}>
          {childFeatures.map(feature => (
            <TouchableOpacity
              key={`${feature.code}-${feature.name}`}
              accessibilityRole="button"
              onPress={() => selectFeature(feature)}
              style={{
                backgroundColor: '#fff',
                borderColor: '#d8e1e6',
                borderWidth: 1,
                paddingVertical: 6,
                paddingHorizontal: 9,
                borderRadius: 14,
                marginRight: 6,
              }}
            >
              <Text style={{ color: '#344955', fontSize: 11, fontWeight: '600' }}>
                {feature.name} · {feature.count}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Text style={{ color: '#63727d', fontSize: 11, marginTop: 10 }}>
        {contextLabel} · {levelDescription}. {t('tapToFocus')}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
        {[
          { type: 'REVENUE', label: t('revenue'), color: '#14804a' },
          { type: 'EXPENSE', label: t('expenses'), color: '#c46919' },
        ].map(item => (
          <View key={item.type} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color, marginRight: 4 }} />
            <Text style={{ color: '#53636e', fontSize: 11 }}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 8 }}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Zoom out"
          accessibilityState={{ disabled: zoom <= 1 }}
          disabled={zoom <= 1}
          onPress={() => updateZoom(zoom - 0.5)}
          style={{
            width: 36,
            height: 34,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 7,
            backgroundColor: zoom <= 1 ? '#e8eef2' : '#1678b9',
            marginRight: 6,
          }}
        >
          <Text style={{ color: zoom <= 1 ? '#87949c' : '#fff', fontSize: 20, fontWeight: '700' }}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Reset map zoom"
          onPress={() => updateZoom(1)}
          style={{ paddingHorizontal: 9, paddingVertical: 8, marginRight: 6 }}
        >
          <Text style={{ color: '#53636e', fontSize: 11, fontWeight: '700' }}>{Math.round(zoom * 100)}%</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Zoom in"
          accessibilityState={{ disabled: zoom >= 3 }}
          disabled={zoom >= 3}
          onPress={() => updateZoom(zoom + 0.5)}
          style={{
            width: 36,
            height: 34,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 7,
            backgroundColor: zoom >= 3 ? '#e8eef2' : '#1678b9',
          }}
        >
          <Text style={{ color: zoom >= 3 ? '#87949c' : '#fff', fontSize: 20, fontWeight: '700' }}>+</Text>
        </TouchableOpacity>
      </View>

      <PinchGestureHandler
        onGestureEvent={handlePinch}
        onHandlerStateChange={handlePinchStateChange}
        minPointers={2}
        maxPointers={2}
      >
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator style={{ marginTop: 8 }}>
            <Svg width={mapWidth} height={mapHeight} viewBox={`0 0 ${mapWidth} ${mapHeight}`}>
          {displayedFeatures.flatMap((feature, featureIndex) =>
            getGeometryPolygons(feature.geometry).map((polygon, polygonIndex) => {
              const outerRing = polygon[0];
              if (!outerRing || outerRing.length < 3) return null;
              const points = outerRing.map(([longitude, latitude]) => {
                const point = project(longitude, latitude);
                return `${point.x},${point.y}`;
              }).join(' ');
              return (
                <Polygon
                  key={`${feature.name}-${featureIndex}-${polygonIndex}`}
                  points={points}
                  fill={!continent && !country
                    ? continentColors[feature.continent || ''] || '#d5dde2'
                    : '#f2f5f7'}
                  stroke={!continent && !country ? '#fff' : '#a9b7c0'}
                  strokeWidth={0.65 * zoom}
                  onPress={() => selectFeature(feature)}
                  accessibilityLabel={`${feature.name}, ${t('purchasesWithLocation', { count: feature.count })}`}
                />
              );
            })
          )}
          {visibleLocations.map((location, index) => {
            const point = project(location.longitude, location.latitude);
            const color = location.recordType === 'EXPENSE' ? '#c46919' : '#14804a';
            return (
              <Circle
                key={`${location.latitude},${location.longitude},${location.recordType || 'REVENUE'},${index}`}
                cx={point.x}
                cy={point.y}
                r={3.5 * zoom}
                fill={color}
              />
            );
          })}
            </Svg>
          </ScrollView>
        </View>
      </PinchGestureHandler>

      <Text style={{ color: '#53636e', fontSize: 12, marginTop: 7 }}>
        {t('purchasesWithLocation', { count: visibleLocationCount })}
      </Text>
      {displayedFeatures.length === 0 ? (
        <Text style={{ color: '#63727d', fontSize: 12, marginTop: 8 }}>
          {t('noBuyerLocations')}
        </Text>
      ) : null}
      <Text style={{ color: '#74818a', fontSize: 10, marginTop: 10 }}>
        {t('boundaryData')}
      </Text>
    </View>
  );
};

export default BusinessHeatmap;
