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
          CreateChamaMinutes: 'Group Minutes',
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
          UpdateChmAc: 'Update Group Account',
          ChamSignIn3s: 'View Group Account',
          Sgn2CnfrmWthdrwlsss: 'Signatory 2 Confirm Withdrawals',
          SignitoryWthdrwFndss3: 'Signatory 3 Confirm Withdrawals',
          SignitoryWthdrwFndsss: 'Signatory 3 Confirm Withdrawals',
          SgnIn2VwChmDpstss: 'View Group Deposits',
          SgnIn2VwChmWthdrwlss: 'View Group Withdrawals',
        };

        return friendlyMap[screenName] || screenName;
      };

      // Check for greetings first
      if (isGreeting(lowerQuery)) {
        botResponse = getGreeting(lang);
      }
      // Check if user is asking for help, list products, or "what can you do"
      else if (lowerQuery.match(/^(help|products|services|what can you do|what do you offer|list all|show me all|menu)$/)) {
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
      else if (lowerQuery.match(/\b(deposit|deposit money|deposit cash|add money|top up|cash in|cash-in|add funds|put money in wallet|deposit into|fund my account|add money to my wallet)\b/)) {
        const agentProduct = PRODUCTS.find((p) => p.id === 'nsndogo-agent');
        const quickAction = (agentProduct as any)?.quickActions?.find((qa: any) =>
          qa.keywords.some((kw: string) => lowerQuery.includes(kw))
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
      else if (lowerQuery.match(/\b(withdraw|withdrawal|cash out|cash-out|take out money|access my money|access money|how can i withdraw|how can i access my money|how do i withdraw|how do i access my money)\b/)) {
        const matchedProducts = getProductsByKeyword(lowerQuery);
        const directNavigation = !!lowerQuery.match(/\b(take me to|go to|open|show( me)?|navigate to|take me|open the|take me there|i want to|i would like to|could you|can you|kindly|will you|would you)\b/);
        const wantsNdogo = !!lowerQuery.match(/\b(ndogo|nsndogo|bottom tab|bottom navigation|bottom nav|tab flow|tab)\b/);

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
            qa.keywords.some((kw: string) => lowerQuery.includes(kw))
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
      else if (lowerQuery.match(/\b(shopping|go shopping|marketplace|browse items|search items|cart|buy now|shop now|online shopping|go shopping tab|shopping tab)\b/)) {
        const product = getProductsByKeyword('go-shopping')[0] || PRODUCTS.find((p) => p.id === 'go-shopping');
        const containsPartial = /\b(partial payment|partial pay|partially pay|part payment|payment plan|pay later|partial plan)\b/.test(lowerQuery);
        const containsFull = /\b(full payment|pay full|full amount|complete payment|pay total|pay total amount)\b/.test(lowerQuery);
        const containsTransport = /\b(transport|delivery|shipping|ship|courier|driver|logistics|deliver|transporter)\b/.test(lowerQuery);
        const containsMap = /\b(map|location|nearby|route|map view|map-based|map based)\b/.test(lowerQuery);
        const containsB2B = /\b(b2b|business to business|business-to-business|business to business shopping)\b/.test(lowerQuery);
        const containsB2C = /\b(b2c|business to customer|business-to-customer|business to customer shopping)\b/.test(lowerQuery);
        const containsAccess = /\b(access|open|go to|show|navigate|take me|take me to|open the|show me|i want to|i would like to|could you|can you|kindly|will you|would you)\b/.test(lowerQuery);

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
      else if (lowerQuery.match(/\b(transport|delivery|shipping|send|courier|driver|freight|ride|passenger|rider|ship|parcel|package|track|tracking|where is my|where's my|dispatch|dispatching|dispatch delivery)\b/)) {
        const product = getProductsByKeyword('transport')[0] || PRODUCTS.find((p) => p.id === 'transport');

        // Helper matcher to check many synonyms
        const has = (words: string | string[]) => {
          const list = Array.isArray(words) ? words : [words];
          return list.some(w => lowerQuery.includes(w));
        };

        const wantsTrack = has(['track', 'tracking', "where is my", "where's my", 'track delivery', 'track parcel', 'tracking number']);
        const wantsRide = has(['ride', 'passenger', 'book a ride', 'need a ride', 'taxi', 'cab', 'uber', 'bolt']);
        const wantsSend = has(['send', 'send parcel', 'send package', 'ship', 'parcel', 'package', 'deliver goods', 'deliver package', 'send goods']);
        const isBuyer = has(['buyer', 'i bought', 'i purchased', 'receive delivery', 'receive order', 'order delivered', 'ask for transport', 'request transport']);
        const isSeller = has(['seller', 'dispatch', 'dispatch delivery', 'ship out', 'send out my order', 'send order']);
        const isTransporter = has(['transporter', 'driver', 'courier', 'rider', 'delivery person', 'deliveries', 'logistics', 'register transport', 'register as transporter', 'company account', 'transport company']);

        // Tracking / status requests
        if (wantsTrack) {
          botResponse = `🔎 **Track Delivery / Ride**\n\n` +
            `To track a delivery or ride, open the Transport tab and select Ride Tracking or the specific transport job. If you have a tracking number or order reference, paste it in the Transport screen to get location and status updates.`;
          navigateProduct = 'RideTrackingScreen';
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
        else if (wantsSend || isBuyer || isSeller) {
          if (isSeller) {
            botResponse = `📤 **Seller: Dispatch Delivery**\n\n` +
              `As a seller, open the Transport tab and tap **${(product as any)?.howToAccess?.[lang] ? 'View Transport Requests to: Dispatch Delivery - Seller' : 'View Transport Requests (Dispatch)'}** to dispatch orders.`;
            navigateProduct = 'VwBiz2DispatchDelivery';
          } else if (isBuyer) {
            botResponse = `📦 **Buyer: Request / Manage Delivery**\n\n` +
              `If you've purchased and want goods delivered, open the Transport tab and tap **${(product as any)?.howToAccess?.[lang] ? 'Ask for Transport - Buyer' : 'Ask for Transport'}**. To manage incoming deliveries (receive, cancel, change location), use the View Transport Requests (Buyer) screen.`;
            navigateProduct = 'VwSalesDtls4Transport';
          } else if (isTransporter) {
            botResponse = `✔️ **Transporter: Accept / Offload Deliveries**\n\n` +
              `Open the Transport tab and tap **View Transport Requests to: Accept, Offload Delivery - Transporter** to see available delivery jobs and manage them.`;
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
      // Check if asking about Chama / Group products (include self-help and apply/apply-for synonyms)
      else if (lowerQuery.match(/\b(chama|group products|groups products|group|groups|membership|members|chama groups|group account|group advance|group loan|request loan|apply loan|apply for loan|apply for advance|apply for group loan|apply for group|apply to group|self help|self-help|selfhelp|create chama|create group|register member|deregister member|dissolve group|group remittance|dividends|signatory|signatory works|link nsndogo)\b/)) {
        const product = getProductsByKeyword('chama-groups')[0] || PRODUCTS.find((p) => p.id === 'chama-groups');
        const has = (words: string | string[]) => {
          const list = Array.isArray(words) ? words : [words];
          return list.some(w => lowerQuery.includes(w));
        };

        const wantsDeleteLoanRequest = has(['delete loan', 'delete loan request', 'delete request', 'remove loan request', 'cancel loan request', 'delete loan request']);
        const wantsGiveMemberAdvance = has(['give member advance', 'give advance', 'member advance', 'give advance to member']);
        const wantsFloatGroupLoans = has(['float group', 'float group loans', 'float loans']);
        const wantsCreateMinutes = has(['group minutes', 'minutes', 'create minutes', 'group meeting minutes']);
        const wantsViewGroupDebts = has(['group debts', 'view group debts', 'group debt status', 'view debts status']);
        const wantsViewMemberDebts = has(['member debts', 'view member debts', 'member debt status']);
        const wantsCreate = has(['create chama', 'create group', 'create a group', 'start a group', 'open chama', 'open a group', 'create chama group']);
        const wantsRequestLoan = has([
          'request loan', 'request a loan', 'request a loan from', 'apply for loan', 'apply loan', 'apply for a loan', 'apply for group loan', 'apply for advance', 'apply for group advance',
          'borrow from group', 'borrow from my group', 'borrow from chama', 'loan from chama', 'group loan', 'request advance', 'group advance', 'ask for loan', 'i want a loan', 'i want to apply for a loan',
          'can i get a loan', 'apply to group', 'apply to chama', 'request a loan from my chama', 'request a loan from group', 'self help loan', 'self-help loan', 'selfhelp loan'
        ]);
        const wantsApproveLoan = has(['approve loan', 'approve member loan', 'approve group loan', 'signatory approve', 'approve request']);
        const wantsDissolve = has(['dissolve', 'dissolve group', 'close group', 'delete group']);
        const wantsRegisterMember = has(['register member', 'register chama member', 'add member', 'signup member']);
        const wantsDeregister = has(['deregister', 'remove member', 'remove chama member', 'unregister member']);
        const wantsViewMembers = has(['view members', 'members', 'membership', 'view membership']);
        const wantsViewMyGroups = has(['my groups', 'view my groups', 'my chama', 'my groups list']);
        const wantsViewAccount = has(['group account', 'account', 'create group account', 'view group account', 'update group']);
        const wantsRemittance = has(['remittance', 'remittances', 'share dividends', 'dividends', 'share dividend', 'group remittance', 'remittances']);
        const wantsViewMyRemittances = has(['my remittances', 'view my remittances', 'my remittances']);
        const wantsSignatory = has(['signatory', 'signatory work', 'confirm withdrawal', 'confirm withdrawals', 'signatory confirm']);
        const wantsSignatory3 = has(['signatory3', 'signatory 3', 'signatory3 confirm', 'signatory3 confirm withdrawals']);
        const wantsViewGroupDeposits = has(['view group deposits', 'group deposits', 'view deposits']);
        const wantsViewGroupWithdrawals = has(['view group withdrawals', 'group withdrawals', 'view withdrawals']);
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
        } else if (wantsCreate) {
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
            `To request a group loan, open Groups products → Group Advance → Request loan from group. Select your group, enter amount and submit. A Group Signatory must approve.`;
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
            `Open Groups products → Membership → View Members to see the member list, manage dividends and subscriptions.`;
          navigateProduct = 'ViewGrp2ShareDividends';
        } else if (wantsViewGroupDeposits) {
          botResponse = `🏦 **View Group Deposits (Signatory)**\n\n` +
            `Open Groups products → Signatory Works → View Group Deposits to inspect deposit records and reconcile balances.`;
          navigateProduct = 'SgnIn2VwChmDpstss';
        } else if (wantsViewGroupWithdrawals) {
          botResponse = `🏧 **View Group Withdrawals (Signatory)**\n\n` +
            `Open Groups products → Signatory Works → View Group Withdrawals to review withdrawal transactions and pending approvals.`;
          navigateProduct = 'SgnIn2VwChmWthdrwlss';
        } else if (wantsViewAccount) {
          botResponse = `🏦 **Group Account: Create, Update, View or Dissolve**\n\n` +
            `Open Groups products → Group Account to create, update, view or dissolve a group account.`;
          navigateProduct = 'ChamSignIn3s';
        } else if (has(['update chama account', 'update group account', 'update chama'])) {
          botResponse = `🔧 **Update Chama Account**\n\n` +
            `Open Groups products → Group Account → Update to edit contact, signatories or account settings.`;
          navigateProduct = 'UpdateChmAc';
        } else if (wantsSignatory3) {
          botResponse = `✍️ **Signatory 3: Confirm Withdrawals**\n\n` +
            `Open Groups products → Signatory Works → Signatory 3 Confirm Withdrawals to approve or reject withdrawal requests.`;
          navigateProduct = 'SignitoryWthdrwFndss3';
        } else if (wantsRemittance) {
          botResponse = `💳 **Group Remittances & Member Remittances**\n\n` +
            `Open Groups products → Group Remittance to view group remittances, or view your personal remittances under the My Remittances button.`;
          navigateProduct = 'ViewGrp2ConfirmDividends';
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
      else if (lowerQuery.match(/benefit|feature|advantage|why|reason|profit/)) {
        const matchedProducts = getProductsByKeyword(lowerQuery);
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
        const matchedProducts = getProductsByKeyword(lowerQuery);
        if (matchedProducts.length > 0) {
          const product = matchedProducts[0];
          navigateProduct = product.screen;

          // Check quick actions first for specific intent
          const quickAction = (product as any).quickActions?.find((qa: any) =>
            qa.keywords.some((kw: string) => lowerQuery.includes(kw))
          );

          if (quickAction) {
            botResponse = quickAction.response[lang] || quickAction.response.en;
            // If this quick action belongs to Chama, map it to the exact Chama screen
            try {
              const prodId = (product as any).id;
              if (prodId === 'chama-groups') {
                const kws: string[] = quickAction.keywords.map((s: string) => s.toLowerCase());
                const hasKw = (term: string) => kws.some(k => k.includes(term));

                if (hasKw('request loan') || hasKw('request a loan') || hasKw('borrow from group') || hasKw('group loan') || hasKw('request advance') || hasKw('apply for loan')) {
                  navigateProduct = 'Vw2SelectChm2Req';
                } else if (hasKw('register group') || hasKw('create chama') || hasKw('create group')) {
                  navigateProduct = 'ViewGrpApplications';
                } else if (hasKw('register member') || hasKw('add member') || hasKw('join group')) {
                  navigateProduct = 'AddChmMembrsss';
                } else if (hasKw('dissolve') || hasKw('dissolve group') || hasKw('close group')) {
                  navigateProduct = 'DissolveChms';
                } else if (hasKw('confirm withdrawals') || hasKw('confirm withdrawal') || hasKw('signatory confirm')) {
                  navigateProduct = 'Sgn2CnfrmWthdrwlsss';
                } else if (hasKw('update chama') || hasKw('update group')) {
                  navigateProduct = 'UpdateChmAc';
                } else if (hasKw('float group') || hasKw('float loans')) {
                  navigateProduct = 'Vw2FloatGrpLoans';
                } else if (hasKw('give member advance') || hasKw('give advance')) {
                  navigateProduct = 'VwGrp2LnCov';
                } else if (hasKw('link nsndogo') || hasKw('link agent')) {
                  navigateProduct = 'ChamaScreen';
                } else {
                  // default to opening the Chama screen
                  navigateProduct = (product as any).screen || 'ChamaScreen';
                }
              }
            } catch (e) {
              // ignore mapping errors and fall back to product.screen
            }
          } else if (lowerQuery.match(/describe|full info|explain|details|complete/)) {
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

      const isChamaScreen = navigateProduct && chamaScreens.includes(navigateProduct);
      if (isChamaScreen) {
        const friendly = getFriendlyScreenLabel(navigateProduct) || navigateProduct;
        setNavigationHint(`Open ${friendly}`);
        setNavigateTarget(navigateProduct);
        setShowNavButton(true);

        // Add a short follow-up suggesting specific Chama quick actions
        const quickList = `Quick actions:\n• register group\n• register member\n• request loan\n• approve member loan (signatory)\n• float group loans\n• link nsndogo\n\nReply with one of the actions above and I'll take you directly to that button.`;
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
        const wantsNavigation = !!lowerQuery.match(/\b(take me to|go to|open|show|navigate|access|guide me to|how to access|i want to|i would like to|could you|can you|kindly|will you|would you)\b/);
        const wantsWithdraw = !!lowerQuery.match(/\b(withdraw|withdrawal|cash out|cash-out|take out money|access my money|access money|how can i withdraw|how can i access my money|how do i withdraw|how do i access my money)\b/);
        const wantsDeposit = !!lowerQuery.match(/\b(deposit|deposit money|deposit cash|add money|top up|cash in|cash-in|add funds|put money in wallet|deposit into|fund my account|add money to my wallet)\b/);
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
