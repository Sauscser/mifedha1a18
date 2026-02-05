
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import styles from './styles';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { getCompany, listExRates } from '../../../src/graphql/queries';
import { createExRates } from '../../../src/graphql/mutations';
const client = generateClient();

// Country codes and names
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

const currencyByCountry: Record<string, { code: string; symbol: string }> = {
  AF: { code: 'AFN', symbol: '؋' }, AL: { code: 'ALL', symbol: 'L' }, DZ: { code: 'DZD', symbol: 'دج' }, AS: { code: 'USD', symbol: '$' },
  AD: { code: 'EUR', symbol: '€' }, AO: { code: 'AOA', symbol: 'Kz' }, AI: { code: 'XCD', symbol: '$' }, AG: { code: 'XCD', symbol: '$' },
  AR: { code: 'ARS', symbol: '$' }, AM: { code: 'AMD', symbol: '֏' }, AW: { code: 'AWG', symbol: 'ƒ' }, AU: { code: 'AUD', symbol: '$' },
  AT: { code: 'EUR', symbol: '€' }, AZ: { code: 'AZN', symbol: '₼' }, BS: { code: 'BSD', symbol: '$' }, BH: { code: 'BHD', symbol: '.د.ب' },
  BD: { code: 'BDT', symbol: '৳' }, BB: { code: 'BBD', symbol: '$' }, BY: { code: 'BYN', symbol: 'Br' }, BE: { code: 'EUR', symbol: '€' },
  BZ: { code: 'BZD', symbol: '$' }, BJ: { code: 'XOF', symbol: 'CFA' }, BM: { code: 'BMD', symbol: '$' }, BT: { code: 'BTN', symbol: 'Nu.' },
  BO: { code: 'BOB', symbol: 'Bs.' }, BA: { code: 'BAM', symbol: 'KM' }, BW: { code: 'BWP', symbol: 'P' }, BR: { code: 'BRL', symbol: 'R$' },
  BN: { code: 'BND', symbol: '$' }, BG: { code: 'BGN', symbol: 'лв' }, BF: { code: 'XOF', symbol: 'CFA' }, BI: { code: 'BIF', symbol: 'FBu' },
  KH: { code: 'KHR', symbol: '៛' }, CM: { code: 'XAF', symbol: 'FCFA' }, CA: { code: 'CAD', symbol: '$' }, CV: { code: 'CVE', symbol: '$' },
  KY: { code: 'KYD', symbol: '$' }, CF: { code: 'XAF', symbol: 'FCFA' }, TD: { code: 'XAF', symbol: 'FCFA' }, CL: { code: 'CLP', symbol: '$' },
  CN: { code: 'CNY', symbol: '¥' }, CO: { code: 'COP', symbol: '$' }, CR: { code: 'CRC', symbol: '₡' }, HR: { code: 'EUR', symbol: '€' },
  CU: { code: 'CUP', symbol: '$' }, CY: { code: 'EUR', symbol: '€' }, CZ: { code: 'CZK', symbol: 'Kč' }, DK: { code: 'DKK', symbol: 'kr' },
  DJ: { code: 'DJF', symbol: 'Fdj' }, DO: { code: 'DOP', symbol: 'RD$' }, EC: { code: 'USD', symbol: '$' }, EG: { code: 'EGP', symbol: '£' },
  SV: { code: 'USD', symbol: '$' }, GQ: { code: 'XAF', symbol: 'FCFA' }, ER: { code: 'ERN', symbol: 'Nfk' }, EE: { code: 'EUR', symbol: '€' },
  ET: { code: 'ETB', symbol: 'Br' }, FJ: { code: 'FJD', symbol: '$' }, FI: { code: 'EUR', symbol: '€' }, FR: { code: 'EUR', symbol: '€' },
  GA: { code: 'XAF', symbol: 'FCFA' }, GM: { code: 'GMD', symbol: 'D' }, GE: { code: 'GEL', symbol: '₾' }, DE: { code: 'EUR', symbol: '€' },
  GH: { code: 'GHS', symbol: '₵' }, GR: { code: 'EUR', symbol: '€' }, GT: { code: 'GTQ', symbol: 'Q' }, HN: { code: 'HNL', symbol: 'L' },
  HK: { code: 'HKD', symbol: '$' }, HU: { code: 'HUF', symbol: 'Ft' }, IS: { code: 'ISK', symbol: 'kr' }, IN: { code: 'INR', symbol: '₹' },
  ID: { code: 'IDR', symbol: 'Rp' }, IR: { code: 'IRR', symbol: '﷼' }, IQ: { code: 'IQD', symbol: 'ع.د' }, IE: { code: 'EUR', symbol: '€' },
  IL: { code: 'ILS', symbol: '₪' }, IT: { code: 'EUR', symbol: '€' }, JM: { code: 'JMD', symbol: 'J$' }, JP: { code: 'JPY', symbol: '¥' },
  JO: { code: 'JOD', symbol: 'JD' }, KZ: { code: 'KZT', symbol: '₸' }, KE: { code: 'KES', symbol: 'Ksh' }, KI: { code: 'AUD', symbol: '$' },
  KP: { code: 'KPW', symbol: '₩' }, KR: { code: 'KRW', symbol: '₩' }, KW: { code: 'KWD', symbol: 'د.ك' }, KG: { code: 'KGS', symbol: 'лв' },
  LA: { code: 'LAK', symbol: '₭' }, LV: { code: 'EUR', symbol: '€' }, LB: { code: 'LBP', symbol: 'ل.ل' }, LS: { code: 'LSL', symbol: 'L' },
  LR: { code: 'LRD', symbol: '$' }, LY: { code: 'LYD', symbol: 'ل.د' }, LI: { code: 'CHF', symbol: 'Fr' }, LT: { code: 'EUR', symbol: '€' },
  LU: { code: 'EUR', symbol: '€' }, MO: { code: 'MOP', symbol: 'P' }, MW: { code: 'MWK', symbol: 'MK' }, MY: { code: 'MYR', symbol: 'RM' },
  MV: { code: 'MVR', symbol: 'Rf' }, ML: { code: 'XOF', symbol: 'CFA' }, MT: { code: 'EUR', symbol: '€' }, MH: { code: 'USD', symbol: '$' },
  MQ: { code: 'EUR', symbol: '€' }, MR: { code: 'MRU', symbol: 'UM' }, MU: { code: 'MUR', symbol: '₨' }, MX: { code: 'MXN', symbol: '$' },
  FM: { code: 'USD', symbol: '$' }, MD: { code: 'MDL', symbol: 'L' }, MC: { code: 'EUR', symbol: '€' }, MN: { code: 'MNT', symbol: '₮' },
  ME: { code: 'EUR', symbol: '€' }, MA: { code: 'MAD', symbol: 'د.م.' }, MZ: { code: 'MZN', symbol: 'MT' }, MM: { code: 'MMK', symbol: 'K' },
  NA: { code: 'NAD', symbol: '$' }, NR: { code: 'AUD', symbol: '$' }, NP: { code: 'NPR', symbol: '₨' }, NL: { code: 'EUR', symbol: '€' },
  NZ: { code: 'NZD', symbol: '$' }, NI: { code: 'NIO', symbol: 'C$' }, NE: { code: 'XOF', symbol: 'CFA' }, NG: { code: 'NGN', symbol: '₦' },
  NO: { code: 'NOK', symbol: 'kr' }, OM: { code: 'OMR', symbol: 'ر.ع.' }, PK: { code: 'PKR', symbol: '₨' }, PA: { code: 'PAB', symbol: 'B/.' },
  PG: { code: 'PGK', symbol: 'K' }, PY: { code: 'PYG', symbol: '₲' }, PE: { code: 'PEN', symbol: 'S/' }, PH: { code: 'PHP', symbol: '₱' },
  PL: { code: 'PLN', symbol: 'zł' }, PT: { code: 'EUR', symbol: '€' }, QA: { code: 'QAR', symbol: 'ر.ق' }, RO: { code: 'RON', symbol: 'lei' },
  RU: { code: 'RUB', symbol: '₽' }, RW: { code: 'RWF', symbol: 'FRw' }, SA: { code: 'SAR', symbol: 'ر.س' }, SN: { code: 'XOF', symbol: 'CFA' },
  RS: { code: 'RSD', symbol: 'дин.' }, SG: { code: 'SGD', symbol: '$' }, SK: { code: 'EUR', symbol: '€' }, SI: { code: 'EUR', symbol: '€' },
  ES: { code: 'EUR', symbol: '€' }, LK: { code: 'LKR', symbol: '₨' }, SD: { code: 'SDG', symbol: 'ج.س.' }, SR: { code: 'SRD', symbol: '$' },
  SZ: { code: 'SZL', symbol: 'E' }, SE: { code: 'SEK', symbol: 'kr' }, CH: { code: 'CHF', symbol: 'Fr' }, SY: { code: 'SYP', symbol: '£' },
  TW: { code: 'TWD', symbol: 'NT$' }, TJ: { code: 'TJS', symbol: 'ЅM' }, TZ: { code: 'TZS', symbol: 'TSh' }, TH: { code: 'THB', symbol: '฿' },
  TL: { code: 'USD', symbol: '$' }, TG: { code: 'XOF', symbol: 'CFA' }, TO: { code: 'TOP', symbol: 'T$' }, TT: { code: 'TTD', symbol: 'TT$' },
  TN: { code: 'TND', symbol: 'د.ت' }, TR: { code: 'TRY', symbol: '₺' }, TM: { code: 'TMT', symbol: 'm' }, UG: { code: 'UGX', symbol: 'USh' },
  UA: { code: 'UAH', symbol: '₴' }, AE: { code: 'AED', symbol: 'د.إ' }, GB: { code: 'GBP', symbol: '£' }, US: { code: 'USD', symbol: '$' },
  UY: { code: 'UYU', symbol: '$U' }, UZ: { code: 'UZS', symbol: 'soʻm' }, VU: { code: 'VUV', symbol: 'VT' }, VE: { code: 'VES', symbol: 'Bs.S' },
  VN: { code: 'VND', symbol: '₫' }, YE: { code: 'YER', symbol: '﷼' }, ZA: { code: 'ZAR', symbol: 'R' }, ZM: { code: 'ZMW', symbol: 'ZK' },
  ZW: { code: 'ZWL', symbol: 'Z$' },
  AX: { code: 'EUR', symbol: '€' }, BQ: { code: 'USD', symbol: '$' }, CW: { code: 'ANG', symbol: 'ƒ' }, PS: { code: 'ILS', symbol: '₪' },
  SS: { code: 'SSP', symbol: '£' }, XK: { code: 'EUR', symbol: '€' }, GG: { code: 'GBP', symbol: '£' }, IM: { code: 'GBP', symbol: '£' },
  JE: { code: 'GBP', symbol: '£' }, SJ: { code: 'NOK', symbol: 'kr' }, BV: { code: 'NOK', symbol: 'kr' }, GS: { code: 'GBP', symbol: '£' },
  PN: { code: 'NZD', symbol: '$' }, TK: { code: 'NZD', symbol: '$' }, WF: { code: 'XPF', symbol: '₣' }, EH: { code: 'MAD', symbol: 'د.م.' },
  GI: { code: 'GIP', symbol: '£' }, PM: { code: 'EUR', symbol: '€' }, RE: { code: 'EUR', symbol: '€' }, YT: { code: 'EUR', symbol: '€' },
  GP: { code: 'EUR', symbol: '€' }, BL: { code: 'EUR', symbol: '€' }, MF: { code: 'EUR', symbol: '€' }, GF: { code: 'EUR', symbol: '€' },
  PF: { code: 'XPF', symbol: '₣' }, NC: { code: 'XPF', symbol: '₣' }, SX: { code: 'ANG', symbol: 'ƒ' }, TC: { code: 'USD', symbol: '$' },
  VG: { code: 'USD', symbol: '$' }, VI: { code: 'USD', symbol: '$' }, GW: { code: 'XOF', symbol: 'CFA' }, KN: { code: 'XCD', symbol: '$' },
  LC: { code: 'XCD', symbol: '$' }, VC: { code: 'XCD', symbol: '$' }, DM: { code: 'XCD', symbol: '$' }, GD: { code: 'XCD', symbol: '$' },
  FK: { code: 'FKP', symbol: '£' }, GL: { code: 'DKK', symbol: 'kr' }, IO: { code: 'USD', symbol: '$' }, CC: { code: 'AUD', symbol: '$' },
  CX: { code: 'AUD', symbol: '$' },
};

const getCurrencyInfo = (countryCode: string) => {
  return currencyByCountry[countryCode] || { code: countryCode, symbol: countryCode };
};

const CreateAllExRates = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [progress, setProgress] = useState('0/0');
  const [statusText, setStatusText] = useState('Ready to create exchange rates');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const u = await getCurrentUser();
        setOwnerId(u.userId);
        setStatusText('✓ User authenticated');
      } catch (e) {
        Alert.alert('Error', 'Failed to authenticate user');
        setStatusText('✗ Authentication failed');
      }
    };
    fetchUser();
  }, []);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const createAllRates = async () => {
    setIsLoading(true);
    setStatusText('Verifying access...');
    setProgress('0/250');

    try {
      // Verify admin access
      const compDtls: any = await client.graphql({
        query: getCompany,
        variables: { AdminId: "BaruchHabaB'ShemAdonai2" }
      });

      const ownersss = compDtls.data.getCompany.owner;
      if (ownersss !== ownerId) {
        Alert.alert('❌ Access Denied', 'You do not have permission to create exchange rates.');
        setIsLoading(false);
        setStatusText('✗ Access denied');
        return;
      }

      setStatusText('Access verified. Starting batch creation...');
      const countryCodesArray = Object.keys(countryNamesByCode);
      let successCount = 0;
      const failedList: string[] = [];

      for (let i = 0; i < countryCodesArray.length; i++) {
        const code = countryCodesArray[i];
        const countryName = countryNamesByCode[code];
        const { code: currencyCode, symbol } = getCurrencyInfo(code);
        const buyingPrice = code === 'KE' ? '1' : '100';
        const sellingPrice = code === 'KE' ? '1' : '101';

        setProgress(`${i + 1}/${countryCodesArray.length}`);
        setStatusText(`Creating ${countryName} (${code})...`);

        try {
          const response: any = await client.graphql({
            query: createExRates,
            variables: {
              input: {
                cur: code,
                sellingPrice: String(sellingPrice),
                buyingPrice: String(buyingPrice),
                symbol: symbol
              }
            }
          });

          // Check if creation was successful
          if (response?.data?.createExRates?.cur === code) {
            successCount++;
            setStatusText(`✓ ${countryName} created successfully`);
          } else {
            failedList.push(`${code} (${countryName}) - No confirmation from server`);
            setStatusText(`✗ ${countryName} - No response`);
          }
        } catch (e: any) {
          const errorMsg = e?.message || 'Unknown error';
          failedList.push(`${code} (${countryName}) - ${errorMsg}`);
          setStatusText(`✗ ${countryName} failed`);
        }

        // Delay to prevent rate limiting
        if (i < countryCodesArray.length - 1) {
          await delay(150);
        }
      }

      // Verify what was actually saved
      setStatusText('Verifying records in database...');
      const verifyRes: any = await client.graphql({ query: listExRates });
      const savedRates = verifyRes?.data?.listExRates?.items || [];
      const savedCodes = new Set(savedRates.map((r: any) => r.cur));

      // Final report
      const message = `
✓ Created: ${successCount}
✗ Failed: ${failedList.length}
📊 Actually in DB: ${savedCodes.size}

${failedList.length > 0 ? '❌ Failed countries:\n' + failedList.slice(0, 5).join('\n') + (failedList.length > 5 ? '\n..and ' + (failedList.length - 5) + ' more' : '') : '✓ All succeeded!'}
      `;

      Alert.alert('Batch Complete', message);
      setStatusText(`Complete: ${successCount} created, ${failedList.length} failed`);
    } catch (e: any) {
      const errorMsg = e?.message || 'Unknown error';
      Alert.alert('Fatal Error', errorMsg);
      setStatusText(`✗ Error: ${errorMsg}`);
    }

    setIsLoading(false);
  };

  const localStyles = StyleSheet.create({
    statusBox: {
      backgroundColor: '#f5f5f5',
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#2196F3'
    },
    progressText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 4
    },
    statusMessage: {
      fontSize: 12,
      color: '#666',
      marginBottom: 8
    }
  });

  return (
    <View style={{ padding: 20, flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={true}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>
          Create All Exchange Rates
        </Text>

        <View style={localStyles.statusBox}>
          <Text style={localStyles.progressText}>Progress: {progress}</Text>
          <Text style={localStyles.statusMessage}>{statusText}</Text>
          {isLoading && <ActivityIndicator size="small" color="#2196F3" style={{ marginTop: 8 }} />}
        </View>

        <TouchableOpacity
          onPress={createAllRates}
          style={[styles.sendLoanButton, { opacity: isLoading ? 0.6 : 1 }]}
          disabled={isLoading}
        >
          <Text style={styles.sendLoanButtonText}>
            {isLoading ? '⏳ Processing...' : '🚀 Start Creating All Rates'}
          </Text>
        </TouchableOpacity>

        <View style={{ marginTop: 20, padding: 12, backgroundColor: '#fff3cd', borderRadius: 8 }}>
          <Text style={{ fontSize: 12, color: '#856404', lineHeight: 18 }}>
            ⚠️ This will create exchange rates for all {Object.keys(countryNamesByCode).length} countries and territories.
            {'\n\n'}
            • Process takes ~2-5 minutes
            {'\n'}
            • Rates will be verified in database
            {'\n'}
            • You can edit rates individually after creation
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default CreateAllExRates;
