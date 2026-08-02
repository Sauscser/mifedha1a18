import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { generateClient } from 'aws-amplify/api';
import { getSMAccount, listExRates } from '../graphql/queries';
import { updateExRates, createExRates } from '../graphql/mutations';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { fetchLiveRatesByBaseCurrency, buildCHFBasedRatesFromLive } from '../utils/exchange';

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
      if (!nat || !ratesMap) return `CHF ${amountKsh.toFixed(2)}`;
      const r = ratesMap[nat];
      if (!r) return `CHF ${amountKsh.toFixed(2)}`;
      const converted = amountKsh * r.buyingPrice;
      const symbol = r.symbol || 'Ksh';
      return `${symbol} ${converted.toFixed(2)}`;
    } catch (e) {
      return `CHF ${amountKsh.toFixed(2)}`;
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
      const res: any = await client.graphql({ query: listExRates });
      const items = res?.data?.listExRates?.items || [];
      if (!items.length) return;
      const map: Record<string, Rate> = {};
      items.forEach((r: any) => {
        map[r.cur] = { cur: r.cur, buyingPrice: parseFloat(r.buyingPrice || '1'), sellingPrice: parseFloat(r.sellingPrice || '1'), symbol: r.symbol };
      });

      const liveRates = await fetchLiveRatesByBaseCurrency('CHF');
      if (liveRates) {
        const ratesToSave = buildCHFBasedRatesFromLive(liveRates, map);
        if (Object.keys(ratesToSave).length) {
          for (const [cur, row] of Object.entries(ratesToSave)) {
            try {
              await client.graphql({
                query: updateExRates,
                variables: { input: { cur, buyingPrice: String(row.buyingPrice), sellingPrice: String(row.sellingPrice), symbol: row.symbol } }
              });
            } catch (err) {
              await client.graphql({ query: createExRates, variables: { input: { cur, buyingPrice: String(row.buyingPrice), sellingPrice: String(row.sellingPrice), symbol: row.symbol } } });
            }
          }
        }
      }

      // Reload map after potential update
      const newList: any = await client.graphql({ query: listExRates });
      const items2 = newList?.data?.listExRates?.items || [];
      const reloadedMap: Record<string, Rate> = {};
      items2.forEach((r: any) => {
        reloadedMap[r.cur] = { cur: r.cur, buyingPrice: parseFloat(r.buyingPrice || '1'), sellingPrice: parseFloat(r.sellingPrice || '1'), symbol: r.symbol };
      });
      setRatesMap(reloadedMap);
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
