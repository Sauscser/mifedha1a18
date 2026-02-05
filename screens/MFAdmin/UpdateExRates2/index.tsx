// @ts-nocheck
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, StyleSheet, FlatList } from 'react-native';
import styles from './styles';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { listExRates, getCompany } from '../../../src/graphql/queries';
import { updateExRates } from '../../../src/graphql/mutations';

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
const ExRateRow = ({ rate, onUpdate, isUpdating }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [buyingPrice, setBuyingPrice] = useState(String(rate.buyingPrice || ''));
  const [sellingPrice, setSellingPrice] = useState(String(rate.sellingPrice || ''));
  const countryName = countryNamesByCode[rate.cur] || rate.cur;

  const handleChange = () => {
    setIsEditing(true);
  };

  const handleUpdate = async () => {
    if (!buyingPrice || !sellingPrice) {
      Alert.alert('Error', 'Please enter both rates');
      return;
    }
    await onUpdate(rate.cur, buyingPrice, sellingPrice);
    setIsEditing(false);
  };

  return (
    <View style={localStyles.row}>
      <View style={localStyles.cellCountry}>
        <Text style={localStyles.textLabel}>{countryName}</Text>
        <Text style={localStyles.textCode}>{rate.cur}</Text>
      </View>

      {isEditing ? (
        <>
          <TextInput
            style={localStyles.cellInput}
            placeholder="Buy"
            value={buyingPrice}
            onChangeText={setBuyingPrice}
            keyboardType="decimal-pad"
          />
          <TextInput
            style={localStyles.cellInput}
            placeholder="Sell"
            value={sellingPrice}
            onChangeText={setSellingPrice}
            keyboardType="decimal-pad"
          />
        </>
      ) : (
        <>
          <View style={localStyles.cell}>
            <Text style={localStyles.priceText}>{buyingPrice}</Text>
          </View>
          <View style={localStyles.cell}>
            <Text style={localStyles.priceText}>{sellingPrice}</Text>
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
  const [ownerId, setOwnerId] = useState<string | null>(null);

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

  const handleUpdate = async (cur: string, buyingPrice: string, sellingPrice: string) => {
    setUpdatingCur(cur);
    try {
      const compDtls: any = await client.graphql({
        query: getCompany,
        variables: { AdminId: "BaruchHabaB'ShemAdonai2" }
      });
      const ownersss = compDtls?.data?.getCompany?.owner;
      if (ownersss !== ownerId) {
        Alert.alert('Access Denied');
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
      // Update local state
      setRates(prev =>
        prev.map(r =>
          r.cur === cur ? { ...r, buyingPrice, sellingPrice } : r
        )
      );
      Alert.alert('Success', `Rates updated for ${cur}`);
    } catch (e) {
      console.error('Update error:', e);
      Alert.alert('Error', 'Failed to update rates');
    } finally {
      setUpdatingCur(null);
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
      <Text style={localStyles.title}>Exchange Rates for Kenyan Shilling</Text>

      {/* Filter Panel */}
      <View style={localStyles.filterPanel}>
        <TextInput
          style={localStyles.filterInput}
          placeholder="Filter countries (e.g., Kenya, KE, India...)"
          value={filterText}
          onChangeText={setFilterText}
        />
      </View>

      {/* Header Row */}
      <View style={[localStyles.row, localStyles.headerRow]}>
        <Text style={[localStyles.cellCountry, localStyles.headerText]}>Country</Text>
        <Text style={[localStyles.cell, localStyles.headerText]}>Buying </Text>
        <Text style={[localStyles.cell, localStyles.headerText]}>Selling</Text>
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
              isUpdating={updatingCur === item.cur}
            />
          )}
          scrollEnabled={true}
        />
      ) : (
        <Text style={localStyles.emptyText}>
          {rates.length === 0 ? 'Loading rates...' : 'No countries match filter'}
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
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
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
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    marginHorizontal: 4,
    backgroundColor: '#f9f9f9',
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
  buttonUpdate: {
    backgroundColor: '#ADD8E6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    color: '#999',
  },
});

export default UpdateExRates;
