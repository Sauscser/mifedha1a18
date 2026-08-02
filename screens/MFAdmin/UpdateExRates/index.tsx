// @ts-nocheck
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { listExRates, getCompany } from '../../../src/graphql/queries';
import { updateExRates } from '../../../src/graphql/mutations';
import { useTranslation } from 'react-i18next';
import { translations } from './translation';
import { getCurrencyIsoFromCountryCode, getCountryCodeForCurrencyIso, fetchLiveRatesByBaseCurrency, buildCHFBasedRatesFromLive } from '../../../src/utils/exchange';

const client = generateClient();

// Country code → name mapping (same as CreateAllExRates - Complete global list)
const countryNamesByCode: Record<string, string> = {
  AF: "Afghanistan", AL: "Albania", DZ: "Algeria", AS: "American Samoa", AD: "Andorra", AO: "Angola", AI: "Anguilla", 
  AG: "Antigua and Barbuda", AR: "Argentina", AM: "Armenia", AW: "Aruba", AU: "Australia", AT: "Austria", AZ: "Azerbaijan",
  BS: "Bahamas", BH: "Bahrain", BD: "Bangladesh", BB: "Barbados", BY: "Belarus", BE: "Belgium", BZ: "Belize",
  BJ: "Benin", BM: "Bermuda", BT: "Bhutan", BO: "Bolivia", BA: "Bosnia and Herzegovina", BW: "Botswana", BR: "Brazil",
  BN: "Brunei", BG: "Bulgaria", BF: "Burkina Faso", BI: "Burundi", KH: "Cambodia", CM: "Cameroon", CA: "Canada", CV: "Cabo Verde",
  KY: "Cayman Islands", CF: "Central African Republic", TD: "Chad", CL: "Chile", CN: "China", CO: "Colombia",
  CR: "Costa Rica", HR: "Croatia", CU: "Cuba", CY: "Cyprus", CZ: "Czech Republic", DK: "Denmark", DJ: "Djibouti",
  DO: "Dominican Republic", EC: "Ecuador", EG: "Egypt", SV: "El Salvador", GQ: "Equatorial Guinea", ER: "Eritrea",
  EE: "Estonia", ET: "Ethiopia", FJ: "Fiji", FI: "Finland", FR: "France", GA: "Gabon", GM: "Gambia", GE: "Georgia",
  DE: "Germany", GH: "Ghana", GR: "Greece", GT: "Guatemala", HN: "Honduras", HK: "Hong Kong", HU: "Hungary",
  IS: "Iceland", IN: "India", ID: "Indonesia", IR: "Iran", IQ: "Iraq", IE: "Ireland", IL: "Israel", IT: "Italy",
  JM: "Jamaica", JP: "Japan", JO: "Jordan", KZ: "Kazakhstan", KE: "Kenya", KI: "Kiribati", KP: "North Korea",
  KR: "South Korea", KW: "Kuwait", KG: "Kyrgyzstan", LA: "Laos", LV: "Latvia", LB: "Lebanon", LS: "Lesotho",
  LR: "Liberia", LY: "Libya", LI: "Liechtenstein", LT: "Lithuania", LU: "Luxembourg", MO: "Macao", MW: "Malawi",
  MY: "Malaysia", MV: "Maldives", ML: "Mali", MT: "Malta", MH: "Marshall Islands", MQ: "Martinique", MR: "Mauritania",
  MU: "Mauritius", MX: "Mexico", FM: "Micronesia", MD: "Moldova", MC: "Monaco", MN: "Mongolia", ME: "Montenegro",
  MA: "Morocco", MZ: "Mozambique", MM: "Myanmar", NA: "Namibia", NR: "Nauru", NP: "Nepal", NL: "Netherlands",
  NZ: "New Zealand", NI: "Nicaragua", NE: "Niger", NG: "Nigeria", NO: "Norway", OM: "Oman", PK: "Pakistan", PA: "Panama",
  PG: "Papua New Guinea", PY: "Paraguay", PE: "Peru", PH: "Philippines", PL: "Poland", PT: "Portugal", QA: "Qatar",
  RO: "Romania", RU: "Russia", RW: "Rwanda", SA: "Saudi Arabia", SN: "Senegal", RS: "Serbia", SG: "Singapore",
  SK: "Slovakia", SI: "Slovenia", ES: "Spain", LK: "Sri Lanka", SD: "Sudan", SR: "Suriname", SZ: "Eswatini",
  SE: "Sweden", CH: "Switzerland", SY: "Syria", TW: "Taiwan", TJ: "Tajikistan", TZ: "Tanzania", TH: "Thailand",
  TL: "Timor-Leste", TG: "Togo", TO: "Tonga", TT: "Trinidad and Tobago", TN: "Tunisia", TR: "Turkey", TM: "Turkmenistan",
  UG: "Uganda", UA: "Ukraine", AE: "United Arab Emirates", GB: "United Kingdom", US: "United States", UY: "Uruguay",
  UZ: "Uzbekistan", VU: "Vanuatu", VE: "Venezuela", VN: "Vietnam", YE: "Yemen", ZA: "South Africa", ZM: "Zambia", ZW: "Zimbabwe",
  // Additional countries and territories
  AX: "Åland Islands", BQ: "Bonaire", CW: "Curaçao", PS: "Palestine", SS: "South Sudan", XK: "Kosovo",
  GG: "Guernsey", IM: "Isle of Man", JE: "Jersey", SJ: "Svalbard and Jan Mayen", BV: "Bouvet Island",
  GS: "South Georgia and South Sandwich Islands", PN: "Pitcairn Islands", TK: "Tokelau", WF: "Wallis and Futuna",
  EH: "Western Sahara", GI: "Gibraltar", PM: "Saint Pierre and Miquelon", RE: "Réunion", YT: "Mayotte",
  GP: "Guadeloupe", BL: "Saint Barthélemy", MF: "Saint Martin", GF: "French Guiana", PF: "French Polynesia",
  NC: "New Caledonia", SX: "Sint Maarten", TC: "Turks and Caicos Islands", VG: "British Virgin Islands",
  VI: "U.S. Virgin Islands", GW: "Guinea-Bissau", KN: "Saint Kitts and Nevis", LC: "Saint Lucia",
  VC: "Saint Vincent and the Grenadines", DM: "Dominica", GD: "Grenada", FK: "Falkland Islands",
  GL: "Greenland", IO: "British Indian Ocean Territory", CC: "Cocos (Keeling) Islands", CX: "Christmas Island",
};

// Individual editable row component
const ExRateRow = ({ rate, onUpdate, onLiveUpdate, isUpdating, isLiveUpdating }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [buyingPrice, setBuyingPrice] = useState(String(rate.buyingPrice || ''));
  const [sellingPrice, setSellingPrice] = useState(String(rate.sellingPrice || ''));
  // Show symbol and country in the first column
  const currencySymbol = rate.symbol || '';
  const countryName = countryNamesByCode[rate.cur] || rate.cur;

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const handleUpdate = async () => {
    if (!buyingPrice || !sellingPrice) {
      Alert.alert(t.error, t.errorEnterBothRates);
      return;
    }
    await onUpdate(rate.cur, buyingPrice, sellingPrice);
    setIsEditing(false);
  };

  return (
    <View style={localStyles.row}>
      <View style={localStyles.cellCountry}>
        <Text style={localStyles.textLabel}>
          {currencySymbol} {countryName ? `(${countryName})` : ''}
        </Text>
        <Text style={localStyles.textCode}>{rate.cur}</Text>
      </View>

      {isEditing ? (
        <>
          <TextInput
            style={localStyles.cellInput}
            placeholder={t.buy}
            value={buyingPrice}
            onChangeText={setBuyingPrice}
            keyboardType="decimal-pad"
          />
          <TextInput
            style={localStyles.cellInput}
            placeholder={t.sell}
            value={sellingPrice}
            onChangeText={setSellingPrice}
            keyboardType="decimal-pad"
          />
          <View style={localStyles.actionCell}>
            <TouchableOpacity
              style={[localStyles.smallButton, localStyles.buttonUpdate]}
              onPress={handleUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={localStyles.smallButtonText}>{t.update || 'Update'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={localStyles.cell}>
            <Text style={localStyles.priceText}>{buyingPrice}</Text>
          </View>
          <View style={localStyles.cell}>
            <Text style={localStyles.priceText}>{sellingPrice}</Text>
          </View>
          <View style={localStyles.actionCell}>
            <TouchableOpacity
              style={localStyles.smallButton}
              onPress={handleStartEdit}
              disabled={isUpdating || isLiveUpdating}
            >
              <Text style={localStyles.smallButtonText}>{t.edit || 'Edit'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[localStyles.smallButton, localStyles.buttonUpdate, localStyles.liveButton]}
              onPress={() => onLiveUpdate(rate.cur)}
              disabled={isUpdating || isLiveUpdating}
            >
              <Text style={localStyles.smallButtonText}>
                {isLiveUpdating ? t.updating : t.liveUpdate}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const UpdateExRates = () => {
  const [rates, setRates] = useState<any[]>([]);
  const [filterText, setFilterText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [updatingCur, setUpdatingCur] = useState<string | null>(null);
  const [liveUpdatingCur, setLiveUpdatingCur] = useState<string | null>(null);
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);
  const [liveBaseCurrency, setLiveBaseCurrency] = useState('CHF');
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [failedCurrencies, setFailedCurrencies] = useState<string[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);

  const ratesMap = useMemo(() => {
    return rates.reduce((acc: Record<string, any>, rate) => {
      if (rate?.cur) acc[rate.cur] = rate;
      return acc;
    }, {} as Record<string, any>);
  }, [rates]);

  useEffect(() => {
    const init = async () => {
      const u = await getCurrentUser();
      setOwnerId(u.userId);
      await fetchRates();
    };
    init();
  }, []);

  const fetchRates = async () => {
    try {
      setIsLoading(true);
      let allItems: any[] = [];
      let nextToken: string | null = null;

      // Page through results to ensure we load all exchange rates
      do {
        const res: any = await client.graphql({
          query: listExRates,
          variables: { limit: 1000, nextToken }
        });

        const items = res?.data?.listExRates?.items || [];
        allItems = allItems.concat(items);
        nextToken = res?.data?.listExRates?.nextToken || null;
      } while (nextToken);

      // Sort by country name for easy scanning
      const sorted = [...allItems].sort((a, b) => {
        const nameA = countryNamesByCode[a.cur] || a.cur;
        const nameB = countryNamesByCode[b.cur] || b.cur;
        return nameA.localeCompare(nameB);
      });
      setRates(sorted);
    } catch (e) {
      console.warn('Error fetching rates:', e);
      Alert.alert('Error', 'Could not load exchange rates');
    } finally {
      setIsLoading(false);
    }
  };

  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = { ...translations.en, ...(translations[lang] || {}) };

  const verifyOwner = async () => {
    const compDtls: any = await client.graphql({
      query: getCompany,
      variables: { AdminId: "BaruchHabaB'ShemAdonai2" }
    });
    const ownersss = compDtls?.data?.getCompany?.owner;
    if (ownersss !== ownerId) {
      Alert.alert(t.accessDenied);
      return false;
    }
    return true;
  };

  const handleUpdate = async (cur: string, buyingPrice: string, sellingPrice: string) => {
    setUpdatingCur(cur);
    try {
      if (!(await verifyOwner())) {
        setUpdatingCur(null);
        return;
      }
      await client.graphql({
        query: updateExRates,
        variables: {
          input: {
            cur,
            buyingPrice,
            sellingPrice
          }
        }
      });
      setRates(prev =>
        prev.map(r =>
          r.cur === cur ? { ...r, buyingPrice, sellingPrice } : r
        )
      );
      Alert.alert(t.success, `${t.successRatesUpdated} ${cur}`);
    } catch (e) {
      console.error('Update error:', e);
      Alert.alert(t.error, t.errorUpdateRates);
    } finally {
      setUpdatingCur(null);
    }
  };

  const handleLiveUpdateRow = async (cur: string) => {
    setLiveUpdatingCur(cur);
    setUpdateStatus(t.updatingCurrency.replace('{cur}', cur));
    setFailedCurrencies([]);
    try {
      if (!(await verifyOwner())) return;
      const liveRates = await fetchLiveRatesByBaseCurrency(liveBaseCurrency);
      if (!liveRates) {
        setUpdateStatus(t.errorLiveRatesFetch);
        Alert.alert(t.error, t.errorLiveRatesFetch);
        return;
      }
      const newRates = buildCHFBasedRatesFromLive(liveRates, ratesMap);
      const row = newRates[cur];
      if (!row) {
        setUpdateStatus(t.errorUnsupportedCurrency);
        Alert.alert(t.error, t.errorUnsupportedCurrency);
        return;
      }
      await client.graphql({
        query: updateExRates,
        variables: {
          input: {
            cur,
            buyingPrice: String(row.buyingPrice),
            sellingPrice: String(row.sellingPrice)
          }
        }
      });
      await fetchRates();
      setUpdateStatus(`${t.successRatesUpdated} ${cur}`);
      Alert.alert(t.success, `${t.successRatesUpdated} ${cur}`);
    } catch (e) {
      console.error('Live row update error:', e);
      setUpdateStatus(t.errorUpdateRates);
      Alert.alert(t.error, t.errorUpdateRates);
    } finally {
      setLiveUpdatingCur(null);
    }
  };

  const handleUpdateAllFromLive = async () => {
    setIsUpdatingAll(true);
    setUpdateStatus(t.updatingAllFromLive.replace('{base}', liveBaseCurrency));
    setFailedCurrencies([]);
    try {
      if (!(await verifyOwner())) return;
      const liveRates = await fetchLiveRatesByBaseCurrency(liveBaseCurrency);
      if (!liveRates) {
        setUpdateStatus(t.errorLiveRatesFetch);
        Alert.alert(t.error, t.errorLiveRatesFetch);
        return;
      }
      const newRates = buildCHFBasedRatesFromLive(liveRates, ratesMap);
      const entries = Object.entries(newRates);
      if (!entries.length) {
        setUpdateStatus(t.errorNoLiveRateUpdates);
        Alert.alert(t.error, t.errorNoLiveRateUpdates);
        return;
      }
      const failed: string[] = [];
      for (const [cur, row] of entries) {
        setUpdateStatus(t.updatingCurrency.replace('{cur}', cur));
        try {
          await client.graphql({
            query: updateExRates,
            variables: {
              input: {
                cur,
                buyingPrice: String(row.buyingPrice),
                sellingPrice: String(row.sellingPrice)
              }
            }
          });
        } catch (e) {
          console.error(`Bulk update failed for ${cur}:`, e);
          failed.push(cur);
        }
      }
      await fetchRates();
      if (failed.length) {
        setFailedCurrencies(failed);
        setUpdateStatus(t.partialLiveUpdate);
        Alert.alert(
          t.partialLiveUpdate,
          t.partialUpdateFailed.replace('{currencies}', failed.join(', '))
        );
      } else {
        setUpdateStatus(t.successLiveRatesUpdated);
        Alert.alert(t.success, t.successLiveRatesUpdated);
      }
    } catch (e) {
      console.error('Live all update error:', e);
      setUpdateStatus(t.errorUpdateRates);
      Alert.alert(t.error, t.errorUpdateRates);
    } finally {
      setIsUpdatingAll(false);
    }
  };

  // Filter rates based on country name or code
  const filteredRates = useMemo(() => {
    if (!filterText.trim()) return rates;
    const query = filterText.toLowerCase();
    return rates.filter(r => {
      const countryName = countryNamesByCode[r.cur] || r.cur;
      return countryName.toLowerCase().includes(query) || r.cur.toLowerCase().includes(query);
    });
  }, [rates, filterText]);

  return (
    <View style={localStyles.container}>
      {/* <Text style={localStyles.title}>{t.title}</Text> */}

      {/*
      <View style={localStyles.livePanel}>
        <TouchableOpacity
          style={[localStyles.primaryButton, isUpdatingAll && localStyles.primaryButtonDisabled]}
          onPress={handleUpdateAllFromLive}
          disabled={isUpdatingAll}
        >
          {isUpdatingAll ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={localStyles.primaryButtonText}>{t.updateAllFromLive.replace('{base}', liveBaseCurrency)}</Text>
          )}
        </TouchableOpacity>
      </View>
      */}

      {/* Filter Panel */}
      <View style={localStyles.filterPanel}>
        <TextInput
          style={localStyles.filterInput}
          placeholder={t.filterPlaceholder}
          value={filterText}
          onChangeText={setFilterText}
        />
        <TouchableOpacity
          style={[localStyles.refreshButton, isLoading && localStyles.refreshButtonDisabled]}
          onPress={fetchRates}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="refresh" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {updateStatus ? (
        <View style={localStyles.statusPanel}>
          <Text style={localStyles.statusText}>{updateStatus}</Text>
          {failedCurrencies.length > 0 && (
            <Text style={localStyles.errorText}>
              {t.partialUpdateFailed.replace('{currencies}', failedCurrencies.join(', '))}
            </Text>
          )}
        </View>
      ) : null}

      {/* Header Row */}
      <View style={[localStyles.row, localStyles.headerRow]}>
        <Text style={[localStyles.cellCountry, localStyles.headerText]}>{t.headerSymbol}</Text>
        <Text style={[localStyles.cell, localStyles.headerText]}>{t.headerBuying}</Text>
        <Text style={[localStyles.cell, localStyles.headerText]}>{t.headerSelling}</Text>
        <View style={[localStyles.cell, localStyles.headerLiveCell]}>
          <Text style={[localStyles.headerText, localStyles.headerLiveText]}>{t.headerLive}</Text>
          <TouchableOpacity
            style={[localStyles.iconButton, isUpdatingAll && localStyles.iconButtonDisabled]}
            onPress={handleUpdateAllFromLive}
            disabled={isUpdatingAll}
            activeOpacity={0.7}
          >
            {isUpdatingAll ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="refresh" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Rates List */}
      {filteredRates.length > 0 ? (
        <FlatList
          data={filteredRates}
          keyExtractor={item => item.cur}
          renderItem={({ item }) => (
            <ExRateRow
              rate={item}
              onUpdate={handleUpdate}
              onLiveUpdate={handleLiveUpdateRow}
              isUpdating={updatingCur === item.cur}
              isLiveUpdating={liveUpdatingCur === item.cur}
            />
          )}
          scrollEnabled={true}
        />
      ) : (
        <Text style={localStyles.emptyText}>
          {rates.length === 0 ? t.loadingRates : t.noCountriesMatch}
        </Text>
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  filterPanel: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  refreshButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#2c5364',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonDisabled: {
    opacity: 0.6,
  },
  headerRow: {
    backgroundColor: '#e58d29',
    marginBottom: 8,
    borderRadius: 6,
  },
  headerText: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  cellCountry: {
    flex: 1.5,
    paddingRight: 8,
  },
  textLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  textCode: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  cell: {
    flex: 1,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellInput: {
    width: 72,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    marginHorizontal: 4,
    backgroundColor: '#f9f9f9',
  },
  actionCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  button: {
    flex: 0.8,
    backgroundColor: '#2c5364',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: '#2c5364',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  headerLiveCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  headerLiveText: {
    marginRight: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2c5364',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonDisabled: {
    opacity: 0.6,
  },
  baseCurrencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusPanel: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statusText: {
    color: '#333',
    fontSize: 13,
    marginBottom: 4,
  },
  errorText: {
    color: '#b02a37',
    fontSize: 12,
  },
  baseCurrencyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  baseCurrencyInput: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    color: '#333',
  },
  livePanel: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  smallButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#2c5364',
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonUpdate: {
    backgroundColor: '#ADD8E6',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    color: '#999',
  },
});

export default UpdateExRates;
