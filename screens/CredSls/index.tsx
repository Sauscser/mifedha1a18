import React from 'react';
import { SafeAreaView, ScrollView, View, Text, Pressable } from 'react-native';
import styles from './styles';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import translations from './translation';
import { safeNavigateFrom } from '../../src/utils/navigationHelper';


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
    safeNavigateFrom(navigation, 'VwPal2BizLners');
  };
  const SI2VwBiz2PalLoanees = () => {
    safeNavigateFrom(navigation, 'VwBiz2PalLnees');
  };
  const SI2VwBiz2BizLoaners = () => {
    safeNavigateFrom(navigation, 'VwBizLners');
  };
  const SI2VwBiz2BizLoanees = () => {
    safeNavigateFrom(navigation, 'VwBizLnees');
  };
  const SI2VwBiz2PalLoaners = () => {
    safeNavigateFrom(navigation, 'VwBiz2PalLners');
  };
  const CrtBusinessss = () => {
    safeNavigateFrom(navigation, 'CrtBusinesss');
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
  const VwSlsAds2Remove = () => {
    safeNavigateFrom(navigation, 'VwSlsAds2Remove');
  };
  const SgnIn2VwRevenueShare = () => {
    safeNavigateFrom(navigation, 'SgnIn2VwRevenueShare');
  };
  const PayCash = () => {
    safeNavigateFrom(navigation, 'PayCash');
  };
  const VwPalLners = () => {
    safeNavigateFrom(navigation, 'VwPalLners');
  };
  const VwCashPaySent = () => {
    safeNavigateFrom(navigation, 'VwCashPaySent');
  };
  const MakeNVwPayPalDpsits = () => {
    safeNavigateFrom(navigation, 'MakeBizDpsts');
  };
  const VwPal2BizLnees = () => {
    safeNavigateFrom(navigation, 'VwPal2BizLnees');
  };
  const VwPalLnees = () => {
    safeNavigateFrom(navigation, 'VwPalLnees');
  };
  const Vw2GrntPal2Biz = () => {
    safeNavigateFrom(navigation, 'Vw2GrntPal2Biz');
  };
  const VwBiz2AddItem = () => {
    safeNavigateFrom(navigation, 'VwBiz2AddItem');
  };
  const Vw2GrntPal2Pal = () => {
    safeNavigateFrom(navigation, 'Vw2GrntPal2Pal');
  };
  const PersonelVw2GrntB2P = () => {
    safeNavigateFrom(navigation, 'PersonelVw2GrntB2P');
  };
  const PersonelVw2GrntB2B = () => {
    safeNavigateFrom(navigation, 'PersonelVw2GrntB2B');
  };
  const giveBizna = () => {
    safeNavigateFrom(navigation, 'giveBizna');
  };
  const TakeOverBizna = () => {
    safeNavigateFrom(navigation, 'TakeOverBizna');
  };
  const AddBeneficiaryProduct = () => {
    safeNavigateFrom(navigation, 'AddBeneficiaryProduct');
  };
  const UpdateBizAc = () => {
    safeNavigateFrom(navigation, 'UpdateBizAc');
  };
  const ViewBenProds = () => {
    safeNavigateFrom(navigation, 'ViewBenProds');
  };
  const BoostPooledBen = () => {
    safeNavigateFrom(navigation, 'BoostPooledBen');
  };
  const Benefits = () => {
    safeNavigateFrom(navigation, 'Benefits');
  };
  const ShareCredSlsRevss = () => {
    safeNavigateFrom(navigation, 'ShareCredSlsRevss');
  };
  const ViewBiznaShareRec = () => {
    safeNavigateFrom(navigation, 'ViewBiznaShareRec');
  };
  const ViewBiznaShareSent = () => {
    safeNavigateFrom(navigation, 'ViewBiznaShareSent');
  };
  const ViewBiznaShareSent2Pal = () => {
    safeNavigateFrom(navigation, 'ViewBiznaShareSent2Pal');
  };
  const ShareCredSlsRev2Biz = () => {
    safeNavigateFrom(navigation, 'ShareCredSlsRev2Biz');
  };
  const ViewBiznaShareRecBiz = () => {
    safeNavigateFrom(navigation, 'ViewBiznaShareRecBiz');
  };
  const ShareCredSlsRev2Grp = () => {
    navigation.navigate('ShareCredSlsRev2Grp');
  };
  const ViewAsProdCreator = () => {
    safeNavigateFrom(navigation, 'ViewAsProdCreator');
  };
  const VwBizDpsts = () => {
    safeNavigateFrom(navigation, 'VwBizDpsts');
  };
  const BiznaReqstPage1 = () => {
    safeNavigateFrom(navigation, 'BiznaReqstPage1');
  };
  const ViewBenShares = () => {
    safeNavigateFrom(navigation, 'ViewBenShares');
  };
  const VwBenToShare = () => {
    safeNavigateFrom(navigation, 'VwBenToShare');
  };
  const OpenSellerPartialPayRecords = () => {
    safeNavigateFrom(navigation, 'SellerPartialPayRecords');
  };
  const OpenCascadePayments = () => {
    safeNavigateFrom(navigation, 'CascadePaymentsScreen');
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