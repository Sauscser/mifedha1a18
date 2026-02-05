import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import styles from './styles';
import { formatAmountSync } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';

export interface SMAccount {
  SMAc: {
    id: string,
    SenderName: string,
    recPhn: string,
    RecName: string,
    amount: number,
    description: string,
    status: string,
    createdAt: string,
    updatedAt: string,
    nationality?: string,
  }
}

const SMNonLnSnt = (props: SMAccount) => {
  const {
    SMAc: {
      id,
      recPhn,
      RecName,
      SenderName,
      amount,
      description,
      status,
      createdAt,
      updatedAt,
      nationality,
    }
  } = props;

  const navigation = useNavigation();
  const SndChmMmbrMny = () => {
    navigation.navigate('SendNonLonsRev', { id });
  };

  const code = nationalityToCode(nationality);

  return (
    <View style={styles.pageContainer}>
      <Pressable onPress={SndChmMmbrMny} style={styles.card}>
        <Text style={styles.prodName}>
          {/*loaner details */}
          {RecName}
        </Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>Transaction ID:</Text> {id}</Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>Amount:</Text> {formatAmountSync(amount, code)}</Text>
        <Text style={styles.prodInfo}><Text style={styles.label}>Created At:</Text> {createdAt}</Text>
      </Pressable>
    </View>
  );
};


export default SMNonLnSnt