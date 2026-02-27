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
        tabs: {
          home: 'Home',
          mfnDogo: 'MFNdogo',
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
          mfnDogos: 'M F N d o g o',
            kubwa: 'كوبا',
          advocate: 'محامي المال',
          admin2: 'مسؤول المال 2',
          bankAdmin: 'مسؤول بنك المال',
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
        admin: ' المسؤول',
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
        tabs: {
          home: '首页',
          mfnDogo: '恩多戈',
            mfnDogos: 'ንዶጎ',
          transport: '交通',
          goShopping: '购物',
          searchPal: '朋友'
        },
        drawer: {
          homes: '首页',
          reference: '参考',
          mfnDogos: 'ندوقو',
            kubwa: '库巴',
          advocate: '资金倡导者',
          admin2: '资金管理员 2',
          bankAdmin: '资金银行管理员',
            bankAdmin: '资金银行管理员',
          admin1: '资金管理员 1'
        }
      },
      labels: {
        mf: 'एमएफ', // Hindi
        ndogo: 'नडोगो',
        pal: 'मित्र'
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
          mfnDogos: '恩多戈',
            kubwa: 'Кубва',
          advocate: 'Адвокат денег',
          admin2: 'Админ денег 2',
          bankAdmin: 'Админ банка денег',
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
          mfnDogos: 'Ндого',
            kubwa: 'كوبا',
          advocate: 'Wakili wa Fedha',
          admin2: 'Msimamizi wa Fedha 2',
          bankAdmin: 'Msimamizi wa Benki ya Fedha',
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



