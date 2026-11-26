import React from 'react';
import { View, Text } from 'react-native';
import styles from './styles';

export interface SMAccount {
  SMAc: {
    id: string;
    depositerid: string;
    agContact: string;
    amount: number | string;
    userName: string;
    agentName?: string;
    createdAt: string;
    updatedAt: string;
  };
}

const ViewSMDeposts = ({ SMAc }: SMAccount) => {
  const amount = Number(SMAc.amount);
  const formattedAmount = Number.isFinite(amount) ? amount.toFixed(2) : String(SMAc.amount ?? '—');
  const createdAt = SMAc.createdAt ? new Date(SMAc.createdAt).toLocaleString() : '—';

  return (
    <View style={styles.pageContainer}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.accent} />
          <Text style={styles.amount}>{formattedAmount}</Text>
          <Text style={styles.currency}>Amount</Text>
        </View>

        <View style={styles.details}>
          <Text style={styles.detailLabel}>Deposited by</Text>
          <Text style={styles.detailValue}>{SMAc.userName || '—'}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.detailLabel}>Depositer contact</Text>
          <Text style={styles.detailValue}>{SMAc.depositerid || '—'}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.detailLabel}>Transaction ID</Text>
          <Text style={styles.detailValue}>{SMAc.id || '—'}</Text>
        </View>
        <View style={[styles.details, styles.lastDetail]}>
          <Text style={styles.detailLabel}>Date and time</Text>
          <Text style={styles.detailValue}>{createdAt}</Text>
        </View>
      </View>
    </View>
  );
};

export default ViewSMDeposts;