import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, Pressable, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import styles from './styles';

const SettinsHm = props => {
  const navigation = useNavigation();

  const settingsSections = [
    {
      title: '👤 Admin Management',
      color: '#0066CC',
      items: [
        { label: 'Create Bank Admin', onPress: () => navigation.navigate('RegBankAdmin') },
        { label: 'Create NiSenti Admin', onPress: () => navigation.navigate('CrtAdmin') },
        { label: 'Deactivate Admin', onPress: () => navigation.navigate('DeactAdms') },
        { label: 'Group Control', onPress: () => navigation.navigate('GroupControlTable') },
      ],
    },
    {
      title: '🔐 Security & Privacy',
      color: '#27AE60',
      items: [
        { label: 'Update Password', onPress: () => navigation.navigate('Passwordsss') },
        { label: 'Update Privacy', onPress: () => navigation.navigate('Privacyss') },
        { label: 'Update Alerts', onPress: () => navigation.navigate('Alertss') },
        { label: 'Update Terms & Conditions', onPress: () => navigation.navigate('TCss') },
      ],
    },
    {
      title: '💼 Company Settings',
      color: '#E67E22',
      items: [
        { label: 'View Company Details', onPress: () => navigation.navigate('VwCompDtlss') },
        { label: 'Update Limits', onPress: () => navigation.navigate('Maximumss') },
        { label: 'Withdraw VAT Commission', onPress: () => navigation.navigate('UpdtVatComss') },
        { label: 'View Company Profile', onPress: () => navigation.navigate('CompAbt') },
      ],
    },
    {
      title: '📋 Policies & Info',
      color: '#8E44AD',
      items: [
        { label: 'Update Policy', onPress: () => navigation.navigate('Policyss') },
        { label: 'About NiSenti', onPress: () => navigation.navigate('Aboutss') },
        { label: 'Update Recommendations', onPress: () => navigation.navigate('Recommendationsss') },
        { label: 'Update Contact Info', onPress: () => navigation.navigate('Contactsss') },
      ],
    },
    {
      title: '💱 Exchange Rates',
      color: '#C0392B',
      items: [
        { label: 'Update Exchange Rates', onPress: () => navigation.navigate('UpdateExRates') },
        { label: 'Create Exchange Rates', onPress: () => navigation.navigate('CreateExRates') },
        { label: 'Create All Exchange Rates', onPress: () => navigation.navigate('CreateAllExRates') },
      ],
    },
    {
      title: '💰 Commissions & Fees',
      color: '#16A085',
      items: [
        { label: 'Update Commission', onPress: () => navigation.navigate('Commissionss') },
        { label: 'Update Transaction Fees', onPress: () => navigation.navigate('TransactionFeess') },
      ],
    },
    {
      title: '🔗 Configuration',
      color: '#2980B9',
      items: [
        { label: 'Add URL Links', onPress: () => navigation.navigate('UrlLinks') },
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