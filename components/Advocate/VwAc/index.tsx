
import React from 'react';
import { View, Text } from 'react-native';
import styles from './styles';
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import { formatAmountSync } from '../../../src/utils/exchange';

export interface SMAccount {
    SMAc: {
        advregnu: string,
        TtlEarnings: number,
        advBal: number,
        createdAt: string,
        updatedAt: string,
    }
}

const ViewSMDeposts = (props: SMAccount) => {
    const {
        SMAc: { TtlEarnings, advBal, createdAt, updatedAt },
    } = props;
    const { nationality, ratesMap } = useExchange();
    const natCode = nationalityToCode(nationality);

    return (
        <View style={styles.pageContainer}>
            <View style={styles.card}>
                <Text style={styles.prodInfo}>
                    <Text style={styles.label}>Total Earnings:</Text>{' '}
                    {formatAmountSync(TtlEarnings, natCode, ratesMap)}
                </Text>
                <Text style={styles.prodInfo}>
                    <Text style={styles.label}>Account Balance:</Text>{' '}
                    {formatAmountSync(advBal, natCode, ratesMap)}
                </Text>
            </View>
        </View>
    );
};

export default ViewSMDeposts