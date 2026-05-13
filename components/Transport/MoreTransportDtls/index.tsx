import { View, Text, ScrollView, Image, TouchableOpacity, Linking } from 'react-native';
import styles from './styles';

import React, {useEffect, useState} from 'react';
import { getUrl } from 'aws-amplify/storage';
import { formatAmountSync } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
import {useExchange} from '../../../src/contexts/ExchangeContext';
import { getSMAccount } from '../../../src/graphql/queries';
import {fetchUserAttributes} from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';

export interface SMAccount {
  SMAc: {
    id: string;
    transportkntct: string;
    transportRate: number;
    transportdesc: number;
    
    transportPhoto: number;
    transportName: string;
    transportType: string;
    
    ImageUrl: string;
    numberPlate: string;
  };
}

const ViewSMDeposts = ({ SMAc }: SMAccount) => {
  const {
    id,
    transportkntct,
    transportRate,
    ImageUrl,
    numberPlate,
    transportdesc,
    transportPhoto,
    transportName,
    transportType,
  } = SMAc;

  // S3 image state
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchImage() {
      setImageError(false);
      setSignedUrl(null);
      if (transportPhoto && transportPhoto !== 'None') {
        try {
          const urlObj = await getUrl({ key: transportPhoto });
          if (isMounted && urlObj && urlObj.url) {
            setSignedUrl(urlObj.url.toString());
          }
        } catch (err) {
          if (isMounted) setImageError(true);
        }
      } else {
        setImageError(true);
      }
    }
    fetchImage();
    return () => { isMounted = false; };
  }, [transportPhoto]);

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
      if (ImageUrl) {
        Linking.openURL(ImageUrl).catch(err => console.error("Couldn't load page", err));
      }
    };

  return (
    <ScrollView contentContainerStyle={styles.pageContainer}>
      <View style={styles.card}>

        {signedUrl && !imageError ? (
          <Image
            source={{ uri: signedUrl }}
            style={styles.carouselImage}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.carouselImage, { backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' }]}> 
            <Text style={{ color: '#aaa' }}>No Image</Text>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.prodInfo}>
            <Text style={styles.label}>Transport Name:</Text> {transportName}
          </Text>
          <Text style={styles.prodInfo}>
            <Text style={styles.label}>Number Plate:</Text> {numberPlate}
          </Text>
          <Text style={styles.prodInfo}>
            <Text style={styles.label}>Transport Type:</Text> {transportType}
          </Text>
          <Text style={styles.prodInfo}>
            <Text style={styles.label}>Cost per Kilometer:</Text> {formatAmountSync(transportRate, userCode, ratesMap)}
          </Text>
          <Text style={styles.prodInfo}>
            <Text style={styles.label}>Contact Number:</Text> {transportkntct}
          </Text>       

          {/* Optional video / URL display */}
                    {ImageUrl && (
                      <TouchableOpacity onPress={handleOpenLink} style={{ marginTop: 10 }}>
                        <Text style={[styles.prodInfo, { color: 'blue', textDecorationLine: 'underline' }]}>
                          View Related Link
                        </Text>
                      </TouchableOpacity>
                    )}
         
          <Text style={styles.prodDesc}>{transportdesc}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default ViewSMDeposts;
