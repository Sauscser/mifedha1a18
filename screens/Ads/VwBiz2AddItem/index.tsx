import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ImageBackground, Pressable, FlatList, Alert } from 'react-native';
import { getSMAccount, listBiznas, listPersonels } from '../../../src/graphql/queries';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import LnerStts from "../../../components/Ads/VwBiz2AddItem";
import styles from './styles';
const client = generateClient();
const FetchSMCovLns = props => {
  const [loading, setLoading] = useState(false);
  const [Loanees, setLoanees] = useState([]);


  useEffect(() => {
    fetchUsrDtls();
  }, []);


  const fetchUsrDtls = async () => {
    if (loading) return;
    setLoading(true);
    const attrs = await fetchUserAttributes();
    try {
      const res: any = await client.graphql({
        query: listPersonels,
        variables: {
          filter: {
            phoneKontact: {
              eq: attrs.email
            }
          }
        }
      });
      const items = res.data.listPersonels.items;
      if (items.length === 0) {
        Alert.alert("No Businesses you work at.");
      } else {
        setLoanees(items);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to fetch businesses.");
    } finally {
      setLoading(false);
    }
  };
  
  return <View style={styles.root}>
      <FlatList style={{
      width: "100%"
    }} data={Loanees} renderItem={({
      item
    }) => <LnerStts Loanee={item} />} keyExtractor={(item, index) => index.toString()} onRefresh={fetchUsrDtls} refreshing={loading} showsVerticalScrollIndicator={false} ListHeaderComponentStyle={{
      alignItems: 'center'
    }} ListHeaderComponent={() => <>
            <Text style={styles.label}> Select Business to add item</Text>
            <Text style={styles.label2}> (Please swipe down to load)</Text>
          </>} />
    </View>;
};
export default FetchSMCovLns;