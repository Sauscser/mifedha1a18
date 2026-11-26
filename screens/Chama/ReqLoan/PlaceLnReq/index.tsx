import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Image
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { printAsync, printToFileAsync } from '../../../../src/utils/print';
import { shareFile } from '../../../../src/utils/share';
import {
  createMessages,
  createReqLoanChama,
  sendNotification
} from '../../../../src/graphql/mutations';
import {
  getAdvocate,
  getChamaAdminLnApply,
  getChamaMembers,
  getGroup,
  getSMAccount,
  getChamaMinutes,
  listMinuteItemsByMinutes,
  listAttendanceByMinutes
} from '../../../../src/graphql/queries';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { getUrl } from 'aws-amplify/storage';


import { useExchange } from '../../../../src/contexts/ExchangeContext';
import { BASE_EXCHANGE_SYMBOL, convertUserCurrencyToCHF, formatAmountSync, getCurrencyIsoFromCountryCode } from '../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../src/utils/nationalityToCode';
import { useTranslation } from 'react-i18next';
import translations from './translation';

const client = generateClient();

/* =========================
   SAFE IMAGE COMPONENT
   ========================= */
const SafeImage = ({ uri, style, t }: { uri?: string; style: any; t: any }) => {
  if (!uri || typeof uri !== 'string' || uri.trim() === '') {
    return <Text style={styles.signatureMissing}>{t.notSigned}</Text>;
  }
  return <Image source={{ uri }} style={style} />;
};

const CreateBiz = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const [Sign2Phn, setSign2Phn] = useState(''); // Advocate license number
  const [itemPrys, setitemPrys] = useState(''); // Take home amount
  const [InstAmt, setInstAmt] = useState(''); // Installment amount
  const [rpymntPrd, setrpymntPrd] = useState(''); // Installment interval in days
  // Remove user input for number of installments; it will be calculated
  const [pword, setPW] = useState('');
  // The group admin sets interest; the member chooses installment amount and interval.
  const [isLoading, setIsLoading] = useState(false);
  const [ChmNm, setChmNm] = useState('');
  const [defaultPenalty, setDefaultPenalty] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userNationality, setUserNationality] = useState<string>(null);
  const navigation = useNavigation();
  const route = useRoute<any>();
  const grpContacts = route.params?.groupContact;
  const MembaId = route.params?.MembaId;
  const id = route.params?.id;
  const ChamaNMember = MembaId + grpContacts;
  const [appDetails, setAppDetails] = useState<any | null>(null);
  const [groupDetails, setGroupDetails] = useState<any | null>(null);
  const [selectedMinutes, setSelectedMinutes] = useState<any | null>(null);
  const [loadingMinutes, setLoadingMinutes] = useState(false);

  const { ratesMap } = useExchange();
  const userCurrencyKey = nationalityToCode(userNationality);
  const currencySymbol = ratesMap?.[userCurrencyKey]?.symbol || userCurrencyKey || '';

  // Parse amount input
  const parseAmountInput = (value: string): number => {
    if (!value || value.trim() === '') return 0;
    // Remove commas and whitespace before parsing
    const cleaned = value.replace(/,/g, '').replace(/\s+/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // --- Dynamic Calculation State ---
  const [totalRepay, setTotalRepay] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [calculationError, setCalculationError] = useState(false);

  // --- Helper: Annual Compounding Reducing Balance ---
  // Calculate number of installments needed to pay off the loan
  // Using the amortization formula, solve for n (number of installments)
  function calculateInstallments(principal: number, rate: number, installment: number, installmentDays: number) {
    // rate: annual interest in percent
    // installmentDays: days between installments
    // installment: amount per payment
    if (!principal || !Number.isFinite(rate) || !installment || !installmentDays) return { n: 0, totalRepay: 0, totalInterest: 0 };
    const r = rate / 100;
    // Compounding: effective periodic rate for the interval
    const periodRate = Math.pow(1 + r, installmentDays / 365) - 1;
    // If interest is 0, simple division
    if (periodRate === 0) {
      const n = Math.ceil(principal / installment);
      const totalRepay = n * installment;
      const totalInterest = totalRepay - principal;
      return { n, totalRepay, totalInterest };
    }
    // Solve for n: A = P * [r(1+r)^n] / [(1+r)^n - 1]  => n = log(A/(A - Pr)) / log(1 + r)
    const A = installment;
    const P = principal;
    const rPer = periodRate;
    const denominator = A - P * rPer;
    if (denominator <= 0) return { n: 0, totalRepay: 0, totalInterest: 0 };
    const n = Math.log(A / denominator) / Math.log(1 + rPer);
    const nCeil = Math.ceil(n);
    const totalRepay = nCeil * installment;
    const totalInterest = totalRepay - principal;
    return { n: nCeil, totalRepay, totalInterest };
  }

  // --- Helper: Transaction Fee Logic (from Cov/index.tsx) ---
  // Transaction fee logic matching Cov/index.tsx
  function computeTransactionFee(principal: number, advocateInvolved: boolean, company: any) {
    if (!company) return 0;
    // Use company.userLoanTransferFee and company.CoverageFee (should be numbers or numeric strings)
    const transferFee = parseFloat(company.userLoanTransferFee || '0');
    const coverageFee = parseFloat(company.CoverageFee || '0');
    let fee = transferFee * principal;
    if (advocateInvolved) {
      fee += coverageFee * principal;
    }
    return fee;
  }

  // --- Dynamic Calculation Effect ---
  const [calculatedInstallments, setCalculatedInstallments] = useState(0);
  const [calculatedRepaymentPeriod, setCalculatedRepaymentPeriod] = useState(0);
  useEffect(() => {
    const principalUserCurrency = parseAmountInput(itemPrys);
    const installmentUserCurrency = parseAmountInput(InstAmt);
    const installmentDays = Number(rpymntPrd);
    const interest = Number(appDetails?.loanInterest || 0);
    const currencyIso = userCurrencyKey ? getCurrencyIsoFromCountryCode(userCurrencyKey) : null;
    const userRate = ratesMap?.[userCurrencyKey] ||
      (currencyIso ? ratesMap?.[currencyIso] : undefined) ||
      (userNationality ? ratesMap?.[userNationality] : undefined);
    const sellingPrice = Number(userRate?.sellingPrice);

    if (!principalUserCurrency || !installmentUserCurrency || !Number.isInteger(installmentDays) || installmentDays < 1) {
      setTotalRepay(0);
      setTotalInterest(0);
      setTotalFee(0);
      setCalculatedInstallments(0);
      setCalculatedRepaymentPeriod(0);
      setCalculationError(false);
      return;
    }

    if (!Number.isFinite(sellingPrice) || sellingPrice <= 0) {
      setTotalRepay(0);
      setTotalInterest(0);
      setTotalFee(0);
      setCalculatedInstallments(0);
      setCalculatedRepaymentPeriod(0);
      setCalculationError(true);
      return;
    }

    setCalculationError(false);
    // Convert user input to CHF before financial calculations.
    const principalCHF = principalUserCurrency / sellingPrice;
    const installmentCHF = installmentUserCurrency / sellingPrice;
    const company = groupDetails;
    const advocateInvolved = !!Sign2Phn && Sign2Phn.trim() !== '' && Sign2Phn.trim().toLowerCase() !== 'none';
    const { n, totalRepay, totalInterest } = calculateInstallments(principalCHF, interest, installmentCHF, installmentDays);
    const feeCHF = computeTransactionFee(principalCHF, advocateInvolved, company);
    setTotalRepay(totalRepay);
    setTotalInterest(totalInterest);
    setTotalFee(feeCHF);
    setCalculatedInstallments(n);
    setCalculatedRepaymentPeriod(n * installmentDays);
  }, [itemPrys, InstAmt, rpymntPrd, appDetails?.loanInterest, groupDetails, Sign2Phn, userCurrencyKey, userNationality, ratesMap]);

  // Handle money input with 2-decimal enforcement
  const handleMoneyInput = (setter: (value: string) => void) => (value: string) => {
    if (/^\d*(\.\d{0,2})?$/.test(value) || value === '') {
      setter(value);
    }
  };

  // Format to exactly 2 decimals on blur
  const formatMoneyOnBlur = (value: string, setter: (value: string) => void) => {
    const num = parseAmountInput(value);
    if (num > 0) {
      setter(num.toFixed(2));
    }
  };

  

  useEffect(() => {
    const prefetch = async () => {
      try {
        const attributes = await fetchUserAttributes();
        const userData = await client.graphql({
          query: getSMAccount,
          variables: { awsemail: attributes.email },
        });
        setUserNationality(userData?.data?.getSMAccount?.nationality);

        const appRes: any = await client.graphql({
          query: getChamaAdminLnApply,
          variables: { id }
        });
        setAppDetails(appRes?.data?.getChamaAdminLnApply || null);

        const groupRes: any = await client.graphql({
          query: getGroup,
          variables: { grpContact: grpContacts }
        });
        setGroupDetails(groupRes?.data?.getGroup || null);
      } catch (e) {
        console.log('Prefetch error', e);
      }
    };
    prefetch();
  }, [id, grpContacts]);

  /* =========================
     FETCH MINUTES
     ========================= */
  const fetchMinutesForLoan = async (loanMinutesId: string) => {
    if (!loanMinutesId) {
      Alert.alert(t.noMinutesLinked);
      return;
    }
    setLoadingMinutes(true);
    try {
      const res: any = await client.graphql({
        query: getChamaMinutes,
        variables: { id: loanMinutesId }
      });
      const minutes = res?.data?.getChamaMinutes;
      if (!minutes) {
        Alert.alert(t.minutesNotFound);
        setLoadingMinutes(false);
        return;
      }
      
      if (minutes.status !== 'LOCKED') {
        Alert.alert(t.chairNotSigned);
        return;
      }
      const [itemsRes, attendanceRes] = await Promise.all([
        client.graphql({
          query: listMinuteItemsByMinutes,
          variables: { minutesId: minutes.id }
        }),
        client.graphql({
          query: listAttendanceByMinutes,
          variables: { minutesId: minutes.id }
        })
      ]);
      const chairSignUrl = minutes.chairpersonId
        ? (await getUrl({ key: minutes.chairpersonId }))?.url?.toString()
        : null;
      const secSignUrl = minutes.secretaryId
        ? (await getUrl({ key: minutes.secretaryId }))?.url?.toString()
        : null;
      console.log('DEBUG PlaceLnReq chairSignUrl:', chairSignUrl, 'secSignUrl:', secSignUrl, 'keys:', minutes.chairpersonId, minutes.secretaryId);
      setSelectedMinutes({
        ...minutes,
        grpName: groupDetails?.grpName || minutes.grpName || 'Group',
        items: itemsRes?.data?.listMinuteItemsByMinutes?.items || [],
        attendance: attendanceRes?.data?.listAttendanceByMinutes?.items || [],
        chairSignUrl,
        secSignUrl
      });
    } catch (err) {
      console.error(err);
      Alert.alert(t.errorFetchingMinutes, t.failedFetchMinutes || '');
    } finally {
      setLoadingMinutes(false);
    }
  };

  /* =========================
     EXPORT MINUTES TO PDF
     ========================= */
  const exportMinutesToPDF = async (min: any) => {
    if (!min) return;
    try {
      const present = (min.attendance || []).filter(
        (a: any) => a.attendanceStatus === 'PRESENT'
      );
      const html = `
        <html>
        <head><style>
          body { font-family: Arial; padding: 20px; }
          h1 { color: #e58d29; }
          .item { margin-bottom: 12px; }
          .decision { font-style: italic; color: #065f46; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #ddd; padding: 6px; }
          .signatures { margin-top: 24px; display: flex; justify-content: space-between; }
          img { max-height: 80px; }
        </style></head>
        <body>
          <h1>${min.grpName} — ${t.minutes}</h1>
          <p><strong>${t.date}:</strong> ${min.meetingDate}</p>
          <p><strong>${t.venue}:</strong> ${min.venue || "-"}</p>
          <p><strong>${t.attendance}:</strong> ${present.length}</p>

          <h2>${t.minuteItems}</h2>
          ${(min.items || []).map((i: any) => `
            <div class="item">
              <strong>${i.entryOrder}. ${i.minuteRef}</strong>
              <p>${i.content}</p>
              ${i.decision ? `<div class="decision">${t.decision}: ${i.decision}</div>` : ""}
            </div>
          `).join("")}

          <h2>${t.attendanceList}</h2>
          <table>
            <tr><th>${t.attendanceList}</th><th>Status</th></tr>
            ${(min.attendance || []).map((a: any) => `<tr><td>${a.memberName}</td><td>${a.attendanceStatus}</td></tr>`).join("")}
          </table>

          <h2>${t.signatures}</h2>
          <div class="signatures">
            <div>
              <strong>${t.chairperson}</strong><br/>
              ${min.chairSignUrl ? `<img src="${min.chairSignUrl}" />` : t.notSigned}
            </div>
            <div>
              <strong>${t.secretary}</strong><br/>
              ${min.secSignUrl ? `<img src="${min.secSignUrl}" />` : t.notSigned}
            </div>
          </div>
        </body>
        </html>
      `;
      const { uri } = await printToFileAsync({ html });
      await shareFile(uri, t.exportToPDF);
    } catch (err) {
      console.error(err);
      Alert.alert(t.pdfError, t.failedExportPDF);
    }
  };

  /* =========================
     LOAN REQUEST HANDLER
     ========================= */
  const submitLoanRequest = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const attributes = await fetchUserAttributes();
      // validation
      if (
        !itemPrys.trim() ||
        !rpymntPrd.trim() ||
        !InstAmt.trim() ||
        !defaultPenalty.trim() ||
        !pword.trim()
      ) {
        Alert.alert(t.fillAllFields);
        return;
      }

      const defaultPenaltyUserAmount = parseAmountInput(defaultPenalty);
      if (!Number.isFinite(defaultPenaltyUserAmount) || defaultPenaltyUserAmount < 0) {
        Alert.alert(t.fillAllFields);
        return;
      }

      const smRes: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: attributes.email
        }
      });

      const pws = smRes.data.getSMAccount.pw;
      const phonecontacts = smRes.data.getSMAccount.phonecontact;
      const names = smRes.data.getSMAccount.name;

      // validate password
      if (pword !== pws) {
        Alert.alert(t.wrongPassword);
        return;
      }

      // validate installment interval
      const installmentDays = Number(rpymntPrd);
      if (!Number.isInteger(installmentDays) || installmentDays < 1) {
        Alert.alert(t.enterRepaymentPeriod);
        return;
      }

      // validate member
      const memberRes: any = await client.graphql({
        query: getChamaMembers,
        variables: {
          ChamaNMember
        }
      });
      const memberData = memberRes.data.getChamaMembers;
      if (!memberData) {
        Alert.alert(t.memberNotFound);
        setIsLoading(false);
        return;
      }

      // fetch application and group details
      const appRes: any = await client.graphql({
        query: getChamaAdminLnApply,
        variables: { id }
      });
      const AppDtls = appRes.data.getChamaAdminLnApply;
      const interest = Number(AppDtls?.loanInterest);
      if (!Number.isFinite(interest) || interest < 0) {
        Alert.alert(t.errorSupport);
        return;
      }
      if (interest > 100) {
        Alert.alert(t.interestExploits);
        return;
      }

      const groupRes: any = await client.graphql({
        query: getGroup,
        variables: { grpContact: grpContacts }
      });
      const grpDtls = groupRes.data.getGroup;
      const grpName = grpDtls.grpName;
      const signitoryContact = grpDtls.signitoryContact;
      const signitory2Sub = grpDtls.signitory2Sub;
      const Signatory3Email = grpDtls.Signatory3Email;
      const SignatoryEmail = grpDtls.SignatoryEmail;

      // Convert user-entered money to CHF before comparing amounts or saving backend values.
      const loanAmountCHF = await convertUserCurrencyToCHF(parseAmountInput(itemPrys), userCurrencyKey);
      const installmentAmountCHF = await convertUserCurrencyToCHF(parseAmountInput(InstAmt), userCurrencyKey);
      const defaultPenaltyCHF = await convertUserCurrencyToCHF(defaultPenaltyUserAmount, userCurrencyKey);

      // Confirmation prompt
      // Compute transaction fee and summary for confirmation dialog
      const principalUserCurrency = parseAmountInput(itemPrys);
      const installmentUserCurrency = parseAmountInput(InstAmt);
      const principal = loanAmountCHF;
      const installment = installmentAmountCHF;
      const company = groupDetails;
      const advocateInvolved = !!Sign2Phn && Sign2Phn.trim() !== '' && Sign2Phn.trim().toLowerCase() !== 'none';
      const { n, totalRepay, totalInterest } = calculateInstallments(principal, interest, installment, installmentDays);
      if (n <= 0) {
        Alert.alert(t.enterInstallment);
        return;
      }
      const fee = computeTransactionFee(principal, advocateInvolved, company);
      const summary =
        `${t.principalAmount || 'Principal'}: ${currencySymbol} ${principalUserCurrency.toFixed(2)}\n` +
        `${t.installmentAmountPlaceholder || 'Installment'}: ${currencySymbol} ${installmentUserCurrency.toFixed(2)}\n` +
        `${t.interestPerYear || 'Interest Rate'}: ${interest}%\n` +
        `${t.totalRepayable || 'Total Repayable'}: ${formatAmountSync(totalRepay, userCurrencyKey, ratesMap, BASE_EXCHANGE_SYMBOL)}\n` +
        `${t.totalInterest || 'Total Interest'}: ${formatAmountSync(totalInterest, userCurrencyKey, ratesMap, BASE_EXCHANGE_SYMBOL)}\n` +
        `${t.totalTransactionFee || 'Total Transaction Fee'}: ${formatAmountSync(fee, userCurrencyKey, ratesMap, BASE_EXCHANGE_SYMBOL)}\n` +
        `${t.numberOfInstallments || 'Number of Installments'}: ${n}\n` +
        `${t.totalRepaymentDuration || 'Total Repayment Duration'}: ${n * installmentDays} ${(t.days || 'days')}`;
      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          t.confirmLoanRequest || 'Confirm Loan Request',
          summary + `\n\n${t.submitRequestQn || 'Submit request?'} `,
          [
            { text: t.cancel || 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: t.submit || 'Submit', onPress: () => resolve(true) }
          ]
        );
      });

      if (!confirmed) {
        setIsLoading(false);
        return;
      }

      // advocate handling
      let advocateEmail = "None";
      let advocateLicense = "None";
      if (Sign2Phn && Sign2Phn.trim() !== "") {
        const advRes: any = await client.graphql({
          query: getAdvocate,
          variables: {
            advregnu: Sign2Phn.trim()
          }
        });
        if (advRes?.data?.getAdvocate) {
          advocateEmail = advRes.data.getAdvocate.email;
          advocateLicense = Sign2Phn.trim();
        } else {
          Alert.alert(t.advocateNotFound);
        }
      }

      // create loan request
      await client.graphql({
        query: createReqLoanChama,
        variables: {
          input: {
            loaneeEmail: attributes.email,
            chamaPhone: grpContacts,
            loaneeName: names,
            confirm1: "NO",
            confirm2: "NO",
            loaneePhone: phonecontacts,
            amount: Math.round(loanAmountCHF).toString(),
            repaymentAmt: interest,
            repaymentPeriod: n * installmentDays,
            loaneeMemberId: MembaId,
            status: "AwaitingResponse",
            statusNumber: 0,
            dfltDeadLn: 0,
            AdvEmail: advocateEmail,
            advLicNo: advocateLicense,
            lnType: "GrpLn",
            loanerName: grpName,
            loanerPhone: signitoryContact,
            description: ChmNm ? ChmNm : "No description",
            defaultPenalty: defaultPenaltyCHF,
            installmentAmount: Math.round(installmentAmountCHF).toString(),
            paymentFrequency: installmentDays,
            signatory2: signitory2Sub,
            signatory3: Signatory3Email,
            membersApprove: 0,
            loanMinutes: AppDtls.grpMinutes,
            loanMinutesImage: AppDtls.MemberEmail,
            loanFloatID: id,
            owner: SignatoryEmail,
            createdAt: new Date().toISOString()
          }
        }
      });

      // notify advocate if present
      if (advocateEmail !== "None") {
        await client.graphql({
          query: createMessages,
          variables: {
            input: {
              senderEmail: advocateEmail,
              messageBody: `A loan request has been made by ${names} under group ${grpName}. Please review and witness or decline.`
            }
          }
        });
        await client.graphql({
          query: sendNotification,
          variables: {
            riderEmail: advocateEmail,
            title: "NiSenti: New Loan Request",
            body: `A loan request has been made by ${names} under group ${grpName}.`
          }
        });
      }

      // notify group admin
      await client.graphql({
        query: createMessages,
        variables: {
          input: {
            senderEmail: AppDtls.ChamaAdminEmail,
            messageBody: `A loan request has been made by ${names} under group ${grpName}. Please review.`
          }
        }
      });
      await client.graphql({
        query: sendNotification,
        variables: {
          riderEmail: AppDtls.ChamaAdminEmail,
          title: "NiSenti: New Loan Request",
          body: `A loan request has been made by ${names} under group ${grpName}.`
        }
      });

      Alert.alert(t.loanRequestSuccess);
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert(t.errorSupport);
    } finally {
      setIsLoading(false);
    }
  }; 

    return (
    <LinearGradient
      colors={['skyblue', '#e58d29']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.loanRequest}</Text>
          <Text style={styles.headerSubtitle}>
            {t.fillDetails}
          </Text>

          {!!appDetails?.grpMinutes && (
            <TouchableOpacity
              style={styles.viewMinutesBtn}
              onPress={() => fetchMinutesForLoan(appDetails.grpMinutes)}
            >
              <Text style={styles.viewMinutesText}>{t.viewLinkedMinutes}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Advocate License Number */}
          <View style={styles.inputGroup}>
            <TextInput
              placeholder={t.advocateLicensePlaceholder}
              placeholderTextColor="#333"
              value={Sign2Phn}
              onChangeText={setSign2Phn}
              style={styles.input}
            />
            <Text style={styles.helperText}>{t.advocateLicense}</Text>
          </View>

          {/* Take Home Amount */}
          <View style={styles.inputGroup}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ marginRight: 6, fontWeight: 'bold', fontSize: 16 }}>{currencySymbol}</Text>
              <TextInput
                placeholder={t.loanAmountPlaceholder}
                placeholderTextColor="#333"
                keyboardType="decimal-pad"
                value={itemPrys}
                onChangeText={handleMoneyInput(setitemPrys)}
                onBlur={() => formatMoneyOnBlur(itemPrys, setitemPrys)}
                style={[styles.input, { flex: 1 }]}
              />
            </View>
            <Text style={styles.helperText}>{t.principalAmount} ({currencySymbol})</Text>
          </View>

          {/* Installment Amount */}
          <View style={styles.inputGroup}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ marginRight: 6, fontWeight: 'bold', fontSize: 16 }}>{currencySymbol}</Text>
              <TextInput
                placeholder={t.installmentAmountPlaceholder}
                placeholderTextColor="#333"
                keyboardType="decimal-pad"
                value={InstAmt}
                onChangeText={handleMoneyInput(setInstAmt)}
                onBlur={() => formatMoneyOnBlur(InstAmt, setInstAmt)}
                style={[styles.input, { flex: 1 }]}
              />
            </View>
            <Text style={styles.helperText}>{t.installmentAmountPlaceholder} ({currencySymbol})</Text>
          </View>

          {/* Default Penalty */}
          <View style={styles.inputGroup}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ marginRight: 6, fontWeight: 'bold', fontSize: 16 }}>{currencySymbol}</Text>
              <TextInput
                placeholder={t.defaultPenaltyPlaceholder}
                placeholderTextColor="#333"
                keyboardType="decimal-pad"
                value={defaultPenalty}
                onChangeText={handleMoneyInput(setDefaultPenalty)}
                onBlur={() => formatMoneyOnBlur(defaultPenalty, setDefaultPenalty)}
                style={[styles.input, { flex: 1 }]}
              />
            </View>
            <Text style={styles.helperText}>{t.penaltyOnDefault} ({currencySymbol})</Text>
          </View>



          {/* Calculated Number of Installments (output only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.helperText}>{t.numberOfInstallments || 'Number of Installments'}: {calculatedInstallments > 0 ? calculatedInstallments : '-'}</Text>
          </View>

          {/* Calculated Total Repayment Period (output only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.helperText}>{t.totalRepaymentDuration || 'Total Repayment Duration'}: {calculatedRepaymentPeriod > 0 ? calculatedRepaymentPeriod + ' ' + (t.days || 'days') : '-'}</Text>
          </View>

          {/* Installment Interval in Days */}
          <View style={styles.inputGroup}>
            <TextInput
              placeholder={t.installmentDaysPlaceholder}
              placeholderTextColor="#333"
              keyboardType="decimal-pad"
              value={rpymntPrd}
              onChangeText={setrpymntPrd}
              style={styles.input}
            />
            <Text style={styles.helperText}>{t.installmentIntervalInDays || 'Installment Interval (days)'}</Text>
          </View>

          {/* Password */}
          <View style={{ position: 'relative' }}>
            <TextInput
              placeholder={t.userPasswordPlaceholder}
              placeholderTextColor="#333"
              secureTextEntry={!showPassword}
              value={pword}
              onChangeText={setPW}
              style={styles.input}
            />
            <TouchableOpacity
              style={{ position: 'absolute', right: 10, top: 14 }}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={{ color: '#6b7280', fontSize: 14 }}>
                {showPassword ? t.hide : t.show}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Dynamic Calculation Output */}
          <View style={{ marginTop: 18, marginBottom: 8 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{t.calculationSummary || 'Calculation Summary'}</Text>
            <Text>{t.totalRepayable || 'Total Repayable'}: {formatAmountSync(totalRepay, userCurrencyKey, ratesMap, BASE_EXCHANGE_SYMBOL)}</Text>
            <Text>{t.totalInterest || 'Total Interest'}: {formatAmountSync(totalInterest, userCurrencyKey, ratesMap, BASE_EXCHANGE_SYMBOL)}</Text>
            <Text>{t.totalTransactionFee || 'Total Transaction Fee'}: {formatAmountSync(totalFee, userCurrencyKey, ratesMap, BASE_EXCHANGE_SYMBOL)}</Text>
            {calculationError && <Text style={styles.helperText}>{t.errorSupport}</Text>}
            <Text>{t.interestPerYear || 'Interest Rate'}: {appDetails?.loanInterest || 0}%</Text>
            <Text>{t.numberOfInstallments || 'Number of Installments'}: {calculatedInstallments > 0 ? calculatedInstallments : '-'}</Text>
            <Text>{t.totalRepaymentDuration || 'Total Repayment Duration'}: {calculatedRepaymentPeriod > 0 ? calculatedRepaymentPeriod + ' ' + (t.days || 'days') : '-'}</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={submitLoanRequest}
          activeOpacity={0.85}
        >
          <Text style={styles.submitButtonText}>{t.requestLoan}</Text>
          {isLoading && (
            <ActivityIndicator color="#fff" style={{ marginLeft: 10 }} />
          )}
        </TouchableOpacity>

        {/* Minutes Modal */}
        <Modal
          visible={!!selectedMinutes}
          transparent
          onRequestClose={() => setSelectedMinutes(null)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: '#000000aa',
              justifyContent: 'center'
            }}
          >
            {loadingMinutes ? (
              <ActivityIndicator size="large" color="#e58d29" />
            ) : (
              <ScrollView style={styles.minutesModal}>
                <View style={styles.minutesCard}>
                  <Text style={styles.groupTitle}>
                    {selectedMinutes?.grpName} — {t.minutes}
                  </Text>
                  <Text style={styles.date}>📅 {selectedMinutes?.meetingDate}</Text>
                  <Text style={styles.meta}>
                    {t.venue}: {selectedMinutes?.venue || '-'}
                  </Text>
                  <Text style={styles.meta}>
                    {t.attendance}: {' '}
                    {(selectedMinutes?.attendance || []).filter(
                      (a: any) => a.attendanceStatus === 'PRESENT'
                    ).length}
                  </Text>

                  <TouchableOpacity
                    style={styles.exportBtn}
                    onPress={() => exportMinutesToPDF(selectedMinutes)}
                  >
                    <Text style={styles.exportText}>{t.exportToPDF}</Text>
                  </TouchableOpacity>

                  <Text style={styles.section}>{t.minuteItems}</Text>
                  {(selectedMinutes?.items || [])
                    .sort(
                      (a: any, b: any) =>
                        (a.entryOrder || 0) - (b.entryOrder || 0)
                    )
                    .map((item: any) => (
                      <View key={item.id} style={styles.minuteItem}>
                        <Text style={styles.minuteTitle}>
                          {item.entryOrder}. {item.minuteRef}
                        </Text>
                        <Text>{item.content}</Text>
                        {item.decision && (
                          <Text style={styles.decision}>
                            {t.decision}: {item.decision}
                          </Text>
                        )}
                      </View>
                    ))}

                  <Text style={styles.section}>{t.attendanceList}</Text>
                  {(selectedMinutes?.attendance || []).map(
                    (a: any, idx: number) => (
                      <View key={idx} style={styles.memberRow}>
                        <Text>
                          {a.memberName} — {a.attendanceStatus}
                        </Text>
                      </View>
                    )
                  )}

                  <Text style={styles.section}>{t.signatures}</Text>
                  <View style={styles.signatures}>
                    <View style={styles.signatureBlock}>
                      <Text style={styles.signatureLabel}>{t.chairperson}</Text>
                      <SafeImage
                        uri={selectedMinutes?.chairSignUrl}
                        style={styles.signature}
                        t={t}
                      />
                    </View>
                    <View style={styles.signatureBlock}>
                      <Text style={styles.signatureLabel}>{t.secretary}</Text>
                      <SafeImage
                        uri={selectedMinutes?.secSignUrl}
                        style={styles.signature}
                        t={t}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setSelectedMinutes(null)}
                  >
                    <Text style={{ color: '#fff' }}>{t.close}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </Modal>
      </ScrollView>
    </LinearGradient>
  );
};

export default CreateBiz;

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginTop: 40,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#eef6ff',
    marginTop: 6,
  },
  viewMinutesBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  viewMinutesText: {
    color: '#1f2937',
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 30,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#111827',
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
    color: '#6b7280',
  },
  submitButton: {
    backgroundColor: '#e58d29',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#e58d29',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  /* ---------------- Minutes modal ---------------- */
  minutesModal: {
    margin: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    maxHeight: 650,
  },
  minutesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  groupTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1f2937',
    textAlign: 'center',
  },
  date: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    textAlign: 'center',
  },
  meta: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  section: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    color: '#111827',
  },
  minuteItem: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  minuteTitle: {
    fontWeight: '700',
    marginBottom: 4,
    color: '#1f2937',
  },
  decision: {
    marginTop: 6,
    fontStyle: 'italic',
    color: '#065f46',
  },
  memberRow: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  signatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    marginBottom: 12,
  },
  signatureBlock: {
    alignItems: 'center',
    width: 140,
  },
  signatureLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    color: '#374151',
  },
  signatureMissing: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#9ca3af',
    marginTop: 8,
  },
  signature: {
    width: 120,
    height: 60,
    resizeMode: 'contain',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  exportBtn: {
    marginTop: 12,
    marginBottom: 16,
    backgroundColor: '#e58d29',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  closeBtn: {
    alignSelf: 'center',
    marginTop: 20,
    backgroundColor: '#e58d29',
    padding: 10,
    borderRadius: 8,
  },
});
