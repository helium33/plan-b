import type { TranslationSchema } from './en';

/**
 * Burmese (မြန်မာ). Typed as `TranslationSchema`, so if a key is added to `en`
 * and forgotten here, this file stops compiling.
 *
 * Translation notes:
 * - Numerals stay Western (18,000 not ၁၈,၀၀၀) — that is what Myanmar trade and
 *   banking use, and mixing scripts inside a price reads badly.
 * - Trade terms that are already English in the shop (C1, TR90, Tit, Order,
 *   ဘောက်ချာ) are left as they are spoken rather than coined afresh. A buyer
 *   scanning for "Tit" will not find "တီတေနီယမ်".
 * - Money is counted in သိန်း (lakhs) above a million, because that is how the
 *   thresholds are quoted at the counter.
 */
export const my: TranslationSchema = {
  brand: {
    name: 'Plan B Vision',
    tagline: 'မျက်မှန်ကိုင်း လက်ကား',
  },

  app: {
    name: 'Plan B Vision',
    tagline: 'မျက်မှန် · လက်ကား',
  },

  nav: {
    catalog: 'ငါတို့ကိုင်း',
    order: 'ဘောက်ချာ',
    credit: 'အကြွေး',
    skipToContent: 'အဓိကအကြောင်းအရာသို့ ကျော်သွားရန်',
    primary: 'အဓိက မီနူး',
  },

  actions: {
    signIn: 'ဝင်ရန်',
    cancel: 'မလုပ်တော့ပါ',
  },

  common: {
    loading: 'ခဏစောင့်ပါ…',
    error: 'တစ်ခုခု မှားယွင်းသွားပါသည်',
    errorBody: 'မအောင်မြင်ပါ။ ထပ်မံ ကြိုးစားကြည့်ပါ။',
    retry: 'ထပ်ကြိုးစားရန်',
    optional: 'ဖြည့်စရာမလို',
    currency: 'ကျပ်',
  },

  theme: {
    toggle: 'အရောင်အသွင် ပြောင်းရန်',
    label: 'အသွင်အပြင်',
    light: 'အလင်း',
    dark: 'အမှောင်',
    system: 'စက်အတိုင်း',
  },

  language: {
    toggle: 'ဘာသာစကား ပြောင်းရန်',
    label: 'ဘာသာစကား',
  },

  attributes: {
    category: {
      Male: 'ကျား',
      Female: 'မ',
      Kids: 'ကလေး',
      Unisex: 'အားလုံးဝတ်နိုင်',
    },
    material: {
      Titanium: 'Tit',
      Metal: 'သံ',
      TR90: 'TR90',
      Combo: 'ကော် + Tit',
      Acetate: 'ကော် သီးသန့်',
    },
    shape: {
      Round: 'ဝိုင်း',
      Square: 'လေးထောင့်',
      Rectangle: 'အလျားလိုက်',
      Aviator: 'Aviator',
      'Cat-Eye': 'ကြောင်မျက်လုံး',
      Geometric: 'ထောင့်ပုံစံ',
    },
    stock: {
      'in-stock': 'ပစ္စည်းရှိ',
      'low-stock': 'ပစ္စည်းနည်း',
      'pre-order': 'ကြိုမှာရန်',
    },
  },

  payment: {
    methods: {
      kpay: 'KPay',
      'bank-transfer': 'ဘဏ်လွှဲ',
      cod: 'ပစ္စည်းရောက်မှ ငွေချေ (COD)',
      credit: 'အကြွေး',
    },
  },

  /* ── ပထမဆုံး ဖွင့်ချိန် ─────────────────────────────────────────────────── */

  onboarding: {
    title: 'Order တင်နည်း',
    subtitle: 'အသံဖြင့် ရှင်းပြထားသော ဗီဒီယို — ၄၅ စက္ကန့်ခန့်။',
    start: 'Order စတင်မည်',
    next: 'ရှေ့သို့',
    skip: 'ကျော်မည် / Skip',
    dontShowAgain: 'နောက်ထပ် မပြပါနှင့်',
    replay: 'Order တင်နည်း ပြန်ကြည့်ရန်',
    stepCounter: 'အဆင့် {{current}} / {{total}}',
    goToStep: 'အဆင့် {{number}} သို့',
    steps: {
      signIn: {
        title: 'အကောင့်ဝင်ပါ',
        body: 'Login မဝင်ထားရင် ပစ္စည်းကြည့်လို့ပဲရပါမယ်၊ ဝယ်မရပါ။',
      },
      browse: {
        title: 'ကိုင်းနှင့် C အရောင် ရွေးပါ',
        body: 'ကိုယ်လိုချင်တဲ့ ကိုင်းနမည်နဲ့ အရောင်ကို ရွေးပါ။',
      },
      send: {
        title: 'Telegram ဖြင့် ပို့လိုက်ပါ',
        body: 'ညာဘက်အောက်က အိတ်ပုံလေးကို နှိပ်ပြီး Viber သို့မဟုတ် Telegram ကနေ Order ပို့လိုက်ပါ။',
      },
    },
  },

  /* ── ငါတို့ကိုင်း ────────────────────────────────────────────────────────── */

  catalog: {
    seriesLabel: 'ကိုင်းအမည်များ',
    all: 'အားလုံး',
    filterCategory: 'ဘယ်သူ့အတွက် · Who it is for',
    filterMaterial: 'ပစ္စည်း · Material',
    filterShape: 'ပုံသဏ္ဌာန် · Shape',
    filtersTitle: 'စစ်ထုတ်ရန်',
    openFilters: 'စစ်ထုတ်ရန် ပြမည်',

    searchLabel: 'ကတ်တလောက် ရှာရန်',
    searchPlaceholder: 'မော်ဒယ်ကုဒ်၊ အရောင်၊ ပစ္စည်း…',
    clearSearch: 'ရှာဖွေမှု ဖျက်ရန်',

    tabAll: 'အားလုံး',
    tabSaved: 'သိမ်းထား',
    save: '{{name}} ကို သိမ်းရန်',
    unsave: '{{name}} ကို သိမ်းထားရာမှ ဖယ်ရန်',
    noSavedTitle: 'သိမ်းထားသည့် ကိုင်း မရှိသေးပါ',
    noSavedBody: 'ကိုင်းတစ်ခုခုပေါ်ရှိ နှလုံးပုံကို နှိပ်၍ ဤနေရာတွင် သိမ်းထားနိုင်ပါသည်။',
    emptyAction: 'ကတ်တလောက် စီမံရန် ဖွင့်မည်',

    zoom: '{{name}} ဓာတ်ပုံ ချဲ့ကြည့်ရန်',
    closePreview: 'ပိတ်ရန်',
    previousPhoto: 'ယခင် ဓာတ်ပုံ',
    nextPhoto: 'နောက် ဓာတ်ပုံ',
    photoNumber: 'ဓာတ်ပုံ {{number}}',

    perPiece: '/လုံး',
    colorCount_one: 'အရောင် {{count}} မျိုး',
    colorCount_other: 'အရောင် {{count}} မျိုး',
    pieces_one: '{{count}} လုံး',
    pieces_other: '{{count}} လုံး',

    increase: '{{color}} တစ်လုံး ထပ်ထည့်ရန်',
    decrease: '{{color}} တစ်လုံး လျှော့ရန်',
    quantityFor: '{{color}} အရေအတွက်',

    enterQuantities: 'အရေအတွက် ထည့်ပါ',
    noColors: 'ဤကိုင်းအတွက် လက်ကျန်ရှိသည့် အရောင် မရှိပါ။',
    takeFullSet: 'အရောင်စုံယူ',
    fullSetApplied: 'အရောင်စုံ',
    clearLine: 'ဖျက်ရန်',

    draftTotal: 'Order စုစုပေါင်း',
    viewVoucher: 'ဘောက်ချာ',
    showing: 'စုစုပေါင်း {{total}} မျိုးအနက် {{shown}} မျိုး ပြသထားသည်',

    modelLabel: 'Model',
    buyNow: 'ဝယ်ယူရန်',
    chooseColour: 'အရောင်ရွေးချယ်ရန်',
    selectColour: 'ရွေးမည်',
    unitPrice: 'ဈေးနှုန်း',
    doneAdding: 'ခြင်းတောင်း ကြည့်ရန်',
    bestSellerBadge: 'Best Seller',
    includesCase: 'Case ပါဝင်သည်',

    signInToShop: 'ဝယ်ယူရန် အကောင့်ဝင်ပါ',
    signInToOrder: 'Login မဝင်ထားရင် ပစ္စည်းကြည့်လို့ပဲရပါမယ်၊ ဝယ်မရပါ။',

    clearFilters: 'စစ်ထုတ်မှု ဖျက်ရန်',
    emptyTitle: 'ကိုင်း မရှိသေးပါ',
    emptyBody: 'ကတ်တလောက် ဗလာဖြစ်နေပါသည်။ ဤရာသီ ကိုင်းအသစ်များ တင်ပေးရန် ကျွန်ုပ်တို့ကို ပြောပါ။',
    noMatchTitle: 'ကိုက်ညီသည့် ကိုင်း မရှိပါ',
    noMatchBody: 'ဤရှာဖွေမှုနှင့် စစ်ထုတ်မှုများနှင့် ကိုက်ညီသည့် ကိုင်း မရှိပါ။ တစ်ခုကို ဖျက်ကြည့်ပါ။',
    loadFailed: 'ကတ်တလောက် မဖွင့်နိုင်ပါ',
    loadFailedHint: 'အင်တာနက် စစ်ပြီး ထပ်ကြိုးစားပါ။',
  },

  /* ── ကိုင်း တစ်ခုချင်း ──────────────────────────────────────────────────── */

  frame: {
    back: 'ငါတို့ကိုင်း အားလုံး',
    notFound: 'ကိုင်း မတွေ့ပါ',
    notFoundBody: 'ဤ link ကို ဖွင့်ပြီးနောက် ကတ်တလောက်မှ ဖယ်ရှားခံရနိုင်ပါသည်။',
    perDozen: 'တစ်ဒါဇင် {{amount}} ကျပ်',
    chooseColours: 'C အရောင်အလိုက် အရေအတွက်',
    showColour: '{{colour}} ကို ပြရန်',
    specifications: 'အသေးစိတ်',
    dimensions: 'အတိုင်းအတာ',
    colours: 'ရနိုင်သည့် အရောင်',
    downloadAssets: 'HD ဓာတ်ပုံများ ဒေါင်းရန်',
    downloadAssetsHint:
      'ဤမော်ဒယ်၏ ဓာတ်ပုံအားလုံးကို အရည်အသွေးအပြည့်ဖြင့် သိမ်းပေးပါမည် — သင့် Facebook စာမျက်နှာ သို့မဟုတ် Telegram channel အတွက်။',
    noAssets: 'ဤကိုင်းအတွက် ဒေါင်းရန် ဓာတ်ပုံ မရှိသေးပါ။',
    assetsSaved_one: 'ဖိုင် {{count}} ခု သိမ်းပြီးပါပြီ',
    assetsSaved_other: 'ဖိုင် {{count}} ခု သိမ်းပြီးပါပြီ',
    assetsFailed_one: 'ဖိုင် {{count}} ခု မသိမ်းနိုင်ပါ',
    assetsFailed_other: 'ဖိုင် {{count}} ခု မသိမ်းနိုင်ပါ',
  },

  /* ── ခြင်းတောင်း ────────────────────────────────────────────────────────── */

  cart: {
    title: 'ခြင်းတောင်း',
    open: 'ခြင်းတောင်း ဖွင့်ရန်',
    remove: '{{code}} ကို Order မှ ဖယ်ရန်',
    reviewVoucher: 'ဘောက်ချာ ကြည့်ရန်',
    completeInVoucher: 'မပို့မီ ဘောက်ချာတွင် အချက်အလက် ဖြည့်ပါ။',
  },

  /* ── ဘောက်ချာ ───────────────────────────────────────────────────────────── */

  order: {
    title: 'လက်ကား ဘောက်ချာ',
    reference: 'ကုဒ်',
    clearAll: 'အားလုံးဖျက်',
    cleared: 'Order ကို ဖျက်လိုက်ပါပြီ။',

    linesUnavailable: 'ဤကိုင်းများ ကတ်တလောက်တွင် မရှိတော့ပါ။ မပို့မီ ကျွန်ုပ်တို့ကို အရင်မေးပါ။',
    pricingUnavailable: 'ဈေးနှုန်းများ မရနိုင်သဖြင့် အောက်ပါ စုစုပေါင်းများ မှန်ကန်ချင်မှ မှန်ပါမည်။',

    pieces: 'အလုံးရေ',
    subtotal: 'ကနဦး ပေါင်း',
    netTotal: 'ပေးရမည့် ငွေ',

    shopSection: 'ဆိုင်အချက်အလက်',
    shopSectionHint: 'ဘယ်သူ့ Order မှန်း သိရအောင် ဘောက်ချာပေါ်တွင် ပါဝင်ပါမည်။',
    fields: {
      shopName: 'ဆိုင်အမည်',
      contactName: 'ဆက်သွယ်ရန် အမည်',
      phone: 'ဖုန်း',
      location: 'မြို့နယ် / မြို့',
      note: 'မှတ်ချက်',
    },
    placeholders: {
      shopName: 'ရွှေမျက်စိ မျက်မှန်ဆိုင်',
      contactName: 'ဦးအောင်',
      phone: '09 7xx xxx xxx',
      location: 'မန္တလေး',
      note: 'ကားဂိတ်ဖြင့် ပို့ရန်၊ ထုပ်ပိုးရန် မှတ်ချက်…',
      city: 'ရန်ကုန်',
      address: 'အမှတ် ၁၂၊ ဗိုလ်ချုပ်လမ်း၊ ပန်းဘဲတန်း',
    },

    branchSection: 'ပို့ရမည့်နေရာ',
    branchSectionHint: 'ဆိုင်တစ်ခုစီကို တစ်ကြိမ်သာ သိမ်းပြီး၊ ဤ Order ဘယ်နေရာသို့ ပို့မည်ကို ရွေးပါ။',
    mainShop: 'ဆိုင်ချုပ်',
    addBranch: 'ဆိုင်ခွဲ ထပ်ထည့်ရန်',
    branchNumber: 'ဆိုင်ခွဲ {{number}}',
    branchLabel: 'ဆိုင်ခွဲ အမည်',
    branchAddress: 'လိပ်စာ',
    removeBranch: '{{branch}} ကို ဖယ်ရန်',
    shipHere: 'ဤ Order ကို {{branch}} သို့ ပို့ရန်',
    shipToLabel: 'ပို့ရမည့်နေရာ',

    paymentLabel: 'ငွေပေးချေမှု',
    paymentSection: 'ငွေပေးချေမှု',
    paymentSectionHint: 'မည်သည့် အကောင့်ကို စောင့်ရမည်ကို ကျွန်ုပ်တို့ သိရှိနိုင်ရန်။',
    chooseBank: 'မည်သည့် ဘဏ်လဲ?',
    bankRequired: 'သင့်ငွေလွှဲကို တိုက်ဆိုင်စစ်နိုင်ရန် ဘဏ်တစ်ခု ရွေးပါ။',
    creditHint: 'ဤ Order ကို ဆိုင်၏ အကြွေးစာရင်းသို့ ထည့်ပါမည်။ ဆိုင်အမည် အထက်တွင် ထည့်ထားကြောင်း သေချာပါစေ။',
    shopNameRequiredForCredit: 'ဘယ်ဆိုင်ရဲ့ အကြွေးမှန်း သိရအောင် အထက်မှာ ဆိုင်အမည် ထည့်ပါ။',

    emptyTitle: 'ဘောက်ချာ မရှိသေးပါ',
    emptyBody: 'ကိုင်းများ ရွေးပြီး အရောင်တစ်ခုချင်းစီအတွက် အရေအတွက် ထည့်ပါ။',
    emptyAction: 'ငါတို့ကိုင်း ကြည့်ရန်',
  },

  /* ── ဘောက်ချာ (Printed Document) ──────────────────────────────────────────── */

  voucher: {
    letterheadTitle: 'Plan B Vision',
    letterheadSubtitle: 'လက်ကား ဘောက်ချာ · Wholesale Voucher',
    itemColumn: 'ပစ္စည်း',
    footer: 'Thank you for your order · Telegram {{telegram}}',
  },

  /* ── Order တင်ရန် ───────────────────────────────────────────────────────── */

  dispatch: {
    title: 'Order တင်ရန်',
    hint: 'သင့် Telegram သို့မဟုတ် Viber ကို Order စာသားပါပြီးသား ဖွင့်ပေးပါမည်။ ကုဒ် {{reference}}။',
    heading: '🕶 PLAN B WHOLESALE — ORDER',
    telegram: 'Telegram ဖြင့် ပို့မည်',
    viber: 'Viber ဖြင့် ပို့မည်',
    copy: 'Order စာသား ကူးယူရန်',
    copied: 'ကူးယူပြီးပါပြီ',
    copyFailed: 'မကူးနိုင်ပါ — အောက်ပါ စာသားကို ရွေး၍ ကူးပါ။',
    preview: 'Order စာသား ကြည့်ရန်',
    tooLongTitle: 'ဤ Order သည် တစ်ချက်နှိပ် link အတွက် ရှည်လွန်းပါသည်',
    tooLongBody:
      'အောက်ပါ စာသားကို ကူးပြီး Telegram သို့မဟုတ် Viber တွင် ကူးထည့်ပါ — link ရှည်လွန်းပါက ပြတ်တောက်၍ ရောက်ပါမည်။',
    contactLine: 'Telegram {{telegram}} · Viber {{viber}}',
    saveSection: 'မိတ္တူ သိမ်းရန်',
    saveHint: 'နောင်ပို့ရန် သို့မဟုတ် မှတ်တမ်းအတွက် ဘောက်ချာကို ဖုန်းထဲ သိမ်းထားပါ။',
    saveImage: 'ဓာတ်ပုံအဖြစ် သိမ်းမည်',
    savePdf: 'PDF အဖြစ် သိမ်းမည်',
    exportSaved: 'ဘောက်ချာ သိမ်းပြီးပါပြီ',
    exportFailed: 'ဘောက်ချာ မသိမ်းနိုင်ပါ။ ကူးယူသည့် ခလုတ်ကို သုံးကြည့်ပါ။',
  },

  /* ── ဝန်ထမ်း ────────────────────────────────────────────────────────────── */

  auth: {
    signInTitle: 'အကောင့် ဝင်ရန်',
    signInDescription:
      'မဝင်လည်း ရပါသည် — ကြည့်ရှုပြီး Order တင်နိုင်ပါသည်။ ဝင်ထားပါက သင့် Order ကို အမည်ဖြင့် သိရှိနိုင်ပါသည်။',
    signedInTitle: 'ဝင်ပြီးပါပြီ',
    signedInDescription: 'ပုံမှန်အတိုင်း Order တင်နိုင်ပါသည်။ အချက်အလက်များကို ဤစက်တွင် သိမ်းထားပါသည်။',
    signedInFallbackName: 'အကောင့် ဝင်ထားသူ',
    signOut: 'ထွက်မည်',
    openAdmin: 'ကတ်တလောက် စီမံရန် ဖွင့်မည်',
    orContinueWith: 'သို့မဟုတ်',
    continueWithGoogle: 'Google ဖြင့် ဆက်လုပ်ရန်',
    emailLabel: 'အီးမေးလ်',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'စကားဝှက်',
    showPassword: 'စကားဝှက် ပြရန်',
    hidePassword: 'စကားဝှက် ဖုံးရန်',
    forgotPassword: 'စကားဝှက် မေ့နေပါသလား?',
    resetEmailSent: 'ထိုအီးမေးလ်ဖြင့် အကောင့်ရှိပါက ပြန်လည်သတ်မှတ်ရန် link ပို့ပြီးပါပြီ။',
    backToCatalog: 'ငါတို့ကိုင်း သို့ ပြန်သွားရန်',

    errors: {
      generic: 'တစ်ခုခု မှားယွင်းသွားပါသည်။ ထပ်ကြိုးစားပါ။',
      emailRequired: 'အီးမေးလ် ထည့်ပါ။',
      invalidEmail: 'ထိုအီးမေးလ် ပုံစံ မမှန်ပါ။',
      invalidCredential: 'အီးမေးလ် သို့မဟုတ် စကားဝှက် မှားနေပါသည်။',
      missingPassword: 'စကားဝှက် ထည့်ပါ။',
      userDisabled: 'ဤအကောင့်ကို ပိတ်ထားပါသည်။',
      tooManyRequests: 'အကြိမ်များစွာ ကြိုးစားထားပါသည်။ မိနစ်အနည်းငယ် စောင့်ပြီး ထပ်ကြိုးစားပါ။',
      network: 'အင်တာနက် မရှိပါ။ စစ်ပြီး ထပ်ကြိုးစားပါ။',
      popupClosed: 'ဝင်ရန် ဝင်းဒိုးသည် မပြီးမီ ပိတ်သွားပါသည်။',
      popupBlocked: 'Browser က ဝင်းဒိုးကို ပိတ်ထားပါသည်။ pop-up ခွင့်ပြုပြီး ထပ်ကြိုးစားပါ။',
      accountExists: 'ဤအီးမေးလ်ကို အခြားနည်းဖြင့် မှတ်ပုံတင်ထားပြီးဖြစ်ပါသည်။',
      operationNotAllowed: 'ထိုဝင်ရောက်နည်းကို ဤ project တွင် ဖွင့်မထားပါ။',
      unauthorizedDomain: 'ဤဆိုက်သည် Firebase ခွင့်ပြု domain စာရင်းတွင် မပါပါ။',
    },
  },

  admin: {
    edit: {
      action: 'ပြင်ရန်',
      addPhotos: 'ပုံထည့်ရန်',
      heading: '{{code}} ကို ပြင်နေသည်',
      note: 'အောက်ပါအချက်များကို ပြင်ပြီး သိမ်းပါ။ သိမ်းပြီးသားပုံများကို မဖျက်မချင်း ဆက်ရှိနေပါမည်။',
      posNote:
        'ဤကိုင်းသည် POS မှ လာသည်။ ပုံ၊ အမည်နှင့် ဖော်ပြချက်ကို ဤနေရာတွင် ထည့်ပါ — ဈေးနှုန်း၊ အရောင်နှင့် လက်ကျန်တို့ကို POS အတိုင်း ဆက်ပြပါမည်။',
      variantsNote: 'အရောင်တိုင်းတွင် ပုံထည့်နိုင်သည်။ ပုံအသစ်များသည် သိမ်းပြီးသားပုံများ၏ နောက်တွင် ရှိပါမည်။',
      savedPhotos_one: 'သိမ်းပြီးသားပုံ {{count}} ပုံ',
      savedPhotos_other: 'သိမ်းပြီးသားပုံ {{count}} ပုံ',
      removePhoto: '{{code}} ၏ ပုံ {{number}} ကို ဖယ်ရန်',
      backToFrames: 'ကိုင်းစာရင်းသို့ ပြန်သွားရန်',
      notFound: 'ထိုကိုင်း မရှိတော့ပါ။',
    },
    title: 'ကတ်တလောက် စီမံရန်',
    subtitle: 'ကိုင်းများ တင်ရန်၊ ဝယ်သူများ မြင်ရမည့်အရာကို စီမံရန်။',
    tabs: { upload: 'တင်ရန်', frames: 'ကိုင်းများ', credit: 'အကြွေး', seed: 'နမူနာ' },

    notAdminTitle: 'ကတ်တလောက် ခွင့်ပြုချက် မရှိပါ',
    buyerNotAdminBody:
      'ဤနေရာသည် ကိုင်းများ တင်သည့် ဆိုင်ဝန်ထမ်းများအတွက် ဖြစ်ပါသည်။ သင့်အကောင့်သည် ကြည့်ရှုခြင်းနှင့် Order တင်ခြင်းအတွက် ပုံမှန် အလုပ်လုပ်နေပါသည် — ပြဿနာ မရှိပါ။',
    notAdminBody:
      'သင့်အကောင့် ဝင်ပြီးဖြစ်သော်လည်း ဝန်ထမ်းစာရင်းတွင် မပါပါ။ Firebase console တွင် အဆင့် ၃ ဆင့်ဖြင့် ထည့်နိုင်ပါသည်။',
    step1: 'ဤ project ၏ Firebase console ကို ဖွင့်ပြီး Firestore Database သို့ သွားပါ။',
    step2: '`admins` collection ဖန်တီးပြီး၊ အောက်ပါ uid ကို document ID အဖြစ် ထားသည့် စာရွက် ဖန်တီးပါ။',
    step3: 'Rules များ deploy လုပ်ပြီး ဤစာမျက်နှာကို ပြန်ဖွင့်ပါ။',
    yourUid: 'သင့် uid',
    copyUid: 'uid ကူးရန်',
    copied: 'ကူးပြီးပါပြီ',
    deployRulesNote:
      'Firestore နှင့် Storage rules များကို သီးခြား deploy လုပ်ရသည်ကို သတိရပါ — `firebase deploy --only firestore:rules,storage`။',

    claimTitle: 'ခွင့်ပြုချက်ကို အမြဲတမ်း ဖြစ်စေရန်',
    claimBody:
      'သင်သည် bootstrap အီးမေးလ်စာရင်းဖြင့် ဝင်ထားခြင်းဖြစ်သည်။ စာရင်းပြောင်းလဲသည့်တိုင် ဆက်ရရှိရန် admins မှတ်တမ်း သိမ်းပါ။',
    claimAction: 'admin မှတ်တမ်း သိမ်းမည်',
    claimFailed: 'မသိမ်းနိုင်ပါ။ Firestore rules deploy လုပ်ထားမှု စစ်ပါ။',

    sectionFrame: 'ကိုင်း',
    brandLabel: 'အမှတ်တံဆိပ်',
    frameCodeLabel: 'မော်ဒယ် ကုဒ်',
    frameCodeHint: 'ကိုင်းတံပေါ်တွင် ရေးထားသည့် ကုဒ်။',
    slugPreview: '{{slug}} အဖြစ် သိမ်းပါမည်',
    nameLabel: 'အမည်',
    nameHint: 'ဖြည့်စရာမလို။ မဖြည့်ပါက အမှတ်တံဆိပ် + ကုဒ် ကို သုံးပါမည်။',
    priceLabel: 'တစ်လုံး လက်ကားဈေး (ကျပ်)',
    priceHint: 'လျှော့ငွေ မတွက်မီ တစ်လုံးဈေး။',
    descriptionLabel: 'အသေးစိတ်',
    descriptionPlaceholder: 'ဂျိုင့်အမျိုးအစား၊ မှန်အကျယ်၊ ထုပ်ပိုးမှတ်ချက်…',

    sectionAttributes: 'စစ်ထုတ်ရန် အချက်များ',
    attributesNote: 'ဤနှစ်ချက်ဖြင့် ဝယ်သူများက ကတ်တလောက်ကို စစ်ထုတ်ပါမည်။',
    categoryLabel: 'အမျိုးအစား',
    categoryHint: 'တစ်မော်ဒယ်လျှင် တစ်ခုသာ။ အားလုံးဝတ်နိုင်ပါက Unisex ရွေးပါ။',
    materialLabel: 'ပစ္စည်း',
    materialHint: 'ကော် + Tit ဆိုသည်မှာ ကော်ရှေ့ခံ + Tit တံ ဖြစ်သည်။',
    shapeLabel: 'ပုံသဏ္ဌာန်',
    shapeHint: 'ခြောက်ထောင့် စသည့် ထောင့်ပါသော ရှေ့ခံများအတွက် ထောင့်ပုံစံ ကို သုံးပါ။',

    stockLabel: 'ရရှိနိုင်မှု',
    stockHint: 'ဝယ်သူများကို ပြောမည့်အရာ — ပစ္စည်းရှိ၊ နည်းနေ၊ သို့မဟုတ် မရောက်သေး။',
    sectionMeasurements: 'အတိုင်းအတာများ',
    measurementsNote:
      'ကိုင်းတံအတွင်း ရိုက်ထားသည့် နံပါတ်များ။ ဖြည့်စရာမလို — မတိုင်းရသေးပါက ချန်ထားပါ။',
    lensWidthLabel: 'မှန်အကျယ် (mm)',
    bridgeLabel: 'နှာကြား (mm)',
    templeLabel: 'ကိုင်းတံ (mm)',
    weightLabel: 'အလေးချိန် (g)',

    sectionVariants: 'အရောင်များ',
    variantsNote: 'C နံပါတ်တစ်ခုလျှင် တစ်ကွက်။ တစ်ခုစီ ဓာတ်ပုံ {{min}} ပုံ အနည်းဆုံး လိုသည်။',
    addVariant: 'အရောင် ထပ်ထည့်',
    variantHeading: 'အရောင် {{index}} — {{code}}',
    removeVariant: 'အရောင် {{code}} ကို ဖယ်ရန်',
    untitledVariant: 'ဤအရောင်',
    cNumberLabel: 'C နံပါတ်',
    colorNameLabel: 'အရောင် အမည်',
    swatchLabel: 'အရောင်နမူနာ',
    imagesLabel: '{{code}} အတွက် ဓာတ်ပုံများ',
    videosLabel: '{{code}} အတွက် ဗီဒီယို',
    inStockLabel: 'လက်ကျန်ရှိ — ဝယ်သူများ ဤအရောင် မှာနိုင်သည်',

    addImages: 'ဓာတ်ပုံ ထည့်ရန်',
    addVideo: 'ဗီဒီယို ထည့်ရန်',
    removeImage: 'ဓာတ်ပုံ ဖယ်ရန်',
    removeVideo: 'ဗီဒီယို ဖယ်ရန်',
    mainImage: 'ပင်မ',
    imageCount: 'ဓာတ်ပုံ {{count}} ပုံ',
    imageHint: 'JPEG သို့မဟုတ် PNG။ မတင်မီ အလိုအလျောက် ချုံ့ပါမည်။',
    videoHint: 'တိုတိုသာ။ ကတ်အတွက် ဓာတ်ပုံတစ်ပုံ အလိုအလျောက် ယူပါမည်။',
    videoCompatWarning: 'ဤဖော်မတ်သည် ဖုန်းအားလုံးတွင် ဖွင့်၍ မရနိုင်ပါ။ MP4 (H.264) အသင့်တော်ဆုံး။',
    compressing: 'ချုံ့နေသည်…',
    readingVideo: 'ဗီဒီယို ဖတ်နေသည်…',
    keptOriginal: 'မူရင်းကို သုံးထားသည် — ချုံ့ပါက ပိုကြီးသွားသည်။',
    totalSaved: 'ချုံ့ခြင်းဖြင့် {{saved}} သက်သာသည်။',
    needMoreImages: 'ဓာတ်ပုံ အနည်းဆုံး {{min}} ပုံ ထည့်ပါ။',
    compressErrors: {
      'unsupported-type': 'ထိုဖိုင်အမျိုးအစားကို ဓာတ်ပုံအဖြစ် မသုံးနိုင်ပါ။',
      'too-large': 'ထိုဓာတ်ပုံသည် ချုံ့ပြီးသည့်တိုင် ကြီးလွန်းပါသည်။',
      'decode-failed': 'ထိုဓာတ်ပုံကို မဖတ်နိုင်ပါ။',
      'encode-failed': 'ထိုဓာတ်ပုံကို မချုံ့နိုင်ပါ။',
    },
    videoErrors: {
      'unsupported-type': 'ထိုဖိုင်အမျိုးအစားကို ဗီဒီယိုအဖြစ် မသုံးနိုင်ပါ။',
      'too-large': 'ထိုဗီဒီယိုသည် ကြီးလွန်းပါသည်။ ဖြတ်ပြီး ထပ်ကြိုးစားပါ။',
      'too-long': 'ထိုဗီဒီယိုသည် ရှည်လွန်းပါသည်။ ဖြတ်ပြီး ထပ်ကြိုးစားပါ။',
      'decode-failed': 'ထိုဗီဒီယိုကို မဖတ်နိုင်ပါ။',
    },

    publishLabel: 'ဖော်ပြရန် — ဤကိုင်းကို ကတ်တလောက်တွင် ပြမည်',
    includesCaseLabel: 'Case ပါဝင်သည်',
    bestSellerLabel: 'Best Seller စာရင်းတွင် ထည့်မည်',
    saveFrame: 'ကိုင်း သိမ်းမည်',
    uploading: 'တင်နေသည်…',
    uploadingFile: '{{total}} အနက် {{current}} ခု တင်နေသည် — {{name}}',
    uploadingPoster: '{{total}} အနက် {{current}} ခုမြောက် ပိုစတာ တင်နေသည်',
    savingRecord: 'မှတ်တမ်း သိမ်းနေသည်…',
    uploadProgressLabel: 'တင်နေမှု အခြေအနေ',
    submitNote: 'ဓာတ်ပုံများ အရင်တင်ပြီး၊ URL အားလုံး ရမှသာ မှတ်တမ်း သိမ်းပါမည်။',
    savedTitle: 'ကိုင်း သိမ်းပြီးပါပြီ',
    savedBody: '{{id}} အဖြစ် ဓာတ်ပုံ {{images}} ပုံ၊ ဗီဒီယို {{videos}} ခုနှင့် သိမ်းပြီးပါပြီ။',
    addAnother: 'နောက်ထပ် ကိုင်း ထည့်ရန်',

    noFrames: 'ကိုင်း တစ်ခုမှ မတင်ရသေးပါ',
    noFramesBody: 'တင်ရန် tab ကို သုံးပါ၊ သို့မဟုတ် နမူနာ ကတ်တလောက်ဖြင့် စမ်းကြည့်ပါ။',

    posLink: {
      title: 'POS နှင့် ညှိရန်',
      body: 'POS ထဲက ကိုင်းအားလုံးကို ဒီကတ်တလောက်ထဲ ထည့်ပြီး POS လက်ကျန်နှင့် ချိတ်ပေးပါသည်။ POS admin က ကတ်တလောက်ဖွင့်တိုင်း အလိုအလျောက် လုပ်ပါသည်၊ ယခုချက်ချင်း လုပ်ရန် နှိပ်ပါ။',
      action: 'ယခု ညှိမည်',
      needsPosAdmin: 'ဤအကောင့်ဖြင့် POS ပစ္စည်းများ ဖတ်ခွင့်မရှိပါ။ POS ADMIN role လိုအပ်ပါသည် (POS repo တွင် npm run set-role)။',
      result: 'အသစ် {{added}} · ပြင် {{updated}} · ချိတ် {{linked}}',
      synced_one: 'POS မှ ကိုင်း {{count}} ခု ထည့်/ပြင်ပြီး',
      synced_other: 'POS မှ ကိုင်း {{count}} ခု ထည့်/ပြင်ပြီး',
      ambiguous: 'ကတ်တလောက်တွင် တစ်ခုထက်ပို ရှိနေသည် — {{codes}} ကို ကိုယ်တိုင် ရှင်းပါ',
    },
    frameCount: 'ကိုင်း {{total}} မျိုး၊ ဝယ်သူများ မြင်ရသည် {{published}} မျိုး',
    hidden: 'ဖုံးထားသည်',
    variantSummary: 'အရောင် {{variants}} · ဓာတ်ပုံ {{images}} · ဗီဒီယို {{videos}}',
    publish: 'ဖော်ပြရန်',
    unpublish: 'ဖုံးရန်',
    confirmDelete: 'အပြီးအပိုင် ဖျက်မည်',
    deleteFrame: '{{name}} ကို ဖျက်ရန်',

    seedTitle: 'နမူနာ ကတ်တလောက်',
    seedBody:
      'အမျိုးအစားတိုင်း၊ ပစ္စည်းတိုင်းနှင့် အရောင်အရေအတွက် အမျိုးမျိုး ပါဝင်သည့် နမူနာစာရင်း ရေးပါမည်။',
    seedAction: 'နမူနာ ကိုင်းများ ရေးမည်',
    clearAction: 'နမူနာ ကိုင်းများ ဖျက်မည်',
    seedIdempotent: 'နှစ်ကြိမ် လုပ်လည်း အန္တရာယ်မရှိ — id သည် အမှတ်တံဆိပ်နှင့် ကုဒ်မှ ထွက်သည်။',
    currentCount: 'ယခု ကတ်တလောက်တွင် ကိုင်း {{count}} မျိုး ရှိသည်',

    errors: {
      heading_one: 'ပြင်ရန် {{count}} ချက် ရှိသည်',
      heading_other: 'ပြင်ရန် {{count}} ချက် ရှိသည်',
      brandRequired: 'အမှတ်တံဆိပ် ထည့်ပါ။',
      frameCodeRequired: 'မော်ဒယ် ကုဒ် ထည့်ပါ။',
      priceRequired: 'သုညထက် ကြီးသည့် လက်ကားဈေး ထည့်ပါ။',
      variantRequired: 'အရောင် အနည်းဆုံး တစ်ခု ထည့်ပါ။',
      cNumberRequired: 'အရောင်တိုင်းတွင် C နံပါတ် လိုအပ်သည်။',
      cNumberDuplicate: '{{code}} ကို နှစ်ကြိမ် သုံးထားသည်။ C နံပါတ်များ ထပ်၍ မရပါ။',
      needImages: '{{code}} အတွက် ဓာတ်ပုံ အနည်းဆုံး {{min}} ပုံ လိုသည်။',
      uploadFailed: 'တင်ခြင်း မအောင်မြင်ပါ ({{detail}})။ ဘာမှ မသိမ်းရသေးပါ။',
    },
  },

  history: {
    open: 'Order အဟောင်းများ',
    title: 'Order အဟောင်းများ',
    subtitle: 'ယနေ့ဈေးနှုန်းဖြင့် ပြန်မှာရန် Re-Order ကို နှိပ်ပါ။',
    reorder: 'ပြန်မှာမည်',
    reordered: 'Order {{reference}} ကို သင့်ခြင်းထဲ ထည့်ပြီးပါပြီ။',
    andMore_one: 'နှင့် နောက်ထပ် {{count}} ခု',
    andMore_other: 'နှင့် နောက်ထပ် {{count}} ခု',
    empty: 'Order အဟောင်း မရှိသေးပါ။',
    loadFailed: 'သင့် Order များ မဖွင့်နိုင်ပါ။ အင်တာနက် စစ်ပြီး ထပ်ကြိုးစားပါ။',
    signInTitle: 'Order မှတ်တမ်း သိမ်းရန် အကောင့်ဝင်ပါ',
    signInBody:
      'Order များကို သင့် Google အကောင့်တွင် သိမ်းထားသဖြင့် မည်သည့်ဖုန်းမှမဆို ပြန်မှာနိုင်ပါသည်။',
  },

  /* ── လက်ကား အကြွေး ────────────────────────────────────────────────────────── */

  credit: {
    pageTitle: 'လက်ကား ဘောက်ချာ · အကြွေး',
    pageHint: 'ဆိုင် ရွေးပြီး၊ ယနေ့ ကတ်တလောက် Order ကို ယခင်ကျန်ငွေဟောင်းနှင့် ပေါင်းစပ်ပါ။',

    shopSection: 'ဆိုင်',
    addShopToggle: 'ဆိုင်အသစ်',
    addShopAction: 'ဆိုင် သိမ်းမည်',
    shopNamePlaceholder: 'ဆိုင်အမည်',
    shopPhonePlaceholder: 'ဖုန်း',
    creditLimitPlaceholder: 'Credit Limit (Ks)',
    chooseShop: 'ဆိုင်အမည် ရွေးပါ',

    creditLimit: 'Credit Limit',
    previousBalance: 'ယခင်ကျန်ငွေဟောင်း',
    statusLabel: 'Status',
    status: {
      active: 'Active',
      'due-soon': 'Due soon',
      hold: 'ခေတ္တပိတ် (Hold)',
    },
    holdManual: 'ဝန်ထမ်းက ပိတ်ထားသည်',
    holdOverdue: '၁၄ ရက် ကျော်၍ ပေးချေမှု မရှိပါ',
    extendCycle: 'ရက် ၁၄ ရက် ထပ်ပေးမည်',
    placeManualHold: 'ဆိုင် ပိတ်မည်',
    releaseManualHold: 'ဆိုင် ပြန်ဖွင့်မည်',
    noShopsYet: 'အကြွေးဆိုင် မရှိသေးပါ။ အထက်တွင် အသစ်ထည့်ပါ။',

    voucherSection: 'ယနေ့ ဘောက်ချာ',
    noDraft: 'ကတ်တလောက်တွင် ပစ္စည်း မရွေးရသေးပါ',
    noDraftHint: 'ဤစက်ပေါ်တွင် ကတ်တလောက် ဖွင့်ပြီး ပစ္စည်း ထည့်ပါ — ဒီနေရာတွင် ပေါ်လာပါမည်။',

    voucherShopLabel: 'ဆိုင်အမည်',
    voucherNoLabel: 'Voucher No',
    voucherCurrentSubtotal: 'ယခုယူသည့် ပစ္စည်းစုစုပေါင်း',
    voucherPreviousBalance: 'ယခင်ကျန်ငွေဟောင်း',
    voucherTotalDue: 'စုစုပေါင်း ကျသင့်ငွေ',
    voucherTodayPayment: 'ယခုပေးချေသည့်ငွေ',
    voucherRemainingBalance: 'စုစုပေါင်း လက်ကျန်ငွေ',
    voucherDueDate: 'နောက်ဆုံး ဆပ်ရမည့်ရက်',
    voucherDueDateTerm: '14 Days Term',
    paymentMethod: 'Method',
    overLimitWarning: 'ဆိုင်၏ Credit Limit ထက် ကျော်နေပါသည်။',
    voucherSaved: 'ဘောက်ချာ သိမ်းပြီးပါပြီ။',
    voucherSaveFailed: 'ဘောက်ချာ မသိမ်းနိုင်ပါ။ ထပ်ကြိုးစားပါ။',

    historySection: 'ဘောက်ချာ မှတ်တမ်း',
    historyEmpty: 'ဘောက်ချာ တစ်စောင်မှ မရှိသေးပါ။',
    deleteOrder: 'ဘောက်ချာ {{reference}} ကို ဖျက်ရန်',
  },

  roles: {
    admin: 'Admin',
    sales: 'အရောင်းဝန်ထမ်း',
    shop: 'ဆိုင်',
  },

  swiper: {
    addToCart: 'ခြင်းထဲထည့်',
    added: '{{model}} {{colour}} ကို ခြင်းထဲ ထည့်ပြီး',
    carousel: 'ကိုင်း ကြည့်ရှုရန်',
    label: 'ကိုင်းများ တစ်ခုချင်း — နောက်တစ်ခုအတွက် အပေါ်သို့ ပွတ်ပါ',
    slide: 'ကိုင်း',
    position: '{{total}} ခုအနက် {{current}} — {{name}}',
    newBadge: 'အသစ်',
    colours: 'အရောင်များ',
    previous: 'ယခင်ကိုင်း',
    next: 'နောက်ကိုင်း',
    hint: 'နောက်ထပ်ကြည့်ရန် အပေါ်ပွတ်ပါ',
  },

  account: {
    title: 'အကြွေးစာရင်း',
    openDashboard: 'ကျွန်ုပ်၏ အကြွေးစာရင်း',
    available: 'အကြွေးဖြင့် ထပ်မှာယူနိုင်သည့် ပမာဏ',
    noLimit: 'ကန့်သတ်ငွေ မသတ်မှတ်ရသေး',
    loadFailed: 'စာရင်းကို ဖွင့်မရပါ။ အင်တာနက်ကို စစ်ပြီး ထပ်ကြိုးစားပါ။',
    missing: 'ဤဆိုင်ကို ရှာမတွေ့ပါ။ သင့်အကောင့်ကို စစ်ပေးရန် ရုံးသို့ ပြောပါ။',
    noAccountTitle: 'ဤအကောင့်တွင် အကြွေးစာရင်း မရှိပါ',
    noAccountBody:
      'Telegram သို့မဟုတ် Viber မှတစ်ဆင့် ဆက်လက်မှာယူနိုင်ပါသည်။ အကြွေးဖြင့် ဝယ်လိုပါက သင့်အကောင့်ကို ဆိုင်နှင့် ချိတ်ပေးရန် ရုံးသို့ ပြောပါ။',

    status: {
      ACTIVE: 'ပုံမှန်',
      WATCH: 'ပေးရန်နီးပြီ',
      OVERDUE: 'ရက်လွန်',
      LOCKED: 'ခေတ္တရပ်ဆိုင်း',
    },
    lockedManual:
      'ရုံးမှ ဤအကောင့်ကို ခေတ္တရပ်ဆိုင်းထားပါသည်။ အကြွေးမှာယူမှုအသစ်များ ရပ်ထားပါသည် — ရုံးသို့ ဆက်သွယ်ပါ။',
    lockedOverdue:
      '{{amount}} သည် 14 ရက် သက်တမ်း ကျော်လွန်နေပါသည်။ ပေးချေပြီးသည်နှင့် အကြွေးမှာယူမှု ပြန်ဖွင့်ပါမည်။',
    reminderSoon_one: 'ငွေပေးချေရန် {{count}} ရက်သာ လိုပါတော့သည် — {{amount}}',
    reminderSoon_other: 'ငွေပေးချေရန် {{count}} ရက်သာ လိုပါတော့သည် — {{amount}}',
    reminderToday: 'ယနေ့ ပေးချေရမည် — {{amount}}',
    reminderOverdue_one: '{{amount}} သည် {{count}} ရက် ကျော်လွန်နေပါပြီ',
    reminderOverdue_other: '{{amount}} သည် {{count}} ရက် ကျော်လွန်နေပါပြီ',

    limit: 'လစဉ် အကြွေးခွင့်ပြုငွေ',
    usedCredit: 'သုံးပြီး အကြွေး',
    remaining: 'ကျန်ရှိ လက်ကျန်',

    used: {
      title: 'အကြွေးသုံးစွဲမှု',
      caption: 'ခွင့်ပြုငွေမှ သုံးပြီး',
      label: 'အကြွေးခွင့်ပြုငွေ၏ {{pct}}% သုံးပြီး',
    },

    term: {
      title: 'နောက်ပေးချေရန်',
      nothingOwed: 'ပေးရန် မရှိ',
      overdueCaption_one: 'ရက် ကျော်လွန်',
      overdueCaption_other: 'ရက် ကျော်လွန်',
      dueToday: 'ယနေ့ ပေးရန်',
      daysLeftCaption_one: 'ရက် ကျန်',
      daysLeftCaption_other: 'ရက် ကျန်',
      label: 'ပေးချေရန် {{term}} ရက်အနက် {{elapsed}} ရက် ကုန်ဆုံးပြီ',
      dueDate: 'ပေးရမည့်ရက်',
      amount: 'ပမာဏ',
      voucher: 'ဘောက်ချာ',
    },

    loyalty: {
      title: 'အချိန်မှန် ပေးချေမှု',
      caption: 'အချိန်မှန်',
      label: 'မကြာသေးမီ ဘောက်ချာများ၏ {{pct}}% ကို အချိန်မှန် ပေးချေပြီး',
      noHistory: 'ပထမဆုံး ဘောက်ချာကို 14 ရက်အတွင်း ပေးချေပြီး အမှတ် စတင်ပါ။',
      summary: 'မကြာသေးမီ ဘောက်ချာ {{considered}} စောင်အနက် {{onTime}} စောင် အချိန်မှန်',
      couponReady: 'နောက်အော်ဒါတွင် {{pct}}% လျှော့',
      couponSpent: 'ကူပွန် သုံးပြီးပါပြီ။ နောက်ဘောက်ချာကို အချိန်မှန်ပေးပါက {{pct}}% ထပ်ရပါမည်။',
      howToEarn:
        'ဘောက်ချာတိုင်းကို 14 ရက်အတွင်း ပေးချေပါ — နောက်ဆုံး {{window}} စောင်လုံး အချိန်မှန်ဖြစ်ပါက နောက်အော်ဒါတွင် {{pct}}% လျှော့ပေးပါမည်။',
    },

    open: {
      title: 'မပေးရသေးသော ဘောက်ချာများ',
      empty: 'ယခု ပေးရန် မရှိပါ။',
      voucher: 'ဘောက်ချာ',
      issued: 'ထုတ်သည့်ရက်',
      due: 'ပေးရမည့်ရက်',
      balance: 'ကျန်ငွေ',
      overdueBy_one: '{{count}} ရက် နောက်ကျ',
      overdueBy_other: '{{count}} ရက် နောက်ကျ',
    },

    picker: {
      labelSales: 'သင့်ဆိုင်များ',
      labelAdmin: 'ဆိုင်',
      placeholder: 'ဆိုင်ရွေးပါ…',
      none: 'သင့်ထံ သတ်မှတ်ထားသော ဆိုင် မရှိပါ',
      loadFailed: 'ဆိုင်စာရင်း ဖွင့်မရပါ။',
      prompt: 'အကြွေးစာရင်းကြည့်ရန် ဆိုင်တစ်ဆိုင် ရွေးပါ။',
    },

    checkout: {
      title: 'အကြွေးဖြင့် မှာယူရန်',
      chooseShopFirst: 'ဤအော်ဒါသည် မည်သည့်ဆိုင်အတွက်လဲ ရွေးပါ။',
      chooseShopAction: 'ဆိုင်ရွေးရန်',
      subtotal: 'စုစုပေါင်း',
      coupon: 'အချိန်မှန် ကူပွန် ({{pct}}%)',
      total: 'အကြွေးစုစုပေါင်း',
      availableAfter: 'ဤအော်ဒါပြီးနောက် ကျန်အကြွေး',
      dueBy: 'ပေးချေရမည့်ရက်',
      place: 'အကြွေးဖြင့် မှာမည်',
      confirmPrompt: '{{shop}} ၏ အကြွေးစာရင်းသို့ {{amount}} သွင်းမည်လား?',
      confirm: 'မှာမည်',
      cancel: 'မလုပ်တော့ပါ',
      placed: 'အော်ဒါ {{voucherNo}} တင်ပြီးပါပြီ — အကြွေး {{amount}}',
      errors: {
        NOT_ALLOWED: 'ဤအကောင့်ဖြင့် အကြွေးမှာယူခွင့် မရှိပါ။',
        EMPTY: 'ဤအော်ဒါတွင် ပစ္စည်း မရှိပါ။',
        SHOP_NOT_FOUND: 'ဆိုင်ကို ရှာမတွေ့ပါ။',
        SHOP_INACTIVE: 'ဤဆိုင်ကို ပိတ်ထားပါသည်။ ရုံးသို့ ဆက်သွယ်ပါ။',
        TOO_LARGE: 'တစ်ကြိမ်တည်း မှာရန် အရေအတွက် များလွန်းပါသည်။ နှစ်ကြိမ် ခွဲမှာပါ။',
        NOT_LINKED:
          '{{code}} ကို ဂိုဒေါင်စာရင်းနှင့် မချိတ်ရသေးပါ။ Telegram ဖြင့် ပို့ပါ သို့မဟုတ် ချိတ်ပေးရန် ရုံးသို့ ပြောပါ။',
        COLOUR_NOT_IN_POS: '{{code}} {{colour}} သည် ဂိုဒေါင်စာရင်းတွင် မရှိပါ။',
        OUT_OF_STOCK: 'လက်ကျန် မလုံလောက်ပါ — {{lines}} (ရှိ / မှာ)',
        MANUAL_HOLD: 'ဤအကောင့်ကို ခေတ္တရပ်ဆိုင်းထားပါသည်။ ရုံးသို့ ဆက်သွယ်ပါ။',
        OVERDUE_LOCK: 'ဘောက်ချာတစ်စောင် 14 ရက် ကျော်လွန်နေပါသည်။ ပေးချေပြီးမှ အကြွေးဖြင့် ထပ်မှာနိုင်ပါမည်။',
        OVER_LIMIT: 'ဤအော်ဒါဖြင့် လက်ကျန် {{projected}} ဖြစ်ပြီး ခွင့်ပြုငွေ {{limit}} ကို ကျော်ပါမည်။',
        READ_FAILED: 'လက်ကျန်နှင့် အကြွေးကို စစ်မရပါ။ အင်တာနက်စစ်ပြီး ထပ်ကြိုးစားပါ။',
        WRITE_FAILED:
          'အော်ဒါ မတင်ရပါ — လက်ကျန် သို့မဟုတ် အကြွေး အခုလေးတင် ပြောင်းလဲသွားပါသည်။ ငွေ မတွက်ရသေးပါ၊ ထပ်ကြိုးစားပါ။',
      },
    },
  },

  pages: {
    notFound: {
      title: 'စာမျက်နှာ မတွေ့ပါ',
      body: 'ထို link သည် ဘယ်မှ မရောက်ပါ။ ကိုင်းများကတော့ နေရာအတိုင်း ရှိပါသည်။',
      cta: 'ငါတို့ကိုင်း သို့ ပြန်သွားရန်',
    },
  },
};
