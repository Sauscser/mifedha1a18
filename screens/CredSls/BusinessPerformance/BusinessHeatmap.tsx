import React, { useMemo, useState } from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Polygon, Text as SvgText } from 'react-native-svg';
import {
  clusterLocations,
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

const heatColor = (count: number, maxCount: number) => {
  if (!count) return '#e8eef2';
  const intensity = count / maxCount;
  if (intensity >= 0.7) return '#a83220';
  if (intensity >= 0.4) return '#d45a2d';
  if (intensity >= 0.15) return '#ef9a43';
  return '#f6c978';
};

const BusinessHeatmap = ({ locations }: Props) => {
  const t = useBusinessPerformanceTranslation();
  const [continent, setContinent] = useState<string>();
  const [country, setCountry] = useState<HeatmapFeature>();
  const [admin1, setAdmin1] = useState<HeatmapFeature>();
  const [admin2, setAdmin2] = useState<HeatmapFeature>();

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
      countedCountries.some(feature => feature.count > 0 && feature.continent === option)
    ),
    [countedCountries]
  );

  const countriesInView = useMemo(
    () => countedCountries.filter(feature =>
      feature.count > 0 && (!continent || feature.continent === continent)
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
    () => countLocationsByFeature(countryAdmin1Features, countryLocations, true)
      .filter(feature => feature.count > 0),
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
    () => countLocationsByFeature(admin2Features, admin1Locations, true)
      .filter(feature => feature.count > 0),
    [admin1Locations, admin2Features]
  );
  const admin2Locations = useMemo(
    () => admin2
      ? locationsAssignedToFeature(admin2Features, admin2, admin1Locations)
      : [],
    [admin2, admin1Locations, admin2Features]
  );

  const level = admin2 ? 'admin2' : admin1 ? 'admin1' : country ? 'country' : continent ? 'continent' : 'world';
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
        : countriesInView;
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
  const clusters = useMemo(
    () => clusterLocations(visibleLocations, level),
    [visibleLocations, level]
  );
  const visibleLocationCount = clusters.reduce((total, cluster) => total + cluster.count, 0);
  const maxCount = Math.max(1, ...displayedFeatures.map(feature => feature.count));
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
    x: ((longitude - bounds.minLongitude) / (bounds.maxLongitude - bounds.minLongitude)) * MAP_WIDTH,
    y: MAP_HEIGHT - ((latitude - bounds.minLatitude) / (bounds.maxLatitude - bounds.minLatitude)) * MAP_HEIGHT,
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
    if (!country) selectCountry(feature);
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

      <ScrollView horizontal showsHorizontalScrollIndicator style={{ marginTop: 8 }}>
        <Svg width={MAP_WIDTH} height={MAP_HEIGHT} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}>
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
                  fill={heatColor(feature.count, maxCount)}
                  stroke="#748896"
                  strokeWidth={0.55}
                  onPress={() => selectFeature(feature)}
                  accessibilityLabel={`${feature.name}, ${t('purchasesWithLocation', { count: feature.count })}`}
                />
              );
            })
          )}
          {clusters.map(cluster => {
            const point = project(cluster.longitude, cluster.latitude);
            const radius = Math.min(7, 2.5 + Math.sqrt(cluster.count));
            return (
              <React.Fragment key={`${cluster.latitude}-${cluster.longitude}`}>
                <Circle cx={point.x} cy={point.y} r={radius + 2} fill="#b42318" opacity={0.18} />
                <Circle cx={point.x} cy={point.y} r={radius} fill="#b42318" opacity={0.78} />
                {cluster.count > 1 && (
                  <SvgText
                    x={point.x}
                    y={point.y + 3}
                    fill="#fff"
                    fontSize="8"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {cluster.count}
                  </SvgText>
                )}
              </React.Fragment>
            );
          })}
        </Svg>
      </ScrollView>

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
