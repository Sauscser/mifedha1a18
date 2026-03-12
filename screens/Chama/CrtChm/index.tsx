// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions, StyleSheet, Image } from 'react-native';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { uploadData } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { createChamaMembers, createGroup, updateChamaApply2, updateCompany } from '../../../src/graphql/mutations';
import { getMiFedhaBankAdmin, getSMAccount, getCompany } from '../../../src/graphql/queries';

import { useExchange } from '../../../src/contexts/ExchangeContext';
import { convertForeignToKsh, formatAmountSync } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';


import translations from './translation';
import { useTranslation } from 'react-i18next';

export type UserReg = {
  usr: string;
};
const MAX_IMAGE_SIZE_MB = 5;

const client = generateClient();

const CreateChama = (props: UserReg) => {
  const { usr } = props;
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { id, bankAdminEmail, ChamaAcNu } = route.params;
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const t = translations[lang] || translations.en;
  const [ChmPhn, setChmPhn] = useState('');
  const [awsEmail, setAWSEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pword, setPW] = useState('');
  const [ChmNm, setChmNm] = useState('');
  const [ChmDesc, setChmDesc] = useState('');
  const [ChmRegNo, setChmRegNo] = useState('');
  const [MmbaID, setMmbaID] = useState('');
  const [Sign2Phn, setSign2Phn] = useState('');
  const [Sign3Phn, setSign3Phn] = useState('');
  const [oprtnAreas, setoprtnAreas] = useState('');
  const [ventures, setventures] = useState('');
  const [SubFreq, setSubFreq] = useState('');
  const [SubAmt, setSubAmt] = useState('');
  const [lateSub, setlateSub] = useState('');
  const [loanApprovalThreshHold, setloanApprovalThreshHold] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userNationality, setUserNationality] = useState<string>(null);

  // Signature states
  const [chairSignKey, setChairSignKey] = useState<string | null>(null);
  const [chairSignUri, setChairSignUri] = useState<string | null>(null);
  const [secSignKey, setSecSignKey] = useState<string | null>(null);
  const [secSignUri, setSecSignUri] = useState<string | null>(null);
  const ChmPhnNphoneContact = MmbaID + ChamaAcNu;

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

  useEffect(() => {
    const fetchUserData = async () => {
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
    fetchUserData();
  }, []);

  /** Image Handling **/
  const pickSignature = async (role: 'chair' | 'sec') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      handleSignature(result.assets[0].uri, role);
    }
  };
  const takeSignature = async (role: 'chair' | 'sec') => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      handleSignature(result.assets[0].uri, role);
    }
  };
  const handleSignature = async (uri: string, role: 'chair' | 'sec') => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(uri, [{
        resize: {
          width: 600
        }
      }], {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.PNG
      });
      const response = await fetch(manipResult.uri);
      const blob = await response.blob();
      const imageSizeMB = blob.size / (1024 * 1024);
      if (imageSizeMB > MAX_IMAGE_SIZE_MB) {
        Alert.alert('Image too large', `Image is ${imageSizeMB.toFixed(2)}MB. Max allowed is ${MAX_IMAGE_SIZE_MB}MB.`);
        return;
      }
      const filename = `${Date.now()}_${role}Sign.png`;
      // Upload using Amplify Storage v6 helper
      await uploadData({ key: filename, data: blob, options: { contentType: 'image/png' } }).result;
      if (role === 'chair') {
        setChairSignKey(filename);
        setChairSignUri(manipResult.uri);
      } else {
        setSecSignKey(filename);
        setSecSignUri(manipResult.uri);
      }
      Alert.alert('Success', `${role} signature uploaded successfully.`);
    } catch (err) {
      console.error('Signature upload failed:', err);
      Alert.alert('Error', 'Failed to upload signature. Please try again.');
    }
  };
  const clearSignature = (role: 'chair' | 'sec') => {
    if (role === 'chair') {
      setChairSignKey(null);
      setChairSignUri(null);
    } else {
      setSecSignKey(null);
      setSecSignUri(null);
    }
  };
  const handleCreateChama = async () => {
    // Convert amounts to KES first    const subAmtForeign = parseAmountInput(SubAmt);
    const lateSubForeign = parseAmountInput(lateSub);
    const loanThresholdForeign = parseAmountInput(loanApprovalThreshHold);
    
    const subAmtInKES = convertForeignToKsh(subAmtForeign, userCurrencyKey, ratesMap);
    const lateSubInKES = convertForeignToKsh(lateSubForeign, userCurrencyKey, ratesMap);
    const loanThresholdInKES = convertForeignToKsh(loanThresholdForeign, userCurrencyKey, ratesMap);

    // Confirmation prompt
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        t.confirmGroupCreation,
        `${t.subscriptionAmount}: ${formatAmountSync(subAmtInKES, userCurrencyKey, ratesMap)}\n${t.latePenalty}: ${formatAmountSync(lateSubInKES, userCurrencyKey, ratesMap)}\n${t.loanThreshold}: ${formatAmountSync(loanThresholdInKES, userCurrencyKey, ratesMap)}\n\n${t.proceed}`,
        [
          { text: t.cancel, style: 'cancel', onPress: () => resolve(false) },
          { text: t.confirm, onPress: () => resolve(true) }
        ]
      );
    });
    

    if (!confirmed) return;

    setIsLoading(true);
    try {
      if (!MmbaID || !ChmNm || !Sign2Phn || !Sign3Phn || !loanApprovalThreshHold || !pword || !SubFreq || !SubAmt || !lateSub || !ventures || !ChmDesc) {
        Alert.alert(t.missingRequired);
        setIsLoading(false);
        return;
      }
      const safeAWSEmail = awsEmail || 'None';
      const safeChmRegNo = ChmRegNo || 'None';
      const safeoprtnAreas = oprtnAreas || 'None';
      const safeventures = ventures || 'None';
      const client = await generateClient();
      const attributes = await fetchUserAttributes();
      const userInfo = await getCurrentUser();
      const bankAdminRes: any = await client.graphql({
        query: getMiFedhaBankAdmin,
        variables: {
          nationalid: bankAdminEmail
        }
      });
      const BankBranch = bankAdminRes.data.getMiFedhaBankAdmin.bank;
      const BankAdminEml = bankAdminRes.data.getMiFedhaBankAdmin.email;
      const userRes: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: attributes.email
        }
      });
      const nationalidsss = userRes.data.getSMAccount.nationalid;
      const namess = userRes.data.getSMAccount.name;
      const owner = userRes.data.getSMAccount.owner;
      if (attributes.sub !== owner) {
        Alert.alert(t.pleaseCreateMainAccount);
        setIsLoading(false);
        return;
      }
      const sign2Res: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: Sign2Phn
        }
      });
      const compRes: any = await client.graphql({
        query: getCompany,
        variables: {
          AdminId: "BaruchHabaB'ShemAdonai2"
        }
      });
      const ttlActiveChms = compRes.data.getCompany.ttlActiveChm;
      const ttlActiveChmUserss = compRes.data.getCompany.ttlActiveChmUsers;
      const today = new Date();
      const curYrs = today.getFullYear() * 365;
      const curMnths = (today.getMonth() + 1) * 30.4375;
      const daysUpToDate = curYrs + curMnths + today.getDate();
      if (pword.length < 8) {
        Alert.alert(t.passwordTooShort);
        setIsLoading(false);
        return;
      }
      if (parseFloat(lateSub) > parseFloat(SubAmt)) {
        Alert.alert(t.tooHighLatePenalty);
        setIsLoading(false);
        return;
      }
      await client.graphql({
        query: createGroup,
        variables: {
          input: {
            grpContact: ChamaAcNu,
            regNo: safeChmRegNo,
            signitoryContact: attributes.phone_number,
            SignatoryEmail: attributes.email,
            SignitoryNatid: nationalidsss,
            signitoryName: namess,
            grpName: ChmNm,
            signitoryPW: pword,
            signitory2Sub: Sign2Phn,
            signatory2Email: Sign2Phn,
            Signatory3Email: Sign3Phn,
            signitory3Sub2: Sign3Phn,
            WithdrawCnfrmtn2: 'NO',
            WithdrawCnfrmtnAmt2: 0,
            WithdrawCnfrmtn: 'NO',
            WithdrawCnfrmtnAmt: 0,
            BankAdminEmail: BankAdminEml,
            BankAdminAcNu: bankAdminEmail,
            GrpLoanOutSync: 0,
            GrpLoanRpymntSync: 0,
            MemberSubscrptnSync: 0,
            MemberDividendSync: 0,
            DepositSync: 0,
            WithdrawalSync: 0,
            BankName: 'Equity',
            BranchNu: BankBranch,
            grpEmail: safeAWSEmail,
            oprtnArea: safeoprtnAreas,
            venture: safeventures,
            grpBal: 0,
            ttlGrpMembers: 1,
            description: ChmDesc,
            ChmBenefits: 0,
            subscriptionFrequency: SubFreq,
            subscriptionAmt: subAmtInKES.toFixed(0),
            lateSubscriptionPenalty: lateSubInKES.toFixed(0),
            objectionStatus: 'NotObjected',
            objOfficer: 'None',
            objReason: 'None',
            AdminNo: 0,
            Admin1: attributes.email,
            Admin2: Sign2Phn,
            Admin3: Sign3Phn,
            Admin4: 'None',
            Admin5: 'None',
            Admin6: 'None',
            Admin7: 'None',
            Admin8: 'None',
            Admin9: 'None',
            Admin10: 'None',
            Admin11: 'None',
            Admin12: 'None',
            Admin13: 'None',
            Admin14: 'None',
            Admin15: 'None',
            Admin16: 'None',
            Admin17: 'None',
            Admin18: 'None',
            Admin19: 'None',
            Admin20: 'None',
            ttlNonLonsRecChm: 0,
            ttlNonLonsSentChm: 0,
            ttlDpst: 0,
            ttlWthdrwn: 0,
            tymsChmHvBL: 0,
            TtlActvLonsTmsLnrChmCov: 0,
            TtlActvLonsAmtLnrChmCov: 0,
            TtlBLLonsTmsLnrChmCov: 0,
            TtlBLLonsAmtLnrChmCov: 0,
            TtlClrdLonsTmsLnrChmCov: 0,
            TtlClrdLonsAmtLnrChmCov: 0,
            TtlActvLonsTmsLnrChmNonCov: 0,
            TtlActvLonsAmtLnrChmNonCov: 0,
            TtlBLLonsTmsLnrChmNonCov: 0,
            TtlBLLonsAmtLnrChmNonCov: 0,
            TtlClrdLonsTmsLnrChmNonCov: 0,
            TtlClrdLonsAmtLnrChmNonCov: 0,
            status: 'AccountActive',
            owner: userInfo.userId,
            chamaBenSync: 0,
            loanApprovalThreshHold: loanThresholdInKES.toFixed(0),
            chairSign: chairSignKey ? chairSignKey : 'NoChairSignUploaded',
            secSign: secSignKey ? secSignKey : 'NoSecSignUploaded'
          }
        }
      });
      await client.graphql({
        query: createChamaMembers,
        variables: {
          input: {
            MembaId: MmbaID,
            groupContact: ChamaAcNu,
            regNo: safeChmRegNo,
            ChamaNMember: ChmPhnNphoneContact,
            memberContact: attributes.email,
            memberNatId: nationalidsss,
            memberChmBenefit: 0,
            timeCrtd: daysUpToDate,
            subscribedAmt: 0,
            totalSubAmt: 0,
            GrossLnsGvn: 0,
            LonAmtGven: 0,
            AmtRepaid: 0,
            LnBal: 0,
            NonLoanAcBal: 0,
            ttlNonLonAcBal: 0,
            groupName: ChmNm,
            memberName: namess,
            AcStatus: 'AccountActive',
            loanStatus: 'NoLoan',
            blStatus: 'AccountNotBL',
            owner: userInfo.userId,
            ttlLateSubs: 0,
            subscriptionFrequency: SubFreq,
            subscriptionAmt: subAmtInKES.toFixed(0),
            lateSubscriptionPenalty: lateSubInKES.toFixed(0),
            transportApproved: 'ChamaTransportApprovedNo'
          }
        }
      });
      await client.graphql({
        query: updateChamaApply2,
        variables: {
          input: {
            id: id,
            status: 'AccountInactive'
          }
        }
      });
      await client.graphql({
        query: updateCompany,
        variables: {
          input: {
            AdminId: "BaruchHabaB'ShemAdonai2",
            ttlActiveChm: parseFloat(ttlActiveChms) + 1,
            ttlActiveChmUsers: parseFloat(ttlActiveChmUserss) + 1
          }
        }
      });
      Alert.alert(t.success, t.congratsCreated.replace('{name}', namess).replace('{group}', ChmNm));
      // Reset form
      setChmPhn('');
      setPW('');
      setAWSEmail('');
      setChmDesc('');
      setChmNm('');
      setChmRegNo('');
      setMmbaID('');
      setSign2Phn('');
      setSign3Phn('');
      setventures('');
      setoprtnAreas('');
      setSubAmt('');
      setSubFreq('');
      setlateSub('');
      setloanApprovalThreshHold('');
      clearSignature('chair');
      clearSignature('sec');
    } catch (error) {
      console.log(error);
      Alert.alert(t.errorOccurred);
    } finally {
      setIsLoading(false);
    }
  };
  return <LinearGradient colors={['#e58d29', 'skyblue']} style={{
    flex: 1,
    padding: 16
  }}>
    <KeyboardAvoidingView style={{
      flex: 1
    }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, {
          textAlign: 'center',
          marginBottom: 16
        }]}> 
          {t.fillGroupDetails}
        </Text>

        {(() => {
          const inputConfigs = [
            { placeholder: t.signitoryGroupNumber, value: MmbaID, setter: setMmbaID },
            { placeholder: t.groupRegistrationNumber, value: ChmRegNo, setter: setChmRegNo },
            { placeholder: t.enterGroupName, value: ChmNm, setter: setChmNm },
            { placeholder: t.enterGroupEmail, value: awsEmail, setter: setAWSEmail },
            { placeholder: t.enterSignatory2Email, value: Sign2Phn, setter: setSign2Phn },
            { placeholder: t.enterSignatory3Email, value: Sign3Phn, setter: setSign3Phn },
            { placeholder: t.groupRegion, value: oprtnAreas, setter: setoprtnAreas },
            { placeholder: t.enterGroupVenture, value: ventures, setter: setventures },
            { placeholder: t.enterGroupDescription, value: ChmDesc, setter: setChmDesc, multiline: true },
            { placeholder: t.enterLoanApprovalThreshold, value: loanApprovalThreshHold, setter: handleMoneyInput(setloanApprovalThreshHold), onBlur: () => formatMoneyOnBlur(loanApprovalThreshHold, setloanApprovalThreshHold), keyboardType: 'decimal-pad' },
            { placeholder: t.signatorySubscriptionAmount, value: SubAmt, setter: handleMoneyInput(setSubAmt), onBlur: () => formatMoneyOnBlur(SubAmt, setSubAmt), keyboardType: 'decimal-pad' },
            { placeholder: t.signatorySubscriptionFrequency, value: SubFreq, setter: setSubFreq, keyboardType: 'numeric' },
            { placeholder: t.signatoryLateSubscriptionPenalty, value: lateSub, setter: handleMoneyInput(setlateSub), onBlur: () => formatMoneyOnBlur(lateSub, setlateSub), keyboardType: 'decimal-pad' },
            { placeholder: t.enterGroupPassword, value: pword, setter: setPW, secureTextEntry: true }
          ];
          return inputConfigs.map((item, index) => {
            if (item.secureTextEntry) {
              return (
                <View key={index} style={[styles.sendLoanView, { position: 'relative' }]}> 
                  <TextInput placeholder={item.placeholder} value={item.value} onChangeText={item.setter} style={styles.sendLoanInput} secureTextEntry={!showPassword} editable />
                  <TouchableOpacity style={{ position: 'absolute', right: 12, top: 12 }} onPress={() => setShowPassword(!showPassword)}>
                    <Text style={{ color: '#e58d29', fontWeight: 'bold' }}>
                      {showPassword ? 'Hide' : t.show}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            }
            return (
              <View key={index} style={styles.sendLoanView}>
                <TextInput 
                  placeholder={item.placeholder} 
                  value={item.value} 
                  onChangeText={item.setter} 
                  onBlur={item.onBlur} 
                  style={item.multiline ? styles.sendAmtInputDesc : styles.sendLoanInput} 
                  multiline={item.multiline || false} 
                  editable 
                  keyboardType={item.keyboardType || 'default'} 
                />
              </View>
            );
          });
        })()}

        {/* Chair Signature Upload */}
        <View style={styles.sendLoanView}>
          <TouchableOpacity onPress={() => pickSignature('chair')} style={styles.sendLoanButton}>
            <Text style={styles.sendLoanButtonText}>
              {chairSignUri ? t.changeChairSignature : t.uploadChairSignature}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => takeSignature('chair')} style={[styles.sendLoanButton, {
            marginTop: 10
          }]}>
            <Text style={styles.sendLoanButtonText}>{t.takeChairSignaturePhoto}</Text>
          </TouchableOpacity>
          {chairSignUri && <View style={styles.previewContainer}>
              <Image source={{
              uri: chairSignUri
            }} style={styles.previewImage} />
              <TouchableOpacity onPress={() => clearSignature('chair')} style={styles.removeButton}>
                <Text style={styles.removeButtonText}>{t.removeChairSignature}</Text>
              </TouchableOpacity>
            </View>}
        </View>

        {/* Secretary Signature Upload */}
        <View style={styles.sendLoanView}>
          <TouchableOpacity onPress={() => pickSignature('sec')} style={styles.sendLoanButton}>
            <Text style={styles.sendLoanButtonText}>
              {secSignUri ? t.changeSecretarySignature : t.uploadSecretarySignature}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => takeSignature('sec')} style={[styles.sendLoanButton, {
            marginTop: 10
          }]}>
            <Text style={styles.sendLoanButtonText}>{t.takeSecretarySignaturePhoto}</Text>
          </TouchableOpacity>
          {secSignUri && <View style={styles.previewContainer}>
              <Image source={{
              uri: secSignUri
            }} style={styles.previewImage} />
              <TouchableOpacity onPress={() => clearSignature('sec')} style={styles.removeButton}>
                <Text style={styles.removeButtonText}>{t.removeSecretarySignature}</Text>
              </TouchableOpacity>
            </View>}
        </View>

        {/* Submit Button */}
        <TouchableOpacity onPress={handleCreateChama} style={styles.sendLoanButton}>
          <Text style={styles.sendLoanButtonText}>{t.clickToCreateGroup}</Text>
          {isLoading && <ActivityIndicator size="large" color="blue" style={{
            marginTop: 8
          }} />}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  </LinearGradient>;
};
export default CreateChama;
const {
  width
} = Dimensions.get('window');
const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white'
  },
  sendLoanView: {
    marginVertical: 8
  },
  scroll: {
    padding: 20,
    paddingBottom: 120 // just enough for button + keyboard
  },
  sendLoanInput: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333'
  },
  sendAmtInputDesc: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 60,
    textAlignVertical: 'top'
  },
  sendLoanButton: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
    width: width * 0.9,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    justifyContent: 'center'
  },
  sendLoanButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e58d29'
  },
  image: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20
  },
  loanTitleView: {
    marginBottom: 16
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 12,
    color: '#e58d29',
    fontWeight: 'bold'
  },
  // Signature preview styles
  previewContainer: {
    marginTop: 16,
    alignItems: 'center'
  },
  previewImage: {
    width: 200,
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    resizeMode: 'contain'
  },
  removeButton: {
    marginTop: 10,
    backgroundColor: '#e58d29',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#e58d29',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3
    }
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700'
  }
});