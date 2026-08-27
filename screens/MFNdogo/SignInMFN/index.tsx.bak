/* import React, {useEffect, useState} from 'react';

import {createCompany} from '../../../src/graphql/mutations';
import { getAgent, getBankAdmin, getCompany, getSAgent} from '../../../src/graphql/queries';
import {graphqlOperation, API} from 'aws-amplify';

import {useNavigation} from '@react-navigation/native';


import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
 
} from 'react-native';
import styles from './styles';




const MFNSignIn = (props) => {  
  const navigation = useNavigation();

  const [town, settown] = useState("");
  



  const moveToMFNHm = () => {
    navigation.navigate("SearchMFNsssss", {town});
  
            settown("");
            
      
    
             }

             
  
                 useEffect(() =>{
                  const towns=town
                    if(!towns && towns!=="")
                    {
                      settown("");
                      return;
                    }
                    settown(towns);
                    }, [town]
                     );



         return (
            <View>
              <View
                 style={styles.image}>
                <ScrollView>
                  <View style={styles.loanTitleView}>
                    <Text style={styles.title}>Fill Details Below</Text>
                  </View>
        
                  <View style={styles.sendLoanView}>
                    <TextInput
                    
                      value={town}
                      onChangeText={settown}
                      style={styles.sendLoanInput}
                      editable={true}></TextInput>
                    <Text style={styles.sendLoanText}>Town</Text>
                    <Text style={styles.sendLoanText2}>(Enter part or full name)</Text>
                  </View>
        
                  
                  <TouchableOpacity
                    onPress={moveToMFNHm}
                    style={styles.sendLoanButton}>
                    <Text style={styles.sendLoanButtonText2}>
                      Find convenient MFNdogo
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          );
        };
        
        export default MFNSignIn;

        */
// GenralShpMpViewThree.js
import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, Text, useWindowDimensions, ActivityIndicator, TextInput } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { listAgents, getCompany, getSAgent } from '../../../src/graphql/queries';
import { getDistance } from 'geolib';
import CustomMarker from '../../../components/MFNdogo/CustomMarkr';
import Carousels from '../../../components/MFNdogo/MFNCarousel';
import { generateClient } from "aws-amplify/api";
const client = generateClient();
console.log('SMFDBG SignInMFN module loaded');
const INITIAL_RADIUS_KM = 0.1;
const MAX_RADIUS_KM = 1000;
const GenralShpMpViewThree = () => {
  console.log('SMFDBG SignInMFN render');
  const navigation = useNavigation<any>();
  const [userLocation, setUserLocation] = useState(null);
  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [selectedAgentPhone, setSelectedAgentPhone] = useState(null);
  const [radiusKmText, setRadiusKmText] = useState('0.1');
  const [errorMsg, setErrorMsg] = useState(null);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const mapRef = useRef(null);
  const carouselRef = useRef(null);
  const filteredAgentsRef = useRef([]);
  const isManualScroll = useRef(false);
  const {
    width
  } = useWindowDimensions();
  const CARD_WIDTH = width * 0.8 + 20;
  const parsedRadiusKm = Number(radiusKmText);
  const hasValidRadius = Number.isFinite(parsedRadiusKm) && parsedRadiusKm > 0;
  const effectiveRadiusKm = hasValidRadius ? Math.min(parsedRadiusKm, MAX_RADIUS_KM) : INITIAL_RADIUS_KM;

  // Convert radius in km to map delta
  const radiusToDelta = radius => Math.max(radius * 0.018, 0.01);
  useEffect(() => {
    (async () => {
      const {
        status
      } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    })();
  }, []);
  const fetchAgents = async () => {
    setLoadingAgents(true);
    try {
      const res = await client.graphql({
        query: listAgents
      });
      const baseAgents = (res as any)?.data?.listAgents?.items || [];
      const enrichedAgents = await Promise.all(baseAgents.map(async agent => {
        try {
          const sagentregno = agent.sagentregno;
          const [sAgentRes, companyRes] = await Promise.all([sagentregno ? client.graphql({
            query: getSAgent,
            variables: {
              saPhoneContact: sagentregno
            }
          }) : Promise.resolve({
            data: {
              getSAgent: {
                MFKWithdrwlFee: 0
              }
            }
          }), client.graphql({
            query: getCompany,
            variables: {
              AdminId: "BaruchHabaB'ShemAdonai2"
            }
          })]);
          const MFN = parseFloat(agent.MFNWithdrwlFee || 0);
          const MFK = parseFloat((sAgentRes as any)?.data?.getSAgent?.MFKWithdrwlFee || 0);
          const companyDisc = parseFloat((companyRes as any)?.data?.getCompany?.companyComDisc || 0);
          const totalDiscount = MFN + MFK + companyDisc;
          return {
            ...agent,
            totalDiscount
          };
        } catch (error) {
          console.warn(`Failed to enrich agent ${agent.phonecontact}:`, error);
          return {
            ...agent,
            totalDiscount: parseFloat(agent.MFNWithdrwlFee || 0)
          };
        }
      }));
      setAgents(enrichedAgents);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      setErrorMsg('Failed to load agents. Please try again later.');
    } finally {
      setLoadingAgents(false);
    }
  };
  useEffect(() => {
    fetchAgents();
  }, []);
  useEffect(() => {
    filteredAgentsRef.current = filteredAgents;
  }, [filteredAgents]);
  useEffect(() => {
    if (!userLocation || agents.length === 0) return;
    const filtered = agents.filter(agent => {
      if (!agent.latitude || !agent.longitude) return false;
      const distance = getDistance(userLocation, {
        latitude: parseFloat(agent.latitude),
        longitude: parseFloat(agent.longitude)
      });
      return !hasValidRadius || distance <= effectiveRadiusKm * 1000;
    });
    setFilteredAgents(filtered);
    if (!filtered.some(a => a.phonecontact === selectedAgentPhone)) {
      setSelectedAgentPhone(null);
    }
  }, [userLocation, hasValidRadius, effectiveRadiusKm, agents]);
  useEffect(() => {
    if (!mapRef.current) return;
    if (selectedAgentPhone) {
      const selected = filteredAgents.find(a => a.phonecontact === selectedAgentPhone);
      if (selected) {
        mapRef.current.animateToRegion({
          latitude: parseFloat(selected.latitude),
          longitude: parseFloat(selected.longitude),
          latitudeDelta: radiusToDelta(effectiveRadiusKm),
          longitudeDelta: radiusToDelta(effectiveRadiusKm)
        }, 1000);
        const index = filteredAgents.findIndex(a => a.phonecontact === selectedAgentPhone);
        if (index !== -1 && carouselRef.current) {
          setTimeout(() => {
            isManualScroll.current = true;
            const liveLength = filteredAgentsRef.current.length;
            if (liveLength > 0 && index < liveLength) {
              try {
                carouselRef.current?.scrollToIndex({
                  index,
                  animated: true,
                  viewOffset: (width - CARD_WIDTH) / 2
                });
              } catch (_) {}
            }
            setTimeout(() => isManualScroll.current = false, 500);
          }, 100);
        }
      }
    } else if (userLocation) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: radiusToDelta(effectiveRadiusKm),
        longitudeDelta: radiusToDelta(effectiveRadiusKm)
      }, 1000);
    }
  }, [selectedAgentPhone, effectiveRadiusKm, userLocation, filteredAgents]);
  const onViewChanged = useRef(({
    viewableItems
  }) => {
    if (!isManualScroll.current && viewableItems.length > 0) {
      const phone = viewableItems[0]?.item?.phonecontact;
      if (phone) setSelectedAgentPhone(phone);
    }
  });
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 70
  });
  useEffect(() => {
    console.log('SMFDBG SignInMFN mounted');
    return () => {
      console.log('SMFDBG SignInMFN unmounted');
    };
  }, []);
  if (!userLocation) {
    return <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    }}>
        {errorMsg ? <Text>{errorMsg}</Text> : <ActivityIndicator size="large" />}
      </View>;
  }
  return <View style={{
    flex: 1
  }}>
      <MapView ref={mapRef} style={{
      flex: 1
    }} provider={PROVIDER_GOOGLE} showsUserLocation initialRegion={{
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: radiusToDelta(effectiveRadiusKm),
      longitudeDelta: radiusToDelta(effectiveRadiusKm)
    }}>
        {filteredAgents.map(agent => <CustomMarker key={agent.phonecontact} coordinate={{
        latitude: parseFloat(agent.latitude),
        longitude: parseFloat(agent.longitude)
      }} totalDiscount={agent.totalDiscount || 0} onPress={() => setSelectedAgentPhone(agent.phonecontact)} isSelected={selectedAgentPhone === agent.phonecontact} />)}
      </MapView>

      <View style={{
      position: 'absolute',
      bottom: 30,
      width: '100%'
    }}>
        <FlatList ref={carouselRef} data={filteredAgents} keyExtractor={item => item.phonecontact} horizontal showsHorizontalScrollIndicator={false} snapToInterval={CARD_WIDTH} snapToAlignment="start" decelerationRate="fast" onViewableItemsChanged={onViewChanged.current} viewabilityConfig={viewabilityConfig.current} renderItem={({
        item
      }) => <Carousels Agent={item} isSelected={item.phonecontact === selectedAgentPhone} onPress={() => setSelectedAgentPhone(item.phonecontact)} onLongPress={() => navigation.navigate('WithdrawFundsFromMap', {
        phonecontact: item.phonecontact
      })} />} getItemLayout={(_, index) => ({
        length: CARD_WIDTH,
        offset: CARD_WIDTH * index,
        index
      })} onScrollToIndexFailed={info => {
        const liveLength = filteredAgentsRef.current.length;
        const safeIndex = Math.min(info.index, Math.max(liveLength - 1, 0));
        if (liveLength > 0 && safeIndex >= 0) {
          setTimeout(() => {
            try {
              carouselRef.current?.scrollToIndex({
                index: safeIndex,
                animated: true,
                viewOffset: (width - CARD_WIDTH) / 2
              });
            } catch (_) {}
          }, 120);
        }
      }} contentContainerStyle={{
        paddingHorizontal: (width - CARD_WIDTH) / 2
      }} />
      </View>

      {/* Radius Controls */}
      <View style={{
      position: 'absolute',
      top: 30,
      right: 20,
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderRadius: 10,
      padding: 10,
      width: 190,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2
      },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 5
    }}>
        <Text style={{
        marginBottom: 6,
        fontWeight: 'bold',
        color: '#222'
      }}>
          Radius (KM)
        </Text>
        <TextInput value={radiusKmText} onChangeText={setRadiusKmText} keyboardType="numeric" placeholder="e.g. 5" placeholderTextColor="#666" style={{
        borderWidth: 1,
        borderColor: '#d0d0d0',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontWeight: 'bold',
        color: '#222'
      }} />
        <Text style={{
        marginTop: 6,
        color: '#444',
        fontWeight: '600'
      }}>{filteredAgents.length} in range</Text>
      </View>
    </View>;
};
export default GenralShpMpViewThree;