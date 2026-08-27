import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, SafeAreaView, ScrollView } from 'react-native';
import styles from './styles';
import { useTranslation } from 'react-i18next';
import translations from './translation';
import { safeNavigateFrom } from '../../../src/utils/navigationHelper';

const MyLoanAccount = props => {
  const navigation = useNavigation();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const [id, setID] = useState("");
  const [ChamaNMember, setChamaNMember] = useState("");
  const ItemAds = () => {
    navigation.navigate('ItemAds');
  };
  const VwPal2BizLners = () => {
    safeNavigateFrom(navigation, 'VwPal2BizLners');
  };
  const SI2VwBiz2PalLoanees = () => {
    safeNavigateFrom(navigation, 'SI2VwBiz2PalLoanees');
  };
  const SI2VwBiz2BizLoaners = () => {
    safeNavigateFrom(navigation, 'SI2VwBiz2BizLoaners');
  };
  const SI2VwBiz2BizLoanees = () => {
    safeNavigateFrom(navigation, 'SI2VwBiz2BizLoanees');
  };
  const SI2VwBiz2PalLoaners = () => {
    safeNavigateFrom(navigation, 'SI2VwBiz2PalLoaners');
  };
  const CrtBusinessss = () => {
    safeNavigateFrom(navigation, 'CrtBusinesss');
  };
  const DissolveBizsss = () => {
    safeNavigateFrom(navigation, 'DissolveBizss');
  };
  const SgnIn2VwBiznasss = () => {
    safeNavigateFrom(navigation, 'SgnIn2VwBiznass');
  };
  const ShareCredSlsRevsss = () => {
    safeNavigateFrom(navigation, 'ShareCredSlsRevss');
  };
  const AddPersonelss = () => {
    safeNavigateFrom(navigation, 'AddPersonels');
  };
  const RmvPersonnelsss = () => {
    safeNavigateFrom(navigation, 'RmvPersonnelss');
  };
  const SgnIn2RemoveSlAd = () => {
    safeNavigateFrom(navigation, 'SgnIn2RemoveSlAd');
  };
  const ViewBiznaShareRec = () => {
    safeNavigateFrom(navigation, 'ViewBiznaShareRec');
  };
  const SgnIn2VwRevenueShare = () => {
    safeNavigateFrom(navigation, 'SgnIn2VwRevenueShare');
  };
  const PayCash = () => {
    safeNavigateFrom(navigation, 'P2BPayCash');
  };
  const ViewBiznaShareRecP2B = () => {
    safeNavigateFrom(navigation, 'ViewBiznaShareRecP2B');
  };
  const ViewBiznaShareSentP2B = () => {
    safeNavigateFrom(navigation, 'ViewBiznaShareSentP2B');
  };
  const ViewBiznaShareRecB2P = () => {
    safeNavigateFrom(navigation, 'ViewBiznaShareRecB2P');
  };
  const ViewBiznaShareSentB2P = () => {
    safeNavigateFrom(navigation, 'ViewBiznaShareSentB2P');
  };
  const ViewBiznaShareRecB2B = () => {
    safeNavigateFrom(navigation, 'ViewBiznaShareRecB2B');
  };
  const ViewBiznaShareSentB2B = () => {
    safeNavigateFrom(navigation, 'ViewBiznaShareSentB2B');
  };
  const P2BPayCash = () => {
    safeNavigateFrom(navigation, 'PayCash3');
  };
  const PersonelVw2GrntB2P = () => {
    safeNavigateFrom(navigation, 'PersonelVw2GrntB2P');
  };
  const B2PPayCashVw2Grant = () => {
    safeNavigateFrom(navigation, 'B2PPayCashVw2Grant');
  };
  const B2BPayCashVw2Grant = () => {
    safeNavigateFrom(navigation, 'B2BPayCashVw2Grant');
  };
  const B2PPayCashReq = () => {
    safeNavigateFrom(navigation, 'B2PPayCashReq');
  };
  const B2BPayCashReq = () => {
    safeNavigateFrom(navigation, 'B2BPayCashReq');
  };
  return <SafeAreaView style={{
    height: "100%"
  }}>
    
 



            <View style={styles.clientsView}>
              <Text style={styles.salesText}>{t.requestCashTransfer}</Text>

              <View style={styles.viewForClientsAndTitle}>
              <View style={styles.viewForClientsCategories7}>
                  
                  <Pressable onPress={B2BPayCashReq} style={styles.viewForClientsPressables}>
                  <Text style={styles.salesPressableText}>{t.biz2biz}</Text>
                  </Pressable>
                </View>

            

                <View style={styles.viewForClientsCategories7}>
                  
                  <Pressable onPress={B2PPayCashReq} style={styles.viewForClientsPressables}>
                  <Text style={styles.salesPressableText}>{t.biz2pal}</Text>

                  </Pressable>
                </View>

               
              </View>
            </View>

            <View style={styles.clientsView}>
              <Text style={styles.salesText}>{t.grantingCashTransfers}</Text>

              <View style={styles.viewForClientsAndTitle}>
              <View style={styles.viewForClientsCategories7}>
                  
                  <Pressable onPress={B2BPayCashVw2Grant} style={styles.viewForClientsPressables}>
                  <Text style={styles.salesPressableText}>{t.biz2biz}</Text>
                  </Pressable>
                </View>

            

                <View style={styles.viewForClientsCategories7}>
                  
                  <Pressable onPress={B2PPayCashVw2Grant} style={styles.viewForClientsPressables}>
                  <Text style={styles.salesPressableText}>{t.biz2pal}</Text>

                  </Pressable>
                </View>

                <View style={styles.viewForClientsCategories7}>
                <Pressable onPress={P2BPayCash} style={styles.viewForClientsPressables}>
                  <Text style={styles.salesPressableText}>{t.pal2biz}</Text>

                  </Pressable>
                </View>

              </View>
            </View>

            <View style={styles.clientsView}>
              <Text style={styles.salesText}>{t.viewCashSent}</Text>

              <View style={styles.viewForClientsAndTitle}>
              <View style={styles.viewForClientsCategories}>
                  <Text style={styles.salesPressableText}>{t.biz2biz}</Text>

                  <View style={styles.viewForClientsPressables}>
                    <Pressable onPress={ViewBiznaShareSentB2B} style={styles.ClientsPressables}>
                      <Text style={styles.clientsPressableText}>{t.sent}</Text>
                    </Pressable>

                    <Pressable onPress={ViewBiznaShareRecB2B} style={styles.ClientsPressables}>
                      <Text style={styles.clientsPressableText}>
                        {t.received}
                      </Text>
                    </Pressable>
                  </View>
                </View>

            

                <View style={styles.viewForClientsCategories}>
                  <Text style={styles.salesPressableText}>{t.biz2pal}</Text>

                  <View style={styles.viewForClientsPressables}>
                    <Pressable onPress={ViewBiznaShareSentB2P} style={styles.ClientsPressables}>
                      <Text style={styles.clientsPressableText}>{t.sent}</Text>
                    </Pressable>

                    <Pressable onPress={ViewBiznaShareRecB2P} style={styles.ClientsPressables}>
                      <Text style={styles.clientsPressableText}>
                       {t.received}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.viewForClientsCategories}>
                  <Text style={styles.salesPressableText}>{t.pal2biz}</Text>

                  <View style={styles.viewForClientsPressables}>
                    <Pressable onPress={ViewBiznaShareSentP2B} style={styles.ClientsPressables}>
                      <Text style={styles.clientsPressableText}>{t.sent}</Text>
                    </Pressable>

                    <Pressable onPress={ViewBiznaShareRecP2B} style={styles.ClientsPressables}>
                      <Text style={styles.clientsPressableText}>
                      {t.received}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>

  
    </SafeAreaView>;
};
export default MyLoanAccount;