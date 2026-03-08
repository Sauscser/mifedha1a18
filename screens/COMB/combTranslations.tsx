// Centralized COMB translations for all screens
const combTranslations = {
  en: {
    auditorRegistration: {
      wrongPassword: 'Wrong password or account does not exist!',
      accessDenied: 'Access denied or network error.',
      auditorEmailNotExist: 'The specified auditor email does not exist in the system.',
      registrationSuccess: 'You have been registered as a COMB Officer under Institution {{usr}} successfully.',
      error: 'Error',
      success: 'Success',
      unauthorized: 'Unauthorized',
      notRegistered: 'You are not registered as an auditor.',
      failedToVerify: 'Failed to verify auditor.',
      failedToLoadVouchers: 'Failed to load vouchers.',
      noVouchersSelected: 'No vouchers selected',
      vouchersExported: 'Vouchers exported and updated. Loading fresh vouchers...',
      pdfExportWarning: 'PDF exported but failed to update voucher statuses. Please try refreshing.',
      failedToGeneratePDF: 'Failed to generate PDF',
      filterBySeller: 'Filter by Seller',
      filterByConsumer: 'Filter by Consumer',
      filterByFunder: 'Filter by Funder',
    },
    consumerApproveVoucher: {
      couldNotLoadVouchers: 'Could not load vouchers. {{error}}',
      approveVoucherConfirm: 'Are you sure you want to approve this voucher from {{sellerName}}?',
      declinedWindowClosed: 'Declined! Voucher approval window closed.',
      voucherApproved: 'Voucher successfully approved',
      insufficientFunds: 'Funder {{funderName}} does not have enough balance.',
      couldNotUpdateVoucher: 'Could not update voucher.',
      error: 'Error',
      declined: 'Declined!',
      approve: 'Approve',
      sellerAccount: 'Seller Account',
      funderAccount: 'Funder Account',
      consumerAccount: 'Consumer Account',
    },
    createCOMBContract: {
      missingField: '{{label}} is required.',
      contractCreated: 'COMB contract created successfully',
      contractError: 'Ensure you enter details correctly!',
      success: 'Success',
      error: 'Error',
      consumerEmail: 'Consumer Email',
      consumerBusinessAccount: 'Consumer Business Account',
      consumerOfficerEmail: 'Consumer Officer Email',
      funderInstitutionAccount: 'Funder Institution/Business Account',
      funderOfficerEmail: 'Funder Officer Email',
      consumptionCapping: 'Consumption Capping: KSH',
      sellerPriceDeviation: 'Seller Price Deviation Margin: %',
      niSentiPriceMarketDeviation: 'NiSenti Price Market Deviation Margin %',
      allMarketsPriceDeviation: 'All Markets Price Deviation Margin %',
      voucherUpdateFrequency: 'Voucher Update Frequency in days',
      paymentPeriod: 'Payment Period',
      mainAccountPassword: 'Main Account Password',
    },
    funderClearBill: {
      failedToLoadVouchers: {
        en: 'Failed to load vouchers',
        hi: 'वाउचर लोड करने में विफल',
        he: 'טעינת שוברים נכשלה',
        zh: '加载凭证失败',
        ar: 'فشل تحميل القسائم',
      },
      confirmAction: {
        en: 'Are you sure you want to {{action}} this voucher?',
        hi: 'क्या आप वाकई इस वाउचर को {{action}} करना चाहते हैं?',
        he: 'האם אתה בטוח שברצונך {{action}} שובר זה?',
        zh: '您确定要{{action}}此凭证吗？',
        ar: 'هل أنت متأكد أنك تريد {{action}} هذه القسيمة؟',
      },
      voucherDeclined: {
        en: 'Voucher declined and funds returned to consumer',
        hi: 'वाउचर अस्वीकृत और धन उपभोक्ता को वापस किया गया',
        he: 'השובר נדחה והכספים הוחזרו לצרכן',
        zh: '凭证被拒绝，资金已退还给消费者',
        ar: 'تم رفض القسيمة وتمت إعادة الأموال إلى المستهلك',
      },
      declineFailed: {
        en: 'Decline failed',
        hi: 'अस्वीकृति विफल',
        he: 'הדחייה נכשלה',
        zh: '拒绝失败',
        ar: 'فشل الرفض',
      },
      settlementFailed: {
        en: 'Settlement failed',
        hi: 'निपटान विफल',
        he: 'הסדר נכשל',
        zh: '结算失败',
        ar: 'فشل التسوية',
      },
      success: {
        en: 'Success',
        hi: 'सफलता',
        he: 'הצלחה',
        zh: '成功',
        ar: 'نجاح',
      },
      error: {
        en: 'Error',
        hi: 'त्रुटि',
        he: 'שגיאה',
        zh: '错误',
        ar: 'خطأ',
      },
    },
    linkCOMBSeller: {
      selectSellerType: 'Select seller type.',
      enterBusinessOfficer: 'Enter business and officer details.',
      enterSellerEmail: 'Enter seller main account email.',
      incorrectPassword: 'Incorrect password or account not found.',
      cannotSellToSelf: 'The seller cannot sell to oneself',
      cannotFundToSelf: 'The seller cannot pay/fund to oneself',
      notAuthorised: 'This Institution Officer is not authorised to sell. Contact manually.',
      sellerUpdated: 'Seller details updated successfully.',
      sellerError: 'Ensure you enter details correctly.',
      authentication: 'Authentication',
      validation: 'Validation',
      warning: 'Warning',
      theSellerCannotSellToOneself: 'The seller cannot sell to oneself',
      theSellerCannotPayToOneself: 'The seller cannot pay/fund to oneself',
      notAuthorisedToSell: 'This Institution Officer is not authorised to sell. Contact manually.',
      success: 'Success',
      error: 'Error',
      linkSeller: 'Link Seller',
      title: 'Link COMB Seller',
      buttonText: 'Link Seller',
    },
    vw2GenerateVoucher: {
      noContractsFound: 'No COMB Contracts found',
    },
    vw2LinkSeller: {
      noContractsFound: 'No COMB Contracts found',
    },
    sectionLabels: {
      account: 'Account',
      registerAuditor: 'Register COMB Officer - Institution Owner',
      createContract: 'Create COMB Contract - Funder',
      linkSeller: 'Link Seller - Consumer',
      generateVoucher: 'Generate COMB Voucher - Seller',
      approveVoucher: 'Approve COMB Voucher - Consumer',
      clearBills: 'Clear COMB Bills - Funder',
      auditContracts: 'Audit COMB Contracts - Auditor',
    },
  },
  sw: {
    sectionLabels: {
      account: 'Account',
      registerAuditor: 'Register COMB Officer - Institution Owner',
      createContract: 'Create COMB Contract - Funder',
      linkSeller: 'Link Seller - Consumer',
      generateVoucher: 'Generate COMB Voucher - Seller',
      approveVoucher: 'Approve COMB Voucher - Consumer',
      clearBills: 'Clear COMB Bills - Funder',
      auditContracts: 'Audit COMB Contracts - Auditor',
    },
  }, // Kiswahili
  ar: {
    sectionLabels: {
      account: 'Account',
      registerAuditor: 'Register COMB Officer - Institution Owner',
      createContract: 'Create COMB Contract - Funder',
      linkSeller: 'Link Seller - Consumer',
      generateVoucher: 'Generate COMB Voucher - Seller',
      approveVoucher: 'Approve COMB Voucher - Consumer',
      clearBills: 'Clear COMB Bills - Funder',
      auditContracts: 'Audit COMB Contracts - Auditor',
    },
  }, // Arabic
  ru: {
    sectionLabels: {
      account: 'Account',
      registerAuditor: 'Register COMB Officer - Institution Owner',
      createContract: 'Create COMB Contract - Funder',
      linkSeller: 'Link Seller - Consumer',
      generateVoucher: 'Generate COMB Voucher - Seller',
      approveVoucher: 'Approve COMB Voucher - Consumer',
      clearBills: 'Clear COMB Bills - Funder',
      auditContracts: 'Audit COMB Contracts - Auditor',
    },
  }, // Russian
  zh: {
    sectionLabels: {
      account: 'Account',
      registerAuditor: 'Register COMB Officer - Institution Owner',
      createContract: 'Create COMB Contract - Funder',
      linkSeller: 'Link Seller - Consumer',
      generateVoucher: 'Generate COMB Voucher - Seller',
      approveVoucher: 'Approve COMB Voucher - Consumer',
      clearBills: 'Clear COMB Bills - Funder',
      auditContracts: 'Audit COMB Contracts - Auditor',
    },
  }, // Mandarin (Chinese)
  hi: {
    sectionLabels: {
      account: 'Account',
      registerAuditor: 'Register COMB Officer - Institution Owner',
      createContract: 'Create COMB Contract - Funder',
      linkSeller: 'Link Seller - Consumer',
      generateVoucher: 'Generate COMB Voucher - Seller',
      approveVoucher: 'Approve COMB Voucher - Consumer',
      clearBills: 'Clear COMB Bills - Funder',
      auditContracts: 'Audit COMB Contracts - Auditor',
    },
  }, // Hindi
  am: {
    sectionLabels: {
      account: 'Account',
      registerAuditor: 'Register COMB Officer - Institution Owner',
      createContract: 'Create COMB Contract - Funder',
      linkSeller: 'Link Seller - Consumer',
      generateVoucher: 'Generate COMB Voucher - Seller',
      approveVoucher: 'Approve COMB Voucher - Consumer',
      clearBills: 'Clear COMB Bills - Funder',
      auditContracts: 'Audit COMB Contracts - Auditor',
    },
  }, // Amharic
  de: {
    sectionLabels: {
      account: 'Account',
      registerAuditor: 'Register COMB Officer - Institution Owner',
      createContract: 'Create COMB Contract - Funder',
      linkSeller: 'Link Seller - Consumer',
      generateVoucher: 'Generate COMB Voucher - Seller',
      approveVoucher: 'Approve COMB Voucher - Consumer',
      clearBills: 'Clear COMB Bills - Funder',
      auditContracts: 'Audit COMB Contracts - Auditor',
    },
  }, // German
  es: {
    sectionLabels: {
      account: 'Account',
      registerAuditor: 'Register COMB Officer - Institution Owner',
      createContract: 'Create COMB Contract - Funder',
      linkSeller: 'Link Seller - Consumer',
      generateVoucher: 'Generate COMB Voucher - Seller',
      approveVoucher: 'Approve COMB Voucher - Consumer',
      clearBills: 'Clear COMB Bills - Funder',
      auditContracts: 'Audit COMB Contracts - Auditor',
    },
  }, // Spanish
  fr: {
    sectionLabels: {
      account: 'Account',
      registerAuditor: 'Register COMB Officer - Institution Owner',
      createContract: 'Create COMB Contract - Funder',
      linkSeller: 'Link Seller - Consumer',
      generateVoucher: 'Generate COMB Voucher - Seller',
      approveVoucher: 'Approve COMB Voucher - Consumer',
      clearBills: 'Clear COMB Bills - Funder',
      auditContracts: 'Audit COMB Contracts - Auditor',
    },
  }, // French
  pt: {
    sectionLabels: {
      account: 'Account',
      registerAuditor: 'Register COMB Officer - Institution Owner',
      createContract: 'Create COMB Contract - Funder',
      linkSeller: 'Link Seller - Consumer',
      generateVoucher: 'Generate COMB Voucher - Seller',
      approveVoucher: 'Approve COMB Voucher - Consumer',
      clearBills: 'Clear COMB Bills - Funder',
      auditContracts: 'Audit COMB Contracts - Auditor',
    },
  }, // Portuguese
  it: {
    sectionLabels: {
      account: 'Account',
      registerAuditor: 'Register COMB Officer - Institution Owner',
      createContract: 'Create COMB Contract - Funder',
      linkSeller: 'Link Seller - Consumer',
      generateVoucher: 'Generate COMB Voucher - Seller',
      approveVoucher: 'Approve COMB Voucher - Consumer',
      clearBills: 'Clear COMB Bills - Funder',
      auditContracts: 'Audit COMB Contracts - Auditor',
    },
  }, // Italian
  he: {
    sectionLabels: {
      account: 'Account',
      registerAuditor: 'Register COMB Officer - Institution Owner',
      createContract: 'Create COMB Contract - Funder',
      linkSeller: 'Link Seller - Consumer',
      generateVoucher: 'Generate COMB Voucher - Seller',
      approveVoucher: 'Approve COMB Voucher - Consumer',
      clearBills: 'Clear COMB Bills - Funder',
      auditContracts: 'Audit COMB Contracts - Auditor',
    },
  }, // Hebrew
  // Add other languages here following the same structure
};

export default combTranslations;
