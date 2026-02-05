import React, { useEffect, useState } from 'react';
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { formatAmountSync } from '../../../src/utils/exchange';

// Static mapping from CreateAllExRates (should be kept in sync)
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

// Helper to map nationality (country name or code) to code for ratesMap
function nationalityToCode(nationality: string | undefined | null): string | undefined {
  if (!nationality) return undefined;
  // If already a code
  if (countryNamesByCode[nationality]) return nationality;
  // Try to find code by name
  const found = Object.entries(countryNamesByCode).find(([, name]) => name.toLowerCase() === nationality.toLowerCase());
  if (found) return found[0];
  return undefined;
}
import { View, Text, ScrollView, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { getUrl } from 'aws-amplify/storage';

export interface SMAccount {
  SMAc: {
    name: string;
    balance: number;
    ttlDpstSM: number;
    TtlWthdrwnSM: number;
    benefitsAmount: number;
    MaxTymsBL: number;
    photoPassport?: string; // Amplify Storage key
    idFront?: string;       // optional S3 key
    idBack?: string;        // optional S3 key
  };
}

const SMCvLnStts = (props: SMAccount) => {
  const {
    SMAc: { name, balance, ttlDpstSM, TtlWthdrwnSM, benefitsAmount, MaxTymsBL, photoPassport, idFront, idBack },
  } = props;

  const [photoUrls, setPhotoUrls] = useState<{ passport?: string; idFront?: string; idBack?: string }>({});
  const [loadingPhotos, setLoadingPhotos] = useState(true);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const urls: any = {};
        if (photoPassport) {
          const passportUrl = await getUrl({ key: photoPassport });
          urls.passport = passportUrl.url.toString();
        }
        if (idFront) {
          const idFrontUrl = await getUrl({ key: idFront });
          urls.idFront = idFrontUrl.url.toString();
        }
        if (idBack) {
          const idBackUrl = await getUrl({ key: idBack });
          urls.idBack = idBackUrl.url.toString();
        }
        setPhotoUrls(urls);
      } catch (err) {
        console.log('Error fetching photos:', err);
      } finally {
        setLoadingPhotos(false);
      }
    };
    fetchPhotos();
  }, [photoPassport, idFront, idBack]);

  const { nationality, ratesMap } = useExchange();
  // Map nationality (country name or code) to code for ratesMap
  const nationalityCode: string | undefined = nationalityToCode(nationality === null ? undefined : nationality);
  const ratesMapSafe: Record<string, any> | undefined = ratesMap === null ? undefined : ratesMap;
  return (
    <ScrollView style={styles.pageContainer} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        {loadingPhotos ? (
          <ActivityIndicator size="large" color="#e58d29" />
        ) : photoUrls.passport ? (
          <Image source={{ uri: photoUrls.passport }} style={styles.passportImage} />
        ) : (
          <View style={[styles.passportImage, { backgroundColor: '#eee' }]} />
        )}
        <Text style={styles.userName}>{name}</Text>
      </View>

      {/* Account Info Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account Overview</Text>
        <Text style={styles.infoRow}>
          <Text style={styles.label}>Balance: </Text>{formatAmountSync(balance, nationalityCode, ratesMapSafe)}
        </Text>
        <Text style={styles.infoRow}>
          <Text style={styles.label}>Times Blacklisted: </Text>{MaxTymsBL}
        </Text>
        <Text style={styles.infoRow}>
          <Text style={styles.label}>Secured Benefits Pooled: </Text>{formatAmountSync(benefitsAmount, nationalityCode, ratesMapSafe)}
        </Text>
      </View>

      {/* Cash Flow Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Cash Flow</Text>
        <Text style={styles.infoRow}>
          <Text style={styles.label}>Total Deposits: </Text>{formatAmountSync(ttlDpstSM, nationalityCode, ratesMapSafe)}
        </Text>
        <Text style={styles.infoRow}>
          <Text style={styles.label}>Total Withdrawn: </Text>{formatAmountSync(TtlWthdrwnSM, nationalityCode, ratesMapSafe)}
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
