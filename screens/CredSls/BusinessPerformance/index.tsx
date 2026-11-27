import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  InteractionManager,
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
import { printToFileAsync } from '../../../src/utils/print';
import { shareFile } from '../../../src/utils/share';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import {
  createBusinessOrganization,
  createBusinessPerformanceRecord,
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
const REPORT_FEE_BASE_CHF = 1;
const REPORT_BIZNA_BALANCE_QUERY = /* GraphQL */ `
  query ReportBiznaBalance($BusKntct: String!) {
    getBizna(BusKntct: $BusKntct) {
      BusKntct
      busName
      earningsBal
      netEarnings
    }
  }
`;
const UPDATE_BIZNA_ORGANIZATION = /* GraphQL */ `
  mutation UpdateBiznaOrganization(
    $input: UpdateBiznaInput!
    $condition: ModelBiznaConditionInput
  ) {
    updateBizna(input: $input, condition: $condition) {
      BusKntct
      organizationId
    }
  }
`;
const REPORT_PERSONAL_NATIONALITY_QUERY = /* GraphQL */ `
  query ReportPersonalNationality($awsemail: String!) {
    getSMAccount(awsemail: $awsemail) {
      nationality
    }
  }
`;
const REPORT_PERSONAL_BALANCE_QUERY = /* GraphQL */ `
  query ReportPersonalBalance($awsemail: String!) {
    getSMAccount(awsemail: $awsemail) {
      awsemail
      balance
    }
  }
`;
const REPORT_COMPANY_REVENUE_QUERY = /* GraphQL */ `
  query ReportCompanyRevenue($AdminId: String!) {
    getCompany(AdminId: $AdminId) {
      AdminId
      companyEarningBal
      companyEarning
      performanceReadFee
      performanceDownloadFee
    }
  }
`;
const REPORT_COMPANY_FEES_QUERY = /* GraphQL */ `
  query ReportCompanyPerformanceFees($AdminId: String!) {
    getCompany(AdminId: $AdminId) {
      AdminId
      performanceReadFee
      performanceDownloadFee
    }
  }
`;
const UPDATE_REPORT_BIZNA_BALANCE = /* GraphQL */ `
  mutation UpdateReportBiznaBalance(
    $input: UpdateBiznaInput!
    $condition: ModelBiznaConditionInput
  ) {
    updateBizna(input: $input, condition: $condition) {
      BusKntct
      earningsBal
      netEarnings
    }
  }
`;
const UPDATE_REPORT_PERSONAL_BALANCE = /* GraphQL */ `
  mutation UpdateReportPersonalBalance(
    $input: UpdateSMAccountInput!
    $condition: ModelSMAccountConditionInput
  ) {
    updateSMAccount(input: $input, condition: $condition) {
      awsemail
      balance
    }
  }
`;
const UPDATE_REPORT_COMPANY_REVENUE = /* GraphQL */ `
  mutation UpdateReportCompanyRevenue(
    $input: UpdateCompanyInput!
    $condition: ModelCompanyConditionInput
  ) {
    updateCompany(input: $input, condition: $condition) {
      AdminId
      companyEarningBal
      companyEarning
    }
  }
`;

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

type ReportFeeRates = {
  performanceReadFee: number;
  performanceDownloadFee: number;
};

const parseReportFeeRates = (company: {
  performanceReadFee?: number | null;
  performanceDownloadFee?: number | null;
} | null | undefined): ReportFeeRates | null => {
  const performanceReadFee = company?.performanceReadFee;
  const performanceDownloadFee = company?.performanceDownloadFee;
  if (
    typeof performanceReadFee !== 'number'
    || !Number.isFinite(performanceReadFee)
    || performanceReadFee < 0
    || typeof performanceDownloadFee !== 'number'
    || !Number.isFinite(performanceDownloadFee)
    || performanceDownloadFee < 0
  ) {
    return null;
  }
  return { performanceReadFee, performanceDownloadFee };
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

const fetchPerformanceRecords = async (accountIds: string[]) => Promise.all(accountIds.map(async businessAccount => {
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
})).then(branchRecords => branchRecords.flat());

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const filterPerformanceRecords = (
  records: PerformanceRecord[],
  accountIds: string[],
  fromDate: Date,
  toDate: Date,
  asOf: Date
) => {
  if (!accountIds.length) return [];
  const from = startOfDay(fromDate).getTime();
  const endOfSelectedDay = startOfDay(toDate).getTime() + DAY_MS - 1;
  const selectedEndIsToday = startOfDay(toDate).getTime() === startOfDay(asOf).getTime();
  const through = selectedEndIsToday ? Math.min(endOfSelectedDay, asOf.getTime()) : endOfSelectedDay;
  return records.filter(record => {
    const time = new Date(record.occurredAt).getTime();
    return accountIds.includes(record.businessAccount)
      && Number.isFinite(time)
      && time >= from
      && time <= through;
  });
};

const calculatePerformanceTotals = (records: PerformanceRecord[]) => records.reduce(
  (result, record) => {
    if (record.recordType === 'REVENUE') result.revenue += Number(record.amountKes || 0);
    if (record.recordType === 'EXPENSE') {
      result.expenses += Number(record.amountKes || 0) + Number(record.feesKes || 0);
    }
    return result;
  },
  { revenue: 0, expenses: 0 }
);

const buildPerformanceChartBuckets = (records: PerformanceRecord[], fromDate: Date, toDate: Date) => {
  const start = startOfDay(fromDate);
  const end = startOfDay(toDate);
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  const spanDays = Math.max(1, Math.floor((endUtc - startUtc) / DAY_MS) + 1);
  const daysPerBucket = Math.max(1, Math.ceil(spanDays / 30));
  const buckets: ChartBucket[] = Array.from({ length: Math.ceil(spanDays / daysPerBucket) }, (_, index) => {
    const periodStart = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index * daysPerBucket);
    const actualPeriodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate() + daysPerBucket - 1);
    const boundedPeriodEnd = actualPeriodEnd > end ? end : actualPeriodEnd;
    const startLabel = periodStart.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
    const endLabel = boundedPeriodEnd.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
    return {
      label: daysPerBucket === 1 ? startLabel : `${startLabel}–${endLabel}`,
      revenue: 0,
      expenses: 0,
      periodStart,
      periodEnd: boundedPeriodEnd,
    };
  });
  for (const record of records) {
    const date = startOfDay(new Date(record.occurredAt));
    const dateUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const bucketIndex = Math.floor((dateUtc - startUtc) / DAY_MS / daysPerBucket);
    const bucket = buckets[bucketIndex];
    if (!bucket) continue;
    if (record.recordType === 'REVENUE') bucket.revenue += Number(record.amountKes || 0);
    if (record.recordType === 'EXPENSE') {
      bucket.expenses += Number(record.amountKes || 0) + Number(record.feesKes || 0);
    }
  }
  return buckets;
};

const getCoveredMonthFraction = (from: Date, to: Date) => {
  const start = startOfDay(from);
  const end = startOfDay(to);
  if (end < start) return 0;

  const utcDay = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  let coveredMonths = 0;
  for (let month = new Date(start.getFullYear(), start.getMonth(), 1);
    month <= end;
    month = new Date(month.getFullYear(), month.getMonth() + 1, 1)) {
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const rangeStart = start > month ? start : month;
    const rangeEnd = end < monthEnd ? end : monthEnd;
    const daysCovered = Math.floor((utcDay(rangeEnd) - utcDay(rangeStart)) / DAY_MS) + 1;
    coveredMonths += daysCovered / monthEnd.getDate();
  }
  return coveredMonths;
};
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
const escapeHtml = (value: unknown) => String(value ?? '').replace(
  /[&<>"']/g,
  character => HTML_ESCAPE_MAP[character] || character
);

type ChartBucket = {
  label: string;
  revenue: number;
  expenses: number;
  periodStart: Date;
  periodEnd: Date;
};

const buildReportCharts = (
  buckets: ChartBucket[],
  currency: string,
  formatMoney: (value: number) => string,
  labels: { heading: string; bars: string; lines: string; revenue: string; expenses: string; profit: string }
) => {
  if (!buckets.length) return '';
  const width = Math.max(640, buckets.length * 52);
  const height = 240;
  const padding = { top: 24, right: 18, bottom: 40, left: 78 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const values = buckets.flatMap(bucket => [
    bucket.revenue,
    bucket.expenses,
    bucket.revenue - bucket.expenses,
  ]);
  const minimum = Math.min(0, ...values);
  const maximum = Math.max(1, ...values);
  const yFor = (value: number) =>
    padding.top + ((maximum - value) / (maximum - minimum || 1)) * chartHeight;
  const xFor = (index: number) =>
    padding.left + (index + 0.5) * (chartWidth / buckets.length);
  const series = [
    { key: 'revenue', label: labels.revenue, color: '#14804a', values: buckets.map(bucket => bucket.revenue) },
    { key: 'expenses', label: labels.expenses, color: '#c46919', values: buckets.map(bucket => bucket.expenses) },
    { key: 'profit', label: labels.profit, color: '#1769aa', values: buckets.map(bucket => bucket.revenue - bucket.expenses) },
  ];
  const labelStep = Math.max(1, Math.ceil(buckets.length / 16));
  const legend = series.map(item => `
    <span class="legend-item"><i style="background:${item.color}"></i>${escapeHtml(item.label)}</span>`).join('');
  const grid = Array.from({ length: 5 }, (_, index) => {
    const value = maximum - ((maximum - minimum) * index) / 4;
    const y = yFor(value);
    return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="${value === 0 ? '#758795' : '#e1e8ed'}"/>
      <text x="${padding.left - 7}" y="${y + 4}" text-anchor="end" class="axis-label">${escapeHtml(formatMoney(value))}</text>`;
  }).join('') + buckets.map((_, index) =>
    `<line x1="${xFor(index)}" y1="${padding.top}" x2="${xFor(index)}" y2="${height - padding.bottom}" stroke="#e1e8ed"/>`
  ).join('');
  const dateLabels = buckets.map((bucket, index) => index % labelStep === 0 || index === buckets.length - 1
    ? `<text x="${xFor(index)}" y="${height - 10}" text-anchor="middle" class="axis-label">${escapeHtml(bucket.label)}</text>`
    : '').join('');
  const bars = buckets.map((_, bucketIndex) => {
    const groupWidth = chartWidth / buckets.length;
    const barWidth = Math.max(2, Math.min(15, groupWidth * 0.19));
    return series.map((item, seriesIndex) => {
      const value = item.values[bucketIndex];
      const zero = yFor(0);
      const y = yFor(value);
      const barX = xFor(bucketIndex) - (barWidth * 1.7) + seriesIndex * (barWidth + 2);
      return `<rect x="${barX}" y="${Math.min(y, zero)}" width="${barWidth}" height="${Math.max(1, Math.abs(zero - y))}" fill="${item.color}" rx="2"/>`;
    }).join('');
  }).join('');
  const lines = series.map(item => {
    const points = item.values.map((value, index) => `${xFor(index)},${yFor(value)}`).join(' ');
    const dots = item.values.map((value, index) =>
      `<circle cx="${xFor(index)}" cy="${yFor(value)}" r="2.5" fill="${item.color}"/>`
    ).join('');
    return `<polyline points="${points}" fill="none" stroke="${item.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${dots}`;
  }).join('');

  return `
    <h2>${escapeHtml(labels.heading)} (${escapeHtml(currency)})</h2>
    <div class="legend">${legend}</div>
    <h3>${escapeHtml(labels.bars)}</h3>
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Performance bar chart">
      ${grid}${bars}${dateLabels}
    </svg>
    <h3>${escapeHtml(labels.lines)}</h3>
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Performance trend chart">
      ${grid}${lines}${dateLabels}
    </svg>`;
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

const BusinessPerformanceBarChart = ({
  buckets,
  selected,
  onSelect,
  onSelectBucket,
  selectedPeriodKey,
  loadingPeriodKey,
}: {
  buckets: ChartBucket[];
  selected: ChartSelection;
  onSelect: (selection: ChartSelection) => void;
  onSelectBucket: (bucket: ChartBucket) => void;
  selectedPeriodKey: string | null;
  loadingPeriodKey: string | null;
}) => {
  const t = useBusinessPerformanceTranslation();
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
      <ChartMetricSelector selected={selected} onSelect={onSelect} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 7 }}>
        {metrics.map(metric => (
          <View key={metric.key} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: metric.color, marginRight: 4 }} />
            <Text style={{ color: '#53636e', fontSize: 11 }}>{t(metric.key)}</Text>
          </View>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={{ width, height: height + 34 }}>
        <Svg width={width} height={height - 24}>
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
                    onPress={() => onSelectBucket(bucket)}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </Svg>
        {buckets.map((bucket, bucketIndex) => {
          const periodKey = String(bucket.periodStart.getTime());
          const isSelected = selectedPeriodKey === periodKey;
          const isLoading = loadingPeriodKey === periodKey;
          return (
            <TouchableOpacity
              key={`bar-date-${periodKey}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, busy: isLoading }}
              onPress={() => onSelectBucket(bucket)}
              style={{
                position: 'absolute',
                left: 6 + bucketIndex * (groupWidth + 9) + groupWidth / 2 - 42,
                top: height - 23,
                width: 84,
                height: 28,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                backgroundColor: isSelected ? '#87CEEB' : 'transparent',
              }}
            >
              {isLoading
                ? <ActivityIndicator size="small" color="#1678b9" />
                : <Text numberOfLines={1} style={{ color: '#63727d', fontSize: 10, textAlign: 'center' }}>{bucket.label}</Text>}
            </TouchableOpacity>
          );
        })}
        </View>
      </ScrollView>
      <Text style={{ color: '#63727d', fontSize: 12, marginTop: 5 }}>
        {t('barDateHint')} {t('profitLossHint')}
      </Text>
      <Text style={{ color: '#63727d', fontSize: 12, marginTop: 4 }}>
        {t('performancePointHint')}
      </Text>
    </View>
  );
};

const BusinessPerformanceTrendChart = ({
  buckets,
  currency,
  formatMoney,
  selected,
  onSelect,
  onSelectBucket,
  selectedPeriodKey,
  loadingPeriodKey,
}: {
  buckets: ChartBucket[];
  currency: string;
  formatMoney: (value: number) => string;
  selected: ChartSelection;
  onSelect: (selection: ChartSelection) => void;
  onSelectBucket: (bucket: ChartBucket) => void;
  selectedPeriodKey: string | null;
  loadingPeriodKey: string | null;
}) => {
  const t = useBusinessPerformanceTranslation();
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
  const verticalGridLines = buckets.map((_, index) => {
    const x = xFor(index);
    return (
      <Line
        key={`vertical-grid-${index}`}
        x1={x}
        y1={padding.top}
        x2={x}
        y2={height - padding.bottom}
        stroke="#e1e8ed"
        strokeWidth={0.8}
      />
    );
  });

  return (
    <View style={{ marginTop: 22 }}>
      <Text style={{ fontWeight: '800', color: '#243a4a', fontSize: 15 }}>{t('performanceTrend')}</Text>
      <Text style={{ color: '#63727d', fontSize: 11, marginTop: 3 }}>
        {t('chartFilterHint')}
      </Text>
      <ChartMetricSelector selected={selected} onSelect={onSelect} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginBottom: 8 }}>
        {series.map(item => (
          <View key={item.key} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 14, marginBottom: 4 }}>
            <View style={{ width: 15, height: 3, backgroundColor: item.color, marginRight: 5 }} />
            <Text style={{ color: '#53636e', fontSize: 12 }}>{item.label}</Text>
          </View>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={{ width, height: height + 36 }}>
        <Svg width={width} height={height}>
          {verticalGridLines}
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
                    r={6}
                    fill={item.color}
                    onPress={() => onSelectBucket(buckets[index])}
                  />
                ))}
              </React.Fragment>
            );
          })}
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
        {buckets.map((bucket, index) => {
          const periodKey = String(bucket.periodStart.getTime());
          const isSelected = selectedPeriodKey === periodKey;
          const isLoading = loadingPeriodKey === periodKey;
          return (
            <TouchableOpacity
              key={`trend-date-${periodKey}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, busy: isLoading }}
              onPress={() => onSelectBucket(bucket)}
              style={{
                position: 'absolute',
                left: xFor(index) - 38,
                top: height - padding.bottom + 2,
                width: 76,
                height: 30,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                backgroundColor: isSelected ? '#87CEEB' : 'transparent',
              }}
            >
              {isLoading
                ? <ActivityIndicator size="small" color="#1678b9" />
                : <Text numberOfLines={1} style={{ color: '#63727d', fontSize: 10, textAlign: 'center' }}>{bucket.label}</Text>}
            </TouchableOpacity>
          );
        })}
        </View>
      </ScrollView>
      <Text style={{ color: '#63727d', fontSize: 12, marginTop: 4 }}>
        {t('axisAmounts')} ({currency}); {t('axisTime').toLowerCase()}.
      </Text>
      <Text style={{ color: '#63727d', fontSize: 12, marginTop: 4 }}>
        {t('performancePointHint')}
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
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [organizations, setOrganizations] = useState<BusinessOrganization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('');
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [recordsRefreshKey, setRecordsRefreshKey] = useState(0);
  const [ownerSub, setOwnerSub] = useState('');
  const [signedInEmail, setSignedInEmail] = useState('');
  const [accountNationality, setAccountNationality] = useState('');
  const [authorizedReportKey, setAuthorizedReportKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsLoadFailed, setRecordsLoadFailed] = useState(false);
  const [reportExporting, setReportExporting] = useState(false);
  const [reportFeeProcessing, setReportFeeProcessing] = useState(false);
  const [reportFeeRates, setReportFeeRates] = useState<ReportFeeRates | null>(null);
  const [reportFeeSettingsLoading, setReportFeeSettingsLoading] = useState(true);
  const [reportFeeSettingsFailed, setReportFeeSettingsFailed] = useState(false);
  const [payerPickerVisible, setPayerPickerVisible] = useState(false);
  const [payerAction, setPayerAction] = useState<'view' | 'download' | null>(null);
  const [selectedPerformancePeriodKey, setSelectedPerformancePeriodKey] = useState<string | null>(null);
  const [loadingPerformancePeriodKey, setLoadingPerformancePeriodKey] = useState<string | null>(null);
  const [performanceDetails, setPerformanceDetails] = useState<{
    bucket: ChartBucket;
    totals: { revenue: number; expenses: number };
  } | null>(null);
  const performanceDetailRequestId = useRef(0);
  const [saving, setSaving] = useState(false);
  const [entryVisible, setEntryVisible] = useState(false);
  const [recordType, setRecordType] = useState<'REVENUE' | 'EXPENSE'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [entryDate, setEntryDate] = useState(new Date());
  const [chartSelection, setChartSelection] = useState<ChartSelection>('all');
  const [showEntryDatePicker, setShowEntryDatePicker] = useState(false);
  const [fromDate, setFromDate] = useState(startOfDay(new Date(Date.now() - 29 * DAY_MS)));
  const [toDate, setToDate] = useState(startOfDay(new Date()));
  const [reportAsOf, setReportAsOf] = useState(new Date());
  const [datePickerTarget, setDatePickerTarget] = useState<'from' | 'to' | null>(null);
  const [organizationModalVisible, setOrganizationModalVisible] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationToExtend, setOrganizationToExtend] = useState<BusinessOrganization | null>(null);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [organizationSaving, setOrganizationSaving] = useState(false);
  const [fallbackRate, setFallbackRate] = useState<{ buyingPrice: number; symbol?: string } | null>(null);

  const effectiveNationality = nationality || accountNationality || null;
  const rateKey = resolveRateKey(effectiveNationality, ratesMap);
  const fallbackNationalityCode = effectiveNationality ? nationalityToCode(effectiveNationality) : undefined;
  const fallbackCurrency = fallbackNationalityCode
    ? countryToCurrency[fallbackNationalityCode]
    : undefined;
  const displayCurrency = (rateKey && ratesMap?.[rateKey]?.symbol)
    || fallbackRate?.symbol
    || fallbackCurrency
    || BASE_EXCHANGE_SYMBOL;
  const entryCurrencyLabel = effectiveNationality
    ? displayCurrency
    : 'Currency unavailable';

  const reportSelectionKey = [
    selectedOrganizationId,
    selectedBusiness?.BusKntct || '',
    fromDate.toISOString(),
    toDate.toISOString(),
  ].join('|');
  const reportIsAuthorized = authorizedReportKey === reportSelectionKey;
  const coveredMonths = getCoveredMonthFraction(fromDate, toDate);
  const reportFeesReady = Boolean(reportFeeRates) && !reportFeeSettingsLoading && !reportFeeSettingsFailed;
  const viewFeeChf = reportFeeRates
    ? Number((coveredMonths * reportFeeRates.performanceReadFee * REPORT_FEE_BASE_CHF).toFixed(2))
    : 0;
  const downloadFeeChf = reportFeeRates
    ? Number((coveredMonths * reportFeeRates.performanceDownloadFee * REPORT_FEE_BASE_CHF).toFixed(2))
    : 0;

  const loadReportFeeSettings = useCallback(async () => {
    setReportFeeSettingsLoading(true);
    setReportFeeSettingsFailed(false);
    try {
      const result: any = await client.graphql({
        query: REPORT_COMPANY_FEES_QUERY,
        variables: { AdminId: '' },
      });
      const company = result?.data?.getCompany;
      if (!company?.AdminId) throw new Error('The company report-fee settings could not be loaded.');
      setReportFeeRates(parseReportFeeRates(company));
    } catch (error) {
      console.error('Unable to load business performance report fees:', error);
      setReportFeeRates(null);
      setReportFeeSettingsFailed(true);
    } finally {
      setReportFeeSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setAuthorizedReportKey('');
      void loadReportFeeSettings();
      setReportAsOf(new Date());
      setRecordsRefreshKey(current => current + 1);
    });
    void loadReportFeeSettings();
    return unsubscribe;
  }, [navigation, loadReportFeeSettings]);

  useEffect(() => {
    if (nationality) {
      setAccountNationality(nationality);
      return;
    }
    if (!signedInEmail) return;
    let active = true;
    void (async () => {
      try {
        const result: any = await client.graphql({
          query: REPORT_PERSONAL_NATIONALITY_QUERY,
          variables: { awsemail: signedInEmail },
        });
        const userNationality = result?.data?.getSMAccount?.nationality;
        if (active && userNationality) setAccountNationality(userNationality);
      } catch (error) {
        console.error('Failed to load account nationality for report fee conversion:', error);
      }
    })();
    return () => {
      active = false;
    };
  }, [nationality, signedInEmail]);

  useEffect(() => {
    let active = true;
    const loadFallbackRate = async () => {
      if (!effectiveNationality || rateKey) {
        setFallbackRate(null);
        return;
      }
      const rate = await getExRatesForNationality(effectiveNationality);
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
  }, [effectiveNationality, rateKey]);

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
      setRecordsLoadFailed(false);
      return;
    }

    let active = true;
    const loadSelectedBusinessRecords = async () => {
      setRecordsLoading(true);
      setRecordsLoadFailed(false);
      setRecords([]);
      try {
        const businessRecords = await fetchPerformanceRecords(accountIds);
        if (active) {
          setRecords(businessRecords);
          setReportAsOf(new Date());
        }
      } catch (error) {
        console.error('Failed to load business performance analytics:', error);
        if (active) {
          setRecordsLoadFailed(true);
          Alert.alert(t('loadAnalyticsFailed'), t('tryAgain'));
        }
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
    return filterPerformanceRecords(records, selectedAccountIds, fromDate, toDate, reportAsOf);
  }, [records, selectedAccountIds, fromDate, toDate, reportAsOf]);
  const allSelectedBusinessRecords = useMemo(
    () => records.filter(record => selectedAccountIds.includes(record.businessAccount)),
    [records, selectedAccountIds]
  );
  const mapRecords = useMemo(
    () => businessRecords.filter(record =>
      (chartSelection === 'all' || chartSelection === 'profit'
        || chartSelection === 'revenue' && record.recordType === 'REVENUE'
        || chartSelection === 'expenses' && record.recordType === 'EXPENSE')
      && (record.recordType === 'REVENUE' || record.recordType === 'EXPENSE')
    ),
    [businessRecords, chartSelection]
  );
  const heatmapLocations = useMemo(
    () => mapRecords.flatMap(record => {
      if (record.latitude == null || record.longitude == null) return [];
      const latitude = Number(record.latitude);
      const longitude = Number(record.longitude);
      return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
        && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180
        ? [{ latitude, longitude, recordType: record.recordType === 'EXPENSE' ? 'EXPENSE' as const : 'REVENUE' as const }]
        : [];
    }),
    [mapRecords]
  );
  const hasBusinessAnalytics = useMemo(
    () => records.length > 0,
    [records]
  );

  const totals = useMemo(() => calculatePerformanceTotals(businessRecords), [businessRecords]);

  const formatReportFee = (amountChf: number) => {
    const rate = rateKey ? ratesMap?.[rateKey] : null;
    const buyingPrice = Number(rate?.buyingPrice);
    if (rateKey && ratesMap && rate && Number.isFinite(buyingPrice) && buyingPrice > 0) {
      const feeCurrencySymbol = rate.symbol || fallbackRate?.symbol || fallbackCurrency;
      if (!feeCurrencySymbol) throw new Error('REPORT_FEE_CURRENCY_UNAVAILABLE');
      return formatAmountSync(amountChf, rateKey, ratesMap, feeCurrencySymbol);
    }
    if (fallbackRate && Number.isFinite(fallbackRate.buyingPrice) && fallbackRate.buyingPrice > 0) {
      return `${fallbackRate.symbol || displayCurrency} ${(amountChf * fallbackRate.buyingPrice).toFixed(2)}`;
    }
    throw new Error('REPORT_FEE_CURRENCY_UNAVAILABLE');
  };

  const confirmPersonalFallbackCharge = (action: 'view' | 'download', amount: string) => new Promise<boolean>(resolve => {
    Alert.alert(
      t(action === 'view' ? 'reportViewFeeTitle' : 'reportDownloadFeeTitle'),
      t('reportPersonalFallbackConfirmation', { amount }),
      [
        { text: t('cancel'), style: 'cancel', onPress: () => resolve(false) },
        { text: t('proceedToReport'), onPress: () => resolve(true) },
      ],
      { cancelable: false, onDismiss: () => resolve(false) }
    );
  });

  const chargeReportFee = async (amountChf: number, payerBranch: Business, action: 'view' | 'download') => {
    const biznaResult: any = await client.graphql({
      query: REPORT_BIZNA_BALANCE_QUERY,
      variables: { BusKntct: payerBranch.BusKntct },
    });
    const bizna = biznaResult?.data?.getBizna;
    if (!bizna?.BusKntct) throw new Error('The selected business account could not be loaded.');

    const businessBalance = Number(bizna.earningsBal);
    const businessNetEarnings = Number(bizna.netEarnings);
    if (!Number.isFinite(businessBalance) || !Number.isFinite(businessNetEarnings)) {
      throw new Error('The selected business account has invalid balance information.');
    }

    let payer: 'business' | 'personal';
    let personalAccount: any = null;
    let personalBalance = 0;
    if (businessBalance >= amountChf) {
      payer = 'business';
    } else {
      const personalResult: any = await client.graphql({
        query: REPORT_PERSONAL_BALANCE_QUERY,
        variables: { awsemail: signedInEmail },
      });
      personalAccount = personalResult?.data?.getSMAccount;
      personalBalance = Number(personalAccount?.balance);
      if (
        !personalAccount?.awsemail
        || !Number.isFinite(personalBalance)
        || personalBalance < amountChf
      ) {
        throw new Error('REPORT_INSUFFICIENT_FUNDS');
      }
      if (!await confirmPersonalFallbackCharge(action, formatReportFee(amountChf))) {
        return false;
      }
      payer = 'personal';
    }

    const companyResult: any = await client.graphql({
      query: REPORT_COMPANY_REVENUE_QUERY,
      variables: { AdminId: '' },
    });
    const company = companyResult?.data?.getCompany;
    const currentFeeRates = parseReportFeeRates(company);
    if (!currentFeeRates) {
      setReportFeeRates(null);
      throw new Error('REPORT_FEES_NOT_CONFIGURED');
    }
    if (
      !reportFeeRates
      || currentFeeRates.performanceReadFee !== reportFeeRates.performanceReadFee
      || currentFeeRates.performanceDownloadFee !== reportFeeRates.performanceDownloadFee
    ) {
      setReportFeeRates(currentFeeRates);
      throw new Error('REPORT_FEES_CHANGED');
    }
    const companyEarningBal = Number(company?.companyEarningBal);
    const companyEarning = Number(company?.companyEarning);
    if (
      !company?.AdminId
      || !Number.isFinite(companyEarningBal)
      || !Number.isFinite(companyEarning)
    ) {
      throw new Error('The company revenue account could not be loaded.');
    }

    let debitedBusinessBalance: number | null = null;
    let debitedBusinessNetEarnings: number | null = null;
    let debitedPersonalBalance: number | null = null;
    if (payer === 'business') {
      debitedBusinessBalance = businessBalance - amountChf;
      debitedBusinessNetEarnings = businessNetEarnings - amountChf;
      const debitResult: any = await client.graphql({
        query: UPDATE_REPORT_BIZNA_BALANCE,
        variables: {
          input: {
            BusKntct: bizna.BusKntct,
            earningsBal: debitedBusinessBalance,
            netEarnings: debitedBusinessNetEarnings,
          },
          condition: {
            earningsBal: { eq: businessBalance },
            netEarnings: { eq: businessNetEarnings },
          },
        },
      });
      if (!debitResult?.data?.updateBizna?.BusKntct) {
        throw new Error('The business account debit was not confirmed.');
      }
    } else {
      debitedPersonalBalance = personalBalance - amountChf;
      const debitResult: any = await client.graphql({
        query: UPDATE_REPORT_PERSONAL_BALANCE,
        variables: {
          input: {
            awsemail: personalAccount.awsemail,
            balance: debitedPersonalBalance,
          },
          condition: { balance: { eq: personalBalance } },
        },
      });
      if (!debitResult?.data?.updateSMAccount?.awsemail) {
        throw new Error('The personal account debit was not confirmed.');
      }
    }

    try {
      const creditResult: any = await client.graphql({
        query: UPDATE_REPORT_COMPANY_REVENUE,
        variables: {
          input: {
            AdminId: company.AdminId,
            companyEarningBal: companyEarningBal + amountChf,
            companyEarning: companyEarning + amountChf,
          },
          condition: {
            companyEarningBal: { eq: companyEarningBal },
            companyEarning: { eq: companyEarning },
          },
        },
      });
      if (!creditResult?.data?.updateCompany?.AdminId) {
        throw new Error('The company revenue credit was not confirmed.');
      }
    } catch (error) {
      try {
        if (payer === 'business' && debitedBusinessBalance !== null && debitedBusinessNetEarnings !== null) {
          const refundResult: any = await client.graphql({
            query: UPDATE_REPORT_BIZNA_BALANCE,
            variables: {
              input: {
                BusKntct: bizna.BusKntct,
                earningsBal: businessBalance,
                netEarnings: businessNetEarnings,
              },
              condition: {
                earningsBal: { eq: debitedBusinessBalance },
                netEarnings: { eq: debitedBusinessNetEarnings },
              },
            },
          });
          if (!refundResult?.data?.updateBizna?.BusKntct) {
            throw new Error('The report-fee business refund was not confirmed.');
          }
        } else if (debitedPersonalBalance !== null) {
          const refundResult: any = await client.graphql({
            query: UPDATE_REPORT_PERSONAL_BALANCE,
            variables: {
              input: {
                awsemail: personalAccount.awsemail,
                balance: Number(personalAccount.balance),
              },
              condition: { balance: { eq: debitedPersonalBalance } },
            },
          });
          if (!refundResult?.data?.updateSMAccount?.awsemail) {
            throw new Error('The report-fee personal refund was not confirmed.');
          }
        }
      } catch (refundError) {
        console.error('Report fee company credit failed and the payer refund was not confirmed:', {
          creditError: error,
          refundError,
          payer: payerBranch.BusKntct,
          amountChf,
        });
        throw new Error('REPORT_FEE_REFUND_FAILED');
      }
      console.error('Report fee company credit failed; the payer debit was reversed:', error);
      throw new Error('REPORT_FEE_CREDIT_FAILED');
    }
    return true;
  };

  const createPerformanceReportPdf = async (recordsForReport: PerformanceRecord[], asOf: Date) => {
    if (!recordsForReport.length || fromDate > toDate) {
      throw new Error('Report data is not ready to export.');
    }
    setReportExporting(true);
    try {
      const businessName = selectedOrganization?.name || selectedBusiness?.busName || t('selectBusiness');
      const branchNames = new Map(
        (selectedOrganization?.branches || businesses).map(branch => [branch.BusKntct, branch.busName])
      );
      const reportRecords = recordsForReport.filter(
        record => record.recordType === 'REVENUE' || record.recordType === 'EXPENSE'
      );
      const reportTotals = calculatePerformanceTotals(reportRecords);
      const reportChartBuckets = buildPerformanceChartBuckets(reportRecords, fromDate, toDate);
      const rows = reportRecords.map(record => {
        const details = [record.itemName, record.category, record.description].filter(Boolean).join(' · ');
        return `
          <tr>
            <td>${escapeHtml(new Date(record.occurredAt).toLocaleDateString())}</td>
            <td>${escapeHtml(branchNames.get(record.businessAccount) || businessName)}</td>
            <td>${escapeHtml(t(record.recordType === 'REVENUE' ? 'revenue' : 'expenses'))}</td>
            <td>${escapeHtml(details || '—')}</td>
            <td class="number">${escapeHtml(formatMoney(Number(record.amountKes) || 0))}</td>
            <td class="number">${escapeHtml(formatMoney(Number(record.feesKes) || 0))}</td>
            <td>${escapeHtml(record.source)}</td>
          </tr>`;
      }).join('');
      const summaryCards = [
        { label: t('revenue'), value: formatMoney(reportTotals.revenue) },
        { label: t('expenses'), value: formatMoney(reportTotals.expenses) },
        { label: t('profit'), value: formatMoney(reportTotals.revenue - reportTotals.expenses) },
      ].map(card => `
        <div class="summary-card">
          <div class="label">${escapeHtml(card.label)}</div>
          <strong>${escapeHtml(card.value)}</strong>
        </div>`).join('');
      const html = `
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              @page { margin: 18mm 12mm; }
              body { color: #243a4a; font-family: Arial, sans-serif; font-size: 10px; }
              h1 { margin-bottom: 4px; font-size: 22px; }
              .subtitle { color: #63727d; margin: 4px 0; }
              .summary { display: flex; gap: 10px; margin: 20px 0; }
              .summary-card { flex: 1; background: #f4f8fb; padding: 12px; border-radius: 6px; }
              .label { color: #53636e; margin-bottom: 5px; }
              h2 { margin: 18px 0 8px; font-size: 15px; }
              h3 { margin: 12px 0 6px; font-size: 12px; }
              .legend { margin: 8px 0; }
              .legend-item { display: inline-block; margin-right: 14px; }
              .legend-item i { display: inline-block; width: 10px; height: 10px; margin-right: 4px; }
              svg { display: block; width: 100%; height: auto; margin-bottom: 10px; page-break-inside: avoid; }
              .axis-label { fill: #63727d; font-size: 10px; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border-bottom: 1px solid #dce3e8; padding: 7px 5px; text-align: left; vertical-align: top; }
              th { background: #f4f8fb; }
              .number { text-align: right; white-space: nowrap; }
              thead { display: table-header-group; }
              tr { page-break-inside: avoid; }
            </style>
          </head>
          <body>
            <h1>${escapeHtml(t('businessPerformance'))}</h1>
            <p class="subtitle"><strong>${escapeHtml(businessName)}</strong></p>
            <p class="subtitle">${escapeHtml(t('from'))}: ${escapeHtml(fromDate.toLocaleDateString())}
              &nbsp;&nbsp; ${escapeHtml(t('to'))}: ${escapeHtml(toDate.toLocaleDateString())}</p>
            <p class="subtitle">${escapeHtml(t('reportAsOf'))}: ${escapeHtml(asOf.toLocaleString())}</p>
            <div class="summary">${summaryCards}</div>
            ${buildReportCharts(reportChartBuckets, displayCurrency, formatMoney, {
              heading: t('performanceCharts'),
              bars: t('performanceBars'),
              lines: t('performanceLines'),
              revenue: t('revenue'),
              expenses: t('expenses'),
              profit: t('profit'),
            })}
            <h2>${escapeHtml(t('reportTransactions'))} (${reportRecords.length})</h2>
            <table>
              <thead><tr>
                <th>${escapeHtml(t('reportDate'))}</th>
                <th>${escapeHtml(t('reportBranch'))}</th>
                <th>${escapeHtml(t('reportType'))}</th>
                <th>${escapeHtml(t('reportDetails'))}</th>
                <th class="number">${escapeHtml(t('reportAmount'))}</th>
                <th class="number">${escapeHtml(t('reportFees'))}</th>
                <th>${escapeHtml(t('reportSource'))}</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </body>
        </html>`;
      const { uri } = await printToFileAsync({ html });
      if (!uri) throw new Error('PDF generation did not return a file URI.');
      return uri;
    } catch (error) {
      console.error('Failed to export business performance report:', error);
      throw error;
    } finally {
      setReportExporting(false);
    }
  };

  const confirmReportAction = async (
    action: 'view' | 'download',
    payerBranch: Business,
    recordsForReport: PerformanceRecord[],
    asOf: Date
  ) => {
    const amountChf = action === 'view' ? viewFeeChf : downloadFeeChf;
    let preparedPdfUri: string | null = null;
    if (action === 'download') {
      try {
        preparedPdfUri = await createPerformanceReportPdf(recordsForReport, asOf);
      } catch {
        Alert.alert(t('reportExportFailed'), t('tryAgain'));
        return;
      }
    }
    let amount: string;
    try {
      amount = formatReportFee(amountChf);
    } catch (error) {
      console.error('Unable to convert business performance report fee:', error);
      Alert.alert(t('reportFeeCurrencyUnavailable'));
      return;
    }
    const businessName = payerBranch.busName || payerBranch.BusKntct;
    Alert.alert(
      t(action === 'view' ? 'reportViewFeeTitle' : 'reportDownloadFeeTitle'),
      t(action === 'view' ? 'reportViewFeeConfirmation' : 'reportDownloadFeeConfirmation', {
        amount,
        business: businessName,
      }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('proceedToReport'),
          onPress: () => {
            void (async () => {
              setReportFeeProcessing(true);
              let feeCharged = false;
              try {
                const charged = await chargeReportFee(amountChf, payerBranch, action);
                if (!charged) return;
                feeCharged = true;
                if (action === 'view') {
                  setAuthorizedReportKey(reportSelectionKey);
                } else if (preparedPdfUri) {
                  await shareFile(preparedPdfUri, t('downloadReport'));
                }
              } catch (error) {
                console.error('Failed to process business performance report fee:', error);
                if (error instanceof Error && error.message === 'REPORT_FEE_REFUND_FAILED') {
                  Alert.alert(t('reportChargeFailed'), t('reportRefundFailed'));
                } else if (feeCharged && action === 'download') {
                  Alert.alert(t('reportExportFailed'), t('reportShareFailedAfterCharge'));
                } else if (error instanceof Error && error.message === 'REPORT_INSUFFICIENT_FUNDS') {
                  Alert.alert(t('reportChargeFailed'), t('reportInsufficientFunds'));
                } else if (error instanceof Error && error.message === 'REPORT_FEES_NOT_CONFIGURED') {
                  Alert.alert(t('reportFeesNotConfigured'));
                } else if (error instanceof Error && error.message === 'REPORT_FEES_CHANGED') {
                  Alert.alert(t('reportFeeChanged'));
                } else {
                  Alert.alert(t('reportChargeFailed'), t('tryAgain'));
                }
              } finally {
                setReportFeeProcessing(false);
              }
            })();
          },
        },
      ]
    );
  };

  const startReportAction = async (action: 'view' | 'download', selectedPayer?: Business) => {
    if (reportFeeProcessing || reportExporting || fromDate > toDate) return;
    if (action === 'download' && (!reportIsAuthorized || recordsLoading)) return;
    if (action === 'view' && reportIsAuthorized) return;
    const payerBranches = selectedOrganization?.branches
      || (selectedBusiness ? [selectedBusiness] : []);
    if (!payerBranches.length) return;
    if (!selectedPayer && selectedOrganization && payerBranches.length > 1) {
      setPayerAction(action);
      setPayerPickerVisible(true);
      return;
    }
    const payerBranch = selectedPayer || payerBranches[0];
    setRecordsLoading(true);
    setRecordsLoadFailed(false);
    try {
      const refreshedRecords = await fetchPerformanceRecords(selectedAccountIds);
      const asOf = new Date();
      const recordsForReport = filterPerformanceRecords(
        refreshedRecords,
        selectedAccountIds,
        fromDate,
        toDate,
        asOf
      );
      setRecords(refreshedRecords);
      setReportAsOf(asOf);
      await confirmReportAction(action, payerBranch, recordsForReport, asOf);
    } catch (error) {
      console.error('Failed to refresh performance data for the current report:', error);
      setRecordsLoadFailed(true);
      Alert.alert(t('loadAnalyticsFailed'), t('tryAgain'));
    } finally {
      setRecordsLoading(false);
    }
  };

  const chartBuckets = useMemo(() => {
    return buildPerformanceChartBuckets(businessRecords, fromDate, toDate);
  }, [businessRecords, fromDate, toDate]);

  const showPerformanceBucketDetails = (bucket: ChartBucket) => {
    const requestId = ++performanceDetailRequestId.current;
    const periodKey = String(bucket.periodStart.getTime());
    setSelectedPerformancePeriodKey(periodKey);
    setLoadingPerformancePeriodKey(periodKey);
    setPerformanceDetails(null);
    InteractionManager.runAfterInteractions(() => {
      if (requestId !== performanceDetailRequestId.current) return;
      const start = bucket.periodStart.getTime();
      const through = new Date(
        bucket.periodEnd.getFullYear(),
        bucket.periodEnd.getMonth(),
        bucket.periodEnd.getDate() + 1
      ).getTime() - 1;
      const periodRecords = businessRecords.filter(record => {
        const occurredAt = new Date(record.occurredAt).getTime();
        return Number.isFinite(occurredAt) && occurredAt >= start && occurredAt <= through;
      });
      setPerformanceDetails({ bucket, totals: calculatePerformanceTotals(periodRecords) });
      setLoadingPerformancePeriodKey(null);
    });
  };

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
      const savedRecord = result?.data?.createBusinessPerformanceRecord as PerformanceRecord | null | undefined;
      if (!savedRecord?.id) {
        throw new Error(t('entryNotSaved'));
      }
      setRecords(currentRecords => [
        ...currentRecords.filter(record => record.id !== savedRecord.id),
        savedRecord,
      ]);
      setReportAsOf(new Date());
      resetEntry();
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
          query: UPDATE_BIZNA_ORGANIZATION,
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
        {t('noBusinessRecords')}
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
  let reportFeeDisclosure: string;
  let viewReportLabel: string;
  let downloadFeeDisplay: string;
  let reportFeeCurrencyAvailable = true;
  if (reportFeeSettingsLoading) {
    reportFeeCurrencyAvailable = false;
    reportFeeDisclosure = t('reportFeesLoading');
    viewReportLabel = t('reportFeesLoading');
    downloadFeeDisplay = '';
  } else if (reportFeeSettingsFailed) {
    reportFeeCurrencyAvailable = false;
    reportFeeDisclosure = t('reportFeesLoadFailed');
    viewReportLabel = t('reportFeesLoadFailed');
    downloadFeeDisplay = '';
  } else if (!reportFeeRates) {
    reportFeeCurrencyAvailable = false;
    reportFeeDisclosure = t('reportFeesNotConfigured');
    viewReportLabel = t('reportFeesNotConfigured');
    downloadFeeDisplay = '';
  } else try {
    const viewFeeDisplay = formatReportFee(viewFeeChf);
    downloadFeeDisplay = formatReportFee(downloadFeeChf);
    reportFeeDisclosure = t('reportFeesDisclosure', {
      viewAmount: viewFeeDisplay,
      downloadAmount: downloadFeeDisplay,
    });
    viewReportLabel = t('viewReport', { amount: viewFeeDisplay });
  } catch {
    reportFeeCurrencyAvailable = false;
    reportFeeDisclosure = t('reportFeeCurrencyUnavailable');
    viewReportLabel = t('reportFeeCurrencyUnavailable');
    downloadFeeDisplay = '';
  }

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
                  setAuthorizedReportKey('');
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
              setAuthorizedReportKey('');
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
              setAuthorizedReportKey('');
              setReportAsOf(new Date());
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

      <View style={{ marginTop: 12, padding: 12, borderRadius: 9, backgroundColor: '#fff8e8' }}>
        <Text style={{ color: '#704d00', lineHeight: 20 }}>{reportFeeDisclosure}</Text>
        {reportFeeSettingsFailed && (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => void loadReportFeeSettings()}
            style={{ alignSelf: 'flex-start', marginTop: 8 }}
          >
            <Text style={{ color: '#1678b9', fontWeight: '700' }}>{t('tryAgain')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {!reportIsAuthorized && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={viewReportLabel}
          accessibilityState={{ disabled: reportFeeProcessing || reportExporting || recordsLoading || recordsLoadFailed || !selectedAccountIds.length || fromDate > toDate || !reportFeeCurrencyAvailable || !reportFeesReady, busy: reportFeeProcessing }}
          disabled={reportFeeProcessing || reportExporting || recordsLoading || recordsLoadFailed || !selectedAccountIds.length || fromDate > toDate || !reportFeeCurrencyAvailable || !reportFeesReady}
          onPress={() => startReportAction('view')}
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 12,
            marginTop: 12,
            borderRadius: 9,
            backgroundColor: reportFeeProcessing || reportExporting || recordsLoading || recordsLoadFailed || !selectedAccountIds.length || fromDate > toDate || !reportFeesReady ? '#aab8c2' : '#1678b9',
          }}
        >
          {reportFeeProcessing
            ? <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
            : <Ionicons name="eye-outline" size={18} color="#fff" style={{ marginRight: 8 }} />}
          <Text style={{ color: '#fff', fontWeight: '800' }}>
            {reportFeeProcessing ? t('reportExportingFee') : viewReportLabel}
          </Text>
        </TouchableOpacity>
      )}

      {reportIsAuthorized && businessRecords.length > 0 && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`${t('downloadReport')} · ${downloadFeeDisplay}`}
          accessibilityState={{ disabled: reportFeeProcessing || reportExporting || !reportFeeCurrencyAvailable || !reportFeesReady, busy: reportExporting || reportFeeProcessing }}
          disabled={reportFeeProcessing || reportExporting || !reportFeeCurrencyAvailable || !reportFeesReady}
          onPress={() => startReportAction('download')}
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 12,
            marginTop: 12,
            borderRadius: 9,
            backgroundColor: reportFeeProcessing || reportExporting || !reportFeesReady ? '#aab8c2' : '#1678b9',
          }}
        >
          {reportExporting || reportFeeProcessing
            ? <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
            : <Ionicons name="download-outline" size={18} color="#fff" style={{ marginRight: 8 }} />}
          <Text style={{ color: '#fff', fontWeight: '800' }}>
            {reportExporting ? t('reportExporting') : reportFeeProcessing
              ? t('reportExportingFee')
              : `${t('downloadReport')} · ${downloadFeeDisplay}`}
          </Text>
        </TouchableOpacity>
      )}

      {reportIsAuthorized && (
        <>
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
          <Text style={{ color: '#63727d', fontSize: 12, marginTop: 8 }}>
            {t('reportAsOf')}: {reportAsOf.toLocaleString()}
          </Text>

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
              <BusinessPerformanceBarChart
                buckets={chartBuckets}
                selected={chartSelection}
                onSelect={setChartSelection}
                onSelectBucket={showPerformanceBucketDetails}
                selectedPeriodKey={selectedPerformancePeriodKey}
                loadingPeriodKey={loadingPerformancePeriodKey}
              />
              <BusinessPerformanceTrendChart
                buckets={chartBuckets}
                currency={displayCurrency}
                formatMoney={formatMoney}
                selected={chartSelection}
                onSelect={setChartSelection}
                onSelectBucket={showPerformanceBucketDetails}
                selectedPeriodKey={selectedPerformancePeriodKey}
                loadingPeriodKey={loadingPerformancePeriodKey}
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
        </>
      )}

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

      <Modal
        visible={Boolean(performanceDetails)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          performanceDetailRequestId.current += 1;
          setPerformanceDetails(null);
        }}
      >
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)', padding: 18 }}>
          <View style={{ padding: 18, borderRadius: 14, backgroundColor: '#fff' }}>
            {performanceDetails && (
              <>
                <Text style={{ color: '#243a4a', fontWeight: '800', fontSize: 18 }}>
                  {t('performancePointDetails', {
                    date: performanceDetails.bucket.periodStart.toLocaleDateString() === performanceDetails.bucket.periodEnd.toLocaleDateString()
                      ? performanceDetails.bucket.periodStart.toLocaleDateString()
                      : `${performanceDetails.bucket.periodStart.toLocaleDateString()} – ${performanceDetails.bucket.periodEnd.toLocaleDateString()}`,
                  })}
                </Text>
                <Text style={{ color: '#63727d', marginTop: 10, fontWeight: '700' }}>{t('all')}</Text>
                {[
                  { label: t('revenue'), value: performanceDetails.totals.revenue, color: '#14804a' },
                  { label: t('expenses'), value: performanceDetails.totals.expenses, color: '#c46919' },
                  { label: t('profit'), value: performanceDetails.totals.revenue - performanceDetails.totals.expenses, color: '#1769aa' },
                ].map(item => (
                  <View key={item.label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                    <Text style={{ color: '#53636e' }}>{item.label}</Text>
                    <Text style={{ color: item.color, fontWeight: '800' }}>{formatMoney(item.value)}</Text>
                  </View>
                ))}
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => {
                    performanceDetailRequestId.current += 1;
                    setPerformanceDetails(null);
                  }}
                  style={{ alignSelf: 'flex-end', paddingVertical: 12, paddingHorizontal: 8, marginTop: 8 }}
                >
                  <Text style={{ color: '#1678b9', fontWeight: '700' }}>{t('cancel')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={payerPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setPayerPickerVisible(false);
          setPayerAction(null);
        }}
      >
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)', padding: 18 }}>
          <View style={{ padding: 18, borderRadius: 14, backgroundColor: '#fff' }}>
            <Text style={{ fontWeight: '800', fontSize: 18, color: '#243a4a' }}>{t('chooseReportPayer')}</Text>
            <Text style={{ color: '#63727d', marginTop: 6, marginBottom: 10 }}>{t('reportPayerInstruction')}</Text>
            {(selectedOrganization?.branches || []).map(branch => (
              <TouchableOpacity
                key={branch.BusKntct}
                onPress={() => {
                  const action = payerAction;
                  setPayerPickerVisible(false);
                  setPayerAction(null);
                  if (action) void startReportAction(action, branch);
                }}
                style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5ebef' }}
              >
                <Text style={{ color: '#1678b9', fontWeight: '700' }}>{branch.busName}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => {
                setPayerPickerVisible(false);
                setPayerAction(null);
              }}
              style={{ alignSelf: 'flex-end', paddingVertical: 12, paddingHorizontal: 8 }}
            >
              <Text style={{ color: '#63727d', fontWeight: '700' }}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
