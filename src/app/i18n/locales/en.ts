/**
 * English is the source of truth for the translation shape. Every other locale
 * is typed as `TranslationSchema`, so adding a key here without translating it
 * elsewhere is a compile error rather than a silent `nav.shop` on screen.
 */
export const en = {
  brand: {
    name: 'Plan B Vision',
    tagline: 'See clearly. Look like yourself.',
    shortDescription:
      'Prescription eyewear, honestly priced. Frames chosen for your face — fitted, glazed and cared for by real opticians.',
  },

  nav: {
    home: 'Home',
    shop: 'Shop',
    lookbook: 'Lookbook',
    eyeCare: 'Eye Care',
    booking: 'Book a Visit',
    about: 'About',
    contact: 'Contact',
    account: 'Account',
    admin: 'Admin',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    skipToContent: 'Skip to main content',
    primaryLabel: 'Primary navigation',
  },

  actions: {
    signIn: 'Sign in',
    signUp: 'Sign up',
    signOut: 'Sign out',
    search: 'Search',
    searchPlaceholder: 'Search frames, brands or frame codes',
    cart: 'Cart',
    wishlist: 'Wishlist',
    compare: 'Compare',
    subscribe: 'Subscribe',
    bookAppointment: 'Book an appointment',
    shopNow: 'Shop now',
    learnMore: 'Learn more',
    viewAll: 'View all',
    back: 'Back',
    backHome: 'Back to home',
    next: 'Next',
    save: 'Save',
    cancel: 'Cancel',
    apply: 'Apply',
    clear: 'Clear',
    retry: 'Try again',
  },

  theme: {
    label: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    toggle: 'Switch theme',
  },

  language: {
    label: 'Language',
    english: 'English',
    myanmar: 'မြန်မာ',
    toggle: 'Switch language',
  },

  header: {
    announcement: 'Free frame fitting in store · Nationwide delivery across Myanmar',
    /**
     * i18next plural forms. The `_one` / `_other` suffixes are chosen by i18next
     * from the active language's CLDR rules, so English gets "1 frame saved" and
     * "2 frames saved" instead of the "1 frames saved" a single string produced.
     *
     * Burmese has only an "other" category in CLDR, so its `_one` entry is never
     * selected — it exists because `TranslationSchema` requires both locales to
     * have the same shape, and an unused key is cheaper than an exception.
     */
    itemsInCart_one: '{{count}} item in cart',
    itemsInCart_other: '{{count}} items in cart',
    itemsSaved_one: '{{count}} frame saved',
    itemsSaved_other: '{{count}} frames saved',
  },

  footer: {
    shop: 'Shop',
    company: 'Company',
    quickLinks: 'Quick links',
    customerService: 'Customer service',
    newsletter: 'Newsletter',
    newsletterPitch: 'New collections, eye-care tips and member-only offers. No spam.',
    emailPlaceholder: 'Your email address',
    faq: 'FAQ',
    shippingReturns: 'Shipping & returns',
    warranty: 'Warranty',
    sizeGuide: 'Size guide',
    prescriptionGuide: 'Prescription guide',
    privacy: 'Privacy policy',
    terms: 'Terms of service',
    visitUs: 'Visit our store',
    address: 'Yangon, Myanmar',
    hours: 'Open daily, 9:00 – 20:00',
    rights: 'All rights reserved.',
    madeWith: 'Independent optical, made in Myanmar.',
  },

  common: {
    loading: 'Loading…',
    error: 'Something went wrong',
    errorBody: 'We could not load this section. Please try again.',
    empty: 'Nothing here yet',
    comingSoon: 'Coming soon',
    points: 'points',
    from: 'from',
    currency: 'MMK',
    required: 'Required',
    optional: 'Optional',
  },

  /**
   * Authentication and membership (Module 2).
   *
   * Error strings are written as sentences a customer can act on. Firebase's own
   * wording ("The password is invalid or the user does not have a password")
   * leaks implementation detail and, worse, tells an attacker which half of a
   * failed sign-in was wrong — so `invalidCredential` stays deliberately vague.
   */
  auth: {
    signInTitle: 'Welcome back',
    signInDescription: 'Sign in to see your orders, saved frames and points.',
    signUpTitle: 'Create your account',
    signUpDescription: 'It takes about a minute, and you start with {{points}} points.',

    methodPhone: 'Phone',
    methodEmail: 'Email',
    orContinueWith: 'or',
    continueWithGoogle: 'Continue with Google',

    phoneLabel: 'Phone number',
    phonePlaceholder: '9 771 234 567',
    phoneHint: 'Your Myanmar mobile number. We will send a 6-digit code by SMS.',
    phonePreview: 'We will text {{phone}}',
    sendCode: 'Send code',
    codeSentTo: 'Code sent to',
    changeNumber: 'Use a different number',
    codeLabel: 'Enter the 6-digit code',
    codeHint: 'It usually arrives within a few seconds.',
    verifying: 'Checking your code…',
    resendCode: 'Send a new code',
    resendIn: 'Send a new code in {{seconds}}s',
    otpReassurance:
      'We use your number to protect your account and to match your in-store visits. No marketing messages.',

    nameLabel: 'Full name',
    namePlaceholder: 'As you would like it on your order',
    emailLabel: 'Email address',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'Password',
    passwordHint: 'At least {{min}} characters.',
    confirmPasswordLabel: 'Confirm password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    forgotPassword: 'Forgot your password?',
    resetEmailSent: 'If that address has an account, a reset link is on its way.',

    noAccount: 'New to Plan B Vision?',
    haveAccount: 'Already have an account?',

    verifyPhoneTitle: 'Verify your phone number',
    verifyPhoneDescription:
      'Your phone number is your membership. Verify it to collect your {{points}} welcome points and to link your visits to the shop.',
    signedInAs: 'Signed in as {{identity}}.',
    skipForNow: 'Skip for now',
    termsNotice:
      'By creating an account you agree to our terms of service and privacy policy.',

    panelHeadline: 'One account, in store and online.',
    panelFootnote: 'We never share your number.',
    benefits: {
      points: {
        title: '{{points}} points to start',
        body: 'Earn points on every purchase and spend them on your next pair.',
      },
      inStore: {
        title: 'Recognised at the counter',
        body: 'Your phone number links your online orders to your visits to the shop.',
      },
      history: {
        title: 'Your prescriptions, kept safe',
        body: 'Reorder lenses without digging out an old receipt.',
      },
    },

    errors: {
      generic: 'Something went wrong. Please try again.',
      invalidEmail: 'That email address does not look right.',
      emailRequired: 'Please enter your email address.',
      missingPassword: 'Please enter your password.',
      passwordTooShort: 'Please use at least {{min}} characters.',
      passwordMismatch: 'The two passwords do not match.',
      invalidCredential: 'That email and password do not match an account.',
      emailInUse: 'An account already uses that email. Try signing in instead.',
      weakPassword: 'Please choose a stronger password.',
      userDisabled: 'This account has been disabled. Please contact us.',
      tooManyRequests: 'Too many attempts. Please wait a few minutes and try again.',
      network: 'No connection. Check your internet and try again.',
      popupClosed: 'The Google window closed before you finished.',
      popupBlocked: 'Your browser blocked the Google window. Allow pop-ups and try again.',
      accountExists: 'You already have an account with this email using a different sign-in method.',
      phoneInUse: 'That phone number is already linked to another account.',
      providerLinked: 'That sign-in method is already linked to your account.',
      invalidCode: 'That code is not correct. Please check it and try again.',
      codeExpired: 'That code has expired. Please send a new one.',
      invalidPhone: 'Please enter a valid Myanmar mobile number, for example 09 771 234 567.',
      quotaExceeded: 'We cannot send any more codes right now. Please try again later.',
      captchaFailed: 'The security check failed. Please reload the page and try again.',
      operationNotAllowed: 'This sign-in method is not enabled. Please contact us.',
      requiresRecentLogin: 'Please sign in again to make this change.',
      unauthorizedDomain: 'Sign-in is not allowed from this address.',
      phoneClaimed:
        'That number already belongs to another member. Please contact us so we can sort it out.',
      memberLoad: 'We could not load your membership. Please try again.',
      insufficientPoints: 'You do not have enough points for that.',
    },
  },

  /** The account area (Module 2). */
  account: {
    greeting: 'Hello, {{name}}',
    profile: 'Your details',
    signInMethods: 'Sign-in methods',

    pointsBalance: 'Points balance',
    worthValue: 'Worth {{value}} off your next order',
    minRedeem: 'Collect {{min}} points to start redeeming',
    nextTier: '{{points}} points to {{tier}}',
    tierProgressLabel: 'Progress to the next tier',
    topTier: 'You are at our highest tier. Thank you.',
    inStoreMember: 'In-store member — {{percent}}% off at the counter',
    customerNumber: 'Customer number {{number}}',

    pointsHistory: 'Points activity',
    noPointsYet: 'No points activity yet.',

    completeProfile: 'Complete your profile for {{points}} points',
    completeProfileBody:
      'Tell us your face shape and frame size so we can recommend frames that fit.',

    tiers: {
      Bronze: 'Bronze',
      Silver: 'Silver',
      Gold: 'Gold',
    },

    /** Keys match `PointsReason` in `lib/membership.ts`. */
    pointsReasons: {
      'signup-bonus': 'Welcome bonus',
      'onboarding-bonus': 'Personalisation bonus',
      purchase: 'Purchase',
      'review-bonus': 'Review bonus',
      redemption: 'Redeemed against an order',
      'in-store-sync': 'In-store purchase',
      'manual-adjustment': 'Adjustment',
    },

    providers: {
      password: 'Email and password',
      // Not keyed `google.com`: i18next splits keys on `.`, so a dotted key
      // would nest into `google` → `com`. The component maps the provider id.
      google: 'Google',
      phone: 'Phone number',
    },
  },

  /**
   * Labels for the controlled vocabularies in `lib/attributes.ts`.
   *
   * The keys are the stored Firestore values, so a product filtered by
   * `faceShape: 'Oval'` renders as "Oval" or "ဘဲဥသဏ္ဌာန်" without storing a
   * different value per language.
   */
  attributes: {
    faceShape: {
      Round: 'Round',
      Square: 'Square',
      Oval: 'Oval',
      Heart: 'Heart',
      Diamond: 'Diamond',
    },
    frameSize: {
      'Extra Small': 'Extra small',
      Small: 'Small',
      Medium: 'Medium',
      Large: 'Large',
      'Extra Large': 'Extra large',
      Custom: 'Custom',
    },
    category: {
      Men: 'Men',
      Women: 'Women',
      Kid: 'Kids',
      'New Arrival': 'New arrivals',
      'Best Seller': 'Best sellers',
    },
    material: {
      Plastic: 'Plastic',
      Metal: 'Metal',
      'Eco-friendly': 'Eco-friendly',
      Titanium: 'Titanium',
      Acetate: 'Acetate',
    },
    comfort: {
      Lightweight: 'Lightweight',
      'Adjustable nose pads': 'Adjustable nose pads',
      'Spring hinges': 'Spring hinges',
    },
    gender: {
      Male: 'Male',
      Female: 'Female',
      Other: 'Prefer not to say',
    },
  },

  /** The personalisation form (Module 3). */
  onboarding: {
    // The brief's exact reassurance, which is the point of the panel: these are
    // personal questions and the answer to "why?" has to be on screen.
    whyTitle: 'Why are we asking this?',
    whyBody:
      'To find the perfect frame that matches your unique style and face. Your answers stay private and are only used to narrow down what we show you.',

    stepCounter: 'Step {{current}} of {{total}}',
    progressLabel: 'Form progress',
    earnPoints: 'Earn {{points}} points',
    finish: 'See my frames',

    nameLabel: 'Your name',
    namePlaceholder: 'How should we greet you?',
    ageLabel: 'Your age',
    agePlaceholder: 'e.g. 32',
    ageHint: 'It helps us rule out frames cut for a different age.',

    steps: {
      about: {
        title: 'First, the basics',
        help: 'Your name goes on your order, and age helps us pick the right proportions.',
      },
      gender: {
        title: 'How do you shop?',
        help: 'This only decides which part of our range we start from. You can browse all of it at any time.',
      },
      faceShape: {
        title: 'Which face shape looks most like yours?',
        help: 'Hold your phone up like a mirror and pick the closest. Nobody is an exact match — close is enough.',
      },
      frameSize: {
        title: 'What frame size suits you?',
        help: 'If you are unsure, check the numbers printed inside the arm of glasses you already own — or pick medium and we will adjust in store.',
      },
    },

    /** Written to be checkable in a mirror, not to be anatomically precise. */
    faceShapeHints: {
      Round: 'Soft curves, similar width and height',
      Square: 'Strong jaw, straight sides',
      Oval: 'Longer than wide, gently tapered',
      Heart: 'Wider forehead, narrow chin',
      Diamond: 'Prominent cheekbones, narrow brow and chin',
    },

    frameSizeHints: {
      'Extra Small': 'Children and very petite faces',
      Small: 'Narrow faces',
      Medium: 'Fits most adults',
      Large: 'Broader faces',
      'Extra Large': 'Widest fit, or an oversized look',
      Custom: 'Measured and fitted in store',
    },

    errors: {
      nameRequired: 'Please tell us your name.',
      ageInvalid: 'Please enter an age between {{min}} and {{max}}.',
    },
  },

  /** The recommendation results (Module 3). */
  recommendations: {
    title: 'Frames for you',
    description:
      'Chosen from your answers. Face shape carries the most weight, then frame size — the two things that decide whether a frame actually suits you.',
    editAnswers: 'Edit my answers',
    loading: 'Finding your matches…',

    chips: {
      faceShape: 'Face',
      frameSize: 'Size',
      gender: 'Range',
      age: 'Age',
    },

    exactTitle: 'Your matches',
    exactSubtitle: '{{count}} frames that tick every box.',
    alternativesTitle: 'You might also like',
    alternativesSubtitle: 'Close on size or style, worth a look while you are here.',

    noExactTitle: 'No exact matches yet',
    noExactBody:
      'Nothing in the catalogue ticks every box for you right now. If you have just set the site up, the catalogue may still be empty — seed it from the admin page.',

    bonusTitle: '{{points}} points added to your account',
    bonusBody: 'Thanks for filling that in. Your points are ready to spend on your next pair.',

    /** Match reason chips on each card. Keys match `MatchReason`. */
    reasons: {
      faceShape: 'Suits your face shape',
      frameSize: 'Your frame size',
      gender: 'From your range',
      ageRange: 'Right age range',
      bestSeller: 'Best seller',
    },
  },

  /** Shop page: filters, sorting, wishlist and compare controls (Module 6). */
  shop: {
    filtersTitle: 'Filters',

    /**
     * Shop-facing facet headings.
     *
     * Not reused from `admin.*`: the admin form asks "which face shapes does this
     * frame suit?", whereas a shopper is filtering by *their own* face shape.
     * Borrowing the admin wording put "Face shapes this frame suits" above a
     * customer's filter list, which reads as the wrong question.
     */
    facets: {
      faceShape: 'Face shape',
      frameSize: 'Frame size',
      category: 'Category',
      material: 'Material',
      comfort: 'Comfort',
    },
    clearAll: 'Clear all ({{count}})',
    showResults: 'Show {{count}} frames',
    showing: 'Showing {{count}} of {{total}} frames',
    inStockOnly: 'In stock only',
    comfortHint: 'Frames with all the features you tick.',
    priceTitle: 'Price',
    minPrice: 'Lowest price',
    maxPrice: 'Highest price',
    priceRangeHint: 'Frames run from {{min}} to {{max}}.',

    sortLabel: 'Sort by',
    sort: {
      recommended: 'Recommended',
      'price-asc': 'Price: low to high',
      'price-desc': 'Price: high to low',
      newest: 'Newest arrivals',
    },

    noResults: 'No frames match those filters',
    noResultsBody: 'Try removing a filter — or widen the price range.',
    emptyCatalogue: 'The catalogue is empty',
    emptyCatalogueBody:
      'No frames have been added yet. If you are setting the site up, add one from the admin page or seed the sample catalogue.',

    addToWishlist: 'Save {{name}} to your wishlist',
    removeFromWishlist: 'Remove {{name}} from your wishlist',

    compareTray: '{{count}} of {{max}} selected to compare',
    compareNeedsTwo: 'Pick one more',
    compareFull: 'Compare list full ({{max}})',
  },

  /** Saved frames (Module 6). */
  wishlist: {
    savedCount: '{{count}} frames saved.',
    clearAll: 'Clear wishlist',
    emptyTitle: 'Nothing saved yet',
    emptyBody: 'Tap the heart on any frame to keep it here while you decide.',
    guestTitle: 'Saved on this device only',
    guestBody: 'Sign in and your list follows you to your phone and back.',
    compareThese: 'Compare saved frames',
    keepBrowsing: 'Keep browsing',
    unavailable:
      '{{count}} saved frames are no longer available and are not shown. They will disappear from your list next time you sign in.',
  },

  /** Side-by-side comparison (Module 6). */
  compare: {
    comparing: 'Comparing {{count}} frames. Highlighted rows are where they differ.',
    tableCaption: 'Frame attributes compared side by side',
    emptyTitle: 'Nothing to compare yet',
    emptyBody:
      'Tick "Compare" on up to {{max}} frames in the shop, then come back to see them side by side.',
    remove: 'Remove {{name}} from the comparison',
    differs: 'These frames differ on this',
    none: 'None',
    faceShapes: 'Suits',
    categories: 'Range',
    colours: 'Colours',
    availability: 'Availability',
    inStock: 'In stock',
  },

  /** Product cards, gallery and the detail page (Modules 3, 6 and 7). */
  product: {
    imageAlt: '{{name}} in {{color}}',
    frameCode: 'Frame {{code}}',
    colours: 'Colours',
    outOfStock: 'Out of stock',
    percentOff: '{{percent}}% off',

    galleryLabel: 'Photos and video of {{name}}',
    previousImage: 'Previous',
    nextImage: 'Next',
    imageThumb: 'Photo {{number}}',
    videoThumb: 'Video',

    notFound: 'We could not find that frame',
    notFoundBody: 'It may have been withdrawn, or the link may be out of date.',
    backToShop: 'Back to the shop',

    frameOnlyNote: 'Frame only. Lenses are added in the next step.',
    colourLabel: 'Colour',
    colourOutOfStock: 'This colour is out of stock. Ask us when it is back, or pick another.',
    chooseLenses: 'Choose lenses',
    saved: 'Saved',
    inCompare: 'Comparing',

    assurances: {
      fitting: 'Free fitting and adjustment, in store, for as long as you own them.',
      adjust: 'Every pair is glazed and checked by our own opticians.',
      verify: 'We confirm your prescription and PD before we cut the lenses.',
    },

    addToBag: 'Add to bag',
    addedToBag: 'Added to your bag',
    viewBag: 'View bag',
    bagFull: 'Your bag is full. Check out or remove something first.',

    quoteReady: 'Your quote is ready',
    quotePending:
      'Nothing is ordered yet. Telegram checkout arrives in the next update — until then, call us or bring this total in store.',
    editLenses: 'Change lens options',
  },

  /** Promo codes (Module 8). */
  promo: {
    label: 'Promo code',
    placeholder: 'e.g. WELCOME10',
    capped: '(capped at the maximum for this code)',
    belowMinimum: 'This code needs an order of {{amount}} or more.',

    errors: {
      unknown: 'We do not recognise that code.',
      expired: 'That code has expired.',
      'below-minimum': 'Your order is below the minimum for this code.',
    },

    descriptions: {
      welcome10: '10% off, up to 20,000 MMK.',
      monsoon15: '15% off, up to 30,000 MMK.',
      freeDelivery: 'Free nationwide delivery.',
      student5000: '5,000 MMK off.',
    },
  },

  /** The bag (Module 8). */
  cart: {
    count: '{{count}} in your bag.',
    emptyTitle: 'Your bag is empty',
    emptyBody: 'Choose a frame and add your lenses, and it will appear here.',
    lens: 'Lens:',
    coatings: 'Coatings:',
    rxInStore: 'Prescription to be given in store',
    removeLine: 'Remove {{name}} from your bag',
    checkout: 'Continue to checkout',
    discountsAtCheckout: 'Promo codes, points and delivery are applied at checkout.',
  },

  /** Checkout and the Telegram hand-off (Module 8). */
  checkout: {
    intro:
      'Check the details, apply any code or points, then send the order to us on Telegram. Nothing is charged here — we confirm everything with you first.',
    yourOrder: 'Your order ({{count}})',
    remove: 'Remove',
    rxInStore: 'prescription in store',
    summary: 'Summary',
    subtotal: 'Subtotal',
    promoLine: 'Promo {{code}}',
    pointsLine: 'Points ({{points}})',
    delivery: 'Delivery',
    free: 'Free',

    usePoints: 'Use {{points}} points',
    pointsWorth: 'Worth {{value}} off. You have {{balance}}.',

    fulfilmentTitle: 'How would you like it?',
    fulfilment: {
      collect: {
        title: 'Collect in store',
        body: 'We fit and adjust them properly while you wait.',
      },
      delivery: {
        title: 'Delivery',
        body: 'Nationwide, {{fee}}. Waived by some promo codes.',
      },
    },

    nameLabel: 'Name for the order',
    addressLabel: 'Delivery address',
    addressPlaceholder: 'Street, township, city — and a landmark if it helps',
    addressRequired: 'Please add a delivery address, or choose to collect in store.',
    phoneRequired: 'Add a verified phone number to your account before ordering.',
    noteLabel: 'Anything else we should know?',
    notePlaceholder: 'A deadline, a preferred call time, anything at all',

    sendViaTelegram: 'Send order on Telegram',
    telegramExplainer:
      'This opens Telegram with your order written out. You press send, and one of our team replies to confirm the details and the total before anything is made.',
    tooLong:
      'This order is too long to fit in a Telegram link. Copy it below and paste it into a message to us instead.',
    copyOrder: 'Copy the order',
    copied: 'Copied',
    previewMessage: 'See exactly what will be sent',
    clearBag: 'Empty the bag',

    messageHeading: 'Plan B Vision — new order',

    emptyTitle: 'Nothing to check out',
    emptyBody: 'Your bag is empty. Add a frame and its lenses first.',
  },

  /** Branded image download (Module 8). */
  watermark: {
    save: 'Save branded image',
    hint: 'Downloads this photo with the Plan B Vision watermark, ready to share.',
    failed: 'We could not prepare that image. Please try again.',
  },

  /** The floating help widget (Module 8). */
  help: {
    title: 'Need a hand?',
    open: 'Open help',
    close: 'Close help',
  },

  /** The prescription lens wizard (Module 7). */
  lens: {
    title: 'Prescription lenses',
    runningTotal: 'Total so far',
    finish: 'Save my lens choice',
    total: 'Total',
    fixIssues: 'Please check {{count}} fields above.',
    summaryCaption: 'Your prescription, as entered',
    incompleteWarning:
      'Some values are missing, so this quote covers the frame and lens type only. Our team will complete it with you.',

    deferTitle: 'I will bring my prescription to the shop',
    deferBody:
      'Often the better choice, especially for progressives. We quote the lenses once we have measured you.',
    deferSummary:
      'You are bringing your prescription in. We will quote the lenses in store, once we have checked your measurements.',

    steps: {
      type: {
        title: 'What kind of lenses?',
        help: 'If you are not sure, single vision is what most prescriptions need.',
      },
      prescription: {
        title: 'Your prescription',
        help: 'Copy the numbers from your prescription exactly. Leave a box empty if it is blank on yours.',
      },
      coatings: {
        title: 'Lens treatments',
        help: 'All optional. Anti-glare is the one most people notice the difference from.',
      },
      review: {
        title: 'Check and confirm',
        help: 'Have a look over the numbers before we save them.',
      },
    },

    types: {
      'single-vision': 'Single vision',
      progressive: 'Progressive',
      bifocal: 'Bifocal',
      reading: 'Reading only',
    },

    typeHints: {
      'single-vision': 'One prescription across the whole lens. The usual choice.',
      progressive: 'Distance, middle and reading in one lens, with no visible line.',
      bifocal: 'Distance and reading, with a visible dividing line.',
      reading: 'For close work only. Not for driving or walking about.',
    },

    coatings: {
      'blue-block': 'Blue light filter',
      photochromic: 'Photochromic (darkens outdoors)',
      'anti-glare': 'Anti-glare coating',
      'scratch-resistant': 'Scratch-resistant coating',
    },

    coatingHints: {
      'blue-block': 'For long days on a screen. Reduces glare from displays.',
      photochromic: 'Clear indoors, tinted in sunlight. One pair for both.',
      'anti-glare': 'Cuts reflections, so people see your eyes and not your lenses.',
      'scratch-resistant': 'Worth having if your glasses live in a bag.',
    },

    highIndex: 'Thin (high-index) lenses',
    highIndexHint: 'Thinner and lighter than standard lenses.',
    highIndexRecommended:
      'Recommended for your prescription — above ±{{threshold}}.00 a standard lens becomes thick at the edges.',

    eyes: { right: 'Right eye', left: 'Left eye' },
    eyeAbbr: { right: 'OD', left: 'OS' },

    fields: {
      sph: 'SPH',
      cyl: 'CYL',
      axis: 'AXIS',
      add: 'ADD',
      pd: 'PD',
    },

    priceLines: { frame: 'Frame' },

    issues: {
      sphRange: 'Must be between {{min}} and +{{max}}.',
      cylRange: 'Must be between {{min}} and +{{max}}.',
      axisRange: 'Whole number between {{min}} and {{max}}.',
      addRange: 'Must be between +{{min}} and +{{max}}.',
      pdRange: 'Must be between {{min}} and {{max}} mm.',
      step: 'Lenses are made in steps of 0.25.',
      axisRequired: 'Needed when CYL is filled in.',
      cylRequired: 'Needed when AXIS is filled in.',
      addRequired: 'Needed for this lens type.',
      sphRequired: 'Enter SPH for at least one eye.',
      pdRequired: 'Please give a PD, or choose to measure in store.',
    },
  },

  /** PD measurement (Module 7). */
  pd: {
    title: 'Pupillary distance (PD)',
    intro:
      'The distance between your pupils, in millimetres. It decides where the optical centre of each lens sits.',
    verifyNotice:
      'Our optical team will verify your exact PD in-store before fitting your lenses.',
    modeLabel: 'How would you like to give your PD?',
    modes: {
      known: 'I know my PD',
      measure: 'Measure it with a card',
      store: 'Measure it in store',
    },

    knownLabel: 'Your PD',
    knownHint: 'It is often written on your prescription, sometimes as two numbers added together.',
    mm: 'mm',
    increase: 'Increase',
    decrease: 'Decrease',

    steps: {
      step1: 'Hold any bank card flat against your forehead, centred, and take a photo face-on.',
      step2: 'Open the photo and measure the width of the card — in pixels, or against a ruler on screen.',
      step3: 'Measure the distance between the centres of your two pupils in the same photo, the same way.',
      step4: 'Enter both numbers below. Any unit works, as long as you use the same one twice.',
    },

    cardWidthLabel: 'Card width you measured',
    pupilGapLabel: 'Distance between pupils',
    unitsNote:
      'Units do not matter — pixels, millimetres, anything. We use the ratio, and every bank card is 85.6mm wide.',
    result: 'Your estimated PD',
    useThis: 'Use this measurement',
    impossible: 'That does not look right — a PD is normally between {{min}} and {{max}} mm. Please measure again.',
    unusual:
      'That is outside the usual {{min}}–{{max}}mm range. It may well be correct, but we will pay extra attention in store.',
    storeChosen:
      'No problem. We will measure your PD with a pupilometer when you come in — it takes a few seconds and is the most accurate method.',

    diagramAlt: 'A face with a bank card held across the forehead, showing the card width and the distance between the pupils',
    diagramCaption: 'Every bank card is exactly 85.6mm wide',

    sources: {
      card: '(measured with a card)',
      known: '(you told us)',
      'in-store': '(to be measured in store)',
    },
  },

  /** Virtual try-on (Module 7). */
  tryOn: {
    title: 'See them on your face',
    intro:
      'Add a photo and position the frame over it. It gives you a sense of the width and shape against your own face.',
    privacy:
      'Your photo stays on your device. It is never uploaded to us or to anyone else.',
    emptyTitle: 'Add a photo to start',
    emptyBody: 'A straight-on photo in good light works best.',
    uploadPhoto: 'Upload a photo',
    useCamera: 'Take a photo',
    cameraError: 'We could not open your camera. Try uploading a photo instead.',
    overlayAlt: '{{name}} positioned over your photo',
    controls: {
      size: 'Size',
      horizontal: 'Left and right',
      vertical: 'Up and down',
      rotation: 'Tilt',
    },
    reset: 'Reset position',
    removePhoto: 'Remove photo',
    caveat:
      'This is a rough guide, not a true fitting — the frame is placed by hand, not measured against your face. Come in and try the real thing before you decide.',
  },

  /** Reviews (Module 7). */
  reviews: {
    title: 'Customer reviews',
    count: '({{count}} reviews)',
    none: 'No reviews yet. Yours would be the first.',
    write: 'Write a review',
    stars: '{{rating}} out of 5',
    customerPhotos: 'Customer photos ({{count}})',
    viewPhoto: 'View photo {{number}}',
    photoDialog: 'Customer photo',
    anonymous: 'A customer',

    signInRequired: 'Please sign in to leave a review — it helps us keep them genuine.',
    ratingLabel: 'Your rating',
    titleLabel: 'Headline',
    titlePlaceholder: 'Light, and they suit my face',
    bodyLabel: 'Your review',
    bodyPlaceholder: 'How do they fit? How do they feel after a full day?',
    submit: 'Submit review',
    moderationNote:
      'We read every review before it appears, usually within a day. We publish criticism as readily as praise.',
    submitted:
      'Thank you — your review has been sent to us and will appear once we have read it, usually within a day.',
  },

  /** How to buy, and the scripted help widget (Module 7). */
  howToBuy: {
    title: 'How to buy',
    intro: 'Four steps from here to a finished pair of glasses.',

    steps: {
      choose: { title: 'Choose your frame', body: 'Pick a colour, and save any others you are torn between.' },
      lenses: { title: 'Add your lenses', body: 'Enter your prescription, or tell us you will bring it in.' },
      order: { title: 'Send us the order', body: 'We confirm the details with you before anything is cut.' },
      collect: { title: 'Collect or delivery', body: 'Fitted in store, or posted anywhere in Myanmar.' },
    },

    chatTitle: 'Quick answers',
    // Says plainly what it is. Not "assistant", not "AI".
    chatSubtitle: 'Automatic replies · a real person is one call away',
    inputLabel: 'Ask a question',
    inputPlaceholder: 'Ask about lenses, delivery, fitting…',
    send: 'Send',
    callUs: 'Call the shop',

    suggestions: {
      prescription: 'How do I enter my prescription?',
      pd: 'What is PD?',
      delivery: 'How long does delivery take?',
      visit: 'Where is your shop?',
    },

    replies: {
      greeting:
        'Hello. Ask me about lenses, PD, delivery or visiting the shop. If I cannot help, our team is on the phone during opening hours.',
      prescription:
        'Copy the numbers from your prescription exactly as written — SPH, CYL and AXIS for each eye, and ADD if you need reading correction. If you would rather not, choose "I will bring my prescription to the shop" and we will handle it in person.',
      pd: 'PD is the distance between your pupils in millimetres. You can enter it if you know it, measure it against a bank card with our guide, or leave it to us — we check it with a pupilometer before cutting any lens.',
      delivery:
        'Single-vision lenses are usually ready in 3–5 days; progressives take about a week. We deliver nationwide, or you can collect in store and we will fit them properly while you wait.',
      payment:
        'You can pay in store, by bank transfer, or by mobile wallet. We confirm the total with you before taking anything.',
      fit: 'Frame size matters more than style for comfort. Our lookbook shows which shapes suit which faces, and if a pair does not sit right we adjust it free — for as long as you own them.',
      returns:
        'If something is wrong with a pair we have made, bring it back and we will put it right. Adjustments are always free. For anything else, talk to us and we will find a fair answer.',
      visit:
        'We have one shop, in Yangon. The address and opening hours are on our booking page, where you can also reserve an eye test or a fitting.',
      fallback:
        'I am not sure about that one — I only know a few things. Please call the shop and someone will help you properly.',
    },
  },


  /** The admin area (seeder from Module 3; upload form from Module 5). */
  admin: {
    title: 'Admin',
    subtitle: 'Add frames to the catalogue, manage what customers can see.',

    tabs: {
      upload: 'Add a frame',
      frames: 'Manage frames',
      seed: 'Sample data',
    },

    /* Upload form — frame details */
    sectionFrame: 'Frame details',
    brandLabel: 'Brand',
    frameCodeLabel: 'Frame code',
    frameCodeHint: 'The code on the temple arm.',
    slugPreview: 'Saved as: {{slug}}',
    nameLabel: 'Display name',
    nameHint: 'Optional. Falls back to brand and frame code.',
    priceLabel: 'Price (MMK)',
    priceHint: 'Frame only, before lenses.',
    compareAtLabel: 'Was price (MMK)',
    compareAtHint: 'Optional. Shows a discount badge.',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'What the frame is like to wear, what it is made of, who it suits…',

    /* Upload form — attributes */
    sectionAttributes: 'Attributes',
    attributesNote:
      'Chosen from fixed lists, never typed. A hand-typed value would create a shop filter that silently matches nothing.',
    faceShapesLabel: 'Face shapes this frame suits',
    faceShapesHint: 'Pick every shape it flatters — most frames suit several.',
    categoriesLabel: 'Categories',
    categoriesHint: 'Men and Women also decide which range it appears in.',
    frameSizeLabel: 'Frame size',
    materialLabel: 'Material',
    comfortLabel: 'Comfort features',
    selectedCount: '{{count}} selected',

    /* Upload form — variants */
    sectionVariants: 'Colours (C-numbers)',
    variantsNote: 'Each colour needs at least {{min}} photos. Video is optional but recommended.',
    addVariant: 'Add a colour',
    variantHeading: 'Colour {{index}} — {{code}}',
    removeVariant: 'Remove colour {{code}}',
    cNumberLabel: 'C-number',
    colorNameLabel: 'Colour name',
    swatchLabel: 'Swatch',
    imagesLabel: 'Photos for {{code}}',
    videosLabel: 'Video for {{code}}',
    inStockLabel: 'In stock',
    untitledVariant: 'a colour with no C-number',

    /* Media picker */
    addImages: 'Add photos',
    addVideo: 'Add a video',
    compressing: 'Compressing {{done}} of {{total}}…',
    readingVideo: 'Reading video…',
    imageCount: '{{count}} added',
    needMoreImages: '{{count}} more needed',
    mainImage: 'Main',
    removeImage: 'Remove {{name}}',
    removeVideo: 'Remove {{name}}',
    keptOriginal: 'Kept original ({{size}}) — already well compressed',
    totalSaved: '{{from}} → {{to}} ({{percent}}% smaller)',
    imageHint:
      'Photos are resized to 1920px and re-encoded before upload, so they stay fast on mobile data. Location data is stripped.',
    videoHint: 'Up to {{seconds}} seconds. Record at 720p if your phone offers it.',
    videoCompatWarning: 'This format may not play for every customer. MP4 is safest.',

    compressErrors: {
      'unsupported-type': 'That file type is not an image we can use.',
      'too-large': 'That file is too big to process. Please use a smaller photo.',
      'decode-failed': 'We could not read that image.',
      'encode-failed': 'Compression failed. Please try again.',
    },

    videoErrors: {
      'unsupported-type': 'Please use an MP4 or WebM video.',
      'too-large': 'That video is too large. Please trim it or record at a lower quality.',
      'too-long': 'That video is too long. Please keep clips short.',
      'decode-failed': 'We could not read that video.',
    },

    /* Submit */
    publishLabel: 'Show this frame to customers straight away',
    saveFrame: 'Save frame',
    uploading: 'Uploading…',
    uploadingFile: 'Uploading {{current}} of {{total}} — {{name}}',
    uploadingPoster: 'Uploading video thumbnail {{current}} of {{total}}',
    savingRecord: 'Saving the frame…',
    uploadProgressLabel: 'Upload progress',
    submitNote:
      'Photos upload first, then the frame is saved — so a frame is never published with images that have not arrived yet.',
    savedTitle: 'Frame saved',
    savedBody: 'Saved as {{id}}, with {{images}} photos and {{videos}} videos.',
    addAnother: 'Add another frame',

    errors: {
      heading: '{{count}} things need fixing',
      brandRequired: 'Enter the brand.',
      frameCodeRequired: 'Enter the frame code.',
      priceRequired: 'Enter a price greater than zero.',
      compareTooLow: 'The was-price must be higher than the price.',
      faceShapeRequired: 'Choose at least one face shape.',
      categoryRequired: 'Choose at least one category.',
      variantRequired: 'Add at least one colour.',
      cNumberRequired: 'Every colour needs a C-number.',
      cNumberDuplicate: 'C-number {{code}} is used twice.',
      needImages: '{{code}} needs at least {{min}} photos.',
      uploadFailed: 'Upload failed ({{detail}}). Nothing was saved — please try again.',
    },

    /* Manage frames */
    noFrames: 'No frames yet',
    noFramesBody: 'Add one from the upload tab, or seed the sample catalogue.',
    frameCount: '{{total}} frames · {{published}} visible to customers',
    variantSummary: '{{variants}} colours · {{images}} photos · {{videos}} videos',
    hidden: 'Hidden',
    view: 'View',
    publish: 'Publish',
    unpublish: 'Hide',
    deleteFrame: 'Delete {{name}}',
    confirmDelete: 'Delete for good',

    /* Bootstrap owner: persisting access beyond the hard-coded email list */
    claimTitle: 'Make your access permanent',
    claimBody:
      'You are signed in as the owner, so access is granted by your email address. Save it to the database and it will no longer depend on that list.',
    claimAction: 'Save my access',
    claimFailed: 'Could not save that. Check the Firestore rules have been deployed.',

    /* Setup */
    deployRulesNote:
      'Two rulesets must be deployed, and they are separate commands: "firebase deploy --only firestore:rules" and "firebase deploy --only storage". The Storage one is easy to forget, and its default lets any signed-in user write to your bucket.',

    seedTitle: 'Sample catalogue',
    seedBody:
      'Writes {{count}} mock frames covering every face shape, size and material, so the recommendation engine has something to work with before real stock is uploaded.',
    currentCount: 'Frames visible to customers:',
    seedAction: 'Seed sample frames',
    clearAction: 'Remove samples',
    seedDone: 'Sample frames written.',
    clearDone: 'Sample frames removed.',
    seedIdempotent:
      'Safe to run more than once — each frame has a fixed id, so re-seeding overwrites rather than duplicating. Removing samples leaves any frames you uploaded yourself untouched.',

    notAdminTitle: 'Staff access required',
    notAdminBody:
      'Writing to the catalogue is limited to staff accounts. Grant your own account access once, in the Firebase console:',
    step1: 'Open Firestore Database in the Firebase console.',
    step2: 'Create a collection named "admins".',
    step3: 'Add a document whose ID is the uid below. It can be empty — the ID is the permission.',
    yourUid: 'Your account uid',
    copyUid: 'Copy',
    copied: 'Copied',
  },

  /** Home page sections (Module 4). */
  home: {
    fromLookbook: 'From the lookbook',

    stats: {
      tips: 'Eye-care tips',
      looks: 'Styled looks',
      fitting: 'In-store fitting',
      fittingValue: 'Free',
    },

    lookbookTitle: 'See it on a face first',
    lookbookBody:
      'The same frame reads differently on different faces. These pairings show what to expect before you order.',

    eyeCareTitle: 'Looking after your eyes',
    eyeCareBody: '{{count}} practical tips, from screen habits to when a red eye needs a doctor.',

    visitTitle: 'Come and try them on',
    visitBody:
      'Frames are easier to choose in person. Book an eye test or a fitting, or just walk in — we adjust every pair we sell, free, for as long as you own it.',
  },

  /** The New Arrivals launch teaser (Module 4). */
  countdown: {
    badge: 'New Arrivals',
    title: 'The next collection lands soon',
    body: 'Arriving {{date}}. New shapes, new colourways, and a few frames we have wanted to stock for a long time.',
    launchedTitle: 'The new collection is here',
    launchedBody: 'The latest arrivals are in store and online now.',
    previewLookbook: 'Preview the lookbook',
    shopNewArrivals: 'Shop new arrivals',
    remaining: '{{days}} days, {{hours}} hours and {{minutes}} minutes until launch',

    units: {
      days: 'Days',
      hours: 'Hours',
      minutes: 'Mins',
      seconds: 'Secs',
    },
  },

  /** Eye-care tips page (Module 4). */
  eyeCare: {
    intro:
      '{{count}} short, practical tips. Filter by subject or search for the one thing you came to check.',
    searchLabel: 'Search tips',
    searchPlaceholder: 'Search tips…',
    categoriesLabel: 'Filter by subject',
    allCategories: 'All',
    showing: 'Showing {{count}} of {{total}}',
    noResults: 'Nothing matches that',
    noResultsBody: 'Try a different word, or clear the filters to see everything.',
    disclaimer:
      'General guidance only. It is not a diagnosis and does not replace an eye examination — if something has changed about your vision, please have it looked at.',

    categories: {
      screens: 'Screens',
      sunlight: 'Sunlight',
      hygiene: 'Hygiene',
      children: 'Children',
      contacts: 'Contact lenses',
      nutrition: 'Nutrition',
      warning: 'Warning signs',
      care: 'Looking after glasses',
    },
  },

  /** Lookbook and styling guide (Module 4). */
  lookbook: {
    intro:
      'How our frames pair with real outfits, and which face shapes each one flatters. Filter by occasion or by your own face shape.',
    occasionLabel: 'Occasion',
    faceShapeLabel: 'Face shape',
    allOccasions: 'All',
    allFaceShapes: 'All',
    filteredToYou: 'Filtered to your {{shape}} face shape — clear it to see everything.',
    noResults: 'No looks match that combination',
    noResultsBody: 'Try another occasion, or clear the face-shape filter.',

    videoBadge: 'Video',
    seeDetail: 'See the detail',
    theOutfit: 'The outfit',
    whyItWorks: 'Why it works',
    suitsShapes: 'Suits',
    videoPending:
      'The clip for this look has not been filmed yet. The stills show the frame; come in or call if you would like to see it moving.',
    shopThisFrame: 'Shop {{code}}',

    occasions: {
      work: 'Work',
      weekend: 'Weekend',
      evening: 'Evening',
      outdoors: 'Outdoors',
      campus: 'Campus',
    },

    guideTitle: 'Which frame suits your face?',
    guideIntro:
      'The usual principle is contrast — angular frames soften a round face, curved frames soften an angular one. Use it as a starting point, not a rule.',
    lookFor: 'Look for:',
    avoid: 'Go carefully with:',
    guideCaveat:
      'Plenty of people suit the frame the guide says they should avoid. If you like how something looks on you, that matters more than the shape chart.',
  },

  /** Store details and appointment booking (Module 4). */
  booking: {
    intro:
      'One shop, in Yangon. Book an eye test or a frame fitting below, or just call us — we are happy to answer questions before you come in.',
    singleStoreNote: 'Our only location. Everything is fitted and glazed here.',

    address: 'Address',
    phone: 'Phone',
    hours: 'Opening hours',
    closed: 'Closed',
    openUntil: 'Open until {{time}}',
    opensAt: 'Opens at {{time}}',
    closedNow: 'Closed now',
    timezoneNote: 'All times are shop-local ({{timezone}}).',
    directions: 'Get directions',
    callShop: 'Call the shop',

    /**
     * Named rather than numbered. Numeric keys make i18next treat the object as
     * array-like, which drops them from the generated key union and breaks the
     * typed `t()`. `WEEKDAY_KEYS` in booking.tsx maps `Date.getDay()` to these.
     */
    weekdays: {
      sun: 'Sunday',
      mon: 'Monday',
      tue: 'Tuesday',
      wed: 'Wednesday',
      thu: 'Thursday',
      fri: 'Friday',
      sat: 'Saturday',
    },

    formTitle: 'Book a visit',
    formSubtitle: 'Pick what you need, a day and a time. We confirm by phone.',
    signInRequired:
      'Please sign in to book — it lets us reach you to confirm, and links the visit to your membership. You are also very welcome to call us instead.',
    orCallUs: 'Call instead',
    phoneRequired:
      'Add a verified phone number to your account first. We need a number to confirm your appointment.',

    serviceLabel: 'What do you need?',
    services: {
      'eye-test': 'Eye test',
      'frame-fitting': 'Frame fitting',
      adjustment: 'Adjustment or repair',
      collection: 'Collect an order',
    },

    dateLabel: 'Which day?',
    timeLabel: 'What time?',
    noDates: 'No slots available in the next month. Please call us.',
    noSlots: 'No slots left on that day. Try another.',
    slotNote: 'Each appointment is about {{minutes}} minutes.',
    pickSlotFirst: 'Choose a time to continue.',

    nameLabel: 'Name for the booking',
    notesLabel: 'Anything we should know?',
    notesPlaceholder: 'Current prescription, a frame you have seen, who is coming with you…',
    submit: 'Request this appointment',

    requestedTitle: 'Appointment requested',
    requestedBody: '{{service}} on {{date}} at {{time}}.',
    requestedNext:
      'This is a request, not a confirmed booking yet. We will call {{phone}} to confirm the slot — usually the same day.',
    bookAnother: 'Book another',
  },

  /** Placeholder scaffolding — each becomes a real page in its own module. */
  pages: {
    notFound: {
      title: 'Page not found',
      body: 'The page you are looking for has moved or never existed.',
      cta: 'Back to home',
    },
    placeholder: {
      badge: 'In development',
      body: 'This section is scaffolded and ready. We build it out in the next module.',
    },
    home: {
      title: 'Home',
      description: 'New arrivals, the lookbook and everything Plan B Vision is working on.',
    },
    shop: {
      title: 'Shop all frames',
      description: 'Filter by face shape, size, material and category to narrow down your fit.',
    },
    product: {
      title: 'Frame details',
      description: 'Photos, video, colour variants, lens options and reviews for a single frame.',
    },
    lookbook: {
      title: 'Lookbook & styling guide',
      description: 'How our frames pair with different outfits, occasions and face shapes.',
    },
    eyeCare: {
      title: 'Eye care tips & tricks',
      description: 'Everyday habits that keep your eyes comfortable and your lenses clear.',
    },
    booking: {
      title: 'Book an eye test',
      description: 'Reserve a slot for an eye test or an in-store frame fitting.',
    },
    about: {
      title: 'About Plan B Vision',
      description: 'Who we are, how we price our lenses and why we do it this way.',
    },
    contact: {
      title: 'Contact us',
      description: 'Questions about a frame, an order or your prescription — we answer fast.',
    },
    signIn: {
      title: 'Sign in',
      description: 'Access your orders, wishlist and loyalty points.',
    },
    signUp: {
      title: 'Create your account',
      description: 'Join the membership and start earning points from your first visit.',
    },
    onboarding: {
      title: 'Personalise your fit',
      description: 'A short form so we can recommend frames that suit your face and style.',
    },
    account: {
      title: 'My account',
      description: 'Your profile, prescriptions, orders and loyalty points in one place.',
    },
    wishlist: {
      title: 'My wishlist',
      description: 'Frames you have saved, ready to compare or buy.',
    },
    compare: {
      title: 'Compare frames',
      description: 'Put your saved frames side by side and pick the winner.',
    },
    cart: {
      title: 'Your bag',
      description: 'Review your frames, lens choices and prescription before checkout.',
    },
    checkout: {
      title: 'Checkout',
      description: 'Apply a promo code or points, then confirm your order via Telegram.',
    },
    admin: {
      title: 'Admin — product upload',
      description: 'Add frames, colour variants, photos and video clips to the catalogue.',
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

