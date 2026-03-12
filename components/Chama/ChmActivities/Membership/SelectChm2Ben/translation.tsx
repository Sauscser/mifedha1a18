// translation.tsx for SelectChm2Ben (Select Group)
export const translations = {
  en: {
    groupName: 'Group Name',
    memberChamaNumber: 'Member Chama Number',
    groupBenefits: 'Group Benefits',
    chamaPhone: 'Chama Phone',
    membershipStatus: 'Membership Status',
    errorFetchingUserData: 'Error fetching user data:',
  },
  ar: {}, zh: {}, ru: {}, sw: {}, fr: {}, es: {}, de: {}, pt: {}, it: {}, he: {}, hi: {}, am: {}
};

export const useTranslation = () => {
  // Dummy hook for translation pattern
  const lang = 'en';
  const t = translations[lang];
  return { lang, t };
};
