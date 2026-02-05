import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { generateClient } from 'aws-amplify/api';
import { getSMAccount, listExRates } from '../graphql/queries';
import { updateExRates, createExRates } from '../graphql/mutations';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';

const client = generateClient();

type Rate = { cur: string; buyingPrice: number; sellingPrice: number; symbol?: string };

type ExchangeContextValue = {
  nationality: string | null;
  ratesMap: Record<string, Rate> | null;
  formatAmount: (amountKsh: number) => Promise<string>;
  convert: (amountKsh: number) => Promise<number>;
  refreshRates: () => Promise<void>;
};

const ExchangeContext = createContext<ExchangeContextValue | undefined>(undefined);

export const ExchangeProvider = ({ children }: { children: ReactNode }) => {
  const [nationality, setNationality] = useState<string | null>(null);
  const [ratesMap, setRatesMap] = useState<Record<string, Rate> | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const attrs = await fetchUserAttributes();
        const email = attrs.email;
        const userRes: any = await client.graphql({ query: getSMAccount, variables: { awsemail: email } });
        const nat = userRes?.data?.getSMAccount?.nationality || null;
        setNationality(nat);
        const listRes: any = await client.graphql({ query: listExRates });
        const items = listRes?.data?.listExRates?.items || [];
        const map: Record<string, Rate> = {};
        items.forEach((r: any) => {
          map[r.cur] = { cur: r.cur, buyingPrice: parseFloat(r.buyingPrice || '1'), sellingPrice: parseFloat(r.sellingPrice || '1'), symbol: r.symbol };
        });
        setRatesMap(map);
      } catch (e) {
        console.warn('ExchangeProvider init error', e);
      }
    };
    init();
  }, []);

  const formatAmount = async (amountKsh: number) => {
    try {
      const nat = nationality;
      if (!nat || !ratesMap) return `Ksh ${amountKsh.toFixed(2)}`;
      const r = ratesMap[nat];
      if (!r) return `Ksh ${amountKsh.toFixed(2)}`;
      const converted = amountKsh * r.buyingPrice;
      const symbol = r.symbol || 'Ksh';
      return `${symbol} ${converted.toFixed(2)}`;
    } catch (e) {
      return `Ksh ${amountKsh.toFixed(2)}`;
    }
  };

  const convert = async (amountKsh: number) => {
    if (!nationality || !ratesMap) return amountKsh;
    const r = ratesMap[nationality];
    if (!r) return amountKsh;
    return amountKsh * r.buyingPrice;
  };

  const refreshRates = async () => {
    try {
      // Fetch list of rates and update from exchangerate.host
      const res: any = await client.graphql({ query: listExRates });
      const items = res?.data?.listExRates?.items || [];
      if (!items.length) return;
      // Build symbol mapping for common cur codes -> ISO currency codes
      const isoMap: Record<string, string> = {
        Ken: 'KES',
        Nig: 'NGN',
        Uga: 'UGX',
        Tza: 'TZS',
        Rwa: 'RWF',
        USA: 'USD',
        UK: 'GBP',
        EUR: 'EUR'
      };
      for (const r of items) {
        const iso = isoMap[r.cur] || r.symbol || null;
        if (!iso) continue;
        try {
          const url = `https://api.exchangerate.host/convert?from=KES&to=${iso}`;
          const resp = await fetch(url);
          const data = await resp.json();
          if (data && typeof data.result === 'number') {
            const buying = data.result; // 1 KES = result (target currency)
            // We store buyingPrice as the multiplier to convert KES -> currency
            try {
              await client.graphql({
                query: updateExRates,
                variables: { input: { cur: r.cur, buyingPrice: String(buying), sellingPrice: String(buying), symbol: iso } }
              });
            } catch (err) {
              // maybe record doesn't exist; try create
              await client.graphql({ query: createExRates, variables: { input: { cur: r.cur, buyingPrice: String(buying), sellingPrice: String(buying), symbol: iso } } });
            }
          }
        } catch (err) {
          console.warn('sync single rate failed', r.cur, err);
        }
      }
      // Reload map
      const newList: any = await client.graphql({ query: listExRates });
      const items2 = newList?.data?.listExRates?.items || [];
      const map: Record<string, Rate> = {};
      items2.forEach((r: any) => {
        map[r.cur] = { cur: r.cur, buyingPrice: parseFloat(r.buyingPrice || '1'), sellingPrice: parseFloat(r.sellingPrice || '1'), symbol: r.symbol };
      });
      setRatesMap(map);
    } catch (e) {
      console.warn('refreshRates error', e);
    }
  };

  return (
    <ExchangeContext.Provider value={{ nationality, ratesMap, formatAmount, convert, refreshRates }}>
      {children}
    </ExchangeContext.Provider>
  );
};

export const useExchange = () => {
  const ctx = useContext(ExchangeContext);
  if (!ctx) throw new Error('useExchange must be used within ExchangeProvider');
  return ctx;
};
