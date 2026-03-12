import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Image
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { printAsync } from '../../../../src/utils/print';
import ImageViewer from 'react-native-image-zoom-viewer';
import { listChamaAdminLnApplies, listChamaMinutes, listMinuteItemsByMinutes, listAttendanceByMinutes } from '../../../../src/graphql/queries';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import translations from './translation';
import {generateClient} from 'aws-amplify/api';
import { getUrl } from 'aws-amplify/storage';

const client = generateClient();

const SafeImage = ({ uri, style }) => {
  if (!uri || typeof uri !== 'string' || uri.trim() === '') {
    return <Text style={styles.signatureMissing}>Not signed</Text>;
  }
  return <Image source={{ uri }} style={style} />;
};

const FloatedLoansList = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { groupContact, MembaId } = route.params;

  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectedMinutes, setSelectedMinutes] = useState<any | null>(null);
  const [loadingMinutes, setLoadingMinutes] = useState(false);

  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;

  // Fetch floated loans
  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res: any = await client.graphql({
        query: listChamaAdminLnApplies,
        variables: {
          filter: {
            GrpAccount: { eq: groupContact },
            status: { eq: 'AccountActive' }
          }
        }
      });
      setLoans(res?.data?.listChamaAdminLnApplies?.items || []);
    } catch (err) {
      console.error(err);
      Alert.alert(t.errorFetchLoans, t.failedFetchLoans);
    } finally {
      setLoading(false);
    }
  };

  // Fetch detailed minutes by ID
  const fetchMinutesForLoan = async (loan: any) => {
    if (!loan?.grpMinutes || loan.grpMinutes === 'NoMinutesProvided') {
      Alert.alert(t.noMinutes, t.noLinkedMinutes);
      return;
    }
    setLoadingMinutes(true);
    try {
      const res: any = await client.graphql({
        query: listChamaMinutes,
        variables: { filter: { id: { eq: loan.grpMinutes } } }
      });
      const minutes = res?.data?.listChamaMinutes?.items?.[0];
      if (!minutes) {
        Alert.alert(t.minutesNotFound);
        return;
      }
      const [itemsRes, attendanceRes] = await Promise.all([
        client.graphql({ query: listMinuteItemsByMinutes, variables: { minutesId: minutes.id } }),
        client.graphql({ query: listAttendanceByMinutes, variables: { minutesId: minutes.id } })
      ]);
      const chairSignUrl = minutes.chairpersonId
        ? (await getUrl({ key: minutes.chairpersonId }))?.url || ''
        : '';
      const secSignUrl = minutes.secretaryId
        ? (await getUrl({ key: minutes.secretaryId }))?.url || ''
        : '';
      setSelectedMinutes({
        ...minutes,
        items: itemsRes?.data?.listMinuteItemsByMinutes?.items || [],
        attendance: attendanceRes?.data?.listAttendanceByMinutes?.items || [],
        chairSignUrl,
        secSignUrl
      });
    } catch (err) {
      console.error(err);
      Alert.alert(t.errorFetchMinutes, t.failedFetchMinutes);
    } finally {
      setLoadingMinutes(false);
    }
  };

  // Export minutes to PDF
  const exportMinutesToPDF = async (min: any) => {
    if (!min) return;
    try {
      const present = min.attendance.filter((a: any) => a.attendanceStatus === 'PRESENT');
      const html = `
        <html><body>
          <h1>Official Minutes</h1>
          <p><strong>Date:</strong> ${min.meetingDate}</p>
          <p><strong>Venue:</strong> ${min.venue || '-'}</p>
          <p><strong>Attendance:</strong> ${present.length}</p>
          <h2>Minute Items</h2>
          ${min.items.map((i: any) => `
            <div><strong>${i.entryOrder}. ${i.minuteRef}</strong>
            <p>${i.content}</p>
            ${i.decision ? `<em>Decision: ${i.decision}</em>` : ''}</div>
          `).join('')}
        </body></html>`;
      await printAsync({ html });
    } catch (err) {
      console.error(err);
      Alert.alert(t.errorExportPDF, t.failedExportPDF);
    }
  };

  // Apply for loan
  const proceedToApply = (groupContact: string, MembaId: string, id: string) => {
    navigation.navigate('MemberReqChm', { groupContact, MembaId, id });
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>{t.floatedLoans}</Text>
      {loading && <ActivityIndicator size="large" color="#e58d29" />}
      {loans.map((loan) => (
        <View key={loan.id} style={styles.card}>
          <Text style={styles.title}>{loan.grpName}</Text>
          <Text style={styles.subtitle}>{t.floatedBy}: {loan.ChamaAdminEmail}</Text>
          <View style={styles.buttonRow}>
            {loan.MemberEmail && loan.MemberEmail !== 'NoMinutesUploaded' && (
              <TouchableOpacity
                style={styles.button}
                onPress={() => setSelectedImageUrl(loan.MemberEmail)}
              >
                <Text style={styles.buttonText}>{t.viewUploadedMinutes}</Text>
              </TouchableOpacity>
            )}
            {loan.grpMinutes && loan.grpMinutes !== 'NoMinutesProvided' && (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#6b7280' }]}
                onPress={() => fetchMinutesForLoan(loan)}
              >
                <Text style={styles.buttonText}>{t.readDetailedMinutes}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: 'skyblue' }]}
              onPress={() => proceedToApply(groupContact, MembaId, loan.id)}
            >
              <Text style={styles.buttonText}>{t.apply}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Uploaded Minutes Modal */}
      <Modal visible={!!selectedImageUrl} transparent animationType="slide">
        <LinearGradient colors={['skyblue', '#e58d29']} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedImageUrl(null)}>
              <Text style={styles.closeText}>{t.close}</Text>
            </TouchableOpacity>
            {selectedImageUrl && (
              <ImageViewer
                imageUrls={[{ url: selectedImageUrl }]}
                enableSwipeDown
                onSwipeDown={() => setSelectedImageUrl(null)}
                backgroundColor="transparent"
              />
            )}
          </View>
        </LinearGradient>
      </Modal>

      {/* Detailed Minutes Modal */}
      <Modal visible={!!selectedMinutes} transparent onRequestClose={() => setSelectedMinutes(null)}>
        <View style={{ flex: 1, backgroundColor: '#000000aa', justifyContent: 'center' }}>
          {loadingMinutes ? (
            <ActivityIndicator size="large" color="#e58d29" />
          ) : (
            <ScrollView style={styles.minutesModal}>
              <View style={styles.minutesCard}>
                <Text style={styles.groupTitle}>{t.minutes}</Text>
                <Text style={styles.date}>📅 {selectedMinutes?.meetingDate}</Text>
                <Text style={styles.meta}>{t.venue}: {selectedMinutes?.venue || '-'}</Text>
                <Text style={styles.meta}>{t.attendance}: {selectedMinutes?.attendance?.filter((a: any) => a.attendanceStatus === 'PRESENT').length}</Text>
                <TouchableOpacity style={styles.exportBtn} onPress={() => exportMinutesToPDF(selectedMinutes)}>
                  <Text style={styles.exportText}>{t.exportToPDF}</Text>
                </TouchableOpacity>
                <Text style={styles.section}>{t.minuteItems}</Text>
                {selectedMinutes?.items?.map((item: any) => (
                  <View key={item.id} style={styles.minuteItem}>
                    <Text style={styles.minuteTitle}>{item.entryOrder}. {item.minuteRef}</Text>
                    <Text>{item.content}</Text>
                    {item.decision && (
                      <Text style={styles.decision}>{t.decision}: {item.decision}</Text>
                    )}
                  </View>
                ))}
                <Text style={styles.section}>{t.attendanceList}</Text>
                {selectedMinutes?.attendance?.map((a: any, idx: number) => (
                  <View key={idx} style={styles.memberRow}>
                    <Text>{a.memberName} — {a.attendanceStatus}</Text>
                  </View>
                ))}
                <Text style={styles.section}>{t.signatures}</Text>
                <View style={styles.signatures}>
                  <View style={styles.signatureBlock}>
                    <Text style={styles.signatureLabel}>{t.chairperson}</Text>
                    <SafeImage uri={selectedMinutes?.chairSignUrl} style={styles.signature} />
                  </View>
                  <View style={styles.signatureBlock}>
                    <Text style={styles.signatureLabel}>{t.secretary}</Text>
                    <SafeImage uri={selectedMinutes?.secSignUrl} style={styles.signature} />
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
  );
};

export default FloatedLoansList;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f3f4f6'
  },
  header: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
    color: '#1f2937',
    textAlign: 'center'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8
  },
  button: {
    backgroundColor: '#e58d29',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
    marginTop: 8,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center'
  },
  minutesModal: {
    margin: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    maxHeight: 650
  },
  minutesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3
  },
  groupTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1f2937',
    textAlign: 'center'
  },
  date: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    textAlign: 'center'
  },
  meta: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center'
  },
  section: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    color: '#111827'
  },
  minuteItem: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  minuteTitle: {
    fontWeight: '700',
    marginBottom: 4,
    color: '#1f2937'
  },
  decision: {
    marginTop: 6,
    fontStyle: 'italic',
    color: '#065f46'
  },
  memberRow: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  signatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    marginBottom: 12
  },
  signatureBlock: {
    alignItems: 'center',
    width: 140
  },
  signatureLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    color: '#374151'
  },
  signatureMissing: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#9ca3af',
    marginTop: 8
  },
  signature: {
    width: 120,
    height: 60,
    resizeMode: 'contain',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    backgroundColor: '#ffffff'
  },
  exportBtn: {
    marginTop: 12,
    marginBottom: 16,
    backgroundColor: '#e58d29',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  exportText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14
  },
  closeBtn: {
    alignSelf: 'center',
    marginTop: 20,
    backgroundColor: 'skyblue',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  closeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700'
  }
});
