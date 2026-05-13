import { View, Text, ScrollView, Image, Linking, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/core';
import React, {useEffect, useState} from 'react';
import styles from './styles';
import { formatAmountSync } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import {useExchange} from '../../../src/contexts/ExchangeContext';
import { getSMAccount } from '../../../src/graphql/queries';
import {fetchUserAttributes} from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { getUrl } from 'aws-amplify/storage';
import { useTranslation } from 'react-i18next';
import { translations } from './translation';
export interface SMAccount {
  SMAc: {
    sokokntct: string;
    sokoname: string;
    sokoprice: number;
    sokolnprcntg: number;
    sokodesc: string;
    sokolpymntperiod: number;
    bizContact: string;
    bizName: string;
    businessType: string;
    itemUnit: string;
    unitQuantity: number;
    itemBrand: string;
    itemPhoto: string;
    
    sokotown?: string; // new optional video/url field
  };
}

const ViewSMDeposts = ({ SMAc }: SMAccount) => {
  const {
    sokokntct,
    itemPhoto,
    sokoname,
    sokoprice,
    itemBrand,
    sokodesc,
    bizContact,
    bizName,
    businessType,
    itemUnit,
    unitQuantity,
    sokotown,
     // added here
  } = SMAc;


  const client = generateClient();
     const [Uzer, setUzer] = useState<string>(null);
     const [userNationality, setUserNationality] = useState<string>(null);
     const userCode = nationalityToCode(userNationality);
     const {ratesMap} = useExchange();
                
             
                
             
         useEffect(() => {
         const fetchUserData = async () => {
                
         const user = await fetchUserAttributes();
         setUzer(user.email);
         try {
         const userData = await client.graphql({
         query: getSMAccount,
         variables: { awsemail: user.email },
         });
         setUserNationality(userData.data.getSMAccount.nationality);
         console.log('User Data:', userData);
         } catch (error) {
         console.error('Error fetching user data:', error);
         }
         };
         fetchUserData();
         }, [Uzer]);


  const handleOpenLink = () => {
    if (sokotown) {
      Linking.openURL(sokotown).catch(err => console.error("Couldn't load page", err));
    }
  };

  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchSignedUrl = async () => {
      if (itemPhoto && itemPhoto !== 'None') {
        try {
          const urlObj = await getUrl({ key: itemPhoto });
          if (urlObj && urlObj.url) {
            setSignedUrl(urlObj.url.toString());
          } else {
            setSignedUrl(null);
          }
        } catch (err) {
          console.error('Failed to get signed URL for image:', itemPhoto, err);
          setSignedUrl(null);
        }
      } else {
        setSignedUrl(null);
      }
    };
    fetchSignedUrl();
  }, [itemPhoto]);

  // i18n translation
  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  return (
    <ScrollView contentContainerStyle={styles.pageContainer}>
      <View style={styles.card}>
        {signedUrl ? (
          <Image
            source={{ uri: signedUrl }}
            style={styles.carouselImage}
            resizeMode="cover"
            onError={() => setSignedUrl(null)}
          />
        ) : (
          <View style={[styles.carouselImage, { backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' }]}> 
            <Text style={{ color: '#bbb', fontSize: 24 }}>No Image</Text>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.prodInfo}>
            <Text style={styles.label}>{t.biznaAccountNumber}</Text> {sokokntct}
          </Text>
          <Text style={styles.prodInfo}>
            <Text style={styles.label}>{t.itemName}</Text> {sokoname}
          </Text>
          <Text style={styles.prodInfo}>
            <Text style={styles.label}>{t.itemPrice}</Text> {formatAmountSync((sokoprice), userCode, ratesMap)}
          </Text>
          <Text style={styles.prodInfo}>
            <Text style={styles.label}>{t.brand}</Text> {itemBrand}
          </Text>
          <Text style={styles.prodInfo}>
            <Text style={styles.label}>{t.biznaContact}</Text> {bizContact}
          </Text>
          <Text style={styles.prodInfo}>
            <Text style={styles.label}>{t.biznaName}</Text> {bizName}
          </Text>
          <Text style={styles.prodInfo}>
            <Text style={styles.label}>{t.businessType}</Text> {businessType}
          </Text>
          <Text style={styles.prodInfo}>
            <Text style={styles.label}>{t.unitOfMeasure}</Text> {itemUnit}
          </Text>
          <Text style={styles.prodInfo}>
            <Text style={styles.label}>{t.numberOfUnits}</Text> {unitQuantity}
          </Text>
          {/* Optional video / URL display */}
          {sokotown && (
            <TouchableOpacity onPress={handleOpenLink} style={{ marginTop: 10 }}>
              <Text style={[styles.prodInfo, { color: 'blue', textDecorationLine: 'underline' }]}>{t.viewRelatedLink}</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.prodDesc}>{sokodesc}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default ViewSMDeposts;
