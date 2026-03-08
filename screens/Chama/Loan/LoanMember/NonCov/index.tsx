import React, { useEffect, useState } from 'react';
import { createNonCvrdGroupLoans, updateChamaMembers, updateCompany, updateGroup, updateReqLoanChama, updateSMAccount } from '../../../../../src/graphql/mutations';
import { getCompany, getSMAccount, getGroup, getChamaMembers, getReqLoanChama } from '../../../../../src/graphql/queries';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import styles from './styles';
import { parse } from 'expo-linking';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";

import { useExchange } from '../../../../../src/contexts/ExchangeContext';
import { convertForeignToKsh, formatAmountSync } from '../../../../../src/utils/exchange';
import { nationalityToCode } from '../../../../../src/utils/nationalityToCode';

const client = generateClient();
const ChmNonCovLns = props => {
  const [ChmPhn, setChmPhn] = useState('');
  const [RecNatId, setRecNatId] = useState('');
  const [RecPhn, setRecPhn] = useState('');
  const [SnderPW, setSnderPW] = useState("");
  const [RepaymtPeriod, setRepaymtPeriod] = useState("");
  const [amount, setAmount] = useState("");
  const [AmtExp, setAmtExp] = useState("");
  const [AdvRegNo, setAdvRegNo] = useState("");
  const [Desc, setDesc] = useState("");
  const [ownr, setownr] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [RecAccCode, setRecAccCode] = useState("");
  const [DfltPnlty, setDfltPnlty] = useState('');
  const [MmbrId, setMmbrId] = useState('');
  const [userNationality, setUserNationality] = useState<string>(null);
  const ChmNMmbrPhns = MmbrId + ChmPhn;
  const route = useRoute();
  
  const { ratesMap } = useExchange();
  const userCurrencyKey = nationalityToCode(userNationality);

  // Parse amount input
  const parseAmountInput = (value: string): number => {
    if (!value || value.trim() === '') return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

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

  const fetchUser = async () => {
    const userInfo = await getCurrentUser();
    setownr(userInfo.userId);
    
    try {
      const attributes = await fetchUserAttributes();
      const userData = await client.graphql({
        query: getSMAccount,
        variables: { awsemail: attributes.email },
      });
      setUserNationality(userData.data.getSMAccount.nationality);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };
  useEffect(() => {
    fetchUser();
  }, []);
  const fetchChmLnReqDtls = async () => {
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    try {
      const ChmMbrtDtlz: any = await client.graphql({
        query: getReqLoanChama,
        variables: {
          id: route.params.id
        }
      });
      const groupContacts = ChmMbrtDtlz.data.getReqLoanChama.chamaPhone;
      const memberContacts = ChmMbrtDtlz.data.getReqLoanChama.loaneePhone;
      const loaneeEmail = ChmMbrtDtlz.data.getReqLoanChama.loaneeEmail;
      const amount = ChmMbrtDtlz.data.getReqLoanChama.amount;
      const AmtExp = ChmMbrtDtlz.data.getReqLoanChama.repaymentAmt;
      const RepaymtPeriod = ChmMbrtDtlz.data.getReqLoanChama.repaymentPeriod;
      const loaneeMemberId = ChmMbrtDtlz.data.getReqLoanChama.loaneeMemberId;
      const ChmNMmbrPhns = loaneeMemberId + groupContacts;
      const today = new Date();
      let hours = (today.getHours() < 10 ? '0' : '') + today.getHours();
      let minutes = (today.getMinutes() < 10 ? '0' : '') + today.getMinutes();
      let seconds = (today.getSeconds() < 10 ? '0' : '') + today.getSeconds();
      let years = (today.getFullYear() < 10 ? '0' : '') + today.getFullYear();
      let months = (today.getMonth() < 10 ? '0' : '') + today.getMonth();
      let months2 = parseFloat(months);
      let days = (today.getDate() < 10 ? '0' : '') + today.getDate();
      const now: any = years + "-" + "0" + months2 + "-" + days + "T" + hours + ':' + minutes + ':' + seconds;
      const curYrs = parseFloat(years) * 365;
      const curMnths = months2 * 30.4375;
      const daysUpToDate = curYrs + curMnths + parseFloat(days);
      const fetchChmMbrDtls = async () => {
        if (isLoading) {
          return;
        }
        setIsLoading(true);
        try {
          const ChmMbrtDtl: any = await client.graphql({
            query: getChamaMembers,
            variables: {
              ChamaNMember: ChmNMmbrPhns
            }
          });
          const GrossLnsGvns = ChmMbrtDtl.data.getChamaMembers.GrossLnsGvn;
          const LonAmtGvens = ChmMbrtDtl.data.getChamaMembers.LonAmtGven;
          const LnBals = ChmMbrtDtl.data.getChamaMembers.LnBal;
          const fetchSenderUsrDtls = async () => {
            if (isLoading) {
              return;
            }
            setIsLoading(true);
            try {
              const accountDtl: any = await client.graphql({
                query: getGroup,
                variables: {
                  grpContact: groupContacts
                }
              });
              const grpBals = accountDtl.data.getGroup.grpBal;
              const signitoryPWs = accountDtl.data.getGroup.signitoryPW;
              const statuss = accountDtl.data.getGroup.status;
              const TtlActvLonsTmsLnrChmNonCovs = accountDtl.data.getGroup.TtlActvLonsTmsLnrChmNonCov;
              const TtlActvLonsAmtLnrChmNonCovs = accountDtl.data.getGroup.TtlActvLonsAmtLnrChmNonCov;
              const grpNames = accountDtl.data.getGroup.grpName;
              const SenderSub = accountDtl.data.getGroup.owner;
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
                  const userLoanTransferFees = CompDtls.data.getCompany.userLoanTransferFee;
                  const companyEarningBals = CompDtls.data.getCompany.companyEarningBal;
                  const companyEarnings = CompDtls.data.getCompany.companyEarning;
                  const ttlChmLnsInAmtNonCovs = CompDtls.data.getCompany.ttlChmLnsInAmtNonCov;
                  const ttlChmLnsInTymsNonCovs = CompDtls.data.getCompany.ttlChmLnsInTymsNonCov;
                  const maxInterestGrps = CompDtls.data.getCompany.maxInterestGrp;
                  const Interest = (parseFloat(AmtExp) - parseFloat(amount)) * 100 / (parseFloat(amount) * parseFloat(RepaymtPeriod));
                  const maxBLss = CompDtls.data.getCompany.maxBLs;
                  const IntAmt = parseFloat(AmtExp) - (parseFloat(amount) + parseFloat(userLoanTransferFees) * parseFloat(amount));
                  const MaxSMInterest = (parseFloat(amount) + parseFloat(userLoanTransferFees) * parseFloat(amount)) * parseFloat(maxInterestGrps) * parseFloat(RepaymtPeriod);
                  const ActualMaxSMInterest = parseFloat(AmtExp) - (parseFloat(amount) + parseFloat(userLoanTransferFees) * parseFloat(amount));
                  const TransCost = parseFloat(userLoanTransferFees) * parseFloat(amount);
                  const TtlTransCost = parseFloat(userLoanTransferFees) * parseFloat(amount) + parseFloat(amount);
                  const AllTtlTrnsCst = TtlTransCost + MaxSMInterest;
                  const TotalAmtExp = parseFloat(userLoanTransferFees) * parseFloat(amount) + parseFloat(AmtExp);
                  const fetchRecUsrDtls = async () => {
                    if (isLoading) {
                      return;
                    }
                    setIsLoading(true);
                    try {
                      const RecAccountDtl: any = await client.graphql({
                        query: getSMAccount,
                        variables: {
                          awsemail: loaneeEmail
                        }
                      });
                      const RecUsrBal = RecAccountDtl.data.getSMAccount.balance;
                      const usrNoBL = RecAccountDtl.data.getSMAccount.MaxTymsBL;
                      const usrAcActvSttss = RecAccountDtl.data.getSMAccount.acStatus;
                      const recAcptncCode = RecAccountDtl.data.getSMAccount.loanAcceptanceCode;
                      const TtlActvLonsTmsLnrCovss = RecAccountDtl.data.getSMAccount.TtlActvLonsTmsLnrCov;
                      const TtlActvLonsTmsLneeCovss = RecAccountDtl.data.getSMAccount.TtlActvLonsTmsLneeCov;
                      const TtlActvLonsTmsLneeChmNonCovs = RecAccountDtl.data.getSMAccount.TtlActvLonsTmsLneeChmNonCov;
                      const TtlActvLonsAmtLneeChmNonCovs = RecAccountDtl.data.getSMAccount.TtlActvLonsAmtLneeChmNonCov;
                      const namess = RecAccountDtl.data.getSMAccount.name;
                      const ttlDpstSMs = RecAccountDtl.data.getSMAccount.ttlDpstSM;
                      const MaxAcBals = RecAccountDtl.data.getSMAccount.MaxAcBal;
                      const DefaultPenaltySMs = RecAccountDtl.data.getSMAccount.DefaultPenaltySM;
                      const TtlWthdrwnSMs = RecAccountDtl.data.getSMAccount.TtlWthdrwnSM;
                      // Convert DfltPnlty to KES
                      const dfltPnltyForeign = parseAmountInput(DfltPnlty);
                      const dfltPnltyInKES = convertForeignToKsh(dfltPnltyForeign, userCurrencyKey, ratesMap);
                      
                      const DefaultPenaltyRate = dfltPnltyInKES / parseFloat(AmtExp) * 100;
                      const RecomDfltPnltyRate = parseFloat(AmtExp) * 20 / 100;
                      
                      // Confirmation prompt
                      const confirmLoan = (): Promise<boolean> => {
                        return new Promise((resolve) => {
                          Alert.alert(
                            'Confirm Loan Approval',
                            `Loan Amount: ${formatAmountSync(parseFloat(amount), userCurrencyKey, ratesMap)}\nExpected Back: ${formatAmountSync(parseFloat(AmtExp), userCurrencyKey, ratesMap)}\nDefault Penalty: ${formatAmountSync(dfltPnltyInKES, userCurrencyKey, ratesMap)}\n\nApprove this loan?`,
                            [
                              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                              { text: 'Approve', onPress: () => resolve(true) }
                            ]
                          );
                        });
                      };

                      const sendSMLn = async () => {
                        if (isLoading) {
                          return;
                        }
                        setIsLoading(true);
                        try {
                          await client.graphql({
                            query: createNonCvrdGroupLoans,
                            variables: {
                              input: {
                                grpContact: groupContacts,
                                loaneePhn: loaneeEmail,
                                loanerLoanee: groupContacts + memberContacts,
                                repaymentPeriod: RepaymtPeriod,
                                amountGiven: parseFloat(amount).toFixed(0),
                                amountExpectedBack: TotalAmtExp.toFixed(0),
                                amountExpectedBackWthClrnc: TotalAmtExp.toFixed(0),
                                amountRepaid: 0,
                                description: Desc,
                                loaneeName: namess,
                                timeExpBack: parseFloat(RepaymtPeriod) + daysUpToDate,
                                timeExpBack2: 61 + daysUpToDate,
                                loanerName: grpNames,
                                memberId: ChmNMmbrPhns,
                                lonBala: TotalAmtExp.toFixed(0),
                                DefaultPenaltyChm: dfltPnltyInKES.toFixed(0),
                                DefaultPenaltyChm2: 0,
                                status: "LoanActive",
                                owner: ownr
                              }
                            }
                          });
                        } catch (error) {
                          if (error) {
                            Alert.alert("Loaning unsuccessful; enter details correctly");
                            return;
                          }
                        }
                        setIsLoading(false);
                        await updatMmbr();
                      };
                      const updatMmbr = async () => {
                        if (isLoading) {
                          return;
                        }
                        setIsLoading(true);
                        try {
                          await client.graphql({
                            query: updateChamaMembers,
                            variables: {
                              input: {
                                ChamaNMember: ChmNMmbrPhns,
                                LonAmtGven: (parseFloat(LonAmtGvens) + parseFloat(amount)).toFixed(0),
                                GrossLnsGvn: (parseFloat(GrossLnsGvns) + TotalAmtExp).toFixed(0),
                                LnBal: (parseFloat(LnBals) + TotalAmtExp).toFixed(0),
                                loanStatus: "LoanActive",
                                blStatus: "AccountNotBL"
                              }
                            }
                          });
                        } catch (error) {
                          console.log(error);
                          if (error) {
                            Alert.alert("Member doesnt exist");
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
                            query: updateGroup,
                            variables: {
                              input: {
                                grpContact: groupContacts,
                                TtlActvLonsTmsLnrChmNonCov: parseFloat(TtlActvLonsTmsLnrChmNonCovs) + 1,
                                TtlActvLonsAmtLnrChmNonCov: (parseFloat(TtlActvLonsAmtLnrChmNonCovs) + TotalAmtExp).toFixed(0),
                                grpBal: (parseFloat(grpBals) - TtlTransCost).toFixed(0)
                              }
                            }
                          });
                        } catch (error) {
                          if (error) {
                            Alert.alert("Check your internet connection");
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
                                awsemail: loaneeEmail,
                                TtlActvLonsTmsLneeChmNonCov: parseFloat(TtlActvLonsTmsLneeChmNonCovs) + 1,
                                TtlActvLonsAmtLneeChmNonCov: (parseFloat(TtlActvLonsAmtLneeChmNonCovs) + TotalAmtExp).toFixed(0),
                                balance: (parseFloat(RecUsrBal) + parseFloat(amount)).toFixed(0),
                                loanStatus: "LoanActive",
                                blStatus: "AccountNotBL",
                                loanAcceptanceCode: "None"
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
                        setIsLoading(false);
                        await updtComp();
                      };
                      const updtComp = async () => {
                        if (isLoading) {
                          return;
                        }
                        setIsLoading(false);
                        try {
                          await client.graphql({
                            query: updateCompany,
                            variables: {
                              input: {
                                AdminId: "BaruchHabaB'ShemAdonai2",
                                companyEarningBal: parseFloat(userLoanTransferFees) * parseFloat(amount) + parseFloat(companyEarningBals),
                                companyEarning: parseFloat(userLoanTransferFees) * parseFloat(amount) + companyEarnings,
                                ttlChmLnsInAmtNonCov: TotalAmtExp + parseFloat(ttlChmLnsInAmtNonCovs),
                                ttlChmLnsInTymsNonCov: 1 + parseFloat(ttlChmLnsInTymsNonCovs)
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
                        Alert.alert("Transaction Fee:Ksh. " + (parseFloat(userLoanTransferFees) * parseFloat(amount)).toFixed(2));
                        setIsLoading(false);
                        await updtLnReq();
                      };
                      const updtLnReq = async () => {
                        if (isLoading) {
                          return;
                        }
                        setIsLoading(false);
                        try {
                          await client.graphql({
                            query: updateReqLoanChama,
                            variables: {
                              input: {
                                id: route.params.id,
                                status: "Approved"
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
                        Alert.alert("Transaction Fee:Ksh. " + (parseFloat(userLoanTransferFees) * parseFloat(amount)).toFixed(2));
                        setIsLoading(false);
                      };
                      if (parseFloat(usrNoBL) > parseFloat(maxBLss)) {
                        Alert.alert('Receiver does not qualify');
                        return;
                      } else if (parseFloat(ttlDpstSMs) === 0 && parseFloat(TtlWthdrwnSMs) === 0) {
                        Alert.alert('Loanee National ID be verified through deposit at NSNdogo');
                      } else if (ownr !== SenderSub) {
                        Alert.alert('You are not the creator/signitory of this Chama');
                      } else if (statuss !== "AccountActive") {
                        Alert.alert('Sender account is inactive');
                      } else if (parseFloat(RecUsrBal) + parseFloat(amount) > parseFloat(MaxAcBals)) {
                        Alert.alert('Loanee call customer care to have wallet capacity adjusted');
                        return;
                      } else if (DefaultPenaltyRate > 20) {
                        Alert.alert('Please enter Default Penalty less than ' + formatAmountSync(Math.floor(RecomDfltPnltyRate), userCurrencyKey, ratesMap));
                        return;
                      } else if (groupContacts === memberContacts) {
                        Alert.alert('You cannot Loan Yourself');
                      } else if (usrAcActvSttss !== "AccountActive") {
                        Alert.alert('Receiver account is inactive');
                      } else if (parseFloat(grpBals) < TtlTransCost) {
                        Alert.alert("Cancelled." + "Bal: " + grpBals + ". Deductable: " + TtlTransCost.toFixed(2) + ". " + (TtlTransCost - parseFloat(grpBals)).toFixed(2) + ' more needed');
                      } else if (signitoryPWs !== SnderPW) {
                        Alert.alert('Wrong password');
                      } else {
                        const confirmed = await confirmLoan();
                        if (confirmed) {
                          sendSMLn();
                        }
                      }
                    } catch (e) {
                      console.log(e);
                      if (e) {
                        Alert.alert("Check your internet connection");
                        return;
                      }
                    }
                    setIsLoading(false);
                  };
                  await fetchRecUsrDtls();
                } catch (e) {
                  console.log(e);
                  if (e) {
                    Alert.alert("Check your internet connection");
                    return;
                  }
                }
                setIsLoading(false);
              };
              await fetchCompDtls();
            } catch (e) {
              console.log(e);
              if (e) {
                Alert.alert("Please fill details correctly or check your internet connection");
                return;
              }
            }
            ;
            setIsLoading(false);
          };
          await fetchSenderUsrDtls();
        } catch (e) {
          console.log(e);
          if (e) {
            Alert.alert("Please fill details correctly or check your internet connection");
            return;
          }
        }
        ;
        setIsLoading(false);
      };
      await fetchChmMbrDtls();
    } catch (e) {
      console.log(e);
      if (e) {
        Alert.alert("Check internet or enter correct Member ID");
        return;
      }
    }
    setAmount("");
    setChmPhn("");
    setAdvRegNo("");
    setAmtExp("");
    setDesc("");
    setSnderPW("");
    setRepaymtPeriod("");
    setRecAccCode("");
    setDfltPnlty("");
    setMmbrId("");
    setIsLoading(false);
  };
  useEffect(() => {
    const DfltPnltys = DfltPnlty;
    if (!DfltPnltys && DfltPnltys !== "") {
      setDfltPnlty("");
      return;
    }
    setDfltPnlty(DfltPnltys);
  }, [DfltPnlty]);
  useEffect(() => {
    const SnderNatIds = MmbrId;
    if (!SnderNatIds && SnderNatIds !== "") {
      setMmbrId("");
      return;
    }
    setMmbrId(SnderNatIds);
  }, [MmbrId]);
  useEffect(() => {
    const RecPhns = RecPhn;
    if (!RecPhns && RecPhns !== "") {
      setRecPhn("");
      return;
    }
    setRecPhn(RecPhns);
  }, [RecPhn]);
  useEffect(() => {
    const ChmPhns = ChmPhn;
    if (!ChmPhns && ChmPhns !== "") {
      setChmPhn("");
      return;
    }
    setChmPhn(ChmPhns);
  }, [ChmPhn]);
  useEffect(() => {
    const amt = amount;
    if (!amt && amt !== "") {
      setAmount("");
      return;
    }
    setAmount(amt);
  }, [amount]);
  useEffect(() => {
    const RecNatIds = RecNatId;
    if (!RecNatIds && RecNatIds !== "") {
      setRecNatId("");
      return;
    }
    setRecNatId(RecNatIds);
  }, [RecNatId]);
  useEffect(() => {
    const AdvRegNoss = AdvRegNo;
    if (!AdvRegNoss && AdvRegNoss !== "") {
      setAdvRegNo("");
      return;
    }
    setAdvRegNo(AdvRegNoss);
  }, [AdvRegNo]);
  useEffect(() => {
    const AmtExpss = AmtExp;
    if (!AmtExpss && AmtExpss !== "") {
      setAmtExp("");
      return;
    }
    setAmtExp(AmtExpss);
  }, [AmtExp]);
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
  useEffect(() => {
    const RepaymtPeriods = RepaymtPeriod;
    if (!RepaymtPeriods && RepaymtPeriods !== "") {
      setRepaymtPeriod("");
      return;
    }
    setRepaymtPeriod(RepaymtPeriods);
  }, [RepaymtPeriod]);
  useEffect(() => {
    const RecAccCodes = RecAccCode;
    if (!RecAccCodes && RecAccCodes !== "") {
      setRecAccCode("");
      return;
    }
    setRecAccCode(RecAccCodes);
  }, [RecAccCode]);
  return <View style={styles.image}>
        <ScrollView>
         
         <View style={styles.amountTitleView}>
           <Text style={styles.title}>Fill Loan Details Below</Text>
         </View>

         

         <View style={styles.sendAmtView}>
           <TextInput placeholder='Chama PassWord' value={SnderPW} onChangeText={setSnderPW} secureTextEntry={true} style={styles.sendAmtInput} editable={true}></TextInput>
           
         </View>

         <View style={styles.sendAmtView}>
           <TextInput keyboardType="decimal-pad" placeholder="Default Penalty" value={DfltPnlty} onChangeText={handleMoneyInput(setDfltPnlty)} onBlur={() => formatMoneyOnBlur(DfltPnlty, setDfltPnlty)} style={styles.sendAmtInput} editable={true} />
           
         </View>

        
         <View style={styles.sendAmtViewDesc}>
           <TextInput multiline={true} placeholder="Description" value={Desc} onChangeText={setDesc} style={styles.sendAmtInputDesc} editable={true}></TextInput>
          
         </View>

         
         

         <TouchableOpacity onPress={fetchChmLnReqDtls} style={styles.sendAmtButton}>
           <Text style={styles.sendAmtButtonText}>Loan without Advocate Coverage</Text>
           {isLoading && <ActivityIndicator size="large" color="blue" />}
         </TouchableOpacity>

         
       </ScrollView>
      </View>;
};
export default ChmNonCovLns;