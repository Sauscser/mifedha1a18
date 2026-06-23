export const SUPPORTED_LANGUAGES = [
  'en', 'ar', 'zh', 'ru', 'sw', 'fr', 'es', 'de', 'pt', 'it', 'he', 'hi', 'am'
] as const;

export const resources = {
  en: {
    translation: {
      appShell: {
        globalHeader: {
          welcome: 'Welcome, {{username}}',
          signOut: 'Sign Out'
        },
        guard: {
          completeMainAccountTitle: 'Main account setup required',
          completeMainAccountSetup: 'Please complete Main Account setup first before exploring other products.'
        },
        tabs: {
          home: 'Home',
          nsNdogo: 'NSNdogo',
          howTo: 'HowTo',
          transport: 'Transport',
          goShopping: 'GoShopping',
          searchPal: 'Pal'
        },
        drawer: {
          homes: 'Homes',
          reference: 'Reference',
          mfnDogos: 'Ndogo',
          kubwa: 'Kubwa',
          advocate: 'Money Advocate',
          admin2: 'Money Admin 2',
          bankAdmin: 'Money Bank Admin',
          admin1: 'Money Admin 1'
        }
      },
      labels: {
        mf: 'MF', // English
        ndogo: 'Ndogo',
        pal: 'Friend',
        kubwa: 'Kubwa',
        advocate: 'Advocate',
        admin: 'Admin',
        bank: 'Bank'
      },
      AddCOMBAuditor: {
        headerTitle: 'Register COMB Officer',
        headerSub: 'Institution Portal',
        emailLabel: 'COMB Officer Email',
        emailPlaceholder: 'email@example.com',
        clientLabel: "Auditor's Client",
        clientPlaceholder: "Company's Account Number",
        passwordLabel: 'Main Account Password',
        passwordPlaceholder: 'Main Account Password',
        show: 'Show',
        hide: 'Hide',
        button: 'Register COMB Officer',
        success: 'You have been registered as a COMB Officer under Institution {{usr}} successfully.',
        error_wrongPasswordOrAccountDoesNotExist: 'Wrong password or account does not exist!',
        error_accessDeniedOrNetworkError: 'Access denied or network error.',
        error_auditorEmailDoesNotExist: 'The specified auditor email does not exist in the system.',
        error_failedToRegisterAuditorPleaseTryAgain: 'Failed to register auditor. Please try again.',
        successMsg_combOfficerRegisteredSuccessfully: 'You have been registered as a COMB Officer under Institution {{usr}} successfully.'
        },
        consumerApproveVoucher: {
          priceInDifferentCurrencies: '💰 Price in Different Currencies:',
          yourCurrency: '🛒 Your Currency ({{currency}}): {{amount}}',
          funderCurrency: '💳 Funder Currency ({{currency}}): {{amount}}',
          sellerCurrency: '🏪 Seller Currency ({{currency}}): {{amount}}',
          unitPrice: 'Unit Price:',
          numberOfItems: 'Number of Items:',
          funderDetails: 'Funder Details:',
          account: 'Account:',
          name: 'Name:',
          contact: 'Contact:',
          email: 'Email:',
          sellerDetails: 'Seller Details:',
          sellerDeviation: 'Seller Deviation: {{deviation}} | Policy: {{policy}}%',
          mifedhaMarketDeviation: 'MiFedha Market Deviation: {{deviation}} | Policy: {{policy}}%',
          generalMarketPriceDeviation: 'General Market Price Deviation: {{deviation}} | Policy: {{policy}}%',
          status: 'Status:',
          approve: 'Approve',
          decline: 'Decline',
          approveVoucher: 'Approve Voucher',
          declineVoucher: 'Decline Voucher',
          confirmApprove: 'Are you sure you want to Approve this voucher from {{sellerName}}?',
          confirmDecline: 'Are you sure you want to Decline this voucher from {{sellerName}}?',
          cancel: 'Cancel',
          processingVoucher: 'Processing voucher...',
          loadingVouchers: 'Loading vouchers...',
          noPendingVouchers: 'No pending vouchers found.',
          remainingFunds: 'Remaining Funds',
          consumer: 'Consumer:',
          seller: 'Seller:',
          funder: 'Funder:',
          voucherApproved: 'Voucher successfully approved',
          insufficientFunds: 'Insufficient funds',
          error: 'Error',
          couldNotLoadVouchers: 'Could not load vouchers. {{error}}',
          couldNotUpdateVoucher: 'Could not update voucher. {{error}}',
          declinedWindowClosed: 'Declined! Voucher approval window closed.'
      }
    }
  },
  ar: {
    translation: {
      appShell: {
        globalHeader: {
          welcome: 'مرحبًا، {{username}}',
          signOut: 'تسجيل الخروج'
        },
        guard: {
          completeMainAccountTitle: 'يتطلب إعداد الحساب الرئيسي',
          completeMainAccountSetup: 'يرجى إكمال إعداد الحساب الرئيسي أولاً قبل استكشاف المنتجات الأخرى.'
        },
        tabs: {
          home: 'الرئيسية',
          mfnDogo: 'ندوقو',
          howTo: 'كيف',
          transport: 'النقل',
          goShopping: 'تسوق',
          searchPal: 'صديق'
        },
        drawer: {
          homes: 'الرئيسية',
          reference: 'مرجع',
          mfnDogos: 'ندوقو',
          kubwa: 'كوبا',
          advocate: 'محامي المال',
          admin2: 'مسؤول المال 2',
          bankAdmin: 'مسؤول بنك المال',
          admin1: 'مسؤول المال 1'
        }
      },
      labels: {
        mf: 'مي ف', // Arabic
        ndogo: 'ندوقو',
        pal: 'صديق',
        kubwa: 'كوبا',
        advocate: 'وكيل',
        admin: 'المسؤول',
        bank: 'بنك'
      }
    }
  },
  zh: {
    translation: {
      appShell: {
        globalHeader: {
          welcome: '欢迎，{{username}}',
          signOut: '退出登录'
        },
        guard: {
          completeMainAccountTitle: '需要完成主账户设置',
          completeMainAccountSetup: '请先完成主账户设置，然后再浏览其他产品。'
        },
        tabs: {
          home: '首页',
          mfnDogo: '恩多戈',
          howTo: '如何',
          transport: '交通',
          goShopping: '购物',
          searchPal: '朋友'
        },
        drawer: {
          homes: '首页',
          reference: '参考',
          mfnDogos: '恩多戈',
          kubwa: '库巴',
          advocate: '资金倡导者',
          admin2: '资金管理员 2',
          bankAdmin: '资金银行管理员',
          admin1: '资金管理员 1'
        }
      },
      labels: {
        mf: 'MF', // Chinese
        ndogo: '恩多戈',
        pal: '朋友',
        kubwa: '库巴',
        advocate: '倡导者',
        admin: '管理员',
        bank: '银行'
      }
    }
  },
  ru: {
    translation: {
      appShell: {
        globalHeader: {
          welcome: 'Добро пожаловать, {{username}}',
          signOut: 'Выйти'
        },
        guard: {
          completeMainAccountTitle: 'Требуется настройка основного аккаунта',
          completeMainAccountSetup: 'Пожалуйста, сначала завершите настройку основного аккаунта, прежде чем переходить к другим продуктам.'
        },
        tabs: {
          home: 'Главная',
          mfnDogo: 'Ндого',
          howTo: 'Как',
          transport: 'Транспорт',
          goShopping: 'Покупки',
          searchPal: 'Друг'
        },
        drawer: {
          homes: 'Главная',
          reference: 'Справка',
          mfnDogos: 'Ндого',
          kubwa: 'Кубва',
          advocate: 'Адвокат денег',
          admin2: 'Админ денег 2',
          bankAdmin: 'Админ банка денег',
          admin1: 'Админ денег 1'
        }
      },
      labels: {
        mf: 'МФ', // Russian
        ndogo: 'Ндого',
        pal: 'Друг',
        kubwa: 'Кубва',
        advocate: 'Адвокат',
        admin: 'Админ',
        bank: 'Банк'
      }
    }
  },
  sw: {
    translation: {
      appShell: {
        globalHeader: {
          welcome: 'Karibu, {{username}}',
          signOut: 'Toka'
        },
        guard: {
          completeMainAccountTitle: 'Inahitajika usanidi wa Akaunti Kuu',
          completeMainAccountSetup: 'Tafadhali kamilisha usanidi wa Akaunti Kuu kwanza kabla ya kuchunguza bidhaa nyingine.'
        },
        tabs: {
          home: 'Nyumbani',
          mfnDogo: 'Ndogo',
          howTo: 'Jinsi ya',
          transport: 'Usafiri',
          goShopping: 'Nunua',
          searchPal: 'Rafiki'
        },
        drawer: {
          homes: 'Nyumbani',
          reference: 'Marejeo',
          mfnDogos: 'Ndogo',
          kubwa: 'Kubwa',
          advocate: 'Wakili wa Fedha',
          admin2: 'Msimamizi wa Fedha 2',
          bankAdmin: 'Msimamizi wa Benki ya Fedha',
          admin1: 'Msimamizi wa Fedha 1'
        }
      },
      labels: {
        mf: 'MF', // Swahili
        ndogo: 'Ndogo',
        pal: 'Rafiki',
        kubwa: 'Kubwa',
        advocate: 'Wakili',
        admin: 'Msimamizi',
        bank: 'Benki'
      },
      AddCOMBAuditor: {
        headerTitle: 'Sajili Afisa wa COMB',
        headerSub: 'Portal ya Taasisi',
        emailLabel: 'Barua Pepe ya Afisa wa COMB',
        emailPlaceholder: 'barua@example.com',
        clientLabel: 'Mteja wa Mkaguzi',
        clientPlaceholder: 'Nambari ya Akaunti ya Kampuni',
        passwordLabel: 'Nenosiri la Akaunti Kuu',
        passwordPlaceholder: 'Nenosiri la Akaunti Kuu',
        show: 'Onyesha',
        hide: 'Ficha',
        button: 'Sajili Afisa wa COMB',
        success: 'Umesajiliwa kama Afisa wa COMB chini ya Taasisi {{usr}} kwa mafanikio.',
        error_wrongPasswordOrAccountDoesNotExist: 'Nenosiri au akaunti si sahihi!',
        error_accessDeniedOrNetworkError: 'Umefungiwa au hitilafu ya mtandao.',
        error_auditorEmailDoesNotExist: 'Barua pepe ya mkaguzi haipo kwenye mfumo.',
        error_failedToRegisterAuditorPleaseTryAgain: 'Imeshindikana kusajili mkaguzi. Tafadhali jaribu tena.',
        successMsg_combOfficerRegisteredSuccessfully: 'Umesajiliwa kama Afisa wa COMB chini ya Taasisi {{usr}} kwa mafanikio.'
      }
    }
  },
  fr: {
    translation: {
      appShell: {
        globalHeader: {
          welcome: 'Bienvenue, {{username}}',
          signOut: 'Déconnexion'
        },
        guard: {
          completeMainAccountTitle: 'Configuration du compte principal requise',
          completeMainAccountSetup: "Veuillez terminer d'abord la configuration du compte principal avant d'explorer les autres produits."
        },
        tabs: {
          home: 'Accueil',
          mfnDogo: 'Ndogo',
          howTo: 'Comment',
          transport: 'Transport',
          goShopping: 'Shopping',
          searchPal: 'Ami'
        },
        drawer: {
          homes: 'Accueil',
          reference: 'Référence',
          mfnDogos: 'Ndogo',
            kubwa: 'Kubwa',
          advocate: 'Avocat de l’Argent',
          admin2: 'Admin d’Argent 2',
          bankAdmin: 'Admin Banque d’Argent',
          admin1: 'Admin d’Argent 1'
        }
      },
      labels: {
        mf: 'MF', // French
        ndogo: 'Ndogo',
        pal: 'Ami'
      }
    }
  },
  es: {
    translation: {
      appShell: {
        globalHeader: {
          welcome: 'Bienvenido, {{username}}',
          signOut: 'Cerrar sesión'
        },
        guard: {
          completeMainAccountTitle: 'Se requiere configuración de la Cuenta Principal',
          completeMainAccountSetup: 'Por favor, complete primero la configuración de la Cuenta Principal antes de explorar otros productos.'
        },
        tabs: {
          home: 'Inicio',
          mfnDogo: 'Ndogo',
          howTo: 'Cómo',
          transport: 'Transporte',
          goShopping: 'Compras',
          searchPal: 'Amigo'
        },
        drawer: {
          homes: 'Inicio',
          reference: 'Referencia',
          mfnDogos: 'Ndogo',
            kubwa: 'Kubwa',
          advocate: 'Abogado de Dinero',
          admin2: 'Admin de Dinero 2',
          bankAdmin: 'Admin Banco de Dinero',
          admin1: 'Admin de Dinero 1'
        }
      },
      labels: {
        mf: 'MF', // Spanish
        ndogo: 'Ndogo',
        pal: 'Amigo'
      }
    }
  },
  de: {
    translation: {
      appShell: {
        globalHeader: {
          welcome: 'Willkommen, {{username}}',
          signOut: 'Abmelden'
        },
        guard: {
          completeMainAccountTitle: 'Hauptkonto-Einrichtung erforderlich',
          completeMainAccountSetup: 'Bitte schließen Sie zuerst die Einrichtung des Hauptkontos ab, bevor Sie andere Produkte erkunden.'
        },
        tabs: {
          home: 'Startseite',
          mfnDogo: 'Ndogo',
          howTo: 'Wie',
          transport: 'Transport',
          goShopping: 'Einkaufen',
          searchPal: 'Freund'
        },
        drawer: {
          homes: 'Startseite',
          reference: 'Referenz',
          mfnDogos: 'Ndogo',
          kubwa: 'Kubwa',
          advocate: 'Geldanwalt',
          admin2: 'Geldadmin 2',
          bankAdmin: 'Geldbankadmin',
          admin1: 'Geldadmin 1'
        }
      },
      labels: {
        mf: 'MF', // German
        ndogo: 'Ndogo',
        pal: 'Freund'
      }
    }
  },
  pt: {
    translation: {
      appShell: {
        globalHeader: {
          welcome: 'Bem-vindo, {{username}}',
          signOut: 'Sair'
        },
        guard: {
          completeMainAccountTitle: 'Configuração da Conta Principal necessária',
          completeMainAccountSetup: 'Por favor, conclua primeiro a configuração da Conta Principal antes de explorar outros produtos.'
        },
        tabs: {
          home: 'Início',
          mfnDogo: 'Ndogo',
          howTo: 'Como',
          transport: 'Transporte',
          goShopping: 'Compras',
          searchPal: 'Amigo'
        },
        drawer: {
          homes: 'Início',
          reference: 'Referência',
          mfnDogos: 'Ndogo',
          kubwa: 'Kubwa',
          advocate: 'Advogado de Dinheiro',
          admin2: 'Admin de Dinheiro 2',
          bankAdmin: 'Admin Banco de Dinheiro',
          admin1: 'Admin de Dinheiro 1'
        }
      },
      labels: {
        mf: 'MF', // Portuguese
        ndogo: 'Ndogo',
        pal: 'Amigo'
      }
    }
  },
  it: {
    translation: {
      appShell: {
        globalHeader: {
          welcome: 'Benvenuto, {{username}}',
          signOut: 'Disconnettersi'
        },
        guard: {
          completeMainAccountTitle: 'Configurazione dell’account principale richiesta',
          completeMainAccountSetup: 'Per favore completa prima la configurazione dell’account principale prima di esplorare gli altri prodotti.'
        },
        tabs: {
          home: 'Home',
          mfnDogo: 'Ndogo',
          howTo: 'Come',
          transport: 'Trasporto',
          goShopping: 'Shopping',
          searchPal: 'Amico'
        },
        drawer: {
          homes: 'Home',
          reference: 'Riferimento',
            mfnDogos: 'नडोगो',
            kubwa: 'Kubwa',
          advocate: 'Avvocato dei Soldi',
          admin2: 'Admin dei Soldi 2',
          bankAdmin: 'Admin Banca dei Soldi',
          admin1: 'Admin dei Soldi 1'
        }
      },
      labels: {
        mf: 'MF', // Italian
        ndogo: 'Ndogo',
        pal: 'Amico'
      }
    }
  },
  he: {
    translation: {
      appShell: {
        globalHeader: {
          welcome: 'ברוך הבא, {{username}}',
          signOut: 'התנתק'
        },
        guard: {
          completeMainAccountTitle: 'נדרשת הגדרת חשבון ראשי',
          completeMainAccountSetup: 'אנא השלם תחילה את הגדרת החשבון הראשי לפני שתעבור למוצרים אחרים.'
        },
        tabs: {
          home: 'בית',
          mfnDogo: 'נדוגו',
          howTo: 'איך',
          transport: 'תחבורה',
          goShopping: 'קניות',
          searchPal: 'חבר'
        },
        drawer: {
          homes: 'בית',
          reference: 'התייחסות',
          mfnDogos: 'Ndogo',
          kubwa: 'קובה',
          advocate: 'עורך דין הכסף',
          admin2: 'מנהל הכסף 2',
          bankAdmin: 'מנהל בנק הכסף',
          admin1: 'מנהל הכסף 1'
        }
      },
      labels: {
        mf: 'מפ', // Hebrew
        ndogo: 'נדוגו',
        pal: 'חבר'
      }
    }
  },
  hi: {
    translation: {
      appShell: {
        globalHeader: {
          welcome: 'स्वागत है, {{username}}',
          signOut: 'साइन आउट'
        },
        guard: {
          completeMainAccountTitle: 'मुख्य खाता सेटअप आवश्यक है',
          completeMainAccountSetup: 'कृपया अन्य उत्पाद एक्सप्लोर करने से पहले मुख्य खाता सेटअप पूरा करें।'
        },
        tabs: {
          home: 'होम',
          mfnDogo: 'नडोगो',
          howTo: 'कैसे',
          transport: 'परिवहन',
          goShopping: 'खरीदारी',
          searchPal: 'मित्र'
        },
        drawer: {
          homes: 'होम',
          reference: 'संदर्भ',
          mfnDogos: 'Ndogo',
          kubwa: 'कुबवा',
          advocate: 'पैसे का वकील',
          admin2: 'पैसे का एडमिन 2',
          bankAdmin: 'पैसे का बैंक एडमिन',
          admin1: 'पैसे का एडमिन 1'
        }
      },
      labels: {
        mf: 'एमएफ', // Hindi
        ndogo: 'नडोगो',
        pal: 'मित्र'
      }
    }
  },
  am: {
    translation: {
      appShell: {
        globalHeader: {
          welcome: 'እንኳን ደህና መጡ, {{username}}',
          signOut: 'ውጣ'
        },
        guard: {
          completeMainAccountTitle: 'ዋና አካውንት ማቀናበር ይወስዳል',
          completeMainAccountSetup: 'እባክዎ ከሌሎች ምርቶች መመለስ በፊት ዋና አካውንት ማቀናበር ያጠናቀቁ።'
        },
        tabs: {
          home: 'ቤት',
          mfnDogo: 'ንዶጎ',
          howTo: 'እንዴት',
          transport: 'ትራንስፖርት',
          goShopping: 'ግብይት',
          searchPal: 'ጓደኛ'
        },
        drawer: {
          homes: 'ቤት',
          reference: 'ማጣቀሻ',
          mfnDogos: 'נדוגו',
          kubwa: 'ኩባ',
          advocate: 'ገንዘብ ጠበቃ',
          admin2: 'ገንዘብ አስተዳዳሪ 2',
          bankAdmin: 'ገንዘብ ባንክ አስተዳዳሪ',
          admin1: 'ገንዘብ አስተዳዳሪ 1'
        }
      },
      labels: {
        mf: 'ምፍ', // Amharic
        ndogo: 'ንዶጎ',
        pal: 'ጓደኛ'
      }
    }
  }
};



