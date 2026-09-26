/**
 * English is the source of truth for the translation shape. Every other locale
 * is typed as `TranslationSchema`, so adding a key here without translating it
 * elsewhere is a compile error rather than a silent `nav.catalog` on screen.
 *
 * ── A note on the bilingual labels ─────────────────────────────────────────
 * A handful of strings carry both languages at once — the two tab labels, the
 * skip button, the filter values. That is not an oversight. The people using
 * this are Myanmar shop owners who name frames in Burmese and read model codes
 * in English, often in the same sentence, and who may be handed the app with the
 * language set to whichever the last person chose. A tab that reads "Frames"
 * only is a tab half of them will hesitate over.
 */
export const en = {
  brand: {
    name: 'Plan B Vision',
    tagline: 'Optical frames, by the dozen',
  },

  app: {
    name: 'Plan B Vision',
    tagline: 'Optical · Trade orders',
  },

  nav: {
    catalog: 'Frames · ငါတို့ကိုင်း',
    order: 'Order · ဘောက်ချာ',
    credit: 'Credit · အကြွေး',
    skipToContent: 'Skip to main content',
    primary: 'Primary navigation',
  },

  actions: {
    signIn: 'Sign in',
    cancel: 'Cancel',
  },

  common: {
    loading: 'Loading…',
    error: 'Something went wrong',
    errorBody: 'That did not work. Please try again.',
    retry: 'Try again',
    optional: 'Optional',
    /** Appended to every money figure. Myanmar kyat has no minor unit. */
    currency: 'MMK',
  },

  theme: {
    toggle: 'Switch theme',
    label: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  },

  language: {
    toggle: 'Change language',
    label: 'Language',
  },

  /** The stored filter values. Burmese is carried in both locales, see above. */
  attributes: {
    category: {
      Male: 'Men · ကျား',
      Female: 'Women · မ',
      Kids: 'Kids · ကလေး',
      Unisex: 'Unisex',
    },
    material: {
      Titanium: 'Tit',
      Metal: 'Metal · သံ',
      TR90: 'TR90',
      Combo: 'Combo (ကော် + Tit)',
      Acetate: 'Acetate · ကော် သီးသန့်',
    },
    shape: {
      Round: 'Round',
      Square: 'Square',
      Rectangle: 'Rectangle',
      Aviator: 'Aviator',
      'Cat-Eye': 'Cat-Eye',
      Geometric: 'Geometric',
    },
    stock: {
      'in-stock': 'In Stock',
      'low-stock': 'Low Stock',
      'pre-order': 'Pre-Order',
    },
  },

  payment: {
    methods: {
      kpay: 'KPay',
      'bank-transfer': 'Bank Transfer',
      cod: 'Cash on Delivery',
      credit: 'Credit',
    },
  },

  /* ── First launch ────────────────────────────────────────────────────────── */

  onboarding: {
    title: 'How to order',
    subtitle: 'A spoken guide in Burmese, about 50 seconds.',
    start: 'Start ordering',
    next: 'Next',
    /** Both languages, deliberately — this is the escape hatch. */
    skip: 'Skip / ကျော်မည်',
    dontShowAgain: "Don't show this again",
    replay: 'Watch how to order again',
    stepCounter: 'Step {{current}} of {{total}}',
    goToStep: 'Go to step {{number}}',
    steps: {
      signIn: {
        title: 'Sign in first',
        body: 'Signed out you can look at every frame, but you cannot add one to an order.',
      },
      browse: {
        title: 'Pick a frame and its C-colours',
        body: 'Tap a frame to open it, then use + and − against each C-number.',
      },
      send: {
        title: 'Send it on Telegram',
        body: 'Tap the bag at the bottom right, then send the order on Telegram or Viber. It opens your own app with everything written out.',
      },
    },
  },

  /* ── Catalogue ───────────────────────────────────────────────────────────── */

  catalog: {
    seriesLabel: 'Frame names',
    all: 'All · အားလုံး',
    filterCategory: 'Who it is for · ဘယ်သူ့အတွက်',
    filterMaterial: 'Material · ပစ္စည်း',
    filterShape: 'Shape · ပုံသဏ္ဌာန်',
    filtersTitle: 'Filters · စစ်ထုတ်ရန်',
    openFilters: 'Show filters',

    searchLabel: 'Search the catalogue',
    searchPlaceholder: 'Model code, colour, material…',
    clearSearch: 'Clear search',

    tabAll: 'All frames · အားလုံး',
    tabSaved: 'Saved · သိမ်းထား',
    save: 'Save {{name}}',
    unsave: 'Remove {{name}} from saved',
    noSavedTitle: 'Nothing saved yet',
    noSavedBody: 'Tap the heart on any frame to keep it here for later.',
    emptyAction: 'Open catalogue admin',

    zoom: 'Enlarge photo of {{name}}',
    closePreview: 'Close preview',
    previousPhoto: 'Previous photo',
    nextPhoto: 'Next photo',
    photoNumber: 'Photo {{number}}',

    perPiece: '/pc',
    colorCount_one: '{{count}} colour',
    colorCount_other: '{{count}} colours',
    pieces_one: '{{count}} pc',
    pieces_other: '{{count}} pcs',

    increase: 'Add one {{color}}',
    decrease: 'Remove one {{color}}',
    quantityFor: 'Quantity for {{color}}',

    enterQuantities: 'Enter quantities',
    noColors: 'No colours are in stock for this model.',
    takeFullSet: 'Take one of every colour',
    fullSetApplied: 'Full set',
    clearLine: 'Clear',

    draftTotal: 'Order total',
    viewVoucher: 'Voucher · ဘောက်ချာ',
    showing: 'Showing {{shown}} of {{total}} models',

    modelLabel: 'Model',
    buyNow: 'Buy now',
    chooseColour: 'Choose a colour',
    selectColour: 'Select',
    unitPrice: 'Price',
    doneAdding: 'View the cart',
    bestSellerBadge: 'Best seller',
    includesCase: 'Includes case',

    signInToShop: 'Sign In to Shop',
    signInToOrder: 'Sign in to add frames to an order. You can browse without one.',

    clearFilters: 'Clear filters',
    emptyTitle: 'No frames yet',
    emptyBody: 'The catalogue is empty. Ask us to upload this season’s models.',
    noMatchTitle: 'Nothing matches',
    noMatchBody: 'No model fits this search and these filters. Try clearing one of them.',
    loadFailed: 'Could not load the catalogue',
    loadFailedHint: 'Check your connection and try again.',
  },

  /* ── One frame ───────────────────────────────────────────────────────────── */

  frame: {
    back: 'All frames · ငါတို့ကိုင်း',
    notFound: 'Frame not found',
    notFoundBody: 'It may have been removed from the catalogue since you opened this link.',
    perDozen: '{{amount}} MMK per dozen',
    chooseColours: 'Quantities by C-colour · အရောင်အလိုက်',
    showColour: 'Show {{colour}}',
    specifications: 'Specifications · အသေးစိတ်',
    dimensions: 'Dimensions',
    colours: 'Colours available',
    downloadAssets: 'Download HD photos · ဓာတ်ပုံ ဒေါင်းရန်',
    downloadAssetsHint:
      'Saves every photo of this model at full resolution, for your own Facebook page or Telegram channel.',
    noAssets: 'This frame has no photos to download yet.',
    assetsSaved_one: '{{count}} file saved',
    assetsSaved_other: '{{count}} files saved',
    assetsFailed_one: '{{count}} file could not be saved',
    assetsFailed_other: '{{count}} files could not be saved',
  },

  /* ── Floating cart ───────────────────────────────────────────────────────── */

  cart: {
    title: 'Your cart',
    open: 'Open the cart',
    remove: 'Remove {{code}} from the order',
    reviewVoucher: 'Review the voucher',
    completeInVoucher: 'Fill in the missing details on the voucher before sending.',
  },

  /* ── Voucher ─────────────────────────────────────────────────────────────── */

  order: {
    title: 'Wholesale voucher · ဘောက်ချာ',
    reference: 'Ref',
    clearAll: 'Clear',
    cleared: 'Order cleared.',

    linesUnavailable:
      'These models are no longer in the catalogue. Ask us before sending this order.',
    pricingUnavailable: 'Prices could not be loaded, so the totals below may be out of date.',

    pieces: 'Pieces',
    subtotal: 'Subtotal',
    netTotal: 'Total',

    shopSection: 'Your shop · ဆိုင်အချက်အလက်',
    shopSectionHint: 'Printed on the voucher so we know who the order is from.',
    fields: {
      shopName: 'Shop name',
      contactName: 'Contact',
      phone: 'Phone',
      location: 'Township / City',
      note: 'Note',
    },
    placeholders: {
      shopName: 'Golden Eye Optical',
      contactName: 'U Aung',
      phone: '09 7xx xxx xxx',
      location: 'Mandalay',
      note: 'Delivery by bus, packing notes…',
      city: 'Yangon',
      address: 'No. 12, Bogyoke Road, Pabedan',
    },

    branchSection: 'Deliver to · ပို့ရမည့်နေရာ',
    branchSectionHint: 'Save each shop once, then pick where this order goes.',
    mainShop: 'Main shop',
    addBranch: 'Add a branch',
    branchNumber: 'Branch {{number}}',
    branchLabel: 'Branch name',
    branchAddress: 'Street address',
    removeBranch: 'Remove {{branch}}',
    shipHere: 'Ship this order to {{branch}}',
    shipToLabel: 'Deliver to',

    paymentLabel: 'Payment',
    paymentSection: 'Payment · ငွေပေးချေမှု',
    paymentSectionHint: 'Tells us which account to watch for your transfer.',
    chooseBank: 'Which bank?',
    bankRequired: 'Choose a bank so we can match your transfer.',
    creditHint:
      'This order goes on the shop’s account. Our staff will confirm the balance with you separately — make sure the shop name above is filled in.',
    shopNameRequiredForCredit: 'Enter the shop name above so we know whose account this is.',

    emptyTitle: 'No order yet · ဘောက်ချာ မရှိသေးပါ',
    emptyBody: 'Pick some frames and enter how many of each colour you want.',
    emptyAction: 'Browse frames · ငါတို့ကိုင်း',
  },

  /* ── The printed voucher document ───────────────────────────────────────── */

  voucher: {
    letterheadTitle: 'Plan B Vision',
    letterheadSubtitle: 'Wholesale Voucher · လက်ကား ဘောက်ချာ',
    itemColumn: 'Item',
    footer: 'Thank you for your order · Telegram {{telegram}}',
  },

  /* ── Dispatch ────────────────────────────────────────────────────────────── */

  dispatch: {
    title: 'Send the order · Order တင်ရန်',
    hint: 'Opens your own Telegram or Viber with the order written out. Ref {{reference}}.',
    /** First line of the sent message. */
    heading: '🕶 PLAN B WHOLESALE — ORDER',
    telegram: 'Send on Telegram',
    viber: 'Send on Viber',
    copy: 'Copy the order text',
    copied: 'Order copied',
    copyFailed: 'Could not copy — select the text below instead.',
    preview: 'Show the order text',
    tooLongTitle: 'This order is too long for a one-tap link',
    tooLongBody:
      'Copy the text below and paste it into Telegram or Viber — a link this long would arrive cut off.',
    contactLine: 'Telegram {{telegram}} · Viber {{viber}}',
    saveSection: 'Keep a copy · မိတ္တူ သိမ်းရန်',
    saveHint: 'Save the voucher to your phone to send later or file with your records.',
    saveImage: 'Save as image',
    savePdf: 'Save as PDF',
    exportSaved: 'Voucher saved',
    exportFailed: 'Could not save the voucher. Try the copy button instead.',
  },

  /* ── Staff ───────────────────────────────────────────────────────────────── */

  auth: {
    signInTitle: 'Sign in',
    signInDescription:
      'Optional — you can browse and order without one. Signing in lets us put a name to your order.',
    signedInTitle: 'Signed in',
    signedInDescription: 'You can order as normal. Your details are saved on this device.',
    signedInFallbackName: 'Signed-in user',
    signOut: 'Sign out',
    openAdmin: 'Open catalogue admin',
    orContinueWith: 'or',
    continueWithGoogle: 'Continue with Google',
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'Password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    forgotPassword: 'Forgot your password?',
    resetEmailSent: 'If that address has an account, a reset link is on its way.',
    backToCatalog: 'Back to the frames · ငါတို့ကိုင်း',

    errors: {
      generic: 'Something went wrong. Please try again.',
      emailRequired: 'Enter your email address.',
      invalidEmail: 'That email address does not look right.',
      invalidCredential: 'Wrong email or password.',
      missingPassword: 'Enter your password.',
      userDisabled: 'This account has been disabled.',
      tooManyRequests: 'Too many attempts. Wait a few minutes and try again.',
      network: 'No connection. Check your internet and try again.',
      popupClosed: 'The sign-in window closed before it finished.',
      popupBlocked: 'Your browser blocked the sign-in window. Allow pop-ups and try again.',
      accountExists: 'This email is already registered with a different sign-in method.',
      operationNotAllowed: 'That sign-in method is not enabled for this project.',
      unauthorizedDomain: 'This site is not on the Firebase authorised domains list.',
    },
  },

  admin: {
    edit: {
      action: 'Edit',
      addPhotos: 'Add photos',
      heading: 'Editing {{code}}',
      note: 'Change anything below and save. Photos already saved stay unless you remove them.',
      posNote:
        'This frame comes from the POS. Add photos, a name and a description here — price, colours and stock keep following the POS.',
      variantsNote: 'Add photos to any colour. New photos go after the ones already saved.',
      savedPhotos_one: '{{count}} saved photo',
      savedPhotos_other: '{{count}} saved photos',
      removePhoto: 'Remove photo {{number}} of {{code}}',
      backToFrames: 'Back to frames',
      notFound: 'That frame no longer exists.',
    },
    title: 'Catalogue admin',
    subtitle: 'Upload frames, manage what buyers can see.',
    tabs: { upload: 'Upload', frames: 'Frames', credit: 'Credit', seed: 'Sample data' },

    notAdminTitle: 'You do not have catalogue access',
    buyerNotAdminBody:
      'This area is for shop staff who upload frames. Your account works normally for browsing and ordering — nothing is wrong.',
    notAdminBody:
      'Your account is signed in but is not on the staff list. Adding it takes three steps in the Firebase console.',
    step1: 'Open the Firebase console for this project and go to Firestore Database.',
    step2: 'Create a collection called `admins`, and in it a document whose ID is the uid below.',
    step3: 'Deploy the rules, then reload this page.',
    yourUid: 'Your uid',
    copyUid: 'Copy uid',
    copied: 'Copied',
    deployRulesNote:
      'Remember that Firestore and Storage rules deploy separately — `firebase deploy --only firestore:rules,storage`.',

    claimTitle: 'Make your access permanent',
    claimBody:
      'You are in through the bootstrap email list. Save an admins record so access survives that list being changed.',
    claimAction: 'Save admin record',
    claimFailed: 'That did not save. Check the Firestore rules are deployed.',

    sectionFrame: 'Frame',
    brandLabel: 'Brand',
    frameCodeLabel: 'Model code',
    frameCodeHint: 'The code on the temple arm.',
    slugPreview: 'Saves as {{slug}}',
    nameLabel: 'Name',
    nameHint: 'Optional. Falls back to brand + model code.',
    priceLabel: 'Wholesale price per piece (MMK)',
    priceHint: 'Trade price for one frame, before any discount.',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'Hinge type, lens width, packing notes…',

    sectionAttributes: 'Filters',
    attributesNote: 'These two values are what buyers filter the catalogue by.',
    categoryLabel: 'Category',
    categoryHint: 'One shelf per model. Use Unisex when it suits anyone.',
    materialLabel: 'Material',
    materialHint: 'Combo is an acetate front on titanium temples.',
    shapeLabel: 'Shape',
    shapeHint: 'Use Geometric for hexagons and other angular fronts.',

    stockLabel: 'Availability',
    stockHint: 'What buyers are told: in stock, running low, or not landed yet.',
    sectionMeasurements: 'Measurements',
    measurementsNote:
      'The numbers stamped inside the temple arm. Optional — leave blank if the frame has not been measured.',
    lensWidthLabel: 'Lens width (mm)',
    bridgeLabel: 'Bridge (mm)',
    templeLabel: 'Temple (mm)',
    weightLabel: 'Weight (g)',

    sectionVariants: 'Colours',
    variantsNote: 'One block per C-number. At least {{min}} photos each.',
    addVariant: 'Add colour',
    variantHeading: 'Colour {{index}} — {{code}}',
    removeVariant: 'Remove colour {{code}}',
    untitledVariant: 'this colour',
    cNumberLabel: 'C-number',
    colorNameLabel: 'Colour name',
    swatchLabel: 'Swatch',
    imagesLabel: 'Photos for {{code}}',
    videosLabel: 'Video for {{code}}',
    inStockLabel: 'In stock — buyers can order this colour',

    addImages: 'Add photos',
    addVideo: 'Add a video',
    removeImage: 'Remove photo',
    removeVideo: 'Remove video',
    mainImage: 'Main',
    imageCount: '{{count}} photo(s)',
    imageHint: 'JPEG or PNG. Compressed automatically before upload.',
    videoHint: 'Short clips only. A still frame is taken for the card.',
    videoCompatWarning: 'This format may not play on every phone. MP4 (H.264) is safest.',
    compressing: 'Compressing…',
    readingVideo: 'Reading video…',
    keptOriginal: 'Kept the original — compressing made it larger.',
    totalSaved: 'Saved {{saved}} by compressing.',
    needMoreImages: 'Add at least {{min}} photos.',
    /* Keys match `CompressErrorCode` in `lib/media/compress-image.ts`. */
    compressErrors: {
      'unsupported-type': 'That file type is not a photo we can use.',
      'too-large': 'That photo is too large, even after compressing.',
      'decode-failed': 'That photo could not be read.',
      'encode-failed': 'That photo could not be compressed.',
    },
    /* Keys match `VideoErrorCode` in `lib/media/video.ts`. */
    videoErrors: {
      'unsupported-type': 'That file type is not a video we can use.',
      'too-large': 'That video is too large. Trim it and try again.',
      'too-long': 'That video is too long. Trim it and try again.',
      'decode-failed': 'That video could not be read.',
    },

    publishLabel: 'Publish — show this frame in the catalogue',
    includesCaseLabel: 'Case included — ships with a case and the usual accessories',
    bestSellerLabel: 'Add to the Best Sellers shelf',
    saveFrame: 'Save frame',
    uploading: 'Uploading…',
    uploadingFile: 'Uploading {{current}} of {{total}} — {{name}}',
    uploadingPoster: 'Uploading poster {{current}} of {{total}}',
    savingRecord: 'Saving the record…',
    uploadProgressLabel: 'Upload progress',
    submitNote: 'Photos upload first; the record is written only once every URL is known.',
    savedTitle: 'Frame saved',
    savedBody: 'Saved as {{id}} with {{images}} photos and {{videos}} videos.',
    addAnother: 'Add another frame',

    noFrames: 'No frames uploaded yet',
    noFramesBody: 'Use the Upload tab, or seed the sample catalogue to try the app.',

    posLink: {
      title: 'Sync with the POS',
      body: 'Adds every POS frame to this catalogue and links it to POS stock. Runs by itself when a POS admin opens the catalogue; press to run it now.',
      action: 'Sync now',
      needsPosAdmin: 'This account cannot read POS products. It needs the POS ADMIN role (npm run set-role in the POS repo).',
      result: '{{added}} added · {{updated}} updated · {{linked}} linked',
      synced_one: '{{count}} frame updated from the POS',
      synced_other: '{{count}} frames updated from the POS',
      ambiguous: 'More than one catalogue entry for: {{codes}} — tidy these by hand',
    },
    frameCount: '{{total}} frames, {{published}} visible to buyers',
    hidden: 'Hidden',
    variantSummary: '{{variants}} colours · {{images}} photos · {{videos}} videos',
    publish: 'Publish',
    unpublish: 'Hide',
    confirmDelete: 'Delete for good',
    deleteFrame: 'Delete {{name}}',

    seedTitle: 'Sample catalogue',
    seedBody:
      'Writes a demonstration range covering every category, every material and a range of assortment sizes.',
    seedAction: 'Write sample frames',
    clearAction: 'Remove sample frames',
    seedIdempotent: 'Safe to run twice — ids are derived from brand and model code.',
    currentCount: '{{count}} frames in the catalogue now',

    errors: {
      heading_one: 'There is {{count}} problem to fix',
      heading_other: 'There are {{count}} problems to fix',
      brandRequired: 'Enter a brand.',
      frameCodeRequired: 'Enter a model code.',
      priceRequired: 'Enter a wholesale price above zero.',
      variantRequired: 'Add at least one colour.',
      cNumberRequired: 'Every colour needs a C-number.',
      cNumberDuplicate: '{{code}} is used twice. C-numbers must be unique.',
      needImages: '{{code}} needs at least {{min}} photos.',
      uploadFailed: 'The upload failed ({{detail}}). Nothing was saved.',
    },
  },

  history: {
    open: 'Past orders · Order အဟောင်းများ',
    title: 'Past orders · Order အဟောင်းများ',
    subtitle: 'Tap Re-Order to load one back into your cart at today’s prices.',
    reorder: 'Re-Order',
    reordered: 'Order {{reference}} loaded into your cart.',
    andMore_one: 'and {{count}} more line',
    andMore_other: 'and {{count}} more lines',
    empty: 'No past orders yet.',
    loadFailed: 'Could not load your orders. Check your connection and try again.',
    signInTitle: 'Sign in to keep your order history',
    signInBody:
      'Orders are saved to your Google account so you can re-order them from any phone.',
  },

  /* ── Wholesale credit ledger ────────────────────────────────────────────── */

  credit: {
    pageTitle: 'Wholesale credit voucher',
    pageHint: 'Pick a shop, fold today’s catalogue order into their running balance, and send.',

    shopSection: 'Shop · ဆိုင်',
    addShopToggle: 'New shop',
    addShopAction: 'Save shop',
    shopNamePlaceholder: 'Shop name',
    shopPhonePlaceholder: 'Phone',
    creditLimitPlaceholder: 'Credit limit (Ks)',
    chooseShop: 'Choose a shop…',

    creditLimit: 'Credit limit',
    previousBalance: 'Previous balance · ယခင်ကျန်ငွေဟောင်း',
    statusLabel: 'Status',
    status: {
      active: 'Active',
      'due-soon': 'Due soon',
      hold: 'On hold',
    },
    holdManual: 'Held by staff',
    holdOverdue: 'Cycle expired unpaid',
    extendCycle: 'Grant a fresh 14-day cycle',
    placeManualHold: 'Place on hold',
    releaseManualHold: 'Release hold',
    noShopsYet: 'No credit shops yet. Add one above to get started.',

    voucherSection: 'Today’s voucher',
    noDraft: 'No items in the draft cart',
    noDraftHint: 'Browse the catalogue on this device and add items — they will appear here.',

    voucherShopLabel: 'Shop',
    voucherNoLabel: 'Voucher No',
    voucherCurrentSubtotal: 'Current subtotal',
    voucherPreviousBalance: 'Previous balance',
    voucherTotalDue: 'Total amount due',
    voucherTodayPayment: 'Today’s payment',
    voucherRemainingBalance: 'Remaining balance',
    voucherDueDate: 'Due date',
    voucherDueDateTerm: '14-day term',
    paymentMethod: 'Method',
    overLimitWarning: 'This exceeds the shop’s credit limit.',
    voucherSaved: 'Voucher saved — balance updated.',
    voucherSaveFailed: 'Could not save the voucher. The balance was NOT updated — try again.',

    historySection: 'Voucher history',
    historyEmpty: 'No vouchers issued yet.',
    deleteOrder: 'Delete voucher {{reference}}',
  },

  /* ── Roles, as shown on the account card ─────────────────────────────────── */

  roles: {
    admin: 'Admin',
    sales: 'Sales rep',
    shop: 'Shop',
  },

  /* ── The one-frame-per-screen catalogue ─────────────────────────────────── */

  swiper: {
    addToCart: 'Add to cart',
    added: '{{model}} {{colour}} added to the cart',
    carousel: 'frame viewer',
    label: 'Frames, one at a time — swipe up for the next',
    slide: 'frame',
    position: '{{current}} of {{total}}: {{name}}',
    newBadge: 'New',
    colours: 'Colours',
    previous: 'Previous frame',
    next: 'Next frame',
    hint: 'Swipe up for more',
  },

  /* ── The shop's credit account (shared with the POS) ────────────────────── */

  account: {
    title: 'Credit account · အကြွေးစာရင်း',
    openDashboard: 'My credit account',
    available: 'Available to order on credit',
    noLimit: 'No limit set',
    loadFailed: 'Could not load this account. Check your connection and try again.',
    missing: 'This shop could not be found. Ask the office to check your account.',
    noAccountTitle: 'No credit account on this login',
    noAccountBody:
      'You can still order and send it over Telegram or Viber. To buy on credit, ask the office to link your login to your shop.',

    status: {
      ACTIVE: 'Good standing',
      WATCH: 'Due soon',
      OVERDUE: 'Overdue',
      LOCKED: 'On hold',
    },
    lockedManual:
      'The office has put this account on hold. New credit orders are paused — please contact the office.',
    lockedOverdue:
      '{{amount}} is past the 14-day term. Credit orders resume as soon as it is paid.',
    reminderSoon_one: 'Payment due in {{count}} day: {{amount}}',
    reminderSoon_other: 'Payment due in {{count}} days: {{amount}}',
    reminderToday: 'Payment due today: {{amount}}',
    reminderOverdue_one: '{{amount}} is {{count}} day overdue',
    reminderOverdue_other: '{{amount}} is {{count}} days overdue',

    limit: 'Monthly credit limit',
    usedCredit: 'Used credit',
    remaining: 'Remaining balance',

    used: {
      title: 'Credit used',
      caption: 'of limit used',
      label: '{{pct}}% of the credit limit used',
    },

    term: {
      title: 'Next payment',
      nothingOwed: 'Nothing owed',
      overdueCaption_one: 'day overdue',
      overdueCaption_other: 'days overdue',
      dueToday: 'due today',
      daysLeftCaption_one: 'day left',
      daysLeftCaption_other: 'days left',
      label: '{{elapsed}} of {{term}} days of the payment term used',
      dueDate: 'Due date',
      amount: 'Amount',
      voucher: 'Voucher',
    },

    loyalty: {
      title: 'On-time payments',
      caption: 'on time',
      label: '{{pct}}% of recent bills paid on time',
      noHistory: 'Pay your first bill within 14 days to start your score.',
      summary: '{{onTime}} of {{considered}} recent bills paid on time',
      couponReady: '{{pct}}% off your next order',
      couponSpent: 'Coupon used. Pay your next bill on time to earn another {{pct}}% off.',
      howToEarn:
        'Pay every bill within 14 days — your last {{window}} all on time — and your next order gets {{pct}}% off.',
    },

    open: {
      title: 'Open vouchers',
      empty: 'Nothing owed right now.',
      voucher: 'Voucher',
      issued: 'Issued',
      due: 'Due',
      balance: 'Balance',
      overdueBy_one: '{{count}} day late',
      overdueBy_other: '{{count}} days late',
    },

    picker: {
      labelSales: 'Your shops',
      labelAdmin: 'Shop',
      placeholder: 'Choose a shop…',
      none: 'No shops are assigned to you',
      loadFailed: 'Could not load your shops.',
      prompt: 'Choose a shop to see its credit.',
    },

    checkout: {
      title: 'Order on credit · အကြွေးဖြင့် မှာယူရန်',
      chooseShopFirst: 'Choose which shop this order is for.',
      chooseShopAction: 'Choose a shop',
      subtotal: 'Subtotal',
      coupon: 'On-time coupon ({{pct}}%)',
      total: 'Total on credit',
      availableAfter: 'Credit left after this order',
      dueBy: 'Pay by',
      place: 'Order on credit',
      confirmPrompt: 'Bill {{amount}} to {{shop}}?',
      confirm: 'Yes, place order',
      cancel: 'Cancel',
      placed: 'Order {{voucherNo}} placed — {{amount}} on credit.',
      errors: {
        NOT_ALLOWED: 'This account cannot order on credit.',
        EMPTY: 'There is nothing in this order.',
        SHOP_NOT_FOUND: 'This shop could not be found.',
        SHOP_INACTIVE: 'This shop is no longer active. Contact the office.',
        TOO_LARGE: 'This order has too many lines to place at once. Split it into two.',
        NOT_LINKED:
          '{{code}} is not linked to warehouse stock yet. Send this order over Telegram, or ask the office to link it.',
        COLOUR_NOT_IN_POS: '{{code}} {{colour}} is not in warehouse stock.',
        OUT_OF_STOCK: 'Not enough stock: {{lines}} (in stock / asked).',
        MANUAL_HOLD: 'This account is on hold. Contact the office.',
        OVERDUE_LOCK: 'A bill is past the 14-day term. Pay it to order on credit again.',
        OVER_LIMIT: 'This order would take the balance to {{projected}}, over the {{limit}} limit.',
        READ_FAILED: 'Could not check stock and credit. Check your connection and try again.',
        WRITE_FAILED:
          'The order was not placed — stock or credit changed a moment ago. Nothing was charged; please try again.',
      },
    },
  },

  pages: {
    notFound: {
      title: 'Page not found',
      body: 'That link does not lead anywhere. The frames are where they always are.',
      cta: 'Back to the frames',
    },
  },
} as const;

/**
 * `as const` gives every value a literal type, which is what makes `t()` keys
 * autocomplete — but a literal type would force other locales to repeat the
 * English strings verbatim. Widening the leaves back to `string` keeps the
 * *shape* enforced while leaving the *content* free.
 */
type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> };

export type TranslationSchema = Widen<typeof en>;
