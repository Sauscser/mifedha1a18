import { generateClient } from 'aws-amplify/api';
import { getSMAccount, getExRates } from '../graphql/queries';
const client = generateClient();

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
    const res: any = await client.graphql({
      query: getExRates,
      variables: { cur: nationality }
    });
    const rates = res?.data?.getExRates;
    if (!rates) return null;
    return {
      sellingPrice: parseFloat(rates.sellingPrice || '1'),
      buyingPrice: parseFloat(rates.buyingPrice || '1'),
      symbol: rates.symbol || 'Ksh'
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
