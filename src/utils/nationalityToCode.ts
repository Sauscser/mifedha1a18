// Shared nationality-to-code mapping for currency formatting
export const countryNamesByCode: Record<string, string> = {
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

export function nationalityToCode(nationality: string | undefined | null): string | undefined {
  if (!nationality) return undefined;
  if (countryNamesByCode[nationality]) return nationality;
  const found = Object.entries(countryNamesByCode).find(([, name]) => name.toLowerCase() === nationality.toLowerCase());
  if (found) return found[0];
  return undefined;
}
