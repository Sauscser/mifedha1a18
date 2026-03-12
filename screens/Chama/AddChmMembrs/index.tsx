import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { translations } from './translation';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { createChamaMembers, createMessages, sendNotification, updateCompany, updateGroup } from '../../../src/graphql/mutations';
import { listGroups, getSMAccount, listSMAccounts } from '../../../src/graphql/queries';
import { useExchange } from '../../../src/contexts/ExchangeContext';
import { convertForeignToKsh, formatAmountSync } from '../../../src/utils/exchange';
import { nationalityToCode } from '../../../src/utils/nationalityToCode';
const client = generateClient();
const AddChmMmbrs = () => {
  const navigation = useNavigation();
  const { nationality, ratesMap } = useExchange();

  const { i18n } = useTranslation();
  const lang = i18n.language ? i18n.language.split('-')[0] : 'en';
  const t = translations[lang] || translations.en;
  // Form state
  const [phoneContacts, setPhoneContacts] = useState('');
  const [MmbaID, setMmbaID] = useState('');
  const [SubAmt, setSubAmt] = useState('');
  const [SubFreq, setSubFreq] = useState('');
  const [lateSub, setLateSub] = useState('');
  const [pword, setPW] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Group selection
  const [adminGroups, setAdminGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Loading
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  // Fetch groups where current user is admin
  useEffect(() => {
    const fetchAdminGroups = async () => {
      setIsLoadingGroups(true);
      try {
        const user = await getCurrentUser();
        const attrs = await fetchUserAttributes();
        const groupsData: any = await client.graphql({
          query: listGroups,
          variables: {
            filter: {
              or: [{
                Admin1: {
                  eq: attrs.email
                }
              }, {
                Admin2: {
                  eq: attrs.email
                }
              }, {
                Admin3: {
                  eq: attrs.email
                }
              }, {
                Admin4: {
                  eq: attrs.email
                }
              }, {
                Admin5: {
                  eq: attrs.email
                }
              }, {
                Admin6: {
                  eq: attrs.email
                }
              }, {
                Admin7: {
                  eq: attrs.email
                }
              }, {
                Admin8: {
                  eq: attrs.email
                }
              }, {
                Admin9: {
                  eq: attrs.email
                }
              }, {
                Admin10: {
                  eq: attrs.email
                }
              }, {
                Admin11: {
                  eq: attrs.email
                }
              }, {
                Admin12: {
                  eq: attrs.email
                }
              }, {
                Admin13: {
                  eq: attrs.email
                }
              }, {
                Admin14: {
                  eq: attrs.email
                }
              }, {
                Admin15: {
                  eq: attrs.email
                }
              }, {
                Admin16: {
                  eq: attrs.email
                }
              }, {
                Admin17: {
                  eq: attrs.email
                }
              }, {
                Admin18: {
                  eq: attrs.email
                }
              }, {
                Admin19: {
                  eq: attrs.email
                }
              }, {
                Admin20: {
                  eq: attrs.email
                }
              }]
            }
          }
        });
        setAdminGroups(groupsData.data.listGroups.items);
      } catch (error) {
        console.error(error);
        Alert.alert(t.errorAdding);
      }
      setIsLoadingGroups(false);
    };
    fetchAdminGroups();
  }, []);

  // Main function to add a member
  const parseAmountInput = (value: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const normalized = trimmed.replace(/,/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const handleMoneyInput = (setter: (val: string) => void) => (value: string) => {
    const sanitized = value.replace(/,/g, '');
    if (sanitized === '') {
      setter('');
      return;
    }
    if (/^\d*(\.\d{0,2})?$/.test(sanitized)) {
      setter(sanitized);
    }
  };

  const formatMoneyOnBlur = (value: string, setter: (val: string) => void) => {
    if (!value.trim()) return;
    const parsed = parseAmountInput(value);
    if (parsed === null) return;
    setter(parsed.toFixed(2));
  };

  const confirmAddMember = (
    groupName: string,
    memberName: string,
    memberEmail: string,
    subscriptionAmount: string,
    frequencyDays: string,
    latePenalty: string
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      Alert.alert(
        t.confirmMemberAddTitle,
        t.confirmMemberAddBody
          .replace('{memberName}', memberName)
          .replace('{memberEmail}', memberEmail)
          .replace('{groupName}', groupName)
          .replace('{subscriptionAmount}', subscriptionAmount)
          .replace('{frequencyDays}', frequencyDays)
          .replace('{latePenalty}', latePenalty),
        [
          { text: t.cancel, style: 'cancel', onPress: () => resolve(false) },
          { text: t.addMember, onPress: () => resolve(true) }
        ],
        {
          cancelable: true,
          onDismiss: () => resolve(false)
        }
      );
    });
  };

  const handleAddMember = async () => {
    if (!selectedGroup) {
      Alert.alert(t.selectGroupFirst);
      return;
    }
    if (!phoneContacts || !MmbaID || !SubAmt || !SubFreq || !pword) {
      Alert.alert(t.fillAllFields);
      return;
    }
    setIsLoading(true);
    try {
      const userInfo = await getCurrentUser();
      const attrs = await fetchUserAttributes();

      // Check if member exists
      const memberData: any = await client.graphql({
        query: listSMAccounts,
        variables: {
          filter: {
            awsemail: {
              eq: phoneContacts
            }
          }
        }
      });
      if (memberData.data.listSMAccounts.items.length < 1) {
        Alert.alert(t.memberMustCreate);
        setIsLoading(false);
        return;
      }

      // Verify admin password
      const adminAccount: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: attrs.email
        }
      });
      const adminDtls = adminAccount.data.getSMAccount;
      if (adminDtls.pw !== pword) {
        Alert.alert(t.incorrectPassword);
        setIsLoading(false);
        return;
      }

      const adminCurrencyKey =
        nationalityToCode(adminDtls.nationality) ||
        adminDtls.nationality ||
        nationality ||
        undefined;

      const subscriptionForeign = parseAmountInput(SubAmt);
      if (subscriptionForeign === null || subscriptionForeign <= 0) {
        Alert.alert(t.enterValidSubAmt);
        setIsLoading(false);
        return;
      }

      const latePenaltyForeign = parseAmountInput(lateSub || '0') ?? 0;

      const subscriptionAmtKES = await convertForeignToKsh(subscriptionForeign, adminCurrencyKey);
      const latePenaltyKES = await convertForeignToKsh(latePenaltyForeign, adminCurrencyKey);

      if (!Number.isFinite(subscriptionAmtKES) || subscriptionAmtKES <= 0 || !Number.isFinite(latePenaltyKES) || latePenaltyKES < 0) {
        Alert.alert(t.unableToConvert);
        setIsLoading(false);
        return;
      }

      const memberDtls: any = await client.graphql({
        query: getSMAccount,
        variables: {
          awsemail: phoneContacts
        }
      });
      const membaDtls = memberDtls.data.getSMAccount;
      if (!membaDtls) {
        Alert.alert(t.memberMustCreate);
        setIsLoading(false);
        return;
      }

      // Fetch selected group details
      const group = selectedGroup;

      const accepted = await confirmAddMember(
        group.grpName,
        membaDtls.name,
        phoneContacts,
        formatAmountSync(subscriptionAmtKES, adminCurrencyKey, ratesMap),
        SubFreq,
        formatAmountSync(latePenaltyKES, adminCurrencyKey, ratesMap)
      );
      if (!accepted) {
        setIsLoading(false);
        return;
      }

      // Prepare member payload
      const memberPayload = {
        MembaId: MmbaID,
        regNo: group.regNo,
        groupContact: group.grpContact,
        memberContact: phoneContacts,
        ChamaNMember: MmbaID + group.grpContact,
        memberNatId: membaDtls.nationalid,
        memberChmBenefit: 0,
        GrossLnsGvn: 0,
        LonAmtGven: 0,
        AmtRepaid: 0,
        LnBal: 0,
        NonLoanAcBal: 0,
        ttlNonLonAcBal: 0,
        timeCrtd: Date.now().toString(),
        subscribedAmt: 0,
        groupName: group.grpName,
        memberName: membaDtls.name,
        AcStatus: 'AccountActive',
        loanStatus: 'NoLoan',
        blStatus: 'AccountNotBL',
        owner: group.owner,
        totalSubAmt: 0,
        subscriptionFrequency: SubFreq,
        subscriptionAmt: subscriptionAmtKES.toFixed(2),
        lateSubscriptionPenalty: latePenaltyKES.toFixed(2),
        ttlLateSubs: 0,
        transportApproved: 'ChamaTransportApprovedNo'
      };

      // Create member
      await client.graphql({
        query: createChamaMembers,
        variables: {
          input: memberPayload
        }
      });

      // Update group and company counts
      await client.graphql({
        query: updateGroup,
        variables: {
          input: {
            grpContact: group.grpContact,
            ttlGrpMembers: group.ttlGrpMembers + 1
          }
        }
      });
      await client.graphql({
        query: updateCompany,
        variables: {
          input: {
            AdminId: "BaruchHabaB'ShemAdonai2",
            ttlActiveChmUsers: 1
          }
        }
      });
      await client.graphql({
        query: createMessages,
        variables: {
          input: {
            senderEmail: phoneContacts,
            messageBody: t.addedToGroup.replace('{group}', group.grpName)
          }
        }
      });
      await client.graphql({
        query: sendNotification,
        variables: {
          riderEmail: phoneContacts,
          title: t.newGroupMembership,
          body: t.addedToGroup.replace('{group}', group.grpName)
        }
      });
      Alert.alert(t.success, t.memberAdded.replace('{group}', group.grpName));
      navigation.goBack();
      setPhoneContacts('');
      setMmbaID('');
      setSubAmt('');
      setSubFreq('');
      setLateSub('');
      setPW('');
      setSelectedGroup(null);
    } catch (error) {
      console.error(error);
      Alert.alert(t.errorAdding);
    }
    setIsLoading(false);
  };
  return <View style={ui.container}>
        <ScrollView contentContainerStyle={ui.scroll}>

          {/* Header */}
          <View style={ui.header}>
            <Text style={ui.title}>{t.addChamaMember}</Text>
            <Text style={ui.subtitle}>{t.selectGroupAndFill}</Text>
          </View>

          {/* Group Selection */}
          <View style={ui.card}>
            <Text style={ui.label}>{t.selectGroup}</Text>
            {isLoadingGroups ? (
              <ActivityIndicator size="large" color="#e58d29" style={{ marginVertical: 20 }} />
            ) : adminGroups.length > 0 ? (
              adminGroups.map(group => (
                <TouchableOpacity key={group.grpContact} style={[ui.groupButton, selectedGroup?.grpContact === group.grpContact && ui.groupButtonSelected]} onPress={() => setSelectedGroup(group)}>
                  <Text style={[ui.groupButtonText, selectedGroup?.grpContact === group.grpContact && { color: '#fff' }]}>
                    {group.grpName}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={{ color: 'red', marginVertical: 10 }}>{t.noGroups}</Text>
            )}
          </View>

          {/* Member Form */}
          {selectedGroup && <View style={ui.card}>
              <View style={ui.inputGroup}>
                <Text style={ui.label}>{t.memberEmail}</Text>
                <TextInput value={phoneContacts} onChangeText={setPhoneContacts} style={ui.input} keyboardType="email-address" autoCapitalize="none" />
              </View>

              <View style={ui.inputGroup}>
                <Text style={ui.label}>{t.memberChamaNumber}</Text>
                <TextInput value={MmbaID} onChangeText={setMmbaID} style={ui.input} />
              </View>

              <View style={ui.inputGroup}>
                <Text style={ui.label}>{t.subscriptionAmount}</Text>
                <TextInput value={SubAmt} onChangeText={handleMoneyInput(setSubAmt)} onBlur={() => formatMoneyOnBlur(SubAmt, setSubAmt)} style={ui.input} keyboardType="decimal-pad" />
              </View>

              <View style={ui.inputGroup}>
                <Text style={ui.label}>{t.subscriptionFrequency}</Text>
                <TextInput value={SubFreq} onChangeText={setSubFreq} style={ui.input} keyboardType="decimal-pad" />
              </View>

              <View style={ui.inputGroup}>
                <Text style={ui.label}>{t.lateSubPenalty}</Text>
                <TextInput value={lateSub} onChangeText={handleMoneyInput(setLateSub)} onBlur={() => formatMoneyOnBlur(lateSub, setLateSub)} style={ui.input} keyboardType="decimal-pad" />
              </View>

              <View style={[ui.inputGroup, {
          flexDirection: 'row',
          alignItems: 'center'
        }]}>
    <TextInput value={pword} onChangeText={setPW} style={[ui.input, {
            flex: 1
          }]} // take full width except icon
          secureTextEntry={!showPassword} placeholder="••••••••" />
    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{
            marginLeft: 10
          }}>
      <Text style={{
              color: '#2563EB',
              fontWeight: '500'
            }}>
        {showPassword ? t.hide : t.show}
      </Text>
    </TouchableOpacity>
  </View>

              <TouchableOpacity style={ui.button} onPress={handleAddMember} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={ui.buttonText}>{t.addMember}</Text>}
              </TouchableOpacity>
            </View>}
        </ScrollView>
      </View>;
};
export default AddChmMmbrs;
const ui = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8'
  },
  scroll: {
    padding: 20,
    paddingBottom: 40
  },
  // Header
  header: {
    marginBottom: 24
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2933'
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#6B7280'
  },
  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 2
    },
    elevation: 4
  },
  // Input
  inputGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 6,
    fontWeight: '500'
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: '#F9FAFB'
  },
  // Button
  button: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#e58d29',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  // Group selection buttons
  groupButton: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginBottom: 10,
    backgroundColor: '#F9FAFB',
    alignItems: 'center'
  },
  groupButtonSelected: {
    backgroundColor: '#e58d29',
    borderColor: 'skyblue'
  },
  groupButtonText: {
    fontSize: 15,
    color: '#1F2933',
    fontWeight: '500'
  }
});