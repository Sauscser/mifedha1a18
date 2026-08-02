import { generateClient } from 'aws-amplify/api';
import { getSMAccount, getExRates, listExRates } from '../graphql/queries';
import { nationalityToCode } from './nationalityToCode';
const client = generateClient();

export const BASE_EXCHANGE_CURRENCY_ISO = 'CHF';
export const BASE_EXCHANGE_SYMBOL = 'CHF';

export const countryToCurrency: Record<string, string> = {
  KE: 'KES', UG: 'UGX', TZ: 'TZS', RW: 'RWF', NG: 'NGN', ZA: 'ZAR',
  US: 'USD', GB: 'GBP', EU: 'EUR', IN: 'INR', CN: 'CNY', JP: 'JPY',
  CA: 'CAD', AU: 'AUD', CH: 'CHF', AF: 'AFN', AL: 'ALL', DZ: 'DZD', AS: 'USD',
  AD: 'EUR', AO: 'AOA', AI: 'XCD', AG: 'XCD', AR: 'ARS', AM: 'AMD', AW: 'AWG',
  AT: 'EUR', AZ: 'AZN', BS: 'BSD', BH: 'BHD', BD: 'BDT', BB: 'BBD', BY: 'BYN',
  BE: 'EUR', BZ: 'BZD', BJ: 'XOF', BM: 'BMD', BT: 'BTN', BO: 'BOB', BA: 'BAM',
  BW: 'BWP', BR: 'BRL', BN: 'BND', BG: 'BGN', BF: 'XOF', BI: 'BIF', KH: 'KHR',
  
  CM: 'XAF', CV: 'CVE', KY: 'KYD', CF: 'XAF', TD: 'XAF', CL: 'CLP', CO: 'COP',
  CR: 'CRC', HR: 'EUR', CU: 'CUP', CY: 'EUR', CZ: 'CZK', DK: 'DKK', DJ: 'DJF',
  DO: 'DOP', EC: 'USD', EG: 'EGP', SV: 'USD', GQ: 'XAF', ER: 'ERN', EE: 'EUR',
  ET: 'ETB', FJ: 'FJD', FI: 'EUR', FR: 'EUR', GA: 'XAF', GM: 'GMD', GE: 'GEL',
  DE: 'EUR', GH: 'GHS', GR: 'EUR', GT: 'GTQ', HN: 'HNL', HK: 'HKD', HU: 'HUF',
  IS: 'ISK', ID: 'IDR', IR: 'IRR', IQ: 'IQD', IE: 'EUR', IL: 'ILS', IT: 'EUR',
  JM: 'JMD', JO: 'JOD', KZ: 'KZT', KI: 'AUD', KP: 'KPW', KR: 'KRW', KW: 'KWD',
  KG: 'KGS', LA: 'LAK', LV: 'EUR', LB: 'LBP', LS: 'LSL', LR: 'LRD', LY: 'LYD',
  LI: 'CHF', LT: 'EUR', LU: 'EUR', MO: 'MOP', MW: 'MWK', MY: 'MYR', MV: 'MVR',
  ML: 'XOF', MT: 'EUR', MH: 'USD', MQ: 'EUR', MR: 'MRU', MU: 'MUR', MX: 'MXN',
  FM: 'USD', MD: 'MDL', MC: 'EUR', MN: 'MNT', ME: 'EUR', MA: 'MAD', MZ: 'MZN',
  MM: 'MMK', NA: 'NAD', NR: 'AUD', NP: 'NPR', NL: 'EUR', NZ: 'NZD', NI: 'NIO',
  NE: 'XOF', NO: 'NOK', OM: 'OMR', PK: 'PKR', PA: 'PAB', PG: 'PGK', PY: 'PYG',
  PE: 'PEN', PH: 'PHP', PL: 'PLN', PT: 'EUR', QA: 'QAR', RO: 'RON', RU: 'RUB',
  SA: 'SAR', SN: 'XOF', RS: 'RSD', SG: 'SGD', SK: 'EUR', SI: 'EUR', ES: 'EUR',
  LK: 'LKR', SD: 'SDG', SR: 'SRD', SZ: 'SZL', SE: 'SEK', SY: 'SYP', TW: 'TWD',
  TJ: 'TJS', TH: 'THB', TL: 'USD', TG: 'XOF', TO: 'TOP', TT: 'TTD', TN: 'TND',
  TR: 'TRY', TM: 'TMT', UA: 'UAH', AE: 'AED', UY: 'UYU', UZ: 'UZS', VU: 'VUV',
  VE: 'VES', VN: 'VND', YE: 'YER', ZM: 'ZMW', ZW: 'ZWL', AX: 'EUR', BQ: 'USD',
  CW: 'ANG', PS: 'ILS', SS: 'SSP', XK: 'EUR', GG: 'GBP', IM: 'GBP', JE: 'GBP',
  SJ: 'NOK', BV: 'NOK', GS: 'GBP', PN: 'NZD', TK: 'NZD', WF: 'XPF', EH: 'MAD',
  GI: 'GIP', PM: 'EUR', RE: 'EUR', YT: 'EUR', GP: 'EUR', BL: 'EUR', MF: 'EUR',
  GF: 'EUR', PF: 'XPF', NC: 'XPF', SX: 'ANG', TC: 'USD', VG: 'USD', VI: 'USD',
  GW: 'XOF', KN: 'XCD', LC: 'XCD', VC: 'XCD', DM: 'XCD', GD: 'XCD', FK: 'FKP',
  GL: 'DKK', IO: 'USD', CC: 'AUD', CX: 'AUD'
};

const normalizeKey = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '');

const unique = (items: (string | undefined | null)[]) => {
  const set = new Set<string>();
  items.filter(Boolean).forEach((item) => set.add(String(item)));
  return Array.from(set);
};

const buildLookupCandidates = (raw: string) => {
  const key = raw.trim();
  const upper = key.toUpperCase();
  const compactUpper = key.replace(/\s+/g, '').toUpperCase();
  const isoFromCountry = upper.length === 2 ? countryToCurrency[upper] : undefined;
  const codeFromCountryName = upper.length > 2 ? nationalityToCode(key) : undefined;
  const isoFromCode = codeFromCountryName ? countryToCurrency[codeFromCountryName] : undefined;
  return unique([key, upper, compactUpper, isoFromCountry, codeFromCountryName, isoFromCode]);
};

/**
 * EXCHANGE RATE SEMANTICS:
 * 
 * buyingPrice = Foreign currency units per 1 CHF (what you GET when you sell CHF to the bank)
 * sellingPrice = Foreign currency units per 1 CHF (what it COSTS to buy that foreign currency from the bank)
 * 
 * DEPOSIT FLOW:
 * - User deposits in their home country currency
 * - Convert to CHF using sellingPrice (what the bank pays/acquires the foreign currency at)
 * - Store in database as CHF
 * 
 * DISPLAY FLOW:
 * - Display CHF balance back to user in their home currency
 * - Convert using buyingPrice (what the user theoretically receives if they sell CHF)
 */

export async function getUserNationalityByEmail(email: string): Promise<string | null> {
  try {
    const res: any = await client.graphql({
      query: getSMAccount,
      variables: { awsemail: email }
    });
    return res?.data?.getSMAccount?.nationality || null;
  } catch (e) {
    console.warn('getUserNationalityByEmail error', e);
    return null;
  }
}

export function parseBackendNumericValue(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const parsed = Number(String(value).trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function getExRatesForNationality(nationality: string): Promise<{ sellingPrice: number; buyingPrice: number; symbol?: string } | null> {
  try {
    const candidates = buildLookupCandidates(nationality);

    for (const candidate of candidates) {
      const res: any = await client.graphql({
        query: getExRates,
        variables: { cur: candidate }
      });
      const rates = res?.data?.getExRates;
      if (rates) {
        return {
          sellingPrice: parseFloat(rates.sellingPrice || '1'),
          buyingPrice: parseFloat(rates.buyingPrice || '1'),
          symbol: rates.symbol || 'Ksh'
        };
      }
    }

    const listRes: any = await client.graphql({ query: listExRates });
    const items = listRes?.data?.listExRates?.items || [];
    const normalizedCandidates = candidates.map(normalizeKey);
    const found = items.find((item: any) => {
      const curNorm = normalizeKey(String(item?.cur || ''));
      const symbolNorm = normalizeKey(String(item?.symbol || ''));
      return normalizedCandidates.includes(curNorm) || normalizedCandidates.includes(symbolNorm);
    });

    if (!found) return null;
    return {
      sellingPrice: parseFloat(found.sellingPrice || '1'),
      buyingPrice: parseFloat(found.buyingPrice || '1'),
      symbol: found.symbol || 'Ksh'
    };
  } catch (e) {
    console.warn('getExRatesForNationality error', e);
    return null;
  }
}

// Backend values are already stored in the app's base currency. Only user-entered amounts should be converted.
export async function convertKshToUserCurrency(amountKsh: number, nationality: string): Promise<number> {
  const rates = await getExRatesForNationality(nationality);
  if (!rates) return amountKsh; // fallback: treat as KSH
  // For display: convert KES to user's currency using buyingPrice
  // (what the user gets if they sell KES back to the bank)
  return amountKsh * rates.buyingPrice;
}

export async function formatAmountForUser(amountKsh: number, nationality?: string, symbolFallback = 'Ksh'): Promise<string> {
  try {
    let nat = nationality;
    if (!nat) return `${symbolFallback} ${amountKsh.toFixed(2)}`;
    const rates = await getExRatesForNationality(nat);
    if (!rates) return `${symbolFallback} ${amountKsh.toFixed(2)}`;
    // Display: convert KES to user's home currency using buyingPrice
    const converted = amountKsh * rates.buyingPrice;
    const symbol = rates.symbol || symbolFallback;
    return `${symbol} ${converted.toFixed(2)}`;
  } catch (e) {
    console.warn('formatAmountForUser error', e);
    return `${symbolFallback} ${amountKsh.toFixed(2)}`;
  }
}

// Synchronous formatting helper using an in-memory rates map (useful for fallbacks)
export function formatAmountSync(amountKsh: number, nationality?: string, ratesMap?: Record<string, any>, symbolFallback = BASE_EXCHANGE_SYMBOL): string {
  try {
    if (!nationality || !ratesMap) return `${symbolFallback} ${amountKsh.toFixed(2)}`;
    const r = ratesMap[nationality];
    if (!r) return `${symbolFallback} ${amountKsh.toFixed(2)}`;
    // Display: convert base CHF amount to user's home currency using buyingPrice
    const converted = amountKsh * (parseFloat(String(r.buyingPrice)) || 1);
    const symbol = r.symbol || symbolFallback;
    return `${symbol} ${converted.toFixed(2)}`;
  } catch (e) {
    return `${symbolFallback} ${amountKsh.toFixed(2)}`;
  }
}

// Convert an amount in a foreign currency (identified by nationality) into Kenyan Shillings (KES)
// For deposits: use sellingPrice (what the bank charges for the foreign currency = what it costs to acquire it)
// sellingPrice = 1 KES in foreign currency => foreign = KES * sellingPrice
// therefore KES = foreign / sellingPrice
export async function convertForeignToKsh(amountForeign: number, nationality?: string): Promise<number> {
  try {
    if (!nationality) return amountForeign; // assume already base currency if unknown
    const rates = await getExRatesForNationality(nationality);
    if (!rates || !rates.sellingPrice || Number(rates.sellingPrice) === 0) return amountForeign;
    // Depositor sells foreign currency to app at sellingPrice rate
    // CHF = foreign / sellingPrice
    return amountForeign / rates.sellingPrice;
  } catch (e) {
    console.warn('convertForeignToKsh error', e);
    return amountForeign;
  }
}

export function getCurrencyIsoFromCountryCode(countryCode: string): string | null {
  if (!countryCode) return null;
  const upper = countryCode.trim().toUpperCase();
  return countryToCurrency[upper] || null;
}

export function getCountryCodeForCurrencyIso(currencyIso: string): string | null {
  if (!currencyIso) return null;
  const upper = currencyIso.trim().toUpperCase();
  const found = Object.entries(countryToCurrency).find(([, iso]) => iso.toUpperCase() === upper);
  return found ? found[0] : null;
}

export async function fetchLiveRatesByBaseCurrency(baseCurrencyIso: string): Promise<Record<string, number> | null> {
  if (!baseCurrencyIso) return null;
  const normalized = baseCurrencyIso.trim().toUpperCase();
  const endpoints = [
    `https://api.frankfurter.dev/v1/latest?from=${normalized}`,
    `https://api.frankfurter.app/latest?from=${normalized}`
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn('fetchLiveRatesByBaseCurrency failed', url, res.status);
        continue;
      }
      const data = await res.json();
      if (!data || typeof data !== 'object' || !data.rates) {
        console.warn('fetchLiveRatesByBaseCurrency invalid response', url);
        continue;
      }
      return data.rates;
    } catch (e) {
      console.warn('fetchLiveRatesByBaseCurrency error', url, e);
    }
  }

  return null;
}

export function buildCHFBasedRatesFromLive(
  liveRates: Record<string, number>,
  ratesMap: Record<string, any>
): Record<string, { buyingPrice: number; sellingPrice: number; symbol?: string }> {
  const result: Record<string, { buyingPrice: number; sellingPrice: number; symbol?: string }> = {};

  Object.entries(ratesMap).forEach(([countryCode, row]) => {
    const upperCountryCode = countryCode.trim().toUpperCase();
    const currencyIso = countryToCurrency[upperCountryCode];
    if (!currencyIso) return;

    if (currencyIso === BASE_EXCHANGE_CURRENCY_ISO) {
      result[upperCountryCode] = {
        buyingPrice: 1,
        sellingPrice: 1,
        symbol: row.symbol || BASE_EXCHANGE_SYMBOL
      };
      return;
    }

    const liveRate = liveRates[currencyIso];
    if (liveRate == null || !Number.isFinite(liveRate) || liveRate <= 0) return;
    result[upperCountryCode] = {
      buyingPrice: liveRate,
      sellingPrice: liveRate,
      symbol: row.symbol || currencyIso
    };
  });

  return result;
}

export const buildKESBasedRatesFromLive = buildCHFBasedRatesFromLive;
