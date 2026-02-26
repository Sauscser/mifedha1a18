import React, { useEffect, useState } from 'react';
import { createNonLoans, updateCompany, updateSMAccount, updateBizna, createMessages, sendNotification } from '../../../src/graphql/mutations';
import { getBizna, getCompany, getSMAccount } from '../../../src/graphql/queries';
import { useNavigation } from '@react-navigation/native';
import { View, Text, ImageBackground, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import styles from './styles';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { formatAmountSync, convertForeignToKsh, getUserNationalityByEmail } from '../../../src/utils/exchange';
const client = generateClient();
const SMASendNonLns = props => {
  const [SenderNatId, setSenderNatId] = useState('');
  const [RecNatId, setRecNatId] = useState('');
  const [SnderPW, setSnderPW] = useState("");
  const [SendrPhn, setSendrPhn] = useState(null);
  const [amounts, setAmount] = useState("");
  const [Desc, setDesc] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { ratesMap } = useExchange();
  const fetchSenderUsrDtls = async () => {
    if (isLoading) {
      return;
    }
    setIsLoading(false);
    const userInfo = await getCurrentUser();
    try {
      const accountDtl: any = await client.graphql({
        query: getBizna,
        variables: {
          BusKntct: SenderNatId
        }
      });
      const netEarningss = accountDtl.data.getBizna.netEarnings;
      const usrPW = accountDtl.data.getBizna.pw;
      const busNames = accountDtl.data.getBizna.busName;
      const SenderSub = accountDtl.data.getBizna.owner;
      const noBL = accountDtl.data.getBizna.noBL;
      const fetchCompDtls = async () => {
        if (isLoading) {
          return;
        }
        setIsLoading(true);
        try {
          const CompDtls: any = await client.graphql({
            query: getCompany,
            variables: {
              AdminId: "BaruchHabaB'ShemAdonai2"
            }
          });
          const UsrTransferFee = CompDtls.data.getCompany.biznaTransferFee;
          const CompPhoneContact = CompDtls.data.getCompany.phoneContact;
          const companyEarningBals = CompDtls.data.getCompany.companyEarningBal;
          const companyEarnings = CompDtls.data.getCompany.companyEarning;
          const ttlNonLonssRecSMs = CompDtls.data.getCompany.ttlNonLonssRecSM;
          const ttlNonLonssSentSMs = CompDtls.data.getCompany.ttlNonLonssSentSM;
          const fetchRecUsrDtls = async () => {
            if (isLoading) {
              return;
            }
            setIsLoading(true);
            try {
              const RecAccountDtl: any = await client.graphql({
                query: getSMAccount,
                variables: {
                  awsemail: RecNatId
                }
              });
              const RecUsrBal = RecAccountDtl.data.getSMAccount.balance;
              const usrAcActvSttss = RecAccountDtl.data.getSMAccount.acStatus;
              const ttlNonLonsRecSMs = RecAccountDtl.data.getSMAccount.ttlNonLonsRecSM;
              const namess = RecAccountDtl.data.getSMAccount.name;
              const ttlDpstSMs = RecAccountDtl.data.getSMAccount.ttlDpstSM;
              const TtlWthdrwnSMs = RecAccountDtl.data.getSMAccount.TtlWthdrwnSM;
              const MaxAcBals = RecAccountDtl.data.getSMAccount.MaxAcBal;
              const phonecontact = RecAccountDtl.data.getSMAccount.phonecontact;
              // determine seller nationality (business) and convert amounts to KES for backend
              let sellerNationality = null;
              try {
                const biz = accountDtl.data.getBizna;
                if (biz?.email) sellerNationality = await getUserNationalityByEmail(biz.email);
              } catch (e) {}
              const foreignAmount = parseFloat(amounts) || 0;
              const transferFeeForeign = parseFloat(UsrTransferFee || 0) * foreignAmount;
              const totalForeign = foreignAmount + transferFeeForeign;
              const amountKes = await convertForeignToKsh(foreignAmount, sellerNationality);
              const feeKes = await convertForeignToKsh(transferFeeForeign, sellerNationality);
              const totalKes = Number(amountKes || 0) + Number(feeKes || 0);
              const sendSMNonLn = async () => {
                if (isLoading) {
                  return;
                }
                setIsLoading(true);
                try {
                  await client.graphql({
                    query: createNonLoans,
                    variables: {
                      input: {
                        recPhn: RecNatId,
                        senderPhn: SenderNatId,
                        amount: amountKes.toFixed(2),
                        description: Desc,
                        RecName: namess,
                        SenderName: busNames,
                        status: "BiznaShareCash",
                        owner: userInfo.userId
                      }
                    }
                  });
                } catch (error) {
                  if (error) {
                    console.log(error);
                    Alert.alert("Revenue sharing unsuccessful; Retry");
                    return;
                  }
                }
                setIsLoading(false);
                await updtSendrAc();
              };
              const updtSendrAc = async () => {
                if (isLoading) {
                  return;
                }
                setIsLoading(true);
                try {
                  await client.graphql({
                    query: updateBizna,
                    variables: {
                      input: {
                        BusKntct: SenderNatId,
                        netEarnings: (parseFloat(netEarningss) - totalKes).toFixed(2)
                      }
                    }
                  });
                } catch (error) {
                  console.log(error);
                  if (error) {
                    Alert.alert("Error! Enter details correctly");
                    return;
                  }
                }
                setIsLoading(false);
                await updtRecAc();
              };
              const updtRecAc = async () => {
                if (isLoading) {
                  return;
                }
                setIsLoading(true);
                try {
                  await client.graphql({
                    query: updateSMAccount,
                    variables: {
                      input: {
                        awsemail: RecNatId,
                        ttlNonLonsRecSM: (parseFloat(ttlNonLonsRecSMs) + Number(amountKes)).toFixed(2),
                        balance: (parseFloat(RecUsrBal) + Number(amountKes)).toFixed(2)
                      }
                    }
                  });
                } catch (error) {
                  console.log(error);
                  if (error) {
                    Alert.alert("Retry or update app or call customer care");
                    return;
                  }
                }
                setIsLoading(false);
                await updtComp();
              };
              const updtComp = async () => {
                if (isLoading) {
                  return;
                }
                setIsLoading(true);
                try {
                  await client.graphql({
                    query: updateCompany,
                    variables: {
                      input: {
                        AdminId: "BaruchHabaB'ShemAdonai2",
                        companyEarningBal: feeKes + parseFloat(companyEarningBals),
                        companyEarning: feeKes + parseFloat(companyEarnings),
                        ttlNonLonssRecSM: Number(amountKes) + parseFloat(ttlNonLonssRecSMs),
                        ttlNonLonssSentSM: Number(amountKes) + parseFloat(ttlNonLonssSentSMs)
                      }
                    }
                  });
                } catch (error) {
                  console.log(error);
                  if (error) {
                    Alert.alert("Check your internet connection");
                    return;
                  }
                }
                const RecNat = RecAccountDtl.data.getSMAccount.nationality;
                const formattedAmount = formatAmountSync(Number(amountKes), RecNat, ratesMap);
                const bizNat = accountDtl.data.getBizna?.nationality || null;
                const formattedTxFee = formatAmountSync(Number(feeKes), bizNat, ratesMap);
                Alert.alert(`Amount: ${formattedAmount} Transaction: ${formattedTxFee}`);
                const revShareMessage3 = `Confirmed. ${busNames} Business entity has sent you ${formattedAmount} to your MiFedha Main account. Please confirm this transaction record is on your Mifedha app. Thank you. MiFedha`;
                try {
                  const msgRes = await client.graphql({
                    query: createMessages,
                    variables: { input: { senderEmail: phonecontact, messageBody: revShareMessage3 }}
                  });
                  if (msgRes?.data?.createMessages) {
                    await client.graphql({
                      query: sendNotification,
                      variables: { riderEmail: phonecontact, title: 'MiFedha: Revenue Shared', body: revShareMessage3 }
                    });
                  }
                } catch (notifErr) {
                  console.log('Notification error:', notifErr);
                }
                setIsLoading(false);
              };
              if (usrAcActvSttss !== "AccountActive") {
                Alert.alert('Receiver account is inactive');
              } else if (SenderNatId === RecNatId) {
                Alert.alert('You cannot Send money to yourself Yourself');
              } else if (parseFloat(netEarningss) < totalKes) {
                Alert.alert('Requested amount is more than you have in your account');
              } else if (parseFloat(RecUsrBal) + Number(amountKes) > parseFloat(MaxAcBals)) {
                Alert.alert("Receiver call customer care to have wallet capacity adjusted");
                return;
              } else if (noBL > 0) {
                Alert.alert('Please first clear your lenders');
              } else if (parseFloat(ttlDpstSMs) === 0 && parseFloat(TtlWthdrwnSMs) === 0) {
                Alert.alert('Receiver ID be verified through deposit at MFNdogo');
              } else if (usrPW !== SnderPW) {
                Alert.alert('Wrong password');
              } else if (userInfo.userId !== SenderSub) {
                Alert.alert('You do not own this business');
              } else {
                sendSMNonLn();
              }
            } catch (e) {
              console.log(e);
              if (e) {
                Alert.alert("Retry 1 or update app or call customer care");
                return;
              }
            }
            setIsLoading(false);
          };
          await fetchRecUsrDtls();
        } catch (e) {
          console.log(e);
          if (e) {
            Alert.alert("Retry 2 or update app or call customer care");
            return;
          }
        }
        setIsLoading(false);
      };
      await fetchCompDtls();
    } catch (e) {
      console.log(e);
      if (e) {
        Alert.alert("Retry 3 or update app or call customer care");
        return;
      }
    }
    ;
    setIsLoading(false);
    setSenderNatId('');
    setAmount("");
    setRecNatId('');
    setDesc("");
    setSnderPW("");
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
  return <View>
      <View style={styles.image}>
        <ScrollView>
         
          <View style={styles.amountTitleView}>
            <Text style={styles.title}>Fill account Details Below</Text>
          </View>
          <View style={styles.sendAmtView}>
            <TextInput placeholder="+2547xxxxxxxx" value={SenderNatId} onChangeText={setSenderNatId} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>Business Phone</Text>
          </View>
          

          <View style={styles.sendAmtView}>
            <TextInput placeholder="Receiver Email" value={RecNatId} onChangeText={setRecNatId} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>Receiver Email</Text>
          </View>

          <View style={styles.sendAmtView}>
            <TextInput keyboardType={"decimal-pad"} value={amounts} onChangeText={setAmount} style={styles.sendAmtInput} editable={true}></TextInput>
              
            <Text style={styles.sendAmtText}>Amount Sent</Text>
          </View>


          <View style={styles.sendAmtView}>
            <TextInput value={SnderPW} onChangeText={setSnderPW} secureTextEntry={true} style={styles.sendAmtInput} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>Business PassWord</Text>
          </View>

          

          <View style={styles.sendAmtViewDesc}>
            <TextInput multiline={true} value={Desc} onChangeText={setDesc} style={styles.sendAmtInputDesc} editable={true}></TextInput>
            <Text style={styles.sendAmtText}>Description</Text>
          </View>

          <TouchableOpacity onPress={fetchSenderUsrDtls} style={styles.sendAmtButton}>
            <Text style={styles.sendAmtButtonText}>Send</Text>
            {isLoading && <ActivityIndicator size="large" color="blue" />}
          </TouchableOpacity>

          
        </ScrollView>
      </View>
    </View>;
};
export default SMASendNonLns;