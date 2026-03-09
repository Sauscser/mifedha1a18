import { generateClient } from 'aws-amplify/api';
import { getSMAccount, getExRates, listExRates } from '../graphql/queries';
const client = generateClient();

const countryToCurrency: Record<string, string> = {
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
  return unique([key, upper, compactUpper, isoFromCountry]);
};

/**
 * EXCHANGE RATE SEMANTICS:
 * 
 * buyingPrice = Foreign currency units per 1 KES (what you GET when you sell KES to the bank)
 * sellingPrice = Foreign currency units per 1 KES (what it COSTS to buy that foreign currency from the bank)
 * 
 * DEPOSIT FLOW:
 * - User deposits in their home country currency
 * - Convert to KES using sellingPrice (what the bank pays/acquires the foreign currency at)
 * - Store in database as KES
 * 
 * DISPLAY FLOW:
 * - Display KES balance back to user in their home currency
 * - Convert using buyingPrice (what the user theoretically receives if they sell KES)
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
export function formatAmountSync(amountKsh: number, nationality?: string, ratesMap?: Record<string, any>, symbolFallback = 'Ksh'): string {
  try {
    if (!nationality || !ratesMap) return `${symbolFallback} ${amountKsh.toFixed(2)}`;
    const r = ratesMap[nationality];
    if (!r) return `${symbolFallback} ${amountKsh.toFixed(2)}`;
    // Display: convert KES to user's home currency using buyingPrice
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
    if (!nationality) return amountForeign; // assume already KES if unknown
    const rates = await getExRatesForNationality(nationality);
    if (!rates || !rates.sellingPrice || Number(rates.sellingPrice) === 0) return amountForeign;
    // Depositor sells foreign currency to app at sellingPrice rate
    // KES = foreign / sellingPrice
    return amountForeign / rates.sellingPrice;
  } catch (e) {
    console.warn('convertForeignToKsh error', e);
    return amountForeign;
  }
}
