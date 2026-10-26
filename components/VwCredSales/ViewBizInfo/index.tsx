
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import styles from './styles';
import { countryToCurrency, getExRatesForNationality, BASE_EXCHANGE_SYMBOL } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import {useExchange} from '../../../src/contexts/ExchangeContext';
import { useTranslation } from 'react-i18next';
import translations from './translation';

const normalizeRateKey = (value: string) => value.trim().toUpperCase();

const resolveRateKey = (
    nationality: string | undefined | null,
    ratesMap?: Record<string, any>
): string | undefined => {
    if (!nationality || !ratesMap) return undefined;

    const trimmed = nationality.trim();
    const countryCode = nationalityToCode(trimmed) || (trimmed.length === 2 ? trimmed.toUpperCase() : undefined);
    const currencyIso = countryCode ? countryToCurrency[countryCode] : undefined;
    const candidates = [trimmed, trimmed.toUpperCase(), countryCode, currencyIso].filter(Boolean) as string[];

    for (const candidate of candidates) {
        if (ratesMap[candidate]) return candidate;
    }

    const normalizedRates = Object.keys(ratesMap).reduce<Record<string, string>>((acc, key) => {
        acc[normalizeRateKey(key)] = key;
        return acc;
    }, {});

    for (const candidate of candidates) {
        const resolved = normalizedRates[normalizeRateKey(candidate)];
        if (resolved) return resolved;
    }

    return undefined;
};

export interface ChmaInfo {
    ChmDtls: {
      
      BusKntct: string,
      netEarnings: number,
      busName: string,
      TtlEarnings: number,
      earningsBal: number
      benefitsAmount:number,
      description: string,
      Nationality?: string,
        
    }}

const ChmInfo = (props:ChmaInfo) => {
   const { i18n } = useTranslation();
   const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
   const t = translations[lang] || translations.en;
   const {
      ChmDtls: {
        
         benefitsAmount,
      netEarnings,
      busName,
      TtlEarnings,
      earningsBal,
      
      description,
      Nationality,
   }} = props ;

   const {ratesMap} = useExchange();
   const displayNationality = Nationality;
   const rateKey = resolveRateKey(displayNationality, ratesMap);
   const [fallbackRate, setFallbackRate] = useState<{ nationality: string; buyingPrice: number; symbol?: string } | null>(null);

   useEffect(() => {
     let mounted = true;

     const fetchFallbackRate = async () => {
       if (!displayNationality || rateKey) {
      if (mounted) setFallbackRate(null);
      return;
       }

       setFallbackRate(null);
       const rate = await getExRatesForNationality(displayNationality);
       if (mounted && rate) {
      setFallbackRate({
        nationality: displayNationality,
        buyingPrice: Number(rate.buyingPrice) || 1,
        symbol: rate.symbol
      });
       }
     };

     fetchFallbackRate();
     return () => {
       mounted = false;
     };
   }, [displayNationality, rateKey]);

   const formatBusinessAmount = (amount: number) => {
     const rate = rateKey && ratesMap ? ratesMap[rateKey] : null;
     if (rate) {
       const converted = amount * (Number(rate.buyingPrice) || 1);
       return `${rate.symbol || BASE_EXCHANGE_SYMBOL} ${converted.toFixed(4)}`;
     }

     if (fallbackRate?.nationality === displayNationality) {
       return `${fallbackRate.symbol || BASE_EXCHANGE_SYMBOL} ${(amount * fallbackRate.buyingPrice).toFixed(2)}`;
     }

     return `${BASE_EXCHANGE_SYMBOL} ${amount.toFixed(2)}`;
   };

    return (
        <View style={styles.pageContainer}>
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.headerAccent} />
                    <View style={styles.cardHeading}>
                        <Text style={styles.sectionTitle}>{t.businessInfoTitle}</Text>
                        <Text style={styles.businessLabel}>{t.businessNameLabel}</Text>
                        <Text style={styles.businessName}>{busName}</Text>
                    </View>
                </View>

                <View style={styles.metrics}>
                    <View style={styles.metricCard}>
                        <Text style={styles.metricLabel}>{t.businessBalanceLabel}</Text>
                        <Text style={styles.balanceAmount}>
                            {formatBusinessAmount(Number(netEarnings) || 0)}
                        </Text>
                    </View>
                    <View style={styles.benefitsCard}>
                        <Text style={styles.metricLabel}>{t.pooledBenefitsLabel}</Text>
                        <Text style={styles.benefitsAmount}>
                            {formatBusinessAmount(Number(benefitsAmount) || 0)}
                        </Text>
                    </View>
                </View>

                {Boolean(description?.trim()) && (
                    <View style={styles.descriptionSection}>
                        <Text style={styles.description}>{description.trim()}</Text>
                    </View>
                )}
            </View>
        </View>
    );
}; 

export default ChmInfo