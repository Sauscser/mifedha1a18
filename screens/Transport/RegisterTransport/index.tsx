// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Image, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { createSokoAd, createTransportRegister } from '../../../src/graphql/mutations';
import { getSMAccount, listTransportBiznas } from '../../../src/graphql/queries';
import { Route, useRoute } from '@react-navigation/native';
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { formatAmountSync } from '../../../src/utils/exchange';
import { uploadData } from '@aws-amplify/storage';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import { generateClient } from "aws-amplify/api"; 
import { useTranslation } from 'react-i18next';
import { translations } from './translation';
const client = generateClient();
const MAX_IMAGE_SIZE_MB = 5;
const CreateBiz = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  const [formData, setFormData] = useState({
    itemName: '',
    itemTown: '',
    itemDesc: '',
    itemPrice: '',
    brandName: '',
    businessType: '',
    itemUnit: '',
    unitQuantity: '',
    bizPassword: '',
    ItemCode: '',
    ImageUrl: '',
    numberPlate: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [itemPhotoKey, setItemPhotoKey] = useState<string | null>(null);
  const [itemPhotoUri, setItemPhotoUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [businessOwnerNationality, setBusinessOwnerNationality] = useState<string | null>(null);
  const [ownershipModalVisible, setOwnershipModalVisible] = useState(false);
  const [companyModalVisible, setCompanyModalVisible] = useState(false);
  const [isFetchingCompanies, setIsFetchingCompanies] = useState(false);
  const [companyOptions, setCompanyOptions] = useState<any[]>([]);
  const [selectedOwnershipType, setSelectedOwnershipType] = useState<'Individual' | 'Company' | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const route = useRoute();
  const { nationality, ratesMap } = useExchange();
  const updateForm = (key: string, value: string) => setFormData(prev => ({
    ...prev,
    [key]: value
  }));
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        let {
          status
        } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(t.alertPermissionDenied);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation // Best possible GPS accuracy
          // Wait up to 10 seconds for a good fix
        });
        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        };

        // Optional: check for acceptable accuracy
        if (loc.coords.accuracy && loc.coords.accuracy > 30) {
          Alert.alert(
            t.alertLowGpsAccuracyTitle,
            t.alertLowGpsAccuracyMsg
              .replace('{accuracy}', Math.round(loc.coords.accuracy).toString())
          );
        }
        setLocation(coords);
      } catch (error) {
        console.warn("Error fetching location:", error);
      }
    };
    fetchLocation();
    fetchUserNationality();
  }, []);

  const fetchUserNationality = async () => {
    try {
      const attributes = await fetchUserAttributes();
      const userEmail = attributes.email;
      
      const smRes: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: userEmail
        }
      });
      
      if (smRes?.data?.getSMAccount) {
        const userNat = smRes.data.getSMAccount.nationality;
        console.log('✅ User nationality:', userNat);
        setBusinessOwnerNationality(userNat);
      } else {
        console.warn('⚠️ No getSMAccount data in response');
      }
    } catch (e: any) {
      console.error('❌ Error fetching user nationality:', e.message);
    }
  };
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      // ⛔ turn off editing for now
      aspect: [4, 3],
      quality: 1
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      console.log('Picked image URI:', uri);
      handleImage(uri); // ✅ now valid image
    } else {
      console.log('Image selection canceled or failed.');
    }
  };
  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      // ⛔ turn off editing for now
      aspect: [4, 3],
      quality: 1
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      console.log('Picked image URI:', uri);
      handleImage(uri); // ✅ now valid image
    } else {
      console.log('Image selection canceled or failed.');
    }
  };
  const handleImage = async (uri: string) => {
    console.log('Original image URI:', uri);
    try {
      const manipResult = await ImageManipulator.manipulateAsync(uri, [{
        resize: {
          width: 800
        }
      }], {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG
      });
      const response = await fetch(manipResult.uri);
      const blob = await response.blob();
      const imageSizeMB = blob.size / (1024 * 1024);
      if (imageSizeMB > MAX_IMAGE_SIZE_MB) {
        Alert.alert(
          t.alertImageTooLargeTitle,
          t.alertImageTooLargeMsg
            .replace('{size}', imageSizeMB.toFixed(2))
            .replace('{max}', MAX_IMAGE_SIZE_MB.toString())
        );
        return;
      }
      const ext = 'jpg';
      const filename = `transport_${Date.now()}.${ext}`;
      await uploadData({ key: filename, data: blob, options: { contentType: blob.type || 'image/jpeg' } }).result;
      setItemPhotoKey(filename);
      setItemPhotoUri(manipResult.uri);
      Alert.alert(t.alertImageUploadSuccessTitle, t.alertImageUploadSuccessMsg);
    } catch (err) {
      console.error('Image upload failed:', err);
      Alert.alert(t.alertImageUploadErrorTitle, t.alertImageUploadErrorMsg);
    }
  };
  const clearForm = () => {
    setFormData({
      itemName: '',
      itemTown: '',
      itemDesc: '',
      itemPrice: '',
      brandName: '',
      businessType: '',
      itemUnit: '',
      unitQuantity: '',
      bizPassword: '',
      ItemCode: '',
      ImageUrl: '',
      numberPlate: ''
    });
    setItemPhotoKey(null);
    setItemPhotoUri(null);
  };

  const openOwnershipSelection = () => {
    if (isLoading || isFetchingCompanies) return;
    setOwnershipModalVisible(true);
  };

  const loadOwnedTransportBiznas = async () => {
    setIsFetchingCompanies(true);
    try {
      const attributes = await fetchUserAttributes();
      const userEmail = attributes.email;
      const response: any = await client.graphql({
        query: listTransportBiznas,
        variables: {
          filter: {
            biznaOwnerEmail: { eq: userEmail }
          },
          limit: 100,
        },
      });
      const items = (response?.data?.listTransportBiznas?.items || []).filter(Boolean);
      setCompanyOptions(items);
      if (items.length < 1) {
        Alert.alert('No Company Found', 'No TransportBizna account found for your email.');
        return;
      }
      setCompanyModalVisible(true);
    } catch (error) {
      console.log('Error loading transport companies:', error);
      Alert.alert('Error', 'Failed to load your transport companies.');
    } finally {
      setIsFetchingCompanies(false);
    }
  };

  const handleOwnershipSelected = async (type: 'Individual' | 'Company') => {
    setOwnershipModalVisible(false);
    setSelectedOwnershipType(type);
    if (type === 'Individual') {
      setSelectedCompany(null);
      return;
    }
    await loadOwnedTransportBiznas();
  };

  const handleCompanySelected = async (company: any) => {
    setCompanyModalVisible(false);
    setSelectedCompany(company);
  };

  const handleSubmit = async () => {
    if (selectedOwnershipType === 'Company') {
      if (!selectedCompany) {
        await loadOwnedTransportBiznas();
        return;
      }
      await handleAdCreation('Company', selectedCompany);
      return;
    }
    if (!selectedOwnershipType) {
      setOwnershipModalVisible(true);
      return;
    }
    await handleAdCreation('Individual');
  };

  const handleAdCreation = async (ownershipType: 'Individual' | 'Company' = 'Individual', selectedCompany: any = null) => {
    if (isLoading) return;
    setIsLoading(true);
    const {
      itemName,
      itemTown,
      itemDesc,
      itemPrice,
      brandName,
      itemUnit,
      unitQuantity,
      bizPassword,
      ItemCode,
      ImageUrl,
      numberPlate
    } = formData;
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const userEmail = attributes.email;
      const accRes = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: userEmail
        }
      });
      const account = accRes?.data?.getSMAccount;
      if (!account || bizPassword !== account.pw) {
        Alert.alert(t.alertIncorrectPasswordTitle, t.alertIncorrectPasswordMsg);
        return;
      }
      const coords = location || {
        latitude: 0,
        longitude: 0
      };

      const userCode = nationalityToCode(businessOwnerNationality);
      let transportRateKES = parseFloat(itemPrice);
      let transportOwnerAc = account.email;
      let ownerShipType = 'Individual';
      let transportOwnerEmail = account.awsemail;
      let transportName = itemName;

      if (ownershipType === 'Company') {
        if (!selectedCompany) {
          Alert.alert('No Company Selected', 'Please select a transport company first.');
          return;
        }
        transportRateKES = Number(selectedCompany.transportRate || 0);
        transportOwnerAc = selectedCompany.BizAc;
        ownerShipType = 'Company';
        transportOwnerEmail = selectedCompany.biznaOwnerEmail || account.awsemail;
        transportName = selectedCompany.transportName || itemName;
      } else {
        if (Number.isNaN(transportRateKES) || transportRateKES <= 0) {
          Alert.alert('Invalid Rate', 'Please enter a valid transport rate per kilometer.');
          return;
        }
        if (userCode) {
          // Use async convertForeignToKsh from src/utils/exchange
          const { convertForeignToKsh } = await import('../../../src/utils/exchange');
          transportRateKES = await convertForeignToKsh(parseFloat(itemPrice), userCode);
        }
      }

      const adInput = {
        transportkntct: account.phonecontact,
        // Store in KES for backend
        transportRate: transportRateKES,
        transportOwnerAc,
        ownerShipType,
        transportdesc: itemDesc,
        transportPhoto: itemPhotoKey,
        owner: account.owner,
        latitude: coords.latitude,
        longitude: coords.longitude,
        sellerLatitude: 0,
        sellerLongitude: 0,
        distance: 0,
        transportName,
        transportType: brandName,
        dutyStatus: "TransportOnduty",
        engagementStatus: "TransportNotEngaged",
        transportRequest: "transportRequestNo",
        transportOwnerEmail,
        Earnings: 0,
        UsrAcCommitment: 0,
        ChmAcCommitment: 0,
        chmAcNumber: "String",
        chmAcCommitmentStatus: "TransportChmCommitmentNo",
        deliveryLatitude: 0,
        deliveryLongitude: 0,
        buyerName: "None",
        buyerContact: "None",
        deliveryID: "None",
        deliveryCost: 0,
        customerEmail: "None",
        deliveryDesc: "None",
        bizAc: "None",
        bizType: "None",
        purchasePhoto: "None",
        deliveryStart: 0,
        itemID: "None",
        sellerContact: "None",
        sellerName: "None",
        numberPlate: numberPlate,
        ImageUrl: ImageUrl
      };
      await client.graphql({
        query: createTransportRegister,
        variables: {
          input: adInput
        }
      });
      // Format rate for display in user's currency
      const rateInDisplayCurrency = userCode
        ? formatAmountSync(transportRateKES, userCode, ratesMap)
        : formatAmountSync(transportRateKES, undefined, ratesMap);
      Alert.alert(
        t.alertRegisterSuccessTitle,
        t.alertRegisterSuccessMsg
          .replace('{rate}', rateInDisplayCurrency)
          
      );
      clearForm();
    } catch (err) {
      console.error('Transport registration failed:', err);
      Alert.alert(t.alertRegisterErrorTitle, t.alertRegisterErrorMsg);
    } finally {
      setIsLoading(false);
    }
  };
  return <LinearGradient colors={['#e58d29', '#2c5364']} style={{
    flex: 1
  }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t.registerTransport}</Text>
        <TouchableOpacity style={styles.ownershipSelector} onPress={openOwnershipSelection} disabled={isLoading || isFetchingCompanies}>
          <Text style={styles.ownershipSelectorText}>
            Ownership Type: {selectedOwnershipType || 'Click to choose'}
          </Text>
          {selectedOwnershipType === 'Company' && selectedCompany ? (
            <Text style={styles.ownershipHintText}>Selected: {selectedCompany.transportName || 'TransportBizna'} ({selectedCompany.BizAc})</Text>
          ) : null}
        </TouchableOpacity>
        {selectedOwnershipType !== 'Company' ? (
          <InputField label={t.transportBusinessName} value={formData.itemName} onChange={v => updateForm('itemName', v)} />
        ) : null}
        <InputField label={t.meansOfTransport} value={formData.brandName} onChange={v => updateForm('brandName', v)} />
        {selectedOwnershipType !== 'Company' ? businessOwnerNationality ? (
          <>
            <InputField label={`${t.costPerKm} (${ratesMap?.[nationalityToCode(businessOwnerNationality)]?.symbol || ratesMap?.[nationality]?.symbol || 'KES'})`} value={formData.itemPrice} onChange={v => updateForm('itemPrice', v)} keyboardType="numeric" />
            {formData.itemPrice ? <Text style={styles.helperText}></Text> : null}
          </>
        ) : (
          <>
            <InputField label={`${t.costPerKm} (${t.loading})`} value={formData.itemPrice} onChange={v => updateForm('itemPrice', v)} keyboardType="numeric" />
          </>
        ) : null}
        <InputField label={t.moreTransportDesc} value={formData.itemDesc} onChange={v => updateForm('itemDesc', v)} multiline height={100} />
        <InputField label={t.transportNumberPlate} value={formData.numberPlate} onChange={v => updateForm('numberPlate', v)} />
        <InputField label={t.imageUrlOptional} value={formData.ImageUrl} onChange={v => updateForm('ImageUrl', v)} />
        <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between'
      }}>
          <TouchableOpacity onPress={pickImage} style={[styles.button, {
          flex: 1,
          marginRight: 10
        }]}>
            <Text style={styles.buttonText}>{t.attachPhoto}</Text>
          </TouchableOpacity>
        </View>
        {itemPhotoUri && <Image source={{
        uri: itemPhotoUri
      }} style={styles.imagePreview} />}
        <View style={styles.passwordContainer}>
          <TextInput placeholder={t.userPassword} style={styles.passwordInput} value={formData.bizPassword} onChangeText={v => updateForm('bizPassword', v)} secureTextEntry={!isPasswordVisible} placeholderTextColor="#ccc" />
          <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
            <Ionicons name={isPasswordVisible ? 'eye' : 'eye-off'} size={24} color="gray" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isLoading || isFetchingCompanies}>
          <Text style={styles.buttonText}>{isFetchingCompanies ? 'Loading companies...' : t.clickToAdd}</Text>
          {(isLoading || isFetchingCompanies) && <ActivityIndicator color="#fff" style={{
          marginTop: 10
        }} />}
        </TouchableOpacity>

        <Modal visible={ownershipModalVisible} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select Transport Ownership</Text>
              <Text style={styles.modalSubtitle}>Choose how this transport should be registered.</Text>

              <TouchableOpacity style={styles.modalOption} onPress={() => handleOwnershipSelected('Individual')}>
                <Text style={styles.modalOptionText}>Individual Transport</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOption} onPress={() => handleOwnershipSelected('Company')}>
                <Text style={styles.modalOptionText}>Company Transport</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalCancel} onPress={() => setOwnershipModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={companyModalVisible} animationType="fade" transparent onRequestClose={() => {}}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select Transport Company</Text>
              <Text style={styles.modalSubtitle}>Pick one of your TransportBizna accounts to continue.</Text>

              <ScrollView style={{ maxHeight: 260, width: '100%' }}>
                {companyOptions.map((company) => (
                  <TouchableOpacity
                    key={company.BizAc}
                    style={styles.modalOption}
                    onPress={() => handleCompanySelected(company)}
                  >
                    <Text style={styles.modalOptionText}>{company.transportName || 'TransportBizna'} ({company.BizAc})</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {isFetchingCompanies ? (
          <View style={styles.blockingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.blockingOverlayText}>Loading transport companies...</Text>
          </View>
        ) : null}
      </ScrollView>
    </LinearGradient>;
};
const InputField = ({
  label,
  value,
  onChange,
  ...props
}) => <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={[styles.input, props.multiline && {
    height: props.height || 100
  }]} value={value} onChangeText={onChange} {...props} />
  </View>;
const styles = StyleSheet.create({
  container: {
    padding: 20
  },
  title: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  inputContainer: {
    marginBottom: 15
  },
  label: {
    color: '#ccc',
    marginBottom: 5,
    fontSize: 14
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333'
  },
  button: {
    marginTop: 20,
    backgroundColor: '#f5a623',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    padding: 10
  },
  buttonText: {
    color: '#1b1b1b',
    fontWeight: 'bold',
    fontSize: 16
  },
  imagePreview: {
    width: '100%',
    height: 200,
    marginTop: 10,
    borderRadius: 10,
    resizeMode: 'cover'
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 10,
    height: 50,
    paddingHorizontal: 10
  },
  passwordInput: {
    flex: 1,
    padding: 12
  },
  helperText: {
    color: '#fff',
    fontSize: 13,
    marginTop: 6
  },
  ownershipSelector: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  ownershipSelectorText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  ownershipHintText: {
    color: '#f2f2f2',
    fontSize: 12,
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b1b1b',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#4a4a4a',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalOption: {
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  modalOptionText: {
    color: '#1b1b1b',
    fontSize: 14,
    fontWeight: '600',
  },
  modalCancel: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#efefef',
  },
  modalCancelText: {
    color: '#333',
    fontWeight: '700',
  },
  blockingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  blockingOverlayText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 15,
    fontWeight: '700',
  }
});
export default CreateBiz;