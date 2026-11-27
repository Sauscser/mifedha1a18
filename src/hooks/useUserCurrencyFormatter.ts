import { useEffect, useState } from 'react';
import { useExchange } from '../contexts/ExchangeContext';
import { BASE_EXCHANGE_SYMBOL, countryToCurrency, getExRatesForNationality } from '../utils/exchange';
import { nationalityToCode } from '../utils/nationalityToCode';

type DisplayRate = {
  buyingPrice: number;
  currencyCode: string;
  symbol?: string;
};

export const useUserCurrencyFormatter = (nationality: string | null | undefined) => {
  const { ratesMap } = useExchange();
  const [displayRate, setDisplayRate] = useState<DisplayRate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const countryCode = nationality ? nationalityToCode(nationality) : undefined;
  const currencyCode = countryCode ? countryToCurrency[countryCode] : undefined;

  useEffect(() => {
    let active = true;

    const resolveDisplayRate = async () => {
      setIsLoading(true);
      setDisplayRate(null);

      if (!nationality?.trim()) {
        setIsLoading(false);
        return;
      }

      if (currencyCode === 'CHF') {
        if (active) {
          setDisplayRate({ buyingPrice: 1, currencyCode: 'CHF', symbol: BASE_EXCHANGE_SYMBOL });
          setIsLoading(false);
        }
        return;
      }

      const candidates = [nationality, countryCode, currencyCode]
        .filter(Boolean)
        .map((candidate) => String(candidate).trim().toUpperCase());
      const rateKey = ratesMap
        ? Object.keys(ratesMap).find((key) => candidates.includes(key.trim().toUpperCase()))
        : undefined;
      const mapRate = rateKey ? ratesMap?.[rateKey] : undefined;
      const mapBuyingPrice = Number(mapRate?.buyingPrice);

      if (mapRate && Number.isFinite(mapBuyingPrice) && mapBuyingPrice > 0) {
        if (active) {
          setDisplayRate({
            buyingPrice: mapBuyingPrice,
            currencyCode: currencyCode || mapRate.cur,
            symbol: mapRate.symbol
          });
          setIsLoading(false);
        }
        return;
      }

      try {
        const fetchedRate = await getExRatesForNationality(nationality);
        const buyingPrice = Number(fetchedRate?.buyingPrice);
        if (!fetchedRate || !Number.isFinite(buyingPrice) || buyingPrice <= 0) {
          throw new Error(`Missing valid CHF-to-user-currency rate for "${nationality}"`);
        }

        if (active) {
          setDisplayRate({
            buyingPrice,
            currencyCode: currencyCode || fetchedRate.symbol || 'Currency',
            symbol: fetchedRate.symbol
          });
        }
      } catch (error) {
        console.error('Unable to resolve the viewer currency exchange rate:', error);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    resolveDisplayRate();
    return () => {
      active = false;
    };
  }, [nationality, ratesMap, countryCode, currencyCode]);

  const formatAmount = (amountCHF: number) => {
    if (!Number.isFinite(amountCHF)) return 'Amount unavailable';
    if (!displayRate) return 'Currency unavailable';

    const convertedAmount = amountCHF * displayRate.buyingPrice;
    if (!Number.isFinite(convertedAmount)) return 'Amount unavailable';

    return `${displayRate.symbol || displayRate.currencyCode} ${convertedAmount.toFixed(2)}`;
  };

  return {
    currencyLabel: displayRate?.symbol || displayRate?.currencyCode,
    formatAmount,
    isCurrencyAvailable: displayRate !== null,
    isLoading
  };
};
