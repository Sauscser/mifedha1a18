import React, { useState, useRef, useEffect } from 'react';
import { ShoppingModeProvider, useShoppingMode } from '../../ShoppingModeContext';
import { View, Text, Pressable, FlatList, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { translations } from './translation';
import LnerStts from "../../../components/Transport/PurchaseDtls";
import styles from './styles';
import { useRoute } from '@react-navigation/core';
import { listGroups, listNonLoans, listSokoAds, VwMySntMny, listBiznas } from '../../../src/graphql/queries';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
const client = generateClient();
const FetchSMCovLnsInner = props => {
  const { mode: contextMode, setMode, selectedBizna: contextBizna, setSelectedBizna } = useShoppingMode();
  const route = useRoute();
  // Prefer navigation params if present, else context
  const params = (route as any).params || {};
  const [mode, setModeState] = useState(params.mode ? params.mode : contextMode);
  const [selectedBizna, setSelectedBiznaState] = useState(params.selectedBizna ? params.selectedBizna : contextBizna);
  const [showModeModal, setShowModeModal] = useState(!params.mode && !contextMode);
  const [showBiznaModal, setShowBiznaModal] = useState(false);
  const [biznas, setBiznas] = useState<any[]>([]);
  const [loadingBiznas, setLoadingBiznas] = useState(false);
  const [LneePhn, setLneePhn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [Loanees, setLoanees] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);
  // i18n translation
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;

  // Fetch businesses where user is admin
  const fetchUserEmailAndBiznas = async () => {
    setLoadingBiznas(true);
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const email = attributes.email;
      const res: any = await client.graphql({ query: listBiznas });
      const allBiznas = res.data.listBiznas.items || [];
      const filtered = allBiznas.filter((biz: any) => {
        for (let i = 1; i <= 50; ++i) {
          const adminVal = biz[`Admin${i}`];
          if (adminVal && adminVal !== 'None') {
            if (adminVal.toLowerCase().trim() === email.toLowerCase().trim()) return true;
          }
        }
        return false;
      });
      setBiznas(filtered);
    } catch (err) {
      setBiznas([]);
    }
    setLoadingBiznas(false);
  };

  // Handle mode selection
  const handleSelectMode = (selectedMode: 'B2C' | 'B2B') => {
    setModeState(selectedMode);
    setMode(selectedMode);
    setShowModeModal(false);
    if (selectedMode === 'B2B') {
      setShowBiznaModal(true);
      fetchUserEmailAndBiznas();
    }
  };

  // Handle business selection
  const handleSelectBizna = (bizna: any) => {
    setSelectedBiznaState(bizna);
    setSelectedBizna(bizna);
    setShowBiznaModal(false);
  };

  // If mode is not set, show mode modal
  useEffect(() => {
    if (!mode) setShowModeModal(true);
    else setShowModeModal(false);
  }, [mode]);

  // If B2B and no business selected, show business modal
  useEffect(() => {
    if (mode === 'B2B' && !selectedBizna) {
      setShowBiznaModal(true);
      fetchUserEmailAndBiznas();
    } else {
      setShowBiznaModal(false);
    }
    // eslint-disable-next-line
  }, [mode, selectedBizna]);

  // Only fetch purchases if mode and (if B2B) business are set
  useEffect(() => {
    if (!mode) return;
    if (mode === 'B2B' && !selectedBizna) return;
    fetchLoanees();
    // eslint-disable-next-line
  }, [mode, selectedBizna]);

  const fetchLoanees = async () => {
    const userInfo = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    setLoading(true);
    try {
      let senderPhn, status;
      if (mode === 'B2B' && selectedBizna && selectedBizna.BusKntct) {
        senderPhn = selectedBizna.BusKntct;
        status = 'Biz2Biz';
      } else {
        senderPhn = attributes.email;
        status = 'Biz2Pal';
      }
      const Lonees: any = await client.graphql({
        query: VwMySntMny,
        variables: {
          senderPhn,
          sortDirection: 'DESC',
          limit: 100,
          filter: {
            status: {
              eq: status
            }
          }
        }
      });
      const items = Lonees?.data?.VwMySntMny?.items;
      setLoanees(items);
    } catch (e) {
      //
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  };

  return (
    <View style={styles.root}>
      {/* Mode selection modal */}
      {showModeModal && (
        <View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 999,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, alignItems: 'center', width: 300 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>Select Purchase Mode</Text>
            <Pressable style={{ marginVertical: 8, padding: 12, backgroundColor: '#e58d29', borderRadius: 8, width: 220, alignItems: 'center' }} onPress={() => handleSelectMode('B2C')}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Individual (B2C)</Text>
            </Pressable>
            <Pressable style={{ marginVertical: 8, padding: 12, backgroundColor: '#2a7be4', borderRadius: 8, width: 220, alignItems: 'center' }} onPress={() => handleSelectMode('B2B')}>
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Business (B2B)</Text>
            </Pressable>
          </View>
        </View>
      )}
      {/* Business selection modal */}
      {showBiznaModal && (
        <View style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 24, alignItems: 'center', width: 340, maxHeight: 420 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>Select Business</Text>
            {loadingBiznas ? (
              <Text>Loading...</Text>
            ) : (
              <>
                {biznas.length === 0 && (
                  <Text>No businesses found where you are an admin.</Text>
                )}
                <FlatList
                  style={{ width: '100%', maxHeight: 260 }}
                  data={biznas}
                  keyExtractor={item => item.BusKntct}
                  renderItem={({ item }) => (
                    <Pressable
                      style={{ marginVertical: 6, padding: 12, backgroundColor: '#e58d29', borderRadius: 8, alignItems: 'center' }}
                      onPress={() => handleSelectBizna(item)}
                    >
                      <Text style={{ color: 'white', fontWeight: 'bold' }}>{item.busName}</Text>
                      <Text style={{ color: '#fff', fontSize: 12 }}>{item.BusKntct}</Text>
                    </Pressable>
                  )}
                />
                <Pressable
                  style={{ marginTop: 16, padding: 12, backgroundColor: '#2a7be4', borderRadius: 8, alignItems: 'center' }}
                  onPress={() => {
                    setShowBiznaModal(false);
                    setModeState(undefined);
                    setMode(undefined);
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Back to Mode Selection</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      )}
      {/* Only show list if mode (and bizna if B2B) are set */}
      {(mode && (mode !== 'B2B' || (mode === 'B2B' && selectedBizna))) && (
        <FlatList
          style={{ width: '100%' }}
          data={Loanees}
          renderItem={({ item }) => <LnerStts SMAc={item} mode={mode} selectedBizna={selectedBizna} />}
          keyExtractor={(item, index) => index.toString()}
          onRefresh={fetchLoanees}
          refreshing={loading}
          showsVerticalScrollIndicator={false}
          ListHeaderComponentStyle={{ alignItems: 'center' }}
          ListHeaderComponent={() => <>
            <Text style={styles.label}>{t.viewTransportOffers}</Text>
            <Text style={styles.label}>{t.swipeToReload}</Text>
            {(!loading && hasFetched && (!Loanees || Loanees.length === 0)) && (
              <Text style={{ color: 'red', marginTop: 16, textAlign: 'center' }}>
                {mode === 'B2B' ?
                  'No business purchases found for transport.' :
                  'No individual purchases found for transport.'}
              </Text>
            )}
          </>}
        />
      )}
    </View>
  );
};
const FetchSMCovLns = (props) => (
  <ShoppingModeProvider>
    <FetchSMCovLnsInner {...props} />
  </ShoppingModeProvider>
);
export default FetchSMCovLns;