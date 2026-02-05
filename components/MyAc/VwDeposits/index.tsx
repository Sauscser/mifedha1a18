import React from 'react';
import { View, Text } from 'react-native';
import styles from './styles';
import { formatAmountSync } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';

export interface SMAccount {
    SMAc: {
        id: string,
        depositerid: string,
        agContact: string,
        amount: number,
        agentName: string,
        createdAt: string,
        updatedAt: string,
        nationality?: string,
    }
}

const ViewSMDeposts = (props: SMAccount) => {
    const {
        SMAc: {
            id,
            depositerid,
            agContact,
            amount,
            agentName,
            createdAt,
            updatedAt,
            nationality,
        }
    } = props;

    const code = nationalityToCode(nationality);

    return (
        <View style={styles.pageContainer}>
            <View style={styles.card}>
                <Text style={styles.prodName}>
                    {/*loaner details */}
                    {agentName}
                </Text>
                <Text style={styles.prodInfo}><Text style={styles.label}>Transaction ID:</Text> {id}</Text>
                <Text style={styles.prodInfo}><Text style={styles.label}>Amount:</Text> {formatAmountSync(amount, code)}</Text>
                <Text style={styles.prodInfo}><Text style={styles.label}>MFNdogo Number:</Text> {agContact}</Text>
                <Text style={styles.prodInfo}><Text style={styles.label}>Created At:</Text> {createdAt}</Text>
            </View>
        </View>
    );
};

export default ViewSMDeposts