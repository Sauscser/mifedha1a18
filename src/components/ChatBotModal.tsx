import React, { useState, useRef, useEffect } from 'react';
import {
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
  const { i18n } = useTranslation();
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const lang = i18n.language?.split('-')[0] || 'en';
  const t = chatTranslations[lang] || chatTranslations.en;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

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
      // Check if asking HOW TO ACCESS / NAVIGATE to a product
      else if (lowerQuery.match(/how (do i|to|can i)|access|navigate|guide|where (is|do i|can i)|get to|find|open|show|go to|take me|steps to/)) {
        const matchedProducts = getProductsByKeyword(lowerQuery);
        if (matchedProducts.length > 0) {
          const product = matchedProducts[0];
          const directNavigation = !!lowerQuery.match(/\b(take me to|go to|open|show( me)?|navigate to|take me|open the|take me there)\b/);

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

          if (directNavigation) {
            navigateProduct = product.screen;
          }
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
      else if (lowerQuery.match(/\b(shopping|go shopping|marketplace|browse items|search items|cart|buy now|shop now|online shopping)\b/)) {
        const product = getProductsByKeyword('go-shopping')[0] || PRODUCTS.find((p) => p.id === 'go-shopping');
        if (product) {
          const guide = (product as any).howToAccess?.[lang] || (product as any).howToAccess?.en;
          botResponse = guide || (`🛍️ **GoShopping Marketplace**\n\n` +
            `${product.description[lang] || product.description.en}`);
        } else {
          botResponse = `I can help you with GoShopping. Open the GoShopping tab, search for products, and add them to your cart.`;
        }
      }
      // Check if asking about transport/delivery
      else if (lowerQuery.match(/transport|delivery|shipping|send|courier|driver|freight/)) {
        const product = getProductsByKeyword('transport')[0] || PRODUCTS[4];
        const guide = (product as any).howToAccess?.[lang] || (product as any).howToAccess?.en;
        botResponse = guide || (`🚗 **Transport Services**\n\n` +
          `${product.description[lang] || product.description.en}\n\n` +
          `✨ **Key Features:**\n• ${(product.benefits[lang] || product.benefits.en).slice(0, 3).join('\n• ')}`);
        navigateProduct = product.screen;
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

      addMessage(botResponse, 'bot');

      // Trigger navigation if user asked to go there
      if (navigateProduct && lowerQuery.match(/take me|go to|open|show|navigate|access|guide me to|how to access/)) {
        if (onNavigate) {
          setTimeout(() => onNavigate(navigateProduct!), 500);
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
