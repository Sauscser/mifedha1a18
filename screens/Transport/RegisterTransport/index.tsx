// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { createSokoAd, createTransportRegister } from '../../../src/graphql/mutations';
import { getSMAccount, getBizna, listPersonels } from '../../../src/graphql/queries';
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
  const handleAdCreation = async () => {
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

      // --- Currency conversion pattern: convert user-keyed amount to KES before saving ---
      const userCode = nationalityToCode(businessOwnerNationality);
      let transportRateKES = parseFloat(itemPrice);
      if (userCode) {
        // Use async convertForeignToKsh from src/utils/exchange
        const { convertForeignToKsh } = await import('../../../src/utils/exchange');
        transportRateKES = await convertForeignToKsh(parseFloat(itemPrice), userCode);
      }

      const adInput = {
        transportkntct: account.phonecontact,
        // Store in KES for backend
        transportRate: transportRateKES,
        transportdesc: itemDesc,
        transportPhoto: itemPhotoKey,
        owner: account.owner,
        latitude: coords.latitude,
        longitude: coords.longitude,
        sellerLatitude: 0,
        sellerLongitude: 0,
        distance: 0,
        transportName: itemName,
        transportType: brandName,
        dutyStatus: "TransportOnduty",
        engagementStatus: "TransportNotEngaged",
        transportRequest: "transportRequestNo",
        transportOwnerEmail: account.awsemail,
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
        <InputField label={t.transportBusinessName} value={formData.itemName} onChange={v => updateForm('itemName', v)} />
        <InputField label={t.meansOfTransport} value={formData.brandName} onChange={v => updateForm('brandName', v)} />
        {businessOwnerNationality ? (
          <>
            <InputField label={`${t.costPerKm} (${ratesMap?.[nationalityToCode(businessOwnerNationality)]?.symbol || ratesMap?.[nationality]?.symbol || 'KES'})`} value={formData.itemPrice} onChange={v => updateForm('itemPrice', v)} keyboardType="numeric" />
            {formData.itemPrice ? <Text style={styles.helperText}></Text> : null}
          </>
        ) : (
          <>
            <InputField label={`${t.costPerKm} (${t.loading})`} value={formData.itemPrice} onChange={v => updateForm('itemPrice', v)} keyboardType="numeric" />
          </>
        )}
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
        <TouchableOpacity style={styles.button} onPress={handleAdCreation}>
          <Text style={styles.buttonText}>{t.clickToAdd}</Text>
          {isLoading && <ActivityIndicator color="#fff" style={{
          marginTop: 10
        }} />}
        </TouchableOpacity>
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
  }
});
export default CreateBiz;