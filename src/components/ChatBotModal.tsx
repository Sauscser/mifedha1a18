import React, { useState, useRef, useEffect } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useChatBot } from '../contexts/ChatBotContext';
import { useTranslation } from 'react-i18next';
import { PRODUCTS, getProductsByKeyword, isGreeting, getGreeting } from '../utils/productDatabase';

const { height: screenHeight } = Dimensions.get('window');

interface ChatTranslations {
  [key: string]: string;
}

export const getTransportClarificationResponse = (query: string): string | null => {
  const normalized = query
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d"'`]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return null;
  }

  const hasTransportIntent = /\b(transport|delivery|shipping|courier|driver|logistics|freight|send goods|send parcel|deliver goods|move goods|cargo|ride|taxi|cab|boda|bodaboda|motorcycle|vehicle)\b/.test(normalized);
  if (!hasTransportIntent) {
    return null;
  }

  const isSpecificEnough = /\b(track|tracking|status|dispatch|seller|buyer|register transport|register as transporter|accept transport request|request a ride|book a ride|book taxi|taxi booking|send package|send parcel|deliver package|delivery of goods|goods delivery|pickup|drop off|dropoff|cancel delivery)\b/.test(normalized);
  if (isSpecificEnough) {
    return null;
  }

  return '🚕 Are you looking for a taxi or delivery of goods?\n\nReply with "taxi" for a passenger ride or "goods" for delivery.';
};

const chatTranslations: Record<string, ChatTranslations> = {
  en: {
    title: 'NiSenti Navigator',
    placeholder: 'Ask me anything about our products...',
    send: 'Send',
    clear: 'Clear',
    welcome: 'Welcome to NiSenti! 👋 Ask me about our products. Say "Hi" or "Help" to get started.',
    productsFound: 'Found matching product:',
    navigate: 'Go to',
    learnMore: 'Learn more',
    noMatch: 'I didn\'t quite understand that. Try asking about Transport, Pal-Pal Loans, Chama, Credit Sales, or COMB.',
    error: 'Sorry, something went wrong. Please try again.'
  },
  ar: {
    title: 'ملاح NiSenti',
    placeholder: 'اسأل عن المنتجات...',
    send: 'إرسال',
    clear: 'مسح',
    welcome: 'مرحبا! 👋 مرحبا بك في NiSenti. يمكنني مساعدتك في الانتقال إلى أي منتج والتعرف على ما نقدمه.',
    productsFound: 'وجدت هذه المنتجات لك:',
    navigate: 'انتقل إلى',
    learnMore: 'اعرف أكثر',
    noMatch: 'لم أجد منتج مطابق. حاول السؤال عن قروض Pal-Pal أو مجموعات Chama أو Credit Sales أو COMB.',
    error: 'عذراً، حدث خطأ ما. يرجى المحاولة مرة أخرى.'
  },
  zh: {
    title: 'NiSenti导航器',
    placeholder: '询问产品...',
    send: '发送',
    clear: '清除',
    welcome: '你好！👋 欢迎来到NiSenti。我可以帮您导航到任何产品并了解我们提供的服务。',
    productsFound: '我为您找到了这些产品：',
    navigate: '转到',
    learnMore: '了解更多',
    noMatch: '我没有找到匹配的产品。尝试询问Pal-Pal贷款、Chama小组、Credit Sales或COMB。',
    error: '抱歉，出了点问题。请重试。'
  },
  ru: {
    title: 'Навигатор NiSenti',
    placeholder: 'Спросите о продуктах...',
    send: 'Отправить',
    clear: 'Очистить',
    welcome: 'Привет! 👋 Добро пожаловать в NiSenti. Я могу помочь вам перейти к любому продукту и узнать больше о том, что мы предлагаем.',
    productsFound: 'Я нашел для вас эти продукты:',
    navigate: 'Перейти на',
    learnMore: 'Узнать больше',
    noMatch: 'Я не нашел подходящего продукта. Попробуйте спросить о кредитах Pal-Pal, группах Chama, Credit Sales или COMB.',
    error: 'Извините, что-то пошло не так. Пожалуйста, попробуйте еще раз.'
  },
  sw: {
    title: 'Mkurugenzi wa NiSenti',
    placeholder: 'Uliza kuhusu bidhaa...',
    send: 'Tuma',
    clear: 'Futa',
    welcome: 'Habari! 👋 Karibu kwenye NiSenti. Naweza kukusaidia kuingia kwa bidhaa yoyote na kujifunza zaidi kuhusu kile tunachotoa.',
    productsFound: 'Nimekuta bidhaa hizi kwa ajili yako:',
    navigate: 'Nenda kwa',
    learnMore: 'Jifunze zaidi',
    noMatch: 'Sikupata bidhaa inayolingana. Jaribu kuuliza kuhusu mikopo ya Pal-Pal, vikundi vya Chama, Credit Sales, au COMB.',
    error: 'Karibu, kitu kimekauka. Tafadhali jaribu tena.'
  },
  fr: {
    title: 'Navigateur NiSenti',
    placeholder: 'Posez des questions sur les produits...',
    send: 'Envoyer',
    clear: 'Effacer',
    welcome: 'Bonjour! 👋 Bienvenue dans NiSenti. Je peux vous aider à naviguer vers n\'importe quel produit et en savoir plus sur ce que nous proposons.',
    productsFound: 'J\'ai trouvé ces produits pour vous:',
    navigate: 'Aller à',
    learnMore: 'En savoir plus',
    noMatch: 'Je n\'ai trouvé aucun produit correspondant. Essayez de demander des prêts Pal-Pal, des groupes Chama, Credit Sales ou COMB.',
    error: 'Désolé, quelque chose s\'est mal passé. Veuillez réessayer.'
  },
  es: {
    title: 'Navegador NiSenti',
    placeholder: 'Pregunte sobre productos...',
    send: 'Enviar',
    clear: 'Limpiar',
    welcome: '¡Hola! 👋 Bienvenido a NiSenti. Puedo ayudarte a navegar a cualquier producto y aprender más sobre lo que ofrecemos.',
    productsFound: 'Encontré estos productos para ti:',
    navigate: 'Ir a',
    learnMore: 'Aprende mas',
    noMatch: 'No encontré un producto coincidente. Intenta preguntar sobre préstamos Pal-Pal, grupos Chama, Credit Sales o COMB.',
    error: 'Lo sentimos, algo salió mal. Por favor, inténtelo de nuevo.'
  },
  de: {
    title: 'NiSenti-Navigator',
    placeholder: 'Fragen Sie nach Produkten...',
    send: 'Senden',
    clear: 'Löschen',
    welcome: 'Hallo! 👋 Willkommen bei NiSenti. Ich kann Ihnen dabei helfen, zu einem beliebigen Produkt zu navigieren und mehr über unser Angebot zu erfahren.',
    productsFound: 'Ich habe diese Produkte für Sie gefunden:',
    navigate: 'Gehen Sie zu',
    learnMore: 'Mehr erfahren',
    noMatch: 'Ich habe kein passendes Produkt gefunden. Versuchen Sie, nach Pal-Pal-Darlehen, Chama-Gruppen, Credit Sales oder COMB zu fragen.',
    error: 'Entschuldigung, etwas ist schief gelaufen. Bitte versuchen Sie es erneut.'
  },
  pt: {
    title: 'Navegador NiSenti',
    placeholder: 'Pergunte sobre produtos...',
    send: 'Enviar',
    clear: 'Limpar',
    welcome: 'Olá! 👋 Bem-vindo ao NiSenti. Posso ajudá-lo a navegar para qualquer produto e aprender mais sobre o que oferecemos.',
    productsFound: 'Encontrei esses produtos para você:',
    navigate: 'Ir para',
    learnMore: 'Saiba mais',
    noMatch: 'Não encontrei um produto correspondente. Tente perguntar sobre empréstimos Pal-Pal, grupos Chama, Credit Sales ou COMB.',
    error: 'Desculpe, algo deu errado. Por favor, tente novamente.'
  },
  it: {
    title: 'Navigatore NiSenti',
    placeholder: 'Domande sui prodotti...',
    send: 'Inviare',
    clear: 'Cancella',
    welcome: 'Ciao! 👋 Benvenuto in NiSenti. Posso aiutarti a navigare verso qualsiasi prodotto e scoprire di più su ciò che offriamo.',
    productsFound: 'Ho trovato questi prodotti per te:',
    navigate: 'Vai a',
    learnMore: 'Scopri di più',
    noMatch: 'Non ho trovato un prodotto corrispondente. Prova a chiedere informazioni su prestiti Pal-Pal, gruppi Chama, Credit Sales o COMB.',
    error: 'Scusa, qualcosa è andato storto. Per favore riprova.'
  },
  he: {
    title: 'ניווט NiSenti',
    placeholder: 'שאל על מוצרים...',
    send: 'שלח',
    clear: 'נקה',
    welcome: 'שלום! 👋 ברוכים הבאים ל-NiSenti. אני יכול לעזור לך לנווט לכל מוצר ולגלות עוד מה אנחנו מציעים.',
    productsFound: 'מצאתי את המוצרים הללו עבורך:',
    navigate: 'עבור ל',
    learnMore: 'גלה עוד',
    noMatch: 'לא מצאתי מוצר תואם. נסה לשאול על הלוואות Pal-Pal, קבוצות Chama, Credit Sales או COMB.',
    error: 'סורי, משהו השתבש. בבקשה נסה שוב.'
  },
  hi: {
    title: 'NiSenti नेविगेटर',
    placeholder: 'उत्पादों के बारे में पूछें...',
    send: 'भेजना',
    clear: 'साफ़ करना',
    welcome: 'नमस्ते! 👋 NiSenti में आपका स्वागत है। मैं आपको किसी भी उत्पाद पर नेविगेट करने में मदद कर सकता हूं और जान सकता हूं कि हम क्या पेश करते हैं।',
    productsFound: 'मैंने आपके लिए ये उत्पाद पाए:',
    navigate: 'पर जाएं',
    learnMore: 'और जानें',
    noMatch: 'मुझे कोई मेल खाने वाला उत्पाद नहीं मिला। Pal-Pal ऋण, Chama समूह, क्रेडिट बिक्री, या COMB के बारे में पूछने का प्रयास करें।',
    error: 'खेद है, कुछ गलत हुआ। कृपया दोबारा कोशिश करें।'
  },
  am: {
    title: 'NiSenti መሪ',
    placeholder: 'ስለ ምርቶች ጠይቅ...',
    send: 'ላክ',
    clear: 'ንጽፍ',
    welcome: 'ሰላም! 👋 ወደ NiSenti እንኳን ደህና መጡ። ወደ ማንኛውም ምርት ዋሃ ወይም ምን እንደምንሰጠው ማወቅ ይችላሉ።',
    productsFound: 'በእርስዎ ዓላማ እነዚህ ምርቶች አገኘሁ:',
    navigate: 'ወደ',
    learnMore: 'ተጨማሪ ይወቁ',
    noMatch: 'አንድ ተዛማጅ ምርት ኖሮ አልገኘሁም። Pal-Pal ብድር፣ Chama ቡድን፣ ክሬዲት ሽያጩ ወይም COMB ስለ ጠይቅ።',
    error: 'ይቅርታ፣ አንዳንድ ነገር ተመልሰዋል። ደግሞ ሞክር።'
  }
};

interface ChatBotModalProps {
  onNavigate?: (screenName: string) => void;
}

export const ChatBotModal: React.FC<ChatBotModalProps> = ({ onNavigate }) => {
  const { isOpen, messages, isLoading, closeChat, addMessage, setLoading, clearMessages } = useChatBot();
  const [navigationHint, setNavigationHint] = useState<string | null>(null);
  const [showNavButton, setShowNavButton] = useState(false);
  const [navigateTarget, setNavigateTarget] = useState<string | null>(null);
  const [lastNavigationTarget, setLastNavigationTarget] = useState<string | null>(null);
  const { i18n } = useTranslation();
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navPulse = useRef(new Animated.Value(1)).current;

  const lang = i18n.language?.split('-')[0] || 'en';
  const t = chatTranslations[lang] || chatTranslations.en;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  useEffect(() => {
    if (!showNavButton) {
      navPulse.setValue(1);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(navPulse, { toValue: 1.05, duration: 600, useNativeDriver: true }),
        Animated.timing(navPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );

    pulse.start();
    return () => pulse.stop();
  }, [showNavButton, navPulse]);

  const handleNavButtonPress = () => {
    if (!navigateTarget || !onNavigate) return;
    onNavigate(navigateTarget);
    setShowNavButton(false);
    setNavigationHint(null);
    setNavigateTarget(null);
    clearMessages();
    closeChat();
  };

  const processUserQuery = async (query: string) => {
    if (!query.trim() || isProcessing) return;

    setIsProcessing(true);
    addMessage(query, 'user');
    setInputText('');
    setLoading(true);

    try {
      // Simulate AI thinking
      await new Promise(resolve => setTimeout(resolve, 800));

      const lowerQuery = query.toLowerCase();
      // Normalized query to handle common typos and alternate spellings
      const normalizedQuery = lowerQuery
        .replace(/withdrawl|withdrawls|withdrwal|withdrw/g, 'withdrawal')
        .replace(/withdrwls|wthdrwl|wthdrw/g, 'withdrawal')
        .replace(/depsoit|depositss|depsoits/g, 'deposit')
        .replace(/remitance|remmit|remittancess/g, 'remittance')
        .replace(/signup|sign up|registers?/g, 'register')
        .replace(/[\u2018\u2019\u201c\u201d"'`]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const queryToSearch = normalizedQuery;
      const queryTokens = queryToSearch.split(' ').filter(Boolean);
      const matchesPhrase = (phrase: string) => {
        const normalizedPhrase = phrase.toLowerCase().trim();
        if (!normalizedPhrase) return false;
        if (queryToSearch.includes(normalizedPhrase)) return true;
        const phraseTokens = normalizedPhrase.split(' ').filter(Boolean);
        return phraseTokens.length > 0 && phraseTokens.every(token => queryTokens.includes(token));
      };
      let botResponse = '';
      let navigateProduct: string | null = null;
      const getFriendlyScreenLabel = (screenName: string | null) => {
        if (!screenName) return null;

        const friendlyMap: Record<string, string> = {
          NSNdogo: 'Ndogo',
          ElimDpstss: 'View Deposits',
          ChamaScreen: 'Groups products',
          Vw2SelectChm2Req: 'Request Loan',
          ChamaVw2DelLnReqs: 'Delete Loan Request',
          VwGrp2LnCov: 'Give Member Advance',
          Vw2FloatGrpLoans: 'Float Group Loans',
          Vw2SignLoanRequests: 'Approve Member Loan',
          ChmSignInss: 'Group Debts Status',
          ChmLnsRec: 'Member Debts Status',
          AddChmMembrsss: 'Register Member',
          SgnIn2RemoveMmbrs: 'Deregister Member',
          ViewGrp2ConfirmDividends: 'View Group Remittances',
          ChamaMmbrRemts: 'View My Remittances',
          ViewGrp2ShareDividends: 'View Members',
          ChmMmbrMmbrss: 'View My Groups',
          ViewGrpApplications: 'Create Group Account',
          DissolveChms: 'Dissolve Group',
          ChamSignIn3s: 'View Group Account',
          Sgn2CnfrmWthdrwlsss: 'Signatory 2 Confirm Withdrawals',
          SignitoryWthdrwFndsss: 'Signatory 3 Confirm Withdrawals',
          SgnIn2VwChmDpstss: 'View Group Deposits',
          SgnIn2VwChmWthdrwlss: 'View Group Withdrawals',
          
          /* Business / Credit Sales routes */
          CredSlsScreen: 'Business products',
          CrtBusinesss: 'Create Business',
          AddPersonels: 'Register Sales Officer',
          RmvPersonnelss: 'Deregister Sales Officer',
          BiznaReqstPage1: 'Make Credit Sales Request',
          Vw2GrntPal2Pal: 'Grant Credit Sales (Pal to Pal)',
          Vw2GrntPal2Biz: 'Grant Credit Sales (Pal to Biz)',
          PersonelVw2GrntB2P: 'Grant Credit Sales (Biz to Pal)',
          PersonelVw2GrntB2B: 'Grant Credit Sales (Biz to Biz)',
          VwBiz2PalLners: 'BizPal Loaners',
          VwBiz2PalLnees: 'BizPal Loanees',
          VwBizLners: 'BizBiz Loaners',
          VwBizLnees: 'BizBiz Loanees',
          VwPalLners: 'PalPal Loaners',
          VwPalLnees: 'PalPal Loanees',
          VwPal2BizLners: 'PalBiz Loaners',
          VwPal2BizLnees: 'PalBiz Loanees',
          PayCash: 'Cash Sales',
          SellerPartialPayRecords: 'Seller Partial Pay Records',
          MakeBizDpsts: 'Make Deposits',
          VwBizDpsts: 'View Deposits',
          ShareCredSlsRevss: 'Send Cash to Pal',
          ShareCredSlsRev2Biz: 'Send Cash to Biz',
          ViewBiznaShareSent2Pal: 'View Cash Sent to Pal',
          ViewBiznaShareRecBiz: 'View Cash Received from Biz',
          ViewBiznaShareSent: 'View Cash Sent to Biz',
          giveBizna: 'Transfer Ownership',
          TakeOverBizna: 'Receive Ownership',
          AddBeneficiaryProduct: 'Add Benefit Product',
          ViewBenShares: 'View Business Benefits Shared',
          VwBenToShare: 'Share Business Benefits',
          ViewBenProds: 'Link Beneficiary',
          BoostPooledBen: 'Boost Pooled Benefits',
          ViewAsProdCreator: 'View as Product Creator',
          VwBiz2AddItem: 'Add Item',
          VwSlsAds2Remove: 'Delete Sales Item',
          UpdateBizAc: 'Update Business',
          SgnIn2VwBiznass: 'View Business Account',
          CascadePaymentsScreen: 'Cascade Payments',

          /* Additional Chama routes (explicit labels) */
          VwChamaMembers: 'View Chama Members',
          SendMmbrsMny: 'Send Members Money',
          CreateChm: 'Create Group',
          AddChmMembrss: 'Add Member',
          ChmCovLon: 'Member Covered Loan',
          ChmNonCovLon: 'Member Non-covered Loan',
          Contributionsss: 'Group Contributions',
          SndMbrsMny: 'Send Members Money',
          BLChmMmberCov: 'BL Member (Covered)',
          BLChmMmberNonCov: 'BL Member (Non-covered)',
          RemoveChmMbr: 'Remove Member',
          DissolveChm: 'Dissolve Group',
          UpdateChm: 'Update Group',
          ChmSignIns: 'Chama Sign-in',
          ChamSignIn2: 'Chama Sign-in 2',
          ChamSignIn3: 'Chama Sign-in 3',
          ChamSignIn4: 'Chama Sign-in 4',
          ChmLnsGvnOutCov: 'Loans Given Out (Covered)',
          ChmLnsGvnOutNonCov: 'Loans Given Out (Non-covered)',
          ChamaGenInfo: 'Group General Info',
          ChmSignIn5: 'Chama Sign-in 5',
          ChmSignIn6: 'Chama Sign-in 6',
          ChamaRemt: 'Group Remittances',
          ChmContri: 'Group Contributions',
          ChmMmbrs: 'Chama Members',
          ChamaMmbrRemt: 'Member Remittances',
          ChmMmbrContri: 'Member Contributions',
          ChmMmbrMmbrs: 'Member Groups',
          SndChmMbrMny: 'Send To Chama Member',
          ChamaSndMbrMneys: 'Chama Send Member Money',
          SndToChmMbrs: 'Send To Members',
          MmbrSndChms: 'Member Send to Chamas',
          SgnIn2LnMmbr: 'Signatory Approve Member Loan',
          VwChmMbrs2Ln: 'View Members For Loan',
          SgnIn2LnMmbrNonCov: 'Signatory Approve Non-covered Loan',
          VwChmMbrs2NonCovLns: 'View Members Non-covered Loans',
          Vw2RpyCov: 'Repay Covered Loans',
          Vw2RpyNonCov: 'Repay Non-covered Loans',
          SgnIn2BLCov: 'Sign-in to BL (Covered)',
          SgnIn2BLNonCov: 'Sign-in to BL (Non-covered)',
          Vw2BLCov: 'View BL (Covered)',
          Vw2BLNonCov: 'View BL (Non-covered)',
          ChamaSignIn2VwLnRpymnt: 'Chama Loan Repayment Sign-in',
          ChmVwMmbr2Remove: 'View Member To Remove',
          SgnIn2RemoveMmbr: 'Sign-in Remove Member',
          Vw2BLChmCov: 'View BL Chama (Covered)',
          Vw2BLChmNonCov: 'View BL Chama (Non-covered)',
          ElimChmVwMbrshpMembr: 'Remove Membership - Member',
          ElimChmVwNonCvLn: 'Remove Non-covered Loan',
          ElimChmVwRmtncMembr: 'Remove Remittance - Member',
          ElimChmVwCovLns: 'Remove Covered Loan',
          ElimChmVwCntrMembr: 'Remove Contributor Member',
          SignitoryWthdrwFndss: 'Signatory Withdraw Funds',
          SignitoryWthdrwFndss3: 'Signatory2 - Confirm Withdrawals',
          SignitoryDeposits: 'Signatory Deposits',
          SgnIn2VwChmDpsts: 'Signatory View Group Deposits',
          VwChmDpsts: 'View Group Deposits',
          VwChmWthdrwls: 'View Group Withdrawals',
          SgnIn2VwChmWthdrwls: 'Signatory View Group Withdrawals',
          ChamaPlaceLnReq: 'Place Loan Request',
          ChamaVw2GrantLnReqCov: 'Grant Loan Requests (Covered)',
          ChamaVw2GrantLnReqNonCov: 'Grant Loan Requests (Non-covered)',
          VwGrp2LnNonCov: 'Give Member Advance (Non-covered)',
          ChmLnsSent: 'Loans Sent',
          ChmLoaneesDtls: 'Loanee Details',
          ChmLoanersDtls: 'Loaner Details',
          PenaliseMember: 'Penalise Member',
          ChamaDtls: 'Chama Details',
          VwMbrSubsDirectly: 'View Member Subscriptions',
          ChmCancelObjection: 'Cancel Objection',
          ChmObject: 'Objection',
          ChmUpdate: 'Update Chama',
          ChmAddAdmin: 'Add Chama Admin',
          MemberReqChm: 'Member Loan Request',
          MemberDtls: 'Member Details',
          ChmMmbrContriss: 'Member Contributions',
          FloatLnReq: 'Float Loan Request',
          VwFloatedLoans: 'View Floated Loans',
          MembersApproveLoans: 'Members Approve Loans',
          ViewMinutes: 'View Minutes'
        };
        // Fallback: pretty-print CamelCase/underscored route names into readable labels
        const pretty = (name: string) => {
          return name
            .replace(/_/g, ' ')
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .replace(/\s+/g, ' ')
            .trim();
        };

        return friendlyMap[screenName] || pretty(screenName);
      };

      // Check for greetings first
      if (isGreeting(lowerQuery)) {
        botResponse = getGreeting(lang);
      }
      // Check if user is asking for help, list products, or "what can you do"
      else if (queryToSearch.match(/^(help|products|services|what can you do|what do you offer|list all|show me all|menu)$/)) {
        botResponse = `📋 **NiSenti Products & Services**\n\n` +
          `1. **Friend Products** 💰 - Pal-Pal peer-to-peer lending\n` +
          `2. **Chama Groups** 👥 - Community savings & investment\n` +
          `3. **Business (Credit Sales)** 📦 - Business credit & trading\n` +
          `4. **GoShopping** 🛍️ - Marketplace shopping with quick checkout or Transport-assisted delivery\n` +
          `5. **COMB** 🛒 - Buy now, pay later shopping\n` +
          `6. **Transport** 🚗 - Fast & safe delivery services\n` +
          `7. **NSNdogo Agents** 🏪 - Deposit & withdraw cash (e-wallet)\n\n` +
          `Ask me: "How do I access GoShopping?" or "What payment options are available for GoShopping?"` ;
      }
      // Check if user is asking about depositing money into their account
      else if (queryToSearch.match(/\b(deposit|deposit money|deposit cash|add money|top up|cash in|cash-in|add funds|put money in wallet|deposit into|fund my account|add money to my wallet)\b/)) {
        const agentProduct = PRODUCTS.find((p) => p.id === 'nsndogo-agent');
        const quickAction = (agentProduct as any)?.quickActions?.find((qa: any) =>
          qa.keywords.some((kw: string) => matchesPhrase(kw))
        );

        if (quickAction) {
          botResponse = quickAction.response[lang] || quickAction.response.en;
          navigateProduct = 'ElimDpstss';
        } else if (agentProduct) {
          navigateProduct = 'ElimDpstss';
          botResponse = `✅ To deposit money, visit any NSNdogo agent in person with your cash and identity card so they can credit your account. After the deposit is completed, open **Friend Products** and go to **Account** → **View Deposits** to confirm the deposit record.`;
        } else {
          botResponse = `📍 **How to deposit money:**\n\n` +
            `Visit an NSNdogo agent in person with your cash and identity card. Once the agent confirms the deposit, open **Friend Products** and use **View Deposits** under the Account section to confirm the transaction.`;
        }
      }

      // Check if user is asking about withdrawing or accessing cash
      else if (queryToSearch.match(/\b(withdraw|withdrawal|cash out|cash-out|take out money|access my money|access money|how can i withdraw|how can i access my money|how do i withdraw|how do i access my money)\b/)) {
        const matchedProducts = getProductsByKeyword(queryToSearch);
        const directNavigation = !!queryToSearch.match(/\b(take me to|go to|open|show( me)?|navigate to|take me|open the|take me there|i want to|i would like to|could you|can you|kindly|will you|would you)\b/);
        const wantsNdogo = !!queryToSearch.match(/\b(ndogo|nsndogo|bottom tab|bottom navigation|bottom nav|tab flow|tab)\b/);

        let product = matchedProducts.length > 0 ? matchedProducts[0] : null;
        if (wantsNdogo) {
          const nsndogoProduct = PRODUCTS.find((p) => p.id === 'nsndogo-agent');
          if (nsndogoProduct) {
            product = nsndogoProduct;
          }
        }

        if (product) {
          // First check if this matches a specific quick action
          const quickAction = (product as any).quickActions?.find((qa: any) =>
            qa.keywords.some((kw: string) => matchesPhrase(kw))
          );

          if (quickAction) {
            botResponse = quickAction.response[lang] || quickAction.response.en;
          } else {
            const guide = (product as any).howToAccess?.[lang] || (product as any).howToAccess?.en;
            botResponse = guide || (`${product.description[lang] || product.description.en}`);
          }

          // Always offer the withdraw navigation target when a product is identified.
          navigateProduct = product.screen;
        } else if (directNavigation && lastNavigationTarget) {
          navigateProduct = lastNavigationTarget;
          botResponse = `Sure — I can take you there. Tap the button below to open ${navigateProduct === 'NSNdogo' ? 'Ndogo' : navigateProduct} now.`;
        } else {
          botResponse = `Which product would you like to navigate to?\n\n` +
            `• **Chama** - Group savings & loans\n` +
            `• **Pal-Pal** - Friend-to-friend loans\n` +
            `• **Credit Sales** - Business credit\n` +
            `• **COMB** - Shop & pay later\n` +
            `• **Transport** - Delivery services\n\n` +
            `Example: "How do I create a Chama?" or "How do I access Transport?"`;
        }
      }
      // Check if asking specifically about shopping / GoShopping
      else if (queryToSearch.match(/\b(shopping|go shopping|marketplace|browse items|search items|cart|buy now|shop now|online shopping|go shopping tab|shopping tab)\b/)) {
        const product = getProductsByKeyword('go-shopping')[0] || PRODUCTS.find((p) => p.id === 'go-shopping');
        const containsPartial = /\b(partial payment|partial pay|partially pay|part payment|payment plan|pay later|partial plan)\b/.test(queryToSearch);
        const containsFull = /\b(full payment|pay full|full amount|complete payment|pay total|pay total amount)\b/.test(queryToSearch);
        const containsTransport = /\b(transport|delivery|shipping|ship|courier|driver|logistics|deliver|transporter)\b/.test(queryToSearch);
        const containsMap = /\b(map|location|nearby|route|map view|map-based|map based)\b/.test(queryToSearch);
        const containsB2B = /\b(b2b|business to business|business-to-business|business to business shopping)\b/.test(queryToSearch);
        const containsB2C = /\b(b2c|business to customer|business-to-customer|business to customer shopping)\b/.test(queryToSearch);
        const containsAccess = /\b(access|open|go to|show|navigate|take me|take me to|open the|show me|i want to|i would like to|could you|can you|kindly|will you|would you)\b/.test(queryToSearch);

        if (containsPartial && containsMap) {
          botResponse = `🗺️ **GoShopping Partial Payment Map**\n\n` +
            `Open the **GoShopping** tab and tap **Partially Pay For Item**. This flow shows sellers on a map so you can choose items and pay bit by bit until the balance is cleared. After the payment clears, you can choose to collect the item or engage Transport.`;
          navigateProduct = 'PartialPayFlow';
        } else if (containsPartial) {
          botResponse = `🛍️ **GoShopping Partial Payment**\n\n` +
            `Use the **GoShopping** tab and choose **Partially Pay For Item**. You pay in installments until the item is fully paid. Once payment clears, the app will then give you the same checkout options: either collect the item yourself or ask Transport to deliver it.`;
          if (containsAccess) {
            navigateProduct = 'PartialPayFlow';
          }
        } else if (containsFull && containsTransport) {
          botResponse = `🚚 **Full Payment with Transport**\n\n` +
            `In **GoShopping**, choose **Pay Full Amount** at checkout. Then select **Purchase (Ask for Transport)** to engage a transporter. NiSenti holds the buyer funds and only forwards payment to the seller once the transporter delivers the order as specified.`;
          if (containsAccess) {
            navigateProduct = 'GoShopping';
          }
        } else if (containsFull) {
          botResponse = `✅ **GoShopping Full Payment**\n\n` +
            `Open the **GoShopping** tab and choose **Pay Full Amount**. At checkout you can either collect the item yourself or engage Transport to deliver it for you.`;
          if (containsAccess) {
            navigateProduct = 'GoShopping';
          }
        } else if (containsB2B || containsB2C) {
          botResponse = `🏷️ **GoShopping Buyer Mode**\n\n` +
            `In **GoShopping**, select your shopping mode before you start. Choose **B2C** for Business-to-Customer shopping, or **B2B** for Business-to-Business shopping. B2B requires selecting your business account first.`;
          if (containsAccess) {
            navigateProduct = 'GoShopping';
          }
        } else if (containsTransport) {
          botResponse = `🚗 **Transport-assisted GoShopping**\n\n` +
            `Use the **GoShopping** tab and choose **Purchase (Ask for Transport)** to have NiSenti engage a transporter. The app holds your funds and only releases payment when delivery is complete.`;
          if (containsAccess) {
            navigateProduct = 'GoShopping';
          }
        } else {
          if (product) {
            const guide = (product as any).howToAccess?.[lang] || (product as any).howToAccess?.en;
            botResponse = guide || (`🛍️ **GoShopping Marketplace**\n\n` +
              `${product.description[lang] || product.description.en}`);
          } else {
            botResponse = `I can help you with GoShopping. Open the GoShopping tab, search for products, and add them to your cart.`;
          }
          if (containsAccess) {
            navigateProduct = 'GoShopping';
          }
        }
      }
      // Check if asking about transport/delivery (robust matching)
      // Recognize many synonyms including taxi/boda/motorcycle/vehicle for rider requests
      else if (queryToSearch.match(/\b(transport|delivery|shipping|send|courier|driver|freight|ride|passenger|rider|ship|parcel|package|track|tracking|where is my|where's my|dispatch|dispatching|dispatch delivery|taxi|boda(?:\s*boda)?|bodaboda|motorcycle|motorbike|vehicle)\b/)) {
        const product = getProductsByKeyword('transport')[0] || PRODUCTS.find((p) => p.id === 'transport');

        // Helper matcher to check many synonyms
        const has = (words: string | string[]) => {
          const list = Array.isArray(words) ? words : [words];
          return list.some(w => matchesPhrase(w));
        };

        const wantsTrack = has(['track', 'tracking', "where is my", "where's my", 'track delivery', 'track parcel', 'tracking number']);
        const wantsTaxi = has(['taxi', 'cab', 'taxi ride', 'book taxi', 'need a taxi', 'passenger ride', 'i am passenger', 'passenger']);
        const wantsRide = has(['ride', 'passenger', 'book a ride', 'need a ride', 'taxi', 'cab', 'uber', 'bolt']);
        const wantsSend = has(['send', 'send parcel', 'send package', 'ship', 'parcel', 'package', 'deliver goods', 'deliver package', 'send goods', 'goods delivery', 'delivery of goods']);
        const isTaxiDriver = has(['taxi driver', 'i am a taxi', 'i am a driver', 'i drive taxi', 'driver', 'taxi owner', 'rider', 'i am taxi', 'i am a cab driver']);
        const isAlreadyRegistered = has(['already registered', 'registered with nisenti', 'i am registered', 'registered', 'yes registered', 'already signed up']);
        const isNotRegistered = has(['not registered', 'not yet registered', 'unregistered', 'no', 'i am not registered', 'not signed up']);
        const wantsIndividualRegistration = has(['individual', 'solo', 'myself', 'personal driver', 'single driver', 'individual registration']);
        const wantsCompanyRegistration = has(['company', 'fleet', 'business', 'transport company', 'company registration']);
        const wantsPassengerTracking = has(['track passenger', 'track my passenger', 'track ride', 'track the ride', 'track trip', 'i want to track', 'track passenger status']);
        const wantsRidePayment = has(['pay for ride', 'pay ride', 'pay for trip', 'i want to pay', 'payment', 'fare payment', 'pay']);
        const wantsTaxiPayment = has(['taxi payment', 'driver payment', 'pay driver', 'fare deduction', 'i want payment', 'who gets paid', 'pay me']);
        const isBuyer = has(['buyer', 'i bought', 'i purchased', 'receive delivery', 'receive order', 'order delivered', 'ask for transport', 'request transport']);
        const isGoodsTransporter = has(['transporter', 'delivery driver', 'deliver goods', 'goods courier', 'i am a transporter', 'i want to deliver goods', 'deliver my goods']);
        const isSeller = has(['seller', 'dispatch', 'dispatch delivery', 'ship out', 'send out my order', 'send order']);
        const isTransporter = has(['transporter', 'driver', 'courier', 'rider', 'delivery person', 'deliveries', 'logistics', 'register transport', 'register as transporter', 'company account', 'transport company']);

        const transportClarification = getTransportClarificationResponse(queryToSearch);
        if (transportClarification && !wantsTrack && !wantsRide && !wantsSend && !isBuyer && !isSeller && !isTransporter) {
          botResponse = transportClarification;
          navigateProduct = 'Transport';
        }
        // Tracking / status requests
        else if (wantsTrack) {
          botResponse = `🔎 **Track Delivery / Ride**\n\n` +
            `To track a delivery or ride, open the Transport tab and select Ride Tracking or the specific transport job. If you have a tracking number or order reference, paste it in the Transport screen to get location and status updates.`;
          navigateProduct = 'RideTrackingScreen';
        }
        // Taxi-specific passenger flow
        else if (wantsTaxi || isTaxiDriver) {
          if (isAlreadyRegistered) {
            if (wantsPassengerTracking || queryToSearch.includes('passenger')) {
              botResponse = `📍 **Passenger tracking**\n\n` +
                `If you are a passenger and want to track the trip, tap the **Passenger** button in the Transport tab. This shows the active ride request and live tracking status.\n\n` +
                `If you want to pay for the ride, the amount is automatically deducted from your account when the rider completes the ride on the app.`;
              navigateProduct = 'PassengerRequestRide';
            } else if (wantsRidePayment || wantsTaxiPayment) {
              botResponse = `💳 **Payment flow**\n\n` +
                `For a passenger, the fare is automatically deducted from their account when the rider clicks **Complete Ride** on the app.\n\n` +
                `For the driver/rider, the same app flow handles the trip payment automatically once the ride is completed. However, if the passenger pays the driver in cash, the driver must remit the company share due to the company.`;
              navigateProduct = 'AcceptRideRequest';
            } else {
              botResponse = `✅ **Taxi driver status**\n\n` +
                `If you are already registered with NiSenti, do you want to **pick up** or **drop off** a passenger?\n\n` +
                `If you are taking a ride request, use the **Rider** button in the Transport tab.\n\n` +
                `**Rider flow:**\n` +
                `1. The driver opens the **Rider** button in the Transport tab.\n` +
                `2. The driver sees incoming passenger requests and can accept one.\n` +
                `3. Once accepted, the trip starts on the map and the driver picks up the passenger.\n` +
                `4. The driver follows the route to the destination.\n` +
                `5. When the destination is reached, the trip is completed and the payment is remitted to the taxi owner.`;
              navigateProduct = 'AcceptRideRequest';
            }
          } else if (isNotRegistered || wantsIndividualRegistration || wantsCompanyRegistration) {
            if (wantsIndividualRegistration || (isNotRegistered && queryToSearch.includes('individual'))) {
              botResponse = `🚕 **Taxi registration – Individual**\n\n` +
                `You are not yet registered with NiSenti. Use the **Register Transport** button on the Transport screen to register as an individual taxi driver.`;
              navigateProduct = 'RegisterTransport';
            } else if (wantsCompanyRegistration || (isNotRegistered && queryToSearch.includes('company'))) {
              botResponse = `🏢 **Taxi registration – Company**\n\n` +
                `You are not yet registered with NiSenti. Use the **Register Transport - Company** button on the Transport screen to register your company fleet.`;
              navigateProduct = 'RegisterTransportBizna';
            } else {
              botResponse = `🚕 **Are you already registered with NiSenti?**\n\n` +
                `If not, are you registering as an **individual** or a **company**?\n\n` +
                `Use the **Register Transport** button for an individual driver, or the **Register Transport - Company** button for a company.`;
              navigateProduct = 'Transport';
            }
          } else {
            botResponse = `🚕 **Taxi Passenger Flow**\n\n` +
              `1. The passenger taps the **Passenger** button in the Transport tab.\n` +
              `2. They are shown any existing requests, or they can create a new ride request.\n` +
              `3. If they create a new request, they select a pickup point on the map and choose from the available taxi cards shown in the carousel.\n` +
              `4. The taxi driver on the other side accepts the request and comes to pick up the passenger.\n` +
              `5. The trip starts on the map, and the driver follows the route to the destination.\n` +
              `6. When the rider reaches the destination, the trip is completed and the money is remitted to the taxi owner.\n\n` +
              `If you are a passenger, tap the **Passenger** button below to continue. If you are a taxi driver, are you already registered with NiSenti?`;
            navigateProduct = 'PassengerRequestRide';
          }
        }
        // Ride / passenger requests
        else if (wantsRide) {
          if (isTransporter) {
            botResponse = `🛵 **Rider / Driver Mode**\n\n` +
              `You can accept passenger ride requests as a Rider. Open the Transport tab and tap the Rider button to view ride requests.`;
            navigateProduct = 'AcceptRideRequest';
          } else if (isSeller) {
            // unlikely but handle
            botResponse = `If you're a seller asking about rides, do you mean passenger rides or delivery rides?`;
            navigateProduct = 'Transport';
          } else {
            botResponse = `🧑‍🤝‍🧑 **Ride / Passenger**\n\n` +
              `If you need a passenger ride, open the Transport tab and use the Customer/Passenger button to request a ride. If you're a driver, open Rider to accept requests.`;
            navigateProduct = 'PassengerRequestRide';
          }
        }
        // Sending goods / delivery
        else if (wantsSend || isBuyer || isSeller || isGoodsTransporter) {
          if (isBuyer || (wantsSend && !isGoodsTransporter && !isSeller)) {
            botResponse = `📦 **Buyer: Goods Delivery**\n\n` +
              `Are you a buyer looking for delivery services, or are you a transporter who wants to deliver goods?\n\n` +
              `If you are the buyer, open the Transport tab and tap the **Ask for Transport** option to request goods delivery.\n\n` +
              `If you are a transporter, use the **View Transport Requests** or **Accept Transport Request** flow to accept delivery jobs.`;
            navigateProduct = 'VwSalesDtls4Transport';
          } else if (isSeller) {
            botResponse = `📤 **Seller: Dispatch Delivery**\n\n` +
              `As a seller, open the Transport tab and tap **${(product as any)?.howToAccess?.[lang] ? 'View Transport Requests to: Dispatch Delivery - Seller' : 'View Transport Requests (Dispatch)'}** to dispatch orders.`;
            navigateProduct = 'VwBiz2DispatchDelivery';
          } else if (isGoodsTransporter || isTransporter) {
            botResponse = `✔️ **Transporter: Accept / Offload Deliveries**\n\n` +
              `Are you a transporter who wants to deliver goods? If yes, open the Transport tab and tap **View Transport Requests to: Accept, Offload Delivery - Transporter** to see available delivery jobs and manage them.`;
            navigateProduct = 'AcceptTransportRequest';
          } else {
            // generic send/delivery question without clear role
            botResponse = `🚗 **Transport & Delivery**\n\n` +
              `Do you want to: \n• Request a delivery for goods (Buyer)\n• Dispatch an order (Seller)\n• Register as a transporter / accept jobs (Transporter)\n• Book a passenger ride (Passenger)\n\nReply with one of: "delivery", "dispatch", "transporter", or "ride" and I'll take you to the right button.`;
            // Keep navigateProduct pointing to Transport so user can be shown the Transport tab
            navigateProduct = 'Transport';
          }
        }
        // Transporter/account related queries
        else if (isTransporter) {
          if (has(['register', 'become transporter', 'sign up'])) {
            botResponse = `🚚 **Register as Transporter**\n\n` +
              `Open the Transport tab and tap **Register Transport - Transporter** to create your transporter profile and start accepting deliveries.`;
            navigateProduct = 'RegisterTransport';
          } else if (has(['company account', 'transport company'])) {
            botResponse = `🏢 **Transport Company Account**\n\n` +
              `Open the Transport tab and choose View Transport Company Account to manage your company profile and earnings.`;
            navigateProduct = 'ViewTransportBiznaAccount';
          } else if (has(['account', 'view account', 'my account'])) {
            botResponse = `📊 **Transporter Account**\n\n` +
              `Open the Transport tab and use View Account to reset location, delete account, share revenue, and view your transport earnings.`;
            navigateProduct = 'VwTransportAccount';
          } else {
            botResponse = `🚚 **Transporter Options**\n\n` +
              `As a transporter you can register, view account, accept/offload deliveries, or manage company accounts. Open the Transport tab to choose.`;
            navigateProduct = 'Transport';
          }
        }
        // fallback: general transport info
        else {
          const guide = (product as any).howToAccess?.[lang] || (product as any).howToAccess?.en;
          botResponse = guide || (`🚗 **Transport Services**\n\n` +
            `${product.description[lang] || product.description.en}\n\n` +
            `✨ **Key Features:**\n• ${(product.benefits[lang] || product.benefits.en).slice(0, 3).join('\n• ')}`);
          navigateProduct = product.screen;
        }
      }
      // Check if asking about Business / Credit Sales
      else if ([
        'business', 'credit sales', 'business products', 'biz products', 'business profile', 'business account', 'business credit', 'credit sales profile', 'business loan', 'business loan status', 'loan status', 'credit request', 'make credit request', 'create business', 'register business', 'start business', 'open business profile', 'view business account', 'view account details', 'business deposits', 'business transfers', 'cash transfers', 'cash sales', 'cash sale', 'seller partial pay', 'partial pay', 'make deposits', 'view deposits', 'send cash to pal', 'send cash to biz', 'view cash sent to pal', 'view cash received from biz', 'view cash sent to biz', 'view payments to pal', 'view payments to business', 'transfer ownership', 'receive ownership', 'benefit product', 'create beneficiary product', 'add beneficiary product', 'beneficiary product', 'link beneficiary', 'link beneficiary product', 'connect beneficiary', 'attach beneficiary', 'link product', 'boost pooled benefits', 'boost benefits', 'view as product creator', 'product creator', 'share business benefits', 'share benefits', 'benefits shared', 'view benefits shared', 'view shared benefits', 'business benefits', 'business adverts', 'business ads', 'cascade payments', 'payment flow', 'chain payment', 'payment chain', 'add item', 'delete item', 'delete sales item', 'list item', 'post item', 'post product', 'inventory', 'stock', 'register sales officer', 'remove sales officer', 'register officer', 'deregister officer', 'view account', 'business account details', 'approve request', 'grant request', 'approve loan request', 'approve credit request', 'grant credit', 'grant loan', 'bizpal loaners', 'bizpal loanees', 'bizbiz loaners', 'bizbiz loanees', 'palpal loaners', 'palpal loanees', 'palbiz loaners', 'palbiz loanees', 'pal to pal', 'biz to pal', 'biz to biz', 'pal to biz'
      ].some(matchesPhrase)) {
        const product = getProductsByKeyword('business-credit')[0] || PRODUCTS.find((p) => p.id === 'business-credit');
        const has = (words: string | string[]) => {
          const list = Array.isArray(words) ? words : [words];
          return list.some(w => matchesPhrase(w));
        };

        const wantsOpenBusiness = has(['business products', 'credit sales', 'open business', 'show business', 'go to business', 'go to biz', 'open biz', 'business profile', 'credit sales screen']);
        const wantsCreateBusiness = has(['create business', 'register business', 'create biz', 'register biz', 'create institution', 'create business institution']);
        const wantsUpdateBusiness = has(['update business', 'update biz', 'edit business', 'edit biz']);
        const wantsRegisterOfficer = has(['register sales officer', 'register officer', 'add sales officer', 'register salesperson', 'register sales rep']);
        const wantsDeregisterOfficer = has(['deregister sales officer', 'remove sales officer', 'de-register sales officer']);
        const wantsMakeCreditRequest = has(['make credit request', 'credit sales request', 'request credit', 'buy on credit', 'request a loan', 'credit loan request', 'apply for credit', 'apply for credit sales', 'request business credit', 'submit credit request', 'new credit request']) || queryToSearch.includes('make credit sales');
        const wantsGrantRequest = has(['grant credit', 'grant loan', 'approve credit request', 'grant credit request', 'approve credit sales request', 'grant credit sales request', 'approve request', 'grant request', 'approve loan request', 'approve sales request', 'grant business loan', 'grant business credit', 'approve pal2pal', 'approve pal to pal', 'approve pal2biz', 'approve biz2pal', 'approve biz2biz', 'grant pal2pal', 'grant pal to pal', 'grant pal2biz', 'grant biz2pal', 'grant biz2biz', 'approve business to business', 'approve business to person', 'grant business to business', 'grant business to person', 'approve group to group', 'approve business loan', 'approve credit sales request']);
        const wantsBizPalLoaners = has(['bizpal loaners', 'business to person loaners', 'business to pal loaners', 'biz to pal loaners', 'business to pal loaners', 'business to person loaners list', 'view bizpal loaners']);
        const wantsBizPalLoanees = has(['bizpal loanees', 'business to person loanees', 'business to pal loanees', 'biz to pal loanees', 'view bizpal loanees']);
        const wantsBizBizLoaners = has(['bizbiz loaners', 'business to business loaners', 'biz to biz loaners', 'business to business loanees', 'biz2biz loaners', 'view bizbiz loaners']);
        const wantsBizBizLoanees = has(['bizbiz loanees', 'business to business loanees', 'biz2biz loanees', 'business to business loanees', 'view bizbiz loanees']);
        const wantsPalPalLoaners = has(['palpal loaners', 'person to person loaners', 'palpal loaners', 'pal to pal loaners', 'individual to individual loaners', 'view palpal loaners']);
        const wantsPalPalLoanees = has(['palpal loanees', 'person to person loanees', 'pal pal loanees', 'individual to individual loanees', 'view palpal loanees']);
        const wantsPalBizLoaners = has(['palbiz loaners', 'person to business loaners', 'palbiz loaners', 'pal to business loaners', 'view palbiz loaners']);
        const wantsPalBizLoanees = has(['palbiz loanees', 'person to business loanees', 'palbiz loanees', 'pal to business loanees', 'view palbiz loanees']);
        const wantsCashSales = has(['cash sales', 'cash sale', 'pay cash', 'seller cash sales', 'cash sale record', 'record cash sale', 'cash sales record', 'business cash sale', 'cash sales purchase', 'cash sales transaction']);
        const wantsSellerPartialPayRecords = has(['partial pay records', 'seller partial pay', 'partial payment records', 'seller partial pay records', 'partial payments', 'partial pay history', 'seller payment records']);
        const wantsMakeDeposits = has(['make deposits', 'make deposit', 'deposit to business', 'deposit money', 'add deposits', 'top up business', 'add funds to business', 'deposit cash', 'deposit funds', 'deposits']);
        const wantsViewDeposits = has(['view deposits', 'view business deposits', 'deposit records', 'business deposit records', 'see deposits', 'view deposit history']);
        const wantsSendCashToPal = has(['send cash to pal', 'send cash to person', 'send to pal', 'send money to pal', 'transfer cash to pal', 'pay a pal', 'pay person', 'send funds to pal']);
        const wantsSendCashToBiz = has(['send cash to biz', 'send cash to business', 'send money to business', 'send to business', 'transfer cash to business', 'pay a business', 'send funds to business']);
        const wantsViewCashSentToPal = has(['view cash sent to pal', 'cash sent to pal', 'view payments to pal', 'sent to pal', 'sent cash to pal']);
        const wantsViewCashReceivedFromBiz = has(['view cash received from biz', 'cash received from biz', 'received from business', 'view cash from business', 'received business cash']);
        const wantsViewCashSentToBiz = has(['view cash sent to biz', 'cash sent to biz', 'view payments to business', 'sent cash to business']);
        const wantsTransferOwnership = has(['transfer ownership', 'give business', 'transfer business', 'transfer business ownership', 'sell business', 'sell my business', 'transfer my business']);
        const wantsReceiveOwnership = has(['receive ownership', 'take over business', 'receive business ownership', 'take over business', 'take ownership', 'claim business ownership']);
        const wantsCreateBenefitProduct = has(['benefit product', 'create benefit product', 'new benefit product', 'create beneficiary product', 'add beneficiary product', 'new beneficiary product', 'benefit product create']);
        const wantsViewBusinessBenefitsShared = has(['view business benefits shared', 'view benefits shared', 'benefits shared', 'view shared benefits', 'show shared benefits', 'display shared benefits']);
        const wantsShareBusinessBenefits = has(['share business benefits', 'share benefits', 'send benefits to business', 'share benefit product', 'share benefit', 'share business benefit']);
        const wantsLinkBeneficiary = has([
          'link beneficiary', 'link a beneficiary', 'link beneficiary product',
          'link my beneficiary', 'connect beneficiary', 'connect my beneficiary',
          'attach beneficiary', 'attach my beneficiary', 'beneficiary product',
          'link product', 'connect beneficiary product', 'attach beneficiary product',
          'link beneficiary to product', 'link beneficiary to a product',
          'link beneficiary to product', 'link beneficiary to a beneficiary product',
          'connect beneficiary to benefit product', 'attach beneficiary to benefit product',
          'add beneficiary to product', 'connect beneficiary to product', 'attach beneficiary to product', 'link beneficiary to benefit'
        ]);
        const wantsBoostPooledBenefits = has(['boost pooled benefits', 'boost benefits', 'increase pooled benefits', 'raise pooled benefits', 'increase benefits', 'boost benefit pool']);
        const wantsViewAsProdCreator = has(['view as product creator', 'product creator', 'product creator mode', 'view as creator', 'creator mode', 'see product creator']);
        const wantsAddItem = has(['add item', 'add product', 'add sales item', 'list item', 'post product', 'add stock', 'add inventory', 'add business item', 'add store item', 'new sales item']);
        const wantsDeleteSalesItem = has(['delete sales item', 'remove sales item', 'delete item', 'remove item', 'delete product', 'remove product', 'remove sales product', 'delete sales product']);
        const wantsViewAccount = has(['view account', 'business account', 'account details', 'view my account', 'view business account', 'business account details']);
        const wantsCascadePayments = has(['cascade payments', 'cascade payment', 'chain payment', 'payment flow', 'payment chain', 'payment cascade', 'cascade pay', 'split payment flow']);

        if (wantsCreateBusiness) {
          botResponse = `🏢 **Create a Business / Institution**\n\n` +
            `Open Business products → Manage Business → Create Biz/Institution, then fill in your business details and submit.`;
          navigateProduct = 'CrtBusinesss';
        } else if (wantsRegisterOfficer) {
          botResponse = `👔 **Register a Sales Officer**\n\n` +
            `Open Business products → Manage Business → Register Sales Officer to add a new representative.`;
          navigateProduct = 'AddPersonels';
        } else if (wantsDeregisterOfficer) {
          botResponse = `🚫 **Deregister a Sales Officer**\n\n` +
            `Open Business products → Manage Business → DeReg Sales Officer to remove a sales representative.`;
          navigateProduct = 'RmvPersonnelss';
        } else if (wantsMakeCreditRequest) {
          botResponse = `💳 **Make a Credit Sales Request**\n\n` +
            `Open Business products → Make Credit Sales Requests to submit a new request for credit purchase.`;
          navigateProduct = 'BiznaReqstPage1';
        } else if (wantsGrantRequest) {
          botResponse = `✅ **Grant / Approve a Credit Sales Request**\n\n` +
            `Open Business products → Grant Credit Sales Requests and choose the correct flow for the request type.`;
          if (wantsBizBizLoaners || wantsBizBizLoanees || queryToSearch.includes('biz2biz') || queryToSearch.includes('business to business')) {
            navigateProduct = 'PersonelVw2GrntB2B';
          } else if (wantsBizPalLoaners || wantsBizPalLoanees || queryToSearch.includes('biz2pal') || queryToSearch.includes('business to person')) {
            navigateProduct = 'PersonelVw2GrntB2P';
          } else if (queryToSearch.includes('pal2biz') || queryToSearch.includes('person to business') || queryToSearch.includes('individual to business')) {
            navigateProduct = 'Vw2GrntPal2Biz';
          } else if (queryToSearch.includes('pal2pal') || queryToSearch.includes('person to person') || queryToSearch.includes('individual to individual')) {
            navigateProduct = 'Vw2GrntPal2Pal';
          } else {
            navigateProduct = 'Vw2GrntPal2Pal';
          }
        } else if (wantsBizPalLoaners) {
          botResponse = `📋 **View BizPal Loaners**\n\n` +
            `Open Business products → Credit Sales Loan Status (Business) → BizPal Loaners.`;
          navigateProduct = 'VwBiz2PalLners';
        } else if (wantsBizPalLoanees) {
          botResponse = `📋 **View BizPal Loanees**\n\n` +
            `Open Business products → Credit Sales Loan Status (Business) → BizPal Loanees.`;
          navigateProduct = 'VwBiz2PalLnees';
        } else if (wantsBizBizLoaners) {
          botResponse = `📋 **View BizBiz Loaners**\n\n` +
            `Open Business products → Credit Sales Loan Status (Business) → BizBiz Loaners.`;
          navigateProduct = 'VwBizLners';
        } else if (wantsBizBizLoanees) {
          botResponse = `📋 **View BizBiz Loanees**\n\n` +
            `Open Business products → Credit Sales Loan Status (Business) → BizBiz Loanees.`;
          navigateProduct = 'VwBizLnees';
        } else if (wantsPalPalLoaners) {
          botResponse = `📋 **View PalPal Loaners**\n\n` +
            `Open Business products → Credit Sales Loan Status (Individual) → PalPal Loaners.`;
          navigateProduct = 'VwPalLners';
        } else if (wantsPalPalLoanees) {
          botResponse = `📋 **View PalPal Loanees**\n\n` +
            `Open Business products → Credit Sales Loan Status (Individual) → PalPal Loanees.`;
          navigateProduct = 'VwPalLnees';
        } else if (wantsPalBizLoaners) {
          botResponse = `📋 **View PalBiz Loaners**\n\n` +
            `Open Business products → Credit Sales Loan Status (Individual) → PalBiz Loaners.`;
          navigateProduct = 'VwPal2BizLners';
        } else if (wantsPalBizLoanees) {
          botResponse = `📋 **View PalBiz Loanees**\n\n` +
            `Open Business products → Credit Sales Loan Status (Individual) → PalBiz Loanees.`;
          navigateProduct = 'VwPal2BizLnees';
        } else if (wantsCashSales) {
          botResponse = `💵 **Cash Sales**\n\n` +
            `Open Business products → Cash Sales / Purchases & Deposits → Cash Sales to record or manage cash sales.`;
          navigateProduct = 'PayCash';
        } else if (wantsSellerPartialPayRecords) {
          botResponse = `📄 **Seller Partial Pay Records**\n\n` +
            `Open Business products → Cash Sales / Purchases & Deposits → Seller Partial Pay Records.`;
          navigateProduct = 'SellerPartialPayRecords';
        } else if (wantsMakeDeposits) {
          botResponse = `🏦 **Make Deposits**\n\n` +
            `Open Business products → Cash Sales / Purchases & Deposits → Make Deposits.`;
          navigateProduct = 'MakeBizDpsts';
        } else if (wantsViewDeposits) {
          botResponse = `📥 **View Deposits**\n\n` +
            `Open Business products → Cash Sales / Purchases & Deposits → View Deposits.`;
          navigateProduct = 'VwBizDpsts';
        } else if (wantsSendCashToPal) {
          botResponse = `💸 **Send Cash to Pal**\n\n` +
            `Open Business products → Business Cash Transfers → Send Cash to Pal.`;
          navigateProduct = 'ShareCredSlsRevss';
        } else if (wantsSendCashToBiz) {
          botResponse = `💸 **Send Cash to Biz**\n\n` +
            `Open Business products → Business Cash Transfers → Send Cash to Biz.`;
          navigateProduct = 'ShareCredSlsRev2Biz';
        } else if (wantsViewCashSentToPal) {
          botResponse = `📤 **View Cash Sent to Pal**\n\n` +
            `Open Business products → Business Cash Transfers → View Cash Sent to Pal.`;
          navigateProduct = 'ViewBiznaShareSent2Pal';
        } else if (wantsViewCashReceivedFromBiz) {
          botResponse = `📥 **View Cash Received from Biz**\n\n` +
            `Open Business products → Business Cash Transfers → View Cash Received from Biz.`;
          navigateProduct = 'ViewBiznaShareRecBiz';
        } else if (wantsViewCashSentToBiz) {
          botResponse = `📤 **View Cash Sent to Biz**\n\n` +
            `Open Business products → Business Cash Transfers → View Cash Sent to Biz.`;
          navigateProduct = 'ViewBiznaShareSent';
        } else if (wantsTransferOwnership) {
          botResponse = `🔁 **Transfer Business Ownership**\n\n` +
            `Open Business products → Biz Adverts → Transfer Ownership.`;
          navigateProduct = 'giveBizna';
        } else if (wantsReceiveOwnership) {
          botResponse = `📥 **Receive Business Ownership**\n\n` +
            `Open Business products → Biz Adverts → Receive Ownership.`;
          navigateProduct = 'TakeOverBizna';
        } else if (wantsCreateBenefitProduct) {
          botResponse = `🏷️ **Create Benefit Product**\n\n` +
            `Open Business products → Biz Products → Benefit Product (Create).`;
          navigateProduct = 'AddBeneficiaryProduct';
        } else if (wantsViewBusinessBenefitsShared) {
          botResponse = `🔍 **View Business Benefits Shared**\n\n` +
            `Open Business products → Biz Products → View Business Benefits Shared.`;
          navigateProduct = 'ViewBenShares';
        } else if (wantsShareBusinessBenefits) {
          botResponse = `📨 **Share Business Benefits**\n\n` +
            `Open Business products → Biz Products → Share Business Benefits.`;
          navigateProduct = 'VwBenToShare';
        } else if (wantsLinkBeneficiary) {
          botResponse = `🔗 **Link Beneficiary**\n\n` +
            `Open Business products → Biz Products → Link Beneficiary.`;
          navigateProduct = 'ViewBenProds';
        } else if (wantsBoostPooledBenefits) {
          botResponse = `🚀 **Boost Pooled Benefits**\n\n` +
            `Open Business products → Biz Products → Boost Pooled Benefits.`;
          navigateProduct = 'BoostPooledBen';
        } else if (wantsViewAsProdCreator) {
          botResponse = `👤 **View as Product Creator**\n\n` +
            `Open Business products → Biz Products → View As Product Creator.`;
          navigateProduct = 'ViewAsProdCreator';
        } else if (wantsAddItem) {
          botResponse = `➕ **Add Item**\n\n` +
            `Open Business products → Manage Business → Add Item.`;
          navigateProduct = 'VwBiz2AddItem';
        } else if (wantsDeleteSalesItem) {
          botResponse = `🗑️ **Delete Sales Item**\n\n` +
            `Open Business products → Manage Business → Delete Sales Item.`;
          navigateProduct = 'VwSlsAds2Remove';
        } else if (wantsUpdateBusiness) {
          botResponse = `🛠️ **Update Business**\n\n` +
            `Open Business products → Manage Business → Update Biz.`;
          navigateProduct = 'UpdateBizAc';
        } else if (wantsViewAccount) {
          botResponse = `📊 **View Business Account**\n\n` +
            `Open Business products → Manage Business → View Account.`;
          navigateProduct = 'SgnIn2VwBiznass';
        } else if (wantsCascadePayments) {
          botResponse = `🔗 **Cascade Payments**\n\n` +
            `Open Business products → Cascade Payments.`;
          navigateProduct = 'CascadePaymentsScreen';
        } else if (wantsOpenBusiness) {
          botResponse = `📌 **Open Business products**\n\n` +
            `Open the Home screen and tap **Business products** to access business credit, loan status, cash sales, deposits, transfers, and adverts.`;
          navigateProduct = 'CredSlsScreen';
        } else if (product) {
          const guide = (product as any).howToAccess?.[lang] || (product as any).howToAccess?.en;
          botResponse = guide || (`📚 **Business (Credit Sales)**\n\n` +
            `${product.description[lang] || product.description.en}`);
          navigateProduct = product.screen;
        } else {
          botResponse = `📌 **Business (Credit Sales)**\n\n` +
            `Open Business products to manage business accounts, make credit requests, grant credit requests, view loan status, cash sales, deposits, transfers and adverts.`;
          navigateProduct = 'CredSlsScreen';
        }
      }
      // Check if asking about Chama / Group products (include self-help and apply/apply-for synonyms)
      else if ([
        'chama',
        'groups',
        'group products',
        'groups products',
        'group account',
        'group loan',
        'group remittance',
        'group withdrawal',
        'group deposits',
        'group members',
        'register group',
        'create group',
        'dissolve group',
        'signatory',
        'member',
        'dividend',
        'dividends',
        'group status',
        'remittance',
        'remittances',
        'share dividends'
      ].some(matchesPhrase)) {
        const product = getProductsByKeyword('chama-groups')[0] || PRODUCTS.find((p) => p.id === 'chama-groups');
        const has = (words: string | string[]) => {
          const list = Array.isArray(words) ? words : [words];
          return list.some(w => matchesPhrase(w));
        };
        const wantsDeleteLoanRequest = has(['delete loan', 'delete loan request', 'delete request', 'remove loan request', 'cancel loan request']);
        const wantsGiveMemberAdvance = has(['give member advance', 'give advance', 'member advance', 'give advance to member']);
        const wantsFloatGroupLoans = has(['float group', 'float group loans', 'float loans']);
        const wantsCreateMinutes = has(['group minutes', 'minutes', 'create minutes', 'group meeting minutes']);
        const wantsViewGroupDebts = has(['group debts', 'view group debts', 'group debt status', 'view debts status', 'group status']);
        const wantsViewMemberDebts = has(['member debts', 'view member debts', 'member debt status', 'member status']);
        const wantsCreateGroupAccount = has(['create group account', 'register group account', 'register group', 'register a group', 'create group', 'start a group', 'create chama group', 'register chama group']);
        const wantsOpenChama = has(['open chama', 'open group products', 'go to chama', 'go to groups products', 'show chama', 'show group products', 'view chama', 'visit chama', 'chama screen']);
        const wantsRequestLoan = has([
          'request loan', 'request a loan', 'request a loan from', 'apply for loan', 'apply loan', 'apply for a loan', 'apply for group loan', 'apply for advance', 'apply for group advance',
          'borrow from group', 'borrow from my group', 'borrow from chama', 'loan from chama', 'group loan', 'request advance', 'group advance', 'ask for loan', 'i want a loan', 'i want to apply for a loan',
          'can i get a loan', 'apply to group', 'apply to chama', 'request a loan from my chama', 'request a loan from group', 'self help loan', 'self-help loan', 'selfhelp loan'
        ]);
        const wantsApproveLoan = has(['approve loan', 'approve member loan', 'approve group loan', 'signatory approve', 'approve request']);
        const wantsDissolve = has(['dissolve', 'dissolve group', 'close group', 'delete group', 'end group']);
        const wantsRegisterMember = has(['register member', 'register chama member', 'add member', 'signup member', 'enroll member']);
        const wantsDeregister = has(['deregister', 'remove member', 'remove chama member', 'unregister member']);
        const wantsViewMembers = has(['view members', 'members list', 'group members', 'who is in my group', 'member list', 'manage members', 'share dividends', 'share profits', 'dividends', 'profits']);
        const wantsViewMyGroups = has(['my groups', 'view my groups', 'my chama', 'my groups list', 'my subscriptions']);
        const wantsViewGroupRemittances = has(['group remittance', 'group remittances', 'remittance', 'remittances', 'confirm remittances', 'group dividend', 'dividend']);
        const wantsViewMyRemittances = has(['my remittances', 'view my remittances', 'my remittance', 'my dividends']);
        const wantsViewGroupDeposits = has(['view group deposits', 'group deposits', 'view deposits', 'deposits']);
        const wantsViewGroupWithdrawals = has(['view group withdrawals', 'group withdrawals', 'view withdrawals', 'withdrawals']);
        const wantsViewGroupAccount = has(['view group account', 'group account details', 'account details', 'view account']);
        const wantsUpdateGroupAccount = has(['update chama account', 'update group account', 'update group', 'update chama', 'edit group', 'edit chama']);
        const wantsSignatory3 = has(['signatory3', 'signatory 3', 'signatory3 confirm', 'signatory3 confirm withdrawals']);
        const wantsSignatory2 = has(['signatory2', 'signatory 2', 'signatory 2 confirm', 'signatory 2 confirm withdrawals']);
        const wantsSignatory = has(['signatory', 'signatory work', 'confirm withdrawal', 'confirm withdrawals', 'signatory confirm']);
        const wantsLinkNsndogo = has(['link nsndogo', 'link agent', 'link nsndogo agent', 'link agent to group']);

        if (wantsDeleteLoanRequest) {
          botResponse = `🗑️ **Delete a Loan Request (Member)**\n\n` +
            `Open Groups products → Group Advance → Delete a loan request. Select the loan request you submitted and confirm deletion.`;
          navigateProduct = 'ChamaVw2DelLnReqs';
        } else if (wantsGiveMemberAdvance) {
          botResponse = `🤝 **Give Member Advance (Signatory)**\n\n` +
            `Open Groups products → Group Advance → Give Member Advance. Select the member and amount, then confirm.`;
          navigateProduct = 'VwGrp2LnCov';
        } else if (wantsFloatGroupLoans) {
          botResponse = `💰 **Float Group Loans (Signatory)**\n\n` +
            `Open Groups products → Group Advance → Float Group Loans to allocate pooled funds for member advances.`;
          navigateProduct = 'Vw2FloatGrpLoans';
        } else if (wantsCreateMinutes) {
          botResponse = `📝 **Create Group Minutes**\n\n` +
            `Open Groups products → Group Advance → Group Minutes to record meeting minutes and decisions for governance.`;
          navigateProduct = 'CreateChamaMinutes';
        } else if (wantsViewGroupDebts) {
          botResponse = `📊 **View Group Debts Status**\n\n` +
            `Open Groups products → View Group Status to see overall group debts, blacklist entries, and repayments.`;
          navigateProduct = 'ChmSignInss';
        } else if (wantsViewMemberDebts) {
          botResponse = `🔎 **View Member Debts Status**\n\n` +
            `Open Groups products → View Member Status to inspect individual member debts and repayment history.`;
          navigateProduct = 'ChmLnsRec';
        } else if (wantsCreateGroupAccount) {
          botResponse = `🆕 **Create a Chama Group**\n\n` +
            `Open Groups products and go to the Group Account section, then tap Create to start a new Chama. You'll fill group name, signatories, and initial settings.`;
          navigateProduct = 'ViewGrpApplications';
        } else if (wantsViewMyRemittances) {
          botResponse = `📥 **View My Remittances**\n\n` +
            `Open Groups products → Group Remittance → View My Remittances to see funds sent to you by groups or members.`;
          navigateProduct = 'ChamaMmbrRemts';
        } else if (wantsViewMyGroups) {
          botResponse = `👥 **View My Groups**\n\n` +
            `Open Groups products → Membership → View My Groups to see subscriptions and groups you belong to.`;
          navigateProduct = 'ChmMmbrMmbrss';
        } else if (wantsRequestLoan) {
          botResponse = `💸 **Request a Loan from your Chama**\n\n` +
            `To request a group loan, open Groups products → Group Advance → Request loan from group. Select your group, enter the loan amount and submit. A Group Signatory must approve.`;
          navigateProduct = 'Vw2SelectChm2Req';
        } else if (wantsApproveLoan) {
          botResponse = `✅ **Approve Group Loan Requests (Signatory)**\n\n` +
            `If you're a signatory, open Groups products → Group Advance → Approve member loan (Signatory) to view and approve pending member loan requests.`;
          navigateProduct = 'Vw2SignLoanRequests';
        } else if (wantsDissolve) {
          botResponse = `⚠️ **Dissolve a Chama Group**\n\n` +
            `This will permanently close the group. Open Groups products → Group Account → Dissolve to remove the group after confirming outstanding balances.`;
          navigateProduct = 'DissolveChms';
        } else if (wantsRegisterMember) {
          botResponse = `👥 **Register a Member**\n\n` +
            `Open Groups products → Registration → Register Member to add a new member to your Chama. You'll provide member details and confirm membership.`;
          navigateProduct = 'AddChmMembrsss';
        } else if (wantsDeregister) {
          botResponse = `🧾 **Deregister / Remove a Member**\n\n` +
            `Open Groups products → Registration → Deregister Member to remove a member from the Chama.`;
          navigateProduct = 'SgnIn2RemoveMmbrs';
        } else if (wantsViewMembers) {
          botResponse = `👀 **View Members & Share Dividends**\n\n` +
            `Open Groups products → Membership → View Members to see member details, manage dividends and subscriptions.`;
          navigateProduct = 'ViewGrp2ShareDividends';
        } else if (wantsViewGroupRemittances) {
          botResponse = `💳 **View Group Remittances**\n\n` +
            `Open Groups products → Group Remittance → View Group Remittances to confirm group remittance transactions.`;
          navigateProduct = 'ViewGrp2ConfirmDividends';
        } else if (wantsViewGroupDeposits) {
          botResponse = `🏦 **View Group Deposits (Signatory)**\n\n` +
            `Open Groups products → Signatory Works → View Group Deposits to inspect deposit records and reconcile balances.`;
          navigateProduct = 'SgnIn2VwChmDpstss';
        } else if (wantsViewGroupWithdrawals) {
          botResponse = `🏧 **View Group Withdrawals (Signatory)**\n\n` +
            `Open Groups products → Signatory Works → View Group Withdrawals to review withdrawal transactions and pending approvals.`;
          navigateProduct = 'SgnIn2VwChmWthdrwlss';
        } else if (wantsViewGroupAccount) {
          botResponse = `🏦 **View Group Account**\n\n` +
            `Open Groups products → Group Account → View Group Account to review the group account details.`;
          navigateProduct = 'ChamSignIn3s';
        } else if (wantsUpdateGroupAccount) {
          botResponse = `🔧 **Update Chama Account**\n\n` +
            `Open Groups products → Group Account → Update to edit contact, signatories or account settings.`;
          navigateProduct = 'UpdateChmAc';
        } else if (wantsOpenChama) {
          botResponse = `📌 **Open Groups products**\n\n` +
            `Open the Home screen and tap **Groups products** to access Chama features like loan requests, member registration, remittances, signatory approvals, and group account management.`;
          navigateProduct = 'ChamaScreen';
        } else if (wantsSignatory3) {
          botResponse = `✍️ **Signatory 3: Confirm Withdrawals**\n\n` +
            `Open Groups products → Signatory Works → Signatory 3 Confirm Withdrawals to approve or reject withdrawal requests.`;
          navigateProduct = 'SignitoryWthdrwFndss3';
        } else if (wantsSignatory2) {
          botResponse = `✍️ **Signatory 2: Confirm Withdrawals**\n\n` +
            `Open Groups products → Signatory Works → Signatory 2 Confirm Withdrawals to approve or reject withdrawal requests.`;
          navigateProduct = 'Sgn2CnfrmWthdrwlsss';
        } else if (wantsSignatory) {
          botResponse = `✍️ **Signatory Tasks: Confirm Withdrawals**\n\n` +
            `If you are a group signatory, open Groups products → Signatory Works to confirm withdrawals and other signatory actions.`;
          navigateProduct = 'Sgn2CnfrmWthdrwlsss';
        } else if (wantsLinkNsndogo) {
          botResponse = `🔗 **Link NSNdogo Agent to Group**\n\n` +
            `Open Groups products → Link NSNdogo to link a local agent for group float and remittances.`;
          navigateProduct = 'ChamaScreen';
        } else {
          const guide = (product as any).howToAccess?.[lang] || (product as any).howToAccess?.en;
          botResponse = guide || (`📚 **Chama Groups (Group products)**\n\n` +
            `${product.description[lang] || product.description.en}\n\n` +
            `I can help you create groups, request group loans, register members, view members, share dividends, manage group accounts, or confirm signatory withdrawals. Which of these would you like to do?`);
          navigateProduct = product.screen || 'ChamaScreen';
        }
      }
      // Check for benefits/features questions
      else if (queryToSearch.match(/benefit|feature|advantage|why|reason|profit/)) {
        const matchedProducts = getProductsByKeyword(queryToSearch);
        if (matchedProducts.length > 0) {
          const product = matchedProducts[0];
          const benefits = product.benefits[lang] || product.benefits.en;
          botResponse = `✨ **${product.id.replace(/-/g, ' ').toUpperCase()} Benefits**\n\n` +
            benefits.map((b, i) => `${i + 1}. ${b}`).join('\n') +
            `\n\nWant to know how to access it? Ask "How do I access ${product.id.replace(/-/g, ' ')}?"`;
          navigateProduct = product.screen;
        } else {
          botResponse = `Tell me which product interests you:\n\n` +
            `• Pal-Pal Loans\n` +
            `• Chama Groups\n` +
            `• Credit Sales\n` +
            `• COMB\n` +
            `• Transport\n\n` +
            `Then I can tell you the benefits!`;
        }
      }
      // Try to find a matching product
      else {
        const matchedProducts = getProductsByKeyword(queryToSearch);
        if (matchedProducts.length > 0) {
          const product = matchedProducts[0];
          navigateProduct = product.screen;

          // Check quick actions first for specific intent
          const quickAction = (product as any).quickActions?.find((qa: any) =>
            qa.keywords.some((kw: string) => matchesPhrase(kw))
          );

          if (quickAction) {
            botResponse = quickAction.response[lang] || quickAction.response.en;
            // If this quick action belongs to Chama, map it to the exact Chama screen
            try {
              const prodId = (product as any).id;
              if (prodId === 'chama-groups') {
                const queryMatches = (term: string) => matchesPhrase(term);

                if (queryMatches('request loan') || queryMatches('request a loan') || queryMatches('borrow from group') || queryMatches('group loan') || queryMatches('request advance') || queryMatches('apply for loan') || queryMatches('apply for a loan') || queryMatches('apply to group') || queryMatches('apply to chama')) {
                  navigateProduct = 'Vw2SelectChm2Req';
                } else if (queryMatches('register group') || queryMatches('create chama') || queryMatches('create group') || queryMatches('open chama') || queryMatches('open group')) {
                  navigateProduct = 'ViewGrpApplications';
                } else if (queryMatches('register member') || queryMatches('add member') || queryMatches('new member') || queryMatches('join group') || queryMatches('enroll member')) {
                  navigateProduct = 'AddChmMembrsss';
                } else if (queryMatches('delete loan request') || queryMatches('cancel loan request') || queryMatches('remove loan request') || queryMatches('delete loan')) {
                  navigateProduct = 'ChamaVw2DelLnReqs';
                } else if (queryMatches('group minutes') || queryMatches('create minutes') || queryMatches('meeting minutes')) {
                  navigateProduct = 'CreateChamaMinutes';
                } else if (queryMatches('group debts') || queryMatches('group status') || queryMatches('debt status')) {
                  navigateProduct = 'ChmSignInss';
                } else if (queryMatches('member debts') || queryMatches('member status') || queryMatches('loan status')) {
                  navigateProduct = 'ChmLnsRec';
                } else if (queryMatches('view group remittances') || queryMatches('group remittance') || queryMatches('dividend') || queryMatches('share dividends')) {
                  navigateProduct = 'ViewGrp2ConfirmDividends';
                } else if (queryMatches('view my remittances') || queryMatches('my remittances') || queryMatches('my dividends')) {
                  navigateProduct = 'ChamaMmbrRemts';
                } else if (queryMatches('view members') || queryMatches('members list') || queryMatches('member list') || queryMatches('manage members') || queryMatches('see members')) {
                  navigateProduct = 'ViewGrp2ShareDividends';
                } else if (queryMatches('view my groups') || queryMatches('my groups') || queryMatches('group list') || queryMatches('subscriptions') || queryMatches('my chama')) {
                  navigateProduct = 'ChmMmbrMmbrss';
                } else if (queryMatches('view group account') || queryMatches('group account details') || queryMatches('account details') || queryMatches('view account')) {
                  navigateProduct = 'ChamSignIn3s';
                } else if (queryMatches('view group deposits') || queryMatches('group deposits') || queryMatches('view deposits')) {
                  navigateProduct = 'SgnIn2VwChmDpstss';
                } else if (queryMatches('view group withdrawals') || queryMatches('group withdrawals') || queryMatches('view withdrawals') || queryMatches('withdrawals')) {
                  navigateProduct = 'SgnIn2VwChmWthdrwlss';
                } else if (queryMatches('dissolve') || queryMatches('dissolve group') || queryMatches('close group') || queryMatches('delete group')) {
                  navigateProduct = 'DissolveChms';
                } else if (queryMatches('signatory 3') || queryMatches('signatory 3 confirm') || queryMatches('signatory 3 confirm withdrawals')) {
                  navigateProduct = 'SignitoryWthdrwFndss3';
                } else if (queryMatches('signatory 2') || queryMatches('signatory 2 confirm') || queryMatches('signatory 2 confirm withdrawals')) {
                  navigateProduct = 'Sgn2CnfrmWthdrwlsss';
                } else if (queryMatches('confirm withdrawals') || queryMatches('confirm withdrawal') || queryMatches('signatory confirm') || queryMatches('signatory works')) {
                  navigateProduct = 'Sgn2CnfrmWthdrwlsss';
                } else if (queryMatches('view my remittances') || queryMatches('my remittances') || queryMatches('my dividends')) {
                  navigateProduct = 'ChamaMmbrRemts';
                } else if (queryMatches('register group') || queryMatches('register a group') || queryMatches('create chama') || queryMatches('create group') || queryMatches('open chama') || queryMatches('open group')) {
                  navigateProduct = 'ViewGrpApplications';
                } else if (queryMatches('update chama') || queryMatches('update group') || queryMatches('edit group') || queryMatches('edit chama')) {
                  navigateProduct = 'UpdateChmAc';
                } else if (queryMatches('float group') || queryMatches('float loans') || queryMatches('float group loans')) {
                  navigateProduct = 'Vw2FloatGrpLoans';
                } else if (queryMatches('give member advance') || queryMatches('give advance') || queryMatches('member advance')) {
                  navigateProduct = 'VwGrp2LnCov';
                } else if (queryMatches('link nsndogo') || queryMatches('link agent') || queryMatches('link nsndogo agent')) {
                  navigateProduct = 'ChamaScreen';
                } else {
                  // default to opening the Chama screen
                  navigateProduct = (product as any).screen || 'ChamaScreen';
                }
              }
            } catch (e) {
              // ignore mapping errors and fall back to product.screen
            }
          } else if (queryToSearch.match(/describe|full info|explain|details|complete/)) {
            botResponse = `📖 **${product.id.replace(/-/g, ' ').toUpperCase()}**\n\n` +
              `${product.description[lang] || product.description.en}\n\n` +
              `**About This:**\n${product.aboutProduct[lang] || product.aboutProduct.en}\n\n` +
              `**Benefits:**\n• ${(product.benefits[lang] || product.benefits.en).slice(0, 3).join('\n• ')}`;
          } else {
            botResponse = `✅ **${product.id.replace(/-/g, ' ').toUpperCase()}**\n\n` +
              `${product.description[lang] || product.description.en}\n\n` +
              `**Top benefits:**\n• ${(product.benefits[lang] || product.benefits.en).slice(0, 3).join('\n• ')}\n\n` +
              `Need help getting there? Ask "How do I access ${product.id.replace(/-/g, ' ')}?"`;
          }
        } else {
          // Nothing matched
          botResponse = `I didn't quite understand that. 🤔\n\n` +
            `I can help with:\n` +
            `• **Pal-Pal Loans** - Peer lending\n` +
            `• **Chama Groups** - Group savings\n` +
            `• **Credit Sales** - Business credit\n` +
            `• **COMB** - Shop now, pay later\n` +
            `• **Transport** - Delivery services\n\n` +
            `Try asking: "How do I create a Chama?" or "How does Transport work?"`;
        }
      }

      if (navigateProduct) {
        setLastNavigationTarget(navigateProduct);
      }

      addMessage(botResponse, 'bot');

      // Proactively offer navigation button and quick prompts for Chama flows
      const chamaScreens = [
        'ViewGrpApplications', 'Vw2SelectChm2Req', 'ChamaVw2DelLnReqs', 'VwGrp2LnCov', 'Vw2FloatGrpLoans', 'Vw2SignLoanRequests',
        'CreateChamaMinutes', 'ChmSignInss', 'ChmLnsRec', 'AddChmMembrsss', 'SgnIn2RemoveMmbrs', 'ViewGrp2ConfirmDividends',
        'ViewGrp2ShareDividends', 'ChamaMmbrRemts', 'ChmMmbrMmbrss', 'DissolveChms', 'UpdateChmAc', 'ChamSignIn3s',
        'Sgn2CnfrmWthdrwlsss', 'SignitoryWthdrwFndss3', 'SignitoryWthdrwFndsss', 'SgnIn2VwChmDpstss', 'SgnIn2VwChmWthdrwlss', 'ChamaScreen'
      ];

      const isChamaScreen = navigateProduct && (chamaScreens.includes(navigateProduct) || /chama|chm|chm|Chama|Chm/i.test(navigateProduct));
      if (isChamaScreen) {
        const friendly = getFriendlyScreenLabel(navigateProduct) || navigateProduct;
        setNavigationHint(`Open ${friendly}`);
        setNavigateTarget(navigateProduct);
        setShowNavButton(true);

        // Add a short follow-up suggesting specific Chama quick actions
        const quickList = `Quick actions:\n• register group\n• register member\n• request loan\n• delete loan request\n• give member advance\n• float group loans\n• approve member loan\n• create group minutes\n• view group debts status\n• view member debts status\n• view group remittances\n• view my remittances\n• view members\n• view my groups\n• view group account\n• update group account\n• dissolve group\n• view group deposits\n• view group withdrawals\n• signatory 2 confirm withdrawals\n• signatory 3 confirm withdrawals\n• link nsndogo\n\nReply with one of the actions above and I'll take you directly to that button.`;
        addMessage(quickList, 'bot');
      }

      // Special handling for deposit intent: first explain step-by-step, then
      // present the "View Deposits" button so the user knows what to do before
      // being taken to the deposits screen.
      if (navigateProduct === 'ElimDpstss') {
        const depositSteps = `Steps to deposit money:\n\n1) Visit any NSNdogo agent in person.\n2) Give your identity card and the cash to the operating officer.\n3) Wait for the agent to process and confirm the deposit.\n4) After confirmation, open Friend Products → Account → View Deposits to confirm the transaction.`;
        // Add the step-by-step guidance as a follow-up bot message
        addMessage(depositSteps, 'bot');

        // Show the navigation button after a short delay so the user sees the
        // guidance first.
        setTimeout(() => {
          if (onNavigate) {
            setNavigationHint('Open View Deposits to confirm your deposit');
            setNavigateTarget('ElimDpstss');
            setShowNavButton(true);
          }
        }, 900);
      } else if (!isChamaScreen) {
        const wantsNavigation = !!queryToSearch.match(/\b(take me to|go to|open|show|navigate|access|guide me to|how to access|i want to|i would like to|could you|can you|kindly|will you|would you)\b/);
        const wantsWithdraw = !!queryToSearch.match(/\b(withdraw|withdrawal|cash out|cash-out|take out money|access my money|access money|how can i withdraw|how can i access my money|how do i withdraw|how do i access my money)\b/);
        const wantsDeposit = !!queryToSearch.match(/\b(deposit|deposit money|deposit cash|add money|top up|cash in|cash-in|add funds|put money in wallet|deposit into|fund my account|add money to my wallet)\b/);
        const resolvedTarget = navigateProduct || ((wantsNavigation || wantsWithdraw || wantsDeposit) && lastNavigationTarget ? lastNavigationTarget : null);

        if (resolvedTarget && (wantsNavigation || wantsWithdraw || wantsDeposit)) {
          if (onNavigate) {
            const friendlyLabel = getFriendlyScreenLabel(resolvedTarget) || resolvedTarget;
            setNavigationHint(`Click here to open ${friendlyLabel}`);
            setNavigateTarget(resolvedTarget);
            setShowNavButton(true);
          }
        } else {
          setNavigationHint(null);
          setNavigateTarget(null);
          setShowNavButton(false);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage(t.error, 'bot');
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Messages - Flex 1 to push input to bottom */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 ? (
              <View style={styles.welcomeContainer}>
                <MaterialCommunityIcons name="robot" size={60} color="#e29d58" />
                <Text style={styles.welcomeText}>{t.welcome}</Text>
              </View>
            ) : (
              messages.map((msg) => (
                <View key={msg.id} style={[
                  styles.messageBubble,
                  msg.sender === 'user' ? styles.userMessage : styles.botMessage
                ]}>
                  <Text style={[
                    styles.messageText,
                    msg.sender === 'user' ? styles.userText : styles.botText
                  ]}>
                    {msg.text}
                  </Text>
                </View>
              ))
            )}

            {isLoading && (
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color="#e29d58" />
                <Text style={styles.loadingText}>Thinking...</Text>
              </View>
            )}
          </ScrollView>

          {showNavButton && navigationHint ? (
            <Animated.View style={[styles.navHintContainer, { transform: [{ scale: navPulse }] }]}> 
              <Text style={styles.navHintText}>{navigationHint}</Text>
              <TouchableOpacity onPress={handleNavButtonPress} style={styles.navButton}>
                <Text style={styles.navButtonText}>{t.navigate} {navigateTarget === 'NSNdogo' ? 'Ndogo' : navigateTarget}</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : null}

          {/* Floating Close Button */}
          <TouchableOpacity 
            onPress={closeChat} 
            style={styles.floatingCloseButton}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          {/* Input Area - Stays at bottom */}
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder={t.placeholder}
                placeholderTextColor="#999"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => processUserQuery(inputText)}
                editable={!isProcessing}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                onPress={() => processUserQuery(inputText)}
                disabled={isProcessing || !inputText.trim()}
                style={[styles.sendButton, (!inputText.trim() || isProcessing) && styles.sendButtonDisabled]}
              >
                <MaterialCommunityIcons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={clearMessages} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>{t.clear}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
    flexDirection: 'column',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingTop: 15,
  },
  messagesContent: {
    paddingBottom: 10,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  floatingCloseButton: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: [{ translateY: -22 }],
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(226, 157, 88, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  welcomeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    minHeight: 200,
  },
  welcomeText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 23,
  },
  messageBubble: {
    marginVertical: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    marginRight: 4,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8E8E8',
    marginLeft: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 19,
  },
  userText: {
    color: '#fff',
  },
  botText: {
    color: '#222',
  },
  loadingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 5,
    marginLeft: 4,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  inputContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 11,
    fontSize: 15,
    backgroundColor: '#f8f8f8',
    maxHeight: 100,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e29d58',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  navHintContainer: {
    backgroundColor: '#fff6e8',
    borderColor: '#e29d58',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  navHintText: {
    color: '#333',
    fontSize: 14,
    marginBottom: 10,
  },
  navButton: {
    backgroundColor: '#e29d58',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  clearButton: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#e29d58',
    fontSize: 12,
    fontWeight: '600',
  },
});
