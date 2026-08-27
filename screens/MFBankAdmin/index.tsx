import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, ImageBackground, Pressable, FlatList, SafeAreaView, ScrollView } from 'react-native';
import styles from './styles';
import { LinearGradient } from 'expo-linear-gradient';
import { safeNavigateFrom } from '../../src/utils/navigationHelper';

const Section = ({
  title,
  options
}) => <View style={styles.clientsView}>
    <Text style={styles.salesText}>{title}</Text>
    <View style={styles.viewForClientsAndTitle}>
      {options.map(({
      label,
      onPress,
      style
    }, index) => <Pressable key={index} onPress={onPress} style={style || styles.viewForClientsPressables}>
          <LinearGradient colors={['#FF8C00', '#00BFFF']} // Orange to Sky Blue gradient
      start={{
        x: 0,
        y: 0
      }} // Gradient starts from the top left (vertical direction)
      end={{
        x: 1,
        y: 1
      }} // Gradient ends at the bottom right (vertical and horizontal)
      style={styles.clientsPressableGradient}>
            <Text style={styles.salesPressableText}>{label}</Text>
          </LinearGradient>
        </Pressable>)}
    </View>
  </View>;
const RegKFKubwa = props => {
  const navigation = useNavigation();
  const goToBuyFloat = () => {
    safeNavigateFrom(navigation, 'BuyFloatBnkAdm');
  };
  const RegPwnBrkrss = () => {
    safeNavigateFrom(navigation, 'RegPwnBrkrs');
  };
  const AdjustUsrLimitsss = () => {
    safeNavigateFrom(navigation, 'AdjustUsrLimitss');
  };
  const DActvteMFAds = () => {
    safeNavigateFrom(navigation, 'DActvteMFAd');
  };
  const PwnBrkrRegss = () => {
    safeNavigateFrom(navigation, 'PwnBrkrRegss');
  };
  const ChamaRegss = () => {
    safeNavigateFrom(navigation, 'ChamaRegss');
  };
  const DActivateMFN = () => {
    safeNavigateFrom(navigation, 'DActvteMFN');
  };
  const ClearGroupMemberLoan = () => {
    safeNavigateFrom(navigation, 'ClearGroupMemberLoan');
  };
  const SyncGrpWithdrawals = () => {
    safeNavigateFrom(navigation, 'SyncGrpWithdrawals');
  };
  const ApplyMFKubwa = () => {
    safeNavigateFrom(navigation, 'AddMFKubwas');
  };
  const SyncGrpLoansOut = () => {
    safeNavigateFrom(navigation, 'SyncGrpLoansOut');
  };
  const SyncGrpdividends = () => {
    safeNavigateFrom(navigation, 'SyncGrpdividends');
  };
  const UpdateBankAdminAc = () => {
    safeNavigateFrom(navigation, 'UpdateBankAdminAc');
  };
  const RegGrp = () => {
    safeNavigateFrom(navigation, 'RegGrp');
  };
  const WithdrawBankAdmin = () => {
    safeNavigateFrom(navigation, 'WithdrawBankAdmin');
  };
  const SyncGrpBenefits = () => {
    safeNavigateFrom(navigation, 'SyncGrpBenefits');
  };
  const ViewSyncedGrpdividends = () => {
    safeNavigateFrom(navigation, 'ViewSyncedGrpdividends');
  };
  const ViewSyncedGrpLoansOut = () => {
    safeNavigateFrom(navigation, 'ViewSyncedGrpLoansOut');
  };
  const ViewSyncedGrpWithdrawals = () => {
    safeNavigateFrom(navigation, 'ViewSyncedGrpWithdrawals');
  };
  const ViewSyncedGrpBenefits = () => {
    safeNavigateFrom(navigation, 'ViewSyncedGrpBenefits');
  };
  const ViewMFBankAdmin = () => {
    safeNavigateFrom(navigation, 'ViewMFBankAdmin');
  };
  const RecoverMemberLoan = () => {
    safeNavigateFrom(navigation, 'RecoverMemberLoan');
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
            
        <Section title="Account" options={[{
          label: 'Register Group',
          onPress: RegGrp,
          style: styles.ClientsPressables
        }, {
          label: 'Clear Group Member Loan Applications',
          onPress: ClearGroupMemberLoan,
          style: styles.ClientsPressables
        }, {
          label: 'Apply NSKubwa Account',
          onPress: ApplyMFKubwa,
          style: styles.ClientsPressables
        }, {
          label: 'Update Bank Admin Account',
          onPress: UpdateBankAdminAc,
          style: styles.ClientsPressables
        }, {
          label: 'Top up Float',
          onPress: goToBuyFloat,
          style: styles.ClientsPressables
        }, {
          label: 'Withdraw Earnings',
          onPress: WithdrawBankAdmin,
          style: styles.ClientsPressables
        }, {
          label: 'View Account',
          onPress: ViewMFBankAdmin,
          style: styles.ClientsPressables
        }, {
          label: 'Recover Member Loan',
          onPress: RecoverMemberLoan,
          style: styles.ClientsPressables
        }]} />

        <Section title="Sync" options={[{
          label: 'Sync Group Loans',
          onPress: SyncGrpLoansOut,
          style: styles.ClientsPressables
        }, {
          label: 'Sync Group Dividends',
          onPress: SyncGrpdividends,
          style: styles.ClientsPressables
        }, {
          label: 'Sync Group Withdrawals',
          onPress: SyncGrpWithdrawals,
          style: styles.ClientsPressables
        }, {
          label: 'Sync Group Benefits',
          onPress: SyncGrpBenefits,
          style: styles.ClientsPressables
        }]} />

        <Section title="View Syncs" options={[{
          label: 'View Synced Group Benefits',
          onPress: ViewSyncedGrpBenefits,
          style: styles.ClientsPressables
        }, {
          label: 'View Synced Group Withdrawals',
          onPress: ViewSyncedGrpWithdrawals,
          style: styles.ClientsPressables
        }, {
          label: 'View Synced Group Loans',
          onPress: ViewSyncedGrpLoansOut,
          style: styles.ClientsPressables
        }, {
          label: 'View Synced Group DIvidends',
          onPress: ViewSyncedGrpdividends,
          style: styles.ClientsPressables
        }]} />



        

      </LinearGradient>
      </ScrollView>
      
    </SafeAreaView>;
};
export default RegKFKubwa;