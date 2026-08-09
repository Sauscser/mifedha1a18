/**
 * Product Database with AI Responses for Chat Navigation
 * Supports 13 languages: en, ar, zh, ru, sw, fr, es, de, pt, it, he, hi, am
 */

export interface QuickAction {
  keywords: string[];
  response: Record<string, string>;
}

export interface ProductInfo {
  id: string;
  screen: string;
  keywords: string[];
  description: Record<string, string>;
  benefits: Record<string, string[]>;
  aboutProduct: Record<string, string>;
  howToAccess: Record<string, string>;
  quickActions?: QuickAction[];
}

export const PRODUCTS: ProductInfo[] = [
  {
    id: 'pal-pal-loans',
    screen: 'LnsScreen',
    keywords: ['pal', 'loan', 'friend', 'borrow', 'lend', 'credit', 'money'],
    description: {
      en: 'Pal-Pal is a peer-to-peer lending product where friends and trusted contacts can lend money to each other with flexible terms.',
      ar: 'Pal-Pal هو منتج إقراض من نظير إلى نظير حيث يمكن للأصدقاء والجهات الموثوقة إقراض الأموال لبعضهم البعض بشروط مرنة.',
      zh: 'Pal-Pal是一种点对点借贷产品，朋友和信任的联系人可以相互借钱，条件灵活。',
      ru: 'Pal-Pal — это продукт одноранговых ссуд, где друзья и доверенные контакты могут ссужать друг другу деньги на гибких условиях.',
      sw: 'Pal-Pal ni bidhaa ya mikopo ya mtu kwa mtu ambapo rafiki na wasiliana wanaoaminika wanaweza kukamatia pesa kwa kila mmoja kwa masharti yanayobadilika.',
      fr: 'Pal-Pal est un produit de prêt entre pairs où les amis et les contacts de confiance peuvent se prêter de l\'argent à des conditions flexibles.',
      es: 'Pal-Pal es un producto de préstamo entre pares donde amigos y contactos de confianza pueden prestarse dinero entre sí con términos flexibles.',
      de: 'Pal-Pal ist ein Peer-to-Peer-Kreditprodukt, bei dem Freunde und vertrauenswürdige Kontakte sich gegenseitig Geld mit flexiblen Bedingungen leihen können.',
      pt: 'Pal-Pal é um produto de empréstimo entre pares onde amigos e contatos confiáveis podem emprestar dinheiro uns aos outros com termos flexíveis.',
      it: 'Pal-Pal è un prodotto di prestito peer-to-peer in cui amici e contatti affidabili possono prestare denaro l\'uno all\'altro con termini flessibili.',
      he: 'Pal-Pal היא מוצר הלוואה מעמית לעמית כאשר חברים ותמיכות אמינות יכולות להלוות זו לזו כסף בתנאים גמישים.',
      hi: 'Pal-Pal एक पीयर-टू-पीयर उधार उत्पाद है जहां दोस्त और विश्वसनीय संपर्क लचकदार शर्तों के साथ एक दूसरे को पैसा उधार दे सकते हैं।',
      am: 'Pal-Pal ጓደኞች እና አስተማማኝ ዓሰናዶች እርስ በርስ ገንዘብ መለስ ልቅ ሁኔታዎች ሊለዩ የሚችሉበት ሆሌ-ለ-ሆሌ ብድር ምርት ነው።'
    },
    benefits: {
      en: [
        'Borrow from trusted friends and family',
        'Flexible repayment schedules',
        'Lower interest rates than banks',
        'Build credit history',
        'Help others while earning interest'
      ],
      ar: [
        'استعير من الأصدقاء والعائلة الموثوقين',
        'جداول سداد مرنة',
        'معدلات فائدة أقل من البنوك',
        'بناء سجل ائتماني',
        'ساعد الآخرين أثناء كسب الفائدة'
      ],
      zh: [
        '向可信任的朋友和家人借钱',
        '灵活的还款计划',
        '利率低于银行',
        '建立信用记录',
        '帮助他人同时赚取利息'
      ],
      ru: [
        'Занимайте у надежных друзей и семьи',
        'Гибкие графики погашения',
        'Более низкие процентные ставки, чем в банках',
        'Построить кредитную историю',
        'Помогайте другим, зарабатывая проценты'
      ],
      sw: [
        'Karamu kutoka kwa rafiki na familia wanaoaminika',
        'Ratiba za malipo yanayobadilika',
        'Viwango vya riba vya chini kuliko benki',
        'Kujenga historia ya mikopo',
        'Msaada kwa wengine wakati wa kugani riba'
      ],
      fr: [
        'Emprunter à des amis et à la famille de confiance',
        'Calendriers de remboursement flexibles',
        'Taux d\'intérêt plus bas que les banques',
        'Construire un historique de crédit',
        'Aider les autres tout en gagnant des intérêts'
      ],
      es: [
        'Pedir prestado a amigos y familiares de confianza',
        'Cronogramas de pago flexibles',
        'Tasas de interés más bajas que los bancos',
        'Construir historial crediticio',
        'Ayudar a otros mientras gana intereses'
      ],
      de: [
        'Geld von vertrauenswürdigen Freunden und Familie leihen',
        'Flexible Rückzahlungspläne',
        'Niedrigere Zinssätze als Banken',
        'Kredithistorie aufbauen',
        'Anderen helfen und dabei Zinsen verdienen'
      ],
      pt: [
        'Pedir emprestado de amigos e familiares confiáveis',
        'Cronogramas de pagamento flexíveis',
        'Taxas de juros mais baixas que os bancos',
        'Construir histórico de crédito',
        'Ajudar outras pessoas enquanto ganha juros'
      ],
      it: [
        'Prendere in prestito da amici e familiari affidabili',
        'Programmi di rimborso flessibili',
        'Tassi di interesse inferiori alle banche',
        'Costruire una storia creditizia',
        'Aiutare gli altri mentre guadagni interessi'
      ],
      he: [
        'הלוואה מחברים ומשפחה אמינים',
        'לוחות זמנים גמישים להחזר',
        'שיעורי ריבית נמוכים יותר מהבנקים',
        'בניית היסטוריית אשראי',
        'עזור לאחרים בזמן הרבח ריבית'
      ],
      hi: [
        'विश्वसनीय दोस्तों और परिवार से उधार लें',
        'लचकदार चुकौती अनुसूची',
        'बैंकों की तुलना में कम ब्याज दरें',
        'क्रेडिट इतिहास बनाएं',
        'ब्याज अर्जित करते हुए दूसरों की मदद करें'
      ],
      am: [
        'አስተማማኝ ጓደኞች እና ቤተሰብ ወደ ላይ',
        '유연한 ተመላሊሽ መርሃግብር',
        'ከባንክ ያነሰ ወለድ ምጥጥን',
        'የክሬዲት ታሪክ ይገነቡ',
        'ወለድ ሲያገኙ ሌሎችን ይርዱ'
      ]
    },
    aboutProduct: {
      en: 'Pal-Pal connects friends and trusted contacts to share financial resources. It promotes financial inclusion and trust-based lending in your community.',
      ar: 'يربط Pal-Pal الأصدقاء والجهات الموثوقة لمشاركة الموارد المالية. يعزز الشمول المالي والإقراض القائم على الثقة في مجتمعك.',
      zh: 'Pal-Pal连接朋友和信任的联系人来共享财务资源。它促进了您社区中的金融包容性和基于信任的借贷。',
      ru: 'Pal-Pal соединяет друзей и доверенные контакты для обмена финансовыми ресурсами. Это способствует финансовой доступности и кредитованию на основе доверия в вашем сообществе.',
      sw: 'Pal-Pal unganisha rafiki na wasiliana wanaoaminika ili kushiriki rasilimali za kifedha. Inaboresha ujumuishaji wa kifedha na mkopa unaotegemea imani katika jamii yako.',
      fr: 'Pal-Pal relie les amis et les contacts de confiance pour partager les ressources financières. Il favorise l\'inclusion financière et les prêts fondés sur la confiance dans votre communauté.',
      es: 'Pal-Pal conecta amigos y contactos de confianza para compartir recursos financieros. Promueve la inclusión financiera y los préstamos basados en la confianza en su comunidad.',
      de: 'Pal-Pal verbindet Freunde und vertrauenswürdige Kontakte zum Teilen von Finanzressourcen. Es fördert finanzielle Inklusion und vertrauensbasierte Kreditvergabe in Ihrer Gemeinschaft.',
      pt: 'Pal-Pal conecta amigos e contatos confiáveis para compartilhar recursos financeiros. Promove inclusão financeira e empréstimos baseados em confiança em sua comunidade.',
      it: 'Pal-Pal collega amici e contatti affidabili per condividere risorse finanziarie. Promuove l\'inclusione finanziaria e i prestiti basati sulla fiducia nella tua comunità.',
      he: 'Pal-Pal מחבר חברים וטעונים אמינים לשתף משאבים פיננסיים. זה מעודד קידום פיננסי והלוואות מבוססות אמון בקהילה שלך.',
      hi: 'Pal-Pal दोस्तों और विश्वसनीय संपर्कों को वित्तीय संसाधनों को साझा करने के लिए जोड़ता है। यह आपके समुदाय में वित्तीय समावेश और विश्वास-आधारित उधार को बढ़ावा देता है।',
      am: 'Pal-Pal ጓደኞች እና አስተማማኝ ዓሰናዶች ጋር የዋጋ ጥንቅቋ ሀብት ለመከፋፈል ያገናኛል። በእርስዎ ማህበረሰብ ውስጥ ገንዘብ የመሰብሰብ እና መሠረቱ አምናታዊ ብድር ይመርታል።'
    },
    howToAccess: {
      en: '📍 How to access Friend Products (Pal-Pal):\n\n1️⃣ On the **Home screen**, tap the **"Friend Products"** button\n2️⃣ The screen opens with these sections:\n\n📌 **View Exchange Rates** — check current currency rates\n\n📌 **Loan Requests**\n• Make Loan Requests — request a loan from a pal\n\n📌 **Grant Loan Requests**\n• Biz2Pal — your business lends to an individual\n• Pal2Pal — you lend to another individual\n\n📌 **Biz Loan Status**\n• Company Loanees | Loaning Companies\n\n📌 **Pal Loan Status**\n• My Loanees | My Loaners\n\n📌 **Account**\n• View Deposits\n• Update Main Account\n• Send Cash\n• View Cash sent to Pals or Transporter\n• View Cash received from Biz\n• View Cash received from Pals\n\n📌 **Withdrawals**\n• Withdraw Money | View Withdrawn Money\n\n📌 **Other Operations**\n• Boost Pooled Benefits\n• Search Loan Ads\n• Advertise\n• Delete Loan Ads',
      ar: '📍 كيفية الوصول إلى قروض Pal-Pal:\n\n1️⃣ انظر إلى أسفل شاشتك — سترى علامات تبويب\n2️⃣ اضغط على علامة تبويب **"Search Pal"** (أيقونة البحث 🔍 في أقصى اليمين)\n3️⃣ ستظهر لك قائمة بالأصدقاء المتاحين للإقراض أو الاقتراض\n4️⃣ اختر صديقاً وحدد شروط القرض\n\n💡 يمكنك أيضاً الذهاب إلى **حسابي** ← قسم القروض لعرض قروضك النشطة وسدادها.',
      sw: '📍 Jinsi ya kufikia Mikopo ya Pal-Pal:\n\n1️⃣ Angalia chini ya skrini yako — utaona kichupo\n2️⃣ Bonyeza kichupo **"Search Pal"** (ikoni ya utafutaji 🔍 upande wa kulia kabisa)\n3️⃣ Utaona orodha ya marafiki wanapatikana kukopa au kuazima\n4️⃣ Chagua rafiki na uchague masharti ya mkopo\n\n💡 Unaweza pia kwenda **Akaunti Yangu** → sehemu ya Mikopo kuona mikopo yako inayoendelea.',
      fr: '📍 Comment accéder aux prêts Pal-Pal:\n\n1️⃣ Regardez en bas de votre écran — vous verrez des onglets\n2️⃣ Appuyez sur l\'onglet **"Search Pal"** (icône de recherche 🔍 à l\'extrême droite)\n3️⃣ Vous verrez une liste de pals disponibles pour prêter ou emprunter\n4️⃣ Sélectionnez un pal et choisissez vos conditions de prêt',
      es: '📍 Cómo acceder a los Préstamos Pal-Pal:\n\n1️⃣ Mira la parte inferior de tu pantalla — verás pestañas\n2️⃣ Toca la pestaña **"Search Pal"** (ícono de búsqueda 🔍 en el extremo derecho)\n3️⃣ Verás una lista de pals disponibles para prestar o pedir prestado\n4️⃣ Selecciona un pal y elige tus términos de préstamo',
      de: '📍 Wie Sie auf Pal-Pal-Darlehen zugreifen:\n\n1️⃣ Sehen Sie sich den unteren Bereich Ihres Bildschirms an — Sie sehen Tabs\n2️⃣ Tippen Sie auf den Tab **"Search Pal"** (Suchsymbol 🔍 ganz rechts)\n3️⃣ Sie sehen eine Liste verfügbarer Pals zum Verleihen oder Ausleihen\n4️⃣ Wählen Sie einen Pal und wählen Sie Ihre Kreditbedingungen',
      zh: '📍 如何访问Pal-Pal贷款:\n\n1️⃣ 看屏幕底部 — 你会看到选项卡\n2️⃣ 点击 **"Search Pal"** 选项卡（右下角的搜索图标 🔍）\n3️⃣ 你会看到可借贷的好友列表\n4️⃣ 选择一个好友并选择贷款条件',
      ru: '📍 Как получить доступ к кредитам Pal-Pal:\n\n1️⃣ Посмотрите в нижнюю часть экрана — вы увидите вкладки\n2️⃣ Нажмите вкладку **"Search Pal"** (значок поиска 🔍 крайний справа)\n3️⃣ Вы увидите список доступных партнёров для займа\n4️⃣ Выберите партнёра и определите условия займа',
      pt: '📍 Como acessar os Empréstimos Pal-Pal:\n\n1️⃣ Olhe para a parte inferior da tela — você verá abas\n2️⃣ Toque na aba **"Search Pal"** (ícone de pesquisa 🔍 no extremo direito)\n3️⃣ Você verá uma lista de pals disponíveis para emprestar ou pedir emprestado\n4️⃣ Selecione um pal e escolha seus termos de empréstimo',
      it: '📍 Come accedere ai Prestiti Pal-Pal:\n\n1️⃣ Guarda in basso sullo schermo — vedrai le schede\n2️⃣ Tocca la scheda **"Search Pal"** (icona di ricerca 🔍 all\'estrema destra)\n3️⃣ Vedrai un elenco di pal disponibili per prestare o prendere in prestito\n4️⃣ Seleziona un pal e scegli i tuoi termini di prestito',
      he: '📍 כיצד לגשת להלוואות Pal-Pal:\n\n1️⃣ הסתכל בתחתית המסך — תראה כרטיסיות\n2️⃣ הקש על הכרטיסייה **"Search Pal"** (סמל חיפוש 🔍 בקצה הימני)\n3️⃣ תראה רשימה של pals זמינים להלוואה\n4️⃣ בחר pal ובחר את תנאי ההלוואה שלך',
      hi: '📍 Pal-Pal ऋण तक कैसे पहुंचें:\n\n1️⃣ अपनी स्क्रीन के नीचे देखें — आपको टैब दिखेंगे\n2️⃣ **"Search Pal"** टैब (🔍 सबसे दाईं ओर खोज आइकन) टैप करें\n3️⃣ आपको उधार लेने या देने के लिए उपलब्ध Pal की सूची दिखेगी\n4️⃣ एक Pal चुनें और ऋण शर्तें तय करें',
      am: '📍 Pal-Pal ብድር እንዴት ማግኘት:\n\n1️⃣ ስክሪን ታችኛ ክፍል ይመልከቱ — ትሎች ይታዩዎታል\n2️⃣ **"Search Pal"** ትሎ (🔍 የፍለጋ አዶ) ይጫኑ\n3️⃣ ለመዋስ ወይም ለማዋስ ዝርዝር pal ሾ ይታያል\n4️⃣ pal ይምረጡ እና የብድር ሁኔታዎች ይወስኑ'
    },
    quickActions: [
      {
        keywords: ['make loan request', 'request a loan', 'apply for loan', 'ask for loan', 'borrow money', 'i need a loan', 'friend loan', 'pal loan request'],
        response: {
          en: '📍 **How to make a Loan Request (Friend Products):**\n\n1️⃣ From **Home**, tap **"Friend Products"**\n2️⃣ Under **"Loan Requests"**, tap **"Make Loan Requests"**\n3️⃣ Fill in the loan amount, terms and the pal you want to borrow from\n4️⃣ Submit the request\n\n💡 Your pal will receive a notification to approve or decline your request.',
          sw: '📍 **Jinsi ya kuomba mkopo (Bidhaa za Rafiki):**\n\n1️⃣ Kutoka **Nyumbani**, bonyeza **"Friend Products"**\n2️⃣ Chini ya **"Maombi ya Mkopo"**, bonyeza **"Toa Ombi la Mkopo"**\n3️⃣ Jaza kiasi cha mkopo, masharti na rafiki unayetaka kukopa kutoka kwake\n4️⃣ Wasilisha ombi\n\n💡 Rafiki wako atapata arifa ya kukubali au kukataa ombi lako.',
          fr: '📍 **Comment faire une demande de prêt (Produits amis):**\n\n1️⃣ Depuis **Accueil**, appuyez sur **"Friend Products"**\n2️⃣ Sous **"Demandes de prêt"**, appuyez sur **"Faire des demandes de prêt"**\n3️⃣ Remplissez le montant, les conditions et le pal auprès duquel vous empruntez\n4️⃣ Soumettez\n\n💡 Votre pal recevra une notification pour approuver ou refuser.',
          es: '📍 **Cómo solicitar un préstamo (Productos de amigos):**\n\n1️⃣ Desde **Inicio**, toca **"Friend Products"**\n2️⃣ En **"Solicitudes de préstamo"**, toca **"Hacer solicitudes de préstamo"**\n3️⃣ Completa el monto, condiciones y el pal al que pides prestado\n4️⃣ Envía\n\n💡 Tu pal recibirá una notificación para aprobar o rechazar.',
          de: '📍 **Wie man eine Kreditanfrage stellt (Freund-Produkte):**\n\n1️⃣ Vom **Startbildschirm** **"Friend Products"** tippen\n2️⃣ Unter **"Kreditanfragen"** auf **"Kreditanfragen stellen"** tippen\n3️⃣ Betrag, Bedingungen und Pal ausfüllen\n4️⃣ Absenden\n\n💡 Ihr Pal erhält eine Benachrichtigung zur Genehmigung oder Ablehnung.',
          zh: '📍 **如何发起贷款申请（朋友产品）:**\n\n1️⃣ 从**主屏幕**点击 **"Friend Products"**\n2️⃣ 在 **"贷款申请"** 下，点击 **"发起贷款申请"**\n3️⃣ 填写金额、条款和要借款的好友\n4️⃣ 提交\n\n💡 您的好友将收到通知以批准或拒绝。',
          ru: '📍 **Как подать заявку на кредит (Дружеские продукты):**\n\n1️⃣ С **главного экрана** нажмите **"Friend Products"**\n2️⃣ В **"Запросы на кредит"** нажмите **"Подать запрос на кредит"**\n3️⃣ Заполните сумму, условия и выберите партнёра\n4️⃣ Отправьте\n\n💡 Ваш партнёр получит уведомление об одобрении или отклонении.',
          pt: '📍 **Como fazer uma solicitação de empréstimo (Produtos de amigos):**\n\n1️⃣ Da **tela inicial**, toque em **"Friend Products"**\n2️⃣ Em **"Solicitações de empréstimo"**, toque em **"Fazer solicitações de empréstimo"**\n3️⃣ Preencha valor, condições e o pal de quem quer pedir emprestado\n4️⃣ Envie\n\n💡 Seu pal receberá uma notificação para aprovar ou recusar.',
          it: '📍 **Come fare una richiesta di prestito (Prodotti amici):**\n\n1️⃣ Dalla **schermata principale**, tocca **"Friend Products"**\n2️⃣ Sotto **"Richieste di prestito"**, tocca **"Fai richieste di prestito"**\n3️⃣ Compila importo, condizioni e il pal a cui chiedi\n4️⃣ Invia\n\n💡 Il tuo pal riceverà una notifica per approvare o rifiutare.',
          he: '📍 **כיצד לבקש הלוואה (מוצרי חברים):**\n\n1️⃣ מ**מסך הבית**, הקש **"Friend Products"**\n2️⃣ תחת **"בקשות הלוואה"**, הקש **"הגש בקשת הלוואה"**\n3️⃣ מלא סכום, תנאים וה-pal שממנו אתה לווה\n4️⃣ שלח\n\n💡 ה-pal שלך יקבל התראה לאישור או דחייה.',
          hi: '📍 **ऋण अनुरोध कैसे करें (मित्र उत्पाद):**\n\n1️⃣ **होम** से **"Friend Products"** टैप करें\n2️⃣ **"ऋण अनुरोध"** के तहत **"ऋण अनुरोध करें"** टैप करें\n3️⃣ राशि, शर्तें और जिस Pal से उधार लेना है वह भरें\n4️⃣ सबमिट करें\n\n💡 आपके Pal को मंजूरी या अस्वीकार करने की सूचना मिलेगी।',
          am: '📍 **የብድር ጥያቄ እንዴት ያቅርቡ (የጓደኞች ምርቶች):**\n\n1️⃣ **መነሻ** ላይ **"Friend Products"** ይጫኑ\n2️⃣ **"የብድር ጥያቄዎች"** ስር **"የብድር ጥያቄ አቅርቡ"** ይጫኑ\n3️⃣ መጠን፣ ሁኔታዎች እና pal ይሙሉ\n4️⃣ ያስገቡ\n\n💡 pal ማፅደቅ ወይም ውድቅ ለማድረግ ማሳወቂያ ይቀበላሉ።'
        }
      },
      {
        keywords: ['grant loan', 'approve loan request', 'give loan to friend', 'lend to pal', 'grant pal loan', 'pal2pal grant', 'biz2pal grant'],
        response: {
          en: '📍 **How to grant a Loan Request:**\n\n1️⃣ From **Home**, tap **"Friend Products"**\n2️⃣ Under **"Grant Loan Requests"**, choose:\n   • **Biz2Pal** — your business lending to an individual\n   • **Pal2Pal** — you (individual) lending to another individual\n3️⃣ Select the pending request and confirm the amount\n4️⃣ Approve to release the funds\n\n💡 Make sure you have enough balance before approving.',
          sw: '📍 **Jinsi ya kuidhinisha Ombi la Mkopo:**\n\n1️⃣ Kutoka **Nyumbani**, bonyeza **"Friend Products"**\n2️⃣ Chini ya **"Idhinisha Maombi ya Mkopo"**, chagua:\n   • **Biz2Pal** — biashara yako inakopa mtu\n   • **Pal2Pal** — wewe (mtu binafsi) unakopa mtu mwingine\n3️⃣ Chagua ombi linalongoja na thibitisha kiasi\n4️⃣ Idhinisha kutoa fedha\n\n💡 Hakikisha una salio la kutosha kabla ya kuidhinisha.',
          fr: '📍 **Comment accorder une demande de prêt:**\n\n1️⃣ Depuis **Accueil**, appuyez sur **"Friend Products"**\n2️⃣ Sous **"Accorder des demandes de prêt"**, choisissez:\n   • **Biz2Pal** — votre entreprise prête à un particulier\n   • **Pal2Pal** — vous (particulier) prêtez à un autre particulier\n3️⃣ Sélectionnez la demande en attente et confirmez le montant\n4️⃣ Approuvez pour libérer les fonds',
          es: '📍 **Cómo aprobar una solicitud de préstamo:**\n\n1️⃣ Desde **Inicio**, toca **"Friend Products"**\n2️⃣ En **"Conceder solicitudes de préstamo"**, elige:\n   • **Biz2Pal** — tu negocio prestando a un individuo\n   • **Pal2Pal** — tú (individuo) prestando a otro individuo\n3️⃣ Selecciona la solicitud pendiente y confirma el monto\n4️⃣ Aprueba para liberar los fondos',
          de: '📍 **Wie man eine Kreditanfrage genehmigt:**\n\n1️⃣ Vom **Startbildschirm** **"Friend Products"** tippen\n2️⃣ Unter **"Kreditanfragen genehmigen"** wählen:\n   • **Biz2Pal** — Ihr Unternehmen verleiht an eine Einzelperson\n   • **Pal2Pal** — Sie (Einzelperson) verleihen an eine andere Einzelperson\n3️⃣ Ausstehende Anfrage auswählen und Betrag bestätigen\n4️⃣ Genehmigen um Mittel freizugeben',
          zh: '📍 **如何批准贷款申请:**\n\n1️⃣ 从**主屏幕**点击 **"Friend Products"**\n2️⃣ 在 **"批准贷款申请"** 下，选择:\n   • **Biz2Pal** — 您的企业向个人放贷\n   • **Pal2Pal** — 您（个人）向另一个人放贷\n3️⃣ 选择待处理的申请并确认金额\n4️⃣ 批准以释放资金',
          ru: '📍 **Как одобрить запрос на кредит:**\n\n1️⃣ С **главного экрана** нажмите **"Friend Products"**\n2️⃣ В **"Одобрение запросов на кредит"** выберите:\n   • **Biz2Pal** — ваш бизнес даёт кредит физлицу\n   • **Pal2Pal** — вы (физлицо) даёте кредит другому физлицу\n3️⃣ Выберите ожидающий запрос и подтвердите сумму\n4️⃣ Одобрите для выдачи средств',
          pt: '📍 **Como aprovar uma solicitação de empréstimo:**\n\n1️⃣ Da **tela inicial**, toque em **"Friend Products"**\n2️⃣ Em **"Conceder solicitações de empréstimo"**, escolha:\n   • **Biz2Pal** — seu negócio emprestando a um indivíduo\n   • **Pal2Pal** — você (indivíduo) emprestando a outro indivíduo\n3️⃣ Selecione a solicitação pendente e confirme o valor\n4️⃣ Aprove para liberar os fundos',
          it: '📍 **Come approvare una richiesta di prestito:**\n\n1️⃣ Dalla **schermata principale**, tocca **"Friend Products"**\n2️⃣ Sotto **"Concedi richieste di prestito"**, scegli:\n   • **Biz2Pal** — la tua azienda presta a un individuo\n   • **Pal2Pal** — tu (individuo) presti a un altro individuo\n3️⃣ Seleziona la richiesta in sospeso e conferma l\'importo\n4️⃣ Approva per rilasciare i fondi',
          he: '📍 **כיצד לאשר בקשת הלוואה:**\n\n1️⃣ מ**מסך הבית**, הקש **"Friend Products"**\n2️⃣ תחת **"אשר בקשות הלוואה"**, בחר:\n   • **Biz2Pal** — העסק שלך מלווה לאדם פרטי\n   • **Pal2Pal** — אתה (פרט) מלווה לפרט אחר\n3️⃣ בחר את הבקשה הממתינה ואשר את הסכום\n4️⃣ אשר לשחרור הכספים',
          hi: '📍 **ऋण अनुरोध कैसे स्वीकृत करें:**\n\n1️⃣ **होम** से **"Friend Products"** टैप करें\n2️⃣ **"ऋण अनुरोध स्वीकृत करें"** के तहत चुनें:\n   • **Biz2Pal** — आपका व्यवसाय किसी व्यक्ति को उधार दे रहा है\n   • **Pal2Pal** — आप (व्यक्ति) दूसरे व्यक्ति को उधार दे रहे हैं\n3️⃣ लंबित अनुरोध चुनें और राशि पुष्टि करें\n4️⃣ धन जारी करने के लिए स्वीकृत करें',
          am: '📍 **የብድር ጥያቄ እንዴት ያፅድቁ:**\n\n1️⃣ **መነሻ** ላይ **"Friend Products"** ይጫኑ\n2️⃣ **"የብድር ጥያቄዎች ፍቀዱ"** ስር ይምረጡ:\n   • **Biz2Pal** — ንግድዎ ለግለሰብ ያበድራል\n   • **Pal2Pal** — እርስዎ (ግለሰብ) ለሌላ ግለሰብ ያበድራሉ\n3️⃣ በመጠበቅ ላይ ያለውን ጥያቄ ይምረጡ እና መጠን ያረጋግጡ\n4️⃣ ገንዘብ ለመልቀቅ ያፅድቁ'
        }
      },
      {
        keywords: ['withdraw money', 'withdraw funds', 'take out money', 'withdrawal', 'cash out'],
        response: {
          en: '📍 **How to withdraw money (Friend Products):**\n\n1️⃣ From **Home**, tap **"Friend Products"**\n2️⃣ Scroll to **"Withdrawals"**\n3️⃣ Tap **"Withdraw Money"** — choose your withdrawal method and amount\n4️⃣ Confirm\n\n💡 Tap **"View Withdrawn Money"** to see your withdrawal history.',
          sw: '📍 **Jinsi ya kutoa pesa (Bidhaa za Rafiki):**\n\n1️⃣ Kutoka **Nyumbani**, bonyeza **"Friend Products"**\n2️⃣ Telezesha hadi **"Uondoaji"**\n3️⃣ Bonyeza **"Toa Pesa"** — chagua njia ya uondoaji na kiasi\n4️⃣ Thibitisha\n\n💡 Bonyeza **"Angalia Pesa Zilizotolewa"** kuona historia yako ya uondoaji.',
          fr: '📍 **Comment retirer de l\'argent (Produits amis):**\n\n1️⃣ Depuis **Accueil**, appuyez sur **"Friend Products"**\n2️⃣ Faites défiler vers **"Retraits"**\n3️⃣ Appuyez sur **"Retirer de l\'argent"** — choisissez méthode et montant\n4️⃣ Confirmez',
          es: '📍 **Cómo retirar dinero (Productos de amigos):**\n\n1️⃣ Desde **Inicio**, toca **"Friend Products"**\n2️⃣ Desplázate hasta **"Retiros"**\n3️⃣ Toca **"Retirar dinero"** — elige método y monto\n4️⃣ Confirma',
          de: '📍 **Wie man Geld abhebt (Freund-Produkte):**\n\n1️⃣ Vom **Startbildschirm** **"Friend Products"** tippen\n2️⃣ Zu **"Abhebungen"** scrollen\n3️⃣ **"Geld abheben"** tippen — Methode und Betrag wählen\n4️⃣ Bestätigen',
          zh: '📍 **如何提款（朋友产品）:**\n\n1️⃣ 从**主屏幕**点击 **"Friend Products"**\n2️⃣ 滚动到 **"提款"**\n3️⃣ 点击 **"提款"** — 选择提款方式和金额\n4️⃣ 确认',
          ru: '📍 **Как вывести деньги (Дружеские продукты):**\n\n1️⃣ С **главного экрана** нажмите **"Friend Products"**\n2️⃣ Прокрутите до **"Снятия"**\n3️⃣ Нажмите **"Вывести деньги"** — выберите метод и сумму\n4️⃣ Подтвердите',
          pt: '📍 **Como retirar dinheiro (Produtos de amigos):**\n\n1️⃣ Da **tela inicial**, toque em **"Friend Products"**\n2️⃣ Role até **"Retiradas"**\n3️⃣ Toque em **"Retirar dinheiro"** — escolha método e valor\n4️⃣ Confirme',
          it: '📍 **Come prelevare denaro (Prodotti amici):**\n\n1️⃣ Dalla **schermata principale**, tocca **"Friend Products"**\n2️⃣ Scorri fino a **"Prelievi"**\n3️⃣ Tocca **"Preleva denaro"** — scegli metodo e importo\n4️⃣ Conferma',
          he: '📍 **כיצד למשוך כסף (מוצרי חברים):**\n\n1️⃣ מ**מסך הבית**, הקש **"Friend Products"**\n2️⃣ גלול ל**"משיכות"**\n3️⃣ הקש **"משוך כסף"** — בחר שיטה וסכום\n4️⃣ אשר',
          hi: '📍 **पैसे कैसे निकालें (मित्र उत्पाद):**\n\n1️⃣ **होम** से **"Friend Products"** टैप करें\n2️⃣ **"निकासी"** तक स्क्रॉल करें\n3️⃣ **"पैसे निकालें"** टैप करें — तरीका और राशि चुनें\n4️⃣ पुष्टि करें',
          am: '📍 **ገንዘብ እንዴት ያወጡ (የጓደኞች ምርቶች):**\n\n1️⃣ **መነሻ** ላይ **"Friend Products"** ይጫኑ\n2️⃣ **"ወጪዎች"** ድረስ ይሸብልሉ\n3️⃣ **"ገንዘብ አውጣ"** ይጫኑ — ዘዴ እና መጠን ይምረጡ\n4️⃣ ያረጋግጡ'
        }
      },
      {
        keywords: ['send cash', 'send money to pal', 'send money to friend', 'transfer to pal', 'non loan transfer', 'send funds'],
        response: {
          en: '📍 **How to send cash to a Pal:**\n\n1️⃣ From **Home**, tap **"Friend Products"**\n2️⃣ Scroll to **"Account"**\n3️⃣ Tap **"Send Cash"**\n4️⃣ Select the recipient (pal or transporter) and enter the amount\n5️⃣ Confirm the transfer\n\n💡 Use **"View Cash sent to Pals or Transporter"** to track your transfers.',
          sw: '📍 **Jinsi ya kutuma pesa kwa Rafiki:**\n\n1️⃣ Kutoka **Nyumbani**, bonyeza **"Friend Products"**\n2️⃣ Telezesha hadi **"Akaunti"**\n3️⃣ Bonyeza **"Tuma Pesa"**\n4️⃣ Chagua mpokeaji (rafiki au msafirishaji) na ingiza kiasi\n5️⃣ Thibitisha uhamisho',
          fr: '📍 **Comment envoyer de l\'argent à un pal:**\n\n1️⃣ Depuis **Accueil**, appuyez sur **"Friend Products"**\n2️⃣ Faites défiler vers **"Compte"**\n3️⃣ Appuyez sur **"Envoyer de l\'argent"**\n4️⃣ Sélectionnez le destinataire et entrez le montant\n5️⃣ Confirmez le transfert',
          es: '📍 **Cómo enviar dinero a un pal:**\n\n1️⃣ Desde **Inicio**, toca **"Friend Products"**\n2️⃣ Desplázate hasta **"Cuenta"**\n3️⃣ Toca **"Enviar dinero"**\n4️⃣ Selecciona destinatario e ingresa monto\n5️⃣ Confirma la transferencia',
          de: '📍 **Wie man Geld an einen Pal sendet:**\n\n1️⃣ Vom **Startbildschirm** **"Friend Products"** tippen\n2️⃣ Zu **"Konto"** scrollen\n3️⃣ **"Bargeld senden"** tippen\n4️⃣ Empfänger auswählen und Betrag eingeben\n5️⃣ Überweisung bestätigen',
          zh: '📍 **如何向好友发送现金:**\n\n1️⃣ 从**主屏幕**点击 **"Friend Products"**\n2️⃣ 滚动到 **"账户"**\n3️⃣ 点击 **"发送现金"**\n4️⃣ 选择收款人并输入金额\n5️⃣ 确认转账',
          ru: '📍 **Как отправить деньги партнёру:**\n\n1️⃣ С **главного экрана** нажмите **"Friend Products"**\n2️⃣ Прокрутите до **"Счёт"**\n3️⃣ Нажмите **"Отправить наличные"**\n4️⃣ Выберите получателя и введите сумму\n5️⃣ Подтвердите перевод',
          pt: '📍 **Como enviar dinheiro a um pal:**\n\n1️⃣ Da **tela inicial**, toque em **"Friend Products"**\n2️⃣ Role até **"Conta"**\n3️⃣ Toque em **"Enviar dinheiro"**\n4️⃣ Selecione destinatário e insira o valor\n5️⃣ Confirme a transferência',
          it: '📍 **Come inviare denaro a un pal:**\n\n1️⃣ Dalla **schermata principale**, tocca **"Friend Products"**\n2️⃣ Scorri fino a **"Account"**\n3️⃣ Tocca **"Invia contanti"**\n4️⃣ Seleziona destinatario e inserisci importo\n5️⃣ Conferma il trasferimento',
          he: '📍 **כיצד לשלוח כסף לפאל:**\n\n1️⃣ מ**מסך הבית**, הקש **"Friend Products"**\n2️⃣ גלול ל**"חשבון"**\n3️⃣ הקש **"שלח מזומן"**\n4️⃣ בחר מקבל והזן סכום\n5️⃣ אשר את ההעברה',
          hi: '📍 **Pal को पैसे कैसे भेजें:**\n\n1️⃣ **होम** से **"Friend Products"** टैप करें\n2️⃣ **"खाता"** तक स्क्रॉल करें\n3️⃣ **"नकद भेजें"** टैप करें\n4️⃣ प्राप्तकर्ता चुनें और राशि दर्ज करें\n5️⃣ ट्रांसफर की पुष्टि करें',
          am: '📍 **ለ Pal ገንዘብ እንዴት ይላኩ:**\n\n1️⃣ **መነሻ** ላይ **"Friend Products"** ይጫኑ\n2️⃣ **"ሒሳብ"** ድረስ ይሸብልሉ\n3️⃣ **"ጥሬ ላኩ"** ይጫኑ\n4️⃣ ተቀባይ ይምረጡ እና መጠን ያስገቡ\n5️⃣ ዝውውሩን ያረጋግጡ'
        }
      },
      {
        keywords: ['advertise loan', 'loan ad', 'post loan ad', 'loan advertisement', 'search loan ads', 'find loan'],
        response: {
          en: '📍 **How to advertise or find a Loan:**\n\n1️⃣ From **Home**, tap **"Friend Products"**\n2️⃣ Scroll to **"Other Operations"**\n3️⃣ Choose:\n   • **"Advertise"** — post a loan offer so others can find and borrow from you\n   • **"Search Loan Ads"** — browse available loan offers from other pals\n   • **"Delete Loan Ads"** — remove your own loan advertisements\n\n💡 Advertising your loan offer increases your chances of finding borrowers quickly.',
          sw: '📍 **Jinsi ya kutangaza au kupata Mkopo:**\n\n1️⃣ Kutoka **Nyumbani**, bonyeza **"Friend Products"**\n2️⃣ Telezesha hadi **"Shughuli Nyingine"**\n3️⃣ Chagua:\n   • **"Tangaza"** — chapisha ofa ya mkopo ili wengine wakupate\n   • **"Tafuta Matangazo ya Mkopo"** — vinjari ofa za mikopo zinazopatikana\n   • **"Futa Matangazo ya Mkopo"** — ondoa matangazo yako ya mkopo',
          fr: '📍 **Comment publier ou trouver une annonce de prêt:**\n\n1️⃣ Depuis **Accueil**, appuyez sur **"Friend Products"**\n2️⃣ Faites défiler vers **"Autres opérations"**\n3️⃣ Choisissez:\n   • **"Faire de la pub"** — publiez une offre de prêt\n   • **"Rechercher des annonces de prêt"** — parcourez les offres disponibles\n   • **"Supprimer les annonces"** — supprimez vos annonces',
          es: '📍 **Cómo anunciar o encontrar un préstamo:**\n\n1️⃣ Desde **Inicio**, toca **"Friend Products"**\n2️⃣ Desplázate hasta **"Otras operaciones"**\n3️⃣ Elige:\n   • **"Anunciar"** — publica una oferta de préstamo\n   • **"Buscar anuncios de préstamo"** — explora ofertas disponibles\n   • **"Eliminar anuncios"** — elimina tus propios anuncios',
          de: '📍 **Wie man einen Kredit bewirbt oder findet:**\n\n1️⃣ Vom **Startbildschirm** **"Friend Products"** tippen\n2️⃣ Zu **"Weitere Operationen"** scrollen\n3️⃣ Wählen:\n   • **"Werben"** — Kreditangebot veröffentlichen\n   • **"Kreditanzeigen suchen"** — verfügbare Angebote durchsuchen\n   • **"Kreditanzeigen löschen"** — eigene Anzeigen entfernen',
          zh: '📍 **如何发布或查找贷款广告:**\n\n1️⃣ 从**主屏幕**点击 **"Friend Products"**\n2️⃣ 滚动到 **"其他操作"**\n3️⃣ 选择:\n   • **"广告"** — 发布贷款报价\n   • **"搜索贷款广告"** — 浏览可用贷款报价\n   • **"删除贷款广告"** — 删除您自己的广告',
          ru: '📍 **Как рекламировать или найти кредит:**\n\n1️⃣ С **главного экрана** нажмите **"Friend Products"**\n2️⃣ Прокрутите до **"Другие операции"**\n3️⃣ Выберите:\n   • **"Рекламировать"** — опубликовать предложение кредита\n   • **"Поиск кредитных объявлений"** — просмотр доступных предложений\n   • **"Удалить кредитные объявления"** — удалить свои объявления',
          pt: '📍 **Como anunciar ou encontrar um empréstimo:**\n\n1️⃣ Da **tela inicial**, toque em **"Friend Products"**\n2️⃣ Role até **"Outras operações"**\n3️⃣ Escolha:\n   • **"Anunciar"** — publique uma oferta de empréstimo\n   • **"Pesquisar anúncios de empréstimo"** — navegue pelas ofertas disponíveis\n   • **"Excluir anúncios"** — remova seus anúncios',
          it: '📍 **Come pubblicare o trovare un annuncio di prestito:**\n\n1️⃣ Dalla **schermata principale**, tocca **"Friend Products"**\n2️⃣ Scorri fino a **"Altre operazioni"**\n3️⃣ Scegli:\n   • **"Pubblicizza"** — pubblica un\'offerta di prestito\n   • **"Cerca annunci di prestito"** — sfoglia le offerte disponibili\n   • **"Elimina annunci"** — rimuovi i tuoi annunci',
          he: '📍 **כיצד לפרסם או למצוא הלוואה:**\n\n1️⃣ מ**מסך הבית**, הקש **"Friend Products"**\n2️⃣ גלול ל**"פעולות אחרות"**\n3️⃣ בחר:\n   • **"פרסם"** — פרסם הצעת הלוואה\n   • **"חפש מודעות הלוואה"** — עיין בהצעות זמינות\n   • **"מחק מודעות"** — הסר את המודעות שלך',
          hi: '📍 **ऋण विज्ञापन कैसे दें या खोजें:**\n\n1️⃣ **होम** से **"Friend Products"** टैप करें\n2️⃣ **"अन्य संचालन"** तक स्क्रॉल करें\n3️⃣ चुनें:\n   • **"विज्ञापन दें"** — ऋण प्रस्ताव पोस्ट करें\n   • **"ऋण विज्ञापन खोजें"** — उपलब्ध प्रस्ताव देखें\n   • **"ऋण विज्ञापन हटाएं"** — अपने विज्ञापन हटाएं',
          am: '📍 **ብድር እንዴት ያስተዋውቁ ወይም ይፈልጉ:**\n\n1️⃣ **መነሻ** ላይ **"Friend Products"** ይጫኑ\n2️⃣ **"ሌሎች ስራዎች"** ድረስ ይሸብልሉ\n3️⃣ ይምረጡ:\n   • **"ማስታወቂያ"** — የብድር ቅናሽ ያሳትሙ\n   • **"የብድር ማስታወቂያ ፈልጉ"** — ያሉ ቅናሾች ይፈልጉ\n   • **"ማስታወቂያዎች ሰርዙ"** — የራስዎን ማስታወቂያዎች ያስወግዱ'
        }
      }
    ]
  },
  {
    id: 'chama-groups',
    screen: 'ChamaScreen',
    keywords: ['chama', 'group', 'community', 'savings', 'contributions', 'dividends'],
    description: {
      en: 'Chama is a community-based savings and investment group where members contribute regularly and share benefits.',
      ar: 'Chama هي مجموعة ادخار واستثمار قائمة على المجتمع حيث يساهم الأعضاء بانتظام ويشاركون الفوائد.',
      zh: 'Chama是一个基于社区的储蓄和投资团体，其中成员定期贡献和分享利益。',
      ru: 'Chama — это группа сбережений и инвестиций, основанная на сообществе, где члены регулярно вносят и делятся преимуществами.',
      sw: 'Chama ni kundi la akiba na uongezaji wa jamii linalozingatia kuwa ndani ya jamii ambapo wanachama wanachangia kwa kawaida na kushiriki faida.',
      fr: 'Chama est un groupe d\'épargne et d\'investissement communautaire où les membres contribuent régulièrement et partagent les avantages.',
      es: 'Chama es un grupo de ahorros e inversiones basado en la comunidad donde los miembros contribuyen regularmente y comparten beneficios.',
      de: 'Chama ist eine gemeindebasierte Spar- und Investitionsgruppe, bei der Mitglieder regelmäßig beitragen und Vorteile teilen.',
      pt: 'Chama é um grupo de poupança e investimento baseado na comunidade onde os membros contribuem regularmente e compartilham benefícios.',
      it: 'Chama è un gruppo di risparmio e investimento basato sulla comunità dove i membri contribuiscono regolarmente e condividono i vantaggi.',
      he: 'Chama היא קבוצת חיסכון והשקעה המבוססת על קהילה שבה חברים תורמים באופן קבוע ומשתפים יתרונות.',
      hi: 'Chama एक सामुदायिक-आधारित बचत और निवेश समूह है जहां सदस्य नियमित रूप से योगदान देते हैं और लाभ साझा करते हैं।',
      am: 'Chama ሰብሳቢ-ተመሠሠ የቁጠባ እና ኢንቬስትመንት ቡድን ሲሆን አባላት በመደበኛ ሁኔታ ይሳተፋሉ እና ጥቅሞች ያጋራሉ።'
    },
    benefits: {
      en: [
        'Regular group savings',
        'Shared investment opportunities',
        'Access to group loans',
        'Dividend distributions',
        'Community support and trust'
      ],
      ar: [
        'الادخار الجماعي المنتظم',
        'فرص الاستثمار المشتركة',
        'الوصول إلى قروض المجموعة',
        'توزيعات الأرباح',
        'الدعم والثقة المجتمعية'
      ],
      zh: [
        '定期集体储蓄',
        '共享投资机会',
        '获得团体贷款',
        '股息分配',
        '社区支持和信任'
      ],
      ru: [
        'Регулярные групповые сбережения',
        'Возможности общих инвестиций',
        'Доступ к групповым ссудам',
        'Распределение дивидендов',
        'Общественная поддержка и доверие'
      ],
      sw: [
        'Akiba za kawaida za kundi',
        'Nafasi za uongezaji shirikishi',
        'Kufahamu mikopo ya kundi',
        'Mgawanyiko wa gawanya',
        'Msaada wa jamii na imani'
      ],
      fr: [
        'Épargnes de groupe régulières',
        'Opportunités d\'investissement partagées',
        'Accès aux prêts de groupe',
        'Distributions de dividendes',
        'Soutien communautaire et confiance'
      ],
      es: [
        'Ahorros de grupo regulares',
        'Oportunidades de inversión compartidas',
        'Acceso a préstamos grupales',
        'Distribuciones de dividendos',
        'Apoyo comunitario y confianza'
      ],
      de: [
        'Regelmäßige Gruppeneinsparungen',
        'Gemeinsame Investitionsmöglichkeiten',
        'Zugang zu Gruppendarlehen',
        'Dividendenausschüttungen',
        'Gemeinschaftliche Unterstützung und Vertrauen'
      ],
      pt: [
        'Poupanças de grupo regular',
        'Oportunidades de investimento compartilhadas',
        'Acesso a empréstimos de grupo',
        'Distribuições de dividendos',
        'Apoio comunitário e confiança'
      ],
      it: [
        'Risparmio di gruppo regolare',
        'Opportunità di investimento condivise',
        'Accesso a prestiti di gruppo',
        'Distribuzioni di dividendi',
        'Supporto e fiducia della comunità'
      ],
      he: [
        'חיסכון קבוצתי קבוע',
        'הזדמנויות השקעה משותפות',
        'גישה להלוואות קבוצתיות',
        'חלוקות דיבידנד',
        'תמיכה ובטחון קהילתי'
      ],
      hi: [
        'नियमित समूह बचत',
        'साझा निवेश के अवसर',
        'समूह ऋण तक पहुंच',
        'लाभांश वितरण',
        'सामुदायिक समर्थन और विश्वास'
      ],
      am: [
        'ተከታታይ የቡድን ቁጠባ',
        'የጋራ ኢንቬስትመንት ዕድሎች',
        'ወደ ቡድን ብድር መዳረሻ',
        'የጎራ ክፍፍሎች',
        'የማህበረሰብ ደጋፊ እና እምነት'
      ]
    },
    aboutProduct: {
      en: 'Chama groups empower communities to pool resources and collectively build wealth. Members meet regularly to contribute, discuss investments, and support each other financially.',
      ar: 'تمكن مجموعات Chama المجتمعات من تجميع الموارد وبناء الثروة بشكل جماعي. يجتمع الأعضاء بانتظام للمساهمة ومناقشة الاستثمارات ودعم بعضهم البعض ماليا.',
      zh: 'Chama小组赋予社区汇集资源和集体建立财富的权力。成员定期聚会以贡献、讨论投资并相互提供财务支持。',
      ru: 'Группы Chama дают сообществам возможность объединять ресурсы и совместно строить богатство. Члены регулярно встречаются для внесения вклада, обсуждения инвестиций и взаимной финансовой поддержки.',
      sw: 'Vikundi vya Chama vinaweka jamii kuwa na nguvu kusambaza rasilimali na kujenga haba pamoja. Wanachama hukutana kwa kawaida kuchangia, kujadili uongezaji, na kuunga mkono kila mmoja kifedha.',
      fr: 'Les groupes Chama habilitent les communautés à regrouper les ressources et à créer collectivement de la richesse. Les membres se réunissent régulièrement pour contribuer, discuter des investissements et s\'entraider financièrement.',
      es: 'Los grupos Chama permiten que las comunidades agrupen recursos y construyan riqueza colectivamente. Los miembros se reúnen regularmente para contribuir, discutir inversiones y apoyarse mutuamente financieramente.',
      de: 'Chama-Gruppen befähigen Gemeinschaften, Ressourcen zu bündeln und gemeinsam Wohlstand aufzubauen. Mitglieder treffen sich regelmäßig, um Beiträge zu leisten, Investitionen zu besprechen und sich gegenseitig finanziell zu unterstützen.',
      pt: 'Os grupos Chama capacitam as comunidades a agrupar recursos e construir riqueza coletivamente. Os membros se reúnem regularmente para contribuir, discutir investimentos e se apoiar mutuamente financeiramente.',
      it: 'I gruppi Chama consentono alle comunità di mettere insieme risorse e costruire ricchezza collettivamente. I membri si incontrano regolarmente per contribuire, discutere investimenti e supportarsi a vicenda finanziariamente.',
      he: 'קבוצות Chama משגחות קהילות לתיאום משאבים ולבנות עושר באופן קולקטיבי. חברים נפגשים בקביעות כדי לתרום, לדון בהשקעות ולתמוך זה בזה מבחינה כלכלית.',
      hi: 'Chama समूह समुदायों को संसाधनों को पूल करने और सामूहिक रूप से संपत्ति बनाने के लिए सशक्त करते हैं। सदस्य नियमित रूप से मिलते हैं योगदान देने, निवेश पर चर्चा करने और एक दूसरे को वित्तीय रूप से समर्थन करने के लिए।',
      am: 'Chama ቡድኖች ማህበረሰብ ሀብት ለመትከል እና በቅንጅት ሀብት ለመገንባት ትችላለች። አባላት ለመተጋገብ፣ ኢንቬስትመንቶችን ለመወያየት እና እርስ በርስ በመሠረተ-ሰ.ሮ. ለመደገፍ በመደበኛ ሁኔታ ይገናኛሉ።'
    },
    howToAccess: {
      en: '📍 How to access Chama (Groups):\n\n1️⃣ On the **Home screen**, tap the **"Groups products"** button\n2️⃣ The Chama screen opens with these sections:\n\n📌 **Group Advance (Loans)**\n• Request loan from group (member)\n• Delete a loan request (member)\n• Give Member Advance (Group Signatory)\n• Float Group Loans (Group Signatory)\n• Approve member loan (members)\n• Group Minutes\n\n📌 **View Group Status**\n• View Group Debts Status: Blacklist, View Repayments, Waive\n\n📌 **View Member Status**\n• View Member Debts Status: View Repayments, Repay Debts\n\n📌 **Registration**\n• Register Member\n• Deregister Member\n\n📌 **Group Remittance**\n• View Group remittances: confirm (Signatories), View Remittances\n• View My Remittances\n\n📌 **Membership**\n• View Members: Approve/disapprove Transport, Share dividends/Profits, View subscriptions, Penalise late Repayments\n• View my Groups: View my subscriptions, send my Subscriptions\n\n📌 **Group Account**\n• Create | Dissolve | Update | View Group Account\n\n📌 **Signatory Works**\n• Signatory 2 Confirm Group Withdrawals\n• Signatory 3 Confirm Group Withdrawals\n• View Group Deposits\n• View Group Withdrawals\n\n📌 **Link NSNdogo** — Link your group to an NSNdogo branch for funding',
      sw: '📍 Jinsi ya kufikia Chama (Vikundi):\n\n1️⃣ Kwenye **skrini ya Nyumbani**, bonyeza kitufe **"Groups products"**\n2️⃣ Skrini ya Chama itafunguka na sehemu hizi:\n\n📌 **Mkopo wa Kikundi**\n• Omba mkopo kutoka kwa kikundi (mwanachama)\n• Futa ombi la mkopo (mwanachama)\n• Toa Mkopo kwa Mwanachama (Mwanasaini)\n• Toa Mikopo ya Kikundi (Mwanasaini)\n• Idhinisha mkopo wa mwanachama\n• Kumbukumbu za mkutano\n\n📌 **Usajili**\n• Sajili Mwanachama | Ondoa Mwanachama\n\n📌 **Uanachama**\n• Angalia Wanachama | Angalia Vikundi Vyangu\n\n📌 **Akaunti ya Kikundi**\n• Unda | Futa | Sasisha | Angalia Akaunti ya Kikundi\n\n📌 **Kazi za Wanaosaini**\n• Thibitisha Uondoaji wa Kikundi (Mwanasaini 2 & 3)\n• Angalia Amana & Uondoaji wa Kikundi',
      fr: '📍 Comment accéder à Chama (Groupes):\n\n1️⃣ Sur l\'**écran d\'accueil**, appuyez sur le bouton **"Groups products"**\n2️⃣ L\'écran Chama s\'ouvre avec ces sections:\n\n📌 **Avance de groupe** — Demander/approuver des prêts de groupe\n📌 **Statut du groupe** — Voir les dettes, les remboursements\n📌 **Inscription** — Inscrire/désinscrire des membres\n📌 **Envoi de fonds** — Voir les remises du groupe\n📌 **Adhésion** — Voir les membres, partager les dividendes\n📌 **Compte de groupe** — Créer, dissoudre, mettre à jour\n📌 **Travaux de signataire** — Confirmer les retraits',
      es: '📍 Cómo acceder a Chama (Grupos):\n\n1️⃣ En la **pantalla de inicio**, toca el botón **"Groups products"**\n2️⃣ La pantalla de Chama se abre con estas secciones:\n\n📌 **Adelanto de grupo** — Solicitar/aprobar préstamos grupales\n📌 **Estado del grupo** — Ver deudas y pagos\n📌 **Registro** — Registrar/quitar miembros\n📌 **Membresía** — Ver miembros, compartir dividendos\n📌 **Cuenta grupal** — Crear, disolver, actualizar\n📌 **Trabajos de firmante** — Confirmar retiros del grupo',
      de: '📍 Wie Sie auf Chama (Gruppen) zugreifen:\n\n1️⃣ Tippen Sie auf dem **Startbildschirm** auf **"Groups products"**\n2️⃣ Der Chama-Bildschirm öffnet sich mit diesen Bereichen:\n\n📌 **Gruppenvorschuss** — Gruppenanfragen und -genehmigungen\n📌 **Gruppenstatus** — Schulden und Zahlungen anzeigen\n📌 **Registrierung** — Mitglieder hinzufügen/entfernen\n📌 **Mitgliedschaft** — Mitglieder anzeigen, Dividenden teilen\n📌 **Gruppenkonto** — Erstellen, Auflösen, Aktualisieren\n📌 **Unterzeichnerarbeiten** — Gruppenabhebungen bestätigen',
      zh: '📍 如何访问Chama（群组）:\n\n1️⃣ 在**主屏幕**上，点击 **"Groups products"** 按钮\n2️⃣ Chama屏幕将打开，包含以下部分:\n\n📌 **团体预支** — 申请/批准团体贷款\n📌 **团体状态** — 查看债务和还款\n📌 **注册** — 注册/注销成员\n📌 **成员资格** — 查看成员，分享股息\n📌 **团体账户** — 创建、解散、更新\n📌 **签署人工作** — 确认团体取款',
      ru: '📍 Как получить доступ к Chama (Группы):\n\n1️⃣ На **главном экране** нажмите кнопку **"Groups products"**\n2️⃣ Откроется экран Chama со следующими разделами:\n\n📌 **Групповой аванс** — Запрос/одобрение групповых займов\n📌 **Статус группы** — Просмотр долгов и платежей\n📌 **Регистрация** — Добавить/удалить членов\n📌 **Членство** — Просмотр членов, распределение дивидендов\n📌 **Групповой счет** — Создать, Расформировать, Обновить\n📌 **Работа подписантов** — Подтверждение снятий со счета группы',
      pt: '📍 Como acessar o Chama (Grupos):\n\n1️⃣ Na **tela inicial**, toque no botão **"Groups products"**\n2️⃣ A tela Chama abre com estas seções:\n\n📌 **Adiantamento de grupo** — Solicitar/aprovar empréstimos grupais\n📌 **Status do grupo** — Ver dívidas e pagamentos\n📌 **Registro** — Registrar/remover membros\n📌 **Adesão** — Ver membros, compartilhar dividendos\n📌 **Conta do grupo** — Criar, Dissolver, Atualizar\n📌 **Trabalhos de signatário** — Confirmar saques do grupo',
      it: '📍 Come accedere a Chama (Gruppi):\n\n1️⃣ Nella **schermata principale**, tocca il pulsante **"Groups products"**\n2️⃣ La schermata Chama si apre con queste sezioni:\n\n📌 **Anticipo di gruppo** — Richiedere/approvare prestiti di gruppo\n📌 **Stato del gruppo** — Visualizzare debiti e pagamenti\n📌 **Registrazione** — Aggiungere/rimuovere membri\n📌 **Appartenenza** — Visualizzare membri, condividere dividendi\n📌 **Account di gruppo** — Creare, sciogliere, aggiornare\n📌 **Lavori del firmatario** — Confermare i prelievi del gruppo',
      he: '📍 כיצד לגשת ל-Chama (קבוצות):\n\n1️⃣ במסך **הבית**, הקש על הכפתור **"Groups products"**\n2️⃣ מסך Chama נפתח עם הסעיפים הבאים:\n\n📌 **מקדמת קבוצה** — בקש/אשר הלוואות קבוצתיות\n📌 **סטטוס קבוצה** — הצג חובות ותשלומים\n📌 **רישום** — הוסף/הסר חברים\n📌 **חברות** — הצג חברים, שתף דיבידנדים\n📌 **חשבון קבוצתי** — צור, פרק, עדכן\n📌 **עבודות חותם** — אשר משיכות קבוצתיות',
      hi: '📍 Chama (समूह) तक कैसे पहुंचें:\n\n1️⃣ **होम स्क्रीन** पर **"Groups products"** बटन टैप करें\n2️⃣ Chama स्क्रीन इन खंडों के साथ खुलती है:\n\n📌 **समूह अग्रिम** — समूह ऋण अनुरोध/अनुमोदन\n📌 **समूह स्थिति** — ऋण और भुगतान देखें\n📌 **पंजीकरण** — सदस्य जोड़ें/हटाएं\n📌 **सदस्यता** — सदस्य देखें, लाभांश साझा करें\n📌 **समूह खाता** — बनाएं, भंग करें, अपडेट करें\n📌 **हस्ताक्षरकर्ता कार्य** — समूह निकासी की पुष्टि करें',
      am: '📍 Chama (ቡድኖች) እንዴት ማግኘት:\n\n1️⃣ **መነሻ ስክሪን** ላይ **"Groups products"** ቁልፍ ይጫኑ\n2️⃣ Chama ስክሪን ይከፈታል:\n\n📌 **የቡድን ቅድሚያ** — የቡድን ብድር ጥያቄ/ፍቃድ\n📌 **የቡድን ሁኔታ** — ዕዳ እና ክፍያ ይመልከቱ\n📌 **ምዝገባ** — አባላት ይጨምሩ/ያስወጡ\n📌 **አባልነት** — አባላት ይመልከቱ፣ ትርፍ ያጋሩ\n📌 **የቡድን ሂሳብ** — ይፍጠሩ፣ ይፍቱ፣ ያዘምኑ\n📌 **የፈረሚ ሥራዎች** — የቡድን ወጪ ያረጋግጡ'
    },
    quickActions: [
      {
        keywords: ['create chama', 'create group', 'create a group', 'create a chama', 'new group', 'start a group', 'open chama', 'open a group', 'chama account', 'group account'],
        response: {
          en: '📍 **How to create a Chama group:**\n\n1️⃣ From the **Home screen**, tap **"Groups products"**\n2️⃣ Scroll down to the **"Group Account"** section\n3️⃣ Tap **"Create"**\n4️⃣ Fill in the group details and submit',
          sw: '📍 **Jinsi ya kuunda kikundi cha Chama:**\n\n1️⃣ Kwenye **skrini ya Nyumbani**, bonyeza **"Groups products"**\n2️⃣ Telezesha chini hadi sehemu ya **"Akaunti ya Kikundi"**\n3️⃣ Bonyeza **"Unda"**\n4️⃣ Jaza maelezo ya kikundi na uwasilishe',
          fr: '📍 **Comment créer un groupe Chama:**\n\n1️⃣ Sur l\'écran **Accueil**, appuyez sur **"Groups products"**\n2️⃣ Faites défiler jusqu\'à **"Compte de groupe"**\n3️⃣ Appuyez sur **"Créer"**\n4️⃣ Remplissez les détails du groupe et soumettez',
          es: '📍 **Cómo crear un grupo Chama:**\n\n1️⃣ En el **inicio**, toca **"Groups products"**\n2️⃣ Desplázate hasta **"Cuenta grupal"**\n3️⃣ Toca **"Crear"**\n4️⃣ Completa los datos del grupo y envía',
          de: '📍 **Wie man eine Chama-Gruppe erstellt:**\n\n1️⃣ Auf dem **Startbildschirm** tippen Sie auf **"Groups products"**\n2️⃣ Scrollen Sie zu **"Gruppenkonto"**\n3️⃣ Tippen Sie auf **"Erstellen"**\n4️⃣ Gruppendetails ausfüllen und absenden',
          zh: '📍 **如何创建Chama群组:**\n\n1️⃣ 在**主屏幕**，点击 **"Groups products"**\n2️⃣ 滚动到 **"团体账户"** 部分\n3️⃣ 点击 **"创建"**\n4️⃣ 填写群组详情并提交',
          ru: '📍 **Как создать группу Chama:**\n\n1️⃣ На **главном экране** нажмите **"Groups products"**\n2️⃣ Прокрутите до **"Групповой счет"**\n3️⃣ Нажмите **"Создать"**\n4️⃣ Заполните данные группы и отправьте',
          pt: '📍 **Como criar um grupo Chama:**\n\n1️⃣ Na **tela inicial**, toque em **"Groups products"**\n2️⃣ Role até **"Conta do grupo"**\n3️⃣ Toque em **"Criar"**\n4️⃣ Preencha os detalhes do grupo e envie',
          it: '📍 **Come creare un gruppo Chama:**\n\n1️⃣ Nella **schermata principale**, tocca **"Groups products"**\n2️⃣ Scorri fino a **"Account di gruppo"**\n3️⃣ Tocca **"Crea"**\n4️⃣ Compila i dettagli del gruppo e invia',
          he: '📍 **כיצד ליצור קבוצת Chama:**\n\n1️⃣ במסך **הבית**, הקש על **"Groups products"**\n2️⃣ גלול ל**"חשבון קבוצתי"**\n3️⃣ הקש **"צור"**\n4️⃣ מלא את פרטי הקבוצה ושלח',
          hi: '📍 **Chama समूह कैसे बनाएं:**\n\n1️⃣ **होम स्क्रीन** से **"Groups products"** टैप करें\n2️⃣ **"समूह खाता"** सेक्शन तक स्क्रॉल करें\n3️⃣ **"बनाएं"** टैप करें\n4️⃣ समूह विवरण भरें और सबमिट करें',
          am: '📍 **Chama ቡድን እንዴት ይፍጠሩ:**\n\n1️⃣ **መነሻ ስክሪን** ላይ **"Groups products"** ይጫኑ\n2️⃣ **"የቡድን ሂሳብ"** ክፍል ድረስ ይሸብልሉ\n3️⃣ **"ፍጠር"** ይጫኑ\n4️⃣ የቡድን መረጃ ይሙሉ እና ያስገቡ'
        }
      },
      {
        keywords: ['register member', 'add member', 'new member', 'join group', 'enroll member'],
        response: {
          en: '📍 **How to register a Chama member:**\n\n1️⃣ From **Home**, tap **"Groups products"**\n2️⃣ Scroll to the **"Registration"** section\n3️⃣ Tap **"Register Member"**\n4️⃣ Enter the member\'s details and confirm',
          sw: '📍 **Jinsi ya kusajili mwanachama:**\n\n1️⃣ Kutoka **Nyumbani**, bonyeza **"Groups products"**\n2️⃣ Telezesha hadi sehemu ya **"Usajili"**\n3️⃣ Bonyeza **"Sajili Mwanachama"**\n4️⃣ Ingiza maelezo ya mwanachama na uthibitishe',
          fr: '📍 **Comment inscrire un membre:**\n\n1️⃣ Depuis **Accueil**, appuyez sur **"Groups products"**\n2️⃣ Faites défiler jusqu\'à **"Inscription"**\n3️⃣ Appuyez sur **"Inscrire un membre"**\n4️⃣ Saisissez les détails du membre et confirmez',
          es: '📍 **Cómo registrar un miembro:**\n\n1️⃣ Desde **Inicio**, toca **"Groups products"**\n2️⃣ Desplázate hasta **"Registro"**\n3️⃣ Toca **"Registrar Miembro"**\n4️⃣ Ingresa los datos del miembro y confirma',
          de: '📍 **Wie man ein Mitglied registriert:**\n\n1️⃣ Vom **Startbildschirm** aus **"Groups products"** tippen\n2️⃣ Zu **"Registrierung"** scrollen\n3️⃣ **"Mitglied registrieren"** tippen\n4️⃣ Mitgliedsdaten eingeben und bestätigen',
          zh: '📍 **如何注册成员:**\n\n1️⃣ 从**主屏幕**点击 **"Groups products"**\n2️⃣ 滚动到 **"注册"** 部分\n3️⃣ 点击 **"注册成员"**\n4️⃣ 输入成员详情并确认',
          ru: '📍 **Как зарегистрировать члена:**\n\n1️⃣ С **главного экрана** нажмите **"Groups products"**\n2️⃣ Прокрутите до **"Регистрация"**\n3️⃣ Нажмите **"Зарегистрировать члена"**\n4️⃣ Введите данные члена и подтвердите',
          pt: '📍 **Como registrar um membro:**\n\n1️⃣ Da **tela inicial**, toque em **"Groups products"**\n2️⃣ Role até **"Registro"**\n3️⃣ Toque em **"Registrar Membro"**\n4️⃣ Insira os dados do membro e confirme',
          it: '📍 **Come registrare un membro:**\n\n1️⃣ Dalla **schermata principale**, tocca **"Groups products"**\n2️⃣ Scorri fino a **"Registrazione"**\n3️⃣ Tocca **"Registra Membro"**\n4️⃣ Inserisci i dettagli del membro e conferma',
          he: '📍 **כיצד לרשום חבר:**\n\n1️⃣ מ**מסך הבית**, הקש **"Groups products"**\n2️⃣ גלול ל**"רישום"**\n3️⃣ הקש **"רשום חבר"**\n4️⃣ הזן את פרטי החבר ואשר',
          hi: '📍 **सदस्य कैसे पंजीकृत करें:**\n\n1️⃣ **होम** से **"Groups products"** टैप करें\n2️⃣ **"पंजीकरण"** सेक्शन तक स्क्रॉल करें\n3️⃣ **"सदस्य पंजीकृत करें"** टैप करें\n4️⃣ सदस्य विवरण दर्ज करें और पुष्टि करें',
          am: '📍 **አባል እንዴት ይምዝገቡ:**\n\n1️⃣ **መነሻ** ላይ **"Groups products"** ይጫኑ\n2️⃣ **"ምዝገባ"** ክፍል ድረስ ይሸብልሉ\n3️⃣ **"አባል ምዝገብ"** ይጫኑ\n4️⃣ የአባሉ መረጃ ያስገቡ እና ያረጋግጡ'
        }
      },
      {
        keywords: ['request loan', 'request advance', 'borrow from group', 'loan from chama', 'group loan'],
        response: {
          en: '📍 **How to request a loan from your Chama group:**\n\n1️⃣ From **Home**, tap **"Groups products"**\n2️⃣ Under **"Group Advance"**, tap **"Request loan from group"**\n3️⃣ Select your group, enter the loan amount and submit\n\n💡 The Group Signatory must approve your request before funds are released.',
          sw: '📍 **Jinsi ya kuomba mkopo kutoka kikundi:**\n\n1️⃣ Kutoka **Nyumbani**, bonyeza **"Groups products"**\n2️⃣ Chini ya **"Mkopo wa Kikundi"**, bonyeza **"Omba mkopo kutoka kwa kikundi"**\n3️⃣ Chagua kikundi chako, ingiza kiasi cha mkopo na uwasilishe\n\n💡 Mwanasaini wa Kikundi lazima aidhinishe ombi lako kwanza.',
          fr: '📍 **Comment demander un prêt à votre groupe Chama:**\n\n1️⃣ Depuis **Accueil**, appuyez sur **"Groups products"**\n2️⃣ Sous **"Avance de groupe"**, appuyez sur **"Demander un prêt au groupe"**\n3️⃣ Sélectionnez votre groupe, entrez le montant et soumettez\n\n💡 Le signataire du groupe doit approuver votre demande.',
          es: '📍 **Cómo solicitar un préstamo de tu grupo Chama:**\n\n1️⃣ Desde **Inicio**, toca **"Groups products"**\n2️⃣ En **"Adelanto de grupo"**, toca **"Solicitar préstamo del grupo"**\n3️⃣ Selecciona tu grupo, ingresa el monto y envía\n\n💡 El firmante del grupo debe aprobar tu solicitud.',
          de: '📍 **Wie man einen Kredit von der Chama-Gruppe beantragt:**\n\n1️⃣ Vom **Startbildschirm** **"Groups products"** tippen\n2️⃣ Unter **"Gruppenvorschuss"** auf **"Kredit von Gruppe anfragen"** tippen\n3️⃣ Gruppe auswählen, Betrag eingeben und absenden\n\n💡 Der Gruppenunterzeichner muss Ihren Antrag genehmigen.',
          zh: '📍 **如何向Chama群组申请贷款:**\n\n1️⃣ 从**主屏幕**点击 **"Groups products"**\n2️⃣ 在 **"团体预支"** 下，点击 **"向群组申请贷款"**\n3️⃣ 选择您的群组，输入贷款金额并提交\n\n💡 群组签署人必须批准您的申请。',
          ru: '📍 **Как запросить кредит от группы Chama:**\n\n1️⃣ С **главного экрана** нажмите **"Groups products"**\n2️⃣ В разделе **"Групповой аванс"** нажмите **"Запросить кредит от группы"**\n3️⃣ Выберите группу, введите сумму и отправьте\n\n💡 Подписант группы должен одобрить ваш запрос.',
          pt: '📍 **Como solicitar empréstimo do grupo Chama:**\n\n1️⃣ Da **tela inicial**, toque em **"Groups products"**\n2️⃣ Em **"Adiantamento de grupo"**, toque em **"Solicitar empréstimo do grupo"**\n3️⃣ Selecione seu grupo, insira o valor e envie\n\n💡 O signatário do grupo deve aprovar seu pedido.',
          it: '📍 **Come richiedere un prestito al gruppo Chama:**\n\n1️⃣ Dalla **schermata principale**, tocca **"Groups products"**\n2️⃣ Sotto **"Anticipo di gruppo"**, tocca **"Richiedi prestito al gruppo"**\n3️⃣ Seleziona il tuo gruppo, inserisci l\'importo e invia\n\n💡 Il firmatario del gruppo deve approvare la tua richiesta.',
          he: '📍 **כיצד לבקש הלוואה מקבוצת Chama:**\n\n1️⃣ מ**מסך הבית**, הקש **"Groups products"**\n2️⃣ תחת **"מקדמת קבוצה"**, הקש **"בקש הלוואה מהקבוצה"**\n3️⃣ בחר את הקבוצה שלך, הזן את סכום ההלוואה ושלח\n\n💡 החותם של הקבוצה חייב לאשר את בקשתך.',
          hi: '📍 **Chama समूह से ऋण कैसे मांगें:**\n\n1️⃣ **होम** से **"Groups products"** टैप करें\n2️⃣ **"समूह अग्रिम"** के तहत **"समूह से ऋण मांगें"** टैप करें\n3️⃣ अपना समूह चुनें, ऋण राशि दर्ज करें और सबमिट करें\n\n💡 समूह हस्ताक्षरकर्ता को आपके अनुरोध को पहले मंजूरी देनी होगी।',
          am: '📍 **ከChama ቡድን ብድር እንዴት ይጠይቁ:**\n\n1️⃣ **መነሻ** ላይ **"Groups products"** ይጫኑ\n2️⃣ **"የቡድን ቅድሚያ"** ስር **"ከቡድን ብድር ጠይቅ"** ይጫኑ\n3️⃣ ቡድንዎን ይምረጡ፣ የብድር መጠን ያስገቡ እና ያስገቡ\n\n💡 የቡድን ፈራሚ ጥያቄዎን ማፅደቅ አለባቸው።'
        }
      },
      {
        keywords: ['dissolve group', 'dissolve chama', 'close group', 'delete group', 'end group'],
        response: {
          en: '📍 **How to dissolve a Chama group:**\n\n1️⃣ From **Home**, tap **"Groups products"**\n2️⃣ Scroll to **"Group Account"**\n3️⃣ Tap **"Dissolve"**\n4️⃣ Confirm the dissolution\n\n⚠️ This action is irreversible. All group data will be closed.',
          sw: '📍 **Jinsi ya kufuta kikundi:**\n\n1️⃣ Kutoka **Nyumbani**, bonyeza **"Groups products"**\n2️⃣ Telezesha hadi **"Akaunti ya Kikundi"**\n3️⃣ Bonyeza **"Futa"**\n4️⃣ Thibitisha kufutwa\n\n⚠️ Hatua hii haiwezi kutenduliwa.',
          fr: '📍 **Comment dissoudre un groupe Chama:**\n\n1️⃣ Depuis **Accueil**, appuyez sur **"Groups products"**\n2️⃣ Faites défiler jusqu\'à **"Compte de groupe"**\n3️⃣ Appuyez sur **"Dissoudre"**\n4️⃣ Confirmez la dissolution\n\n⚠️ Cette action est irréversible.',
          es: '📍 **Cómo disolver un grupo Chama:**\n\n1️⃣ Desde **Inicio**, toca **"Groups products"**\n2️⃣ Desplázate hasta **"Cuenta grupal"**\n3️⃣ Toca **"Disolver"**\n4️⃣ Confirma la disolución\n\n⚠️ Esta acción es irreversible.',
          de: '📍 **Wie man eine Chama-Gruppe auflöst:**\n\n1️⃣ Vom **Startbildschirm** **"Groups products"** tippen\n2️⃣ Zu **"Gruppenkonto"** scrollen\n3️⃣ **"Auflösen"** tippen\n4️⃣ Auflösung bestätigen\n\n⚠️ Diese Aktion ist nicht rückgängig zu machen.',
          zh: '📍 **如何解散Chama群组:**\n\n1️⃣ 从**主屏幕**点击 **"Groups products"**\n2️⃣ 滚动到 **"团体账户"**\n3️⃣ 点击 **"解散"**\n4️⃣ 确认解散\n\n⚠️ 此操作不可逆。',
          ru: '📍 **Как расформировать группу Chama:**\n\n1️⃣ С **главного экрана** нажмите **"Groups products"**\n2️⃣ Прокрутите до **"Групповой счет"**\n3️⃣ Нажмите **"Расформировать"**\n4️⃣ Подтвердите расформирование\n\n⚠️ Это действие необратимо.',
          pt: '📍 **Como dissolver um grupo Chama:**\n\n1️⃣ Da **tela inicial**, toque em **"Groups products"**\n2️⃣ Role até **"Conta do grupo"**\n3️⃣ Toque em **"Dissolver"**\n4️⃣ Confirme a dissolução\n\n⚠️ Esta ação é irreversível.',
          it: '📍 **Come sciogliere un gruppo Chama:**\n\n1️⃣ Dalla **schermata principale**, tocca **"Groups products"**\n2️⃣ Scorri fino a **"Account di gruppo"**\n3️⃣ Tocca **"Sciogli"**\n4️⃣ Conferma lo scioglimento\n\n⚠️ Questa azione è irreversibile.',
          he: '📍 **כיצד לפרק קבוצת Chama:**\n\n1️⃣ מ**מסך הבית**, הקש **"Groups products"**\n2️⃣ גלול ל**"חשבון קבוצתי"**\n3️⃣ הקש **"פרק"**\n4️⃣ אשר את הפירוק\n\n⚠️ פעולה זו בלתי הפיכה.',
          hi: '📍 **Chama समूह कैसे भंग करें:**\n\n1️⃣ **होम** से **"Groups products"** टैप करें\n2️⃣ **"समूह खाता"** तक स्क्रॉल करें\n3️⃣ **"भंग करें"** टैप करें\n4️⃣ भंग करने की पुष्टि करें\n\n⚠️ यह क्रिया अपरिवर्तनीय है।',
          am: '📍 **Chama ቡድን እንዴት ይፍቱ:**\n\n1️⃣ **መነሻ** ላይ **"Groups products"** ይጫኑ\n2️⃣ **"የቡድን ሂሳብ"** ድረስ ይሸብልሉ\n3️⃣ **"ፍቱ"** ይጫኑ\n4️⃣ መፍቻውን ያረጋግጡ\n\n⚠️ ይህ እርምጃ ሊቀለበስ አይችልም።'
        }
      },
      {
        keywords: ['view members', 'see members', 'list members', 'group members', 'who is in my group'],
        response: {
          en: '📍 **How to view Chama group members:**\n\n1️⃣ From **Home**, tap **"Groups products"**\n2️⃣ Scroll to **"Membership"**\n3️⃣ Tap **"View Members"** — here you can approve/disapprove Transport, share dividends, view subscriptions, and penalise late repayments',
          sw: '📍 **Jinsi ya kuangalia wanachama wa kikundi:**\n\n1️⃣ Kutoka **Nyumbani**, bonyeza **"Groups products"**\n2️⃣ Telezesha hadi **"Uanachama"**\n3️⃣ Bonyeza **"Angalia Wanachama"** — hapa unaweza kuidhinisha/kukataa Usafiri, kushiriki gawio, kuona michango na kutoza adhabu',
          fr: '📍 **Comment voir les membres du groupe:**\n\n1️⃣ Depuis **Accueil**, appuyez sur **"Groups products"**\n2️⃣ Faites défiler jusqu\'à **"Adhésion"**\n3️⃣ Appuyez sur **"Voir les membres"**',
          es: '📍 **Cómo ver los miembros del grupo:**\n\n1️⃣ Desde **Inicio**, toca **"Groups products"**\n2️⃣ Desplázate hasta **"Membresía"**\n3️⃣ Toca **"Ver Miembros"**',
          de: '📍 **Wie man Gruppenmitglieder ansieht:**\n\n1️⃣ Vom **Startbildschirm** **"Groups products"** tippen\n2️⃣ Zu **"Mitgliedschaft"** scrollen\n3️⃣ **"Mitglieder anzeigen"** tippen',
          zh: '📍 **如何查看群组成员:**\n\n1️⃣ 从**主屏幕**点击 **"Groups products"**\n2️⃣ 滚动到 **"成员资格"**\n3️⃣ 点击 **"查看成员"**',
          ru: '📍 **Как просмотреть членов группы:**\n\n1️⃣ С **главного экрана** нажмите **"Groups products"**\n2️⃣ Прокрутите до **"Членство"**\n3️⃣ Нажмите **"Просмотр членов"**',
          pt: '📍 **Como ver membros do grupo:**\n\n1️⃣ Da **tela inicial**, toque em **"Groups products"**\n2️⃣ Role até **"Adesão"**\n3️⃣ Toque em **"Ver Membros"**',
          it: '📍 **Come vedere i membri del gruppo:**\n\n1️⃣ Dalla **schermata principale**, tocca **"Groups products"**\n2️⃣ Scorri fino a **"Appartenenza"**\n3️⃣ Tocca **"Visualizza Membri"**',
          he: '📍 **כיצד לראות חברי הקבוצה:**\n\n1️⃣ מ**מסך הבית**, הקש **"Groups products"**\n2️⃣ גלול ל**"חברות"**\n3️⃣ הקש **"הצג חברים"**',
          hi: '📍 **समूह सदस्य कैसे देखें:**\n\n1️⃣ **होम** से **"Groups products"** टैप करें\n2️⃣ **"सदस्यता"** तक स्क्रॉल करें\n3️⃣ **"सदस्य देखें"** टैप करें',
          am: '📍 **የቡድን አባላት እንዴት ይመልከቱ:**\n\n1️⃣ **መነሻ** ላይ **"Groups products"** ይጫኑ\n2️⃣ **"አባልነት"** ድረስ ይሸብልሉ\n3️⃣ **"አባላት ይመልከቱ"** ይጫኑ'
        }
      }
    ]
  },
  {
    id: 'business-credit',
    screen: 'CredSlsScreen',
    keywords: ['credit', 'business', 'buyer', 'seller', 'sales', 'trade'],
    description: {
      en: 'Business Credit Sales connect sellers and buyers for trade credit, enabling businesses to buy goods and pay later.',
      ar: 'تربط مبيعات Credit Sales الأعمال البائعين والمشترين للائتمان التجاري، مما يمكن الشركات من شراء السلع والدفع لاحقا.',
      zh: '业务信用销售将卖家和买家联系起来进行商业信用，使企业能够购买商品并稍后付款。',
      ru: 'Кредитные продажи бизнеса соединяют продавцов и покупателей для торгового кредита, позволяя предприятиям покупать товары и платить позже.',
      sw: 'Uuzaji wa Credit Sales wa Biashara unakunganisha wajuzi na wananunuzi kwa amana ya biashara, kuwezesha biashara kununua bidhaa na kulipa baadaye.',
      fr: 'Les ventes de crédit aux entreprises connectent les vendeurs et les acheteurs pour le crédit commercial, permettant aux entreprises d\'acheter des biens et de payer plus tard.',
      es: 'Las ventas de crédito comercial conectan vendedores y compradores para crédito comercial, permitiendo que los negocios compren bienes y paguen después.',
      de: 'Business-Credit-Verkäufe verbinden Verkäufer und Käufer für Handelskredit und ermöglichen es Unternehmen, Waren zu kaufen und später zu bezahlen.',
      pt: 'Vendas de crédito comercial conectam vendedores e compradores para crédito comercial, permitindo que negócios comprem bens e paguem depois.',
      it: 'Le vendite di credito commerciale collegano venditori e acquirenti per il credito commerciale, consentendo alle aziende di acquistare beni e pagare in seguito.',
      he: 'מכירות אשראי עסקיות מחברות מוכרים וקונים לאשראי מסחרי, המאפשרות לעסקים לקנות סחורה ולשלם מאוחר יותר.',
      hi: 'व्यावसायिक क्रेडिट बिक्री विक्रेताओं और खरीदारों को व्यापार क्रेडिट के लिए जोड़ते हैं, जिससे व्यवसायों को माल खरीदने और बाद में भुगतान करने में सक्षम बनाया जाता है।',
      am: 'ስራ ውስጥ የክሬዲት ሽያጩ ሻጩ እና ገዥ ሰርግ ለሚያደርገው ክሬዲት ሰርግ ያገናኛል፣ ስራ ሐብት ንበልና ብሩክ ክብ ልመልስ ይቻለዋል።'
    },
    benefits: {
      en: [
        'Buy now, pay later for businesses',
        'Improve cash flow management',
        'Build trading relationships',
        'Access to credit without collateral',
        'Scale business operations'
      ],
      ar: [
        'شراء الآن، الدفع لاحقا للأعمال',
        'تحسين إدارة التدفق النقدي',
        'بناء علاقات تجارية',
        'الوصول إلى الائتمان بدون ضمان',
        'توسيع العمليات التجارية'
      ],
      zh: [
        '商业立即购买，稍后付款',
        '改善现金流管理',
        '建立贸易关系',
        '不需要抵押品即可获得信用',
        '扩展业务运营'
      ],
      ru: [
        'Купить сейчас, платить позже за бизнес',
        'Улучшить управление денежными потоками',
        'Построить торговые отношения',
        'Доступ к кредитам без залога',
        'Масштабирование бизнес-операций'
      ],
      sw: [
        'Nuna sasa, lipa baadaye kwa biashara',
        'Boresha usimamizi wa mtiririko wa pesa',
        'Kujenga mahusiano ya biashara',
        'Kupatia amana bila rehani',
        'Kuongeza shughuli za biashara'
      ],
      fr: [
        'Acheter maintenant, payer plus tard pour les entreprises',
        'Améliorer la gestion des flux de trésorerie',
        'Construire des relations commerciales',
        'Accès au crédit sans garantie',
        'Mettre à l\'échelle les opérations commerciales'
      ],
      es: [
        'Comprar ahora, pagar después para negocios',
        'Mejorar la gestión del flujo de caja',
        'Construir relaciones comerciales',
        'Acceso a crédito sin garantía',
        'Ampliar operaciones comerciales'
      ],
      de: [
        'Jetzt kaufen, später für Unternehmen bezahlen',
        'Verbesserung der Cashflow-Verwaltung',
        'Aufbau von Handelsbeziehungen',
        'Zugang zu Krediten ohne Sicherheiten',
        'Geschäftstätigkeit skalieren'
      ],
      pt: [
        'Compre agora, pague depois para negócios',
        'Melhorar a gestão do fluxo de caixa',
        'Construir relacionamentos comerciais',
        'Acesso a crédito sem garantia',
        'Operações comerciais em escala'
      ],
      it: [
        'Compra ora, paga dopo per le imprese',
        'Migliorare la gestione del flusso di cassa',
        'Costruire relazioni commerciali',
        'Accesso al credito senza garanzie',
        'Operazioni commerciali in scala'
      ],
      he: [
        'קנה עכשיו, שלם מאוחר יותר לעסקים',
        'שיפור ניהול תזרים מזומנים',
        'בניית יחסי מסחר',
        'גישה להלוואה ללא בטחונות',
        'תפעול עסקי בקנה מידה'
      ],
      hi: [
        'व्यवसायों के लिए अभी खरीदें, बाद में भुगतान करें',
        'नकद प्रवाह प्रबंधन में सुधार करें',
        'व्यापार संबंध बनाएं',
        'संपार्श्विक के बिना क्रेडिट तक पहुंच',
        'व्यावसायिक संचालन को स्केल करें'
      ],
      am: [
        'ስራ ዋሃጅ ለይዤ ወደ ፊት ይወስዱ',
        'የገንዘብ ፍሰት ተቆጣጣሪ ይመልስ',
        'የንግድ ግንኙነቶች ይገነቡ',
        'ተከራካሪ ሳይኖር ማቁበር ለመሀበር',
        'የስራ አይነት ተጠንቋቋ'
      ]
    },
    aboutProduct: {
      en: 'Credit Sales is designed for B2B trade, enabling businesses to extend credit to their customers and build long-term trading partnerships.',
      ar: 'تم تصميم Credit Sales للتجارة B2B، مما يمكن الشركات من تقديم ائتمان لعملائها وبناء شراكات تجارية طويلة الأجل.',
      zh: '信用销售是为B2B贸易设计的，使企业能够向其客户提供信用并建立长期贸易伙伴关系。',
      ru: 'Продажа кредитов разработана для B2B торговли, позволяя предприятиям предоставлять кредиты своим клиентам и строить долгосрочные торговые партнерства.',
      sw: 'Credit Sales inaundwa kwa biashara ya B2B, kuwezesha biashara kugawia amana kwa wateja wao na kujenga ushirikiano wa biashara wa muda mrefu.',
      fr: 'Credit Sales est conçu pour le commerce B2B, permettant aux entreprises d\'accorder du crédit à leurs clients et de construire des partenariats commerciaux à long terme.',
      es: 'Credit Sales está diseñado para el comercio B2B, permitiendo que los negocios extiendan crédito a sus clientes y construyan asociaciones comerciales a largo plazo.',
      de: 'Credit Sales ist für B2B-Handel konzipiert und ermöglicht es Unternehmen, ihren Kunden Kreditlinien zu gewähren und langfristige Handelspartnerschaften aufzubauen.',
      pt: 'Credit Sales é projetado para comércio B2B, permitindo que os negócios estendam crédito a seus clientes e construam parcerias comerciais de longo prazo.',
      it: 'Credit Sales è progettato per il commercio B2B, consentendo alle aziende di concedere credito ai loro clienti e costruire partnership commerciali a lungo termine.',
      he: 'Credit Sales מעוצב לסחר B2B, המאפשר לעסקים להרחיב אשראי ללקוחותיהם ולבנות שותפויות מסחר ארוכות טווח.',
      hi: 'क्रेडिट बिक्री B2B व्यापार के लिए डिजाइन की गई है, जिससे व्यवसायों को अपने ग्राहकों को क्रेडिट देने और दीर्घकालिक व्यापार साझेदारी बनाने में सक्षम बनाया जाता है।',
      am: 'ክሪድስ ሽያጩ ለ B2B ንግድ ታስቦ ስራ ለደ ደ ደንበኞች ማቁበር በመሰጠት እና ለረጅም ጊዜ ንግድ ተጣብቆ ለመገንባት ይችላል።'
    },
    howToAccess: {
      en: '📍 How to access Business (Credit Sales):\n\n1️⃣ On the **Home screen**, tap the **"Business products"** button\n2️⃣ The Business screen opens with these sections:\n\n📌 **Cascade Payments**\n• Cascade Payments — chain payment flows across multiple parties\n\n📌 **Biz Products**\n• Benefit Product (Create)\n• View Business Benefits Shared\n• Share Business Benefits\n• Link Beneficiary\n• Boost Pooled Benefits\n• View As Product Creator\n\n📌 **Manage Business**\n• Create Biz/Institution\n• Cascade Payments\n• Add Item\n• Delete Sales Item\n• Update Biz\n• Register Sales Officer\n• DeReg Sales Officer\n• View Account\n\n📌 **Make Credit Sales Requests**\n• Make Credit Sales Requests — submit a request to buy on credit\n\n📌 **Grant Credit Sales Requests**\n• Individual to Individual\n• Individual to Business\n• Business to Individual\n• Business to Business\n\n📌 **Credit Sales Loan Status (Business)**\n• BizPal Loaners / Loanees\n• BizBiz Loaners / Loanees\n\n📌 **Credit Sales Loan Status (Individual)**\n• PalPal Loaners / Loanees\n• PalBiz Loaners / Loanees\n\n📌 **Cash Sales / Purchases & Deposits**\n• Cash Sales\n• Seller Partial Pay Records\n• Make Deposits\n• View Deposits\n\n📌 **Business Cash Transfers**\n• Send Cash to Pal\n• Send Cash to Biz\n• View Cash Sent to Pal\n• View Cash Received from Biz\n• View Cash Sent to Biz\n\n📌 **Biz Adverts**\n• Transfer Ownership\n• Receive Ownership',
      sw: '📍 Jinsi ya kufikia Biashara (Credit Sales):\n\n1️⃣ Kwenye **skrini ya Nyumbani**, bonyeza kitufe **"Business products"**\n2️⃣ Skrini ya Biashara itafunguka na sehemu hizi:\n\n📌 **Malipo ya Mlolongo** — Cascade Payments\n📌 **Bidhaa za Biashara** — Unda bidhaa za faida, shiriki faida, unganisha mnufaika\n📌 **Simamia Biashara** — Unda biashara, ongeza bidhaa, sajili afisa mauzo\n📌 **Omba Mauzo ya Mkopo** — Tuma ombi la kununua kwa mkopo\n📌 **Idhini Maombi ya Mauzo ya Mkopo** — Mtu kwa mtu, mtu kwa biashara, biashara kwa mtu, biashara kwa biashara\n📌 **Hali ya Mkopo (Biashara/Mtu)** — Angalia wakopaji na wakopeshaji\n📌 **Mauzo ya Taslimu & Amana** — Mauzo ya taslimu, amana, rekodi za malipo\n📌 **Uhamisho wa Fedha za Biashara** — Tuma fedha kwa mtu au biashara\n📌 **Matangazo ya Biashara** — Hamisha/pokea umiliki wa biashara',
      fr: '📍 Comment accéder aux Affaires (Credit Sales):\n\n1️⃣ Sur l\'**écran d\'accueil**, appuyez sur **"Business products"**\n2️⃣ L\'écran Business s\'ouvre avec:\n\n📌 **Paiements en cascade**\n📌 **Produits Biz** — Créer/partager des produits avantages, lier un bénéficiaire\n📌 **Gérer l\'entreprise** — Créer, ajouter articles, gérer les commerciaux\n📌 **Demandes de ventes à crédit** — Soumettre une demande d\'achat à crédit\n📌 **Accorder des demandes** — Individuel à individuel, individuel à entreprise, entreprise à individuel, entreprise à entreprise\n📌 **Statut des prêts** — Prêteurs et emprunteurs Biz/Pal\n📌 **Ventes au comptant & Dépôts** — Ventes, dépôts, enregistrements partiels\n📌 **Transferts de fonds** — Envoyer de l\'argent à un individu ou une entreprise\n📌 **Annonces Biz** — Transfert/réception de propriété',
      es: '📍 Cómo acceder a Negocios (Credit Sales):\n\n1️⃣ En la **pantalla de inicio**, toca **"Business products"**\n2️⃣ La pantalla de Negocios se abre con:\n\n📌 **Pagos en cascada**\n📌 **Productos Biz** — Crear/compartir beneficios, vincular beneficiario\n📌 **Gestionar negocio** — Crear, añadir artículos, registrar vendedores\n📌 **Solicitudes de ventas a crédito** — Solicitar compra a crédito\n📌 **Conceder solicitudes** — Individual a individual, a empresa, empresa a individual, empresa a empresa\n📌 **Estado de préstamos** — Prestamistas y prestatarios Biz/Pal\n📌 **Ventas en efectivo & Depósitos** — Ventas, depósitos, registros parciales\n📌 **Transferencias de efectivo** — Enviar dinero a persona o empresa\n📌 **Anuncios Biz** — Transferir/recibir propiedad',
      de: '📍 Wie Sie auf Geschäft (Credit Sales) zugreifen:\n\n1️⃣ Tippen Sie auf dem **Startbildschirm** auf **"Business products"**\n2️⃣ Der Geschäftsbildschirm öffnet sich mit:\n\n📌 **Kaskadenzahlungen**\n📌 **Biz-Produkte** — Vorteile erstellen/teilen, Begünstigten verknüpfen\n📌 **Geschäft verwalten** — Erstellen, Artikel hinzufügen, Vertriebsbeauftragten registrieren\n📌 **Kreditverkaufsanfragen stellen** — Kreditkaufantrag einreichen\n📌 **Anfragen genehmigen** — Person zu Person, zu Unternehmen, Unternehmen zu Person/Unternehmen\n📌 **Kreditstatus** — Gläubiger und Schuldner Biz/Pal\n📌 **Barzahlungen & Einlagen** — Verkäufe, Einlagen, Teilzahlungsaufzeichnungen\n📌 **Bargeldtransfers** — Geld an Person oder Unternehmen senden\n📌 **Biz-Anzeigen** — Eigentum übertragen/empfangen',
      zh: '📍 如何访问业务（Credit Sales）:\n\n1️⃣ 在**主屏幕**上，点击 **"Business products"** 按钮\n2️⃣ 业务屏幕将打开，包含以下部分:\n\n📌 **级联付款**\n📌 **业务产品** — 创建/分享福利产品，关联受益人\n📌 **管理业务** — 创建企业，添加商品，注册销售员\n📌 **发起赊销请求** — 申请赊购\n📌 **批准赊销请求** — 个人对个人/企业，企业对个人/企业\n📌 **贷款状态** — 业务/个人贷方与借方\n📌 **现金销售和存款** — 现金销售，存款，部分付款记录\n📌 **业务现金转账** — 向个人或企业汇款\n📌 **业务广告** — 转让/接收所有权',
      ru: '📍 Как получить доступ к Бизнесу (Credit Sales):\n\n1️⃣ На **главном экране** нажмите **"Business products"**\n2️⃣ Экран Бизнеса открывается с разделами:\n\n📌 **Каскадные платежи**\n📌 **Бизнес-продукты** — Создать/поделиться льготами, связать бенефициара\n📌 **Управление бизнесом** — Создать, добавить товары, зарегистрировать менеджера\n📌 **Запросы на кредитные продажи** — Подать заявку на покупку в кредит\n📌 **Одобрение запросов** — Физлицо/Физлицо, Физлицо/Бизнес, Бизнес/Физлицо, Бизнес/Бизнес\n📌 **Статус займов** — Заимодавцы и заемщики\n📌 **Наличные продажи и депозиты** — Продажи, депозиты, частичные платежи\n📌 **Денежные переводы** — Отправить деньги физлицу или бизнесу\n📌 **Реклама бизнеса** — Передача/получение права собственности',
      pt: '📍 Como acessar Negócios (Credit Sales):\n\n1️⃣ Na **tela inicial**, toque em **"Business products"**\n2️⃣ A tela de Negócios abre com:\n\n📌 **Pagamentos em cascata**\n📌 **Produtos Biz** — Criar/compartilhar benefícios, vincular beneficiário\n📌 **Gerenciar negócios** — Criar, adicionar itens, registrar vendedor\n📌 **Solicitações de vendas a crédito** — Enviar pedido de compra a crédito\n📌 **Conceder solicitações** — Individual para individual/empresa, empresa para individual/empresa\n📌 **Status de empréstimos** — Credores e devedores Biz/Pal\n📌 **Vendas a dinheiro e depósitos** — Vendas, depósitos, registros parciais\n📌 **Transferências de dinheiro** — Enviar dinheiro a pessoa ou empresa\n📌 **Anúncios Biz** — Transferir/receber propriedade',
      it: '📍 Come accedere al Business (Credit Sales):\n\n1️⃣ Nella **schermata principale**, tocca **"Business products"**\n2️⃣ La schermata Business si apre con:\n\n📌 **Pagamenti a cascata**\n📌 **Prodotti Biz** — Creare/condividere benefici, collegare beneficiario\n📌 **Gestisci azienda** — Crea, aggiungi articoli, registra addetto vendite\n📌 **Richieste di vendita a credito** — Inviare richiesta di acquisto a credito\n📌 **Approva richieste** — Individuale/individuale, individuale/azienda, azienda/individuale, azienda/azienda\n📌 **Stato prestiti** — Creditori e debitori Biz/Pal\n📌 **Vendite in contanti e depositi** — Vendite, depositi, registrazioni parziali\n📌 **Trasferimenti di denaro** — Inviare denaro a persona o azienda\n📌 **Inserzioni Biz** — Trasferire/ricevere proprietà',
      he: '📍 כיצד לגשת לעסקים (Credit Sales):\n\n1️⃣ במסך **הבית**, הקש על **"Business products"**\n2️⃣ מסך העסקים נפתח עם:\n\n📌 **תשלומים מדורגים**\n📌 **מוצרי Biz** — יצירה/שיתוף הטבות, קישור מוטב\n📌 **ניהול עסק** — יצירה, הוספת פריטים, רישום נציג מכירות\n📌 **בקשות מכירות אשראי** — הגשת בקשה לרכישה באשראי\n📌 **אישור בקשות** — יחיד/יחיד, יחיד/עסק, עסק/יחיד, עסק/עסק\n📌 **סטטוס הלוואות** — מלווים וקרחים Biz/Pal\n📌 **מכירות במזומן ופיקדונות** — מכירות, פיקדונות, רשומות חלקיות\n📌 **העברות מזומן** — שלח כסף לאדם או עסק\n📌 **מודעות Biz** — העברה/קבלת בעלות',
      hi: '📍 व्यवसाय (Credit Sales) तक कैसे पहुंचें:\n\n1️⃣ **होम स्क्रीन** पर **"Business products"** बटन टैप करें\n2️⃣ व्यवसाय स्क्रीन इन खंडों के साथ खुलती है:\n\n📌 **Cascade Payments** — चेन भुगतान प्रवाह\n📌 **Biz Products** — लाभ उत्पाद बनाएं/साझा करें, लाभार्थी लिंक करें\n📌 **व्यवसाय प्रबंधन** — व्यवसाय बनाएं, आइटम जोड़ें, बिक्री अधिकारी पंजीकृत करें\n📌 **क्रेडिट बिक्री अनुरोध करें** — क्रेडिट पर खरीदने के लिए अनुरोध\n📌 **अनुरोध स्वीकृत करें** — व्यक्ति से व्यक्ति/व्यवसाय, व्यवसाय से व्यक्ति/व्यवसाय\n📌 **ऋण स्थिति** — Biz/Pal उधारदाता और उधारकर्ता\n📌 **नकद बिक्री और जमा** — बिक्री, जमा, आंशिक भुगतान रिकॉर्ड\n📌 **नकद हस्तांतरण** — व्यक्ति या व्यवसाय को पैसे भेजें\n📌 **Biz विज्ञापन** — स्वामित्व स्थानांतरित करें/प्राप्त करें',
      am: '📍 ንግድ (Credit Sales) እንዴት ማግኘት:\n\n1️⃣ **መነሻ ስክሪን** ላይ **"Business products"** ቁልፍ ይጫኑ\n2️⃣ ንግድ ስክሪን ይከፈታል:\n\n📌 **Cascade Payments** — ሰንሰለት ክፍያ\n📌 **Biz Products** — ጥቅም ምርት ይፍጠሩ/ያጋሩ\n📌 **ንግድ ያስተዳድሩ** — ንግድ ይፍጠሩ፣ ዕቃ ጨምሩ፣ የሽያጭ ኦፊሰር ምዝገቡ\n📌 **የክሬዲት ሽያጭ ጥያቄ** — በብድር ለመግዛት ጥያቄ\n📌 **ጥያቄ ይፍቀዱ** — ሰው ለሰው፣ ሰው ለንግድ፣ ንግድ ለሰው፣ ንግድ ለንግድ\n📌 **የብድር ሁኔታ** — Biz/Pal አበዳሪዎች እና ተበዳሪዎች\n📌 **የጥሬ ሽያጭ እና ተቀማጭ** — ሽያጭ፣ ተቀማጭ፣ ከፊል ክፍያ\n📌 **የገንዘብ ዝውውር** — ለሰው ወይም ለንግድ ይላኩ\n📌 **Biz ማስታወቂያ** — ባለቤትነት ያስተላልፉ/ይቀበሉ'
    },
    quickActions: [
      {
        keywords: ['create business', 'create biz', 'create a business', 'create institution', 'register business', 'open business', 'new business', 'start business'],
        response: {
          en: '📍 **How to create a Business/Institution:**\n\n1️⃣ From **Home**, tap **"Business products"**\n2️⃣ Scroll to **"Manage Business"** → tap **"Create Biz/Institution"**\n3️⃣ A form opens — fill in:\n   • Business Name\n   • Business Phone\n   • License Number\n   • Password & Confirm Password\n   • Description\n   • Business Type\n   • Business Contact\n   • Bank Type & Bank Account Number\n4️⃣ Allow GPS location access when prompted\n5️⃣ Tap **Submit** to create your business\n\n💡 Ensure your GPS is enabled before starting — the app captures your business location automatically.',
          sw: '📍 **Jinsi ya kuunda Biashara/Taasisi:**\n\n1️⃣ Kutoka **Nyumbani**, bonyeza **"Business products"**\n2️⃣ Telezesha hadi **"Simamia Biashara"** → bonyeza **"Unda Biashara/Taasisi"**\n3️⃣ Fomu itafunguka — jaza:\n   • Jina la Biashara\n   • Simu ya Biashara\n   • Nambari ya Leseni\n   • Nenosiri na Uthibitisho wa Nenosiri\n   • Maelezo\n   • Aina ya Biashara\n   • Mawasiliano ya Biashara\n   • Aina ya Benki na Nambari ya Akaunti ya Benki\n4️⃣ Ruhusu upatikanaji wa GPS inapoulizwa\n5️⃣ Bonyeza **Wasilisha** ili kuunda biashara yako\n\n💡 Hakikisha GPS yako imewashwa kabla ya kuanza.',
          fr: '📍 **Comment créer une Entreprise/Institution:**\n\n1️⃣ Depuis **Accueil**, appuyez sur **"Business products"**\n2️⃣ Faites défiler vers **"Gérer l\'entreprise"** → **"Créer Biz/Institution"**\n3️⃣ Un formulaire s\'ouvre — remplissez:\n   • Nom de l\'entreprise | Téléphone | Numéro de licence\n   • Mot de passe | Description | Type d\'entreprise\n   • Contact | Type de banque | Numéro de compte bancaire\n4️⃣ Autorisez l\'accès GPS lorsque demandé\n5️⃣ Appuyez sur **Soumettre**\n\n💡 Assurez-vous que le GPS est activé — l\'emplacement est capturé automatiquement.',
          es: '📍 **Cómo crear un Negocio/Institución:**\n\n1️⃣ Desde **Inicio**, toca **"Business products"**\n2️⃣ Desplázate a **"Gestionar negocio"** → **"Crear Biz/Institución"**\n3️⃣ Se abre un formulario — completa:\n   • Nombre, Teléfono, Número de licencia\n   • Contraseña, Descripción, Tipo de negocio\n   • Contacto, Tipo de banco, Número de cuenta\n4️⃣ Permite acceso GPS cuando se solicite\n5️⃣ Toca **Enviar**\n\n💡 Activa el GPS antes de empezar — la ubicación se captura automáticamente.',
          de: '📍 **Wie man ein Unternehmen/eine Institution erstellt:**\n\n1️⃣ Vom **Startbildschirm** **"Business products"** tippen\n2️⃣ Zu **"Geschäft verwalten"** → **"Biz/Institution erstellen"** scrollen\n3️⃣ Ein Formular öffnet sich — ausfüllen:\n   • Name, Telefon, Lizenznummer\n   • Passwort, Beschreibung, Unternehmenstyp\n   • Kontakt, Banktyp, Kontonummer\n4️⃣ GPS-Zugriff erlauben wenn aufgefordert\n5️⃣ **Absenden** tippen\n\n💡 GPS vor dem Start aktivieren — Standort wird automatisch erfasst.',
          zh: '📍 **如何创建企业/机构:**\n\n1️⃣ 从**主屏幕**点击 **"Business products"**\n2️⃣ 滚动到 **"管理业务"** → 点击 **"创建企业/机构"**\n3️⃣ 表单打开 — 填写:\n   • 企业名称、电话、许可证号\n   • 密码、描述、企业类型\n   • 联系方式、银行类型、银行账号\n4️⃣ 出现提示时允许GPS访问\n5️⃣ 点击 **提交**\n\n💡 开始前确保GPS已启用 — 位置自动获取。',
          ru: '📍 **Как создать Бизнес/Учреждение:**\n\n1️⃣ С **главного экрана** нажмите **"Business products"**\n2️⃣ Прокрутите к **"Управление бизнесом"** → **"Создать Biz/Учреждение"**\n3️⃣ Откроется форма — заполните:\n   • Название, Телефон, Номер лицензии\n   • Пароль, Описание, Тип бизнеса\n   • Контакт, Тип банка, Номер счёта\n4️⃣ Разрешить GPS при запросе\n5️⃣ Нажмите **Отправить**\n\n💡 Убедитесь, что GPS включён — местоположение фиксируется автоматически.',
          pt: '📍 **Como criar um Negócio/Instituição:**\n\n1️⃣ Da **tela inicial**, toque em **"Business products"**\n2️⃣ Role para **"Gerenciar negócios"** → **"Criar Biz/Instituição"**\n3️⃣ Um formulário abre — preencha:\n   • Nome, Telefone, Número de licença\n   • Senha, Descrição, Tipo de negócio\n   • Contato, Tipo de banco, Número de conta\n4️⃣ Permita acesso ao GPS quando solicitado\n5️⃣ Toque em **Enviar**\n\n💡 Certifique-se de que o GPS está ativo — a localização é capturada automaticamente.',
          it: '📍 **Come creare un\'Azienda/Istituzione:**\n\n1️⃣ Dalla **schermata principale**, tocca **"Business products"**\n2️⃣ Scorri verso **"Gestisci azienda"** → **"Crea Biz/Istituzione"**\n3️⃣ Si apre un modulo — compila:\n   • Nome, Telefono, Numero licenza\n   • Password, Descrizione, Tipo azienda\n   • Contatto, Tipo banca, Numero conto\n4️⃣ Consenti l\'accesso GPS quando richiesto\n5️⃣ Tocca **Invia**\n\n💡 Assicurati che il GPS sia attivo — la posizione viene acquisita automaticamente.',
          he: '📍 **כיצד ליצור עסק/מוסד:**\n\n1️⃣ מ**מסך הבית**, הקש **"Business products"**\n2️⃣ גלול ל**"ניהול עסק"** → **"צור Biz/מוסד"**\n3️⃣ טופס נפתח — מלא:\n   • שם, טלפון, מספר רישיון\n   • סיסמה, תיאור, סוג עסק\n   • איש קשר, סוג בנק, מספר חשבון\n4️⃣ אשר גישת GPS כשנדרש\n5️⃣ הקש **שלח**\n\n💡 ודא שה-GPS פעיל — המיקום מצולם אוטומטית.',
          hi: '📍 **व्यवसाय/संस्था कैसे बनाएं:**\n\n1️⃣ **होम** से **"Business products"** टैप करें\n2️⃣ **"व्यवसाय प्रबंधन"** → **"Biz/संस्था बनाएं"** तक स्क्रॉल करें\n3️⃣ एक फॉर्म खुलता है — भरें:\n   • नाम, फोन, लाइसेंस नंबर\n   • पासवर्ड, विवरण, व्यवसाय प्रकार\n   • संपर्क, बैंक प्रकार, खाता नंबर\n4️⃣ संकेत मिलने पर GPS की अनुमति दें\n5️⃣ **सबमिट** करें\n\n💡 GPS सक्षम होना चाहिए — स्थान स्वचालित रूप से कैप्चर होता है।',
          am: '📍 **ንግድ/ተቋም እንዴት ይፍጠሩ:**\n\n1️⃣ **መነሻ** ላይ **"Business products"** ይጫኑ\n2️⃣ **"ንግድ ያስተዳድሩ"** → **"Biz/ተቋም ፍጠር"** ድረስ ይሸብልሉ\n3️⃣ ቅጽ ይከፈታል — ይሙሉ:\n   • ስም፣ ስልክ፣ ፈቃድ ቁጥር\n   • 암号፣ መግለጫ፣ የንግድ አይነት\n   • ዕውቂያ፣ የባንክ አይነት፣ ሂሳብ ቁጥር\n4️⃣ ሲጠየቁ GPS ፍቀዱ\n5️⃣ **አስገቡ** ይጫኑ\n\n💡 GPS ሊበራ ይገባል — አካባቢ ራስ-ሰር ይያዛል።'
        }
      },
      {
        keywords: ['make credit request', 'credit sales request', 'request credit', 'buy on credit', 'request a loan', 'credit loan request'],
        response: {
          en: '📍 **How to make a Credit Sales Request:**\n\n1️⃣ From **Home**, tap **"Business products"**\n2️⃣ Tap **"Make Credit Sales Requests"**\n3️⃣ A sub-screen opens — choose your request type:\n   • **Business to Individual** — a business requesting credit from a person\n   • **Business to Business** — a business requesting credit from another business\n   • **Individual to Business** — a person requesting credit from a business\n   • **Individual to Individual** — a person requesting credit from another person\n4️⃣ Fill in the request details and submit\n\n💡 The other party must grant/approve before credit is extended.',
          sw: '📍 **Jinsi ya kuomba Mkopo wa Mauzo ya Mkopo:**\n\n1️⃣ Kutoka **Nyumbani**, bonyeza **"Business products"**\n2️⃣ Bonyeza **"Make Credit Sales Requests"**\n3️⃣ Skrini ndogo itafunguka — chagua aina yako:\n   • **Biashara kwenda Mtu**\n   • **Biashara kwenda Biashara**\n   • **Mtu kwenda Biashara**\n   • **Mtu kwenda Mtu**\n4️⃣ Jaza maelezo ya ombi na uwasilishe\n\n💡 Upande mwingine lazima uidhinishe kwanza.',
          fr: '📍 **Comment faire une demande de vente à crédit:**\n\n1️⃣ Depuis **Accueil**, appuyez sur **"Business products"**\n2️⃣ Appuyez sur **"Make Credit Sales Requests"**\n3️⃣ Un sous-écran s\'ouvre — choisissez:\n   • Entreprise → Particulier\n   • Entreprise → Entreprise\n   • Particulier → Entreprise\n   • Particulier → Particulier\n4️⃣ Remplissez les détails et soumettez\n\n💡 L\'autre partie doit approuver avant que le crédit soit accordé.',
          es: '📍 **Cómo hacer una Solicitud de Venta a Crédito:**\n\n1️⃣ Desde **Inicio**, toca **"Business products"**\n2️⃣ Toca **"Make Credit Sales Requests"**\n3️⃣ Se abre una sub-pantalla — elige:\n   • Negocio → Individual | Negocio → Negocio\n   • Individual → Negocio | Individual → Individual\n4️⃣ Completa los detalles y envía\n\n💡 La otra parte debe aprobar antes de que se extienda el crédito.',
          de: '📍 **Wie man eine Kreditverkaufsanfrage stellt:**\n\n1️⃣ Vom **Startbildschirm** **"Business products"** tippen\n2️⃣ **"Make Credit Sales Requests"** tippen\n3️⃣ Ein Unterbildschirm öffnet sich — wählen:\n   • Unternehmen → Person | Unternehmen → Unternehmen\n   • Person → Unternehmen | Person → Person\n4️⃣ Details ausfüllen und absenden\n\n💡 Die andere Partei muss genehmigen, bevor Kredit gewährt wird.',
          zh: '📍 **如何发起赊销请求:**\n\n1️⃣ 从**主屏幕**点击 **"Business products"**\n2️⃣ 点击 **"Make Credit Sales Requests"**\n3️⃣ 子屏幕打开 — 选择类型:\n   • 企业→个人 | 企业→企业\n   • 个人→企业 | 个人→个人\n4️⃣ 填写请求详情并提交\n\n💡 另一方必须批准后才能扩展信用。',
          ru: '📍 **Как подать запрос на кредитные продажи:**\n\n1️⃣ С **главного экрана** нажмите **"Business products"**\n2️⃣ Нажмите **"Make Credit Sales Requests"**\n3️⃣ Открывается подэкран — выберите тип:\n   • Бизнес → Физлицо | Бизнес → Бизнес\n   • Физлицо → Бизнес | Физлицо → Физлицо\n4️⃣ Заполните детали и отправьте\n\n💡 Другая сторона должна одобрить запрос до выдачи кредита.',
          pt: '📍 **Como fazer uma Solicitação de Venda a Crédito:**\n\n1️⃣ Da **tela inicial**, toque em **"Business products"**\n2️⃣ Toque em **"Make Credit Sales Requests"**\n3️⃣ Uma sub-tela abre — escolha o tipo:\n   • Negócio → Pessoa | Negócio → Negócio\n   • Pessoa → Negócio | Pessoa → Pessoa\n4️⃣ Preencha os detalhes e envie\n\n💡 A outra parte deve aprovar antes do crédito ser concedido.',
          it: '📍 **Come fare una Richiesta di Vendita a Credito:**\n\n1️⃣ Dalla **schermata principale**, tocca **"Business products"**\n2️⃣ Tocca **"Make Credit Sales Requests"**\n3️⃣ Si apre un sotto-schermo — scegli il tipo:\n   • Azienda → Persona | Azienda → Azienda\n   • Persona → Azienda | Persona → Persona\n4️⃣ Compila i dettagli e invia\n\n💡 L\'altra parte deve approvare prima che il credito venga esteso.',
          he: '📍 **כיצד להגיש בקשת מכירה באשראי:**\n\n1️⃣ מ**מסך הבית**, הקש **"Business products"**\n2️⃣ הקש **"Make Credit Sales Requests"**\n3️⃣ מסך משנה נפתח — בחר סוג:\n   • עסק → יחיד | עסק → עסק\n   • יחיד → עסק | יחיד → יחיד\n4️⃣ מלא את הפרטים ושלח\n\n💡 הצד השני חייב לאשר לפני הענקת האשראי.',
          hi: '📍 **क्रेडिट बिक्री अनुरोध कैसे करें:**\n\n1️⃣ **होम** से **"Business products"** टैप करें\n2️⃣ **"Make Credit Sales Requests"** टैप करें\n3️⃣ एक सब-स्क्रीन खुलती है — प्रकार चुनें:\n   • व्यवसाय → व्यक्ति | व्यवसाय → व्यवसाय\n   • व्यक्ति → व्यवसाय | व्यक्ति → व्यक्ति\n4️⃣ विवरण भरें और सबमिट करें\n\n💡 क्रेडिट बढ़ाने से पहले दूसरे पक्ष को मंजूरी देनी होगी।',
          am: '📍 **የክሬዲት ሽያጭ ጥያቄ እንዴት ያቅርቡ:**\n\n1️⃣ **መነሻ** ላይ **"Business products"** ይጫኑ\n2️⃣ **"Make Credit Sales Requests"** ይጫኑ\n3️⃣ ንዑስ ስክሪን ይከፈታል — አይነት ይምረጡ:\n   • ንግድ → ግለሰብ | ንግድ → ንግድ\n   • ግለሰብ → ንግድ | ግለሰብ → ግለሰብ\n4️⃣ ዝርዝሮች ይሙሉ እና ያስገቡ\n\n💡 ክሬዲት ከመሰጠቱ በፊት ሌላኛው ወገን ማፅደቅ አለበት።'
        }
      },
      {
        keywords: ['cascade payment', 'cascade payments', 'chain payment', 'payment flow'],
        response: {
          en: '📍 **How to use Cascade Payments:**\n\n1️⃣ From **Home**, tap **"Business products"**\n2️⃣ Tap **"Cascade Payments"** (top of the screen)\n3️⃣ Choose your action:\n   • **Create** — set up a new cascade payment flow with recipient accounts (Business, Individual, or Sub-unit)\n   • **Send** — execute a payment through an existing cascade flow\n   • **View** — review existing cascade payment records\n\n💡 Cascade Payments allow you to distribute money across multiple parties in a single transaction — useful for revenue sharing, group payouts, etc.',
          sw: '📍 **Jinsi ya kutumia Cascade Payments:**\n\n1️⃣ Kutoka **Nyumbani**, bonyeza **"Business products"**\n2️⃣ Bonyeza **"Cascade Payments"**\n3️⃣ Chagua hatua yako:\n   • **Unda** — tengeneza mtiririko mpya wa malipo na wapokeaji\n   • **Tuma** — tekeleza malipo kupitia mtiririko uliopo\n   • **Angalia** — kagua rekodi za malipo\n\n💡 Cascade Payments inakuruhusu kusambaza pesa kwa wahusika wengi kwa wakati mmoja.',
          fr: '📍 **Comment utiliser les Paiements en cascade:**\n\n1️⃣ Depuis **Accueil**, appuyez sur **"Business products"**\n2️⃣ Appuyez sur **"Cascade Payments"**\n3️⃣ Choisissez:\n   • **Créer** — configurer un nouveau flux de paiement\n   • **Envoyer** — exécuter un paiement via un flux existant\n   • **Voir** — consulter les enregistrements de paiements\n\n💡 Distribue de l\'argent à plusieurs parties en une seule transaction.',
          es: '📍 **Cómo usar Cascade Payments:**\n\n1️⃣ Desde **Inicio**, toca **"Business products"**\n2️⃣ Toca **"Cascade Payments"**\n3️⃣ Elige tu acción:\n   • **Crear** — nuevo flujo de pago con cuentas receptoras\n   • **Enviar** — ejecutar pago por flujo existente\n   • **Ver** — revisar registros de pagos\n\n💡 Distribuye dinero a múltiples partes en una sola transacción.',
          de: '📍 **Wie man Cascade Payments verwendet:**\n\n1️⃣ Vom **Startbildschirm** **"Business products"** tippen\n2️⃣ **"Cascade Payments"** tippen\n3️⃣ Aktion wählen:\n   • **Erstellen** — neuen Zahlungsfluss einrichten\n   • **Senden** — Zahlung über bestehenden Fluss ausführen\n   • **Anzeigen** — Zahlungsaufzeichnungen überprüfen\n\n💡 Verteilt Geld an mehrere Parteien in einer einzigen Transaktion.',
          zh: '📍 **如何使用Cascade Payments:**\n\n1️⃣ 从**主屏幕**点击 **"Business products"**\n2️⃣ 点击 **"Cascade Payments"**\n3️⃣ 选择操作:\n   • **创建** — 设置新的级联支付流\n   • **发送** — 通过现有流执行付款\n   • **查看** — 查看支付记录\n\n💡 一次交易将资金分配给多个收款方。',
          ru: '📍 **Как использовать Каскадные платежи:**\n\n1️⃣ С **главного экрана** нажмите **"Business products"**\n2️⃣ Нажмите **"Cascade Payments"**\n3️⃣ Выберите действие:\n   • **Создать** — настроить новый платёжный поток\n   • **Отправить** — выполнить платёж через существующий поток\n   • **Просмотр** — просмотр записей платежей\n\n💡 Распределяет деньги нескольким получателям за одну транзакцию.',
          pt: '📍 **Como usar Cascade Payments:**\n\n1️⃣ Da **tela inicial**, toque em **"Business products"**\n2️⃣ Toque em **"Cascade Payments"**\n3️⃣ Escolha sua ação:\n   • **Criar** — configurar novo fluxo de pagamento\n   • **Enviar** — executar pagamento por fluxo existente\n   • **Ver** — revisar registros de pagamentos\n\n💡 Distribui dinheiro para várias partes em uma única transação.',
          it: '📍 **Come usare i Pagamenti a Cascata:**\n\n1️⃣ Dalla **schermata principale**, tocca **"Business products"**\n2️⃣ Tocca **"Cascade Payments"**\n3️⃣ Scegli la tua azione:\n   • **Crea** — imposta un nuovo flusso di pagamento\n   • **Invia** — esegui pagamento tramite flusso esistente\n   • **Visualizza** — rivedi i record di pagamento\n\n💡 Distribuisce denaro a più parti in una singola transazione.',
          he: '📍 **כיצד להשתמש בתשלומים מדורגים:**\n\n1️⃣ מ**מסך הבית**, הקש **"Business products"**\n2️⃣ הקש **"Cascade Payments"**\n3️⃣ בחר פעולה:\n   • **צור** — הגדר זרימת תשלום חדשה\n   • **שלח** — בצע תשלום דרך זרימה קיימת\n   • **הצג** — בדוק רשומות תשלום\n\n💡 מפיץ כסף למספר גורמים בעסקה אחת.',
          hi: '📍 **Cascade Payments कैसे उपयोग करें:**\n\n1️⃣ **होम** से **"Business products"** टैप करें\n2️⃣ **"Cascade Payments"** टैप करें\n3️⃣ अपनी क्रिया चुनें:\n   • **बनाएं** — नया भुगतान प्रवाह सेट करें\n   • **भेजें** — मौजूदा प्रवाह के माध्यम से भुगतान करें\n   • **देखें** — भुगतान रिकॉर्ड समीक्षा करें\n\n💡 एक ही लेनदेन में कई पार्टियों को पैसे वितरित करता है।',
          am: '📍 **Cascade Payments እንዴት ይጠቀሙ:**\n\n1️⃣ **መነሻ** ላይ **"Business products"** ይጫኑ\n2️⃣ **"Cascade Payments"** ይጫኑ\n3️⃣ እርምጃ ይምረጡ:\n   • **ፍጠር** — አዲስ የክፍያ ፍሰት ያዘጋጁ\n   • **ላኩ** — ነባር ፍሰት በኩል ክፍያ ፈጽሙ\n   • **ይመልከቱ** — የክፍያ ሪኮርዶች ይፈትሹ\n\n💡 አንድ ግብይት ውስጥ ለበርካታ ወገኖች ገንዘብ ያሰራጫል።'
        }
      },
      {
        keywords: ['transfer ownership', 'transfer business', 'transfer biz', 'give business', 'hand over business'],
        response: {
          en: '📍 **How to transfer Business ownership:**\n\n1️⃣ From **Home**, tap **"Business products"**\n2️⃣ Scroll to **"Biz Adverts"** → tap **"Transfer Ownership"**\n3️⃣ Enter the **phone number of the business** you want to transfer\n4️⃣ The system verifies you are the current owner\n5️⃣ Enter the new owner\'s email and confirm\n\n⚠️ Once transferred, you will lose admin control of that business.',
          sw: '📍 **Jinsi ya kuhamisha umiliki wa Biashara:**\n\n1️⃣ Kutoka **Nyumbani**, bonyeza **"Business products"**\n2️⃣ Telezesha hadi **"Biz Adverts"** → bonyeza **"Transfer Ownership"**\n3️⃣ Ingiza **nambari ya simu ya biashara** unayotaka kuhamisha\n4️⃣ Mfumo utathibitisha kuwa wewe ni mmiliki wa sasa\n5️⃣ Ingiza barua pepe ya mmiliki mpya na uthibitishe\n\n⚠️ Mara ukishahamisha, utapoteza udhibiti wa biashara hiyo.',
          fr: '📍 **Comment transférer la propriété d\'une entreprise:**\n\n1️⃣ Depuis **Accueil**, appuyez sur **"Business products"**\n2️⃣ Faites défiler vers **"Biz Adverts"** → **"Transfer Ownership"**\n3️⃣ Entrez le **numéro de téléphone** de l\'entreprise\n4️⃣ Le système vérifie que vous êtes le propriétaire actuel\n5️⃣ Entrez l\'email du nouveau propriétaire et confirmez\n\n⚠️ Une fois transféré, vous perdez le contrôle de cette entreprise.',
          es: '📍 **Cómo transferir propiedad de negocio:**\n\n1️⃣ Desde **Inicio**, toca **"Business products"**\n2️⃣ Desplázate a **"Biz Adverts"** → **"Transfer Ownership"**\n3️⃣ Ingresa el **teléfono del negocio**\n4️⃣ El sistema verifica que eres el propietario\n5️⃣ Ingresa el email del nuevo propietario y confirma\n\n⚠️ Una vez transferido, pierdes el control de ese negocio.',
          de: '📍 **Wie man Unternehmenseigentum überträgt:**\n\n1️⃣ Vom **Startbildschirm** **"Business products"** tippen\n2️⃣ Zu **"Biz Adverts"** → **"Transfer Ownership"** scrollen\n3️⃣ **Telefonnummer des Unternehmens** eingeben\n4️⃣ Das System bestätigt, dass Sie der Eigentümer sind\n5️⃣ E-Mail des neuen Eigentümers eingeben und bestätigen\n\n⚠️ Nach Übertragung verlieren Sie die Kontrolle über dieses Unternehmen.',
          zh: '📍 **如何转让企业所有权:**\n\n1️⃣ 从**主屏幕**点击 **"Business products"**\n2️⃣ 滚动到 **"Biz Adverts"** → **"Transfer Ownership"**\n3️⃣ 输入要转让的**企业电话号码**\n4️⃣ 系统验证您是当前所有者\n5️⃣ 输入新所有者的邮箱并确认\n\n⚠️ 转让后，您将失去该企业的管理控制权。',
          ru: '📍 **Как передать право собственности на бизнес:**\n\n1️⃣ С **главного экрана** нажмите **"Business products"**\n2️⃣ Прокрутите к **"Biz Adverts"** → **"Transfer Ownership"**\n3️⃣ Введите **телефон бизнеса**\n4️⃣ Система проверяет, что вы текущий владелец\n5️⃣ Введите email нового владельца и подтвердите\n\n⚠️ После передачи вы теряете контроль над бизнесом.',
          pt: '📍 **Como transferir propriedade de negócio:**\n\n1️⃣ Da **tela inicial**, toque em **"Business products"**\n2️⃣ Role para **"Biz Adverts"** → **"Transfer Ownership"**\n3️⃣ Digite o **telefone do negócio**\n4️⃣ O sistema verifica que você é o proprietário atual\n5️⃣ Digite o email do novo proprietário e confirme\n\n⚠️ Após a transferência, você perde o controle do negócio.',
          it: '📍 **Come trasferire la proprietà di un\'azienda:**\n\n1️⃣ Dalla **schermata principale**, tocca **"Business products"**\n2️⃣ Scorri verso **"Biz Adverts"** → **"Transfer Ownership"**\n3️⃣ Inserisci il **numero di telefono dell\'azienda**\n4️⃣ Il sistema verifica che sei il proprietario attuale\n5️⃣ Inserisci l\'email del nuovo proprietario e conferma\n\n⚠️ Dopo il trasferimento, perdi il controllo di quell\'azienda.',
          he: '📍 **כיצד להעביר בעלות על עסק:**\n\n1️⃣ מ**מסך הבית**, הקש **"Business products"**\n2️⃣ גלול ל**"Biz Adverts"** → **"Transfer Ownership"**\n3️⃣ הזן את **מספר הטלפון של העסק**\n4️⃣ המערכת מאמתת שאתה הבעלים הנוכחי\n5️⃣ הזן את האימייל של הבעלים החדש ואשר\n\n⚠️ לאחר ההעברה, תאבד שליטה על העסק.',
          hi: '📍 **व्यवसाय स्वामित्व कैसे स्थानांतरित करें:**\n\n1️⃣ **होम** से **"Business products"** टैप करें\n2️⃣ **"Biz Adverts"** → **"Transfer Ownership"** तक स्क्रॉल करें\n3️⃣ **व्यवसाय का फोन नंबर** दर्ज करें\n4️⃣ सिस्टम पुष्टि करता है कि आप वर्तमान मालिक हैं\n5️⃣ नए मालिक का ईमेल दर्ज करें और पुष्टि करें\n\n⚠️ स्थानांतरण के बाद, आप उस व्यवसाय पर नियंत्रण खो देंगे।',
          am: '📍 **የንግድ ባለቤትነት እንዴት ያስተላልፉ:**\n\n1️⃣ **መነሻ** ላይ **"Business products"** ይጫኑ\n2️⃣ **"Biz Adverts"** → **"Transfer Ownership"** ድረስ ይሸብልሉ\n3️⃣ **የንግዱ ስልክ ቁጥር** ያስገቡ\n4️⃣ ስርዓቱ አሁን ባለቤት መሆንዎን ያረጋግጣል\n5️⃣ የአዲሱ ባለቤት ኢሜይል ያስገቡ እና ያረጋግጡ\n\n⚠️ ከተላለፈ በኋላ፣ ንግዱ ላይ ቁጥጥር ያጣሉ።'
        }
      },
      {
        keywords: ['add item', 'add product', 'add sales item', 'list item', 'post product', 'add stock'],
        response: {
          en: '📍 **How to add a sales item to your Business:**\n\n1️⃣ From **Home**, tap **"Business products"**\n2️⃣ Scroll to **"Manage Business"** → tap **"Add Item"**\n3️⃣ Enter the item details (name, price, description, etc.) and save\n\n💡 Items you add here will appear in the marketplace for buyers to find.',
          sw: '📍 **Jinsi ya kuongeza bidhaa ya mauzo:**\n\n1️⃣ Kutoka **Nyumbani**, bonyeza **"Business products"**\n2️⃣ Telezesha hadi **"Simamia Biashara"** → bonyeza **"Ongeza Bidhaa"**\n3️⃣ Ingiza maelezo ya bidhaa na uhifadhi\n\n💡 Bidhaa unazozongeza zitaonekana sokoni kwa wanunuzi.',
          fr: '📍 **Comment ajouter un article de vente:**\n\n1️⃣ Depuis **Accueil**, appuyez sur **"Business products"**\n2️⃣ Faites défiler vers **"Gérer l\'entreprise"** → **"Ajouter un article"**\n3️⃣ Remplissez les détails de l\'article et sauvegardez\n\n💡 Les articles ajoutés apparaîtront sur le marché pour les acheteurs.',
          es: '📍 **Cómo añadir un artículo de venta:**\n\n1️⃣ Desde **Inicio**, toca **"Business products"**\n2️⃣ Desplázate a **"Gestionar negocio"** → **"Añadir artículo"**\n3️⃣ Rellena los detalles del artículo y guarda\n\n💡 Los artículos añadidos aparecerán en el mercado.',
          de: '📍 **Wie man einen Verkaufsartikel hinzufügt:**\n\n1️⃣ Vom **Startbildschirm** **"Business products"** tippen\n2️⃣ Zu **"Geschäft verwalten"** → **"Artikel hinzufügen"** scrollen\n3️⃣ Artikeldetails eingeben und speichern\n\n💡 Hinzugefügte Artikel erscheinen im Marktplatz.',
          zh: '📍 **如何添加销售商品:**\n\n1️⃣ 从**主屏幕**点击 **"Business products"**\n2️⃣ 滚动到 **"管理业务"** → **"添加商品"**\n3️⃣ 填写商品详情并保存\n\n💡 添加的商品将出现在市场上供买家查找。',
          ru: '📍 **Как добавить товар для продажи:**\n\n1️⃣ С **главного экрана** нажмите **"Business products"**\n2️⃣ Прокрутите к **"Управление бизнесом"** → **"Добавить товар"**\n3️⃣ Введите детали товара и сохраните\n\n💡 Добавленные товары появятся на торговой площадке.',
          pt: '📍 **Como adicionar um item de venda:**\n\n1️⃣ Da **tela inicial**, toque em **"Business products"**\n2️⃣ Role para **"Gerenciar negócios"** → **"Adicionar item"**\n3️⃣ Preencha os detalhes do item e salve\n\n💡 Itens adicionados aparecem no mercado para compradores.',
          it: '📍 **Come aggiungere un articolo di vendita:**\n\n1️⃣ Dalla **schermata principale**, tocca **"Business products"**\n2️⃣ Scorri verso **"Gestisci azienda"** → **"Aggiungi articolo"**\n3️⃣ Inserisci i dettagli dell\'articolo e salva\n\n💡 Gli articoli aggiunti appariranno nel marketplace.',
          he: '📍 **כיצד להוסיף פריט מכירה:**\n\n1️⃣ מ**מסך הבית**, הקש **"Business products"**\n2️⃣ גלול ל**"ניהול עסק"** → **"הוסף פריט"**\n3️⃣ הזן את פרטי הפריט ושמור\n\n💡 פריטים שתוסיף יופיעו בשוק לקונים.',
          hi: '📍 **बिक्री आइटम कैसे जोड़ें:**\n\n1️⃣ **होम** से **"Business products"** टैप करें\n2️⃣ **"व्यवसाय प्रबंधन"** → **"आइटम जोड़ें"** तक स्क्रॉल करें\n3️⃣ आइटम विवरण भरें और सहेजें\n\n💡 जोड़े गए आइटम खरीदारों के लिए बाज़ार में दिखाई देंगे।',
          am: '📍 **የሽያጭ ዕቃ እንዴት ይጨምሩ:**\n\n1️⃣ **መነሻ** ላይ **"Business products"** ይጫኑ\n2️⃣ **"ንግድ ያስተዳድሩ"** → **"ዕቃ ጨምር"** ድረስ ይሸብልሉ\n3️⃣ የዕቃ ዝርዝሮች ያስገቡ እና ያስቀምጡ\n\n💡 የሚጨምሩት ዕቃዎች ለገዥዎች ባዛር ላይ ይታያሉ።'
        }
      },
      {
        keywords: ['benefit product', 'create benefit', 'beneficiary product', 'create a benefit product', 'biz product create', 'benefit product create'],
        response: {
          en: '📍 **How to create a Benefit Product (as a Creator):**\n\nA Benefit Product is a pooled contribution product your business creates. Beneficiaries link to it, and benefactors boost the pool.\n\n**Step 1 — Create the product:**\n1️⃣ From **Home**, tap **"Business products"**\n2️⃣ Scroll to **"Biz Products"** → tap **"Benefit Product (Create)"**\n3️⃣ Fill in:\n   • **Business Phone Number** — your business that is creating the product\n   • **Product Name** — give it a clear name\n   • **Product Description** — what is the benefit about?\n   • **Product Cost** — the contribution/subscription amount\n   • **Admin Main Account Password** — your account password to authorize\n4️⃣ Tap **Submit**\n\n**Step 2 — Link Beneficiaries:**\nAfter creating, go to **"Link Beneficiary"** to attach Businesses or Individuals who will receive the benefits.\n\n**Step 3 — Boost the Pool:**\nUse **"Boost Pooled Benefits"** to add funds into the product pool.\n\n**Step 4 — Share Benefits:**\nUse **"Share Business Benefits"** to distribute to linked beneficiaries.',
          sw: '📍 **Jinsi ya kuunda Bidhaa ya Faida (kama Muundaji):**\n\nBidhaa ya Faida ni bidhaa ya michango iliyoundwa na biashara yako. Wanufaika wanaunganika nayo, na wafadhili huimarisha dimbwi.\n\n**Hatua ya 1 — Unda bidhaa:**\n1️⃣ Kutoka **Nyumbani**, bonyeza **"Business products"**\n2️⃣ Telezesha hadi **"Bidhaa za Biz"** → bonyeza **"Unda Bidhaa ya Faida"**\n3️⃣ Jaza:\n   • **Nambari ya Simu ya Biashara** — biashara yako inayounda bidhaa\n   • **Jina la Bidhaa** — ipe jina wazi\n   • **Maelezo ya Bidhaa** — faida ni kuhusu nini?\n   • **Gharama ya Bidhaa** — kiasi cha mchango/usajili\n   • **Nenosiri la Akaunti Kuu ya Msimamizi** — nenosiri lako\n4️⃣ Bonyeza **Wasilisha**\n\n**Hatua ya 2 — Unganisha Wanufaika:**\nBaada ya kuunda, nenda **"Unganisha Mnufaika"** ili kuongeza Biashara au Watu.\n\n**Hatua ya 3 — Imarisha Dimbwi:**\nTumia **"Imarisha Faida Zilizounganishwa"** kuongeza fedha.\n\n**Hatua ya 4 — Shiriki Faida:**\nTumia **"Shiriki Faida za Biashara"** kusambaza kwa wanufaika.',
          fr: '📍 **Comment créer un Produit Avantage (en tant que Créateur):**\n\nUn Produit Avantage est un produit de contribution groupée créé par votre entreprise.\n\n**Étape 1 — Créer le produit:**\n1️⃣ Depuis **Accueil**, appuyez sur **"Business products"**\n2️⃣ Faites défiler vers **"Produits Biz"** → **"Créer un produit avantage"**\n3️⃣ Remplissez:\n   • Numéro de téléphone de l\'entreprise | Nom du produit | Description\n   • Coût du produit (montant de contribution) | Mot de passe admin\n4️⃣ Soumettez\n\n**Étape 2** — Liez les bénéficiaires via **"Lier un bénéficiaire"**\n**Étape 3** — Alimentez le pool via **"Booster les avantages groupés"**\n**Étape 4** — Distribuez via **"Partager les avantages"**',
          es: '📍 **Cómo crear un Producto de Beneficio (como Creador):**\n\n**Paso 1 — Crear el producto:**\n1️⃣ Desde **Inicio**, toca **"Business products"**\n2️⃣ Desplázate a **"Productos Biz"** → **"Beneficio Producto (Crear)"**\n3️⃣ Completa:\n   • Teléfono del negocio | Nombre del producto | Descripción\n   • Costo del producto (monto de contribución) | Contraseña admin\n4️⃣ Envía\n\n**Paso 2** — Vincula beneficiarios con **"Vincular Beneficiario"**\n**Paso 3** — Alimenta el pool con **"Impulsar beneficios agrupados"**\n**Paso 4** — Distribuye con **"Compartir beneficios"**',
          de: '📍 **Wie man ein Vorteilsprodukt erstellt (als Ersteller):**\n\n**Schritt 1 — Produkt erstellen:**\n1️⃣ Vom **Startbildschirm** **"Business products"** tippen\n2️⃣ Zu **"Biz-Produkte"** → **"Vorteilsprodukt (Erstellen)"** scrollen\n3️⃣ Ausfüllen:\n   • Unternehmenstelefon | Produktname | Beschreibung\n   • Produktkosten (Beitragsbetrag) | Admin-Passwort\n4️⃣ Absenden\n\n**Schritt 2** — Begünstigte über **"Begünstigten verknüpfen"** hinzufügen\n**Schritt 3** — Pool über **"Gebündelte Vorteile steigern"** auffüllen\n**Schritt 4** — Verteilen über **"Geschäftsvorteile teilen"**',
          zh: '📍 **如何创建福利产品（作为创建者）:**\n\n**第1步 — 创建产品:**\n1️⃣ 从**主屏幕**点击 **"Business products"**\n2️⃣ 滚动到 **"Biz产品"** → **"福利产品（创建）"**\n3️⃣ 填写:\n   • 企业电话 | 产品名称 | 产品描述\n   • 产品成本（贡献金额）| 管理员密码\n4️⃣ 提交\n\n**第2步** — 通过 **"关联受益人"** 关联受益方\n**第3步** — 通过 **"提升合并福利"** 充值资金池\n**第4步** — 通过 **"分享商业福利"** 分配',
          ru: '📍 **Как создать Продукт Льгот (как Создатель):**\n\n**Шаг 1 — Создание продукта:**\n1️⃣ С **главного экрана** нажмите **"Business products"**\n2️⃣ Прокрутите к **"Biz-продукты"** → **"Продукт льгот (Создать)"**\n3️⃣ Заполните:\n   • Телефон бизнеса | Название продукта | Описание\n   • Стоимость продукта (сумма взноса) | Пароль администратора\n4️⃣ Отправьте\n\n**Шаг 2** — Добавьте бенефициаров через **"Связать бенефициара"**\n**Шаг 3** — Пополните пул через **"Увеличить объединённые льготы"**\n**Шаг 4** — Распределите через **"Поделиться льготами"**',
          pt: '📍 **Como criar um Produto de Benefício (como Criador):**\n\n**Passo 1 — Criar o produto:**\n1️⃣ Da **tela inicial**, toque em **"Business products"**\n2️⃣ Role para **"Produtos Biz"** → **"Produto de Benefício (Criar)"**\n3️⃣ Preencha:\n   • Telefone do negócio | Nome do produto | Descrição\n   • Custo do produto (valor de contribuição) | Senha admin\n4️⃣ Envie\n\n**Passo 2** — Vincule beneficiários em **"Vincular Beneficiário"**\n**Passo 3** — Alimente o pool em **"Impulsionar benefícios agrupados"**\n**Passo 4** — Distribua em **"Compartilhar benefícios"**',
          it: '📍 **Come creare un Prodotto Beneficio (come Creatore):**\n\n**Passo 1 — Crea il prodotto:**\n1️⃣ Dalla **schermata principale**, tocca **"Business products"**\n2️⃣ Scorri verso **"Prodotti Biz"** → **"Prodotto Beneficio (Crea)"**\n3️⃣ Compila:\n   • Telefono aziendale | Nome prodotto | Descrizione\n   • Costo prodotto (importo contribuzione) | Password admin\n4️⃣ Invia\n\n**Passo 2** — Collega i beneficiari con **"Collega Beneficiario"**\n**Passo 3** — Alimenta il pool con **"Aumenta benefici raggruppati"**\n**Passo 4** — Distribuisci con **"Condividi benefici"**',
          he: '📍 **כיצד ליצור מוצר הטבה (כיוצר):**\n\n**שלב 1 — צור את המוצר:**\n1️⃣ מ**מסך הבית**, הקש **"Business products"**\n2️⃣ גלול ל**"מוצרי Biz"** → **"מוצר הטבה (צור)"**\n3️⃣ מלא:\n   • טלפון עסקי | שם מוצר | תיאור\n   • עלות מוצר (סכום תרומה) | סיסמת מנהל\n4️⃣ שלח\n\n**שלב 2** — קשר מוטבים עם **"קשר מוטב"**\n**שלב 3** — הזן כסף לבריכה עם **"הגבר הטבות מאוחדות"**\n**שלב 4** — הפץ עם **"שתף הטבות"**',
          hi: '📍 **लाभ उत्पाद कैसे बनाएं (निर्माता के रूप में):**\n\n**चरण 1 — उत्पाद बनाएं:**\n1️⃣ **होम** से **"Business products"** टैप करें\n2️⃣ **"Biz Products"** → **"Benefit Product (Create)"** तक स्क्रॉल करें\n3️⃣ भरें:\n   • व्यवसाय फोन | उत्पाद नाम | विवरण\n   • उत्पाद लागत (योगदान राशि) | Admin पासवर्ड\n4️⃣ सबमिट करें\n\n**चरण 2** — **"Link Beneficiary"** के जरिए लाभार्थी जोड़ें\n**चरण 3** — **"Boost Pooled Benefits"** से पूल में धन डालें\n**चरण 4** — **"Share Business Benefits"** से वितरित करें',
          am: '📍 **የጥቅም ምርት እንዴት ይፍጠሩ (እንደ ፈጣሪ):**\n\n**ደረጃ 1 — ምርት ፍጠሩ:**\n1️⃣ **መነሻ** ላይ **"Business products"** ይጫኑ\n2️⃣ **"Biz Products"** → **"Benefit Product (Create)"** ድረስ ይሸብልሉ\n3️⃣ ይሙሉ:\n   • የንግድ ስልክ | የምርት ስም | መግለጫ\n   • የምርት ዋጋ (የመዋጮ መጠን) | Admin 암호\n4️⃣ ያስገቡ\n\n**ደረጃ 2** — **"Link Beneficiary"** በኩል ተጠቃሚዎች ያስተሳስሩ\n**ደረጃ 3** — **"Boost Pooled Benefits"** ፑል ያሟሉ\n**ደረጃ 4** — **"Share Business Benefits"** ያሰራጩ'
        }
      },
      {
        keywords: ['link beneficiary', 'add beneficiary', 'link benefactor', 'wire up beneficiary', 'connect beneficiary', 'beneficiary link', 'link biz beneficiary', 'link pal beneficiary'],
        response: {
          en: '📍 **How to link a Beneficiary to a Benefit Product:**\n\nThere are two types — link a **Business** or an **Individual (Pal)**.\n\n**Steps:**\n1️⃣ From **Home**, tap **"Business products"**\n2️⃣ Scroll to **"Biz Products"** → tap **"Link Beneficiary"**\n3️⃣ A list of active Benefit Products appears — **search by creator name** and select the product\n4️⃣ The system takes you to the linking form. Fill in:\n   • **Benefactor Business Number** — the business funding the product\n   • **Beneficiary Business Number** (for Biz) OR **Beneficiary email** (for Pal/Individual)\n   • **Admin Main Account Password** — to authorize the link\n5️⃣ Tap **Submit**\n\n💡 **Key concepts:**\n• **Benefactor** = the business/person putting money INTO the pool\n• **Beneficiary** = the business/person who RECEIVES from the pool\n• You must be the Creator or Admin of the business to link beneficiaries',
          sw: '📍 **Jinsi ya kuunganisha Mnufaika na Bidhaa ya Faida:**\n\nKuna aina mbili — unganisha **Biashara** au **Mtu Binafsi (Pal)**.\n\n**Hatua:**\n1️⃣ Kutoka **Nyumbani**, bonyeza **"Business products"**\n2️⃣ Telezesha hadi **"Bidhaa za Biz"** → bonyeza **"Unganisha Mnufaika"**\n3️⃣ Orodha ya Bidhaa za Faida zinazopatikana inaonekana — **tafuta kwa jina la muundaji** na uchague bidhaa\n4️⃣ Jaza fomu:\n   • **Namba ya Biashara ya Mfadhili** — biashara inayofadhili bidhaa\n   • **Namba ya Biashara ya Mnufaika** (kwa Biz) AU **Barua pepe ya Mnufaika** (kwa Pal)\n   • **Nenosiri la Akaunti Kuu ya Msimamizi**\n5️⃣ Bonyeza **Wasilisha**\n\n💡 **Mfadhili** = anayeweka pesa kwenye dimbwi | **Mnufaika** = anayepokea kutoka dimbwi',
          fr: '📍 **Comment lier un bénéficiaire à un Produit Avantage:**\n\nDeux types — lier une **Entreprise** ou un **Particulier (Pal)**.\n\n**Étapes:**\n1️⃣ Depuis **Accueil**, appuyez sur **"Business products"**\n2️⃣ Faites défiler vers **"Produits Biz"** → **"Lier un bénéficiaire"**\n3️⃣ Liste des produits actifs — **cherchez par nom du créateur** et sélectionnez\n4️⃣ Remplissez le formulaire:\n   • Numéro de l\'entreprise bienfaitrice | Numéro/email du bénéficiaire | Mot de passe admin\n5️⃣ Soumettez\n\n💡 **Bienfaiteur** = celui qui finance le pool | **Bénéficiaire** = celui qui reçoit',
          es: '📍 **Cómo vincular un Beneficiario a un Producto de Beneficio:**\n\nDos tipos — vincular un **Negocio** o un **Individuo (Pal)**.\n\n**Pasos:**\n1️⃣ Desde **Inicio**, toca **"Business products"**\n2️⃣ Desplázate a **"Productos Biz"** → **"Vincular Beneficiario"**\n3️⃣ Lista de productos activos — **busca por nombre del creador** y selecciona\n4️⃣ Completa:\n   • Teléfono del negocio benefactor | Teléfono/email del beneficiario | Contraseña admin\n5️⃣ Envía\n\n💡 **Benefactor** = quien financia el pool | **Beneficiario** = quien recibe',
          de: '📍 **Wie man einen Begünstigten mit einem Vorteilsprodukt verknüpft:**\n\nZwei Typen — **Unternehmen** oder **Einzelperson (Pal)** verknüpfen.\n\n**Schritte:**\n1️⃣ Vom **Startbildschirm** **"Business products"** tippen\n2️⃣ Zu **"Biz-Produkte"** → **"Begünstigten verknüpfen"** scrollen\n3️⃣ Liste aktiver Produkte — **nach Ersteller suchen** und auswählen\n4️⃣ Formular ausfüllen:\n   • Telefon des Förderers | Telefon/E-Mail des Begünstigten | Admin-Passwort\n5️⃣ Absenden\n\n💡 **Förderer** = wer in den Pool einzahlt | **Begünstigter** = wer erhält',
          zh: '📍 **如何将受益人关联到福利产品:**\n\n两种类型 — 关联**企业**或**个人（Pal）**。\n\n**步骤:**\n1️⃣ 从**主屏幕**点击 **"Business products"**\n2️⃣ 滚动到 **"Biz产品"** → **"关联受益人"**\n3️⃣ 活跃产品列表出现 — **按创建者姓名搜索**并选择\n4️⃣ 填写表单:\n   • 捐助方企业电话 | 受益人企业电话/邮箱 | 管理员密码\n5️⃣ 提交\n\n💡 **捐助方** = 向资金池投入资金者 | **受益人** = 从资金池获得的一方',
          ru: '📍 **Как связать бенефициара с Продуктом льгот:**\n\nДва типа — **Бизнес** или **Физлицо (Pal)**.\n\n**Шаги:**\n1️⃣ С **главного экрана** нажмите **"Business products"**\n2️⃣ Прокрутите к **"Biz-продукты"** → **"Связать бенефициара"**\n3️⃣ Список активных продуктов — **поиск по имени создателя**, выберите\n4️⃣ Заполните форму:\n   • Телефон бизнеса-благодетеля | Телефон/email бенефициара | Пароль администратора\n5️⃣ Отправьте\n\n💡 **Благодетель** = кто вносит в пул | **Бенефициар** = кто получает из пула',
          pt: '📍 **Como vincular um Beneficiário a um Produto de Benefício:**\n\nDois tipos — **Negócio** ou **Indivíduo (Pal)**.\n\n**Passos:**\n1️⃣ Da **tela inicial**, toque em **"Business products"**\n2️⃣ Role para **"Produtos Biz"** → **"Vincular Beneficiário"**\n3️⃣ Lista de produtos ativos — **busque pelo nome do criador** e selecione\n4️⃣ Preencha:\n   • Telefone do negócio benfeitor | Telefone/email do beneficiário | Senha admin\n5️⃣ Envie\n\n💡 **Benfeitor** = quem financia o pool | **Beneficiário** = quem recebe',
          it: '📍 **Come collegare un Beneficiario a un Prodotto Beneficio:**\n\nDue tipi — **Azienda** o **Individuo (Pal)**.\n\n**Passi:**\n1️⃣ Dalla **schermata principale**, tocca **"Business products"**\n2️⃣ Scorri verso **"Prodotti Biz"** → **"Collega Beneficiario"**\n3️⃣ Elenco dei prodotti attivi — **cerca per nome del creatore** e seleziona\n4️⃣ Compila:\n   • Telefono azienda benefattrice | Telefono/email del beneficiario | Password admin\n5️⃣ Invia\n\n💡 **Benefattore** = chi finanzia il pool | **Beneficiario** = chi riceve',
          he: '📍 **כיצד לקשר מוטב למוצר הטבה:**\n\nשני סוגים — **עסק** או **יחיד (Pal)**.\n\n**שלבים:**\n1️⃣ מ**מסך הבית**, הקש **"Business products"**\n2️⃣ גלול ל**"מוצרי Biz"** → **"קשר מוטב"**\n3️⃣ רשימת מוצרים פעילים — **חפש לפי שם היוצר** ובחר\n4️⃣ מלא:\n   • מספר עסק המיטיב | מספר/אימייל המוטב | סיסמת מנהל\n5️⃣ שלח\n\n💡 **מיטיב** = מממן את הבריכה | **מוטב** = מקבל מהבריכה',
          hi: '📍 **लाभार्थी को Benefit Product से कैसे जोड़ें:**\n\nदो प्रकार — **व्यवसाय** या **व्यक्ति (Pal)**।\n\n**चरण:**\n1️⃣ **होम** से **"Business products"** टैप करें\n2️⃣ **"Biz Products"** → **"Link Beneficiary"** तक स्क्रॉल करें\n3️⃣ सक्रिय उत्पादों की सूची — **निर्माता के नाम से खोजें** और चुनें\n4️⃣ भरें:\n   • Benefactor व्यवसाय नंबर | Beneficiary व्यवसाय नंबर/ईमेल | Admin पासवर्ड\n5️⃣ सबमिट करें\n\n💡 **Benefactor** = पूल में पैसे डालने वाला | **Beneficiary** = पूल से पाने वाला',
          am: '📍 **ተጠቃሚን ከጥቅም ምርት ጋር እንዴት ያስተሳስሩ:**\n\nሁለት አይነቶች — **ንግድ** ወይም **ግለሰብ (Pal)**።\n\n**ደረጃዎች:**\n1️⃣ **መነሻ** ላይ **"Business products"** ይጫኑ\n2️⃣ **"Biz Products"** → **"Link Beneficiary"** ድረስ ይሸብልሉ\n3️⃣ ንቁ ምርቶች ዝርዝር — **በፈጣሪ ስም ፈልጉ** እና ይምረጡ\n4️⃣ ይሙሉ:\n   • Benefactor የንግድ ቁጥር | Beneficiary ቁጥር/ኢሜይል | Admin 암호\n5️⃣ ያስገቡ\n\n💡 **Benefactor** = ወደ ፑሉ ገንዘብ የሚጨምር | **Beneficiary** = ከፑሉ የሚቀበል'
        }
      },
      {
        keywords: ['boost pooled benefits', 'boost pool', 'add to pool', 'contribute pool', 'boost benefits', 'benefactor contribute', 'fund the pool'],
        response: {
          en: '📍 **How to Boost Pooled Benefits (as a Benefactor):**\n\nBoosting adds funds to an existing Benefit Product pool.\n\n1️⃣ From **Home**, tap **"Business products"**\n2️⃣ Scroll to **"Biz Products"** → tap **"Boost Pooled Benefits"**\n3️⃣ Fill in:\n   • **Sender National ID / Business Phone** — your business identifier\n   • **Recipient National ID** — the product creator\'s identifier\n   • **Amount** — how much to add to the pool\n   • **Description** — reason for the boost\n4️⃣ Confirm\n\n💡 A transaction fee applies. Ensure your business has sufficient balance before boosting.',
          sw: '📍 **Jinsi ya Kuimarisha Faida Zilizounganishwa (kama Mfadhili):**\n\nKuimarisha kunaongeza fedha kwenye dimbwi la Bidhaa ya Faida iliyopo.\n\n1️⃣ Kutoka **Nyumbani**, bonyeza **"Business products"**\n2️⃣ Telezesha hadi **"Bidhaa za Biz"** → bonyeza **"Imarisha Faida Zilizounganishwa"**\n3️⃣ Jaza:\n   • ID ya Kitaifa ya Mtumaji / Simu ya Biashara\n   • ID ya Kitaifa ya Mpokeaji\n   • Kiasi cha kuongeza\n   • Maelezo\n4️⃣ Thibitisha\n\n💡 Ada ya muamala itatumika. Hakikisha biashara ina salio la kutosha.',
          fr: '📍 **Comment alimenter le pool (en tant que Bienfaiteur):**\n\n1️⃣ Depuis **Accueil**, appuyez sur **"Business products"**\n2️⃣ Faites défiler vers **"Produits Biz"** → **"Booster les avantages groupés"**\n3️⃣ Remplissez:\n   • ID/téléphone expéditeur | ID destinataire | Montant | Description\n4️⃣ Confirmez\n\n💡 Des frais de transaction s\'appliquent.',
          es: '📍 **Cómo impulsar el pool de beneficios (como Benefactor):**\n\n1️⃣ Desde **Inicio**, toca **"Business products"**\n2️⃣ Desplázate a **"Productos Biz"** → **"Impulsar beneficios agrupados"**\n3️⃣ Completa:\n   • ID/teléfono del emisor | ID del receptor | Monto | Descripción\n4️⃣ Confirma\n\n💡 Se aplica una comisión de transacción.',
          de: '📍 **Wie man den Pool auflädt (als Förderer):**\n\n1️⃣ Vom **Startbildschirm** **"Business products"** tippen\n2️⃣ Zu **"Biz-Produkte"** → **"Gebündelte Vorteile steigern"** scrollen\n3️⃣ Ausfüllen:\n   • Sender-ID/Telefon | Empfänger-ID | Betrag | Beschreibung\n4️⃣ Bestätigen\n\n💡 Transaktionsgebühren fallen an.',
          zh: '📍 **如何提升资金池（作为捐助方）:**\n\n1️⃣ 从**主屏幕**点击 **"Business products"**\n2️⃣ 滚动到 **"Biz产品"** → **"提升合并福利"**\n3️⃣ 填写:\n   • 发送方ID/电话 | 接收方ID | 金额 | 描述\n4️⃣ 确认\n\n💡 将收取交易费。',
          ru: '📍 **Как пополнить пул льгот (как Благодетель):**\n\n1️⃣ С **главного экрана** нажмите **"Business products"**\n2️⃣ Прокрутите к **"Biz-продукты"** → **"Увеличить объединённые льготы"**\n3️⃣ Заполните:\n   • ID/телефон отправителя | ID получателя | Сумма | Описание\n4️⃣ Подтвердите\n\n💡 Взимается комиссия за транзакцию.',
          pt: '📍 **Como alimentar o pool de benefícios (como Benfeitor):**\n\n1️⃣ Da **tela inicial**, toque em **"Business products"**\n2️⃣ Role para **"Produtos Biz"** → **"Impulsionar benefícios agrupados"**\n3️⃣ Preencha:\n   • ID/telefone remetente | ID destinatário | Valor | Descrição\n4️⃣ Confirme\n\n💡 Aplica-se taxa de transação.',
          it: '📍 **Come alimentare il pool (come Benefattore):**\n\n1️⃣ Dalla **schermata principale**, tocca **"Business products"**\n2️⃣ Scorri verso **"Prodotti Biz"** → **"Aumenta benefici raggruppati"**\n3️⃣ Compila:\n   • ID/telefono mittente | ID destinatario | Importo | Descrizione\n4️⃣ Conferma\n\n💡 Si applica una commissione di transazione.',
          he: '📍 **כיצד להגביר את הבריכה (כמיטיב):**\n\n1️⃣ מ**מסך הבית**, הקש **"Business products"**\n2️⃣ גלול ל**"מוצרי Biz"** → **"הגבר הטבות מאוחדות"**\n3️⃣ מלא:\n   • ID/טלפון שולח | ID מקבל | סכום | תיאור\n4️⃣ אשר\n\n💡 יחויבו עמלות עסקה.',
          hi: '📍 **Pool में योगदान कैसे दें (Benefactor के रूप में):**\n\n1️⃣ **होम** से **"Business products"** टैप करें\n2️⃣ **"Biz Products"** → **"Boost Pooled Benefits"** तक स्क्रॉल करें\n3️⃣ भरें:\n   • प्रेषक ID/फोन | प्राप्तकर्ता ID | राशि | विवरण\n4️⃣ पुष्टि करें\n\n💡 लेनदेन शुल्क लागू होता है।',
          am: '📍 **ፑሉን እንዴት ያጎለብቱ (Benefactor እንደሆኑ):**\n\n1️⃣ **መነሻ** ላይ **"Business products"** ይጫኑ\n2️⃣ **"Biz Products"** → **"Boost Pooled Benefits"** ድረስ ይሸብልሉ\n3️⃣ ይሙሉ:\n   • ላኪ ID/ስልክ | ተቀባይ ID | መጠን | መግለጫ\n4️⃣ ያረጋግጡ\n\n💡 የግብይት ክፍያ ይተገበራል።'
        }
      },
      {
        keywords: ['share benefits', 'distribute benefits', 'share business benefits', 'view benefits shared', 'benefit shares'],
        response: {
          en: '📍 **How to Share / View Business Benefits:**\n\n**To share benefits to beneficiaries:**\n1️⃣ From **Home**, tap **"Business products"**\n2️⃣ Scroll to **"Biz Products"** → tap **"Share Business Benefits"**\n3️⃣ Select the benefit product to share from, confirm the distribution\n\n**To view benefits already shared:**\n1️⃣ Same path → tap **"View Business Benefits Shared"**\n2️⃣ See a record of all past distributions\n\n💡 Only the Creator or Admin of the Benefit Product can trigger sharing.',
          sw: '📍 **Jinsi ya Kushiriki/Kuona Faida za Biashara:**\n\n**Kushiriki faida kwa wanufaika:**\n1️⃣ Kutoka **Nyumbani**, bonyeza **"Business products"**\n2️⃣ Telezesha hadi **"Bidhaa za Biz"** → bonyeza **"Shiriki Faida za Biashara"**\n3️⃣ Chagua bidhaa ya faida ya kushiriki, thibitisha usambazaji\n\n**Kuona faida zilizoshirikiwa:**\n1️⃣ Njia ile ile → bonyeza **"Angalia Faida za Biashara Zilizoshirikiwa"**\n\n💡 Ni Muundaji au Msimamizi peke yake anayeweza kusambaza faida.',
          fr: '📍 **Comment partager / voir les avantages partagés:**\n\n**Pour partager:** Accueil → Business products → Produits Biz → **"Partager les avantages"** → sélectionner le produit → confirmer\n\n**Pour voir:** Même chemin → **"Voir les avantages partagés"**\n\n💡 Seul le Créateur ou l\'Admin peut déclencher le partage.',
          es: '📍 **Cómo compartir/ver Beneficios compartidos:**\n\n**Para compartir:** Inicio → Business products → Productos Biz → **"Compartir beneficios"** → selecciona el producto → confirma\n\n**Para ver:** Mismo camino → **"Ver beneficios compartidos"**\n\n💡 Solo el Creador o Admin puede distribuir beneficios.',
          de: '📍 **Vorteile teilen/anzeigen:**\n\n**Zum Teilen:** Startbildschirm → Business products → Biz-Produkte → **"Geschäftsvorteile teilen"** → Produkt auswählen → Bestätigen\n\n**Zum Anzeigen:** Gleicher Pfad → **"Geteilte Vorteile anzeigen"**\n\n💡 Nur der Ersteller oder Admin kann teilen.',
          zh: '📍 **如何分享/查看已分享福利:**\n\n**分享福利:** 主屏幕 → Business products → Biz产品 → **"分享商业福利"** → 选择产品 → 确认\n\n**查看已分享:** 同路径 → **"查看已分享的商业福利"**\n\n💡 只有创建者或管理员才能触发分享。',
          ru: '📍 **Как поделиться/просмотреть льготы:**\n\n**Для распределения:** Главный экран → Business products → Biz-продукты → **"Поделиться льготами"** → выбрать продукт → подтвердить\n\n**Для просмотра:** Тот же путь → **"Просмотреть общие льготы"**\n\n💡 Только Создатель или Администратор может запустить распределение.',
          pt: '📍 **Como compartilhar/ver Benefícios compartilhados:**\n\n**Para compartilhar:** Início → Business products → Produtos Biz → **"Compartilhar benefícios"** → selecione o produto → confirme\n\n**Para ver:** Mesmo caminho → **"Ver benefícios compartilhados"**\n\n💡 Apenas o Criador ou Admin pode distribuir.',
          it: '📍 **Come condividere/vedere i Benefici condivisi:**\n\n**Per condividere:** Schermata principale → Business products → Prodotti Biz → **"Condividi benefici"** → seleziona prodotto → conferma\n\n**Per vedere:** Stesso percorso → **"Visualizza benefici condivisi"**\n\n💡 Solo il Creatore o Admin può distribuire.',
          he: '📍 **כיצד לשתף/לצפות בהטבות משותפות:**\n\n**לשיתוף:** מסך הבית → Business products → מוצרי Biz → **"שתף הטבות"** → בחר מוצר → אשר\n\n**לצפייה:** אותו נתיב → **"הצג הטבות משותפות"**\n\n💡 רק היוצר או המנהל יכולים להפעיל את השיתוף.',
          hi: '📍 **Benefits कैसे Share/देखें:**\n\n**Share करने के लिए:** होम → Business products → Biz Products → **"Share Business Benefits"** → उत्पाद चुनें → पुष्टि करें\n\n**देखने के लिए:** वही रास्ता → **"View Business Benefits Shared"**\n\n💡 केवल Creator या Admin ही share trigger कर सकता है।',
          am: '📍 **Benefits እንዴት ያጋሩ/ይመልከቱ:**\n\n**ለማጋራት:** መነሻ → Business products → Biz Products → **"Share Business Benefits"** → ምርት ይምረጡ → ያረጋግጡ\n\n**ለማየት:** ተመሳሳይ ዱካ → **"View Business Benefits Shared"**\n\n💡 Creator ወይም Admin ብቻ ማጋራትን ሊጀምር ይችላል።'
        }
      }
    ]
  },
  {
    id: 'go-shopping',
    screen: 'GoShopping',
    keywords: ['go shopping', 'shopping', 'market', 'buy', 'store', 'browse products', 'shopping tab', 'shop', 'full payment', 'partial payment', 'payment options', 'transport assisted', 'delivery help'],
    description: {
      en: 'Go Shopping is the NiSenti marketplace tab where you browse sellers, compare offers, and shop for items. Choose quick checkout or Transport-assisted shopping, with full payment and partial payment options available.',
      ar: 'Go Shopping هو علامة التبويب الخاصة بـ NiSenti حيث يمكنك تصفح البائعين ومقارنة العروض والتسوق للسلع عبر المنصة.',
      zh: 'Go Shopping是NiSenti的市场选项卡，您可以在其中浏览卖家、比较优惠并搜索商品。',
      ru: 'Go Shopping — это вкладка магазина NiSenti, где вы просматриваете продавцов, сравниваете предложения и покупаете товары.',
      sw: 'Go Shopping ni tab ya soko ya NiSenti ambapo unaweza kuvinjari wauzaji, kulinganisha ofa, na kununua bidhaa.',
      fr: 'Go Shopping est l’onglet marché de NiSenti où vous parcourez les vendeurs, comparez les offres et achetez des articles.',
      es: 'Go Shopping es la pestaña de mercado de NiSenti donde exploras vendedores, comparas ofertas y compras artículos.',
      de: 'Go Shopping ist der Marktab der NiSenti-App, wo Sie Verkäufer durchsuchen, Angebote vergleichen und Artikel kaufen.',
      pt: 'Go Shopping é a aba de mercado do NiSenti onde você navega por vendedores, compara ofertas e compra itens.',
      it: 'Go Shopping è la scheda mercato di NiSenti dove puoi esplorare venditori, confrontare offerte e acquistare articoli.',
      he: 'Go Shopping הוא לשונית השוק של NiSenti שבה אתה גולש בין מוכרים, משווה הצעות וקונה פריטים.',
      hi: 'Go Shopping NiSenti का मार्केटप्लेस टैब है जहां आप विक्रेताओं को ब्राउज़ करते हैं, ऑफ़र की तुलना करते हैं और आइटम खरीदते हैं।',
      am: 'Go Shopping የNiSenti ገበያ ታብ ነው የሚሸጡትን ሻጭዎች ለማሳሰብ፣ የቅናሽ ዋጋ ለማጣራት እና እቃዎችን ለማሽያጭ የሚያገለግል።',
    },
    benefits: {
      en: ['Browse sellers in one place', 'Compare prices and deals', 'Search items by brand or category', 'Save favorites for later', 'Start purchases quickly'],
      ar: ['تصفح البائعين في مكان واحد', 'قارن الأسعار والعروض', 'ابحث عن العناصر حسب العلامة أو الفئة', 'احفظ المفضلات لاحقًا', 'ابدأ التسوق بسرعة'],
      zh: ['在一个地方浏览卖家', '比较价格和优惠', '按品牌或类别搜索商品', '保存收藏夹以备后用', '快速开始购买'],
      ru: ['Просматривайте продавцов в одном месте', 'Сравнивайте цены и предложения', 'Ищите товары по бренду или категории', 'Сохраняйте избранное', 'Начинайте покупки быстро'],
      sw: ['Vinje wauzaji mahali pamoja', 'Linganishwa bei na ofa', 'Tafuta vitu kwa chapa au kategoria', 'Hifadhi vipendavyo kwa baadaye', 'Anza ununuzi kwa haraka'],
      fr: ['Parcourez les vendeurs au même endroit', 'Comparez les prix et offres', 'Recherchez des articles par marque ou catégorie', 'Enregistrez les favoris', 'Commencez vos achats rapidement'],
      es: ['Explora vendedores en un solo lugar', 'Compara precios y ofertas', 'Busca artículos por marca o categoría', 'Guarda favoritos', 'Inicia compras rápidamente'],
      de: ['Durchsuchen Sie Verkäufer an einem Ort', 'Vergleichen Sie Preise und Angebote', 'Suchen Sie Artikel nach Marke oder Kategorie', 'Speichern Sie Favoriten', 'Starten Sie Einkäufe schnell'],
      pt: ['Navegue por vendedores em um só lugar', 'Compare preços e ofertas', 'Pesquise itens por marca ou categoria', 'Salve favoritos', 'Comece compras rapidamente'],
      it: ['Sfoglia i venditori in un unico posto', 'Confronta prezzi e offerte', 'Cerca articoli per marca o categoria', 'Salva preferiti', 'Avvia acquisti in fretta'],
      he: ['עיין במוכרים במקום אחד', 'השווה מחירים ומבצעים', 'חפש פריטים לפי מותג או קטגוריה', 'שמור מועדפים', 'התחל לקניות במהירות'],
      hi: ['एक ही जगह पर विक्रेताओं को ब्राउज़ करें', 'कीमतों और डील की तुलना करें', 'ब्रांड या श्रेणी द्वारा आइटम खोजें', 'बाद में के लिए पसंदीदा सहेजें', 'तेजी से खरीदारी शुरू करें'],
      am: ['ተሸጫሚዎችን በአንድ ቦታ ይመልከቱ', 'የዋጋና የድርሻ ልዩነት ይነጻጽሩ', 'እቃዎችን በምርት ወይም ምድብ ይፈልጉ', 'ከዚያም የተወደዱን ይቀርቡ', 'ፈጣን ግዢ ይጀምሩ']
    },
    aboutProduct: {
      en: 'Go Shopping is the mobile marketplace experience inside NiSenti that helps you find sellers, compare item details, and place purchase orders from your phone. You can shop with quick self-checkout or choose Transport-assisted buying. Payment options include full payment or partial payment plans where available.',
      ar: 'Go Shopping هي تجربة السوق داخل NiSenti التي تساعدك على العثور على البائعين ومقارنة تفاصيل العناصر وتقديم طلبات الشراء من هاتفك.',
      zh: 'Go Shopping是NiSenti内的移动市场体验，可帮助您查找卖家、比较商品详情并从手机下单。',
      ru: 'Go Shopping — это мобильный маркетплейс внутри NiSenti, который помогает находить продавцов, сравнивать товары и оформлять заказы с телефона.',
      sw: 'Go Shopping ni soko la simu ndani ya NiSenti linalokusaidia kupata wauzaji, kulinganisha bidhaa, na kuweka oda za ununuzi kupitia simu yako.',
      fr: 'Go Shopping est l’expérience marketplace mobile de NiSenti qui vous aide à trouver des vendeurs, comparer des articles et passer des commandes depuis votre téléphone.',
      es: 'Go Shopping es la experiencia de marketplace móvil dentro de NiSenti que te ayuda a encontrar vendedores, comparar artículos y hacer pedidos desde tu teléfono.',
      de: 'Go Shopping ist das mobile Marktplatzerlebnis in NiSenti, das Ihnen hilft, Verkäufer zu finden, Artikel zu vergleichen und Bestellungen über Ihr Telefon aufzugeben.',
      pt: 'Go Shopping é a experiência de marketplace móvel dentro do NiSenti que ajuda a encontrar vendedores, comparar itens e fazer pedidos pelo telefone.',
      it: 'Go Shopping è l’esperienza marketplace mobile all’interno di NiSenti che ti aiuta a trovare venditori, confrontare articoli e ordinare acquisti dal tuo telefono.',
      he: 'Go Shopping היא חוויית השוק הניידת בתוך NiSenti שעוזרת לך למצוא מוכרים, להשוות פריטים ולבצע הזמנות דרך הטלפון.',
      hi: 'Go Shopping NiSenti के भीतर मोबाइल मार्केटप्लेस अनुभव है जो आपको विक्रेताओं को खोजने, आइटम की तुलना करने और अपने फोन से खरीदारी करने में मदद करता है।',
      am: 'Go Shopping የNiSenti የሞባይል ገበያ ልምድ ነው የሚረዳዎት ደንበኞችን ማግኘት፣ የእቃ ማብራሪያ ማነሳሳትና ከስልክዎ ግዢ ትዕዛዝ ማድረግ ላይ።'
    },
    howToAccess: {
      en: `📍 How to access Go Shopping:

1️⃣ Tap the **GoShopping** tab at the bottom of the screen
2️⃣ Use the search bar to find items, brands, or businesses
3️⃣ Apply filters for price, location, and category
4️⃣ Tap any product to view details and add it to your cart
5️⃣ Proceed to checkout when you are ready to buy

GoShopping offers two shopping modes:
• **Quick checkout** — choose items yourself, add them to your cart, and pay directly.
• **Transport-assisted shopping** — choose items and request NiSenti Transport support for pickup and delivery.

Payment options:
• **Full payment** — pay the total amount at checkout.
• **Partial payment** — pay part now and settle the remainder later when available.`,
      ar: `📍 كيفية الوصول إلى Go Shopping:

1️⃣ اضغط على علامة التبويب **GoShopping** في أسفل الشاشة
2️⃣ استخدم شريط البحث للعثثور على العناصر أو العلامات التجارية أو الشركات
3️⃣ طبق الفلاتر على السعر والموقع والفئة
4️⃣ اضغط على أي منتج لعرض التفاصيل وإضافته إلى عربة التسوق
5️⃣ تابع إلى الدفع عندما تكون جاهزًا للشراء`,
      zh: `📍 如何访问Go Shopping：

1️⃣ 点击屏幕底部的 **GoShopping** 选项卡
2️⃣ 使用搜索栏查找商品、品牌或商家
3️⃣ 应用价格、位置和类别过滤器
4️⃣ 点击任意产品查看详情并加入购物车
5️⃣ 准备好购买时继续结账`,
      ru: `📍 Как попасть в Go Shopping:

1️⃣ Нажмите вкладку **GoShopping** внизу экрана
2️⃣ Используйте строку поиска для товаров, брендов или продавцов
3️⃣ Примените фильтры по цене, местоположению и категории
4️⃣ Нажмите на товар, чтобы посмотреть детали и добавить в корзину
5️⃣ Перейдите к оформлению заказа, когда будете готовы купить`,
      sw: `📍 Jinsi ya kufikia Go Shopping:

1️⃣ Gonga kichupo **GoShopping** chini ya skrini
2️⃣ Tumia barua ya utafutaji kutafuta vitu, chapa, au biashara
3️⃣ Tumia kichujio kwa bei, eneo, na kategoria
4️⃣ Gonga bidhaa yoyote kuona undani na uiweke kwenye gari
5️⃣ Endelea kwenye malipo wakati uko tayari kununua`,
      fr: `📍 Comment accéder à Go Shopping :

1️⃣ Appuyez sur l’onglet **GoShopping** en bas de l’écran
2️⃣ Utilisez la barre de recherche pour trouver des articles, des marques ou des commerçants
3️⃣ Appliquez des filtres pour le prix, l’emplacement et la catégorie
4️⃣ Touchez un produit pour voir les détails et l’ajouter à votre panier
5️⃣ Passez à la caisse lorsque vous êtes prêt à acheter`,
      es: `📍 Cómo acceder a Go Shopping:

1️⃣ Toca la pestaña **GoShopping** en la parte inferior de la pantalla
2️⃣ Usa la barra de búsqueda para encontrar artículos, marcas o negocios
3️⃣ Aplica filtros por precio, ubicación y categoría
4️⃣ Toca cualquier producto para ver detalles y añadirlo al carrito
5️⃣ Continúa al pago cuando estés listo para comprar`,
      de: `📍 So greifen Sie auf Go Shopping zu:

1️⃣ Tippen Sie auf die Registerkarte **GoShopping** unten auf dem Bildschirm
2️⃣ Verwenden Sie die Suchleiste, um Artikel, Marken oder Händler zu finden
3️⃣ Wenden Sie Filter für Preis, Standort und Kategorie an
4️⃣ Tippen Sie auf ein Produkt, um Details zu sehen und es in den Warenkorb zu legen
5️⃣ Fahren Sie mit dem Checkout fort, sobald Sie bereit zum Kauf sind`,
      pt: `📍 Como acessar o Go Shopping:

1️⃣ Toque na aba **GoShopping** na parte inferior da tela
2️⃣ Use a barra de pesquisa para encontrar itens, marcas ou negócios
3️⃣ Aplique filtros por preço, localização e categoria
4️⃣ Toque em qualquer produto para ver detalhes e adicioná-lo ao carrinho
5️⃣ Prossiga para o checkout quando estiver pronto para comprar`,
      it: `📍 Come accedere a Go Shopping:

1️⃣ Tocca la scheda **GoShopping** in basso allo schermo
2️⃣ Usa la barra di ricerca per trovare articoli, marchi o venditori
3️⃣ Applica filtri per prezzo, posizione e categoria
4️⃣ Tocca un prodotto per vedere i dettagli e aggiungerlo al carrello
5️⃣ Procedi al checkout quando sei pronto per acquistare`,
      he: `📍 כיצד לגשת ל-Go Shopping:

1️⃣ הקש על לשונית **GoShopping** בתחתית המסך
2️⃣ השתמש בשורת החיפוש כדי למצוא פריטים, מותגים או חנויות
3️⃣ החל מסננים למחיר, מיקום וקטגוריה
4️⃣ הקש על מוצר להצגת פרטים והוספה לעגלה
5️⃣ המשך לקופה כשאתה מוכן לקנות`,
      hi: `📍 Go Shopping तक कैसे पहुंचें:

1️⃣ स्क्रीन के नीचे **GoShopping** टैब पर टैप करें
2️⃣ आइटम, ब्रांड या व्यवसाय खोजने के लिए खोज बार का उपयोग करें
3️⃣ मूल्य, स्थान और श्रेणी के लिए फ़िल्टर लागू करें
4️⃣ किसी भी उत्पाद पर टैप करें, विवरण देखें और इसे कार्ट में जोड़ें
5️⃣ जब आप खरीदने के लिए तैयार हों तो चेकआउट जारी रखें`,
      am: `📍 Go Shopping እንዴት ታገናኝ:

1️⃣ ከስክሪን ታች ያለውን **GoShopping** ታብ ይጫኑ
2️⃣ የፈለጉትን እቃዎች፣ ብራንድ ወይም ንግድ ለማግኘት የመፈለጊያን እስትንፋሽ ተጠቀሙ
3️⃣ ለዋጋ፣ አካባቢ እና ምድብ ማጣራት ይጥለዉ
4️⃣ ማንኛውንም ምርት ለዝርዝር እይታ ጫነዉ ወደ ካርት ያክሉ
5️⃣ ለግዝት ዝግጅት ሲሆን ወደ ቼክአውት ይቀጥሉ`,
    },
    quickActions: [
      {
        keywords: ['payment options', 'full payment', 'partial payment', 'pay in full', 'pay later', 'flexible payment', 'payment plan'],
        response: {
          en: '🛍️ **GoShopping Payment Options:**\n\nGoShopping supports both full payment and partial payment plans. You can pay the full amount at checkout, or choose a partial payment option where available and settle the rest later.\n\nFor fast self-checkout, choose items, add them to your cart, and pay directly. For NiSenti Transport-assisted shopping, choose items and ask for delivery support while still using full or partial payment at checkout.',
        }
      },
      {
        keywords: ['transport assisted', 'transport support', 'ni senti transport', 'delivery help', 'transport shopping'],
        response: {
          en: '📦 **GoShopping with NiSenti Transport:**\n\nYou can shop normally and then request NiSenti Transport support for pickup and delivery. This means NiSenti helps move the goods from the seller to your location.\n\nUse this option when you want delivery support, logistics help, or tracking assistance for your purchase.',
        }
      }
    ]
  },
  {
    id: 'comb',
    screen: 'COMB',
    keywords: ['comb', 'consume', 'bill', 'credit line', 'shopping', 'purchase'],
    description: {
      en: 'Consume On My Bill (COMB) is a credit product that allows you to shop now and pay your bill when it\'s due.',
      ar: 'الاستهلاك على فاتورتي (COMB) هو منتج ائتماني يسمح لك بالتسوق الآن ودفع فاتورتك عند استحقاقها.',
      zh: '"用我的账单消费"（COMB）是一种信用产品，允许您现在购物并在账单到期时支付。',
      ru: '"Потребляй по моему счету" (COMB) — это кредитный продукт, который позволяет вам делать покупки сейчас и платить счет при его наступлении.',
      sw: 'Tumia Kwenye Bili Yangu (COMB) ni bidhaa ya mkopo inayokupimia kushopping sasa na kulipa bili yako wakati inastahili.',
      fr: '"Consommer sur ma facture" (COMB) est un produit de crédit qui vous permet de faire des achats maintenant et de payer votre facture à l\'échéance.',
      es: '"Consumir en Mi Factura" (COMB) es un producto crediticio que te permite comprar ahora y pagar tu factura cuando vence.',
      de: '"Auf meiner Rechnung konsumieren" (COMB) ist ein Kreditprodukt, mit dem Sie jetzt einkaufen und Ihre Rechnung bei Fälligkeit bezahlen können.',
      pt: '"Consumir Na Minha Conta" (COMB) é um produto de crédito que permite fazer compras agora e pagar sua conta quando vencer.',
      it: '"Consuma sulla mia fattura" (COMB) è un prodotto di credito che ti consente di fare acquisti ora e pagare la tua fattura alla scadenza.',
      he: '"צרוך על החשבון שלי" (COMB) הוא מוצר אשראי המאפשר לך לקנות עכשיו ולשלם את החשבון שלך כשהוא יגיע לפקיעה.',
      hi: '"मेरे बिल पर खपत करें" (COMB) एक क्रेडिट उत्पाद है जो आपको अभी खरीदारी करने और अपना बिल देय होने पर भुगतान करने की अनुमति देता है।',
      am: '"በሪሪ ላይ ሀብት ብቀነስ" (COMB) ለ አሁን ሎክ ጁዝ ሒሳብ ወርሪ ሥዴ ምጥጥን ስላ ኢ-ብየ।'
    },
    benefits: {
      en: [
        'Flexible payment options',
        'Higher credit limits',
        'Rewards and cashback',
        'Bill consolidation',
        'Shop at multiple merchants'
      ],
      ar: [
        'خيارات الدفع المرنة',
        'حدود ائتمان أعلى',
        'المكافآت والاسترداد النقدي',
        'توحيد الفواتير',
        'التسوق من عدة تجار'
      ],
      zh: [
        '灵活的付款选项',
        '更高的信用限额',
        '奖励和现金返还',
        '账单合并',
        '在多个商户购物'
      ],
      ru: [
        'Гибкие варианты оплаты',
        'Более высокие кредитные лимиты',
        'Награды и кэшбэк',
        'Консолидация счетов',
        'Покупки у нескольких торговцев'
      ],
      sw: [
        'Chaguo la kulipwa linayobadilika',
        'Kiwango cha mkopo zaidi',
        'Tuzo na pesa nyuma',
        'Ujumuishaji wa bili',
        'Kushopping kwa wajuzi wengi'
      ],
      fr: [
        'Options de paiement flexibles',
        'Limites de crédit plus élevées',
        'Récompenses et remises en espèces',
        'Consolidation des factures',
        'Achats auprès de plusieurs commerçants'
      ],
      es: [
        'Opciones de pago flexible',
        'Límites de crédito más altos',
        'Recompensas y devolución de efectivo',
        'Consolidación de facturas',
        'Compras en múltiples comerciantes'
      ],
      de: [
        'Flexible Zahlungsmöglichkeiten',
        'Höhere Kreditlimits',
        'Belohnungen und Cashback',
        'Rechnungskonsolidierung',
        'Einkaufen bei mehreren Händlern'
      ],
      pt: [
        'Opções de pagamento flexíveis',
        'Limites de crédito mais altos',
        'Recompensas e dinheiro de volta',
        'Consolidação de contas',
        'Comprar em vários comerciantes'
      ],
      it: [
        'Opzioni di pagamento flessibili',
        'Limiti di credito più alti',
        'Premi e cashback',
        'Consolidamento delle fatture',
        'Acquisti presso più commercianti'
      ],
      he: [
        'אפשרויות תשלום גמישות',
        'מגבלות אשראי גבוהות יותר',
        'פרסים וחזרה למזומן',
        'איחוד חשבונות',
        'קניות אצל סוחרים מרובים'
      ],
      hi: [
        'लचकदार भुगतान विकल्प',
        'उच्च क्रेडिट सीमा',
        'पुरस्कार और कैशबैक',
        'बिल समेकन',
        'एकाधिक व्यापारियों पर खरीदारी'
      ],
      am: [
        'የ-ሚዬ ክፍል አማራጮች',
        'ከፍ ያለ ክሬዲት ገደቦች',
        'ሪወርዶች እና ገንዘብ መልሰው',
        'የሒሳብ ማጠቃለያ',
        'በብዙ ነጋዴዎች ከ'
      ]
    },
    aboutProduct: {
      en: 'COMB is a revolutionary buy-now-pay-later solution that empowers you to manage your shopping and finances better.',
      ar: 'COMB هو حل ثوري للشراء الآن والدفع لاحقا يمكنك من إدارة التسوق والمالية بشكل أفضل.',
      zh: 'COMB是一个革命性的先买后付解决方案，使您能够更好地管理购物和财务。',
      ru: 'COMB — это революционное решение «купи сейчас, оплати позже», которое позволяет вам лучше управлять своими покупками и финансами.',
      sw: 'COMB ni suluhisho la mapinduzi la kununua-sasa-kulipa-baadaye linalokupimia kusimamia kushopping na mali yako vizuri zaidi.',
      fr: 'COMB est une solution révolutionnaire d\'achat maintenant, paiement plus tard qui vous permet de mieux gérer vos achats et vos finances.',
      es: 'COMB es una solución revolucionaria de compra ahora pague después que te permite administrar mejor tus compras y finanzas.',
      de: 'COMB ist eine revolutionäre "Jetzt kaufen, später bezahlen"-Lösung, die es Ihnen ermöglicht, Ihre Einkäufe und Finanzen besser zu verwalten.',
      pt: 'COMB é uma solução revolucionária de compre agora, pague depois que permite gerenciar melhor suas compras e finanças.',
      it: 'COMB è una soluzione rivoluzionaria di acquista ora paghi dopo che ti consente di gestire meglio i tuoi acquisti e le tue finanze.',
      he: 'COMB היא פתרון מהפכני של קנה עכשיו שלם מאוחר יותר המאפשר לך לנהל את הקניות והכספים שלך בצורה טובה יותר.',
      hi: 'COMB एक क्रांतिकारी अभी खरीदें, बाद में भुगतान करें समाधान है जो आपको अपनी खरीदारी और वित्त को बेहतर तरीके से प्रबंधित करने की अनुमति देता है।',
      am: 'COMB ሐልዋ ወሰደ-ሐልዋ-ታወቀ-ወሰደ መፈታት ሥዴ ሐገርህ ሕይወት ተቆጣጣሪ እና ንግድ ትክክል ብለት ያነስ እንድትሰር ይችላል።'
    }
  },
  {
    id: 'transport',
    screen: 'Transport',
    keywords: ['transport', 'delivery', 'shipping', 'logistics', 'send', 'deliver', 'goods', 'package', 'courier', 'rider', 'driver', 'freight'],
    description: {
      en: 'Transport Services enable you to send goods and packages safely and reliably. Connect with drivers and couriers for fast deliveries.',
      ar: 'تتيح خدمات النقل لك إرسال البضائع والطرود بأمان وموثوقية. التواصل مع السائقين والرسل للتسليمات السريعة.',
      zh: '运输服务使您能够安全可靠地发送货物和包裹。与驾驶员和快递员联系以进行快速交付。',
      ru: 'Услуги транспорта позволяют вам безопасно и надежно отправлять товары и посылки. Свяжитесь с водителями и курьерами для быстрой доставки.',
      sw: 'Huduma za Transport zinakuwezesha kutuma bidhaa na paketi kwa salama na kwa kuaminika. Unganisha na wadereva na wapeleki kwa utoaji wa haraka.',
      fr: 'Les services de transport vous permettent d\'envoyer des marchandises et des colis en toute sécurité et de manière fiable. Connectez-vous avec des chauffeurs et des messagers pour les livraisons rapides.',
      es: 'Los servicios de transporte le permiten enviar mercancías y paquetes de manera segura y confiable. Conéctese con conductores y mensajeros para entregas rápidas.',
      de: 'Transportdienste ermöglichen es Ihnen, Waren und Pakete sicher und zuverlässig zu versenden. Verbinden Sie sich mit Fahrern und Kurieren für schnelle Lieferungen.',
      pt: 'Os serviços de transporte permitem que você envie mercadorias e pacotes com segurança e confiabilidade. Conecte-se com motoristas e mensageiros para entregas rápidas.',
      it: 'I servizi di trasporto ti permettono di inviare merci e pacchi in modo sicuro e affidabile. Connettiti con autisti e corrieri per consegne veloci.',
      he: 'שירותי הובלה מאפשרים לך לשלוח סחורה וחבילות בבטחה וביעילות. התחבר לנהגים ולשליחים להספקה מהירה.',
      hi: 'परिवहन सेवाएं आपको सामान और पैकेज सुरक्षित और विश्वसनीय रूप से भेजने में सक्षम बनाती हैं। तेजी से डिलीवरी के लिए चालकों और कूरियरों से जुड़ें।',
      am: 'የ Transport አገልግሎቶች ጤዳንነትና ስሙ ሐብት ተላልፏቸው ይቻላል። ለፍጥር ተላልፍ ከሾፌሩ ተላልፊዎች ጋር ያገናኙ።'
    },
    benefits: {
      en: [
        'Fast and reliable delivery',
        'Real-time tracking',
        'Affordable shipping rates',
        'Safe handling of goods',
        'Multiple delivery options',
        'Customer support 24/7'
      ],
      ar: [
        'التسليم السريع والموثوق',
        'التتبع في الوقت الفعلي',
        'أسعار الشحن الميسورة',
        'التعامل الآمن مع البضائع',
        'خيارات التسليم المتعددة',
        'دعم العملاء 24/7'
      ],
      zh: [
        '快速可靠的交付',
        '实时追踪',
        '价格实惠的运费',
        '安全处理货物',
        '多种送货选择',
        '24/7客户支持'
      ],
      ru: [
        'Быстрая и надежная доставка',
        'Отслеживание в реальном времени',
        'Доступные тарифы доставки',
        'Безопасная обработка товаров',
        'Несколько вариантов доставки',
        'Поддержка клиентов 24/7'
      ],
      sw: [
        'Utoaji wa haraka na wa kuaminika',
        'Uangalizi wa wakati halisi',
        'Viwango vya kumtakikisha vya nafuu',
        'Uangalizi salama wa bidhaa',
        'Chaguo za utoaji nyingi',
        'Msaada wa mteja 24/7'
      ],
      fr: [
        'Livraison rapide et fiable',
        'Suivi en temps réel',
        'Tarifs d\'expédition abordables',
        'Manipulation sécuritaire des marchandises',
        'Plusieurs options de livraison',
        'Support client 24/7'
      ],
      es: [
        'Entrega rápida y confiable',
        'Seguimiento en tiempo real',
        'Tarifas de envío asequibles',
        'Manejo seguro de mercancías',
        'Múltiples opciones de entrega',
        'Soporte al cliente 24/7'
      ],
      de: [
        'Schnelle und zuverlässige Lieferung',
        'Echtzeit-Tracking',
        'Erschwingliche Versandtarife',
        'Sichere Behandlung von Waren',
        'Mehrere Lieferoptionen',
        '24/7 Kundensupport'
      ],
      pt: [
        'Entrega rápida e confiável',
        'Rastreamento em tempo real',
        'Taxas de envio acessíveis',
        'Manuseio seguro de mercadorias',
        'Múltiplas opções de entrega',
        'Suporte ao cliente 24/7'
      ],
      it: [
        'Consegna veloce e affidabile',
        'Tracciamento in tempo reale',
        'Tariffe di spedizione convenienti',
        'Gestione sicura delle merci',
        'Più opzioni di consegna',
        'Supporto clienti 24/7'
      ],
      he: [
        'משלוח מהיר וויעיל',
        'עקוב בזמן אמת',
        'תעריפי משלוח סבירים',
        'טיפול בטוח בסחורה',
        'אפשרויות משלוח מרובות',
        'תמיכת לקוח 24/7'
      ],
      hi: [
        'तेज और विश्वसनीय डिलीवरी',
        'रीयल-टाइम ट्रैकिंग',
        'सस्ती शिपिंग दरें',
        'माल की सुरक्षित हैंडलिंग',
        'कई डिलीवरी विकल्प',
        '24/7 ग्राहक सहायता'
      ],
      am: [
        'ፍጥር እና ስሙ ተላልፍ',
        'በጊዜ ሪアल-タイムግለ',
        'ርካሪ የከፋል ዋጋ',
        'ማተልየኔ ሐብት ድምይ',
        'ብዙ ተላልፊ አማራጮች',
        '24/7 ደምዎ ደጋፍ'
      ]
    },
    aboutProduct: {
      en: 'Transport Services connect senders and riders to deliver packages efficiently. Whether you need to send goods locally or to other regions, our service ensures fast, safe, and affordable delivery.',
      ar: 'تربط خدمات النقل المرسلين والدراجين لتسليم الطرود بكفاءة. سواء كنت بحاجة لإرسال بضائع محليا أو إلى مناطق أخرى، فإن خدمتنا تضمن تسليما سريعا وآمنا وبأسعار معقولة.',
      zh: '运输服务将发件人和骑手联系起来以有效地交付包裹。无论您需要在本地发送商品还是在其他地区，我们的服务都能确保快速、安全和经济的交付。',
      ru: 'Услуги транспорта связывают отправителей и райдеров для эффективной доставки посылок. Независимо от того, нужно ли вам отправлять товары местно или в другие регионы, наша служба обеспечивает быструю, безопасную и экономичную доставку.',
      sw: 'Huduma za Transport zinaunganisha watuma na wajapiga kupeleka paketi kwa ufanisi. Haijalishi iwapo unahitaji kutuma bidhaa nchi au kwa maeneo mengine, huduma yetu inahakikisha utoaji wa haraka, salama, na nafuu.',
      fr: 'Les services de transport relient les expéditeurs et les courriers pour livrer efficacement les colis. Que vous ayez besoin d\'envoyer des marchandises localement ou dans d\'autres régions, notre service assure une livraison rapide, sûre et abordable.',
      es: 'Los servicios de transporte conectan remitentes y mensajeros para entregar paquetes de manera eficiente. Ya sea que necesite enviar mercancías localmente o a otras regiones, nuestro servicio garantiza una entrega rápida, segura y asequible.',
      de: 'Transportdienste verbinden Absender und Kuriere, um Pakete effizient zu liefern. Egal ob Sie Waren lokal oder in andere Regionen versenden möchten, unser Service garantiert eine schnelle, sichere und kostengünstige Lieferung.',
      pt: 'Os serviços de transporte conectam remetentes e mensageiros para entregar pacotes com eficiência. Quer você precise enviar mercadorias localmente ou para outras regiões, nosso serviço garante entrega rápida, segura e acessível.',
      it: 'I servizi di trasporto collegano mittenti e corrieri per consegnare pacchi in modo efficiente. Sia che tu abbia bisogno di inviare merci localmente o in altre regioni, il nostro servizio garantisce una consegna veloce, sicura e conveniente.',
      he: 'שירותי הובלה מחברים משלחים וראשי עבודה להספקת חבילות בצורה יעילה. בין אם אתה צריך לשלוח סחורה בעירה או לאזורים אחרים, השירות שלנו מבטיח משלוח מהיר, בטוח וסביר.',
      hi: 'परिवहन सेवाएं पैकेज को कुशलतापूर्वक डिलीवर करने के लिए प्रेषकों और सवारों को जोड़ती हैं। चाहे आपको सामान स्थानीय रूप से भेजने की जरूरत हो या अन्य क्षेत्रों में, हमारी सेवा तेजी से, सुरक्षित और सस्ती डिलीवरी सुनिश्चित करती है।',
      am: 'Transport አገልግሎት ከኮንሰር ሾፌሮች ጋር ደቆቅ ከለዎ ይቀጣጠልሉ። በአከባቢ ወይም በሌላ ክልሎች ለመላክ ሞኞ ሌኖ ወቅት፣ ሞኞቻቸው አገልግሎት ፍጥር፣ ስሙ ፣ ና ርካሪ መላክን ያወሰዱ።'
    },
    howToAccess: {
      en: '📍 How to access Transport in NiSenti:\n\n1️⃣ Tap the **Transport** tab in the bottom navigation bar\n2️⃣ The Transport screen opens with clearly labeled buttons for each flow:\n   • **Register Transport - Transporter**\n   • **Register Transport - Company**\n   • **View Transport Company Account**\n   • **Ask for Transport - Buyer**\n   • **View Transport Requests to: Accept, Offload Delivery - Transporter**\n   • **View Transport Requests to: Receive Delivery, Cancel Delivery Request, change delivery Location - Buyer**\n   • **View Transport Requests to: Dispatch Delivery - Seller**\n   • **Customer/Passenger**\n   • **Rider**\n3️⃣ Tap the button that matches your role and the action you need.\n\nIf you want to create a new transporter profile, use the **Register Transport - Transporter** button. If you need a delivery as a buyer, use **Ask for Transport - Buyer**. Sellers who need to dispatch orders should use **View Transport Requests to: Dispatch Delivery - Seller**.',
    },
    quickActions: [
      {
        keywords: ['register transporter', 'register transport', 'become transporter', 'transport registration', 'register as transporter'],
        response: {
          en: '🚚 **Register Transport - Transporter**\n\nTo become a transporter, open the **Transport** tab and tap the **Register Transport - Transporter** button. This creates your transporter profile so you can accept transport jobs and delivery requests.'
        }
      },
      {
        keywords: ['ask for transport', 'request transport', 'need transport', 'transport request', 'transport buyer'],
        response: {
          en: '📦 **Ask for Transport - Buyer**\n\nTo request transport as a buyer, open the **Transport** tab and tap the **Ask for Transport - Buyer** button. Fill in your order details and the app will connect you with transport support.'
        }
      },
      {
        keywords: ['accept transport request', 'offload delivery', 'transport accept', 'accept delivery', 'accept request'],
        response: {
          en: '✔️ **View Transport Requests to: Accept, Offload Delivery - Transporter**\n\nIf you are a transporter, open the **Transport** tab and tap the **View Transport Requests to: Accept, Offload Delivery - Transporter** button. This shows active requests you can accept and manage.'
        }
      },
      {
        keywords: ['receive delivery', 'cancel delivery request', 'change delivery location', 'buyer transport requests', 'receive transport'],
        response: {
          en: '📥 **View Transport Requests to: Receive Delivery, Cancel Delivery Request, change delivery Location - Buyer**\n\nIf you are the buyer, open the **Transport** tab and tap **View Transport Requests to: Receive Delivery, Cancel Delivery Request, change delivery Location - Buyer**. Use this screen to manage your incoming deliveries.'
        }
      },
      {
        keywords: ['dispatch delivery', 'seller transport requests', 'dispatch request', 'transport dispatch'],
        response: {
          en: '📤 **View Transport Requests to: Dispatch Delivery - Seller**\n\nIf you are selling goods, open the **Transport** tab and tap **View Transport Requests to: Dispatch Delivery - Seller**. This lets you send deliveries and confirm dispatch status.'
        }
      },
      {
        keywords: ['customer passenger', 'passenger request', 'customer ride', 'passenger transport'],
        response: {
          en: '🧑‍🤝‍🧑 **Customer/Passenger**\n\nOpen the **Transport** tab and tap the **Customer/Passenger** button when you need passenger transport services or want to request a ride.'
        }
      },
      {
        keywords: ['rider', 'driver', 'become rider', 'ride driver'],
        response: {
          en: '🛵 **Rider**\n\nOpen the **Transport** tab and tap the **Rider** button if you are a driver looking to accept passenger or delivery jobs.'
        }
      }
    ]
  },
  {
    id: 'nsndogo-agent',
    screen: 'NSNdogo',
    keywords: ['nsndogo', 'ndogo', 'agent', 'deposit', 'withdraw', 'e-wallet', 'ewallet', 'cash in', 'cash out', 'mobile wallet', 'float', 'nisenti agent', 'physical agent', 'find agent', 'nearest agent'],
    description: {
      en: 'NSNdogo is the NiSenti Agent network — physical agents in your community who help you deposit and withdraw money from your e-wallet.',
      ar: 'NSNdogo هي شبكة وكلاء NiSenti — وكلاء ماديون في مجتمعك يساعدونك في إيداع وسحب الأموال من محفظتك الإلكترونية.',
      zh: 'NSNdogo是NiSenti代理网络——社区中的实体代理，帮助您在电子钱包中存款和提款。',
      ru: 'NSNdogo — это сеть агентов NiSenti — физические агенты в вашем сообществе, которые помогают вам вносить и снимать деньги с вашего электронного кошелька.',
      sw: 'NSNdogo ni mtandao wa Mawakala wa NiSenti — mawakala wa kimwili katika jamii yako wanaokusaidia kuweka na kutoa pesa kutoka kwa pochi yako ya kielektroniki.',
      fr: 'NSNdogo est le réseau d\'agents NiSenti — des agents physiques dans votre communauté qui vous aident à déposer et retirer de l\'argent de votre portefeuille électronique.',
      es: 'NSNdogo es la red de agentes NiSenti — agentes físicos en tu comunidad que te ayudan a depositar y retirar dinero de tu billetera electrónica.',
      de: 'NSNdogo ist das NiSenti-Agentennetzwerk — physische Agenten in Ihrer Gemeinschaft, die Ihnen helfen, Geld in Ihre elektronische Geldbörse einzuzahlen und abzuheben.',
      pt: 'NSNdogo é a rede de agentes NiSenti — agentes físicos em sua comunidade que ajudam você a depositar e retirar dinheiro de sua carteira eletrônica.',
      it: 'NSNdogo è la rete di agenti NiSenti — agenti fisici nella tua comunità che ti aiutano a depositare e prelevare denaro dal tuo portafoglio elettronico.',
      he: 'NSNdogo היא רשת הסוכנים של NiSenti — סוכנים פיזיים בקהילה שלך שעוזרים לך להפקיד ולמשוך כסף מהארנק האלקטרוני שלך.',
      hi: 'NSNdogo NiSenti एजेंट नेटवर्क है — आपके समुदाय में भौतिक एजेंट जो आपको आपके ई-वॉलेट में पैसे जमा करने और निकालने में मदद करते हैं।',
      am: 'NSNdogo የNiSenti ወኪሎች አውታር ነው — በማህበረሰብዎ ውስጥ ያሉ ኤሌክትሮኒክ 财布ዎ ላይ ገንዘብ ለማስቀመጥ እና ለማውጣት የሚረዱ የኢ-ወኪሎች።'
    },
    benefits: {
      en: [
        'Deposit cash into your e-wallet through a local agent',
        'Withdraw cash from your e-wallet at any NSNdogo agent',
        'Find the nearest agent on a live map',
        'Group, business and transport deposits supported',
        'Agents earn commission on every transaction'
      ],
      sw: [
        'Weka pesa taslimu kwenye pochi yako ya kielektroniki kupitia wakala wa karibu',
        'Toa pesa taslimu kutoka kwa pochi yako ya kielektroniki kwa wakala yoyote wa NSNdogo',
        'Pata wakala wa karibu kwenye ramani ya moja kwa moja',
        'Amana za kikundi, biashara na usafirishaji zinasaidiwa',
        'Mawakala hupata kamisheni kwa kila muamala'
      ],
      fr: ['Déposer des espèces dans votre e-wallet via un agent local', 'Retirer des espèces de votre e-wallet chez n\'importe quel agent NSNdogo', 'Trouver l\'agent le plus proche sur une carte en direct', 'Dépôts pour groupes, entreprises et transport pris en charge', 'Les agents gagnent une commission sur chaque transaction'],
      es: ['Depositar efectivo en tu billetera electrónica a través de un agente local', 'Retirar efectivo de tu billetera en cualquier agente NSNdogo', 'Encontrar el agente más cercano en un mapa en vivo', 'Depósitos para grupos, negocios y transporte admitidos', 'Los agentes ganan comisión por cada transacción'],
      de: ['Bargeld über einen lokalen Agenten in Ihre e-Wallet einzahlen', 'Bargeld von Ihrer e-Wallet bei einem NSNdogo-Agenten abheben', 'Nächsten Agenten auf einer Live-Karte finden', 'Gruppen-, Geschäfts- und Transporteinzahlungen unterstützt', 'Agenten verdienen Provision bei jeder Transaktion'],
      zh: ['通过当地代理向电子钱包存入现金', '在任何NSNdogo代理处从电子钱包提取现金', '在实时地图上找到最近的代理', '支持群组、业务和运输存款', '代理在每笔交易中赚取佣金'],
      ru: ['Внесение наличных в ваш электронный кошелёк через местного агента', 'Снятие наличных с вашего электронного кошелька у любого агента NSNdogo', 'Поиск ближайшего агента на интерактивной карте', 'Поддержка групповых, деловых и транспортных депозитов', 'Агенты зарабатывают комиссию с каждой транзакции'],
      pt: ['Depositar dinheiro na sua carteira eletrônica através de um agente local', 'Retirar dinheiro da sua carteira em qualquer agente NSNdogo', 'Encontrar o agente mais próximo em um mapa ao vivo', 'Depósitos para grupos, empresas e transporte suportados', 'Agentes ganham comissão em cada transação'],
      it: ['Depositare contanti nel tuo e-wallet tramite un agente locale', 'Prelevare contanti dal tuo e-wallet presso qualsiasi agente NSNdogo', 'Trovare l\'agente più vicino su una mappa in tempo reale', 'Depositi per gruppi, aziende e trasporti supportati', 'Gli agenti guadagnano commissioni su ogni transazione'],
      he: ['הפקדת מזומן לארנק האלקטרוני שלך דרך סוכן מקומי', 'משיכת מזומן מהארנק האלקטרוני שלך בכל סוכן NSNdogo', 'מציאת הסוכן הקרוב ביותר במפה חיה', 'תמיכה בהפקדות לקבוצות, עסקים ותחבורה', 'הסוכנים מרוויחים עמלה על כל עסקה'],
      hi: ['स्थानीय एजेंट के माध्यम से अपने ई-वॉलेट में नकद जमा करें', 'किसी भी NSNdogo एजेंट पर अपने ई-वॉलेट से नकद निकालें', 'लाइव मैप पर निकटतम एजेंट खोजें', 'समूह, व्यवसाय और परिवहन जमा समर्थित', 'एजेंट प्रत्येक लेनदेन पर कमीशन कमाते हैं'],
      am: ['በአካባቢ ወኪል ኤ-財布ዎ ላይ ጥሬ ገንዘብ ያስቀምጡ', 'ከማንኛውም NSNdogo ወኪል ጋር ጥሬ ገንዘብ ያውጡ', 'በቀጥታ ካርታ ላይ ቅርብ ወኪል ይፈልጉ', 'ቡድን፣ ንግድ እና ትራንስፖርት ተቀማጭ ተደግፏል', 'ወኪሎች በእያንዳንዱ ግብይት ኮሚሽን ያገኛሉ']
    },
    aboutProduct: {
      en: 'NSNdogo agents are registered community members who carry float (electronic balance) and serve as cash-in/cash-out points for NiSenti users. Find one near you on the map and transact in person.',
      sw: 'Mawakala wa NSNdogo ni wanachama wa jamii waliosajiliwa wanaobeba float (salio la kielektroniki) na kutumika kama vituo vya kuweka/kutoa pesa kwa watumiaji wa NiSenti.',
      fr: 'Les agents NSNdogo sont des membres de la communauté enregistrés qui portent du float et servent de points de dépôt/retrait pour les utilisateurs NiSenti.',
      es: 'Los agentes NSNdogo son miembros registrados de la comunidad que llevan float y sirven como puntos de depósito/retiro para los usuarios de NiSenti.',
      de: 'NSNdogo-Agenten sind registrierte Gemeinschaftsmitglieder, die Float tragen und als Ein-/Auszahlungspunkte für NiSenti-Nutzer dienen.',
      zh: 'NSNdogo代理是持有浮动余额并作为NiSenti用户存款/取款点的注册社区成员。',
      ru: 'Агенты NSNdogo — это зарегистрированные члены сообщества, которые несут флоат и служат точками ввода/вывода для пользователей NiSenti.',
      pt: 'Os agentes NSNdogo são membros registrados da comunidade que carregam float e servem como pontos de depósito/retirada para usuários NiSenti.',
      it: 'Gli agenti NSNdogo sono membri registrati della comunità che portano float e servono come punti di deposito/prelievo per gli utenti NiSenti.',
      he: 'סוכני NSNdogo הם חברים רשומים בקהילה שנושאים float ומשמשים כנקודות הפקדה/משיכה עבור משתמשי NiSenti.',
      hi: 'NSNdogo एजेंट पंजीकृत सामुदायिक सदस्य हैं जो फ्लोट (इलेक्ट्रॉनिक बैलेंस) रखते हैं और NiSenti उपयोगकर्ताओं के लिए नकद-इन/नकद-आउट बिंदु के रूप में काम करते हैं।',
      am: 'NSNdogo ወኪሎች float (ኤሌክትሮኒክ ሂሳብ) ያሏቸው እና ለNiSenti ተጠቃሚዎች ጥሬ ገንዘብ-ግቢ/ጥሬ ገንዘብ-ወጭ ቦታ ሆነው የሚያገለግሉ የተመዘገቡ ማህበረሰብ አባላት ናቸው።'
    },
    howToAccess: {
      en: '📍 How to access NSNdogo Agent services:\n\n**Option 1 — Find an agent (Map):**\nTap the **"NSNdogo"** tab in the bottom navigation bar → a live map loads showing all nearby agents. Adjust the radius to expand your search.\n\n**Option 2 — Agent operations (Drawer):**\nTap the ☰ menu icon → select **"NiSenti Ndogos"** → the full agent screen opens with:\n\n📌 **View** — Deposit records, Float bought, NSNdogo Withdrawals, Client Withdrawals, Float Withdrawals\n📌 **My Account** — Update Account, View Account, Create Account (register as agent)\n📌 **Float** — User Deposit, Chama Deposit, Biz Deposit, Transport Biz Deposit, View Deposits/Withdrawals, NSNdogo Withdraw\n📌 **Earnings** — Withdraw earnings, Update Commission',
      sw: '📍 Jinsi ya kufikia huduma za Wakala wa NSNdogo:\n\n**Chaguo 1 — Tafuta wakala (Ramani):**\nBonyeza kichupo **"NSNdogo"** katika baa ya urambazaji ya chini → ramani ya moja kwa moja inaonyesha mawakala wote wa karibu.\n\n**Chaguo 2 — Shughuli za wakala (Droo):**\nBonyeza ikoni ☰ → chagua **"NiSenti Ndogos"** → skrini kamili ya wakala inafunguka.',
      fr: '📍 Comment accéder aux services NSNdogo:\n\n**Option 1 — Trouver un agent (Carte):**\nAppuyez sur l\'onglet **"NSNdogo"** dans la barre de navigation → une carte en direct montre tous les agents proches.\n\n**Option 2 — Opérations (Menu):**\nMenu ☰ → **"NiSenti Ndogos"** → l\'écran complet s\'ouvre.',
      es: '📍 Cómo acceder a los servicios NSNdogo:\n\n**Opción 1 — Encontrar agente (Mapa):**\nToca la pestaña **"NSNdogo"** en la barra de navegación → mapa en vivo con agentes cercanos.\n\n**Opción 2 — Operaciones (Menú):**\nIcono ☰ → **"NiSenti Ndogos"** → pantalla completa del agente.',
      de: '📍 Wie Sie auf NSNdogo-Agent-Dienste zugreifen:\n\n**Option 1 — Agent finden (Karte):**\nTab **"NSNdogo"** unten tippen → Live-Karte mit nahegelegenen Agenten.\n\n**Option 2 — Operationen (Menü):**\n☰ Menü → **"NiSenti Ndogos"** → vollständiger Agentenbildschirm.',
      zh: '📍 如何访问NSNdogo代理服务:\n\n**选项1 — 查找代理（地图）:**\n点击底部导航栏的 **"NSNdogo"** 选项卡 → 实时地图显示所有附近的代理。\n\n**选项2 — 代理操作（抽屉）:**\n菜单 ☰ → **"NiSenti Ndogos"** → 完整代理屏幕打开。',
      ru: '📍 Как получить доступ к услугам агента NSNdogo:\n\n**Вариант 1 — Найти агента (Карта):**\nНажмите вкладку **"NSNdogo"** в нижней навигации → загружается интерактивная карта с ближайшими агентами.\n\n**Вариант 2 — Операции (Меню):**\nМеню ☰ → **"NiSenti Ndogos"** → открывается полный экран агента.',
      pt: '📍 Como acessar os serviços NSNdogo:\n\n**Opção 1 — Encontrar agente (Mapa):**\nToque na aba **"NSNdogo"** na barra de navegação → mapa ao vivo com agentes próximos.\n\n**Opção 2 — Operações (Menu):**\nMenu ☰ → **"NiSenti Ndogos"** → tela completa do agente.',
      it: '📍 Come accedere ai servizi NSNdogo:\n\n**Opzione 1 — Trovare un agente (Mappa):**\nTocca la scheda **"NSNdogo"** nella barra di navigazione → mappa in tempo reale con agenti vicini.\n\n**Opzione 2 — Operazioni (Menu):**\nMenu ☰ → **"NiSenti Ndogos"** → schermata completa dell\'agente.',
      he: '📍 כיצד לגשת לשירותי סוכן NSNdogo:\n\n**אפשרות 1 — מצא סוכן (מפה):**\nהקש על הכרטיסייה **"NSNdogo"** בסרגל הניווט → מפה חיה עם כל הסוכנים הקרובים.\n\n**אפשרות 2 — פעולות (תפריט):**\nתפריט ☰ → **"NiSenti Ndogos"** → מסך הסוכן המלא נפתח.',
      hi: '📍 NSNdogo एजेंट सेवाओं तक कैसे पहुंचें:\n\n**विकल्प 1 — एजेंट खोजें (मैप):**\nनीचे नेविगेशन बार में **"NSNdogo"** टैब टैप करें → लाइव मैप सभी निकटवर्ती एजेंटों को दिखाता है।\n\n**विकल्प 2 — एजेंट संचालन (ड्रॉअर):**\nमेनू ☰ → **"NiSenti Ndogos"** → पूर्ण एजेंट स्क्रीन खुलती है।',
      am: '📍 NSNdogo ወኪሎች አገልግሎቶች እንዴት ማግኘት:\n\n**አማራጭ 1 — ወኪል ፈልጉ (ካርታ):**\nታችኛው ናቪጌሽን ላይ **"NSNdogo"** ትሎ ይጫኑ → ቅርብ ወኪሎች ሁሉ የሚታዩ ቀጥታ ካርታ ይከፈታል።\n\n**አማራጭ 2 — ወኪሎ ስራዎች (ሳጥን):**\nምናሌ ☰ → **"NiSenti Ndogos"** → ሙሉ ወኪሎ ስክሪን ይከፈታል።'
    },
    quickActions: [
      {
        keywords: ['deposit money', 'deposit cash', 'add money to wallet', 'cash in', 'top up wallet', 'deposit into ewallet', 'put money in wallet', 'deposit at agent'],
        response: {
          en: '📍 **How to deposit money into your e-wallet:**\n\n**Step 1 — Find an NSNdogo agent near you:**\n1️⃣ Tap the **"NSNdogo"** tab at the bottom of the screen\n2️⃣ A live map opens — find an agent close to you (adjust radius if needed)\n3️⃣ Note the agent\'s phone number from their profile card\n\n**Step 2 — Go to the deposit screen:**\n1️⃣ Tap the ☰ menu → **"NiSenti Ndogos"**\n2️⃣ Under **"Float"**, tap **"User Deposit"**\n3️⃣ Enter:\n   • **Agent Phone** — the agent\'s contact number\n   • **Amount** — how much you want to deposit\n4️⃣ Tap **Submit**\n\n⚠️ **Important:** You must be **within 300 metres** of the agent. The app uses your GPS to verify this — if you are too far, the deposit will be rejected.\n\n💡 The agent physically receives your cash and credits your e-wallet.',
          sw: '📍 **Jinsi ya kuweka pesa kwenye pochi yako ya kielektroniki:**\n\n**Hatua ya 1 — Tafuta wakala wa NSNdogo karibu nawe:**\n1️⃣ Bonyeza kichupo **"NSNdogo"** chini ya skrini\n2️⃣ Ramani ya moja kwa moja inafunguka — tafuta wakala karibu nawe\n3️⃣ Kumbuka nambari ya simu ya wakala kutoka kwenye kadi yake\n\n**Hatua ya 2 — Nenda kwenye skrini ya amana:**\n1️⃣ Bonyeza ☰ menyu → **"NiSenti Ndogos"**\n2️⃣ Chini ya **"Float"**, bonyeza **"User Deposit"**\n3️⃣ Ingiza:\n   • **Simu ya Wakala** — nambari ya mawasiliano ya wakala\n   • **Kiasi** — kiasi unachotaka kuweka\n4️⃣ Bonyeza **Wasilisha**\n\n⚠️ **Muhimu:** Lazima uwe **ndani ya mita 300** ya wakala. Programu inatumia GPS yako kuthibitisha hili.',
          fr: '📍 **Comment déposer de l\'argent dans votre e-wallet:**\n\n**Étape 1 — Trouver un agent NSNdogo près de vous:**\n1️⃣ Appuyez sur l\'onglet **"NSNdogo"** en bas de l\'écran\n2️⃣ Une carte en direct s\'ouvre — trouvez un agent proche\n3️⃣ Notez le numéro de téléphone de l\'agent\n\n**Étape 2 — Aller à l\'écran de dépôt:**\n1️⃣ Menu ☰ → **"NiSenti Ndogos"**\n2️⃣ Sous **"Float"**, appuyez sur **"User Deposit"**\n3️⃣ Remplissez le téléphone de l\'agent et le montant\n4️⃣ Soumettez\n\n⚠️ Vous devez être à **moins de 300 mètres** de l\'agent. Le GPS est vérifié automatiquement.',
          es: '📍 **Cómo depositar dinero en tu billetera electrónica:**\n\n**Paso 1 — Encontrar un agente NSNdogo:**\n1️⃣ Toca la pestaña **"NSNdogo"** en la parte inferior\n2️⃣ Se abre un mapa en vivo — encuentra un agente cercano\n3️⃣ Anota el número de teléfono del agente\n\n**Paso 2 — Ir a la pantalla de depósito:**\n1️⃣ Menú ☰ → **"NiSenti Ndogos"**\n2️⃣ En **"Float"**, toca **"User Deposit"**\n3️⃣ Ingresa el teléfono del agente y el monto\n4️⃣ Envía\n\n⚠️ Debes estar a **menos de 300 metros** del agente. El GPS lo verifica.',
          de: '📍 **Wie man Geld in die e-Wallet einzahlt:**\n\n**Schritt 1 — NSNdogo-Agent finden:**\n1️⃣ Tab **"NSNdogo"** unten tippen\n2️⃣ Live-Karte öffnet sich — nahen Agenten finden\n3️⃣ Telefonnummer des Agenten notieren\n\n**Schritt 2 — Zur Einzahlungsmaske:**\n1️⃣ Menü ☰ → **"NiSenti Ndogos"**\n2️⃣ Unter **"Float"** → **"User Deposit"** tippen\n3️⃣ Agententelefon und Betrag eingeben\n4️⃣ Absenden\n\n⚠️ Sie müssen **innerhalb von 300 Metern** vom Agenten sein. GPS wird geprüft.',
          zh: '📍 **如何向电子钱包存款:**\n\n**第1步 — 找到附近的NSNdogo代理:**\n1️⃣ 点击屏幕底部的 **"NSNdogo"** 选项卡\n2️⃣ 实时地图打开 — 找到附近的代理\n3️⃣ 记下代理的电话号码\n\n**第2步 — 进入存款页面:**\n1️⃣ 菜单 ☰ → **"NiSenti Ndogos"**\n2️⃣ 在 **"Float"** 下，点击 **"User Deposit"**\n3️⃣ 输入代理电话和金额\n4️⃣ 提交\n\n⚠️ 您必须在代理的 **300米以内**。GPS将自动验证。',
          ru: '📍 **Как пополнить электронный кошелёк:**\n\n**Шаг 1 — Найти агента NSNdogo:**\n1️⃣ Нажмите вкладку **"NSNdogo"** внизу экрана\n2️⃣ Открывается карта — найдите ближайшего агента\n3️⃣ Запишите номер телефона агента\n\n**Шаг 2 — Экран депозита:**\n1️⃣ Меню ☰ → **"NiSenti Ndogos"**\n2️⃣ В разделе **"Float"** → **"User Deposit"**\n3️⃣ Введите телефон агента и сумму\n4️⃣ Отправьте\n\n⚠️ Вы должны быть **в пределах 300 метров** от агента. GPS проверяется автоматически.',
          pt: '📍 **Como depositar dinheiro na carteira eletrônica:**\n\n**Passo 1 — Encontrar agente NSNdogo:**\n1️⃣ Toque na aba **"NSNdogo"** na parte inferior\n2️⃣ Mapa ao vivo abre — encontre um agente próximo\n3️⃣ Anote o telefone do agente\n\n**Passo 2 — Tela de depósito:**\n1️⃣ Menu ☰ → **"NiSenti Ndogos"**\n2️⃣ Em **"Float"** → **"User Deposit"**\n3️⃣ Insira telefone do agente e valor\n4️⃣ Envie\n\n⚠️ Você deve estar a **300 metros** do agente. O GPS verifica automaticamente.',
          it: '📍 **Come depositare denaro nell\'e-wallet:**\n\n**Passo 1 — Trovare un agente NSNdogo:**\n1️⃣ Tocca la scheda **"NSNdogo"** in fondo allo schermo\n2️⃣ La mappa in tempo reale si apre — trova un agente vicino\n3️⃣ Annota il numero di telefono dell\'agente\n\n**Passo 2 — Schermata di deposito:**\n1️⃣ Menu ☰ → **"NiSenti Ndogos"**\n2️⃣ Sotto **"Float"** → **"User Deposit"**\n3️⃣ Inserisci telefono agente e importo\n4️⃣ Invia\n\n⚠️ Devi essere entro **300 metri** dall\'agente. Il GPS viene verificato.',
          he: '📍 **כיצד להפקיד כסף בארנק האלקטרוני:**\n\n**שלב 1 — מצא סוכן NSNdogo:**\n1️⃣ הקש על כרטיסיית **"NSNdogo"** בתחתית המסך\n2️⃣ מפה חיה נפתחת — מצא סוכן קרוב\n3️⃣ רשום את מספר הטלפון של הסוכן\n\n**שלב 2 — מסך הפקדה:**\n1️⃣ תפריט ☰ → **"NiSenti Ndogos"**\n2️⃣ תחת **"Float"** → **"User Deposit"**\n3️⃣ הזן טלפון סוכן וסכום\n4️⃣ שלח\n\n⚠️ עליך להיות **בתוך 300 מטר** מהסוכן. ה-GPS מאומת אוטומטית.',
          hi: '📍 **ई-वॉलेट में पैसे कैसे जमा करें:**\n\n**चरण 1 — NSNdogo एजेंट खोजें:**\n1️⃣ स्क्रीन के नीचे **"NSNdogo"** टैब टैप करें\n2️⃣ लाइव मैप खुलता है — पास का एजेंट खोजें\n3️⃣ एजेंट का फोन नंबर नोट करें\n\n**चरण 2 — जमा स्क्रीन:**\n1️⃣ मेनू ☰ → **"NiSenti Ndogos"**\n2️⃣ **"Float"** के तहत → **"User Deposit"**\n3️⃣ एजेंट फोन और राशि दर्ज करें\n4️⃣ सबमिट करें\n\n⚠️ आपको एजेंट से **300 मीटर के अंदर** होना चाहिए। GPS स्वचालित रूप से सत्यापित किया जाता है।',
          am: '📍 **ኤ-財布ዎ ላይ ገንዘብ እንዴት ያስቀምጡ:**\n\n**ደረጃ 1 — NSNdogo ወኪሎ ፈልጉ:**\n1️⃣ ስክሪን ታችኛ ክፍል **"NSNdogo"** ትሎ ይጫኑ\n2️⃣ ቀጥታ ካርታ ይከፈታል — ቅርብ ወኪሎ ፈልጉ\n3️⃣ የወኪሉ ስልክ ቁጥር ይፃፉ\n\n**ደረጃ 2 — የተቀማጭ ስክሪን:**\n1️⃣ ምናሌ ☰ → **"NiSenti Ndogos"**\n2️⃣ **"Float"** ስር → **"User Deposit"**\n3️⃣ የወኪሉ ስልክ እና መጠን ያስገቡ\n4️⃣ ያስገቡ\n\n⚠️ ከወኪሉ **300 ሜትር ውስጥ** መሆን አለቦት። GPS ራስ-ሰር ይረጋገጣል።'
        }
      },
      {
        keywords: ['withdraw money from wallet', 'cash out', 'withdraw from ewallet', 'withdraw at agent', 'take out money from wallet', 'withdraw cash'],
        response: {
          en: '📍 **How to withdraw money from your e-wallet at an NSNdogo agent:**\n\n1️⃣ First, **find an NSNdogo agent** — tap the **"NSNdogo"** bottom tab to see agents on the map\n2️⃣ Visit the agent physically\n3️⃣ Tap ☰ menu → **"NiSenti Ndogos"**\n4️⃣ Under **"Float"**, tap **"NSNdogo Withdraw"**\n5️⃣ Enter:\n   • **NSNdogo/Agent Phone** — the agent\'s phone number\n   • **Your Password** — your main account password\n   • **Amount** — how much you want to withdraw\n6️⃣ Confirm\n\n💡 The agent pays you out in cash. Your e-wallet balance is reduced accordingly.',
          sw: '📍 **Jinsi ya kutoa pesa kutoka kwa pochi yako ya kielektroniki:**\n\n1️⃣ Kwanza, **tafuta wakala wa NSNdogo** — bonyeza kichupo **"NSNdogo"** chini kuona mawakala kwenye ramani\n2️⃣ Tembelea wakala kibinafsi\n3️⃣ Bonyeza ☰ menyu → **"NiSenti Ndogos"**\n4️⃣ Chini ya **"Float"**, bonyeza **"NSNdogo Withdraw"**\n5️⃣ Ingiza:\n   • **Simu ya Wakala** — nambari ya simu ya wakala\n   • **Nenosiri lako** — nenosiri la akaunti yako kuu\n   • **Kiasi** — kiasi unachotaka kutoa\n6️⃣ Thibitisha\n\n💡 Wakala anakupa pesa taslimu. Salio la pochi yako la kielektroniki linapunguzwa.',
          fr: '📍 **Comment retirer de l\'argent de votre e-wallet chez un agent:**\n\n1️⃣ **Trouver un agent** — onglet **"NSNdogo"** en bas → carte des agents\n2️⃣ Rendez-vous chez l\'agent\n3️⃣ Menu ☰ → **"NiSenti Ndogos"**\n4️⃣ Sous **"Float"** → **"NSNdogo Withdraw"**\n5️⃣ Entrez: Téléphone agent, Votre mot de passe, Montant\n6️⃣ Confirmez\n\n💡 L\'agent vous paye en espèces. Votre solde e-wallet est réduit.',
          es: '📍 **Cómo retirar dinero de tu billetera electrónica:**\n\n1️⃣ **Encuentra un agente** — pestaña **"NSNdogo"** → mapa de agentes\n2️⃣ Visita al agente físicamente\n3️⃣ Menú ☰ → **"NiSenti Ndogos"**\n4️⃣ En **"Float"** → **"NSNdogo Withdraw"**\n5️⃣ Ingresa: Teléfono agente, Tu contraseña, Monto\n6️⃣ Confirma\n\n💡 El agente te paga en efectivo.',
          de: '📍 **Wie man Geld von der e-Wallet beim Agenten abhebt:**\n\n1️⃣ **Agent finden** — Tab **"NSNdogo"** → Agentenkarte\n2️⃣ Agenten persönlich aufsuchen\n3️⃣ Menü ☰ → **"NiSenti Ndogos"**\n4️⃣ Unter **"Float"** → **"NSNdogo Withdraw"**\n5️⃣ Eingeben: Agententelefon, Ihr Passwort, Betrag\n6️⃣ Bestätigen\n\n💡 Der Agent zahlt Ihnen Bargeld aus.',
          zh: '📍 **如何从电子钱包在代理处提款:**\n\n1️⃣ **找到代理** — **"NSNdogo"** 选项卡 → 代理地图\n2️⃣ 亲自拜访代理\n3️⃣ 菜单 ☰ → **"NiSenti Ndogos"**\n4️⃣ 在 **"Float"** 下 → **"NSNdogo Withdraw"**\n5️⃣ 输入：代理电话、您的密码、金额\n6️⃣ 确认\n\n💡 代理以现金支付给您。',
          ru: '📍 **Как снять деньги с электронного кошелька у агента:**\n\n1️⃣ **Найти агента** — вкладка **"NSNdogo"** → карта агентов\n2️⃣ Лично посетить агента\n3️⃣ Меню ☰ → **"NiSenti Ndogos"**\n4️⃣ В разделе **"Float"** → **"NSNdogo Withdraw"**\n5️⃣ Ввести: Телефон агента, Ваш пароль, Сумма\n6️⃣ Подтвердить\n\n💡 Агент выплачивает вам наличными.',
          pt: '📍 **Como retirar dinheiro da carteira eletrônica:**\n\n1️⃣ **Encontrar agente** — aba **"NSNdogo"** → mapa de agentes\n2️⃣ Visitar o agente pessoalmente\n3️⃣ Menu ☰ → **"NiSenti Ndogos"**\n4️⃣ Em **"Float"** → **"NSNdogo Withdraw"**\n5️⃣ Inserir: Telefone agente, Sua senha, Valor\n6️⃣ Confirmar\n\n💡 O agente paga em dinheiro.',
          it: '📍 **Come prelevare denaro dall\'e-wallet presso un agente:**\n\n1️⃣ **Trovare agente** — scheda **"NSNdogo"** → mappa agenti\n2️⃣ Visitare l\'agente di persona\n3️⃣ Menu ☰ → **"NiSenti Ndogos"**\n4️⃣ Sotto **"Float"** → **"NSNdogo Withdraw"**\n5️⃣ Inserire: Telefono agente, Tua password, Importo\n6️⃣ Confermare\n\n💡 L\'agente ti paga in contanti.',
          he: '📍 **כיצד למשוך כסף מהארנק האלקטרוני אצל סוכן:**\n\n1️⃣ **מצא סוכן** — כרטיסיית **"NSNdogo"** → מפת סוכנים\n2️⃣ בקר אצל הסוכן פיזית\n3️⃣ תפריט ☰ → **"NiSenti Ndogos"**\n4️⃣ תחת **"Float"** → **"NSNdogo Withdraw"**\n5️⃣ הזן: טלפון סוכן, הסיסמה שלך, סכום\n6️⃣ אשר\n\n💡 הסוכן משלם לך במזומן.',
          hi: '📍 **ई-वॉलेट से एजेंट पर पैसे कैसे निकालें:**\n\n1️⃣ **एजेंट खोजें** — **"NSNdogo"** टैब → एजेंट मैप\n2️⃣ एजेंट को व्यक्तिगत रूप से जाएं\n3️⃣ मेनू ☰ → **"NiSenti Ndogos"**\n4️⃣ **"Float"** के तहत → **"NSNdogo Withdraw"**\n5️⃣ दर्ज करें: एजेंट फोन, आपका पासवर्ड, राशि\n6️⃣ पुष्टि करें\n\n💡 एजेंट आपको नकद भुगतान करता है।',
          am: '📍 **ኤ-財布ዎ ከወኪሉ ላይ ገንዘብ እንዴት ያውጡ:**\n\n1️⃣ **ወኪሎ ፈልጉ** — **"NSNdogo"** ትሎ → የወኪሎ ካርታ\n2️⃣ ወኪሉን በአካል ይጎብኙ\n3️⃣ ምናሌ ☰ → **"NiSenti Ndogos"**\n4️⃣ **"Float"** ስር → **"NSNdogo Withdraw"**\n5️⃣ ያስገቡ: የወኪሉ ስልክ፣ የእርስዎ 암호፣ መጠን\n6️⃣ ያረጋግጡ\n\n💡 ወኪሉ ጥሬ ገንዘብ ይከፍልዎታል።'
        }
      },
      {
        keywords: ['find agent', 'find nsndogo', 'nearest agent', 'locate agent', 'agent near me', 'agent map', 'nsndogo near me'],
        response: {
          en: '📍 **How to find a nearby NSNdogo agent:**\n\n1️⃣ Tap the **"NSNdogo"** tab in the **bottom navigation bar** (map marker icon)\n2️⃣ The app loads a live map showing all registered NSNdogo agents near you\n3️⃣ Tap on any agent marker to see their details (name, phone, location)\n4️⃣ Adjust the **search radius** (default 25km) to find more or fewer agents\n5️⃣ The app can draw a route from your location to the selected agent\n\n💡 You can also search by town name to find agents in a specific area.',
          sw: '📍 **Jinsi ya kupata wakala wa NSNdogo karibu:**\n\n1️⃣ Bonyeza kichupo **"NSNdogo"** katika **baa ya urambazaji ya chini** (ikoni ya alama ya ramani)\n2️⃣ Programu inapakia ramani ya moja kwa moja inayoonyesha mawakala wote wa NSNdogo waliowekwa karibu nawe\n3️⃣ Gonga alama ya wakala yoyote kuona maelezo yake (jina, simu, eneo)\n4️⃣ Rekebisha **radi ya utafutaji** (chaguo-msingi 25km) ili kupata mawakala zaidi au chini\n5️⃣ Programu inaweza kuchora njia kutoka mahali pako hadi kwa wakala aliyechaguliwa',
          fr: '📍 **Comment trouver un agent NSNdogo proche:**\n\n1️⃣ Appuyez sur l\'onglet **"NSNdogo"** dans la barre de navigation inférieure\n2️⃣ Une carte en direct charge avec tous les agents proches\n3️⃣ Appuyez sur un marqueur d\'agent pour voir ses détails\n4️⃣ Ajustez le **rayon de recherche** (25km par défaut)\n5️⃣ L\'app peut tracer un itinéraire vers l\'agent sélectionné',
          es: '📍 **Cómo encontrar un agente NSNdogo cercano:**\n\n1️⃣ Toca la pestaña **"NSNdogo"** en la barra de navegación inferior\n2️⃣ Se carga un mapa en vivo con todos los agentes cercanos\n3️⃣ Toca cualquier marcador de agente para ver sus detalles\n4️⃣ Ajusta el **radio de búsqueda** (25km por defecto)\n5️⃣ La app puede trazar una ruta al agente seleccionado',
          de: '📍 **Wie man einen NSNdogo-Agenten in der Nähe findet:**\n\n1️⃣ Tab **"NSNdogo"** in der unteren Navigationsleiste tippen\n2️⃣ Live-Karte lädt mit allen nahegelegenen Agenten\n3️⃣ Auf Agentenmarkierung tippen für Details\n4️⃣ **Suchradius** anpassen (Standard 25km)\n5️⃣ App kann Route zum ausgewählten Agenten zeichnen',
          zh: '📍 **如何找到附近的NSNdogo代理:**\n\n1️⃣ 点击底部导航栏的 **"NSNdogo"** 选项卡\n2️⃣ 实时地图加载显示所有附近代理\n3️⃣ 点击任意代理标记查看详情\n4️⃣ 调整**搜索半径**（默认25公里）\n5️⃣ 应用可绘制到所选代理的路线',
          ru: '📍 **Как найти ближайшего агента NSNdogo:**\n\n1️⃣ Нажмите вкладку **"NSNdogo"** в нижней навигационной панели\n2️⃣ Загружается интерактивная карта со всеми ближайшими агентами\n3️⃣ Нажмите на маркер агента для просмотра деталей\n4️⃣ Настройте **радиус поиска** (по умолчанию 25 км)\n5️⃣ Приложение может проложить маршрут к агенту',
          pt: '📍 **Como encontrar um agente NSNdogo próximo:**\n\n1️⃣ Toque na aba **"NSNdogo"** na barra de navegação inferior\n2️⃣ Mapa ao vivo carrega com todos os agentes próximos\n3️⃣ Toque em qualquer marcador de agente para ver detalhes\n4️⃣ Ajuste o **raio de busca** (padrão 25km)\n5️⃣ O app pode traçar uma rota para o agente selecionado',
          it: '📍 **Come trovare un agente NSNdogo vicino:**\n\n1️⃣ Tocca la scheda **"NSNdogo"** nella barra di navigazione inferiore\n2️⃣ La mappa in tempo reale si carica con tutti gli agenti vicini\n3️⃣ Tocca qualsiasi marcatore agente per vedere i dettagli\n4️⃣ Regola il **raggio di ricerca** (predefinito 25km)\n5️⃣ L\'app può tracciare un percorso verso l\'agente selezionato',
          he: '📍 **כיצד למצוא סוכן NSNdogo קרוב:**\n\n1️⃣ הקש על כרטיסיית **"NSNdogo"** בסרגל הניווט התחתון\n2️⃣ מפה חיה נטענת עם כל הסוכנים הקרובים\n3️⃣ הקש על סמן סוכן כלשהו לפרטים\n4️⃣ התאם את **רדיוס החיפוש** (ברירת מחדל 25 ק"מ)\n5️⃣ האפליקציה יכולה לשרטט מסלול לסוכן הנבחר',
          hi: '📍 **पास का NSNdogo एजेंट कैसे खोजें:**\n\n1️⃣ नीचे नेविगेशन बार में **"NSNdogo"** टैब टैप करें\n2️⃣ सभी पास के एजेंटों के साथ लाइव मैप लोड होता है\n3️⃣ विवरण देखने के लिए किसी भी एजेंट मार्कर पर टैप करें\n4️⃣ **खोज त्रिज्या** समायोजित करें (डिफ़ॉल्ट 25km)\n5️⃣ ऐप चयनित एजेंट तक रूट बना सकता है',
          am: '📍 **ቅርብ NSNdogo ወኪሎ እንዴት ይፈልጉ:**\n\n1️⃣ ታችኛ ናቪጌሽን ላይ **"NSNdogo"** ትሎ ይጫኑ\n2️⃣ ሁሉም ቅርብ ወኪሎች ያሉ ቀጥታ ካርታ ይጫናል\n3️⃣ ዝርዝሮች ለማየት ወኪሎ ምልክት ይጫኑ\n4️⃣ **የፍለጋ ራዲየስ** ያስተካክሉ (ነባሪ 25ኪ.ሜ)\n5️⃣ ወደ ምርጡ ወኪሎ ዱካ ሊስልልዎ ይችላል'
        }
      },
      {
        keywords: ['become agent', 'register as agent', 'nsndogo agent registration', 'create nsndogo account', 'join nsndogo', 'nsndogo create account'],
        response: {
          en: '📍 **How to register as an NSNdogo Agent:**\n\n1️⃣ Tap ☰ menu → **"NiSenti Ndogos"**\n2️⃣ Under **"My Account"**, tap **"Create Ac"**\n3️⃣ Fill in the registration form:\n   • National ID\n   • Name & Phone Contact\n   • Email\n   • Password\n   • SA Registration Number (your supervising SAgent number)\n   • Bank Name & Bank Account Number\n   • Town name\n   • GPS coordinates (auto-captured)\n4️⃣ Submit\n\n💡 You need a **supervising SAgent number** to register. Contact your NiSenti regional supervisor to get one.',
          sw: '📍 **Jinsi ya kusajiliwa kama Wakala wa NSNdogo:**\n\n1️⃣ Bonyeza ☰ menyu → **"NiSenti Ndogos"**\n2️⃣ Chini ya **"Akaunti Yangu"**, bonyeza **"Unda Akaunti"**\n3️⃣ Jaza fomu ya usajili:\n   • Kitambulisho cha Taifa\n   • Jina & Nambari ya Simu\n   • Barua pepe\n   • Nenosiri\n   • Nambari ya Usajili wa SA (nambari ya SAgent wako msimamizi)\n   • Jina la Benki & Nambari ya Akaunti ya Benki\n   • Jina la mji\n   • Kuratibu za GPS (zinakusanywa kiotomatiki)\n4️⃣ Wasilisha\n\n💡 Unahitaji **nambari ya SAgent msimamizi** kusajili.',
          fr: '📍 **Comment s\'inscrire comme Agent NSNdogo:**\n\n1️⃣ Menu ☰ → **"NiSenti Ndogos"**\n2️⃣ Sous **"Mon compte"** → **"Créer un compte"**\n3️⃣ Remplissez: ID National, Nom & Téléphone, Email, Mot de passe, Numéro SA, Banque & Compte, Ville, GPS (auto)\n4️⃣ Soumettez\n\n💡 Vous avez besoin d\'un **numéro SAgent superviseur** pour vous inscrire.',
          es: '📍 **Cómo registrarse como Agente NSNdogo:**\n\n1️⃣ Menú ☰ → **"NiSenti Ndogos"**\n2️⃣ En **"Mi cuenta"** → **"Crear cuenta"**\n3️⃣ Completa: ID Nacional, Nombre y Teléfono, Email, Contraseña, Número SA, Banco y Cuenta, Ciudad, GPS (auto)\n4️⃣ Envía\n\n💡 Necesitas un **número SAgent supervisor** para registrarte.',
          de: '📍 **Wie man sich als NSNdogo-Agent registriert:**\n\n1️⃣ Menü ☰ → **"NiSenti Ndogos"**\n2️⃣ Unter **"Mein Konto"** → **"Konto erstellen"**\n3️⃣ Ausfüllen: Nationalausweis, Name & Telefon, E-Mail, Passwort, SA-Nummer, Bank & Konto, Stadt, GPS (auto)\n4️⃣ Absenden\n\n💡 Sie benötigen eine **SA-Agent-Aufsichtsnummer** zur Registrierung.',
          zh: '📍 **如何注册成为NSNdogo代理:**\n\n1️⃣ 菜单 ☰ → **"NiSenti Ndogos"**\n2️⃣ 在 **"我的账户"** 下 → **"创建账户"**\n3️⃣ 填写：国家ID、姓名和电话、邮箱、密码、SA注册号、银行和账户、城市、GPS（自动）\n4️⃣ 提交\n\n💡 注册需要**SA主管号码**。',
          ru: '📍 **Как зарегистрироваться в качестве агента NSNdogo:**\n\n1️⃣ Меню ☰ → **"NiSenti Ndogos"**\n2️⃣ В **"Мой счёт"** → **"Создать счёт"**\n3️⃣ Заполнить: Национальный ID, Имя и телефон, Email, Пароль, Номер SA, Банк и счёт, Город, GPS (авто)\n4️⃣ Отправить\n\n💡 Для регистрации нужен **номер наблюдающего SA-агента**.',
          pt: '📍 **Como registrar-se como Agente NSNdogo:**\n\n1️⃣ Menu ☰ → **"NiSenti Ndogos"**\n2️⃣ Em **"Minha conta"** → **"Criar conta"**\n3️⃣ Preencha: ID Nacional, Nome e Telefone, Email, Senha, Número SA, Banco e Conta, Cidade, GPS (auto)\n4️⃣ Envie\n\n💡 Você precisa de um **número SAgent supervisor** para se registrar.',
          it: '📍 **Come registrarsi come Agente NSNdogo:**\n\n1️⃣ Menu ☰ → **"NiSenti Ndogos"**\n2️⃣ Sotto **"Il mio account"** → **"Crea account"**\n3️⃣ Compila: ID Nazionale, Nome e Telefono, Email, Password, Numero SA, Banca e Conto, Città, GPS (auto)\n4️⃣ Invia\n\n💡 Hai bisogno di un **numero SAgent supervisore** per registrarti.',
          he: '📍 **כיצד להירשם כסוכן NSNdogo:**\n\n1️⃣ תפריט ☰ → **"NiSenti Ndogos"**\n2️⃣ תחת **"החשבון שלי"** → **"צור חשבון"**\n3️⃣ מלא: תעודת זהות, שם וטלפון, אימייל, סיסמה, מספר SA, בנק וחשבון, עיר, GPS (אוטו)\n4️⃣ שלח\n\n💡 אתה צריך **מספר SAgent מפקח** כדי להירשם.',
          hi: '📍 **NSNdogo एजेंट के रूप में कैसे पंजीकरण करें:**\n\n1️⃣ मेनू ☰ → **"NiSenti Ndogos"**\n2️⃣ **"मेरा खाता"** के तहत → **"खाता बनाएं"**\n3️⃣ भरें: राष्ट्रीय ID, नाम और फोन, ईमेल, पासवर्ड, SA नंबर, बैंक और खाता, शहर, GPS (स्वचालित)\n4️⃣ सबमिट करें\n\n💡 पंजीकरण के लिए **SA पर्यवेक्षक नंबर** की आवश्यकता है।',
          am: '📍 **NSNdogo ወኪሎ እንዴት ይመዝገቡ:**\n\n1️⃣ ምናሌ ☰ → **"NiSenti Ndogos"**\n2️⃣ **"የኔ ሒሳብ"** ስር → **"ሒሳብ ፍጠር"**\n3️⃣ ይሙሉ: ብሔራዊ ID፣ ስም እና ስልክ፣ ኢሜይል፣ 암호፣ SA ቁጥር፣ ባንክ እና ሒሳብ፣ ከተማ፣ GPS (ራስ-ሰር)\n4️⃣ ያስገቡ\n\n💡 ለምዝገባ **SA ወኪሎ ቁጥጥር ቁጥር** ያስፈልጋል።'
        }
      }
    ]
  }
];

export const getProductByScreen = (screenName: string): ProductInfo | undefined => {
  return PRODUCTS.find(p => p.screen === screenName);
};

export const getProductsByKeyword = (keyword: string): ProductInfo[] => {
  const lowerKeyword = keyword.toLowerCase();
  return PRODUCTS.filter(p => 
    p.keywords.some(k => k.includes(lowerKeyword) || lowerKeyword.includes(k))
  );
};

export const isGreeting = (text: string): boolean => {
  const greetings = ['hi', 'hello', 'hey', 'greetings', 'how are you', 'what\'s up', 'bonjour', 'hola', 'guten tag', 'ciao', 'namaste', 'shalom', 'assalamu', 'salam'];
  const lowerText = text.toLowerCase().trim();
  return greetings.some(g => lowerText.includes(g) || lowerText === g);
};

export const getGreeting = (lang: string): string => {
  const greetings: Record<string, string> = {
    en: '👋 Hi there! How can I help you today? I can assist you with info about Friend Products (Pal-Pal), Chama Groups, Business (Credit Sales), COMB shopping, Transport Services, or NSNdogo Agent services (deposit/withdraw cash).',
    ar: '👋 مرحبا! كيف يمكنني مساعدتك اليوم؟ يمكنني مساعدتك بمعلومات حول قروض Pal-Pal وكمامات Chama والمبيعات الائتمانية وتسوق COMB أو خدمات النقل.',
    zh: '👋 你好！我今天能怎样帮助你？我可以帮助您了解Pal-Pal贷款、Chama小组、信用销售、COMB购物或运输服务。',
    ru: '👋 Привет! Чем я могу вам помочь сегодня? Я могу помочь вам информацией о кредитах Pal-Pal, группах Chama, кредитных продажах, покупках COMB или услугах транспорта.',
    sw: '👋 Habari! Ninaweza kusaidia vipi leo? Ninaweza kukusaidia na taarifa kuhusu Pal-Pal Mikopo, Vikundi vya Chama, Mabores ya Mikopo, Kushopping kwa COMB, au Huduma za Transport.',
    fr: '👋 Bonjour! Comment puis-je vous aider aujourd\'hui? Je peux vous aider avec des informations sur les prêts Pal-Pal, les groupes Chama, les ventes à crédit, les achats COMB ou les services de transport.',
    es: '👋 ¡Hola! ¿Cómo puedo ayudarte hoy? Puedo ayudarte con información sobre Préstamos Pal-Pal, Grupos Chama, Ventas de Crédito, Compras COMB o Servicios de Transporte.',
    de: '👋 Hallo! Wie kann ich dir heute helfen? Ich kann dir Informationen über Pal-Pal-Darlehen, Chama-Gruppen, Kreditverkäufe, COMB-Einkäufe oder Transportdienste geben.',
    pt: '👋 Olá! Como posso ajudá-lo hoje? Posso ajudá-lo com informações sobre Empréstimos Pal-Pal, Grupos Chama, Vendas de Crédito, Compras COMB ou Serviços de Transporte.',
    it: '👋 Ciao! Come posso aiutarti oggi? Posso aiutarti con informazioni su Prestiti Pal-Pal, Gruppi Chama, Vendite di Credito, Acquisti COMB o Servizi di Trasporto.',
    he: '👋 שלום! איך אוכל לעזור לך היום? אני יכול לעזור לך עם מידע על הלוואות Pal-Pal, קבוצות Chama, מכירות אשראי, קניות COMB או שירותי הובלה.',
    hi: '👋 नमस्ते! मैं आज आपकी कैसे मदद कर सकता हूं? मैं आपको Pal-Pal ऋण, Chama समूह, क्रेडिट बिक्री, COMB खरीदारी या परिवहन सेवाओं के बारे में जानकारी देने में मदद कर सकता हूं।',
    am: '👋 ሰላም! ዛሬ እንዴት ሰር እችላለሁ? Pal-Pal ብድር፣ Chama ቡድን፣ ክሬዲት ሽያጭ፣ COMB ሎክ ወይም Transport አገልግሎት ስለ መረጃ ሰር እችላለሁ።'
  };
  return greetings[lang] || greetings.en;
};
