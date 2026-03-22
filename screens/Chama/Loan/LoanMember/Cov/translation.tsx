export const translations = {
  en: {
    labels: {
      header: 'Covered Chama Loan',
      subHeader: 'Grant a covered group loan to a member',
      adminPassword: 'Admin Password',
      loanButton: 'Grant Loan',
    },
    placeholders: {
      password: 'Enter admin password',
    },
    alerts: {
      accessDenied: 'Access denied. Please check your permissions.',
      wrongPassword: 'Incorrect password. Please try again.',
      alreadyGranted: 'This loan has already been granted.',
      notCleared: 'Loan is not cleared for granting.',
      cannotLoanSelf: 'You cannot grant a loan to yourself.',
      receiverInactive: 'The receiver account is not active.',
      successWithAdv: 'Loan granted! Transaction fee: {{transFee}}, Advocate fee: {{advFee}}',
      successNoAdv: 'Loan granted! Transaction fee: {{transFee}}',
    },
    notifications: {
      title: 'Chama Loan Granted',
      message: 'You have received a group loan from {{groupName}}. Amount: {{amount}}, Total: {{totalAmount}}, Interest: {{interestAmount}}, Repayment period: {{repaymentPeriod}}, Transaction fee: {{transactionFee}}, Advocate fee: {{advocateFee}}, Installment: {{installmentAmount}}, Frequency: {{paymentFrequency}}.'
    }
  },
  ar: {
    labels: {
      header: 'قرض جماعي مغطى',
      subHeader: 'منح قرض جماعي مغطى لعضو',
      adminPassword: 'كلمة مرور المسؤول',
      loanButton: 'منح القرض',
    },
    placeholders: {
      password: 'أدخل كلمة مرور المسؤول',
    },
    alerts: {
      accessDenied: 'تم رفض الوصول. يرجى التحقق من الأذونات.',
      wrongPassword: 'كلمة المرور غير صحيحة. حاول مرة أخرى.',
      alreadyGranted: 'تم منح هذا القرض بالفعل.',
      notCleared: 'القرض غير مصرح بمنحه.',
      cannotLoanSelf: 'لا يمكنك منح قرض لنفسك.',
      receiverInactive: 'حساب المستلم غير نشط.',
      successWithAdv: 'تم منح القرض! رسوم المعاملة: {{transFee}}، رسوم المحامي: {{advFee}}',
      successNoAdv: 'تم منح القرض! رسوم المعاملة: {{transFee}}',
    },
    notifications: {
      title: 'تم منح قرض جماعي',
      message: 'لقد تلقيت قرضًا جماعيًا من {{groupName}}. المبلغ: {{amount}}، الإجمالي: {{totalAmount}}، الفائدة: {{interestAmount}}، فترة السداد: {{repaymentPeriod}}، رسوم المعاملة: {{transactionFee}}، رسوم المحامي: {{advocateFee}}، القسط: {{installmentAmount}}، التكرار: {{paymentFrequency}}.'
    }
  },
  zh: {
    labels: {
      header: '有保障的Chama贷款',
      subHeader: '向成员发放有保障的团体贷款',
      adminPassword: '管理员密码',
      loanButton: '发放贷款',
    },
    placeholders: {
      password: '输入管理员密码',
    },
    alerts: {
      accessDenied: '拒绝访问。请检查您的权限。',
      wrongPassword: '密码错误。请再试一次。',
      alreadyGranted: '该贷款已发放。',
      notCleared: '贷款尚未批准发放。',
      cannotLoanSelf: '您不能给自己发放贷款。',
      receiverInactive: '收款人账户未激活。',
      successWithAdv: '贷款已发放！交易费：{{transFee}}，律师费：{{advFee}}',
      successNoAdv: '贷款已发放！交易费：{{transFee}}',
    },
    notifications: {
      title: 'Chama贷款已发放',
      message: '您已收到来自{{groupName}}的团体贷款。金额：{{amount}}，总计：{{totalAmount}}，利息：{{interestAmount}}，还款期：{{repaymentPeriod}}，交易费：{{transactionFee}}，律师费：{{advocateFee}}，分期付款：{{installmentAmount}}，频率：{{paymentFrequency}}。'
    }
  },
  ru: {
    labels: {
      header: 'Покрытый групповый займ',
      subHeader: 'Выдать покрытый групповой займ участнику',
      adminPassword: 'Пароль администратора',
      loanButton: 'Выдать займ',
    },
    placeholders: {
      password: 'Введите пароль администратора',
    },
    alerts: {
      accessDenied: 'Доступ запрещен. Проверьте ваши права.',
      wrongPassword: 'Неверный пароль. Попробуйте еще раз.',
      alreadyGranted: 'Этот займ уже выдан.',
      notCleared: 'Займ не разрешен к выдаче.',
      cannotLoanSelf: 'Вы не можете выдать займ самому себе.',
      receiverInactive: 'Аккаунт получателя неактивен.',
      successWithAdv: 'Займ выдан! Комиссия: {{transFee}}, Гонорар адвоката: {{advFee}}',
      successNoAdv: 'Займ выдан! Комиссия: {{transFee}}',
    },
    notifications: {
      title: 'Групповой займ выдан',
      message: 'Вы получили групповой займ от {{groupName}}. Сумма: {{amount}}, Всего: {{totalAmount}}, Проценты: {{interestAmount}}, Срок: {{repaymentPeriod}}, Комиссия: {{transactionFee}}, Гонорар адвоката: {{advocateFee}}, Платеж: {{installmentAmount}}, Частота: {{paymentFrequency}}.'
    }
  },
  sw: {
    labels: {
      header: 'Mkopo wa Chama Uliolindwa',
      subHeader: 'Toa mkopo wa kikundi uliolindwa kwa mwanachama',
      adminPassword: 'Nenosiri la Msimamizi',
      loanButton: 'Toa Mkopo',
    },
    placeholders: {
      password: 'Weka nenosiri la msimamizi',
    },
    alerts: {
      accessDenied: 'Huruhusiwi. Tafadhali angalia ruhusa zako.',
      wrongPassword: 'Nenosiri si sahihi. Jaribu tena.',
      alreadyGranted: 'Mkopo huu tayari umetolewa.',
      notCleared: 'Mkopo haujaruhusiwa kutolewa.',
      cannotLoanSelf: 'Huwezi kujipa mkopo.',
      receiverInactive: 'Akaunti ya mpokeaji haifanyi kazi.',
      successWithAdv: 'Mkopo umetolewa! Ada ya muamala: {{transFee}}, Ada ya wakili: {{advFee}}',
      successNoAdv: 'Mkopo umetolewa! Ada ya muamala: {{transFee}}',
    },
    notifications: {
      title: 'Mkopo wa Chama Umetolewa',
      message: 'Umepewa mkopo wa kikundi kutoka {{groupName}}. Kiasi: {{amount}}, Jumla: {{totalAmount}}, Riba: {{interestAmount}}, Kipindi cha malipo: {{repaymentPeriod}}, Ada ya muamala: {{transactionFee}}, Ada ya wakili: {{advocateFee}}, Malipo ya awamu: {{installmentAmount}}, Marudio: {{paymentFrequency}}.'
    }
  },
  fr: {
    labels: {
      header: 'Prêt de groupe couvert',
      subHeader: 'Accorder un prêt de groupe couvert à un membre',
      adminPassword: "Mot de passe de l'administrateur",
      loanButton: 'Accorder le prêt',
    },
    placeholders: {
      password: ",Entrez le mot de passe administrateur",
    },
    alerts: {
      accessDenied: "Accès refusé. Veuillez vérifier vos autorisations.",
      wrongPassword: 'Mot de passe incorrect. Veuillez réessayer.',
      alreadyGranted: 'Ce prêt a déjà été accordé.',
      notCleared: 'Le prêt n\'est pas autorisé à être accordé.',
      cannotLoanSelf: 'Vous ne pouvez pas vous accorder un prêt à vous-même.',
      receiverInactive: "Le compte du destinataire n'est pas actif.",
      successWithAdv: 'Prêt accordé ! Frais de transaction : {{transFee}}, Frais avocat : {{advFee}}',
      successNoAdv: 'Prêt accordé ! Frais de transaction : {{transFee}}',
    },
    notifications: {
      title: 'Prêt de groupe accordé',
      message: 'Vous avez reçu un prêt de groupe de {{groupName}}. Montant : {{amount}}, Total : {{totalAmount}}, Intérêt : {{interestAmount}}, Période de remboursement : {{repaymentPeriod}}, Frais de transaction : {{transactionFee}}, Frais avocat : {{advocateFee}}, Montant de la mensualité : {{installmentAmount}}, Fréquence : {{paymentFrequency}}.'
    }
  },
  es: {
    labels: {
      header: 'Préstamo grupal cubierto',
      subHeader: 'Otorgar un préstamo grupal cubierto a un miembro',
      adminPassword: 'Contraseña de administrador',
      loanButton: 'Otorgar préstamo',
    },
    placeholders: {
      password: 'Ingrese la contraseña de administrador',
    },
    alerts: {
      accessDenied: 'Acceso denegado. Por favor, verifique sus permisos.',
      wrongPassword: 'Contraseña incorrecta. Inténtalo de nuevo.',
      alreadyGranted: 'Este préstamo ya ha sido otorgado.',
      notCleared: 'El préstamo no está autorizado para ser otorgado.',
      cannotLoanSelf: 'No puede otorgarse un préstamo a sí mismo.',
      receiverInactive: 'La cuenta del receptor no está activa.',
      successWithAdv: '¡Préstamo otorgado! Tarifa de transacción: {{transFee}}, Tarifa de abogado: {{advFee}}',
      successNoAdv: '¡Préstamo otorgado! Tarifa de transacción: {{transFee}}',
    },
    notifications: {
      title: 'Préstamo grupal otorgado',
      message: 'Ha recibido un préstamo grupal de {{groupName}}. Monto: {{amount}}, Total: {{totalAmount}}, Interés: {{interestAmount}}, Período de pago: {{repaymentPeriod}}, Tarifa de transacción: {{transactionFee}}, Tarifa de abogado: {{advocateFee}}, Monto de la cuota: {{installmentAmount}}, Frecuencia: {{paymentFrequency}}.'
    }
  },
  de: {
    labels: {
      header: 'Abgesichertes Gruppendarlehen',
      subHeader: 'Ein abgesichertes Gruppendarlehen an ein Mitglied vergeben',
      adminPassword: 'Administrator-Passwort',
      loanButton: 'Darlehen vergeben',
    },
    placeholders: {
      password: 'Administrator-Passwort eingeben',
    },
    alerts: {
      accessDenied: 'Zugriff verweigert. Bitte überprüfen Sie Ihre Berechtigungen.',
      wrongPassword: 'Falsches Passwort. Bitte versuchen Sie es erneut.',
      alreadyGranted: 'Dieses Darlehen wurde bereits vergeben.',
      notCleared: 'Darlehen ist nicht zur Vergabe freigegeben.',
      cannotLoanSelf: 'Sie können sich selbst kein Darlehen gewähren.',
      receiverInactive: 'Empfängerkonto ist nicht aktiv.',
      successWithAdv: 'Darlehen vergeben! Transaktionsgebühr: {{transFee}}, Anwaltsgebühr: {{advFee}}',
      successNoAdv: 'Darlehen vergeben! Transaktionsgebühr: {{transFee}}',
    },
    notifications: {
      title: 'Gruppendarlehen vergeben',
      message: 'Sie haben ein Gruppendarlehen von {{groupName}} erhalten. Betrag: {{amount}}, Gesamt: {{totalAmount}}, Zinsen: {{interestAmount}}, Rückzahlungszeitraum: {{repaymentPeriod}}, Transaktionsgebühr: {{transactionFee}}, Anwaltsgebühr: {{advocateFee}}, Ratenbetrag: {{installmentAmount}}, Häufigkeit: {{paymentFrequency}}.'
    }
  },
  pt: {
    labels: {
      header: 'Empréstimo de grupo coberto',
      subHeader: 'Conceder um empréstimo de grupo coberto a um membro',
      adminPassword: 'Senha do administrador',
      loanButton: 'Conceder empréstimo',
    },
    placeholders: {
      password: 'Digite a senha do administrador',
    },
    alerts: {
      accessDenied: 'Acesso negado. Por favor, verifique suas permissões.',
      wrongPassword: 'Senha incorreta. Tente novamente.',
      alreadyGranted: 'Este empréstimo já foi concedido.',
      notCleared: 'O empréstimo não está autorizado para concessão.',
      cannotLoanSelf: 'Você não pode conceder um empréstimo a si mesmo.',
      receiverInactive: 'A conta do destinatário não está ativa.',
      successWithAdv: 'Empréstimo concedido! Taxa de transação: {{transFee}}, Taxa do advogado: {{advFee}}',
      successNoAdv: 'Empréstimo concedido! Taxa de transação: {{transFee}}',
    },
    notifications: {
      title: 'Empréstimo de grupo concedido',
      message: 'Você recebeu um empréstimo de grupo de {{groupName}}. Valor: {{amount}}, Total: {{totalAmount}}, Juros: {{interestAmount}}, Período de pagamento: {{repaymentPeriod}}, Taxa de transação: {{transactionFee}}, Taxa do advogado: {{advocateFee}}, Valor da parcela: {{installmentAmount}}, Frequência: {{paymentFrequency}}.'
    }
  },
  it: {
    labels: {
      header: 'Prestito di gruppo coperto',
      subHeader: 'Concedi un prestito di gruppo coperto a un membro',
      adminPassword: 'Password amministratore',
      loanButton: 'Concedi prestito',
    },
    placeholders: {
      password: 'Inserisci la password amministratore',
    },
    alerts: {
      accessDenied: 'Accesso negato. Controlla le tue autorizzazioni.',
      wrongPassword: 'Password errata. Riprova.',
      alreadyGranted: 'Questo prestito è già stato concesso.',
      notCleared: 'Il prestito non è autorizzato per la concessione.',
      cannotLoanSelf: 'Non puoi concedere un prestito a te stesso.',
      receiverInactive: 'L\'account del destinatario non è attivo.',
      successWithAdv: 'Prestito concesso! Commissione di transazione: {{transFee}}, Commissione avvocato: {{advFee}}',
      successNoAdv: 'Prestito concesso! Commissione di transazione: {{transFee}}',
    },
    notifications: {
      title: 'Prestito di gruppo concesso',
      message: 'Hai ricevuto un prestito di gruppo da {{groupName}}. Importo: {{amount}}, Totale: {{totalAmount}}, Interesse: {{interestAmount}}, Periodo di rimborso: {{repaymentPeriod}}, Commissione di transazione: {{transactionFee}}, Commissione avvocato: {{advocateFee}}, Importo rata: {{installmentAmount}}, Frequenza: {{paymentFrequency}}.'
    }
  },
  he: {
    labels: {
      header: 'הלוואת קבוצה מכוסה',
      subHeader: 'הענק הלוואת קבוצה מכוסה לחבר',
      adminPassword: 'סיסמת מנהל',
      loanButton: 'הענק הלוואה',
    },
    placeholders: {
      password: 'הזן סיסמת מנהל',
    },
    alerts: {
      accessDenied: 'הגישה נדחתה. בדוק את ההרשאות שלך.',
      wrongPassword: 'סיסמה שגויה. נסה שוב.',
      alreadyGranted: 'הלוואה זו כבר ניתנה.',
      notCleared: 'ההלוואה אינה מאושרת למתן.',
      cannotLoanSelf: 'אינך יכול להעניק הלוואה לעצמך.',
      receiverInactive: 'חשבון המקבל אינו פעיל.',
      successWithAdv: 'הלוואה ניתנה! עמלת עסקה: {{transFee}}, עמלת עורך דין: {{advFee}}',
      successNoAdv: 'הלוואה ניתנה! עמלת עסקה: {{transFee}}',
    },
    notifications: {
      title: 'הלוואת קבוצה ניתנה',
      message: 'קיבלת הלוואת קבוצה מ{{groupName}}. סכום: {{amount}}, סה"כ: {{totalAmount}}, ריבית: {{interestAmount}}, תקופת החזר: {{repaymentPeriod}}, עמלת עסקה: {{transactionFee}}, עמלת עורך דין: {{advocateFee}}, סכום תשלום: {{installmentAmount}}, תדירות: {{paymentFrequency}}.'
    }
  },
  hi: {
    labels: {
      header: 'कवर्ड चामा लोन',
      subHeader: 'सदस्य को कवर्ड ग्रुप लोन दें',
      adminPassword: 'प्रशासक पासवर्ड',
      loanButton: 'लोन दें',
    },
    placeholders: {
      password: 'प्रशासक पासवर्ड दर्ज करें',
    },
    alerts: {
      accessDenied: 'पहुंच अस्वीकृत। कृपया अपनी अनुमतियां जांचें।',
      wrongPassword: 'गलत पासवर्ड। कृपया पुनः प्रयास करें।',
      alreadyGranted: 'यह लोन पहले ही दिया जा चुका है।',
      notCleared: 'लोन देने के लिए अधिकृत नहीं है।',
      cannotLoanSelf: 'आप स्वयं को लोन नहीं दे सकते।',
      receiverInactive: 'रिसीवर खाता सक्रिय नहीं है।',
      successWithAdv: 'लोन दिया गया! ट्रांजेक्शन शुल्क: {{transFee}}, वकील शुल्क: {{advFee}}',
      successNoAdv: 'लोन दिया गया! ट्रांजेक्शन शुल्क: {{transFee}}',
    },
    notifications: {
      title: 'चामा लोन दिया गया',
      message: 'आपको {{groupName}} से ग्रुप लोन मिला है। राशि: {{amount}}, कुल: {{totalAmount}}, ब्याज: {{interestAmount}}, पुनर्भुगतान अवधि: {{repaymentPeriod}}, ट्रांजेक्शन शुल्क: {{transactionFee}}, वकील शुल्क: {{advocateFee}}, किस्त राशि: {{installmentAmount}}, आवृत्ति: {{paymentFrequency}}।'
    }
  },
  am: {
    labels: {
      header: 'የተከፈለ ቻማ ብድር',
      subHeader: 'ለአባል የተከፈለ ቡድን ብድር ይስጡ',
      adminPassword: 'የአስተዳዳሪ የይለፍ ቃል',
      loanButton: 'ብድር ስጥ',
    },
    placeholders: {
      password: 'የአስተዳዳሪ የይለፍ ቃል አስገባ',
    },
    alerts: {
      accessDenied: 'መዳረሻ ተከልክሏል። እባክዎን ፈቃዶችዎን ያረጋግጡ።',
      wrongPassword: 'የይለፍ ቃል ትክክል አይደለም። እንደገና ይሞክሩ።',
      alreadyGranted: 'ይህ ብድር አስቀድሞ ተሰጥቷል።',
      notCleared: 'ብድሩ ለመስጠት አልተፈቀደለትም።',
      cannotLoanSelf: 'ለራስዎ ብድር ማቅረብ አይችሉም።',
      receiverInactive: 'የተቀባይ መለያ አይታወቅም።',
      successWithAdv: 'ብድር ተሰጥቷል! የግብይት ክፍያ: {{transFee}}, የጠበቃ ክፍያ: {{advFee}}',
      successNoAdv: 'ብድር ተሰጥቷል! የግብይት ክፍያ: {{transFee}}',
    },
    notifications: {
      title: 'የቻማ ብድር ተሰጥቷል',
      message: 'ከ{{groupName}} ቡድን ብድር ተቀብለዋል። መጠን: {{amount}}, ጠቅላላ: {{totalAmount}}, ወጪ: {{interestAmount}}, የመከፋፈያ ጊዜ: {{repaymentPeriod}}, የግብይት ክፍያ: {{transactionFee}}, የጠበቃ ክፍያ: {{advocateFee}}, የክፍያ መጠን: {{installmentAmount}}, ድግግሞሽ: {{paymentFrequency}}።'
    }
  },
};
