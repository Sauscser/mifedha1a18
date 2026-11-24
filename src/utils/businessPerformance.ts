import { generateClient } from 'aws-amplify/api';
import { createBusinessPerformanceRecord } from '../graphql/mutations';

const client = generateClient();

export type BusinessPerformanceEntryInput = {
  id?: string;
  ownerSub: string;
  businessAccount: string;
  recordType: 'REVENUE' | 'EXPENSE';
  amountKes: number;
  feesKes?: number;
  originalAmount?: number;
  currency?: string;
  exchangeRateToKes?: number;
  occurredAt: string;
  source: string;
  sourceReference?: string;
  itemName?: string;
  category?: string;
  quantity?: number;
  fulfillmentType?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
};

export async function saveBusinessPerformanceEntry(input: BusinessPerformanceEntryInput) {
  if (!input.ownerSub || !input.businessAccount) {
    throw new Error('Business analytics ownership information is missing.');
  }
  if (!Number.isFinite(input.amountKes) || input.amountKes < 0) {
    throw new Error('Business analytics amount must be a non-negative KES value.');
  }
  if (
    (input.latitude !== undefined && (!Number.isFinite(input.latitude) || input.latitude < -90 || input.latitude > 90))
    || (input.longitude !== undefined && (!Number.isFinite(input.longitude) || input.longitude < -180 || input.longitude > 180))
  ) {
    throw new Error('Business analytics coordinates are invalid.');
  }

  const result: any = await client.graphql({
    query: createBusinessPerformanceRecord,
    variables: { input },
  });
  const record = result?.data?.createBusinessPerformanceRecord;
  if (!record?.id) {
    throw new Error('The business performance record was not confirmed by the backend.');
  }
  return record;
}
