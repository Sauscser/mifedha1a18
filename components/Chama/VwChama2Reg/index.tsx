
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import styles from './styles';
import translations from './translation';
import { useTranslation } from 'react-i18next';


export interface SMAccount {
    SMAc: {
      id: string,
      bankAdminEmail: string,
      ChamaAcNu: string,

      createdAt:string

    }}

const SMCvLnStts = (props: SMAccount) => {
  const {
    SMAc: { id, bankAdminEmail, ChamaAcNu, createdAt }
  } = props;
  const navigation = useNavigation();
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const t = translations[lang] || translations.en;

  const VwChamaApplications = () => {
    navigation.navigate("CreateChms", {
      id,
      bankAdminEmail,
      ChamaAcNu,
    });
  };

  return (
    <View style={styles.pageContainer}>
      <View style={styles.card}>
        <Text style={styles.prodInfo}>
          <Text style={styles.label}>{t.groupAccount}</Text> {ChamaAcNu}
        </Text>
        <Text style={styles.prodInfo}>
          <Text style={styles.label}>{t.appliedOn}</Text> {createdAt}
        </Text>
      </View>
      <View style={styles.buttonRow}>
        <Pressable onPress={VwChamaApplications} style={styles.loanFriendButton}>
          <Text>{t.clickToProceed}</Text>
        </Pressable>
      </View>
    </View>
  );
};


export default SMCvLnStts;