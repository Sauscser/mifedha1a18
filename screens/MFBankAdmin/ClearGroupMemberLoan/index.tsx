import { useTranslation } from 'react-i18next';
import { translations } from './translation';
import React, { useEffect, useState } from 'react';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  Linking
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { formatAmountSync } from '../../../src/utils/exchange';
import { getUrl } from '@aws-amplify/storage';
import ImageViewer from 'react-native-image-zoom-viewer';
import { LinearGradient } from 'expo-linear-gradient';
import { printAsync, printToFileAsync } from '../../../src/utils/print';
import { shareFile } from '../../../src/utils/share';

import {
  listGroups,
  listReqLoanChamas,
  listChamaMembers,
  listChamaLnApprovals,
  listGroupNonLoans,
  listCvrdGroupLoans,
  listGrpMembersContributions,
  listSMAccounts,
  listMinuteItemsByMinutes,
  listAttendanceByMinutes,
  listChamaMinutes,
} from '../../../src/graphql/queries';
import { createMessages, sendNotification, updateReqLoanChama } from '../../../src/graphql/mutations';

const SafeImage = ({ uri, style, t }: { uri?: string; style: any; t: any }) => {
  if (!uri || typeof uri !== 'string' || uri.trim() === '') {
    return <Text style={styles.signatureMissing}>{t.notSigned}</Text>;
  }
  return <Image source={{ uri }} style={style} />;
};

// Helper math
const tanh = (x: number) => Math.tanh(x);
const clip = (x: number, min = 0, max = 100) => Math.max(min, Math.min(max, x));

const AdminClearLoans = () => {
  const navigation = useNavigation();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const client = generateClient();
  const { nationality, ratesMap } = useExchange();
  // Currency pattern: always use nationalityToCode for currency key
  const userCurrencyKey = nationalityToCode(nationality);
  // Helper for all money display
  const formatMoney = (amount: number) => formatAmountSync(Number(amount || 0), userCurrencyKey, ratesMap);

  // Groups
  const [adminGroups, setAdminGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  // Loans + selection
  const [loans, setLoans] = useState<any[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<any | null>(null);

  // For approvals count math
  const [groupSize, setGroupSize] = useState<number>(0);

  // Loading flags
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingApprovals, setLoadingApprovals] = useState(false);
  const [loadingCredit, setLoadingCredit] = useState(false);
  const [loadingMinutes, setLoadingMinutes] = useState(false);

  // Inline image/text modals
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string | null>(null);

  // Approvals UI
  const [showApprovalsFor, setShowApprovalsFor] = useState<string | null>(null);
  const [approvingMembers, setApprovingMembers] = useState<any[]>([]);

  // Credit modal
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [memberCreditInfo, setMemberCreditInfo] = useState<any>(null);
  const [creditTab, setCreditTab] = useState<'group' | 'global' | 'blended'>('group');

  // Minutes selection
  const [selectedMinutes, setSelectedMinutes] = useState<any | null>(null);

  // Identification image URLs for export
  const [photoUrls, setPhotoUrls] = useState<{ passport?: string; idFront?: string; idBack?: string }>({});

  // Export loading state
  const [exportLoading, setExportLoading] = useState(false);

  // View PDF loading state
  const [viewPdfLoading, setViewPdfLoading] = useState(false);

  // Fetch admin groups
  useEffect(() => {
    const fetchAdminGroups = async () => {
      try {
        const user = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        const email = attributes?.email;
        const res: any = await client.graphql({ query: listGroups, variables: { filter: { BankAdminEmail: { eq: email } } } });
        setAdminGroups(res?.data?.listGroups?.items || []);
      } catch (err) {
        console.error(err);
        Alert.alert(t.errorTitle, t.failedToFetchGroupsMessage);
      }
    };
    fetchAdminGroups();
  }, []);

  // Fetch loans + member names + group size
  const fetchLoans = async (groupContact: string) => {
    setLoading(true);
    try {
      const loanRes: any = await client.graphql({ query: listReqLoanChamas, variables: { filter: { chamaPhone: { eq: groupContact }, status: { eq: 'AwaitingResponse' } } } });
      const loansRaw = loanRes?.data?.listReqLoanChamas?.items || [];

      const membersRes: any = await client.graphql({ query: listChamaMembers, variables: { filter: { groupContact: { eq: groupContact } } } });
      const members = membersRes?.data?.listChamaMembers?.items || [];
      setGroupSize(members.length);

      const loansWithNames = loansRaw.map((loan: any) => {
        const member = members.find((m: any) => m.memberContact === loan.loaneeEmail);
        return {
          ...loan,
          loaneeName: member?.memberName || 'Unknown',
        };
      });

      setLoans(loansWithNames);
    } catch (err) {
      console.error(err);
      Alert.alert(t.errorTitle, t.failedToFetchLoansMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch approvals for a loan
  const fetchApprovingMembers = async (loanId: string) => {
    if (!selectedGroup) return;
    setLoadingApprovals(true);
    try {
      const approvalsRes: any = await client.graphql({ query: listChamaLnApprovals, variables: { filter: { loanID: { eq: loanId } } } });
      setApprovingMembers(approvalsRes?.data?.listChamaLnApprovals?.items || []);
    } catch (err) {
      console.error(err);
      Alert.alert(t.errorTitle, t.failedToLoadApprovingMembersMessage);
    } finally {
      setLoadingApprovals(false);
    }
  };

  // Fetch minutes for a loan
  const fetchMinutesForLoan = async (loan: any) => {
    if (!loan?.loanMinutes) {
      Alert.alert(t.noMinutesTitle, t.noMinutesMessage);
      return;
    }
    if (!loan?.chamaPhone) {
      Alert.alert(t.invalidLoanTitle, t.invalidLoanMessage);
      return;
    }

    setLoadingMinutes(true);
    try {
      const res: any = await client.graphql({ query: listChamaMinutes, variables: { filter: { id: { eq: loan.loanMinutes } } } });

      const minutes = res?.data?.listChamaMinutes?.items || [];
      const min = minutes.find((m: any) => m.id === loan.loanMinutes);
      if (!min) {
        Alert.alert(t.noMinutesTitle, t.noMinutesMessage);
        return;
      }

      const [itemsResRaw, attendanceResRaw] = await Promise.all([
        client.graphql({ query: listMinuteItemsByMinutes, variables: { minutesId: min.id } }),
        client.graphql({ query: listAttendanceByMinutes, variables: { minutesId: min.id } }),
      ]);

      const itemsRes: any = itemsResRaw;
      const attendanceRes: any = attendanceResRaw;

      const chairSignRes: any = min.chairpersonId ? await getUrl({ key: min.chairpersonId }) : null;
      const secSignRes: any = min.secretaryId ? await getUrl({ key: min.secretaryId }) : null;
      const chairSignUrl = chairSignRes?.url ? String(chairSignRes.url) : null;
      const secSignUrl = secSignRes?.url ? String(secSignRes.url) : null;

      const fullMinutes = {
  ...min,
  items: (itemsRes as any)?.data?.listMinuteItemsByMinutes?.items || [],
  attendance: (attendanceRes as any)?.data?.listAttendanceByMinutes?.items || [],
  chairSignUrl,
  secSignUrl,
};

setSelectedMinutes(fullMinutes);
return fullMinutes;

    } catch (err) {
      console.error(err);
      Alert.alert(t.errorTitle, t.failedToFetchMinutesMessage);
    } finally {
      setLoadingMinutes(false);
    }
  };

  // Fetch identification images for the loanee (passport, ID front, ID back)
  const fetchLoaneePhotos = async (loaneeEmail: string) => {
    try {
      const smRes: any = await client.graphql({ query: listSMAccounts, variables: { filter: { awsemail: { eq: loaneeEmail } } } });
      const sm = smRes?.data?.listSMAccounts?.items?.[0];
      if (!sm) {
        setPhotoUrls({});
        return;
      }

      const urls: { passport?: string; idFront?: string; idBack?: string } = {};
      // Log and stringify keys for debugging
      if (sm.photoPassport && sm.photoPassport !== 'None') {
        const key = sm.photoPassport.toString();
        console.log('photoPassport key:', key);
        try {
          const res: any = await getUrl({ key });
          urls.passport = res?.url ? String(res.url) : undefined;
        } catch (err) {
          console.error('Error fetching passport image:', err, key);
        }
      }
      if (sm.idFront && sm.idFront !== 'None') {
        const key = sm.idFront.toString();
        console.log('idFront key:', key);
        try {
          const res: any = await getUrl({ key });
          urls.idFront = res?.url ? String(res.url) : undefined;
          if (!urls.idFront) {
            console.error('idFront getUrl returned no url for key:', key, res);
          }
        } catch (err) {
          console.error('Error fetching idFront image:', err, key);
        }
      }
      if (sm.idBack && sm.idBack !== 'None') {
        const key = sm.idBack.toString();
        console.log('idBack key:', key);
        try {
          const res: any = await getUrl({ key });
          urls.idBack = res?.url ? String(res.url) : undefined;
          if (!urls.idBack) {
            console.error('idBack getUrl returned no url for key:', key, res);
          }
        } catch (err) {
          console.error('Error fetching idBack image:', err, key);
        }
      }
      setPhotoUrls(urls);
    } catch (err) {
      console.error('Error fetching loanee photos:', err);
      setPhotoUrls({});
    }
  };

  // Fetch NiSenti credit info for a loanee (uses only the fields already in your code)
  const fetchMemberCredit = async (loaneeEmail: string, loaneeName: string) => {
    if (!selectedGroup) return;
    setLoadingCredit(true);
    try {
      const groupRes: any = await client.graphql({ query: listGroups, variables: { filter: { grpContact: { eq: selectedGroup.grpContact } } } });
      const grp = groupRes?.data?.listGroups?.items?.[0] || {};
      const grpBal = Number(grp.grpBal || 0);

      const memberRes: any = await client.graphql({ query: listChamaMembers, variables: { filter: { groupContact: { eq: selectedGroup.grpContact }, memberContact: { eq: loaneeEmail } } } });
      const memberItems = memberRes?.data?.listChamaMembers?.items || [];
      if (memberItems.length === 0) {
        Alert.alert(t.noMemberRecordTitle, t.noMemberRecordMessage.replace('{email}', loaneeEmail));
        setLoadingCredit(false);
        return;
      }

      let balance = 0, benefitsAmount = 0, p2pchmBenefits = 0, ttlDpstSM = 0, MaxTymsBL = 0;

      const smRes: any = await client.graphql({ query: listSMAccounts, variables: { filter: { awsemail: { eq: loaneeEmail } } } });
      const sm = smRes?.data?.listSMAccounts?.items?.[0] || {};
      balance = Number(sm.balance || 0);
      benefitsAmount = Number(sm.benefitsAmount || 0);
      p2pchmBenefits = Number(sm.p2pchmBenefits || 0);
      ttlDpstSM = Number(sm.ttlDpstSM || 0);
      MaxTymsBL = Number(sm.MaxTymsBL || 0);

      const glGroupRes: any = await client.graphql({ query: listCvrdGroupLoans, variables: { filter: { loaneePhn: { eq: loaneeEmail }, grpContact: { eq: selectedGroup.grpContact } } } });
      const glGroup = glGroupRes?.data?.listCvrdGroupLoans?.items || [];
      const amountGiven_group = glGroup.reduce((a: number, l: any) => a + Number(l.amountGiven ?? l.amount ?? 0), 0);
      const lonBala_group = glGroup.reduce((a: number, l: any) => a + Number(l.lonBala ?? l.balance ?? 0), 0);
      const amountRepaid_group = glGroup.reduce((a: number, l: any) => a + Number(l.amountRepaid ?? 0), 0);

      const glGlobalRes: any = await client.graphql({ query: listCvrdGroupLoans, variables: { filter: { loaneePhn: { eq: loaneeEmail } } } });
      const glGlobal = glGlobalRes?.data?.listCvrdGroupLoans?.items || [];
      const amountGiven_global = glGlobal.reduce((a: number, l: any) => a + Number(l.amountGiven ?? l.amount ?? 0), 0);
      const lonBala_global = glGlobal.reduce((a: number, l: any) => a + Number(l.lonBala ?? l.balance ?? 0), 0);
      const amountRepaid_global = glGlobal.reduce((a: number, l: any) => a + Number(l.amountRepaid ?? 0), 0);

      const nlGroupRes: any = await client.graphql({ query: listGroupNonLoans, variables: { filter: { recipientPhn: { eq: loaneeEmail }, grpContact: { eq: selectedGroup.grpContact } } } });
      const nlGroup = nlGroupRes?.data?.listGroupNonLoans?.items || [];
      const amountSent_group = nlGroup.reduce((a: number, r: any) => a + Number(r.amountSent ?? r.amount ?? 0), 0);

      const nlGlobalRes: any = await client.graphql({ query: listGroupNonLoans, variables: { filter: { recipientPhn: { eq: loaneeEmail } } } });
      const nlGlobal = nlGlobalRes?.data?.listGroupNonLoans?.items || [];
      const amountSent_global = nlGlobal.reduce((a: number, r: any) => a + Number(r.amountSent ?? r.amount ?? 0), 0);

      const contribGroupRes: any = await client.graphql({ query: listGrpMembersContributions, variables: { filter: { memberPhn: { eq: loaneeEmail }, grpContact: { eq: selectedGroup.grpContact } } } });
      const contribGroup = contribGroupRes?.data?.listGrpMembersContributions?.items || [];
      const contriAmount_group = contribGroup.reduce((a: number, c: any) => a + Number(c.contriAmount ?? c.amount ?? 0), 0);

      const contribGlobalRes: any = await client.graphql({ query: listGrpMembersContributions, variables: { filter: { memberPhn: { eq: loaneeEmail } } } });
      const contribGlobal = contribGlobalRes?.data?.listGrpMembersContributions?.items || [];
      const contriAmount_global = contribGlobal.reduce((a: number, c: any) => a + Number(c.contriAmount ?? c.amount ?? 0), 0);

      const L_group = balance + p2pchmBenefits + 0.5 * benefitsAmount;
      const L_global = balance + p2pchmBenefits + 0.5 * benefitsAmount + 0.3 * ttlDpstSM;

      const E_group = L_group / (1 + lonBala_group);
      const E_global = L_global / (1 + lonBala_global);

      const R_group = Math.min(1, amountRepaid_group / (1 + amountGiven_group));
      const R_global = Math.min(1, amountRepaid_global / (1 + amountGiven_global));

      const S_group = Math.log(1 + amountSent_group + contriAmount_group);
      const S_global = Math.log(1 + amountSent_global + contriAmount_global);

      const P_group = 0.15 * MaxTymsBL + 0.0005 * lonBala_group;
      const P_global = 0.15 * MaxTymsBL + 0.0003 * lonBala_global;

      const C_group =
        40 * tanh(E_group / 1000) +
        35 * R_group +
        15 * tanh(S_group / 5) -
        10 * Math.min(1, P_group);

      const C_global =
        35 * tanh(E_global / 1500) +
        35 * R_global +
        20 * tanh(S_global / 6) -
        10 * Math.min(1, P_global);

      const blendedScore = clip(0.6 * C_group + 0.4 * C_global);

      setMemberCreditInfo({
        name: loaneeName,
        grpBal,
        balance,
        benefitsAmount,
        p2pchmBenefits,
        ttlDpstSM,
        MaxTymsBL,
        amountGiven_group,
        lonBala_group,
        amountRepaid_group,
        amountGiven_global,
        lonBala_global,
        amountRepaid_global,
        amountSent_group,
        contriAmount_group,
        amountSent_global,
        contriAmount_global,
        L_group,
        L_global,
        E_group,
        E_global,
        R_group,
        R_global,
        S_group,
        S_global,
        P_group,
        P_global,
        C_group,
        C_global,
        creditScore: blendedScore,
      });

      setCreditTab('group');
      setShowCreditModal(true);
    } catch (err) {
      console.error(err);
      Alert.alert(t.errorTitle, t.failedToFetchMemberCreditInfoMessage);
    } finally {
      setLoadingCredit(false);
    }
  };

  // Clear loan
  const clearLoan = async (loan: any) => {
    if (!selectedGroup || !groupSize) return;

    const thresholdPercent = selectedGroup.loanApprovalThreshHold;
    const approvalPercent = Math.round((loan.membersApprove / groupSize) * 100);

    if (approvalPercent >= thresholdPercent) {
      try {
        await client.graphql({ query: updateReqLoanChama, variables: { input: { id: loan.id, status: 'Cleared' } } });

        const recipients = [
          { email: loan.loaneeEmail, name: loan.loaneeName },
          { email: loan.owner, name: 'Owner' },
          { email: loan.signatory2Email, name: 'Signatory 2' },
          { email: loan.signatory3Email, name: 'Signatory 3' },
        ].filter(r => r.email && r.email !== 'None');

        const messageBody = `${t.loanClearedMessage} ${selectedGroup.grpName} ${t.hasbeenclearedbybank}`;

        for (const r of recipients) {
          await client.graphql({ query: createMessages, variables: { input: { senderEmail: r.email, messageBody } } });
          await client.graphql({ query: sendNotification, variables: { riderEmail: r.email, title: t.loanClearedNotificationTitle, body: messageBody } });
        }

        Alert.alert(t.successTitle, t.loanClearedMessage);
        fetchLoans(selectedGroup.grpContact);
      } catch (err) {
        console.error(err);
        Alert.alert(t.errorTitle, t.failedToClearLoanMessage);
      }
    } else {
      Alert.alert(t.thresholdNotReachedTitle, t.thresholdNotReachedMessage.replace('{threshold}', thresholdPercent));
    }
  };

  // Export minutes only
  const { printToFileAsync } = require('../../../src/utils/print');
  const { shareFile } = require('../../../src/utils/share');
  const exportMinutesToPDF = async (min: any) => {
    if (!min) {
      Alert.alert(t.missingMinutesTitle, t.missingMinutesMessage);
      return;
    }
    try {
      const present = min.attendance.filter((a: any) => a.attendanceStatus === 'PRESENT');

      const html = `
        <html>
        <head><style>
          body { font-family: Arial; padding: 20px; }
          h1 { color: #e29d58; }
          .item { margin-bottom: 12px; }
          .decision { font-style: italic; color: #065f46; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #ddd; padding: 6px; }
          .signatures { margin-top: 24px; display: flex; flex-wrap: wrap; justify-content: space-around; align-items: center; gap: 24px; }
          .signatures div { text-align: center; width:48%; min-width: 160px; }
          .signature-img { max-height: 120px; max-width: 360px; width: auto; display: block; margin: 8px auto 0; }
          @media print { .signature-img { max-height: 112px; max-width: 320px; } }
        </style></head>
        <body>
          <h1>${selectedGroup?.grpName} — Official Minutes</h1>
          <p><strong>Date:</strong> ${min.meetingDate}</p>
          <p><strong>Venue:</strong> ${min.venue || "-"}</p>
          <p><strong>Attendance:</strong> ${present.length}</p>

          <h2>Minutes</h2>
          ${min.items
            .sort((a: any, b: any) => a.entryOrder - b.entryOrder)
            .map((i: any) => `
              <div class="item">
                <strong>${i.entryOrder}. ${i.minuteRef}</strong>
                <p>${i.content}</p>
                ${i.decision ? `<div class="decision">Decision: ${i.decision}</div>` : ""}
              </div>
            `).join("")}

          <h2>Attendance</h2>
          <table>
            <tr><th>Name</th><th>Status</th></tr>
            ${min.attendance.map((a: any) => `<tr><td>${a.memberName}</td><td>${a.attendanceStatus}</td></tr>`).join("")}
          </table>

          <div class="signatures">
            <div>
              <strong>Chairperson</strong><br/>
              ${min.chairSignUrl ? `<img class="signature-img" src="${min.chairSignUrl}" />` : "-"}
            </div>
            <div>
              <strong>Secretary</strong><br/>
              ${min.secSignUrl ? `<img class="signature-img" src="${min.secSignUrl}" />` : "-"}
            </div>
          </div>
        </body>
        </html>
      `;
      const { uri } = await printToFileAsync({ html });
      await shareFile(uri, 'Share Minutes PDF');
    } catch (err) {
      console.error(err);
      Alert.alert(t.pdfErrorTitle, t.failedToExportMinutesPDFMessage);
    }
  };

  // Export full loan report (original details preserved) + Identification images added with ample space
  const exportLoanReportToPDF = async () => {
    if (!selectedLoan) {
      Alert.alert(t.missingLoanTitle, t.missingLoanMessage);
      return;
    }
    setExportLoading(true);
    let minutes = selectedMinutes;

    if (!minutes && selectedLoan?.loanMinutes) {
      minutes = await fetchMinutesForLoan(selectedLoan);
    }
    const creditInfo = memberCreditInfo;
    const approvals = approvingMembers;

    try {
      const present = minutes?.attendance?.filter((a: any) => a.attendanceStatus === 'PRESENT') || [];

      // Always show only one ID document (prefer idFront, else idBack), label as 'Official Identity Document'
      const officialIdUrl = photoUrls.idFront || photoUrls.idBack;
      // Helper to check if a URL is a PDF
      const isPdf = (url?: string) => url && url.toLowerCase().endsWith('.pdf');

      const html = `
  <html>
  <head><style>
    body { font-family: Arial; padding: 20px; }
    h1 { color: #e29d58; }
    h2 { margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #ddd; padding: 6px; }
    .signatures { margin-top: 24px; display: flex; justify-content: space-between; align-items: center; gap: 24px; flex-wrap: wrap; }
    .signatures div { text-align: center; width:48%; min-width: 220px; }
    .signature-img { max-height: 120px; max-width: 360px; width: auto; display: block; margin: 8px auto 0; }
    @media print { .signature-img { max-height: 112px; max-width: 320px; } }
    img { max-width: 100%; height: auto; }

    /* Identification block - vertical, generous spacing, print-friendly */
    .id-section { display:block; gap:24px; margin-top:20px; }
    .id-block { margin-bottom: 24px; text-align: center; }
    .id-label { font-weight: 700; margin-bottom: 8px; }
    .passport { border:3px solid #e29d58; border-radius:8px; overflow:hidden; width:320px; height:420px; margin: 0 auto; }
    .id { border:2px solid #e29d58; border-radius:8px; width:360px; height:220px; overflow:hidden; margin: 0 auto; }
    .id img, .passport img { width:100%; height:100%; object-fit:cover; }

    /* Page-break hints for printing */
    @media print {
      .id-block { page-break-inside: avoid; }
      .signatures { page-break-inside: avoid; }
    }

    .item { margin-bottom: 12px; }
    .decision { font-style: italic; color: #065f46; }
  </style></head>
  <body>

   <h1>Identification</h1>
    <div class="id-section">
      ${photoUrls.passport ?
        `<div class="id-block"><div class="id-label">Passport / Portrait</div><div class="passport">
          <img src="${photoUrls.passport}" />
        </div></div>`
        : ""}
      ${officialIdUrl ?
        `<div class="id-block"><div class="id-label">Official Identity Document</div><div class="id">
          <a href="${officialIdUrl}" target="_blank" style="font-size:16px;color:#065f46;text-decoration:underline;">View PDF Document</a>
        </div></div>`
        : ""}

    <h2>${selectedLoan?.loaneeName} — Full Loan Application Report</h2>

    <h2>Loan Summary</h2>
    <p><strong>Loanee:</strong> ${selectedLoan.loaneeName} (${selectedLoan.loaneeEmail})</p>
    <p><strong>Amount:</strong> ${formatAmountSync(Number(selectedLoan.amount || 0), userCurrencyKey, ratesMap)}</p>
    <p><strong>Status:</strong> ${selectedLoan.status}</p>
    <p><strong>Interest:</strong> ${selectedLoan.repaymentAmt}%</p>
    <p><strong>Repayment Period:</strong> ${selectedLoan.repaymentPeriod} days</p>
    <p><strong>Installment:</strong> ${formatAmountSync(Number(selectedLoan.installmentAmount || 0), userCurrencyKey, ratesMap)}</p>
    <p><strong>Frequency:</strong> ${selectedLoan.paymentFrequency} days</p>
    <p><strong>Default Penalty:</strong> ${selectedLoan.defaultPenalty}</p>
    <p><strong>Description:</strong> ${selectedLoan.description || "-"}</p>
    <p><strong>Owner:</strong> ${selectedLoan.owner}</p>
    ${selectedLoan.AdvEmail && selectedLoan.AdvEmail !== 'None' ? `<p><strong>Advocate:</strong> ${selectedLoan.advLicNo}</p>` : ""}

   


    

    <h2>Credit Score Breakdown</h2>
    <p><strong>Blended Score:</strong> ${creditInfo?.creditScore || 0}%</p>
    <p>Group Balance: ${formatAmountSync(Number(creditInfo?.grpBal || 0), userCurrencyKey, ratesMap)}</p>
    <p>Balance: ${formatAmountSync(Number(creditInfo?.balance || 0), userCurrencyKey, ratesMap)}</p>
    <p>Benefits Amount: ${formatAmountSync(Number(creditInfo?.benefitsAmount || 0), userCurrencyKey, ratesMap)}</p>
    <p>P2P Chama Benefits: ${formatAmountSync(Number(creditInfo?.p2pchmBenefits || 0), userCurrencyKey, ratesMap)}</p>
    <p>Total Deposits (SM): ${formatAmountSync(Number(creditInfo?.ttlDpstSM || 0), userCurrencyKey, ratesMap)}</p>
    <p>Max Times Borrowed Late: ${creditInfo?.MaxTymsBL}</p>
    <p>Loans Issued (Group): ${formatAmountSync(Number(creditInfo?.amountGiven_group || 0), userCurrencyKey, ratesMap)}</p>
    <p>Loans Issued (Global): ${formatAmountSync(Number(creditInfo?.amountGiven_global || 0), userCurrencyKey, ratesMap)}</p>
    <p>Outstanding Balance (Group): ${formatAmountSync(Number(creditInfo?.lonBala_group || 0), userCurrencyKey, ratesMap)}</p>
    <p>Outstanding Balance (Global): ${formatAmountSync(Number(creditInfo?.lonBala_global || 0), userCurrencyKey, ratesMap)}</p>
    <p>Amount Repaid (Group): ${formatAmountSync(Number(creditInfo?.amountRepaid_group || 0), userCurrencyKey, ratesMap)}</p>
    <p>Amount Repaid (Global): ${formatAmountSync(Number(creditInfo?.amountRepaid_global || 0), userCurrencyKey, ratesMap)}</p>
    <p>Non-Loan Support (Group): ${formatAmountSync(Number(creditInfo?.amountSent_group || 0), userCurrencyKey, ratesMap)}</p>
    <p>Non-Loan Support (Global): ${formatAmountSync(Number(creditInfo?.amountSent_global || 0), userCurrencyKey, ratesMap)}</p>
    <p>Contributions (Group): ${formatAmountSync(Number(creditInfo?.contriAmount_group || 0), userCurrencyKey, ratesMap)}</p>
    <p>Contributions (Global): ${formatAmountSync(Number(creditInfo?.contriAmount_global || 0), userCurrencyKey, ratesMap)}</p>
    <p>Group liquidity: ${formatAmountSync(Number(creditInfo?.L_group || 0), userCurrencyKey, ratesMap)}</p>
    <p>Global Liquidity: ${formatAmountSync(Number(creditInfo?.L_global || 0), userCurrencyKey, ratesMap)}</p>
    <p>Group Exposure Ratio: ${creditInfo?.E_group}</p>
    <p>Global Exposure ratio: ${creditInfo?.E_global}</p>
    <p>Group repayment strength: ${creditInfo?.R_group}</p>
    <p>Global Repayment strength: ${creditInfo?.R_global}</p>
    <p>Group community support: ${creditInfo?.S_group}</p>
    <p>Global community support: ${creditInfo?.S_global}</p>
    <p>Group penalties: ${creditInfo?.P_group}</p>
    <p>Global Penalties: ${creditInfo?.P_global}</p>
    <p>Group composite component score: ${creditInfo?.C_group}</p>
    <p>Global composite score: ${creditInfo?.C_global}</p>

    <h2>Approvals</h2>
    <p>${selectedLoan.membersApprove}/${groupSize} approvals (${groupSize > 0 ? Math.round((selectedLoan.membersApprove/groupSize)*100) : 0}%)</p>
    <table>
      <tr><th>Name</th><th>Email</th></tr>
      ${(approvals || []).map(a => `<tr><td>${a.memberName}</td><td>${a.MemberEmail}</td></tr>`).join("")}
    </table>

${minutes ? `
  <h2>Meeting Minutes</h2>

  <p><strong>Meeting Date:</strong> ${minutes.meetingDate}</p>
  <p><strong>Venue:</strong> ${minutes.venue || "-"}</p>
  <p><strong>Attendance:</strong>
    ${minutes.attendance?.filter((a:any) => a.attendanceStatus === "PRESENT").length || 0}
  </p>

  ${minutes.items
    ?.sort((a:any, b:any) => a.entryOrder - b.entryOrder)
    .map((item:any) => `
      <div class="item">
        <strong>${item.entryOrder}. ${item.minuteRef}</strong>
        <p>${item.content}</p>
        ${item.decision ? `<div class="decision">${t.decision}: ${item.decision}</div>` : ""}
      </div>
    `)
    .join("")}

  <div class="signatures">
    <div>
      <strong>{t.chairperson}</strong><br/>
      ${minutes.chairSignUrl ? `<img class="signature-img" src="${minutes.chairSignUrl}" />` : t.notSigned}
    </div>
    <div>
      <strong>{t.secretary}</strong><br/>
      ${minutes.secSignUrl ? `<img class="signature-img" src="${minutes.secSignUrl}" />` : t.notSigned}
    </div>
  </div>
` : `
  <p><em>${t.noMinutesAttached}</em></p>
`}

  </body>
  </html>


      `;
      const { uri } = await printToFileAsync({ html });
      await shareFile(uri, 'Share Loan Report PDF');
    } catch (err) {
      console.error(err);
      Alert.alert(t.error, t.failedToExportLoanReportPDF);
    } finally {
      setExportLoading(false);
    }
  };

  // Helper: prepare data for a selected loan (populate all pieces used by export)
  const prepareLoanReport = async (loan: any) => {
    setSelectedLoan(loan);
    await Promise.all([
      fetchApprovingMembers(loan.id),
      fetchMinutesForLoan(loan),
      fetchMemberCredit(loan.loaneeEmail, loan.loaneeName),
      fetchLoaneePhotos(loan.loaneeEmail),
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {/* Header with two export buttons */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>{t.selectGroup}</Text>
        <View style={styles.exportRow}>
          {exportLoading ? (
            <View style={[styles.exportBtnLoan, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}> 
              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.exportBtnText}>{t.exporting}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.exportBtnLoan}
              onPress={exportLoanReportToPDF}
            >
              <Text style={styles.exportBtnText}>{t.exportLoanReport}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* On-screen identification preview (vertical, generous spacing) */}
      {selectedLoan && (photoUrls.passport || photoUrls.idFront || photoUrls.idBack) ? (
        <View style={styles.previewContainer}>
          {/* Passport/Portrait always image */}
          {photoUrls.passport ? (
            <View style={styles.previewBlock}>
              <Text style={styles.previewLabel}>{t.passport}</Text>
                    <SafeImage uri={photoUrls.passport} style={styles.previewPassport} t={t} />
            </View>
          ) : null}
          {/* Official Identity Document always PDF (prefer idFront, else idBack) */}
          {(photoUrls.idFront || photoUrls.idBack) ? (
            <View style={styles.previewBlock}>
              <Text style={styles.previewLabel}>{t.officialId}</Text>
              <TouchableOpacity
                onPress={async () => {
                  setViewPdfLoading(true);
                  const officialIdUrl = photoUrls.idFront ? String(photoUrls.idFront) : String(photoUrls.idBack);
                  try {
                    await Linking.openURL(officialIdUrl);
                  } finally {
                    setTimeout(() => setViewPdfLoading(false), 1000);
                  }
                }}
                style={{marginTop: 8, padding: 12, backgroundColor: '#e29d58', borderRadius: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', opacity: viewPdfLoading ? 0.7 : 1}}
                disabled={viewPdfLoading}
              >
                {viewPdfLoading && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />}
                <Text style={{color: '#fff', fontWeight: 'bold'}}>{viewPdfLoading ? t.openingPdf : t.viewPdf}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : null}
      

      {/* Group buttons */}
      {adminGroups.map(group => (
        <TouchableOpacity
          key={group.grpContact}
          style={[styles.groupBtn, selectedGroup?.grpContact === group.grpContact && styles.groupBtnSelected]}
          onPress={() => {
            setSelectedGroup(group);
            setSelectedLoan(null);
            setSelectedMinutes(null);
            setMemberCreditInfo(null);
            setApprovingMembers([]);
            fetchLoans(group.grpContact);
          }}
        >
          {/* Always wrap group name in <Text> */}
          <Text style={{ color: selectedGroup?.grpContact === group.grpContact ? '#fff' : '#000' }}>
            {group.grpName ? group.grpName.toString() : ''}
          </Text>
        </TouchableOpacity>
      ))}

      {loading && <ActivityIndicator size="large" color="#e29d58" />}

      {/* Loan cards */}
      {loans.map(loan => {
        const percent = groupSize > 0 ? Math.round((loan.membersApprove / groupSize) * 100) : 0;
        const canClear = percent >= selectedGroup?.loanApprovalThreshHold;

        return (
          <View key={loan.id} style={styles.card}>
            <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 4 }}>{t.loanee}: {loan.loaneeName}</Text>
            <Text style={styles.amount}>{formatAmountSync(Number(loan.amount || 0), userCurrencyKey, ratesMap)}</Text>
            <Text style={styles.purpose}>{loan.description || t.noDescription}</Text>

            <View style={styles.row}>
              <Text style={styles.detail}>{t.interest}:</Text>
              <Text style={styles.value}>{loan.repaymentAmt}%</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.detail}>{t.repaymentPeriod}:</Text>
              <Text style={styles.value}>{loan.repaymentPeriod} {t.days}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.detail}>{t.installment}:</Text>
              <Text style={styles.value}>{formatAmountSync(Number(loan.installmentAmount || 0), userCurrencyKey, ratesMap)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.detail}>{t.installmentFrequency}:</Text>
              <Text style={styles.value}>{loan.paymentFrequency} {t.days}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.detail}>{t.defaultPenalty}:</Text>
              <Text style={styles.value}>{loan.defaultPenalty}</Text>
            </View>
            {loan.AdvEmail && loan.AdvEmail !== 'None' && <Text style={styles.advocate}>{t.advocate}: {loan.advLicNo}</Text>}

            <Text style={styles.approvalText}>
              {loan.membersApprove}/{groupSize} {t.approvals} ({percent}%) • {t.required}: {selectedGroup?.loanApprovalThreshHold}%
            </Text>

            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${percent}%` }]} />
            </View>

            {/* Prepare full report for this loan */}
            <TouchableOpacity
              style={[styles.secondaryBtn, { backgroundColor: 'skyblue' }]}
              onPress={() => prepareLoanReport(loan)}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>
                {selectedLoan?.id === loan.id ? t.reportReady : t.prepareFullReport}
              </Text>
            </TouchableOpacity>

            {/* Clear loan if threshold met */}
            {loan.status !== 'Cleared' && (
              <TouchableOpacity
                style={[styles.clearBtn, !canClear && { backgroundColor: '#aaa' }]}
                disabled={!canClear}
                onPress={() => clearLoan(loan)}
              >
                <Text style={{ color: '#fff', textAlign: 'center' }}>{t.clearLoan}</Text>
              </TouchableOpacity>
            )}

            {/* Credit worth modal trigger */}
            <TouchableOpacity
              style={[styles.secondaryBtn, { backgroundColor: '#e29d58', marginTop: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}
              onPress={() => fetchMemberCredit(loan.loaneeEmail, loan.loaneeName)}
              disabled={loadingCredit}
            >
              {loadingCredit ? <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} /> : null}
              <Text style={{ color: '#fff', fontWeight: '700' }}>
                {loadingCredit ? t.loading : t.viewNiSentiCreditWorth}
              </Text>
            </TouchableOpacity>

            {/* Approvals inline list */}
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => {
                if (showApprovalsFor === loan.id) {
                  setShowApprovalsFor(null);
                } else {
                  setShowApprovalsFor(loan.id);
                  fetchApprovingMembers(loan.id);
                }
              }}
            >
              <Text>{showApprovalsFor === loan.id ? t.hideApprovingMembers : t.viewMembersWhoApproved}</Text>
            </TouchableOpacity>

            {showApprovalsFor === loan.id && (
              <View style={styles.inlineBox}>
                {loadingApprovals ? (
                  <ActivityIndicator size="small" color="#e29d58" />
                ) : approvingMembers.length === 0 ? (
                  <Text style={styles.emptyText}>{t.noApprovalsRecordedYet}</Text>
                ) : (
                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled contentContainerStyle={{ flexGrow: 0 }}>
                    {approvingMembers.map((member, idx) => (
                      <View key={idx} style={styles.memberRow}>
                        <Text><Text style={{ fontWeight: '700' }}>{t.name}:</Text> {member.memberName}</Text>
                        <Text><Text style={{ fontWeight: '700' }}>{t.email}:</Text> {member.MemberEmail}</Text>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {/* Minutes buttons */}
            {loan.loanMinutesImage && loan.loanMinutesImage !== 'NoMinutesUploaded' && (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={async () => {
                  try {
                    const res: any = await getUrl({ key: loan.loanMinutesImage });
                    const url = res?.url ? String(res.url) : '';
                    if (url && url.trim() !== '') {
                      setSelectedImage(url);
                    } else {
                      Alert.alert(t.error, t.unableToLoadUploadedMinutes);
                    }
                  } catch (err) {
                    console.error('Error loading minutes image', err);
                    Alert.alert(t.error, t.unableToLoadUploadedMinutes);
                  }
                }}
              >
                <Text>{t.viewUploadedMinutes}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.secondaryBtn, loadingMinutes && { opacity: 0.6 }]}
              disabled={loadingMinutes}
              onPress={() => fetchMinutesForLoan(loan)}
            >
              {loadingMinutes ? (
                <ActivityIndicator size="small" color="#e29d58" />
              ) : (
                <Text style={styles.amount}>{t.readMinutes}</Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })}

      {/* Image viewer modal */}
      <Modal visible={!!selectedImage} transparent onRequestClose={() => setSelectedImage(null)}>
        <View style={styles.imageModalContainer}>
          {selectedImage ? (
            <ImageViewer
              imageUrls={[{ url: selectedImage }]}
              enableSwipeDown
              onSwipeDown={() => setSelectedImage(null)}
              backgroundColor="transparent"
            />
          ) : (
            <View style={{ padding: 20 }}>
              <Text style={{ color: '#fff' }}>{t.unableToLoadImage}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.imageCloseButton} onPress={() => setSelectedImage(null)}>
            <Text style={styles.imageCloseText}>{t.close}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Text viewer modal */}
      <Modal visible={!!selectedText} transparent>
        <View style={styles.textModal}>
          <ScrollView style={styles.textBox}>
            <Text>{selectedText}</Text>
          </ScrollView>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedText(null)}>
            <Text style={{ color: '#fff' }}>{t.close}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Credit worthiness modal with tabs */}
      <Modal visible={showCreditModal} transparent onRequestClose={() => setShowCreditModal(false)}>
        <View style={{ flex: 1, backgroundColor: '#000000aa', justifyContent: 'center' }}>
          {loadingCredit ? (
            <ActivityIndicator size="large" color="#e29d58" />
          ) : (
            <View style={{ margin: 20, borderRadius: 12, overflow: 'hidden' }}>
              <LinearGradient colors={['#e29d58', 'skyblue']} start={[0, 0]} end={[1, 0]} style={{ padding: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>
                  {memberCreditInfo?.name}'s {t.creditWorthiness}
                </Text>
              </LinearGradient>

              <View style={{ flexDirection: 'row', backgroundColor: '#fff' }}>
                <TouchableOpacity style={[styles.tabBtn, creditTab === 'group' && styles.tabBtnActive]} onPress={() => setCreditTab('group')}>
                  <Text style={[styles.tabText, creditTab === 'group' && styles.tabTextActive]}>{t.group}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, creditTab === 'global' && styles.tabBtnActive]} onPress={() => setCreditTab('global')}>
                  <Text style={[styles.tabText, creditTab === 'global' && styles.tabTextActive]}>{t.global}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabBtn, creditTab === 'blended' && styles.tabBtnActive]} onPress={() => setCreditTab('blended')}>
                  <Text style={[styles.tabText, creditTab === 'blended' && styles.tabTextActive]}>{t.blended}</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ backgroundColor: '#fff', maxHeight: 600 }}>
                <View style={{ padding: 16 }}>
                  <Text style={{ fontWeight: '700', marginBottom: 6 }}>{t.creditScore}</Text>
                  <Text style={{ marginBottom: 6 }}>{Number(memberCreditInfo?.creditScore || 0)}%</Text>
                  <View style={{ height: 12, backgroundColor: '#e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
                    <View
                      style={{
                        width: `${Number(memberCreditInfo?.creditScore || 0)}%`,
                        height: '100%',
                        backgroundColor:
                          Number(memberCreditInfo?.creditScore || 0) >= 70
                            ? 'green'
                            : Number(memberCreditInfo?.creditScore || 0) >= 40
                            ? 'yellow'
                            : 'red',
                      }}
                    />
                  </View>

                  <Text style={{ fontWeight: '700', marginTop: 16, marginBottom: 6 }}>{t.smAccountOverview}</Text>
                  <Text>{t.balance}: {formatMoney(memberCreditInfo?.balance)}</Text>
                  <Text>{t.benefitsAmount}: {formatMoney(memberCreditInfo?.benefitsAmount)}</Text>
                  <Text>{t.p2pChamaBenefits}: {formatMoney(memberCreditInfo?.p2pchmBenefits)}</Text>
                  <Text>{t.totalDepositsSM}: {formatMoney(memberCreditInfo?.ttlDpstSM)}</Text>
                  <Text>{t.maxTimesBorrowedLate}: {memberCreditInfo?.MaxTymsBL || 0}</Text>

                  {creditTab === 'group' && (
                    <>
                      <Text style={{ fontWeight: '700', marginTop: 16 }}>{t.groupOverview}</Text>
                      <Text>{t.groupBalance}: {formatMoney(memberCreditInfo?.grpBal)}</Text>
                      <Text>{t.loansIssued}: {formatMoney(memberCreditInfo?.amountGiven_group)}</Text>
                      <Text>{t.outstandingLoans}: {formatMoney(memberCreditInfo?.lonBala_group)}</Text>
                      <Text>{t.repaid}: {formatMoney(memberCreditInfo?.amountRepaid_group)}</Text>
                      <Text>{t.nonLoanReceipts}: {formatMoney(memberCreditInfo?.amountSent_group)}</Text>
                      <Text>{t.contributions}: {formatMoney(memberCreditInfo?.contriAmount_group)}</Text>

                      <Text style={{ fontWeight: '700', marginTop: 16 }}>{t.scoreComponents}</Text> 
                      <Text>{t.liquidity}: {formatMoney(memberCreditInfo?.L_group)}</Text>
                      <Text>{t.exposureRatio}: {memberCreditInfo?.E_group?.toFixed?.(2)}</Text>
                      <Text>{t.repaymentStrength}: {Math.round((memberCreditInfo?.R_group || 0) * 100)}%</Text>
                      <Text>{t.communitySupport}: {memberCreditInfo?.S_group?.toFixed?.(2)}</Text>
                      <Text>{t.penalty}: {memberCreditInfo?.P_group?.toFixed?.(2)}</Text>
                    </>
                  )}

                  {creditTab === 'global' && (
                    <>
                      <Text style={{ fontWeight: '700', marginTop: 16 }}>{t.globalOverview}</Text>
                      <Text>{t.totalLoansIssued}: {formatMoney(memberCreditInfo?.amountGiven_global)}</Text>
                      <Text>{t.totalOutstanding}: {formatMoney(memberCreditInfo?.lonBala_global)}</Text>
                      <Text>{t.totalRepaid}: {formatMoney(memberCreditInfo?.amountRepaid_global)}</Text>
                      <Text>{t.nonLoanReceipts}: {formatMoney(memberCreditInfo?.amountSent_global)}</Text>
                      <Text>{t.contributions}: {formatMoney(memberCreditInfo?.contriAmount_global)}</Text>

                      <Text style={{ fontWeight: '700', marginTop: 16 }}>{t.scoreComponents}</Text>
                      <Text>{t.liquidity}: {formatMoney(memberCreditInfo?.L_global)}</Text>
                      <Text>{t.exposureRatio}: {memberCreditInfo?.E_global?.toFixed?.(2)}</Text>
                      <Text>{t.repaymentStrength}: {Math.round((memberCreditInfo?.R_global || 0) * 100)}%</Text>
                      <Text>{t.communitySupport}: {memberCreditInfo?.S_global?.toFixed?.(2)}</Text>
                      <Text>{t.penalty}: {memberCreditInfo?.P_global?.toFixed?.(2)}</Text>
                    </>
                  )}

                  {creditTab === 'blended' && (
                    <>
                      <Text style={{ fontWeight: '700', marginTop: 16 }}>{t.blendedSummary}</Text>
                      <Text>{t.blendedScore}: {Number(memberCreditInfo?.creditScore || 0)}%</Text>
                      <Text>{t.groupComponentScore}: {memberCreditInfo?.C_group?.toFixed?.(2)}</Text>
                      <Text>{t.globalComponentScore}: {memberCreditInfo?.C_global?.toFixed?.(2)}</Text>
                    </>
                  )}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* Minutes viewer modal */}
      <Modal visible={!!selectedMinutes} transparent onRequestClose={() => setSelectedMinutes(null)}>
        <View style={{ flex: 1, backgroundColor: "#000000aa", justifyContent: "center" }}>
          {loadingMinutes ? (
            <ActivityIndicator size="large" color="#e29d58" />
          ) : (
            <ScrollView style={styles.minutesModal}>
              <View style={styles.minutesCard}>
                <Text style={styles.groupTitle}>{selectedGroup?.grpName} — {t.minutes}</Text>
                <Text style={styles.date}>📅 {selectedMinutes?.meetingDate}</Text>
                <Text style={styles.meta}>{t.venue}: {selectedMinutes?.venue || "-"}</Text>
                <Text style={styles.meta}>
                  {t.attendance}: {selectedMinutes?.attendance?.filter((a: any) => a.attendanceStatus === "PRESENT").length}
                </Text>

                <TouchableOpacity style={styles.exportBtn} onPress={() => exportMinutesToPDF(selectedMinutes)}>
                  <Text style={styles.exportText}>{t.exportPDF}</Text>
                </TouchableOpacity>

                <Text style={styles.section}>{t.minutes}</Text>
                {selectedMinutes?.items
                  ?.sort((a: any, b: any) => a.entryOrder - b.entryOrder)
                  .map((item: any) => (
                    <View key={item.id} style={styles.minuteItem}>
                      <Text style={styles.minuteTitle}>{item.entryOrder}. {item.minuteRef}</Text>
                      <Text>{item.content}</Text>
                      {item.decision && <Text style={styles.decision}>{t.decision}: {item.decision}</Text>}
                    </View>
                  ))}

                <Text style={styles.section}>{t.signatures}</Text>
                <View style={styles.signatures}>
                  <View style={styles.signatureBlock}>
                    <Text style={styles.signatureLabel}>{t.chairperson}</Text>
                    <SafeImage uri={selectedMinutes?.chairSignUrl} style={styles.signature} t={t} />
                  </View>

                  <View style={styles.signatureBlock}>
                    <Text style={styles.signatureLabel}>{t.secretary}</Text>
                    <SafeImage uri={selectedMinutes?.secSignUrl} style={styles.signature} t={t} />
                  </View>
                </View>

                <TouchableOpacity style={[styles.exportBtn, { backgroundColor: "skyblue" }]} onPress={() => setSelectedMinutes(null)}>
                  <Text style={styles.exportText}>{t.close}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
};

export default AdminClearLoans;

const styles = StyleSheet.create({
  // Header + export controls
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
  },
  exportRow: {
    flexDirection: 'row',
    gap: 8,
  },
  exportBtnMinutes: {
    backgroundColor: '#e29d58',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  exportBtnLoan: {
    backgroundColor: 'skyblue',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  exportBtnText: {
    color: '#fff',
    fontWeight: '700',
  },

  // Group selection
  groupBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 6,
    borderRadius: 10,
    backgroundColor: '#fbbf24',
    alignItems: 'center',
  },
  groupBtnSelected: {
    backgroundColor: '#f59e0b',
  },

  // Loan card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    color: '#2563eb',
  },
  purpose: {
    marginVertical: 6,
    color: '#374151',
    fontStyle: 'italic',
  },

  // Loan details rows
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  detail: {
    color: '#6b7280',
    fontSize: 14,
  },
  value: {
    fontWeight: '600',
    fontSize: 14,
    color: '#111827',
  },

  advocate: {
    marginTop: 6,
    fontStyle: 'italic',
    color: '#4b5563',
  },
  approvalText: {
    marginTop: 10,
    fontSize: 13,
    color: '#374151',
  },

  // Progress bar
  progressBg: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e29d58',
  },

  // Buttons
  clearBtn: {
    marginTop: 10,
    backgroundColor: 'skyblue',
    paddingVertical: 10,
    borderRadius: 8,
  },
  secondaryBtn: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    alignItems: 'center',
  },

  // Inline approvals
  inlineBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  memberRow: {
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    fontStyle: 'italic',
  },

  // Image modal
  imageModalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  imageCloseButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 30,
  },
  imageCloseText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  // Text modal
  textModal: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
  },
  textBox: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  closeBtn: {
    alignSelf: 'center',
    marginTop: 20,
    backgroundColor: '#f59e0b',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },

  // Minutes viewer
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
  exportBtn: {
    marginTop: 12,
    marginBottom: 16,
    backgroundColor: '#e29d58',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
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

  // Signatures
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

  // On-screen ID preview styles
  previewContainer: {
    marginVertical: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  previewBlock: {
    marginBottom: 16,
    alignItems: 'center',
  },
  previewLabel: {
    fontWeight: '700',
    marginBottom: 8,
    color: '#374151',
  },
  previewPassport: {
    width: 200,
    height: 260,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e29d58',
    overflow: 'hidden',
  },
  previewId: {
    width: 260,
    height: 160,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e29d58',
    overflow: 'hidden',
  },

  // Tabs (credit modal)
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: '#fef3c7',
    borderBottomColor: '#f59e0b',
  },
  tabText: {
    fontWeight: '700',
    color: '#111827',
  },
  tabTextActive: {
    color: '#f59e0b',
  },
});