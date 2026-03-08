export const SUPPORTED_LANGUAGES = ['en', 'sw'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const resources = {
  en: {
    translation: {
      labels: {
        bank: 'Bank', admin: 'Admin', advocate: 'Advocate', ndogo: 'Ndogo', pal: 'Friend', kubwa: 'Kubwa', bankAdmin: 'Bank Admin', mifedha: { m: 'M', i: 'i', f: 'F', e: 'e', d: 'd', h: 'h', a: 'a' }
      },
      numerals: {
        '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9'
      },
      common: { language: { select: 'Select language' } },
      appShell: {
        globalHeader: { welcome: 'Welcome, {{username}}', signOut: 'Sign Out' },
        drawer: {
          homes: 'Homes', mfnDogos: 'NiSenti Ndogos', mfKubwa: 'NSKubwa', advocate: 'NiSenti Advocate', admin2: 'NiSenti Admin 2', bankAdmin: 'Bank Admin', mfBankAdmin: 'NSBankAdmin', admin1: 'NiSenti Admin 1', reference: 'Reference'
        },
        tabs: {
          home: 'Home', mfnDogo: 'NSNdogo', howTo: 'HowTo', transport: 'Transport', goShopping: 'GoShopping', searchPal: 'Search Pal'
        }
      },
      HomeScrn: {
        labels: {
          createAccount: 'Create Account', viewAccount: 'View Account', viewRates: 'View Rates', weAreHumans: 'We are Humans and Being Humane is our Business!', comb: 'Consume On My Bill (COMB)', palPalProducts: 'Pal-Pal Products', chamaProducts: 'Chama Products', businessProducts: 'Business Products', messages: 'Messages', boooom: 'BOOOOM!'
        }
      },
      cognito: {
        signIn: 'Sign In', signUp: 'Sign Up', forgotPassword: 'Forgot Password?', resetPassword: 'Reset Password', confirmSignIn: 'Confirm Sign In', confirmSignUp: 'Confirm Sign Up', resendCode: 'Resend Code', sendCode: 'Send Code', backToSignIn: 'Back to Sign In', submit: 'Submit', skip: 'Skip', changePassword: 'Change Password', password: 'Password', newPassword: 'New Password', confirmPassword: 'Confirm Password', username: 'Username', email: 'Email', phoneNumber: 'Phone Number', code: 'Code', required: 'This field is required', invalidEmail: 'Invalid email address', invalidPhone: 'Invalid phone number', passwordRequirements: 'Password must have at least 8 characters', loading: 'Loading...'
      }
    }
  },
  sw: {
    translation: {
      labels: {
        bank: 'Benki', admin: 'Msimamizi', advocate: 'Wakili', ndogo: 'Ndogo', pal: 'Rafiki', kubwa: 'Kubwa', bankAdmin: 'Msimamizi wa Benki', mifedha: { m: 'M', i: 'i', f: 'F', e: 'e', d: 'd', h: 'h', a: 'a' }
      },
      numerals: {
        '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9'
      },
      common: { language: { select: 'Chagua lugha' } },
      appShell: {
        globalHeader: { welcome: 'Karibu, {{username}}', signOut: 'Toka' },
        drawer: {
          homes: 'Nyumbani', mfnDogos: 'NSNdogo', mfKubwa: 'NSKubwa', advocate: 'NiSenti Wakili', admin2: 'NiSenti Admin 2', bankAdmin: 'Msimamizi wa Benki', mfBankAdmin: 'NSBankAdmin', admin1: 'NiSenti Admin 1', reference: 'Marejeo'
        },
        tabs: {
          home: 'Nyumbani', mfnDogo: 'NSNdogo', howTo: 'Jinsi ya', transport: 'Usafiri', goShopping: 'Nunua', searchPal: 'Tafuta Pal'
        }
      },
      HomeScrn: {
        labels: {
          createAccount: 'Fungua Akaunti', viewAccount: 'Tazama Akaunti', viewRates: 'Tazama Viwango', weAreHumans: 'Sisi ni Binadamu na Ubinadamu ni Biashara Yetu!', comb: 'Tumia Bili Yangu (COMB)', palPalProducts: 'Bidhaa za Rafiki-Rafiki', chamaProducts: 'Bidhaa za Chama', businessProducts: 'Bidhaa za Biashara', messages: 'Ujumbe', boooom: 'BOOOOM!'
        }
      },
      cognito: {
        signIn: 'Ingia', signUp: 'Jisajili', forgotPassword: 'Umesahau Nenosiri?', resetPassword: 'Weka upya Nenosiri', confirmSignIn: 'Thibitisha Kuingia', confirmSignUp: 'Thibitisha Usajili', resendCode: 'Tuma tena msimbo', sendCode: 'Tuma msimbo', backToSignIn: 'Rudi kwenye Kuingia', submit: 'Wasilisha', skip: 'Ruka', changePassword: 'Badilisha Nenosiri', password: 'Nenosiri', newPassword: 'Nenosiri Jipya', confirmPassword: 'Thibitisha Nenosiri', username: 'Jina la mtumiaji', email: 'Barua pepe', phoneNumber: 'Nambari ya Simu', code: 'Msimbo', required: 'Sehemu hii inahitajika', invalidEmail: 'Barua pepe batili', invalidPhone: 'Nambari ya simu batili', passwordRequirements: 'Nenosiri lazima liwe na angalau herufi 8', loading: 'Inapakia...'
      }
    }
  }
} as const;
