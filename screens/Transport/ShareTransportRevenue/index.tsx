import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { translations } from './translation';
import Communications from 'react-native-communications';
import {  createNonLoans,  updateSMAccount,  updateTransportRegister, createMessages, sendNotification } from '../../../src/graphql/mutations';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Linking } from 'react-native';
import { View, Text, ImageBackground, Pressable, TextInput, ScrollView, StyleSheet, Platform, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { getCompany, getSMAccount } from '../../../src/graphql/queries';
import { formatAmountForUser, formatAmountSync, convertForeignToKsh, getUserNationalityByEmail } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { getTransportOrder, getTransportRegister } from '../../../src/graphql/queries';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
import { safeNavigateFrom } from '../../../src/utils/navigationHelper';

const client = generateClient();
const SMASendNonLns = props => {
    // Store userTransferFee in state for use in both UI and backend logic
    const [userTransferFee, setUserTransferFee] = useState(0);
    // Fetch company details on mount and set userTransferFee
    useEffect(() => {
      const fetchCompany = async () => {
        try {
          const CompDtlsRes = await client.graphql({
            query: getCompany,
            variables: { AdminId: "BaruchHabaB'ShemAdonai2" }
          });
          const fee = (CompDtlsRes as any)?.data?.getCompany?.userTransferFee;
          setUserTransferFee(fee || 0);
        } catch (e) {
          setUserTransferFee(0);
        }
      };
      fetchCompany();
    }, []);
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const [SenderNatId, setSenderNatId] = useState('');
  const [RecNatId, setRecNatId] = useState('');
  const [SnderPW, setSnderPW] = useState("");
  const [amounts, setAmount] = useState("");
  const [Desc, setDesc] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  // Add type for route params
  const route = useRoute();
  // Type guard for route.params
  const routeParams = (route.params && typeof route.params === 'object') ? route.params : {};
    // Defensive: always treat id as string or undefined
    const transportId: string | undefined = typeof (routeParams as any).id === 'string' ? (routeParams as any).id : undefined;
  const navigation = useNavigation();
  const { nationality, ratesMap } = useExchange();
  const SndChmMmbrMny = () => {
    safeNavigateFrom(navigation, 'AutomaticRepayAllTyps');
  };
  const grpDsNtExst = () => {
    safeNavigateFrom(navigation, 'SendNLBnftNone');
  };
  const handleAcceptDelivery = async () => {
    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      // Defensive: check for id in params (already defined above)
      if (!transportId) throw new Error('No transport id provided');
      const transportDtlsRes = await client.graphql({
        query: getTransportRegister,
        variables: {
          id: transportId
        }
      });
      const transportDtlz = (transportDtlsRes as any)?.data?.getTransportRegister;
      // Defensive: always use .data?.getSMAccount
      const TransporterDtlsRes = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: RecNatId
        }
      });
      const TransporterDtlsz = (TransporterDtlsRes as any)?.data?.getSMAccount;
      const TransportOwnerRes = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: transportDtlz?.transportOwnerEmail
        }
      });
      const TransportOwnerz = (TransportOwnerRes as any)?.data?.getSMAccount;

      // Password check
      if (TransportOwnerz.pw !== SnderPW) {
        Alert.alert(t.error, t.wrongPassword);
        return;
      }

      // --- Currency conversion pattern: use the same logic as the UI (ratesMap and nationalityToCode) ---
      const foreignAmount = parseFloat(amounts) || 0;
      let amountKes = foreignAmount;
      let transactionFeeKes = 0;
      let totalDeducted = 0;
      let senderCode = nationalityToCode(nationality);
      // userTransferFee is now from state
      if (senderCode && ratesMap && ratesMap[senderCode] && ratesMap[senderCode].sellingPrice != null) {
        const sellingPriceVal = ratesMap[senderCode].sellingPrice;
        const sellingPrice = parseFloat(String(sellingPriceVal));
        if (sellingPrice && sellingPrice !== 0) {
          amountKes = foreignAmount / sellingPrice;
          transactionFeeKes = Math.floor(amountKes * userTransferFee);
          totalDeducted = amountKes + transactionFeeKes;
        }
      }

      // Check backend earnings (in KES) before deducting
      const earningsKES = parseFloat(transportDtlz.Earnings) || 0;
      // Debug output
      console.log(
        'DEBUG: Funds Check',
        `earningsKES: ${earningsKES}\namountKes: ${amountKes}\ntransactionFeeKes: ${transactionFeeKes}\ntotalDeducted: ${totalDeducted}`
      );
      if (totalDeducted > earningsKES) {
        Alert.alert(t.error, t.couldNotShare + '\n' + (t.insufficientFunds || 'Insufficient funds to share this amount.'));
        setIsLoading(false);
        return;
      }

      // Update recipient balance in KES (only the entered amount, not the fee)
      await client.graphql({
        query: updateSMAccount,
        variables: {
          input: {
            awsemail: RecNatId,
            balance: parseFloat(TransporterDtlsz.balance) + Number(amountKes)
          }
        }
      });
      // Record the transaction in KES (only the entered amount, not the fee)
      await client.graphql({
        query: createNonLoans,
        variables: {
          input: {
            senderPhn: attributes.email,
            recPhn: RecNatId,
            RecName: TransporterDtlsz.name,
            description: `Transport revenue share by ` + transportDtlz.transportName + " Transport Services",
            SenderName: transportDtlz.transportName,
            amount: Number(amountKes),
            status: "SMNonLons",
            owner: attributes.sub,
            fees: 0
          }
        }
      });
      // Update transport register earnings in KES (deduct entered amount + fee)
      await client.graphql({
        query: updateTransportRegister,
        variables: {
          input: {
            id: transportId,
            Earnings: earningsKES - Number(totalDeducted)
          }
        }
      });

      Alert.alert(t.success, t.revenueShared);
      // Send Firebase notification and create message (pattern from AddCOMBAuditor)
      try {
        // Compose message and notification with specific translation for Transport revenue
        const formattedAmt = await formatAmountForUser(Number(amountKes), TransporterDtlsz.nationality);
        const transportRevenueShared = t.transportRevenueShared || 'Transport revenue shared';
        const messageBody = `${transportRevenueShared}: ${formattedAmt}. ${transportDtlz.transportName}.`;
        // Create message record
        await client.graphql({
          query: createMessages,
          variables: {
            input: {
              senderEmail: attributes.email,
              messageBody
            }
          }
        });
        // Send push notification
        await client.graphql({
          query: sendNotification,
          variables: {
            riderEmail: RecNatId,
            title: transportRevenueShared,
            body: messageBody
          }
        });
      } catch (e) {
        console.error('Notification/message error:', e);
      }
    } catch (err) {
      console.error("Accept error:", err);
      Alert.alert(t.error, t.couldNotShare);
    } finally {
      setIsLoading(false);
      setSenderNatId('');
      setAmount("");
      setRecNatId('');
      setDesc("");
      setSnderPW("");
    }
  };
  useEffect(() => {
    const SnderNatIds = SenderNatId;
    if (!SnderNatIds && SnderNatIds !== "") {
      setSenderNatId("");
      return;
    }
    setSenderNatId(SnderNatIds);
  }, [SenderNatId]);
  useEffect(() => {
    const amt = amounts;
    if (!amt && amt !== "") {
      setAmount("");
      return;
    }
    setAmount(amt);
  }, [amounts]);
  useEffect(() => {
    const RecNatIds = RecNatId;
    if (!RecNatIds && RecNatIds !== "") {
      setRecNatId("");
      return;
    }
    setRecNatId(RecNatIds);
  }, [RecNatId]);
  useEffect(() => {
    const descr = Desc;
    if (!descr && descr !== "") {
      setDesc("");
      return;
    }
    setDesc(descr);
  }, [Desc]);
  useEffect(() => {
    const SnderPWss = SnderPW;
    if (!SnderPWss && SnderPWss !== "") {
      setSnderPW("");
      return;
    }
    setSnderPW(SnderPWss);
  }, [SnderPW]);
  return <LinearGradient colors={['#e58d29', 'skyblue']} start={[0, 0]} end={[1, 1]} style={{ flex: 1 }}>
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.formContainer}>
          <TextInput
            placeholder={t.receiverEmail}
            value={RecNatId}
            onChangeText={setRecNatId}
            style={styles.input}
            placeholderTextColor="#333"

            editable={true}
          />
          {(() => {
            let recNat = nationality;
            const recCode = nationalityToCode(recNat);
            const symbol = (recCode && ratesMap && ratesMap[recCode]?.symbol) ? ratesMap[recCode].symbol : '';
            var amountPlaceholder = symbol ? `${t.amount} (${symbol})` : t.amount;
            return (
              <TextInput
                placeholder={amountPlaceholder}
                value={amounts}
                onChangeText={setAmount}
                style={styles.input}
                editable={true}
                placeholderTextColor="#333"

                keyboardType='decimal-pad'
              />
            );
          })()}
          {/* Show equivalent in recipient's currency if possible */}
          {amounts && RecNatId && ratesMap && (() => {
            // Show equivalent in KES (backend currency) and total deducted (KES)
            const foreignAmount = parseFloat(amounts) || 0;
            let eq = '';
            let totalDeductedText = '';
            // Use the same userTransferFee as in backend logic (from state)
            if (!isNaN(foreignAmount) && foreignAmount > 0) {
              let senderCode = nationalityToCode(nationality);
              if (senderCode && ratesMap[senderCode] && ratesMap[senderCode].sellingPrice != null) {
                const sellingPriceVal = ratesMap[senderCode].sellingPrice;
                const sellingPrice = parseFloat(String(sellingPriceVal));
                if (sellingPrice && sellingPrice !== 0) {
                  const amountKES = foreignAmount / sellingPrice;
                  const transactionFeeKes = Math.floor(amountKES * userTransferFee);
                  const totalDeducted = amountKES + transactionFeeKes;
                  eq = `KES ${amountKES.toFixed(2)}`;
                  totalDeductedText = `Total Deducted (KES): ${totalDeducted.toFixed(2)}`;
                }
              }
            }
            if (eq) {
              return <>
                <Text style={{ color: '#888', marginBottom: 4 }}>Equivalent: {eq}</Text>
                <Text style={{ color: '#888', marginBottom: 8 }}>{totalDeductedText}</Text>
              </>;
            }
            return null;
          })()}
          <View style={styles.passwordContainer}>
            <TextInput
              placeholder={t.password}
              style={styles.passwordInput}
              value={SnderPW}
              onChangeText={setSnderPW}
              secureTextEntry={!isPasswordVisible}
              placeholderTextColor="#333"
            />
            <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
              <Ionicons name={isPasswordVisible ? 'eye' : 'eye-off'} size={24} color="gray" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleAcceptDelivery} style={styles.button}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.locationText}>{t.submit}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  </LinearGradient>;
};
const styles = StyleSheet.create({
  gradient: {
    flex: 1
  },
  container: {
    flex: 1,
    padding: 20
  },
  loanTitleView: {
    marginBottom: 20,
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center'
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  input: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    borderRadius: 5,
    paddingLeft: 10
  },
  button: {
    backgroundColor: '#e58d29',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20
  },
  locationContainer: {
    marginVertical: 10
  },
  locationText: {
    fontSize: 16,
    color: '#333'
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    height: 50
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    color: '#888'
  }
});
export default SMASendNonLns;