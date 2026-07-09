const translations = {
  en: {
    accept: 'Accept',
    decline: 'Decline',
    loanRequestMessage: 'Hi! it\'s business {name}. Kindly Loan me {itemName} worth {amount}. I commit to repay at a compound interest of {repaymentAmt}% per {period} days. Each Installment is {installmentAmount} after every {paymentFrequency} days. You can reach me through {phone}. {status}'
  },
  sw: {
    accept: 'Kubali',
    decline: 'Kataa',
    loanRequestMessage: 'Mambo! ni biashara ya {name}. Tafadhali ninikopeshe {itemName} yenye thamani ya {amount}. Ninajitolea kulipa kwa riba ya mchanganyiko ya {repaymentAmt}% kwa siku {period}. Kila installment ni {installmentAmount} baada ya siku {paymentFrequency}. Unaweza kuniwasiliana kupitia {phone}. {status}'
  },
  fr: {
    accept: 'Accepter',
    decline: 'Refuser',
    loanRequestMessage: 'Salut ! C’est l’entreprise {name}. Veuillez me prêter {itemName} d’une valeur de {amount}. Je m’engage à rembourser à un taux d’intérêt composé de {repaymentAmt}% par {period} jours. Chaque versement est de {installmentAmount} tous les {paymentFrequency} jours. Vous pouvez me joindre au {phone}. {status}'
  },
  ar: {
    accept: 'قبول',
    decline: 'رفض',
    loanRequestMessage: 'مرحبًا! هذا عمل {name}. يرجى إقراضي {itemName} بقيمة {amount}. أتعهد بسدادها بفائدة مركبة بنسبة {repaymentAmt}% لكل {period} يومًا. كل قسط يبلغ {installmentAmount} كل {paymentFrequency} يومًا. يمكنك التواصل معي عبر {phone}. {status}'
  },
  zh: {
    accept: '接受',
    decline: '拒绝',
    loanRequestMessage: '你好！这是 {name} 的业务。请借给我价值 {amount} 的 {itemName}。我承诺按复利 {repaymentAmt}% / {period} 天偿还。每期分期金额为 {installmentAmount}，每 {paymentFrequency} 天一次。您可以通过 {phone} 联系我。{status}'
  },
  ru: {
    accept: 'Принять',
    decline: 'Отклонить',
    loanRequestMessage: 'Привет! Это бизнес {name}. Пожалуйста, дайте мне в кредит {itemName} на сумму {amount}. Я обязуюсь вернуть сумму с процентами по сложной ставке {repaymentAmt}% за {period} дней. Каждый взнос составляет {installmentAmount} каждые {paymentFrequency} дней. Вы можете связаться со мной по {phone}. {status}'
  },
  es: {
    accept: 'Aceptar',
    decline: 'Rechazar',
    loanRequestMessage: '¡Hola! Es el negocio {name}. Por favor, préstame {itemName} por valor de {amount}. Me comprometo a pagar con un interés compuesto del {repaymentAmt}% por {period} días. Cada cuota es de {installmentAmount} cada {paymentFrequency} días. Puede comunicarse conmigo a través de {phone}. {status}'
  },
  de: {
    accept: 'Annehmen',
    decline: 'Ablehnen',
    loanRequestMessage: 'Hallo! Das ist das Unternehmen {name}. Bitte leihe mir {itemName} im Wert von {amount}. Ich werde mich verpflichten, zu einem Zinseszins von {repaymentAmt}% pro {period} Tagen zurückzuzahlen. Jede Rate beträgt {installmentAmount} alle {paymentFrequency} Tage. Sie können mich unter {phone} erreichen. {status}'
  },
  pt: {
    accept: 'Aceitar',
    decline: 'Recusar',
    loanRequestMessage: 'Olá! É o negócio {name}. Por favor, me empreste {itemName} no valor de {amount}. Eu me comprometo a pagar com juros compostos de {repaymentAmt}% por {period} dias. Cada prestação é de {installmentAmount} a cada {paymentFrequency} dias. Você pode me contatar pelo {phone}. {status}'
  },
  it: {
    accept: 'Accetta',
    decline: 'Rifiuta',
    loanRequestMessage: 'Ciao! È l’attività {name}. Per favore prestami {itemName} del valore di {amount}. Mi impegno a rimborsare con un interesse composto del {repaymentAmt}% ogni {period} giorni. Ogni rata è di {installmentAmount} ogni {paymentFrequency} giorni. Puoi contattarmi tramite {phone}. {status}'
  },
  he: {
    accept: 'קבל',
    decline: 'דחה',
    loanRequestMessage: 'שלום! זה העסק {name}. אנא.loan me {itemName} בשווי {amount}. אני מתחייב להחזיר בריבית דריבית של {repaymentAmt}% לכל {period} ימים. כל תשלום הוא {installmentAmount} כל {paymentFrequency} ימים. תוכלו ליצור איתי קשר דרך {phone}. {status}'
  },
  hi: {
    accept: 'स्वीकार करें',
    decline: 'अस्वीकार करें',
    loanRequestMessage: 'नमस्ते! यह {name} का व्यापार है। कृपया मुझे {itemName} {amount} की कीमत का ऋण दें। मैं {period} दिनों में {repaymentAmt}% चक्रवृद्धि ब्याज पर चुकाने का वचन देता हूँ। प्रत्येक किस्त {paymentFrequency} दिनों के बाद {installmentAmount} होगी। आप {phone} के जरिए मुझसे संपर्क कर सकते हैं। {status}'
  },
  am: {
    accept: 'ተቀበል',
    decline: 'አልቀበልም',
    loanRequestMessage: 'ሰላም! {name} ንግድ ነው። እባክዎ {itemName} ዋጋ {amount} ብድር ይስጡኝ። በ{repaymentAmt}% የተዋሃደ ብድር ወለድ ለ{period} ቀናት መክፈል እወስናለሁ። እያንዳንዱ መክፈል {paymentFrequency} ቀናት ካለፈ {installmentAmount} ነው። በ{phone} ሊያገኙኝ ይችላሉ። {status}'
  }
};

export default translations;
