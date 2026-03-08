import React from 'react';
import { Text,    View} from 'react-native';
import styles from './styles';


export interface ChmCvLnSttusRec {
    Loanee: {
      privacy: string,
      
    }}

const CredSlrCvLnStts = (props:ChmCvLnSttusRec) => {
   const {
    Loanee: {
      privacy,
      
   }} = props ;
   
    return (
               <View style = {styles.pageContainer}>
                      <View style = {styles.card}>
                        <Text style={styles.prodName}>{privacy.replace(/MiFedha|mifedha|MF/g, (match) => {
                          switch(match) {
                            case 'MiFedha': return 'NiSenti';
                            case 'mifedha': return 'nisenti';
                            case 'MF': return 'NS';
                            default: return match;
                          }
                        })}</Text>
                      </View> 
              </View>     
           
    );
}; 

export default CredSlrCvLnStts
