import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Svg, { Line, Polyline, Text as SvgText } from 'react-native-svg';
import { generateClient } from 'aws-amplify/api';
import {
  createBusinessPerformanceTarget,
  deleteBusinessPerformanceTarget,
  updateBusinessPerformanceTarget,
} from '../../../src/graphql/mutations';
import {
  businessPerformanceTargetsByBusiness,
  businessPerformanceTargetsByOrganization,
} from '../../../src/graphql/queries';
import { useBusinessPerformanceTranslation } from './translation';

const client = generateClient();
const DAY_MS = 24 * 60 * 60 * 1000;

type Method = 'HISTORICAL' | 'FIXED' | 'FORMULA';
type Metric = 'PROFIT' | 'REVENUE' | 'EXPENSES';
type Period = 'DAILY' | 'WEEKLY' | 'MONTHLY';

type Target = {
  id: string;
  businessAccount?: string | null;
  organizationId?: string | null;
  name: string;
  method: Method;
  metric: Metric;
  period: Period;
  amountKes?: number | null;
  baselineYear?: number | null;
  marginPercent?: number | null;
  startDate: string;
  endDate: string;
  createdByEmail: string;
};

type RecordRow = {
  businessAccount: string;
  recordType: string;
  amountKes: number;
  feesKes?: number | null;
  occurredAt: string;
};

type Business = {
  BusKntct: string;
  busName: string;
};

type Props = {
  business: Business;
  organizationId?: string;
  records: RecordRow[];
  fromDate: Date;
  toDate: Date;
  email: string;
  formatMoney: (amount: number) => string;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const localDateString = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parseDateInput = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day
    ? null
    : date;
};

const normalizePeriod = (date: Date, period: Period) => {
  const normalized = startOfDay(date);
  if (period === 'WEEKLY') normalized.setDate(normalized.getDate() - normalized.getDay());
  if (period === 'MONTHLY') normalized.setDate(1);
  return normalized;
};

const dateForYear = (date: Date, year: number) => {
  const month = date.getMonth();
  const day = Math.min(date.getDate(), new Date(year, month + 1, 0).getDate());
  return new Date(year, month, day);
};

const metrics: Array<{ value: Metric; label: string }> = [
  { value: 'PROFIT', label: '' },
  { value: 'REVENUE', label: '' },
  { value: 'EXPENSES', label: '' },
];
const periods: Array<{ value: Period; label: string }> = [
  { value: 'DAILY', label: '' },
  { value: 'WEEKLY', label: '' },
  { value: 'MONTHLY', label: '' },
];

const metricValue = (records: RecordRow[], metric: Metric) => records.reduce((sum, record) => {
  const value = Number(record.amountKes || 0);
  const expenses = value + Number(record.feesKes || 0);
  if (metric === 'REVENUE' && record.recordType === 'REVENUE') return sum + value;
  if (metric === 'EXPENSES' && record.recordType === 'EXPENSE') return sum + expenses;
  if (metric === 'PROFIT') {
    if (record.recordType === 'REVENUE') return sum + value;
    if (record.recordType === 'EXPENSE') return sum - expenses;
  }
  return sum;
}, 0);

const TargetSeriesChart = ({
  target,
  records,
  fromDate,
  toDate,
  formatMoney,
}: {
  target: Target;
  records: RecordRow[];
  fromDate: Date;
  toDate: Date;
  formatMoney: (amount: number) => string;
}) => {
  const t = useBusinessPerformanceTranslation();
  const historicalDataAvailable = target.method !== 'HISTORICAL'
    || records.some(record => new Date(record.occurredAt).getFullYear() === target.baselineYear);
  const points = useMemo(() => {
    const from = startOfDay(fromDate);
    const through = startOfDay(toDate);
    if (from > through) return [];
    const rangeStart = parseDateInput(target.startDate);
    const rangeEnd = parseDateInput(target.endDate);
    if (!rangeStart || !rangeEnd) return [];

    const buckets: Array<{ label: string; actual: number; target?: number }> = [];
    for (let cursor = normalizePeriod(from, target.period); cursor <= through; ) {
      const periodStart = new Date(cursor);
      const periodEnd = target.period === 'DAILY'
        ? new Date(periodStart)
        : target.period === 'WEEKLY'
          ? new Date(periodStart.getTime() + 6 * DAY_MS)
          : new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);
      const clippedStart = periodStart < from ? from : periodStart;
      const clippedEnd = periodEnd > through ? through : periodEnd;
      const applies = clippedEnd >= rangeStart && clippedStart <= rangeEnd;
      const currentRecords = records.filter(record => {
        const time = new Date(record.occurredAt).getTime();
        return Number.isFinite(time) && time >= clippedStart.getTime() && time < clippedEnd.getTime() + DAY_MS;
      });
      const actual = target.method === 'FORMULA'
        ? metricValue(currentRecords, 'REVENUE')
        : metricValue(currentRecords, target.metric);
      let targetValue: number | undefined;
      if (applies && target.method === 'FIXED') targetValue = Number(target.amountKes);
      if (applies && target.method === 'FORMULA') {
        targetValue = metricValue(currentRecords, 'EXPENSES') * (1 + Number(target.marginPercent || 0) / 100);
      }
      if (applies && historicalDataAvailable && target.method === 'HISTORICAL' && target.baselineYear) {
        const comparisonStart = normalizePeriod(
          dateForYear(periodStart, target.baselineYear),
          target.period
        );
        const comparisonEnd = target.period === 'DAILY'
          ? comparisonStart
          : target.period === 'WEEKLY'
            ? new Date(comparisonStart.getTime() + 6 * DAY_MS)
            : new Date(comparisonStart.getFullYear(), comparisonStart.getMonth() + 1, 0);
        const baselineRecords = records.filter(record => {
          const time = new Date(record.occurredAt).getTime();
          return Number.isFinite(time)
            && time >= comparisonStart.getTime()
            && time < comparisonEnd.getTime() + DAY_MS;
        });
        targetValue = metricValue(baselineRecords, target.metric);
      }
      const label = target.period === 'MONTHLY'
        ? periodStart.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
        : periodStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      buckets.push({ label, actual, target: targetValue });

      if (target.period === 'DAILY') cursor.setDate(cursor.getDate() + 1);
      else if (target.period === 'WEEKLY') cursor.setDate(cursor.getDate() + 7);
      else cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
    return buckets;
  }, [target, records, fromDate, toDate, historicalDataAvailable]);

  if (!points.length) return null;

  const width = Math.max(320, points.length * 52);
  const height = 190;
  const padding = { top: 16, right: 12, bottom: 36, left: 12 };
  const values = points.flatMap(point => [point.actual, ...(point.target === undefined ? [] : [point.target])]);
  const min = Math.min(0, ...values);
  const max = Math.max(1, ...values);
  const scaleY = (value: number) =>
    padding.top + ((max - value) / (max - min || 1)) * (height - padding.top - padding.bottom);
  const x = (index: number) => padding.left + index * ((width - padding.left - padding.right) / Math.max(1, points.length - 1));
  const actualPoints = points.map((point, index) => `${x(index)},${scaleY(point.actual)}`).join(' ');
  const targetPoints = points
    .map((point, index) => point.target === undefined ? null : `${x(index)},${scaleY(point.target)}`)
    .filter(Boolean)
    .join(' ');
  const historical = target.method === 'HISTORICAL';

  return (
    <View style={{ marginTop: 16 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
        <Text style={{ color: '#1769aa', fontWeight: '700', marginRight: 14 }}>
          — {t('targetActualLabel', {
            metric: t(target.method === 'FORMULA' ? 'revenue' : target.metric.toLowerCase() as 'profit' | 'revenue' | 'expenses'),
          })}
        </Text>
        <Text style={{ color: '#b42318', fontWeight: '700' }}>
          {historical ? `- - ${t('targetBaselineLabel')}` : `- - ${t('targetGoalLabel')}`}
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <Svg width={width} height={height}>
          {[0, 0.5, 1].map(fraction => {
            const y = padding.top + fraction * (height - padding.top - padding.bottom);
            return (
              <Line
                key={fraction}
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="#dce4e9"
                strokeWidth={1}
              />
            );
          })}
          <Polyline points={actualPoints} fill="none" stroke="#1769aa" strokeWidth={2.5} />
          {targetPoints.length > 0 && (
            <Polyline
              points={targetPoints}
              fill="none"
              stroke="#b42318"
              strokeWidth={2}
              strokeDasharray="5,4"
            />
          )}
          {points.map((point, index) => (
            <SvgText
              key={`${point.label}-${index}`}
              x={x(index)}
              y={height - 12}
              fill="#63727d"
              fontSize="9"
              textAnchor="middle"
            >
              {point.label}
            </SvgText>
          ))}
        </Svg>
      </ScrollView>
      {points.length > 0 && (
        <Text style={{ color: '#63727d', fontSize: 12, marginTop: 4 }}>
          {t('latestActual', { amount: formatMoney(points[points.length - 1].actual) })}
          {points[points.length - 1].target === undefined
            ? ''
            : ` · ${t('target')}: ${formatMoney(points[points.length - 1].target as number)}`}
        </Text>
      )}
      {!historicalDataAvailable && (
        <Text style={{ color: '#a15c00', fontSize: 12, marginTop: 5 }}>
          {t('noHistoricalRecords', { year: target.baselineYear })}
        </Text>
      )}
    </View>
  );
};

const BusinessTargets = ({ business, organizationId, records, fromDate, toDate, email, formatMoney }: Props) => {
  const t = useBusinessPerformanceTranslation();
  const [targets, setTargets] = useState<Target[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingTargetId, setEditingTargetId] = useState('');
  const [name, setName] = useState('');
  const [method, setMethod] = useState<Method>('FIXED');
  const [metric, setMetric] = useState<Metric>('PROFIT');
  const [period, setPeriod] = useState<Period>('DAILY');
  const [amount, setAmount] = useState('');
  const [baselineYear, setBaselineYear] = useState(String(new Date().getFullYear() - 1));
  const [marginPercent, setMarginPercent] = useState('25');
  const [startDate, setStartDate] = useState(localDateString(fromDate));
  const [endDate, setEndDate] = useState(localDateString(toDate));
  const [datePickerTarget, setDatePickerTarget] = useState<'start' | 'end' | null>(null);

  const loadTargets = useCallback(async () => {
    let allTargets: Target[] = [];
    let nextToken: string | null = null;
    do {
      const result: any = await client.graphql({
        query: organizationId
          ? businessPerformanceTargetsByOrganization
          : businessPerformanceTargetsByBusiness,
        variables: {
          ...(organizationId
            ? { organizationId }
            : { businessAccount: business.BusKntct }),
          limit: 500,
          nextToken,
        },
      });
      const page = organizationId
        ? result?.data?.businessPerformanceTargetsByOrganization
        : result?.data?.businessPerformanceTargetsByBusiness;
      allTargets = allTargets.concat(page?.items || []);
      nextToken = page?.nextToken || null;
    } while (nextToken);
    setTargets(allTargets);
    setSelectedTargetId(current => allTargets.some(target => target.id === current) ? current : allTargets[0]?.id || '');
  }, [business.BusKntct, organizationId]);

  useEffect(() => {
    loadTargets().catch(error => {
      console.error('Failed to load business performance targets:', error);
      Alert.alert(t('loadTargetsFailed'), t('tryAgain'));
    });
  }, [loadTargets, t]);

  const selectedTarget = useMemo(
    () => targets.find(target => target.id === selectedTargetId) || null,
    [targets, selectedTargetId]
  );

  const resetForm = () => {
    setVisible(false);
    setDatePickerTarget(null);
    setEditingTargetId('');
    setName('');
    setMethod('FIXED');
    setMetric('PROFIT');
    setPeriod('DAILY');
    setAmount('');
    setBaselineYear(String(new Date().getFullYear() - 1));
    setMarginPercent('25');
    setStartDate(localDateString(fromDate));
    setEndDate(localDateString(toDate));
  };

  const saveTarget = async () => {
    const starts = parseDateInput(startDate);
    const ends = parseDateInput(endDate);
    const amountValue = Number(amount);
    const yearValue = Number(baselineYear);
    const marginValue = Number(marginPercent);
    if (!name.trim()) return Alert.alert(t('enterTargetName'));
    if (!starts || !ends || starts > ends) return Alert.alert(t('validTargetRange'));
    if (method === 'FIXED' && (!Number.isFinite(amountValue) || amountValue <= 0)) {
      return Alert.alert(t('validTargetAmount'));
    }
    if (method === 'HISTORICAL' && (!Number.isInteger(yearValue) || yearValue < 1900 || yearValue >= starts.getFullYear())) {
      return Alert.alert(t('baselineBeforeStart'));
    }
    if (method === 'FORMULA' && (!Number.isFinite(marginValue) || marginValue < 0 || marginValue > 10000)) {
      return Alert.alert(t('validMargin'));
    }

    setSaving(true);
    try {
      const targetInput = {
        businessAccount: organizationId ? null : business.BusKntct,
        organizationId: organizationId || null,
        name: name.trim(),
        method,
        metric: method === 'FORMULA' ? 'REVENUE' : metric,
        period,
        amountKes: method === 'FIXED' ? amountValue : null,
        baselineYear: method === 'HISTORICAL' ? yearValue : null,
        marginPercent: method === 'FORMULA' ? marginValue : null,
        startDate,
        endDate,
        ...(!editingTargetId ? { createdByEmail: email } : {}),
      };
      const result: any = await client.graphql({
        query: editingTargetId ? updateBusinessPerformanceTarget : createBusinessPerformanceTarget,
        variables: {
          input: {
            ...targetInput,
            ...(editingTargetId ? { id: editingTargetId } : {}),
          },
        },
      });
      const savedTarget = editingTargetId
        ? result?.data?.updateBusinessPerformanceTarget
        : result?.data?.createBusinessPerformanceTarget;
      if (!savedTarget?.id) {
        throw new Error(t('saveTargetFailed'));
      }
      await loadTargets();
      setSelectedTargetId(savedTarget.id);
      resetForm();
    } catch (error) {
      console.error('Failed to save business performance target:', error);
      Alert.alert(t('saveTargetFailed'), t('checkDetails'));
    } finally {
      setSaving(false);
    }
  };

  const editSelectedTarget = () => {
    if (!selectedTarget) return;
    setEditingTargetId(selectedTarget.id);
    setName(selectedTarget.name);
    setMethod(selectedTarget.method);
    setMetric(selectedTarget.metric);
    setPeriod(selectedTarget.period);
    setAmount(selectedTarget.amountKes == null ? '' : String(selectedTarget.amountKes));
    setBaselineYear(selectedTarget.baselineYear == null ? '' : String(selectedTarget.baselineYear));
    setMarginPercent(selectedTarget.marginPercent == null ? '25' : String(selectedTarget.marginPercent));
    setStartDate(selectedTarget.startDate);
    setEndDate(selectedTarget.endDate);
    setDatePickerTarget(null);
    setVisible(true);
  };

  const openNewTarget = () => {
    setEditingTargetId('');
    setStartDate(localDateString(fromDate));
    setEndDate(localDateString(toDate));
    setDatePickerTarget(null);
    setVisible(true);
  };

  const dateButton = (label: string, value: string, target: 'start' | 'end') => {
    const date = parseDateInput(value);
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${date?.toLocaleDateString() || value}`}
        onPress={() => setDatePickerTarget(target)}
        style={[inputStyle, { justifyContent: 'center', minHeight: 44 }]}
      >
        <Text style={{ color: date ? '#243a4a' : '#63727d' }}>
          {date ? date.toLocaleDateString() : 'Select date'}
        </Text>
      </TouchableOpacity>
    );
  };

  const removeSelectedTarget = () => {
    if (!selectedTarget) return;
    Alert.alert(t('deleteTargetConfirm'), `${t('targetName')}: ${selectedTarget.name}`, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('deleteTarget'),
        style: 'destructive',
        onPress: async () => {
          try {
            await client.graphql({
              query: deleteBusinessPerformanceTarget,
              variables: { input: { id: selectedTarget.id } },
            });
            await loadTargets();
          } catch (error) {
            console.error('Failed to delete business performance target:', error);
            Alert.alert(t('deleteTargetFailed'), t('tryAgain'));
          }
        },
      },
    ]);
  };

  const toggleOption = <T extends string,>(
    options: Array<{ value: T; label: string }>,
    selected: T,
    onSelect: (value: T) => void
  ) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
      {options.map(option => (
        <TouchableOpacity
          key={option.value}
          onPress={() => onSelect(option.value)}
          style={{
            paddingVertical: 7,
            paddingHorizontal: 10,
            borderRadius: 16,
            marginRight: 6,
            marginBottom: 6,
            backgroundColor: selected === option.value ? '#1678b9' : '#eef3f6',
          }}
        >
          <Text style={{ color: selected === option.value ? '#fff' : '#344955', fontSize: 12, fontWeight: '700' }}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={{ marginTop: 20, padding: 14, borderRadius: 12, backgroundColor: '#f8fafb' }}>
      <Text style={{ fontWeight: '800', color: '#243a4a', fontSize: 16 }}>{t('businessTargets')}</Text>
      <Text style={{ marginTop: 5, color: '#63727d', fontSize: 12 }}>
        {t('targetSummary')}
      </Text>

      {targets.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 11 }}>
          {targets.map(target => (
            <TouchableOpacity
              key={target.id}
              onPress={() => setSelectedTargetId(target.id)}
              style={{
                backgroundColor: selectedTargetId === target.id ? '#1678b9' : '#e8eef2',
                paddingVertical: 8,
                paddingHorizontal: 11,
                borderRadius: 18,
                marginRight: 7,
              }}
            >
              <Text style={{ color: selectedTargetId === target.id ? '#fff' : '#344955', fontWeight: '700', fontSize: 12 }}>
                {target.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {selectedTarget ? (
        <>
          <Text style={{ color: '#344955', fontSize: 12, marginTop: 8 }}>
            {selectedTarget.method === 'HISTORICAL'
              ? t('historicalComparedWith', {
                metric: t(selectedTarget.metric.toLowerCase() as 'profit' | 'revenue' | 'expenses'),
                year: selectedTarget.baselineYear || '',
              })
              : selectedTarget.method === 'FIXED'
                ? t('fixedTargetPer', {
                  metric: t(selectedTarget.metric.toLowerCase() as 'profit' | 'revenue' | 'expenses'),
                  amount: formatMoney(Number(selectedTarget.amountKes || 0)),
                  period: t(selectedTarget.period.toLowerCase() as 'daily' | 'weekly' | 'monthly'),
                })
                : t('formulaTargetPer', {
                  factor: 1 + Number(selectedTarget.marginPercent || 0) / 100,
                  period: t(selectedTarget.period.toLowerCase() as 'daily' | 'weekly' | 'monthly'),
                })}
          </Text>
          <TargetSeriesChart
            target={selectedTarget}
            records={records}
            fromDate={fromDate}
            toDate={toDate}
            formatMoney={formatMoney}
          />
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <TouchableOpacity onPress={editSelectedTarget} style={{ marginRight: 18 }}>
              <Text style={{ color: '#1678b9', fontWeight: '700' }}>{t('editTarget')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={removeSelectedTarget}>
              <Text style={{ color: '#b42318', fontWeight: '700' }}>{t('deleteTarget')}</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <Text style={{ color: '#63727d', marginTop: 10, fontSize: 12 }}>{t('noTargets')}</Text>
      )}

      <TouchableOpacity
        onPress={openNewTarget}
        style={{ marginTop: 12, padding: 12, borderRadius: 9, backgroundColor: '#1678b9', alignItems: 'center' }}
      >
        <Text style={{ color: '#fff', fontWeight: '800' }}>{t('setTarget')}</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={resetForm}>
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)', padding: 16 }}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ backgroundColor: '#fff', borderRadius: 14, padding: 18, marginVertical: 28 }}
          >
            <Text style={{ color: '#243a4a', fontWeight: '800', fontSize: 19 }}>
              {editingTargetId ? t('editTarget') : t('createTarget')}
            </Text>
            <Text style={{ color: '#63727d', fontSize: 12, marginTop: 4 }}>{business.busName}</Text>

            <Text style={fieldLabel}>{t('targetName')}</Text>
            <TextInput value={name} onChangeText={setName} placeholder={t('targetName')} style={inputStyle} />

            <Text style={fieldLabel}>{t('targetMethod')}</Text>
            {toggleOption([
              { value: 'HISTORICAL', label: t('historicalYear') },
              { value: 'FIXED', label: t('fixedAmount') },
              { value: 'FORMULA', label: t('revenueVsExpenses') },
            ], method, (value: Method) => setMethod(value))}

            {method !== 'FORMULA' && (
              <>
                <Text style={fieldLabel}>{t('metric')}</Text>
                {toggleOption(metrics.map(option => ({
                  ...option,
                  label: t(option.value.toLowerCase() as 'profit' | 'revenue' | 'expenses'),
                })), metric, (value: Metric) => setMetric(value))}
              </>
            )}

            <Text style={fieldLabel}>{t('compareBy')}</Text>
            {toggleOption(periods.map(option => ({
              ...option,
              label: t(option.value.toLowerCase() as 'daily' | 'weekly' | 'monthly'),
            })), period, (value: Period) => setPeriod(value))}

            {method === 'HISTORICAL' && (
              <>
                <Text style={fieldLabel}>{t('baselineYear')}</Text>
                <TextInput
                  value={baselineYear}
                  onChangeText={setBaselineYear}
                  keyboardType="number-pad"
                  placeholder="2024"
                  style={inputStyle}
                />
              </>
            )}
            {method === 'FIXED' && (
              <>
                <Text style={fieldLabel}>{t('targetAmountChf')}</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="25000000"
                  style={inputStyle}
                />
              </>
            )}
            {method === 'FORMULA' && (
              <>
                <Text style={fieldLabel}>{t('revenueMargin')}</Text>
                <TextInput
                  value={marginPercent}
                  onChangeText={setMarginPercent}
                  keyboardType="decimal-pad"
                  placeholder="25"
                  style={inputStyle}
                />
                <Text style={{ color: '#63727d', fontSize: 12, marginTop: 3 }}>
                  {t('formulaExplanation')}
                </Text>
              </>
            )}

            <Text style={fieldLabel}>{t('targetStarts')}</Text>
            {dateButton(t('targetStartDate'), startDate, 'start')}
            <Text style={fieldLabel}>{t('targetEnds')}</Text>
            {dateButton(t('targetEndDate'), endDate, 'end')}
            {datePickerTarget && (
              <DateTimePicker
                value={parseDateInput(datePickerTarget === 'start' ? startDate : endDate) || new Date()}
                mode="date"
                display="default"
                minimumDate={datePickerTarget === 'end' ? parseDateInput(startDate) || undefined : undefined}
                maximumDate={datePickerTarget === 'start' ? parseDateInput(endDate) || undefined : undefined}
                onChange={(_, selectedDate) => {
                  if (selectedDate) {
                    if (datePickerTarget === 'start') setStartDate(localDateString(selectedDate));
                    else setEndDate(localDateString(selectedDate));
                  }
                  setDatePickerTarget(null);
                }}
              />
            )}

            <View style={{ flexDirection: 'row', marginTop: 18 }}>
              <TouchableOpacity
                onPress={resetForm}
                disabled={saving}
                style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#eef3f6', alignItems: 'center', marginRight: 8 }}
              >
                <Text style={{ color: '#344955', fontWeight: '700' }}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveTarget}
                disabled={saving}
                style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#1678b9', alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '800' }}>
                  {saving ? t('saving') : editingTargetId ? t('editTarget') : t('saveEntry')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const fieldLabel = { color: '#344955', fontWeight: '700' as const, marginTop: 12, marginBottom: 5 };
const inputStyle = {
  borderWidth: 1,
  borderColor: '#d4dde3',
  borderRadius: 8,
  paddingHorizontal: 11,
  paddingVertical: 9,
  color: '#243a4a',
};

export default BusinessTargets;
