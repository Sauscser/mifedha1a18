import React, { useState, useEffect} from 'react';
import { View, Text, Pressable, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';

import styles from './styles';
import { generateClient } from 'aws-amplify/api';
import { remove } from 'aws-amplify/storage';
import { updateTransportRegister, deleteTransportRegister } from '../../../src/graphql/mutations';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';

import { formatAmountSync, convertForeignToKsh } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { getSMAccount } from '../../../src/graphql/queries';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { useTranslation } from 'react-i18next';
import { translations } from '../../../screens/Transport/VwTransportAccount/translation';

export interface SMAccount {
  SMAc: {
    id: string;
    transportRate: number;
    transportdesc: string;
    Earnings: number;
    orderCost: number;
    buyerContact: string;
    transportPhoto: string;
    deliveryDesc: string;
    deliveryCost: number;
    transportName: string;
    engagementStatus: string;
    chmAcNumber: string;
    bizType: string;
    transportkntct: string;
  };
}

const client = generateClient();

const ViewSMDeposts = ({ SMAc }: SMAccount) => {
  const {
    id,
    transportName,
    transportRate,
    transportdesc,
    deliveryCost,
    Earnings,
    chmAcNumber,
    orderCost,
    buyerContact,
    transportPhoto,
    deliveryDesc,
    engagementStatus,
    bizType,
    transportkntct,
  } = SMAc;

  const [isLoading, setIsLoading] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newRate, setNewRate] = useState(transportRate ? transportRate.toString() : '');
  const [localTransportRate, setLocalTransportRate] = useState(transportRate);
  const [isUpdatingRate, setIsUpdatingRate] = useState(false);
  const openRateModal = () => {
    setNewRate(transportRate ? transportRate.toString() : '');
    setModalVisible(true);
  };

  const closeRateModal = () => {
    setModalVisible(false);
  };

  const handleUpdateRate = async () => {
    if (!newRate || isNaN(Number(newRate))) {
      Alert.alert(t.invalidRate || 'Please enter a valid rate.');
      return;
    }
    setIsUpdatingRate(true);
    try {
      // Convert user input (foreign currency) to KES for backend
      const rateInKES = await convertForeignToKsh(Number(newRate), userCode);
      const updated = await client.graphql({
        query: updateTransportRegister,
        variables: {
          input: {
            id,
            transportRate: rateInKES,
          },
        },
      });
      if (updated && 'data' in updated && updated.data?.updateTransportRegister) {
        Alert.alert(t.rateUpdated || 'Transport rate updated.');
        // Update local state so UI reflects new rate immediately
        setLocalTransportRate(rateInKES);
        setModalVisible(false);
      }
    } catch (error) {
      console.warn('Error updating rate:', error);
      Alert.alert(t.failedToUpdateRate || 'Failed to update rate.');
    } finally {
      setIsUpdatingRate(false);
    }
  };

  const navigation = useNavigation();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;

  const ShareRev = () => {
    navigation.navigate("ShareTransportRevenue", { id });
  };

  const ViewTransportPaymentRec = () => {
    navigation.navigate("ViewTransportPaymentRec");
  };

  const ViewDeliveryPayments = () => {
    navigation.navigate("ViewDeliveryPayments");
  };

  const [Uzer, setUzer] = useState<string>(null);
  const [userNationality, setUserNationality] = useState<string>(null);
  const userCode = nationalityToCode(userNationality);
  const {ratesMap} = useExchange();
        
     
        
     
  useEffect(() => {
    const fetchUserData = async () => {
      const user = await fetchUserAttributes();
      setUzer(user.email);
      try {
        const userData = await client.graphql({
          query: getSMAccount,
          variables: { awsemail: user.email },
        });
        if (userData && 'data' in userData && userData.data?.getSMAccount) {
          setUserNationality(userData.data.getSMAccount.nationality);
          console.log('User Data:', userData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, [Uzer]);

  const fetchLocation = async () => {
    setIsLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t.permissionDenied);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      if (loc.coords.accuracy && loc.coords.accuracy > 30) {
        Alert.alert(
          t.lowGpsAccuracyTitle,
          t.lowGpsAccuracyMsg.replace('{accuracy}', Math.round(loc.coords.accuracy).toString())
        );
      }

      setLocation(coords);

      const updateOrdr: any = await client.graphql({
        query: updateTransportRegister,
        variables: {
          input: {
            id,
            latitude: coords.latitude,
            longitude: coords.longitude,
          },
        },
      });

      if (updateOrdr.data.updateTransportRegister) {
        Alert.alert(t.stageLocationReset);
      }
    } catch (error) {
      console.warn("Error fetching location:", error);
      Alert.alert(t.failedToGetLocation);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAc = async () => {
    setIsLoading2(true);
    try {
      const delAc: any = await client.graphql({
        query: deleteTransportRegister,
        variables: {
          input: {
            id,
          },
        },
      });

      await remove({ key: transportPhoto });

      if (delAc.data.deleteTransportRegister) {
        Alert.alert(t.accountDeleted);
      }
    } catch (error) {
      console.warn("Error deleting Account:", error);
      Alert.alert(t.failedToDeleteAccount);
    } finally {
      setIsLoading2(false);
    }
  };

  return (
    <View style={styles.pageContainer}>
      <Pressable style={styles.card}>
        <Text style={styles.prodInfo}>
          {t.transportInfo
            .replace('{name}', transportName)
            .replace('{rate}', formatAmountSync(localTransportRate, userCode, ratesMap))
            .replace('{earnings}', formatAmountSync(Earnings, userCode, ratesMap))
            .replace('{desc}', transportdesc)
          }
        </Text>
      </Pressable>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.loanFriendButton} onPress={openRateModal}>
          <Text style={{ color: 'white', fontSize: 12 }}>{t.changeTransportRate || 'Change Transport Rate'}</Text>
        </TouchableOpacity>
              <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeRateModal}
              >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                  <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' }}>
                    <Text style={{ fontSize: 16, marginBottom: 10 }}>{t.enterNewRate || 'Enter new transport rate:'}</Text>
                    <TextInput
                      value={newRate}
                      onChangeText={setNewRate}
                      keyboardType="numeric"
                      style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 8, marginBottom: 15, fontWeight: 'bold', color: '#222' }}
                      placeholder={
                        t.newRatePlaceholder
                          ? `${t.newRatePlaceholder} (${ratesMap && userCode && ratesMap[userCode]?.symbol ? ratesMap[userCode].symbol : 'Ksh'})`
                          : `New Rate (${ratesMap && userCode && ratesMap[userCode]?.symbol ? ratesMap[userCode].symbol : 'Ksh'})`
                      }
                      placeholderTextColor="#444"
                    />
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                      <TouchableOpacity onPress={closeRateModal} style={{ marginRight: 15 }}>
                        <Text style={{ color: '#e58d29', fontWeight: 'bold' }}>{t.cancel || 'Cancel'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleUpdateRate} disabled={isUpdatingRate}>
                        <Text style={{ color: '#e58d29', fontWeight: 'bold' }}>{isUpdatingRate ? (t.processing || 'Processing...') : (t.update || 'Update')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
        <TouchableOpacity
          onPress={fetchLocation}
          style={[
            styles.loanFriendButton,
            {
              backgroundColor: '#e58d29',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isLoading ? 0.7 : 1,
            },
          ]}
          disabled={isLoading}
        >
          {isLoading && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />}
          <Text style={{ color: 'white', fontSize: 12 }}>
            {isLoading ? t.processing : t.resetStageLocation}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={deleteAc}
          style={[
            styles.loanFriendButton,
            {
              backgroundColor: '#e58d29',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isLoading2 ? 0.7 : 1,
            },
          ]}
          disabled={isLoading2}
        >
          {isLoading2 && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />}
          <Text style={{ color: 'white', fontSize: 12 }}>
            {isLoading2 ? t.processing : t.deleteTransportAccount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loanFriendButton} onPress={ShareRev}>
          <Text style={{ color: 'white', fontSize: 12 }}>{t.shareRevenue}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loanFriendButton} onPress={ViewTransportPaymentRec}>
          <Text style={{ color: 'white', fontSize: 12 }}>{t.viewSharedRevenue}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loanFriendButton} onPress={ViewDeliveryPayments}>
          <Text style={{ color: 'white', fontSize: 12 }}>{t.viewDeliveryPayments}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ViewSMDeposts;
