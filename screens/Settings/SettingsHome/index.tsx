import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import styles from './styles';
import { safeNavigateFrom } from '../../../src/utils/navigationHelper';


const SettinsHm = props => {
  const navigation = useNavigation();

  const settingsSections = [
    {
      title: '👤 Admin Management',
      color: '#0066CC',
      items: [
        { label: 'Create Bank Admin', onPress: () => safeNavigateFrom(navigation, 'RegBankAdmin') },
        { label: 'Create NiSenti Admin', onPress: () => safeNavigateFrom(navigation, 'CrtAdmin') },
        { label: 'Deactivate Admin', onPress: () => safeNavigateFrom(navigation, 'DeactAdms') },
        { label: 'Group Control', onPress: () => safeNavigateFrom(navigation, 'GroupControlTable') },
      ],
    },
    {
      title: '🔐 Security & Privacy',
      color: '#27AE60',
      items: [
        { label: 'Update Password', onPress: () => safeNavigateFrom(navigation, 'Passwordsss') },
        { label: 'Update Privacy', onPress: () => navigation.navigate('Privacyss') },
        { label: 'Update Alerts', onPress: () => safeNavigateFrom(navigation, 'Alertss') },
        { label: 'Update Terms & Conditions', onPress: () => safeNavigateFrom(navigation, 'TCss') },
      ],
    },
    {
      title: '💼 Company Settings',
      color: '#E67E22',
      items: [
        { label: 'View Company Details', onPress: () => safeNavigateFrom(navigation, 'VwCompDtlss') },
        { label: 'Update Limits', onPress: () => safeNavigateFrom(navigation, 'Maximumss') },
        { label: 'Withdraw VAT Commission', onPress: () => safeNavigateFrom(navigation, 'UpdtVatComss') },
        { label: 'View Company Profile', onPress: () => navigation.navigate('CompAbt') },
      ],
    },
    {
      title: '📋 Policies & Info',
      color: '#8E44AD',
      items: [
        { label: 'Update Policy', onPress: () => safeNavigateFrom(navigation, 'Policyss') },
        { label: 'About NiSenti', onPress: () => safeNavigateFrom(navigation, 'Aboutss') },
        { label: 'Update Recommendations', onPress: () => safeNavigateFrom(navigation, 'Recommendationsss') },
        { label: 'Update Contact Info', onPress: () => safeNavigateFrom(navigation, 'Contactsss') },
      ],
    },
    {
      title: '💱 Exchange Rates',
      color: '#C0392B',
      items: [
        { label: 'Update Exchange Rates', onPress: () => safeNavigateFrom(navigation, 'UpdateExRates') },
        { label: 'Create Exchange Rates', onPress: () => safeNavigateFrom(navigation, 'CreateExRates') },
        { label: 'Create All Exchange Rates', onPress: () => safeNavigateFrom(navigation, 'CreateAllExRates') },
      ],
    },
    {
      title: '💰 Commissions & Fees',
      color: '#16A085',
      items: [
        { label: 'Update Commission', onPress: () => safeNavigateFrom(navigation, 'Commissionss') },
        { label: 'Update Transaction Fees', onPress: () => safeNavigateFrom(navigation, 'TransactionFeess') },
      ],
    },
    {
      title: '🔗 Configuration',
      color: '#2980B9',
      items: [
        { label: 'Add URL Links', onPress: () => safeNavigateFrom(navigation, 'UrlLinks') },
      ],
    },
  ];

  const SettingSection = ({ section }) => (
    <View style={[styles.sectionContainer, { borderLeftColor: section.color }]}>
      <Text style={[styles.sectionTitle, { color: section.color }]}>{section.title}</Text>
      <View style={styles.itemsContainer}>
        {section.items.map((item, idx) => (
          <Pressable
            key={idx}
            onPress={item.onPress}
            style={({ pressed }) => [
              styles.settingItem,
              pressed && styles.settingItemPressed,
            ]}
          >
            <Text style={styles.settingItemText}>{item.label}</Text>
            <Text style={styles.settingItemArrow}>›</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={true}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your system configuration</Text>
        </View>

        <View style={styles.contentContainer}>
          {settingsSections.map((section, idx) => (
            <SettingSection key={idx} section={section} />
          ))}
        </View>

        <View style={styles.footerSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettinsHm;