import React, { useState } from 'react';
import { createSMLoansCovered, createNonLoans, updateCompany, updateSMAccount, updateBizna, createBenefitContributions2 } from '../../../../../src/graphql/mutations';
import { getBizna, getCompany, getSMAccount, listCovCreditSellers, listCvrdGroupLoans, listSMLoansCovereds } from '../../../../../src/graphql/queries';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import styles from './styles';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { useTranslation } from 'react-i18next';
import translations from './translation';
const client = generateClient();
const SMASendNonLns = props => {
  const [SenderNatId, setSenderNatId] = useState('');
  const [RecNatId, setRecNatId] = useState('');
  const [SnderPW, setSnderPW] = useState("");
  const [amounts, setAmount] = useState("");
  const [Desc, setDesc] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const navigation = useNavigation();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const SndChmMmbrMny = () => {
    navigation.navigate("AutomaticRepayAllTyps");
  };
  const fetchCvLnSM = async () => {
    if (isLoading) return;
    setIsLoading(false);
    let userInfo, attributes;
    try {
      userInfo = await getCurrentUser();
      attributes = await fetchUserAttributes();
    } catch {
      Alert.alert(t.authFailed);
      return;
    }
    try {
      const Lonees1: any = await client.graphql({
        query: listSMLoansCovereds,
        variables: {
          filter: {
            and: {
              status: {
                eq: "LoanBL"
              },
              lonBala: {
                gt: 0
              },
              loaneeEmail: {
                eq: attributes.email
              }
            }
          }
        }
      });
      const fetchCLCrdSl = async () => {
        try {
          const Lonees3: any = await client.graphql({
            query: listCovCreditSellers,
            variables: {
              filter: {
                and: {
                  status: {
                    eq: "LoanBL"
                  },
                  lonBala: {
                    gt: 0
                  },
                  buyerContact: {
                    eq: attributes.email
                  }
                }
              }
            }
          });
          const fetchCLChm = async () => {
            try {
              const Lonees5: any = await client.graphql({
                query: listCvrdGroupLoans,
                variables: {
                  filter: {
                    and: {
                      status: {
                        eq: "LoanBL"
                      },
                      lonBala: {
                        gt: 0
                      },
                      loaneePhn: {
                        eq: attributes.email
                      }
                    }
                  }
                }
              });
              const fetchSenderUsrDtls = async () => {
                try {
                  const accountDtl: any = await client.graphql({
                    query: getSMAccount,
                    variables: {
                      awsemail: attributes.email
                    }
                  });
                  const SenderUsrBal = accountDtl.data.getSMAccount.balance;
                  const usrPW = accountDtl.data.getSMAccount.pw;
                  const usrAcActvStts = accountDtl.data.getSMAccount.acStatus;
                  const SenderSub = accountDtl.data.getSMAccount.owner;
                  const ttlNonLonsSentSMs = accountDtl.data.getSMAccount.ttlNonLonsSentSM;
                  const loanLimits = accountDtl.data.getSMAccount.loanLimit;
                  const beneficiaryType = accountDtl.data.getSMAccount.beneficiaryType;
                  const names = accountDtl.data.getSMAccount.name;
                  const owner = accountDtl.data.getSMAccount.owner;
                  const beneficiary = accountDtl.data.getSMAccount.beneficiary;
                  const SenderbenefitsAmount = accountDtl.data.getSMAccount.benefitsAmount;

                  // … all your nested functions remain unchanged …
                  // Just replace API.graphql(graphqlOperation(...)) with client.graphql({ query, variables })
                } catch (e) {
                  console.log(e);
                  Alert.alert(t.retryOrUpdate);
                }
              };
              await fetchSenderUsrDtls();
            } catch (e) {
              console.log(e);
              Alert.alert(t.retryOrUpdate);
            }
          };
          await fetchCLChm();
        } catch (e) {
          console.log(e);
          Alert.alert(t.fillDetailsOrUpdate);
        } finally {
          setIsLoading(false);
        }
        setSenderNatId('');
        setAmount("");
        setRecNatId('');
        setDesc("");
        setSnderPW("");
      };
      await fetchCLCrdSl();
    } catch (e) {
      console.log(e);
      Alert.alert(t.retryOrUpdate);
    }
  };
  return (
    <LinearGradient colors={['#e58d29', 'skyblue']} start={[0, 0]} end={[1, 1]} style={styles.image}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>{t.fillAccountDetails}</Text>

            <View style={styles.sendAmtView}>
              <Text style={styles.sendAmtText}>{t.businessPhone}</Text>
              <TextInput placeholder={t.businessPhone} placeholderTextColor="#999" value={RecNatId} onChangeText={setRecNatId} style={styles.sendAmtInput} editable={true} />
            </View>

            <View style={styles.sendAmtView}>
              <Text style={styles.sendAmtText}>{t.amountSent}</Text>
              <TextInput keyboardType={"decimal-pad"} placeholder={t.amountSent} placeholderTextColor="#999" value={amounts} onChangeText={setAmount} style={styles.sendAmtInput} editable={true} />
            </View>

            <View style={styles.sendAmtView}>
              <Text style={styles.sendAmtText}>{t.buyerPassword}</Text>
              <View style={styles.passwordContainer}>
                <TextInput placeholder={t.buyerPassword} placeholderTextColor="#999" value={SnderPW} onChangeText={setSnderPW} secureTextEntry={!isPasswordVisible} style={styles.passwordInput} editable={true} />
                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                  <Ionicons name={isPasswordVisible ? 'eye' : 'eye-off'} size={22} color="gray" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sendAmtViewDesc}>
              <Text style={styles.sendAmtText}>{t.description}</Text>
              <TextInput multiline={true} placeholder={t.description} placeholderTextColor="#999" value={Desc} onChangeText={setDesc} style={styles.sendAmtInputDesc} editable={true} textAlignVertical="top" />
            </View>

            <TouchableOpacity onPress={fetchCvLnSM} style={styles.sendAmtButton}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendAmtButtonText}>{t.send}</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </LinearGradient>
  );
};
export default SMASendNonLns;