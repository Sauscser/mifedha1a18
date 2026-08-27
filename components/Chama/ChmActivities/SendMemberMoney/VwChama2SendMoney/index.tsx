import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import styles from './styles';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import translations from './translation';
import { safeNavigateFrom } from '../../../../../src/utils/navigationHelper';


export interface ChamaRemitInfo {
  ChamaRemitDtls: {
    groupContact: string;
    groupName: string;
    ChamaNMember: string;
  }
}

const ChmRemitInfo = (props: ChamaRemitInfo) => {
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const {
    ChamaRemitDtls: { groupContact, ChamaNMember, groupName }
  } = props;

  const navigation = useNavigation();
  const FetchGrpLonsSts = () => {
    safeNavigateFrom(navigation, 'VwChamaMembers', { groupContact });
  };

  return (
    <Pressable onPress={FetchGrpLonsSts} style={styles.pageContainer}>
      <View style={styles.card}>
        <Text style={styles.prodInfo}><Text style={styles.label}>{t.groupName}: </Text>{groupName}</Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>{t.groupNumber}: </Text>{groupContact}</Text>
        <Text style={styles.prodDesc}>{t.clickToProceed}</Text>
      </View>
    </Pressable>
  );
};

export default ChmRemitInfo;