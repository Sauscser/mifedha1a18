import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { generateClient } from 'aws-amplify/api';
import { fetchUserAttributes, getCurrentUser } from 'aws-amplify/auth';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { useExchange } from '../../../src/contexts/ExchangeContext';
import {
  BASE_EXCHANGE_SYMBOL,
  convertForeignToChf,
  countryToCurrency,
  formatAmountSync,
  getExRatesForNationality,
} from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import {
  createBusinessOrganization,
  createBusinessPerformanceRecord,
  updateBiznaOrganization,
} from '../../../src/graphql/mutations';
import {
  businessOrganizationsByCreator,
  biznasByCreatorEmail,
  getBusinessOrganization,
  listBiznas,
  listBusinessPerformanceRecords,
} from '../../../src/graphql/queries';
import BusinessHeatmap from './BusinessHeatmap';
import BusinessTargets from './BusinessTargets';
import { useBusinessPerformanceTranslation } from './translation';

const client = generateClient();
const DAY_MS = 24 * 60 * 60 * 1000;

const normalizeRateKey = (value: string) => value.trim().toUpperCase();

const resolveRateKey = (
  nationality: string | null,
  ratesMap: Record<string, any> | null
): string | undefined => {
  if (!nationality || !ratesMap) return undefined;
  const trimmed = nationality.trim();
  const countryCode = nationalityToCode(trimmed)
    || (trimmed.length === 2 ? trimmed.toUpperCase() : undefined);
  const currencyIso = countryCode ? countryToCurrency[countryCode] : undefined;
  const candidates = [trimmed, trimmed.toUpperCase(), countryCode, currencyIso].filter(Boolean) as string[];
  for (const candidate of candidates) {
    if (ratesMap[candidate]) return candidate;
  }
  const normalizedRates = Object.keys(ratesMap).reduce<Record<string, string>>((result, key) => {
    result[normalizeRateKey(key)] = key;
    return result;
  }, {});
  return candidates
    .map(candidate => normalizedRates[normalizeRateKey(candidate)])
    .find(Boolean);
};

type Business = {
  BusKntct: string;
  busName: string;
  email?: string;
  organizationId?: string | null;
  Nationality?: string;
  [adminField: `Admin${number}`]: string;
};

type BusinessOrganization = {
  id: string;
  name: string;
  createdByEmail: string;
  branches: Business[];
};

type PerformanceRecord = {
  id: string;
  ownerSub: string;
  businessAccount: string;
  recordType: string;
  amountKes: number;
  feesKes?: number | null;
  occurredAt: string;
  source: string;
  itemName?: string | null;
  category?: string | null;
  quantity?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const asDayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

type ChartBucket = {
  label: string;
  revenue: number;
  expenses: number;
};

type ChartMetric = 'revenue' | 'expenses' | 'profit';
type ChartSelection = 'all' | ChartMetric;

const chartMetrics: Array<{ key: ChartMetric; color: string }> = [
  { key: 'revenue', color: '#14804a' },
  { key: 'expenses', color: '#c46919' },
  { key: 'profit', color: '#1769aa' },
];

const getMetricValue = (bucket: ChartBucket, metric: ChartMetric) =>
  metric === 'profit' ? bucket.revenue - bucket.expenses : bucket[metric];

const ChartMetricSelector = ({
  selected,
  onSelect,
}: {
  selected: ChartSelection;
  onSelect: (selection: ChartSelection) => void;
}) => {
  const t = useBusinessPerformanceTranslation();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 9, marginBottom: 8 }}>
      {[
        { key: 'all' as const, label: t('all') },
        ...chartMetrics.map(metric => ({ key: metric.key, label: t(metric.key) })),
      ].map(option => (
        <TouchableOpacity
          key={option.key}
          accessibilityRole="button"
          accessibilityState={{ selected: selected === option.key }}
          onPress={() => onSelect(option.key)}
          style={{
            backgroundColor: selected === option.key ? '#1678b9' : '#e8eef2',
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 15,
            marginRight: 6,
          }}
        >
          <Text style={{ color: selected === option.key ? '#fff' : '#344955', fontSize: 11, fontWeight: '700' }}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const getVisibleMetrics = (selection: ChartSelection) =>
  selection === 'all' ? chartMetrics : chartMetrics.filter(metric => metric.key === selection);

const BusinessPerformanceBarChart = ({ buckets }: { buckets: ChartBucket[] }) => {
  const t = useBusinessPerformanceTranslation();
  const [selected, setSelected] = useState<ChartSelection>('all');
  if (!buckets.length) return null;

  const metrics = getVisibleMetrics(selected);
  const values = buckets.flatMap(bucket => metrics.map(metric => getMetricValue(bucket, metric.key)));
  const maximumMagnitude = Math.max(1, ...values.map(value => Math.abs(value)));
  const hasNegativeValues = values.some(value => value < 0);
  const chartHeight = 142;
  const chartTop = 12;
  const baseline = hasNegativeValues ? chartTop + chartHeight / 2 : chartTop + chartHeight;
  const positiveHeight = baseline - chartTop;
  const negativeHeight = chartTop + chartHeight - baseline;
  const barWidth = metrics.length === 1 ? 28 : 17;
  const groupWidth = Math.max(60, metrics.length * (barWidth + 4) + 10);
  const width = Math.max(360, buckets.length * (groupWidth + 9) + 12);
  const height = 190;
  const xFor = (bucketIndex: number, metricIndex: number) =>
    6 + bucketIndex * (groupWidth + 9) + 5 + metricIndex * (barWidth + 4);

  return (
    <View style={{ marginTop: 10 }}>
      <Text style={{ fontWeight: '800', color: '#243a4a', fontSize: 15 }}>{t('chartHeading')}</Text>
      <Text style={{ color: '#63727d', fontSize: 11, marginTop: 3 }}>
        {t('chartFilterHint')}
      </Text>
      <ChartMetricSelector selected={selected} onSelect={setSelected} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 7 }}>
        {metrics.map(metric => (
          <View key={metric.key} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: metric.color, marginRight: 4 }} />
            <Text style={{ color: '#53636e', fontSize: 11 }}>{t(metric.key)}</Text>
          </View>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <Svg width={width} height={height}>
          <Line x1={0} y1={baseline} x2={width} y2={baseline} stroke="#758795" strokeWidth={1.2} />
          {buckets.map((bucket, bucketIndex) => (
            <React.Fragment key={`${bucket.label}-${bucketIndex}`}>
              {metrics.map((metric, metricIndex) => {
                const value = getMetricValue(bucket, metric.key);
                const barHeight = value >= 0
                  ? (value / maximumMagnitude) * positiveHeight
                  : (-value / maximumMagnitude) * negativeHeight;
                const y = value >= 0 ? baseline - barHeight : baseline;
                return (
                  <Rect
                    key={metric.key}
                    x={xFor(bucketIndex, metricIndex)}
                    y={y}
                    width={barWidth}
                    height={Math.max(1, barHeight)}
                    fill={metric.color}
                    rx={3}
                  />
                );
              })}
              <SvgText
                x={6 + bucketIndex * (groupWidth + 9) + groupWidth / 2}
                y={height - 13}
                fill="#63727d"
                fontSize="10"
                textAnchor="middle"
              >
                {bucket.label}
              </SvgText>
            </React.Fragment>
          ))}
        </Svg>
      </ScrollView>
      <Text style={{ color: '#63727d', fontSize: 12, marginTop: 5 }}>
        {t('barDateHint')} {t('profitLossHint')}
      </Text>
    </View>
  );
};

const BusinessPerformanceTrendChart = ({
  buckets,
  currency,
  formatMoney,
}: {
  buckets: ChartBucket[];
  currency: string;
  formatMoney: (value: number) => string;
}) => {
  const t = useBusinessPerformanceTranslation();
  const [selected, setSelected] = useState<ChartSelection>('all');
  if (!buckets.length) return null;

  const series = getVisibleMetrics(selected).map(metric => ({
    ...metric,
    label: t(metric.key),
    values: buckets.map(bucket => getMetricValue(bucket, metric.key)),
  }));
  const width = Math.max(360, buckets.length * 72);
  const height = 250;
  const padding = { top: 18, right: 16, bottom: 52, left: 90 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const values = series.flatMap(item => item.values);
  const minimum = Math.min(0, ...values);
  const maximum = Math.max(1, ...values);
  const yFor = (value: number) =>
    padding.top + ((maximum - value) / (maximum - minimum || 1)) * chartHeight;
  const xFor = (index: number) =>
    padding.left + index * (chartWidth / Math.max(1, buckets.length - 1));
  const tickValues = Array.from({ length: 5 }, (_, index) =>
    maximum - ((maximum - minimum) * index) / 4
  );

  return (
    <View style={{ marginTop: 22 }}>
      <Text style={{ fontWeight: '800', color: '#243a4a', fontSize: 15 }}>{t('performanceTrend')}</Text>
      <Text style={{ color: '#63727d', fontSize: 11, marginTop: 3 }}>
        {t('chartFilterHint')}
      </Text>
      <ChartMetricSelector selected={selected} onSelect={setSelected} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginBottom: 8 }}>
        {series.map(item => (
          <View key={item.key} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 14, marginBottom: 4 }}>
            <View style={{ width: 15, height: 3, backgroundColor: item.color, marginRight: 5 }} />
            <Text style={{ color: '#53636e', fontSize: 12 }}>{item.label}</Text>
          </View>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <Svg width={width} height={height}>
          {tickValues.map((value, index) => {
            const y = yFor(value);
            return (
              <React.Fragment key={`tick-${index}`}>
                <Line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke={value === 0 ? '#758795' : '#e1e8ed'}
                  strokeWidth={value === 0 ? 1.2 : 1}
                />
                <SvgText
                  x={padding.left - 7}
                  y={y + 4}
                  fill="#63727d"
                  fontSize="10"
                  textAnchor="end"
                >
                  {formatMoney(value)}
                </SvgText>
              </React.Fragment>
            );
          })}
          <Line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={height - padding.bottom}
            stroke="#758795"
            strokeWidth={1}
          />
          {series.map(item => {
            const points = item.values.map((value, index) => `${xFor(index)},${yFor(value)}`).join(' ');
            return (
              <React.Fragment key={item.key}>
                <Polyline
                  points={points}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {item.values.map((value, index) => (
                  <Circle
                    key={`${item.key}-${index}`}
                    cx={xFor(index)}
                    cy={yFor(value)}
                    r={3.5}
                    fill={item.color}
                  />
                ))}
              </React.Fragment>
            );
          })}
          {buckets.map((bucket, index) => (
            <SvgText
              key={`date-${index}`}
              x={xFor(index)}
              y={height - padding.bottom + 18}
              fill="#63727d"
              fontSize="10"
              textAnchor="middle"
            >
              {bucket.label}
            </SvgText>
          ))}
          <SvgText
            x={padding.left + chartWidth / 2}
            y={height - 8}
            fill="#53636e"
            fontSize="11"
            textAnchor="middle"
          >
            Time
          </SvgText>
          <SvgText
            x={15}
            y={padding.top + chartHeight / 2}
            fill="#53636e"
            fontSize="11"
            textAnchor="middle"
            rotation="-90"
          >
            Amount ({currency})
          </SvgText>
        </Svg>
      </ScrollView>
      <Text style={{ color: '#63727d', fontSize: 12, marginTop: 4 }}>
        {t('axisAmounts')} ({currency}); {t('axisTime').toLowerCase()}.
      </Text>
    </View>
  );
};

const BusinessPerformanceScreen = () => {
  const t = useBusinessPerformanceTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { nationality, ratesMap } = useExchange();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [createdBusinesses, setCreatedBusinesses] = useState<Business[]>([]);
  const [businessLookupCount, setBusinessLookupCount] = useState(0);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [organizations, setOrganizations] = useState<BusinessOrganization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [recordsRefreshKey, setRecordsRefreshKey] = useState(0);
  const [ownerSub, setOwnerSub] = useState('');
  const [signedInEmail, setSignedInEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [entryVisible, setEntryVisible] = useState(false);
  const [recordType, setRecordType] = useState<'REVENUE' | 'EXPENSE'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [entryDate, setEntryDate] = useState(new Date());
  const [showEntryDatePicker, setShowEntryDatePicker] = useState(false);
  const [fromDate, setFromDate] = useState(startOfDay(new Date(Date.now() - 29 * DAY_MS)));
  const [toDate, setToDate] = useState(startOfDay(new Date()));
  const [datePickerTarget, setDatePickerTarget] = useState<'from' | 'to' | null>(null);
  const [organizationModalVisible, setOrganizationModalVisible] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationToExtend, setOrganizationToExtend] = useState<BusinessOrganization | null>(null);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [organizationSaving, setOrganizationSaving] = useState(false);
  const [fallbackRate, setFallbackRate] = useState<{ buyingPrice: number; symbol?: string } | null>(null);

  const rateKey = resolveRateKey(nationality, ratesMap);
  const fallbackNationalityCode = nationality ? nationalityToCode(nationality) : undefined;
  const fallbackCurrency = fallbackNationalityCode
    ? countryToCurrency[fallbackNationalityCode]
    : undefined;
  const displayCurrency = (rateKey && ratesMap?.[rateKey]?.symbol)
    || fallbackRate?.symbol
    || fallbackCurrency
    || BASE_EXCHANGE_SYMBOL;
  const entryCurrencyLabel = nationality
    ? displayCurrency
    : 'Currency unavailable';

  useEffect(() => {
    let active = true;
    const loadFallbackRate = async () => {
      if (!nationality || rateKey) {
        setFallbackRate(null);
        return;
      }
      const rate = await getExRatesForNationality(nationality);
      if (active && rate) {
        setFallbackRate({
          buyingPrice: Number(rate.buyingPrice || 1),
          symbol: rate.symbol,
        });
      }
    };
    loadFallbackRate().catch(error => {
      console.error('Failed to load the business analytics display currency rate:', error);
    });
    return () => {
      active = false;
    };
  }, [nationality, rateKey]);

  const formatMoney = (value: number) => {
    if (rateKey && ratesMap) return formatAmountSync(value, rateKey, ratesMap);
    if (fallbackRate) {
      return `${fallbackRate.symbol || displayCurrency} ${(value * fallbackRate.buyingPrice).toFixed(2)}`;
    }
    return `${BASE_EXCHANGE_SYMBOL} ${value.toFixed(2)}`;
  };

  const loadBusinessesAndRecords = useCallback(async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const signedInEmail = attributes.email?.trim();
      if (!signedInEmail) {
        throw new Error('The signed-in account does not have an email address.');
      }
      const normalizedEmail = signedInEmail.toLowerCase();
      setSignedInEmail(signedInEmail);
      setOwnerSub(user.userId);

      let allBusinesses: Business[] = [];
      let nextToken: string | null = null;
      do {
        const result: any = await client.graphql({
          query: listBiznas,
          variables: { limit: 500, nextToken },
        });
        const page = result?.data?.listBiznas;
        if (!page || !Array.isArray(page.items)) {
          throw new Error('The business admin lookup returned no business records.');
        }
        allBusinesses = allBusinesses.concat(page.items.filter((business: Business | null) => business?.BusKntct));
        nextToken = page.nextToken || null;
      } while (nextToken);

      const administeredBusinesses = allBusinesses.filter((business: any) =>
        Array.from({ length: 50 }, (_, index) => business[`Admin${index + 1}`])
          .some(adminEmail => typeof adminEmail === 'string' && adminEmail.trim().toLowerCase() === normalizedEmail)
      );
      setBusinessLookupCount(allBusinesses.length);
      let createdBusinessRows: Business[] = [];
      let createdBusinessToken: string | null = null;
      do {
        const result: any = await client.graphql({
          query: biznasByCreatorEmail,
          variables: { email: signedInEmail, limit: 500, nextToken: createdBusinessToken },
        });
        const page = result?.data?.biznasByCreatorEmail;
        if (!page || !Array.isArray(page.items)) {
          throw new Error('The creator business lookup returned no business records.');
        }
        createdBusinessRows = createdBusinessRows.concat(page.items.filter(Boolean));
        createdBusinessToken = page.nextToken || null;
      } while (createdBusinessToken);
      let ownedOrganizations: Array<{ id: string; name: string; createdByEmail: string }> = [];
      let organizationToken: string | null = null;
      do {
        const result: any = await client.graphql({
          query: businessOrganizationsByCreator,
          variables: { createdByEmail: signedInEmail, limit: 500, nextToken: organizationToken },
        });
        const page = result?.data?.businessOrganizationsByCreator;
        if (!page || !Array.isArray(page.items)) {
          throw new Error('The organization lookup returned no organization records.');
        }
        ownedOrganizations = ownedOrganizations.concat(page.items.filter(Boolean));
        organizationToken = page.nextToken || null;
      } while (organizationToken);

      const visibleOrganizationIds = Array.from(new Set([
        ...administeredBusinesses.map((business: Business) => business.organizationId).filter(Boolean),
        ...ownedOrganizations.map(organization => organization.id),
      ])) as string[];
      const ownedById = new Map(ownedOrganizations.map(organization => [organization.id, organization]));
      const organizationDetails = await Promise.all(visibleOrganizationIds.map(async id => {
        const ownedOrganization = ownedById.get(id);
        if (ownedOrganization) return ownedOrganization;
        const result: any = await client.graphql({ query: getBusinessOrganization, variables: { id } });
        const organization = result?.data?.getBusinessOrganization;
        if (!organization?.id) throw new Error(`Organization ${id} could not be loaded.`);
        return organization;
      }));
      const administeredIds = new Set(administeredBusinesses.map((business: Business) => business.BusKntct));
      const visibleOrganizations = organizationDetails
        .map(organization => ({
          ...organization,
          branches: allBusinesses.filter((business: Business) => business.organizationId === organization.id),
        }))
        .filter(organization =>
          organization.createdByEmail?.trim().toLowerCase() === normalizedEmail
          || organization.branches.some(branch => administeredIds.has(branch.BusKntct))
        );
      setBusinesses(administeredBusinesses);
      setCreatedBusinesses(createdBusinessRows);
      setOrganizations(visibleOrganizations);
      setSelectedOrganizationId(current =>
        visibleOrganizations.some(organization => organization.id === current) ? current : ''
      );
      setSelectedBusiness(current =>
        administeredBusinesses.find(business => business.BusKntct === current?.BusKntct)
        || administeredBusinesses[0]
        || null
      );
    } catch (error) {
      console.error('Failed to load business performance data:', error);
      Alert.alert(t('loadAnalyticsFailed'), t('tryAgain'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadBusinessesAndRecords();
  }, [loadBusinessesAndRecords]);

  useEffect(() => {
    const selectedOrganization = organizations.find(organization => organization.id === selectedOrganizationId);
    const accountIds = selectedOrganization
      ? selectedOrganization.branches.map(branch => branch.BusKntct)
      : selectedBusiness ? [selectedBusiness.BusKntct] : [];
    if (!accountIds.length) {
      setRecords([]);
      setRecordsLoading(false);
      return;
    }

    let active = true;
    const loadSelectedBusinessRecords = async () => {
      setRecordsLoading(true);
      setRecords([]);
      try {
        const branchRecords = await Promise.all(accountIds.map(async businessAccount => {
          let businessRecords: PerformanceRecord[] = [];
          let nextToken: string | null = null;
          do {
            const result: any = await client.graphql({
              query: listBusinessPerformanceRecords,
              variables: {
                filter: { businessAccount: { eq: businessAccount } },
                limit: 500,
                nextToken,
              },
            });
            const page = result?.data?.listBusinessPerformanceRecords;
            if (!page || !Array.isArray(page.items)) {
              throw new Error(`The analytics query for ${businessAccount} returned no records.`);
            }
            businessRecords = businessRecords.concat(page.items);
            nextToken = page.nextToken || null;
          } while (nextToken);
          return businessRecords;
        }));
        const businessRecords = branchRecords.flat();
        if (active) setRecords(businessRecords);
      } catch (error) {
        console.error('Failed to load business performance analytics:', error);
        if (active) Alert.alert(t('loadAnalyticsFailed'), t('tryAgain'));
      } finally {
        if (active) setRecordsLoading(false);
      }
    };

    loadSelectedBusinessRecords();
    return () => {
      active = false;
    };
  }, [selectedBusiness, selectedOrganizationId, organizations, recordsRefreshKey, t]);

  const selectedOrganization = organizations.find(organization => organization.id === selectedOrganizationId) || null;
  const selectedAccountIds = useMemo(
    () => selectedOrganization
      ? selectedOrganization.branches.map(branch => branch.BusKntct)
      : selectedBusiness ? [selectedBusiness.BusKntct] : [],
    [selectedOrganization, selectedBusiness]
  );
  const businessRecords = useMemo(() => {
    if (!selectedAccountIds.length) return [];
    const from = startOfDay(fromDate).getTime();
    const through = startOfDay(toDate).getTime() + DAY_MS - 1;
    return records.filter(record => {
      const time = new Date(record.occurredAt).getTime();
      return selectedAccountIds.includes(record.businessAccount)
        && Number.isFinite(time)
        && time >= from
        && time <= through;
    });
  }, [records, selectedAccountIds, fromDate, toDate]);
  const allSelectedBusinessRecords = useMemo(
    () => records.filter(record => selectedAccountIds.includes(record.businessAccount)),
    [records, selectedAccountIds]
  );
  const heatmapLocations = useMemo(
    () => businessRecords.flatMap(record => {
      if (record.latitude == null || record.longitude == null) return [];
      const latitude = Number(record.latitude);
      const longitude = Number(record.longitude);
      return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
        && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180
        ? [{ latitude, longitude }]
        : [];
    }),
    [businessRecords]
  );
  const hasBusinessAnalytics = useMemo(
    () => records.length > 0,
    [records]
  );

  const totals = useMemo(() => businessRecords.reduce(
    (result, record) => {
      if (record.recordType === 'REVENUE') result.revenue += Number(record.amountKes || 0);
      if (record.recordType === 'EXPENSE') {
        result.expenses += Number(record.amountKes || 0) + Number(record.feesKes || 0);
      }
      return result;
    },
    { revenue: 0, expenses: 0 }
  ), [businessRecords]);

  const chartBuckets = useMemo(() => {
    const spanDays = Math.max(1, Math.ceil((startOfDay(toDate).getTime() - startOfDay(fromDate).getTime()) / DAY_MS) + 1);
    const weekly = spanDays > 21;
    const buckets = new Map<string, { label: string; revenue: number; expenses: number }>();
    for (const record of businessRecords) {
      const date = startOfDay(new Date(record.occurredAt));
      const bucketDate = weekly
        ? new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay())
        : date;
      const key = asDayKey(bucketDate);
      const bucket = buckets.get(key) || {
        label: weekly
          ? bucketDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          : bucketDate.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }),
        revenue: 0,
        expenses: 0,
      };
      if (record.recordType === 'REVENUE') bucket.revenue += Number(record.amountKes || 0);
      if (record.recordType === 'EXPENSE') {
        bucket.expenses += Number(record.amountKes || 0) + Number(record.feesKes || 0);
      }
      buckets.set(key, bucket);
    }
    return Array.from(buckets.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([, bucket]) => bucket);
  }, [businessRecords, fromDate, toDate]);

  const resetEntry = () => {
    setEntryVisible(false);
    setAmount('');
    setDescription('');
    setItemName('');
    setCategory('');
    setQuantity('');
    setEntryDate(new Date());
  };

  const openManualEntry = (type: 'REVENUE' | 'EXPENSE') => {
    if (!nationality) {
      Alert.alert(
        t('currencyUnavailable'),
        t('currencyUnavailableBody')
      );
      return;
    }
    setRecordType(type);
    setEntryVisible(true);
  };

  const saveManualEntry = async () => {
    if (!selectedBusiness || !ownerSub) return;
    const originalAmount = Number(amount);
    if (!Number.isFinite(originalAmount) || originalAmount <= 0) {
      Alert.alert(t('validAmount'));
      return;
    }
    const quantityValue = quantity.trim() ? Number(quantity) : undefined;
    if (quantityValue !== undefined && (!Number.isFinite(quantityValue) || quantityValue <= 0)) {
      Alert.alert(t('validQuantity'));
      return;
    }

    setSaving(true);
    try {
      const entryNationality = nationality;
      const entryCountryCode = entryNationality ? nationalityToCode(entryNationality) : undefined;
      const currencyCode = (entryCountryCode && countryToCurrency[entryCountryCode])
        || (rateKey && ratesMap?.[rateKey]?.cur);
      if (!entryNationality || !currencyCode) {
        throw new Error(t('currencyUndetermined'));
      }
      const amountChf = await convertForeignToChf(originalAmount, entryNationality);
      if (!Number.isFinite(amountChf) || amountChf <= 0) {
        throw new Error(t('conversionFailed'));
      }
      const result: any = await client.graphql({
        query: createBusinessPerformanceRecord,
        variables: {
          input: {
            ownerSub,
            businessAccount: selectedBusiness.BusKntct,
            recordType,
            amountKes: amountChf,
            originalAmount,
            currency: currencyCode,
            exchangeRateToKes: amountChf / originalAmount,
            occurredAt: entryDate.toISOString(),
            source: 'MANUAL',
            itemName: itemName.trim() || undefined,
            category: category.trim() || undefined,
            quantity: quantityValue,
            description: description.trim() || undefined,
          },
        },
      });
      if (!result?.data?.createBusinessPerformanceRecord?.id) {
        throw new Error(t('entryNotSaved'));
      }
      resetEntry();
      await loadBusinessesAndRecords();
    } catch (error) {
      console.error('Failed to save business performance entry:', error);
      Alert.alert(
        t('saveEntryFailed'),
        error instanceof Error && error.message.startsWith('No valid CHF exchange rate')
          ? t('currencyRateUnavailable')
          : t('checkDetails')
      );
    } finally {
      setSaving(false);
    }
  };

  const creatorBusinesses = createdBusinesses.filter(business => !business.organizationId);
  const creatorOrganizations = organizations.filter(
    organization => organization.createdByEmail?.trim().toLowerCase() === signedInEmail
  );
  const closeOrganizationModal = () => {
    setOrganizationModalVisible(false);
    setOrganizationName('');
    setOrganizationToExtend(null);
    setSelectedBranchIds([]);
  };
  const openOrganizationModal = (organization: BusinessOrganization | null = null) => {
    setOrganizationName('');
    setOrganizationToExtend(organization);
    setSelectedBranchIds([]);
    setOrganizationModalVisible(true);
  };
  useEffect(() => {
    if (loading || !route.params?.openOrganizationLinking) return;
    navigation.setParams({ openOrganizationLinking: undefined });
    if (creatorBusinesses.length >= 2 || (creatorBusinesses.length > 0 && creatorOrganizations.length > 0)) {
      openOrganizationModal(creatorOrganizations[0] || null);
      return;
    }
    Alert.alert(
      t('noBranchesTitle'),
      t('noBranchesBody')
    );
  }, [loading, route.params?.openOrganizationLinking, creatorBusinesses.length, creatorOrganizations.length, t]);
  const saveOrganization = async () => {
    const minimumBranches = organizationToExtend ? 1 : 2;
    if (selectedBranchIds.length < minimumBranches) {
      Alert.alert(
        t('selectBranchesTitle'),
        organizationToExtend
          ? t('selectOneBranch')
          : t('selectTwoBranches')
      );
      return;
    }
    if (!organizationToExtend && !organizationName.trim()) {
      Alert.alert(t('enterOrganizationName'));
      return;
    }

    setOrganizationSaving(true);
    let linkedCount = 0;
    let organizationCreated = false;
    try {
      let organizationId = organizationToExtend?.id;
      if (!organizationId) {
        const result: any = await client.graphql({
          query: createBusinessOrganization,
          variables: {
            input: { name: organizationName.trim(), createdByEmail: signedInEmail },
          },
        });
        organizationId = result?.data?.createBusinessOrganization?.id;
        if (!organizationId) throw new Error(t('organizationNotConfirmed'));
        organizationCreated = true;
      }

      for (const BusKntct of selectedBranchIds) {
        const result: any = await client.graphql({
          query: updateBiznaOrganization,
          variables: {
            input: { BusKntct, organizationId },
            condition: { organizationId: { attributeExists: false } },
          },
        });
        if (!result?.data?.updateBizna?.BusKntct) {
          throw new Error(t('branchNotLinked', { branch: BusKntct }));
        }
        linkedCount += 1;
      }
      closeOrganizationModal();
      await loadBusinessesAndRecords();
    } catch (error) {
      console.error('Failed to link business branches to an organization:', error);
      if (linkedCount > 0 || organizationCreated) {
        closeOrganizationModal();
        await loadBusinessesAndRecords();
        Alert.alert(
          organizationCreated ? t('organizationCreated') : t('partiallyLinked'),
          organizationCreated && linkedCount === 0
            ? t('organizationSavedNoBranches')
            : t('someBranchesNotLinked', { count: linkedCount })
        );
      } else {
        Alert.alert(t('unableToLinkBranches'), t('noBranchesLinked'));
      }
    } finally {
      setOrganizationSaving(false);
    }
  };

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 10 }}>{t('loadingPerformance')}</Text>
    </View>;
  }

  if (!businesses.length && !organizations.length && !createdBusinesses.length) {
    return <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 21, fontWeight: '700', textAlign: 'center' }}>{t('businessPerformance')}</Text>
      <Text style={{ marginTop: 12, textAlign: 'center', color: '#52616b' }}>
        {t('noBusinessRecords', { email: signedInEmail || '' })}
      </Text>
      <Text style={{ marginTop: 8, textAlign: 'center', color: '#63727d' }}>
        {t('checkedRecords', { count: businessLookupCount })} {t('verifyAdminEmail')}
      </Text>
      <TouchableOpacity
        onPress={loadBusinessesAndRecords}
        style={{ marginTop: 16, alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, backgroundColor: '#1678b9' }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>{t('refreshBusinessList')}</Text>
      </TouchableOpacity>
    </View>;
  }

  const dateButton = (label: string, value: Date, target: 'from' | 'to') => (
    <TouchableOpacity
      onPress={() => setDatePickerTarget(target)}
      style={{ flex: 1, padding: 11, borderRadius: 9, backgroundColor: '#f0f4f7' }}
    >
      <Text style={{ color: '#53636e', fontSize: 12 }}>{t(label === 'FROM' ? 'from' : 'to')}</Text>
      <Text style={{ fontWeight: '700', marginTop: 4 }}>{value.toLocaleDateString()}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 36, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 23, fontWeight: '800', color: '#243a4a' }}>{t('businessPerformance')}</Text>
      <Text style={{ marginTop: 5, color: '#63727d' }}>
        {t('performanceSummary')}
      </Text>

      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 10,
        backgroundColor: '#f4f8fb',
      }}>
        <Text style={{ flex: 1, color: '#344955', fontWeight: '700' }} numberOfLines={1}>
          {selectedOrganization?.name || selectedBusiness?.busName || t('selectBusiness')}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('reloadRecords')}
          accessibilityState={{ disabled: recordsLoading || !selectedAccountIds.length, busy: recordsLoading }}
          disabled={recordsLoading || !selectedAccountIds.length}
          onPress={() => setRecordsRefreshKey(current => current + 1)}
          style={{
            width: 38,
            height: 38,
            marginLeft: 10,
            borderRadius: 19,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: recordsLoading || !selectedAccountIds.length ? '#d9e1e6' : '#1678b9',
            elevation: 3,
          }}
        >
          {recordsLoading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="refresh" size={20} color="#fff" />}
        </TouchableOpacity>
      </View>

      {organizations.length > 0 && (
        <>
          <Text style={{ marginTop: 15, fontWeight: '700', color: '#344955' }}>{t('organizations')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {organizations.map(organization => (
              <TouchableOpacity
                key={organization.id}
                onPress={() => {
                  setSelectedBusiness(null);
                  setSelectedOrganizationId(organization.id);
                }}
                style={{
                  backgroundColor: selectedOrganizationId === organization.id ? '#1678b9' : '#eef3f6',
                  paddingVertical: 10,
                  paddingHorizontal: 15,
                  borderRadius: 20,
                  marginRight: 8,
                }}
              >
                <Text style={{ color: selectedOrganizationId === organization.id ? '#fff' : '#243a4a', fontWeight: '700' }}>
                  {organization.name} ({organization.branches.length})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {businesses.length > 0 && (
        <>
          <Text style={{ marginTop: 15, fontWeight: '700', color: '#344955' }}>{t('individualBranches')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }}>
        {businesses.map(business => (
          <TouchableOpacity
            key={business.BusKntct}
            onPress={() => {
              setSelectedOrganizationId('');
              setSelectedBusiness(business);
            }}
            style={{
              backgroundColor: !selectedOrganizationId && selectedBusiness?.BusKntct === business.BusKntct ? '#1678b9' : '#eef3f6',
              paddingVertical: 10,
              paddingHorizontal: 15,
              borderRadius: 20,
              marginRight: 8,
            }}
          >
            <Text style={{ color: !selectedOrganizationId && selectedBusiness?.BusKntct === business.BusKntct ? '#fff' : '#243a4a', fontWeight: '700' }}>
              {business.busName}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
        </>
      )}

      {(creatorBusinesses.length >= 2 || (creatorBusinesses.length > 0 && creatorOrganizations.length > 0)) && (
        <View style={{ marginTop: 8 }}>
          {creatorBusinesses.length >= 2 && (
            <TouchableOpacity onPress={() => openOrganizationModal()} style={{ paddingVertical: 7 }}>
              <Text style={{ color: '#1678b9', fontWeight: '700' }}>{t('createOrganization')}</Text>
            </TouchableOpacity>
          )}
          {creatorBusinesses.length > 0 && creatorOrganizations.map(organization => (
            <TouchableOpacity
              key={`extend-${organization.id}`}
              onPress={() => openOrganizationModal(organization)}
              style={{ paddingVertical: 7 }}
            >
              <Text style={{ color: '#1678b9', fontWeight: '700' }}>{t('addBranchesTo', { name: organization.name })}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        {dateButton('FROM', fromDate, 'from')}
        {dateButton('TO', toDate, 'to')}
      </View>
      {datePickerTarget && (
        <DateTimePicker
          value={datePickerTarget === 'from' ? fromDate : toDate}
          mode="date"
          maximumDate={new Date()}
          onChange={(_, date) => {
            if (date) {
              if (datePickerTarget === 'from') setFromDate(startOfDay(date));
              else setToDate(startOfDay(date));
            }
            setDatePickerTarget(null);
          }}
        />
      )}
      {fromDate > toDate && (
        <Text style={{ color: '#b42318', marginTop: 8 }}>{t('dateOrderError')}</Text>
      )}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        {[
          { title: t('revenue'), value: totals.revenue, color: '#14804a' },
          { title: t('expenses'), value: totals.expenses, color: '#c46919' },
          { title: t('profit'), value: totals.revenue - totals.expenses, color: '#1769aa' },
        ].map(card => (
          <View key={card.title} style={{ flex: 1, padding: 11, borderRadius: 10, backgroundColor: '#f5f7f9' }}>
            <Text style={{ color: '#53636e', fontSize: 12 }}>{card.title}</Text>
            <Text style={{ color: card.color, fontWeight: '800', marginTop: 5, fontSize: 14 }}>
              {formatMoney(card.value)}
            </Text>
          </View>
        ))}
      </View>

      {recordsLoading ? (
        <View style={{ padding: 20, marginTop: 18, borderRadius: 12, backgroundColor: '#f4f8fb' }}>
          <ActivityIndicator />
          <Text style={{ textAlign: 'center', color: '#63727d', marginTop: 8 }}>
            {t('loadingAnalytics', { name: selectedOrganization?.name || selectedBusiness?.busName || t('selectBusiness') })}
          </Text>
        </View>
      ) : businessRecords.length === 0 ? (
        <View style={{ padding: 20, marginTop: 18, borderRadius: 12, backgroundColor: '#f4f8fb' }}>
          <Text style={{ textAlign: 'center', fontWeight: '700', color: '#243a4a' }}>
            {hasBusinessAnalytics ? t('noAnalyticsInRange') : t('transactForFree')}
          </Text>
          <Text style={{ textAlign: 'center', color: '#63727d', marginTop: 6 }}>
            {hasBusinessAnalytics ? t('rangeOrOutsideHint') : t('noAnalyticsYet')}
          </Text>
        </View>
      ) : (
        <View style={{ marginTop: 20, padding: 14, borderRadius: 12, backgroundColor: '#f8fafb' }}>
          <BusinessPerformanceBarChart buckets={chartBuckets} />
          <BusinessPerformanceTrendChart
            buckets={chartBuckets}
            currency={displayCurrency}
            formatMoney={formatMoney}
          />
        </View>
      )}

      {selectedBusiness && (
        <BusinessTargets
          business={selectedBusiness}
          records={allSelectedBusinessRecords}
          fromDate={fromDate}
          toDate={toDate}
          email={signedInEmail}
          formatMoney={formatMoney}
        />
      )}
      {selectedOrganization && (
        <BusinessTargets
          business={{ BusKntct: '', busName: selectedOrganization.name }}
          organizationId={selectedOrganization.id}
          records={allSelectedBusinessRecords}
          fromDate={fromDate}
          toDate={toDate}
          email={signedInEmail}
          formatMoney={formatMoney}
        />
      )}

      {businessRecords.length > 0 && <BusinessHeatmap locations={heatmapLocations} />}

      {selectedBusiness && !selectedOrganization && <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
        <TouchableOpacity
          onPress={() => openManualEntry('REVENUE')}
          style={{ flex: 1, padding: 13, borderRadius: 9, backgroundColor: '#14804a', alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '800' }}>{t('addOutsideRevenue')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => openManualEntry('EXPENSE')}
          style={{ flex: 1, padding: 13, borderRadius: 9, backgroundColor: '#c46919', alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '800' }}>{t('addOutsideExpense')}</Text>
        </TouchableOpacity>
      </View>}

      <Modal visible={organizationModalVisible} transparent animationType="slide" onRequestClose={closeOrganizationModal}>
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)', padding: 16 }}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ backgroundColor: '#fff', borderRadius: 14, padding: 18 }}
          >
            <Text style={{ color: '#243a4a', fontWeight: '800', fontSize: 19 }}>
              {organizationToExtend ? t('addBranchesTo', { name: organizationToExtend.name }) : t('createOrganization')}
            </Text>
            {!organizationToExtend && (
              <TextInput
                value={organizationName}
                onChangeText={setOrganizationName}
                placeholder={t('organizationName')}
                style={{ borderWidth: 1, borderColor: '#ccd5dc', borderRadius: 8, padding: 11, marginTop: 14 }}
              />
            )}
            <Text style={{ color: '#63727d', marginTop: 14, marginBottom: 8 }}>
              {t('branchEligibility')}
            </Text>
            {creatorBusinesses.map(business => {
              const checked = selectedBranchIds.includes(business.BusKntct);
              return (
                <TouchableOpacity
                  key={business.BusKntct}
                  onPress={() => setSelectedBranchIds(current => checked
                    ? current.filter(id => id !== business.BusKntct)
                    : [...current, business.BusKntct])}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}
                >
                  <Text style={{ color: checked ? '#1678b9' : '#63727d', fontSize: 18, marginRight: 10 }}>
                    {checked ? '☑' : '☐'}
                  </Text>
                  <Text style={{ color: '#243a4a', fontWeight: '600' }}>{business.busName}</Text>
                </TouchableOpacity>
              );
            })}
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <TouchableOpacity
                onPress={closeOrganizationModal}
                disabled={organizationSaving}
                style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#eef3f6', alignItems: 'center', marginRight: 8 }}
              >
                <Text style={{ color: '#344955', fontWeight: '700' }}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveOrganization}
                disabled={organizationSaving}
                style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#1678b9', alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '800' }}>
                  {organizationSaving ? t('saving') : organizationToExtend ? t('linkBranches') : t('createAndLink')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={entryVisible} transparent animationType="slide" onRequestClose={resetEntry}>
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: 18 }}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 18, borderRadius: 14, backgroundColor: '#fff' }}
          >
            <Text style={{ fontWeight: '800', fontSize: 19, color: '#243a4a' }}>
              {recordType === 'REVENUE' ? t('addOutsideRevenueTitle') : t('addOutsideExpenseTitle')}
            </Text>
            <Text style={{ color: '#63727d', marginTop: 5 }}>
              {t('entryCurrencyNotice', { currency: entryCurrencyLabel })}
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder={t('amountPlaceholder', { currency: entryCurrencyLabel })}
              style={{ borderWidth: 1, borderColor: '#ccd5dc', borderRadius: 8, padding: 11, marginTop: 14 }}
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={t('descriptionOptional')}
              style={{ borderWidth: 1, borderColor: '#ccd5dc', borderRadius: 8, padding: 11, marginTop: 9 }}
            />
            <TextInput
              value={itemName}
              onChangeText={setItemName}
              placeholder={t('itemOptional')}
              style={{ borderWidth: 1, borderColor: '#ccd5dc', borderRadius: 8, padding: 11, marginTop: 9 }}
            />
            <TextInput
              value={category}
              onChangeText={setCategory}
              placeholder={t('categoryOptional')}
              style={{ borderWidth: 1, borderColor: '#ccd5dc', borderRadius: 8, padding: 11, marginTop: 9 }}
            />
            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
              placeholder={t('quantityOptional')}
              style={{ borderWidth: 1, borderColor: '#ccd5dc', borderRadius: 8, padding: 11, marginTop: 9 }}
            />
            <TouchableOpacity
              onPress={() => setShowEntryDatePicker(true)}
              style={{ padding: 12, borderRadius: 8, backgroundColor: '#f0f4f7', marginTop: 9 }}
            >
              <Text>{t('transactionDate', { date: entryDate.toLocaleDateString() })}</Text>
            </TouchableOpacity>
            {showEntryDatePicker && (
              <DateTimePicker
                value={entryDate}
                mode="date"
                maximumDate={new Date()}
                onChange={(_, date) => {
                  if (date) setEntryDate(date);
                  setShowEntryDatePicker(false);
                }}
              />
            )}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity onPress={resetEntry} style={{ flex: 1, padding: 12, alignItems: 'center' }}>
                <Text>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={saving}
                onPress={saveManualEntry}
                style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#1678b9', alignItems: 'center' }}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800' }}>{t('saveEntry')}</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default BusinessPerformanceScreen;
