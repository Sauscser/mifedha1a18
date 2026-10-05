import React, { useEffect, useState } from 'react';
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { countryToCurrency, formatAmountSync, getExRatesForNationality, BASE_EXCHANGE_SYMBOL } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import { useTranslation } from 'react-i18next';
import translations from './translation';
import * as DocumentPicker from 'expo-document-picker';
import { uploadData, getUrl } from 'aws-amplify/storage';
import { updateSMAccount } from '../../../src/graphql/mutations';
import { generateClient } from 'aws-amplify/api';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, ScrollView, Image, ActivityIndicator, StyleSheet, Alert, Pressable } from 'react-native';

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

const client = generateClient();

export interface SMAccount {
  SMAc: {
    name: string;
    balance: number;
    ttlDpstSM: number;
    TtlWthdrwnSM: number;
    benefitsAmount: number;
    MaxTymsBL: number;
    nationality?: string;
    awsemail?: string;
    photoPassport?: string; // Amplify Storage key
    idFront?: string;       // optional S3 key
    idBack?: string;        // optional S3 key
  };
}

const SMCvLnStts = (props: SMAccount) => {
    const { i18n } = useTranslation();
    const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
    const t = translations[lang] || translations.en;
  const {
    SMAc: { name, balance, ttlDpstSM, TtlWthdrwnSM, benefitsAmount, MaxTymsBL, nationality, photoPassport, idFront, idBack, awsemail },
  } = props;

  const [photoUrls, setPhotoUrls] = useState<{ passport?: string; idFront?: string; idBack?: string }>({});
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [updatingPhoto, setUpdatingPhoto] = useState(false);
  const [resolvedRate, setResolvedRate] = useState<{ buyingPrice: number; symbol?: string } | null>(null);

  const validKey = (k?: string | null) => !!k && k !== 'None';

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const urls: any = {};
        if (validKey(photoPassport)) {
          const passportUrl = await getUrl({ key: photoPassport });
          urls.passport = passportUrl.url.toString();
        }
        if (validKey(idFront)) {
          const idFrontUrl = await getUrl({ key: idFront });
          urls.idFront = idFrontUrl.url.toString();
        }
        if (validKey(idBack)) {
          const idBackUrl = await getUrl({ key: idBack });
          urls.idBack = idBackUrl.url.toString();
        }
        setPhotoUrls(urls);
      } catch (err) {
        console.log('Error fetching photos:', err);
        setPhotoUrls({});
      } finally {
        setLoadingPhotos(false);
      }
    };
    fetchPhotos();
  }, [photoPassport, idFront, idBack]);

  const pickAndUploadProfilePhoto = async () => {
    if (updatingPhoto) return;
    setUpdatingPhoto(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) {
        setUpdatingPhoto(false);
        return;
      }

      const asset = result.assets[0];
      const localUri = asset.uri;
      if (!localUri) {
        Alert.alert(t.errorTitle, t.imageSelectionFailed);
        setUpdatingPhoto(false);
        return;
      }

      // Optimistic local preview before upload completes.
      setPhotoUrls((prev) => ({ ...prev, passport: localUri }));

      const response = await fetch(localUri);
      const blob = await response.blob();
      const ext = (asset.name?.split('.').pop() || 'jpg').toLowerCase();
      const key = `face_${Date.now()}.${ext}`;
      const contentType = asset.mimeType || blob.type || 'image/jpeg';

      await uploadData({
        key,
        data: blob,
        options: { contentType },
      }).result;

      const attrs = await fetchUserAttributes();
      const accountEmail = awsemail || attrs?.email;
      if (!accountEmail) {
        Alert.alert(t.errorTitle, t.profileEmailMissing);
        setUpdatingPhoto(false);
        return;
      }

      await client.graphql({
        query: updateSMAccount,
        variables: {
          input: {
            awsemail: accountEmail,
            photoPassport: key,
          },
        },
      });

      const signed = await getUrl({ key });
      setPhotoUrls((prev) => ({ ...prev, passport: signed.url.toString() }));
      Alert.alert(t.successTitle, t.profilePhotoUpdated);
    } catch (err) {
      console.log('Profile photo update error:', err);
      Alert.alert(t.errorTitle, t.imageUploadFailed);
    } finally {
      setUpdatingPhoto(false);
    }
  };

  const confirmProfilePhotoUpdate = () => {
    Alert.alert(
      t.changeProfilePhotoTitle,
      t.changeProfilePhotoBody,
      [
        { text: t.cancelLabel, style: 'cancel' },
        { text: t.changeNowLabel, onPress: pickAndUploadProfilePhoto },
      ]
    );
  };

  const { nationality: viewerNationality, ratesMap } = useExchange();
  const ratesMapSafe: Record<string, any> | undefined = ratesMap === null ? undefined : ratesMap;
  const displayNationality = nationality || (viewerNationality === null ? undefined : viewerNationality);
  const rateKey = resolveRateKey(displayNationality, ratesMapSafe);

  useEffect(() => {
    let mounted = true;

    const fetchFallbackRate = async () => {
      if (!displayNationality || rateKey) {
        if (mounted) setResolvedRate(null);
        return;
      }

      try {
        const rate = await getExRatesForNationality(displayNationality);
        if (mounted && rate) {
          setResolvedRate({ buyingPrice: Number(rate.buyingPrice || 1), symbol: rate.symbol });
        }
      } catch (error) {
        if (mounted) setResolvedRate(null);
      }
    };

    fetchFallbackRate();
    return () => {
      mounted = false;
    };
  }, [displayNationality, rateKey]);

  const formatDisplayAmount = (amount: number) => {
    if (rateKey && ratesMapSafe) {
      return formatAmountSync(amount, rateKey, ratesMapSafe);
    }

    if (resolvedRate) {
      const converted = amount * (Number(resolvedRate.buyingPrice) || 1);
      const symbol = resolvedRate.symbol || BASE_EXCHANGE_SYMBOL;
      return `${symbol} ${converted.toFixed(2)}`;
    }

    return `${BASE_EXCHANGE_SYMBOL} ${amount.toFixed(2)}`;
  };

  return (
    <ScrollView style={styles.pageContainer} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.photoContainer}>
          {loadingPhotos ? (
            <ActivityIndicator size="large" color="#e58d29" />
          ) : photoUrls.passport ? (
            <Image source={{ uri: photoUrls.passport }} style={styles.passportImage} />
          ) : (
            <View style={[styles.passportImage, { backgroundColor: '#eee' }]} />
          )}
          <Pressable
            style={styles.photoRefreshButton}
            onPress={confirmProfilePhotoUpdate}
            disabled={updatingPhoto}
          >
            {updatingPhoto ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="refresh" size={22} color="#fff" />
            )}
          </Pressable>
        </View>
        <Text style={styles.userName}>{name}</Text>
      </View>

      {/* Account Info Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t.accountOverview}</Text>
        <Text style={styles.infoRow}>
          <Text style={styles.label}>{t.balance} </Text>{formatDisplayAmount(balance)}
        </Text>
        <Text style={styles.infoRow}>
          <Text style={styles.label}>{t.timesBlacklisted} </Text>{MaxTymsBL}
        </Text>
        <Text style={styles.infoRow}>
          <Text style={styles.label}>{t.securedBenefitsPooled} </Text>{formatDisplayAmount(benefitsAmount)}
        </Text>
      </View>

      {/* Cash Flow Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t.cashFlow}</Text>
        <Text style={styles.infoRow}>
          <Text style={styles.label}>{t.totalDeposits} </Text>{formatDisplayAmount(ttlDpstSM)}
        </Text>
        <Text style={styles.infoRow}>
          <Text style={styles.label}>{t.totalWithdrawn} </Text>{formatDisplayAmount(TtlWthdrwnSM)}
        </Text>
      </View>
    </ScrollView>
  );
};

export default SMCvLnStts;

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#e58d29',
  },
  infoRow: {
    fontSize: 16,
    marginBottom: 6,
    color: '#444',
  },
  label: {
    fontWeight: '600',
    color: '#333',
  },
  passportImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: '#e58d29',
    marginBottom: 12,
    resizeMode: 'cover',
  },
  photoContainer: {
    width: 140,
    height: 140,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRefreshButton: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: '#fff',
  },
  idSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 15,
    marginBottom: 15,
  },
  idImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e58d29',
    resizeMode: 'cover',
  },
});
