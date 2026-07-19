import React from 'react';
import { SafeAreaView, ScrollView, View, Text, Pressable } from 'react-native';
import styles from './styles';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import translations from './translation';

const Section = ({
  title,
  options
}) => {
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  return (
    <View style={styles.clientsView}>
      <Text style={styles.salesText}>{t[title] || title}</Text>
      <View style={styles.viewForClientsAndTitle}>
        {options.map(({ label, onPress, style }, index) => (
          <Pressable key={index} onPress={onPress} style={style || styles.viewForClientsPressables}>
            <LinearGradient colors={['#FF8C00', '#00BFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.clientsPressableGradient}>
              <Text style={styles.salesPressableText}>{t[label] || label}</Text>
            </LinearGradient>
          </Pressable>
        ))}
      </View>
    </View>
  );
};
const MyLoanAccount = () => {
  const navigation = useNavigation<any>();
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const VwPal2BizLners = () => {
    navigation.navigate('VwPal2BizLners');
  };
  const SI2VwBiz2PalLoanees = () => {
    navigation.navigate('VwBiz2PalLnees');
  };
  const SI2VwBiz2BizLoaners = () => {
    navigation.navigate('VwBizLners');
  };
  const SI2VwBiz2BizLoanees = () => {
    navigation.navigate('VwBizLnees');
  };
  const SI2VwBiz2PalLoaners = () => {
    navigation.navigate('VwBiz2PalLners');
  };
  const CrtBusinessss = () => {
    navigation.navigate('CrtBusinesss');
  };
  const SgnIn2VwBiznasss = () => {
    navigation.navigate('SgnIn2VwBiznass');
  };
  const ShareCredSlsRevsss = () => {
    navigation.navigate('ShareCredSlsRevss');
  };
  const AddPersonelss = () => {
    navigation.navigate('AddPersonels');
  };
  const RmvPersonnelsss = () => {
    navigation.navigate('RmvPersonnelss');
  };
  const VwSlsAds2Remove = () => {
    navigation.navigate('VwSlsAds2Remove');
  };
  const SgnIn2VwRevenueShare = () => {
    navigation.navigate('SgnIn2VwRevenueShare');
  };
  const PayCash = () => {
    navigation.navigate('PayCash');
  };
  const VwPalLners = () => {
    navigation.navigate('VwPalLners');
  };
  const VwCashPaySent = () => {
    navigation.navigate('VwCashPaySent');
  };
  const MakeNVwPayPalDpsits = () => {
    navigation.navigate('MakeBizDpsts');
  };
  const VwPal2BizLnees = () => {
    navigation.navigate('VwPal2BizLnees');
  };
  const VwPalLnees = () => {
    navigation.navigate('VwPalLnees');
  };
  const Vw2GrntPal2Biz = () => {
    navigation.navigate("Vw2GrntPal2Biz");
  };
  const VwBiz2AddItem = () => {
    navigation.navigate('VwBiz2AddItem');
  };
  const Vw2GrntPal2Pal = () => {
    navigation.navigate('Vw2GrntPal2Pal');
  };
  const PersonelVw2GrntB2P = () => {
    navigation.navigate('PersonelVw2GrntB2P');
  };
  const PersonelVw2GrntB2B = () => {
    navigation.navigate('PersonelVw2GrntB2B');
  };
  const giveBizna = () => {
    navigation.navigate('giveBizna');
  };
  const TakeOverBizna = () => {
    navigation.navigate('TakeOverBizna');
  };
  const AddBeneficiaryProduct = () => {
    navigation.navigate('AddBeneficiaryProduct');
  };
  const UpdateBizAc = () => {
    navigation.navigate('UpdateBizAc');
  };
  const ViewBenProds = () => {
    navigation.navigate('ViewBenProds');
  };
  const BoostPooledBen = () => {
    navigation.navigate('BoostPooledBen');
  };
  const Benefits = () => {
    navigation.navigate('Benefits');
  };
  const ShareCredSlsRevss = () => {
    navigation.navigate('ShareCredSlsRevss');
  };
  const ViewBiznaShareRec = () => {
    navigation.navigate('ViewBiznaShareRec');
  };
  const ViewBiznaShareSent = () => {
    navigation.navigate('ViewBiznaShareSent');
  };
  const ViewBiznaShareSent2Pal = () => {
    navigation.navigate('ViewBiznaShareSent2Pal');
  };
  const ShareCredSlsRev2Biz = () => {
    navigation.navigate('ShareCredSlsRev2Biz');
  };
  const ViewBiznaShareRecBiz = () => {
    navigation.navigate('ViewBiznaShareRecBiz');
  };
  const ShareCredSlsRev2Grp = () => {
    navigation.navigate('ShareCredSlsRev2Grp');
  };
  const ViewAsProdCreator = () => {
    navigation.navigate('ViewAsProdCreator');
  };
  const VwBizDpsts = () => {
    navigation.navigate('VwBizDpsts');
  };
  const BiznaReqstPage1 = () => {
    navigation.navigate('BiznaReqstPage1');
  };
  const ViewBenShares = () => {
    navigation.navigate('ViewBenShares');
  };
  const VwBenToShare = () => {
    navigation.navigate('VwBenToShare');
  };
  const OpenSellerPartialPayRecords = () => {
    navigation.navigate('SellerPartialPayRecords');
  };
  const OpenCascadePayments = () => {
    navigation.navigate('CascadePaymentsScreen');
  };
  return <SafeAreaView>
      <ScrollView>
      <LinearGradient colors={['#FF8C00', 'skyblue', 'white']} // Linear gradient for orange hues
      start={{
        x: 0,
        y: 0
      }} // Gradient starts from the top left (vertical direction)
      end={{
        x: 1,
        y: 1
      }} style={styles.clientsPressableGradient}>
          
            
             <Section title="Cascade Payments" options={[{
              label: 'Cascade Payments',
              onPress: OpenCascadePayments,
              style: styles.viewForClientsPressables
            }]} />
            <Section title="bizProducts" options={[{
              label: 'benefitProductCreate',
              onPress: AddBeneficiaryProduct,
              style: styles.viewForClientsPressables
            }, {
              label: 'viewBusinessBenefitsShared',
              onPress: ViewBenShares,
              style: styles.viewForClientsPressables
            }, {
              label: 'shareBusinessBenefits',
              onPress: VwBenToShare,
              style: styles.viewForClientsPressables
            }, {
              label: 'linkBeneficiary',
              onPress: ViewBenProds,
              style: styles.viewForClientsPressables
            }, {
              label: 'boostPooledBenefits',
              onPress: BoostPooledBen,
              style: styles.viewForClientsPressables
            }, {
              label: 'viewAsProductCreator',
              onPress: ViewAsProdCreator,
              style: styles.viewForClientsPressables
            }]} />
            <Section title="manageBusiness" options={[{
              label: 'createBizInstitution',
              onPress: CrtBusinessss,
              style: styles.viewForClientsPressables
            }, {
              label: 'cascadePayments',
              onPress: OpenCascadePayments,
              style: styles.viewForClientsPressables
            }, {
              label: 'addItem',
              onPress: VwBiz2AddItem,
              style: styles.viewForClientsPressables
            }, {
              label: 'deleteSalesItem',
              onPress: VwSlsAds2Remove,
              style: styles.viewForClientsPressables
            }, {
              label: 'updateBiz',
              onPress: UpdateBizAc,
              style: styles.viewForClientsPressables
            }, {
              label: 'registerSalesOfficer',
              onPress: AddPersonelss,
              style: styles.viewForClientsPressables
            }, {
              label: 'deregSalesOfficer',
              onPress: RmvPersonnelsss,
              style: styles.viewForClientsPressables
            }, {
              label: 'viewAccount',
              onPress: SgnIn2VwBiznasss,
              style: styles.viewForClientsPressables
            }]} />
            <Section title="makeCreditSalesRequests" options={[{
              label: 'makeCreditSalesRequests',
              onPress: BiznaReqstPage1
            }]} />
            <Section title="grantCreditSalesRequests" options={[{
              label: 'pal2pal',
              onPress: Vw2GrntPal2Pal
            }, {
              label: 'pal2biz',
              onPress: Vw2GrntPal2Biz
            }, {
              label: 'biz2pal',
              onPress: PersonelVw2GrntB2P
            }, {
              label: 'biz2biz',
              onPress: PersonelVw2GrntB2B
            }]} />
            <Section title="creditSalesLoanStatusBiz" options={[{
              label: 'bizpalLoaners',
              onPress: SI2VwBiz2PalLoaners
            }, {
              label: 'bizpalLoanees',
              onPress: SI2VwBiz2PalLoanees
            }, {
              label: 'bizbizLoaners',
              onPress: SI2VwBiz2BizLoaners
            }, {
              label: 'bizbizLoanees',
              onPress: SI2VwBiz2BizLoanees
            }]} />
            <Section title="creditSalesLoanStatusPal" options={[{
              label: 'palpalLoaners',
              onPress: VwPalLners
            }, {
              label: 'palpalLoanees',
              onPress: VwPalLnees
            }, {
              label: 'palbizLoaners',
              onPress: VwPal2BizLners
            }, {
              label: 'palbizLoanees',
              onPress: VwPal2BizLnees
            }]} />
            <Section title="cashSalesPurchasesDeposits" options={[{
              label: 'cashSales',
              onPress: PayCash,
              style: styles.viewForClientsPressables
            }, {
              label: 'sellerPartialPayRecords',
              onPress: OpenSellerPartialPayRecords,
              style: styles.viewForClientsPressables
            }, {
              label: 'makeDeposits',
              onPress: MakeNVwPayPalDpsits,
              style: styles.viewForClientsPressables
            }, {
              label: 'viewDeposits',
              onPress: VwBizDpsts,
              style: styles.viewForClientsPressables
            }]} />
            <Section title="businessCashTransfers" options={[{
              label: 'sendCashToPal',
              onPress: ShareCredSlsRevss,
              style: styles.viewForClientsPressables
            }, {
              label: 'sendCashToBiz',
              onPress: ShareCredSlsRev2Biz,
              style: styles.viewForClientsPressables
            }, {
              label: 'viewCashSentToPal',
              onPress: ViewBiznaShareSent2Pal,
              style: styles.viewForClientsPressables
            }, {
              label: 'viewCashReceivedFromBiz',
              onPress: ViewBiznaShareRecBiz,
              style: styles.viewForClientsPressables
            }, {
              label: 'viewCashSentToBiz',
              onPress: ViewBiznaShareSent,
              style: styles.viewForClientsPressables
            }]} />
            <Section title="bizAdverts" options={[{
              label: 'transferOwnership',
              onPress: giveBizna,
              style: styles.viewForClientsPressables
            }, {
              label: 'receiveOwnership',
              onPress: TakeOverBizna,
              style: styles.viewForClientsPressables
            }]} />


      </LinearGradient>
      </ScrollView>
      
    </SafeAreaView>;
};
export default MyLoanAccount;