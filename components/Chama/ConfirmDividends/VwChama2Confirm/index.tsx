import { useNavigation } from '@react-navigation/core';
import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import styles from './styles';
import { translations } from './translation';
import { useTranslation } from 'react-i18next';
import { safeNavigateFrom } from '../../../../src/utils/navigationHelper';


export interface ChamaMmbrshpInfo {
  ChamaMmbrshpDtls: {
    
    groupContact: string;
   
    memberName: string;
    groupName: string;
   
  };
}

const ChmMbrShpInfo = (props: ChamaMmbrshpInfo) => {
  const {
    ChamaMmbrshpDtls: {

      groupContact,
      groupName,
     
      memberName,
     
    },
  } = props;

  

  const navigation = useNavigation();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const Vw2Confirm = () => safeNavigateFrom(navigation, 'ChamaRemts', { groupContact });
  return (
    <View style={styles.pageContainer}>
      <Pressable onPress={Vw2Confirm} style={styles.card}>
        <Text style={styles.prodName}>{memberName}</Text>
        <Text style={styles.prodInfo}>
          <Text style={styles.label}>{t.groupName}</Text> {groupName}
        </Text>
        <Text style={styles.prodInfo}>
          <Text style={styles.label}>{t.memberName}</Text> {memberName}
        </Text>
        <Text style={styles.prodInfo}>
          <Text style={styles.label}>{t.clickToProceed}</Text>
        </Text>
      </Pressable>
    </View>
  );
};

export default ChmMbrShpInfo;
