/**
 * Fifty eye-care tips, in English and Burmese.
 *
 * ── Why these are data and not locale strings ──────────────────────────────
 * The locale files hold UI *chrome* — labels, buttons, error messages — and are
 * organised so a translator can work through them screen by screen. These are
 * editorial content: fifty paired paragraphs that only make sense read
 * side by side, and that the shop will want to add to over time. Keeping each
 * tip's two languages adjacent means a translation can be checked against its
 * source without opening two files and counting array indices.
 *
 * Products are handled the same way, for the same reason.
 *
 * ── On accuracy ────────────────────────────────────────────────────────────
 * This is general advice, deliberately conservative. Nothing here diagnoses,
 * recommends a treatment, or names a medicine. The `warning` category tells
 * people when to see someone rather than what they have — a shop's website is
 * the wrong place to attempt the second, and the UI carries a standing
 * disclaimer to that effect.
 */

export const TIP_CATEGORIES = [
  'screens',
  'sunlight',
  'hygiene',
  'children',
  'contacts',
  'nutrition',
  'warning',
  'care',
] as const;

export type TipCategory = (typeof TIP_CATEGORIES)[number];

export type EyeCareTip = {
  id: string;
  category: TipCategory;
  en: { title: string; body: string };
  my: { title: string; body: string };
};

export const EYE_CARE_TIPS: EyeCareTip[] = [
  /* ── Screens ─────────────────────────────────────────────────────────── */
  {
    id: 'screens-20-20-20',
    category: 'screens',
    en: {
      title: 'Follow the 20-20-20 rule',
      body: 'Every 20 minutes, look at something about 20 feet away for 20 seconds. It lets the focusing muscle inside your eye relax before it starts to ache.',
    },
    my: {
      title: '20-20-20 စည်းမျဉ်းကို လိုက်နာပါ',
      body: 'မိနစ် 20 တိုင်း၊ ပေ 20 ခန့်အကွာရှိ အရာတစ်ခုကို စက္ကန့် 20 ကြည့်ပါ။ မျက်လုံးအတွင်းရှိ ကြွက်သားများ အနားရစေပါသည်။',
    },
  },
  {
    id: 'screens-blink',
    category: 'screens',
    en: {
      title: 'Blink on purpose at a screen',
      body: 'People blink up to two-thirds less when reading a screen, which is why eyes feel gritty by evening. A few deliberate full blinks spread the tear film again.',
    },
    my: {
      title: 'ဖန်သားပြင် ကြည့်စဉ် မျက်တောင်ခတ်ရန် သတိရပါ',
      body: 'ဖန်သားပြင် ကြည့်စဉ် မျက်တောင်ခတ်နှုန်း သုံးပုံနှစ်ပုံအထိ လျော့သွားတတ်သည်။ ထို့ကြောင့် ညနေပိုင်းတွင် မျက်လုံး ခြောက်သွေ့တတ်သည်။ တမင်တကာ အပြည့်ခတ်ပေးပါ။',
    },
  },
  {
    id: 'screens-distance',
    category: 'screens',
    en: {
      title: 'Keep an arm’s length from your monitor',
      body: 'About 50–70 cm, with the top of the screen at or just below eye level so your gaze angles slightly downward.',
    },
    my: {
      title: 'မော်နီတာနှင့် လက်တစ်ဖျား အကွာ ထားပါ',
      body: 'စင်တီမီတာ 50–70 ခန့် ခွာပါ။ ဖန်သားပြင် အထက်ပိုင်းကို မျက်လုံးအမြင့် သို့မဟုတ် အနည်းငယ် နိမ့်အောင် ထားပါ။',
    },
  },
  {
    id: 'screens-brightness',
    category: 'screens',
    en: {
      title: 'Match your screen to the room',
      body: 'A screen much brighter or dimmer than its surroundings forces constant adjustment. It should look about as bright as a sheet of white paper on your desk.',
    },
    my: {
      title: 'ဖန်သားပြင် အလင်းကို အခန်းနှင့် ညှိပါ',
      body: 'ပတ်ဝန်းကျင်ထက် အလွန်လင်းသော သို့မဟုတ် မှိန်သော ဖန်သားပြင်သည် မျက်လုံးကို အဆက်မပြတ် ချိန်ညှိစေသည်။ စားပွဲပေါ်ရှိ စက္ကူဖြူတစ်ရွက်လောက် လင်းသင့်သည်။',
    },
  },
  {
    id: 'screens-glare',
    category: 'screens',
    en: {
      title: 'Move the glare, not your head',
      body: 'Position your screen at right angles to a window rather than facing it. Tilting your head to dodge a reflection all day causes neck strain as well as tired eyes.',
    },
    my: {
      title: 'အလင်းရောင် ပြန်ဟပ်မှုကို ရှောင်ပါ',
      body: 'ဖန်သားပြင်ကို ပြတင်းပေါက်နှင့် ထောင့်မှန်ကျအောင် ထားပါ။ တစ်နေကုန် ခေါင်းစောင်း၍ ရှောင်နေရလျှင် လည်ပင်းလည်း နာတတ်သည်။',
    },
  },
  {
    id: 'screens-text-size',
    category: 'screens',
    en: {
      title: 'Enlarge text before you lean in',
      body: 'If you are moving closer to read, the text is too small. Increasing the size costs nothing and stops the slouch that follows.',
    },
    my: {
      title: 'ငုံ့မကြည့်ခင် စာလုံး ချဲ့ပါ',
      body: 'ဖတ်ရန် ပိုနီးကပ်နေရလျှင် စာလုံး သေးလွန်းနေပြီ။ စာလုံးအရွယ် ချဲ့ခြင်းက အလွယ်ဆုံး ဖြေရှင်းနည်း ဖြစ်သည်။',
    },
  },
  {
    id: 'screens-night',
    category: 'screens',
    en: {
      title: 'Dim screens in the last hour before bed',
      body: 'Bright light late in the evening delays sleep for many people. Warmer colour settings and lower brightness help more than any single filter.',
    },
    my: {
      title: 'အိပ်ရာမဝင်မီ တစ်နာရီအလို ဖန်သားပြင် မှိန်ပါ',
      body: 'ညနေပိုင်း အလင်းပြင်းခြင်းသည် အိပ်ချိန်ကို နောက်ကျစေတတ်သည်။ အရောင်နွေးအောင် ပြောင်း၍ အလင်းလျှော့ခြင်းက အထိရောက်ဆုံး ဖြစ်သည်။',
    },
  },
  {
    id: 'screens-breaks',
    category: 'screens',
    en: {
      title: 'Stand up every hour',
      body: 'A short walk changes your focusing distance, blink rate and posture all at once — more effective than any exercise you can do sitting still.',
    },
    my: {
      title: 'တစ်နာရီတစ်ကြိမ် ထ၍ လမ်းလျှောက်ပါ',
      body: 'ခဏလမ်းလျှောက်ခြင်းက အာရုံစိုက်သည့် အကွာအဝေး၊ မျက်တောင်ခတ်နှုန်းနှင့် ကိုယ်ဟန်အားလုံးကို တစ်ပြိုင်တည်း ပြောင်းပေးသည်။',
    },
  },

  /* ── Sunlight ────────────────────────────────────────────────────────── */
  {
    id: 'sun-uv400',
    category: 'sunlight',
    en: {
      title: 'Look for UV400, not just dark lenses',
      body: 'Tint and protection are unrelated. A dark lens without a UV filter opens your pupil wider and lets more ultraviolet in than no sunglasses at all.',
    },
    my: {
      title: 'အရောင်ရင့်ရုံမျှမဟုတ်၊ UV400 ကို ရှာပါ',
      body: 'အရောင်ရင့်ခြင်းနှင့် UV ကာကွယ်ခြင်းသည် မသက်ဆိုင်ပါ။ UV စစ်ထုတ်မှု မပါဘဲ အရောင်ရင့်သော မှန်သည် မျက်ဆံကို ပိုပွင့်စေ၍ UV ပိုဝင်စေသည်။',
    },
  },
  {
    id: 'sun-cloudy',
    category: 'sunlight',
    en: {
      title: 'Cloud does not stop ultraviolet',
      body: 'A large share of UV passes straight through cloud cover. Overcast days in the hot season still warrant sunglasses outdoors.',
    },
    my: {
      title: 'တိမ်ထူသည့်နေ့တွင်လည်း UV ရှိသည်',
      body: 'UV ရောင်ခြည် အများစုသည် တိမ်ကို ဖြတ်ဝင်နိုင်သည်။ နေပူရာသီတွင် တိမ်ထူသည့်နေ့များ၌လည်း နေကာမျက်မှန် တပ်သင့်သည်။',
    },
  },
  {
    id: 'sun-water-sand',
    category: 'sunlight',
    en: {
      title: 'Water and sand double the exposure',
      body: 'Both reflect a lot of light upward, under the rim of a hat. Wrap-around frames help far more than flat ones at the beach.',
    },
    my: {
      title: 'ရေနှင့် သဲက အလင်းကို ပြန်ဟပ်သည်',
      body: 'ရေနှင့် သဲသည် အလင်းကို အထက်သို့ ပြန်ဟပ်ပြီး ဦးထုပ်အောက်မှ ဝင်သည်။ ကမ်းခြေတွင် ဘေးပတ်လည် ဖုံးသော မှန်က ပိုကောင်းသည်။',
    },
  },
  {
    id: 'sun-children-uv',
    category: 'sunlight',
    en: {
      title: 'Children need UV protection most',
      body: 'A child’s lens is clearer than an adult’s, so more ultraviolet reaches the back of the eye. Much of a lifetime’s exposure happens before adulthood.',
    },
    my: {
      title: 'ကလေးများသည် UV ကာကွယ်မှု အလိုအပ်ဆုံး',
      body: 'ကလေး၏ မျက်လုံးမှန်ဘီလူးသည် လူကြီးထက် ကြည်လင်သဖြင့် UV ပိုဝင်သည်။ တစ်သက်တာ UV ထိတွေ့မှု အများစုသည် ငယ်စဉ်ကာလတွင် ဖြစ်သည်။',
    },
  },
  {
    id: 'sun-hat',
    category: 'sunlight',
    en: {
      title: 'A wide brim adds real protection',
      body: 'A brimmed hat cuts a meaningful amount of the light reaching your eyes from above, and works alongside sunglasses rather than instead of them.',
    },
    my: {
      title: 'ဦးထုပ် ဆောင်းပါ',
      body: 'အနားကျယ်သော ဦးထုပ်သည် အထက်မှ ကျရောက်သော အလင်းကို သိသိသာသာ လျှော့ချပေးသည်။ နေကာမျက်မှန်နှင့် တွဲသုံးပါ။',
    },
  },
  {
    id: 'sun-never-stare',
    category: 'sunlight',
    en: {
      title: 'Never look directly at the sun',
      body: 'Not through sunglasses, exposed film or smoked glass, and not during an eclipse. The damage is painless while it happens and can be permanent.',
    },
    my: {
      title: 'နေကို တိုက်ရိုက် မကြည့်ပါနှင့်',
      body: 'နေကာမျက်မှန်ဖြင့်ဖြစ်စေ၊ ဖလင်ဖြင့်ဖြစ်စေ မကြည့်ပါနှင့်။ နေကြတ်ချိန်တွင်လည်း မကြည့်ပါနှင့်။ ထိခိုက်မှုသည် နာကျင်မှု မရှိဘဲ အမြဲတမ်း ဖြစ်နိုင်သည်။',
    },
  },

  /* ── Hygiene ─────────────────────────────────────────────────────────── */
  {
    id: 'hygiene-hands',
    category: 'hygiene',
    en: {
      title: 'Wash your hands before touching your eyes',
      body: 'The most common route for conjunctivitis is a hand, not the air. This matters twice as much if you wear contact lenses.',
    },
    my: {
      title: 'မျက်လုံး မကိုင်မီ လက်ဆေးပါ',
      body: 'မျက်စိရောင်ရောဂါ ကူးစက်ရာတွင် အဖြစ်များဆုံးမှာ လက်မှ ဖြစ်သည်။ ကွန်တက်မှန် တပ်သူများ ပို၍ ဂရုစိုက်ရန် လိုသည်။',
    },
  },
  {
    id: 'hygiene-no-rubbing',
    category: 'hygiene',
    en: {
      title: 'Try not to rub itchy eyes',
      body: 'Rubbing releases more of what makes them itch and can worsen the cornea over years. A cool compress settles it faster.',
    },
    my: {
      title: 'မျက်လုံး မပွတ်ပါနှင့်',
      body: 'ပွတ်ခြင်းက ယားစေသည့် ဓာတ်ကို ပိုထုတ်စေပြီး နှစ်ရှည်လျှင် မျက်ကြည်လွှာကို ထိခိုက်စေနိုင်သည်။ အအေးကပ်ပေးခြင်းက ပိုမြန်သည်။',
    },
  },
  {
    id: 'hygiene-towels',
    category: 'hygiene',
    en: {
      title: 'Keep your own face towel',
      body: 'Sharing a towel or pillowcase is how eye infections travel through a household. Separate them at the first sign of redness.',
    },
    my: {
      title: 'မျက်နှာသုတ်ပုဝါ သီးသန့် သုံးပါ',
      body: 'ပုဝါ သို့မဟုတ် ခေါင်းအုံးစွပ် မျှသုံးခြင်းက အိမ်တွင်း မျက်စိကူးစက်မှု ဖြစ်စေသည်။ မျက်စိနီသည်နှင့် ခွဲသုံးပါ။',
    },
  },
  {
    id: 'hygiene-makeup',
    category: 'hygiene',
    en: {
      title: 'Replace eye make-up every few months',
      body: 'Mascara and liner pick up bacteria from the lash line. Three months is a reasonable limit, and never share or top up with water.',
    },
    my: {
      title: 'မျက်လုံး အလှကုန် အလဲအလှယ် လုပ်ပါ',
      body: 'မာစကာရာနှင့် မျက်ခုံးဆေးတွင် ဘက်တီးရီးယား စုတတ်သည်။ သုံးလခန့်တွင် လဲပါ။ သူများနှင့် မမျှဝေပါနှင့်၊ ရေမထည့်ပါနှင့်။',
    },
  },
  {
    id: 'hygiene-remove-makeup',
    category: 'hygiene',
    en: {
      title: 'Take eye make-up off before sleeping',
      body: 'Residue left overnight blocks the small oil glands along the lid margin, which is a common cause of morning grittiness.',
    },
    my: {
      title: 'အိပ်ရာမဝင်မီ မျက်လုံး အလှကုန် ဖျက်ပါ',
      body: 'ညအိပ်စဉ် ကျန်နေသော အလှကုန်သည် မျက်ခွံနားရှိ ဆီထုတ်အကျိတ်များကို ပိတ်ဆို့စေပြီး နံနက်ခင်း မျက်စိခြောက်စေသည်။',
    },
  },
  {
    id: 'hygiene-clean-glasses',
    category: 'hygiene',
    en: {
      title: 'Clean lenses wet, never dry',
      body: 'Rinse first, then use a drop of mild soap and a microfibre cloth. Wiping dust off a dry lens with a shirt is what puts the fine scratches there.',
    },
    my: {
      title: 'မှန်ကို စိုစွတ်စွာ သန့်ရှင်းပါ',
      body: 'ရေဖြင့် အရင်ဆေးပြီး ဆပ်ပြာအနည်းငယ်နှင့် microfibre အဝတ်ဖြင့် သုတ်ပါ။ ခြောက်သွေ့စွာ အင်္ကျီဖြင့် သုတ်ခြင်းက မှန်ကို ခြစ်ရာ ဖြစ်စေသည်။',
    },
  },

  /* ── Children ────────────────────────────────────────────────────────── */
  {
    id: 'children-outdoor',
    category: 'children',
    en: {
      title: 'Two hours outdoors a day slows short-sightedness',
      body: 'This is one of the better-supported findings in children’s eye health. Daylight itself appears to be the active ingredient, not the activity.',
    },
    my: {
      title: 'ကလေးများကို နေ့စဉ် နှစ်နာရီ အပြင်ထွက် ကစားစေပါ',
      body: 'ကလေးများ အမြင်တိုခြင်း နှေးကွေးစေရန် အထောက်အထား အခိုင်မာဆုံး နည်းလမ်း ဖြစ်သည်။ လုပ်ဆောင်မှုထက် နေ့အလင်းရောင် ကိုယ်တိုင်က အဓိက ဖြစ်သည်။',
    },
  },
  {
    id: 'children-first-exam',
    category: 'children',
    en: {
      title: 'Have eyes checked before school starts',
      body: 'Children rarely report blurred vision, because they assume everyone sees as they do. A check before the first school year catches most problems in time.',
    },
    my: {
      title: 'ကျောင်းမတက်မီ မျက်စိ စစ်ဆေးပါ',
      body: 'ကလေးများသည် မှုန်ဝါးမှုကို မပြောတတ်ပါ။ အားလုံး ဤသို့ မြင်သည်ဟု ထင်နေတတ်သည်။ ကျောင်းစတက်ခါနီး စစ်ဆေးခြင်းက အချိန်မီ တွေ့ရှိစေသည်။',
    },
  },
  {
    id: 'children-signs',
    category: 'children',
    en: {
      title: 'Watch for squinting and sitting close',
      body: 'Squinting, tilting the head, sitting very near the television or losing place while reading are the everyday signs worth acting on.',
    },
    my: {
      title: 'မျက်စိကျုံ့ကြည့်ခြင်းကို သတိပြုပါ',
      body: 'မျက်စိကျုံ့ကြည့်ခြင်း၊ ခေါင်းစောင်းကြည့်ခြင်း၊ တီဗွီနှင့် အလွန်နီးကပ်စွာ ထိုင်ခြင်း၊ စာဖတ်ရာတွင် နေရာပျောက်ခြင်းတို့ကို သတိပြုပါ။',
    },
  },
  {
    id: 'children-fit',
    category: 'children',
    en: {
      title: 'Fit matters more than style for children',
      body: 'Glasses that slide down are looked over rather than through, which defeats the prescription entirely. Spring hinges and a proper bridge fit are worth paying for.',
    },
    my: {
      title: 'ကလေးများအတွက် ဒီဇိုင်းထက် အံဝင်မှု ပိုအရေးကြီး',
      body: 'အောက်လျှောကျသော မျက်မှန်ကို ကလေးများသည် အပေါ်မှ ကြည့်တတ်ပြီး မှန်၏ အကျိုးကို မရပါ။ စပရိန်တံခါးချိတ်နှင့် နှာတံ အံဝင်မှု အရေးကြီးသည်။',
    },
  },
  {
    id: 'children-sports',
    category: 'children',
    en: {
      title: 'Use polycarbonate lenses for sport',
      body: 'They are far more impact-resistant than standard plastic. For an active child this is a safety choice, not an upgrade.',
    },
    my: {
      title: 'အားကစားအတွက် polycarbonate မှန် သုံးပါ',
      body: 'ရိုးရိုး ပလတ်စတစ်ထက် ရိုက်ခတ်မှု ပိုခံနိုင်သည်။ တက်ကြွသော ကလေးအတွက် ဤရွေးချယ်မှုသည် လုံခြုံရေး ဖြစ်သည်။',
    },
  },
  {
    id: 'children-screen-limit',
    category: 'children',
    en: {
      title: 'Set screen limits by habit, not by rule',
      body: 'A predictable stopping point — after homework, before dinner — works better than a daily minute count that becomes a negotiation.',
    },
    my: {
      title: 'ဖန်သားပြင် ကြည့်ချိန်ကို အလေ့အထဖြင့် ကန့်သတ်ပါ',
      body: 'မိနစ် ရေတွက်ခြင်းထက် ပုံမှန် ရပ်နားချိန် — အိမ်စာပြီးမှ၊ ညစာမစားမီ — က ပိုအလုပ်ဖြစ်သည်။',
    },
  },

  /* ── Contact lenses ──────────────────────────────────────────────────── */
  {
    id: 'contacts-never-sleep',
    category: 'contacts',
    en: {
      title: 'Do not sleep in lenses unless told you may',
      body: 'Overnight wear raises the risk of a serious corneal infection several times over. Only some lenses are approved for it, and only for some people.',
    },
    my: {
      title: 'ကွန်တက်မှန် တပ်လျက် မအိပ်ပါနှင့်',
      body: 'ညအိပ်စဉ် တပ်ထားခြင်းက မျက်ကြည်လွှာ ပိုးဝင်နိုင်ခြေကို အဆများစွာ မြင့်စေသည်။ အချို့မှန်များသာ ခွင့်ပြုထားပြီး လူတိုင်းအတွက် မဟုတ်ပါ။',
    },
  },
  {
    id: 'contacts-no-water',
    category: 'contacts',
    en: {
      title: 'Keep lenses away from all water',
      body: 'Tap water, bottled water and swimming pools all carry organisms that cause hard-to-treat infections. Use solution only, every time.',
    },
    my: {
      title: 'ကွန်တက်မှန်ကို ရေနှင့် မထိစေပါနှင့်',
      body: 'ဘုံပိုင်ရေ၊ သောက်ရေသန့်နှင့် ရေကူးကန်ရေတွင် ကုသရခက်သော ပိုးမွှားများ ပါနိုင်သည်။ အမြဲတမ်း solution သာ သုံးပါ။',
    },
  },
  {
    id: 'contacts-fresh-solution',
    category: 'contacts',
    en: {
      title: 'Empty the case, do not top it up',
      body: 'Adding fresh solution to old dilutes the disinfectant. Tip it out, rub the case dry and leave it face down.',
    },
    my: {
      title: 'Solution ဟောင်းပေါ် အသစ် မထည့်ပါနှင့်',
      body: 'အဟောင်းပေါ် အသစ်ထည့်ခြင်းက ပိုးသတ်ဆေး အာနိသင်ကို လျော့စေသည်။ အဟောင်းကို သွန်ပစ်၊ ဘူးကို သုတ်ပြီး မှောက်ထားပါ။',
    },
  },
  {
    id: 'contacts-replace-case',
    category: 'contacts',
    en: {
      title: 'Replace the case every three months',
      body: 'The case, not the lens, is usually where a biofilm builds up. It is the cheapest part of the routine to renew.',
    },
    my: {
      title: 'မှန်ဘူးကို သုံးလတစ်ကြိမ် လဲပါ',
      body: 'ပိုးမွှား စုပုံရာမှာ မှန်ထက် မှန်ဘူး ဖြစ်တတ်သည်။ လဲရန် အသက်သာဆုံး အပိုင်းလည်း ဖြစ်သည်။',
    },
  },
  {
    id: 'contacts-schedule',
    category: 'contacts',
    en: {
      title: 'Respect the replacement schedule',
      body: 'A monthly lens worn for six weeks is not a saving. Deposits build past the point cleaning can remove them.',
    },
    my: {
      title: 'အသုံးပြုချိန် သတ်မှတ်ချက်ကို လိုက်နာပါ',
      body: 'တစ်လသုံး မှန်ကို ခြောက်ပတ် သုံးခြင်းသည် ချွေတာမှု မဟုတ်ပါ။ အညစ်အကြေးများ သန့်ရှင်း၍ မရတော့သည့် အဆင့်ထိ စုပုံလာသည်။',
    },
  },
  {
    id: 'contacts-glasses-backup',
    category: 'contacts',
    en: {
      title: 'Keep a current pair of glasses',
      body: 'Eyes need days off, and an infection means no lenses for a while. An up-to-date spare pair is part of wearing contacts safely.',
    },
    my: {
      title: 'မျက်မှန် အရန် တစ်လက် ရှိထားပါ',
      body: 'မျက်လုံးများ အနားလိုသည်။ ပိုးဝင်ပါက ကွန်တက်မှန် ခဏ မတပ်ရပါ။ လက်ရှိ power နှင့် မျက်မှန် တစ်လက် ရှိရန် လိုသည်။',
    },
  },
  {
    id: 'contacts-remove-if-red',
    category: 'contacts',
    en: {
      title: 'Red or painful means take them out',
      body: 'Remove the lens and leave it out. If redness, pain or light sensitivity continues for more than a few hours, have it looked at the same day.',
    },
    my: {
      title: 'နီရင် နာရင် ချက်ချင်း ဖြုတ်ပါ',
      body: 'မှန်ကို ဖြုတ်ပြီး ပြန်မတပ်ပါနှင့်။ နီခြင်း၊ နာခြင်း သို့မဟုတ် အလင်းမခံနိုင်ခြင်း နာရီအနည်းငယ်ထက် ကြာလျှင် ထိုနေ့တွင်ပင် ပြသပါ။',
    },
  },

  /* ── Nutrition ───────────────────────────────────────────────────────── */
  {
    id: 'nutrition-greens',
    category: 'nutrition',
    en: {
      title: 'Eat dark leafy greens regularly',
      body: 'They supply lutein and zeaxanthin, which concentrate in the macula. Everyday greens do this as well as any supplement.',
    },
    my: {
      title: 'အရွက်စိမ်း မှန်မှန် စားပါ',
      body: 'Lutein နှင့် zeaxanthin ဓာတ်များ ပါဝင်ပြီး မျက်လုံးအလယ်ပိုင်းတွင် စုစည်းသည်။ ဆေးတောင့်ထက် ပုံမှန် အရွက်စိမ်းက ကောင်းသည်။',
    },
  },
  {
    id: 'nutrition-omega3',
    category: 'nutrition',
    en: {
      title: 'Oily fish helps dry eyes',
      body: 'Omega-3 supports the oily layer of the tear film that stops tears evaporating too quickly. Twice a week is a reasonable target.',
    },
    my: {
      title: 'အဆီများသော ငါး စားပါ',
      body: 'Omega-3 သည် မျက်ရည်လွှာ၏ အဆီအလွှာကို ထောက်ပံ့ပေးပြီး မျက်ရည် မြန်မြန် ခန်းခြောက်ခြင်းမှ ကာကွယ်သည်။ တစ်ပတ် နှစ်ကြိမ် စားပါ။',
    },
  },
  {
    id: 'nutrition-hydration',
    category: 'nutrition',
    en: {
      title: 'Dehydration shows up in your eyes',
      body: 'Tears are mostly water. In hot weather, gritty afternoon eyes are often simply a sign of not drinking enough.',
    },
    my: {
      title: 'ရေဓာတ် ခန်းခြောက်မှုသည် မျက်လုံးတွင် ပေါ်သည်',
      body: 'မျက်ရည်၏ အများစုမှာ ရေ ဖြစ်သည်။ ပူပြင်းသည့် ရာသီတွင် နေ့လယ်ပိုင်း မျက်စိခြောက်ခြင်းသည် ရေမလုံလောက်၍ ဖြစ်တတ်သည်။',
    },
  },
  {
    id: 'nutrition-vitamin-a',
    category: 'nutrition',
    en: {
      title: 'Vitamin A protects night vision',
      body: 'Found in eggs, liver, carrots and sweet potato. Deficiency is one of the few genuinely preventable causes of childhood blindness.',
    },
    my: {
      title: 'ဗီတာမင် A သည် ညအမြင်ကို ကာကွယ်သည်',
      body: 'ကြက်ဥ၊ အသည်း၊ မုန်လာဥနီနှင့် ကန်စွန်းဥတွင် ပါဝင်သည်။ ချို့တဲ့မှုသည် ကာကွယ်နိုင်သော ကလေး မျက်စိကွယ်ခြင်း အကြောင်းရင်း ဖြစ်သည်။',
    },
  },
  {
    id: 'nutrition-smoking',
    category: 'nutrition',
    en: {
      title: 'Stopping smoking helps your eyes',
      body: 'Smoking raises the risk of both cataract and macular degeneration, and the risk falls again after quitting.',
    },
    my: {
      title: 'ဆေးလိပ် ဖြတ်ခြင်းက မျက်လုံးအတွက် ကောင်းသည်',
      body: 'ဆေးလိပ်သည် တိမ်စွဲခြင်းနှင့် မျက်လုံးအလယ်ပိုင်း ယိုယွင်းခြင်း နှစ်မျိုးလုံး၏ အန္တရာယ်ကို မြင့်စေသည်။ ဖြတ်ပြီးနောက် အန္တရာယ် ပြန်လျော့သည်။',
    },
  },

  /* ── Warning signs ───────────────────────────────────────────────────── */
  {
    id: 'warning-sudden-loss',
    category: 'warning',
    en: {
      title: 'Sudden loss of vision is an emergency',
      body: 'Any abrupt loss, in one eye or both, painless or not, needs to be seen the same day. Do not wait to see whether it improves.',
    },
    my: {
      title: 'ရုတ်တရက် မမြင်ရခြင်းသည် အရေးပေါ် ဖြစ်သည်',
      body: 'တစ်ဖက်ဖြစ်စေ နှစ်ဖက်ဖြစ်စေ ရုတ်တရက် အမြင်ဆုံးရှုံးပါက ထိုနေ့တွင်ပင် ပြသရန် လိုသည်။ သက်သာမလား စောင့်မကြည့်ပါနှင့်။',
    },
  },
  {
    id: 'warning-floaters',
    category: 'warning',
    en: {
      title: 'A sudden shower of floaters needs checking',
      body: 'Especially with flashes of light or a shadow moving in from the side. A few long-standing floaters are usually harmless; a sudden change is not.',
    },
    my: {
      title: 'အမျှင်များ ရုတ်တရက် များလာလျှင် ပြသပါ',
      body: 'အထူးသဖြင့် အလင်းလက်ခြင်း သို့မဟုတ် ဘေးမှ အရိပ်ဝင်လာခြင်းနှင့်အတူ ဖြစ်ပါက။ ကြာမြင့်စွာ ရှိနေသော အမျှင်အနည်းငယ်မှာ ဘေးမဲ့ ဖြစ်တတ်သည်။',
    },
  },
  {
    id: 'warning-halos',
    category: 'warning',
    en: {
      title: 'Haloes with pain and nausea: go now',
      body: 'Rainbow rings around lights together with a red, painful eye and feeling sick can mean dangerously raised pressure. Treat it as urgent.',
    },
    my: {
      title: 'အလင်းဝန်း၊ နာကျင်မှုနှင့် အန်ချင်ခြင်း — ချက်ချင်း သွားပါ',
      body: 'မီးအလင်းပတ်လည် သက်တံ့ဝန်း မြင်ရခြင်းနှင့်အတူ မျက်စိနီ၊ နာကျင်ပြီး အန်ချင်ပါက မျက်စိဖိအား မြင့်နေခြင်း ဖြစ်နိုင်သည်။ အရေးပေါ် ဖြစ်သည်။',
    },
  },
  {
    id: 'warning-double-vision',
    category: 'warning',
    en: {
      title: 'New double vision should be assessed',
      body: 'Seeing two of one thing, especially if it starts suddenly or comes with a droopy lid or headache, needs prompt medical assessment.',
    },
    my: {
      title: 'အသစ်ဖြစ်ပေါ်လာသော အမြင်နှစ်ထပ်ကို ပြသပါ',
      body: 'အရာတစ်ခုကို နှစ်ခု မြင်ရခြင်း၊ အထူးသဖြင့် ရုတ်တရက် ဖြစ်လာခြင်း သို့မဟုတ် မျက်ခွံကျခြင်း၊ ခေါင်းကိုက်ခြင်းနှင့်အတူ ဖြစ်ပါက အမြန် ပြသရန် လိုသည်။',
    },
  },
  {
    id: 'warning-persistent-redness',
    category: 'warning',
    en: {
      title: 'Redness that will not settle',
      body: 'Most red eyes clear within a few days. One that persists, hurts, or affects vision is a different matter and should be examined.',
    },
    my: {
      title: 'မပျောက်သော မျက်စိနီခြင်း',
      body: 'မျက်စိနီခြင်း အများစုသည် ရက်အနည်းငယ်တွင် ပျောက်သည်။ ဆက်နေခြင်း၊ နာခြင်း သို့မဟုတ် အမြင်ကို ထိခိုက်ခြင်းဆိုလျှင် ပြသသင့်သည်။',
    },
  },
  {
    id: 'warning-regular-exam',
    category: 'warning',
    en: {
      title: 'Have an eye test every two years',
      body: 'Sooner if you have diabetes, high blood pressure or a family history of glaucoma. Several serious conditions cause no symptoms until late.',
    },
    my: {
      title: 'နှစ်နှစ်တစ်ကြိမ် မျက်စိစစ်ဆေးပါ',
      body: 'ဆီးချို၊ သွေးတိုး သို့မဟုတ် မိသားစုတွင် ရေတိမ်စွဲ ရာဇဝင်ရှိပါက ပိုစောပါ။ ဆိုးရွားသော ရောဂါအချို့သည် နောက်ကျမှသာ လက္ခဏာ ပြသည်။',
    },
  },

  /* ── Everyday care ───────────────────────────────────────────────────── */
  {
    id: 'care-two-hands',
    category: 'care',
    en: {
      title: 'Take glasses off with both hands',
      body: 'One-handed removal twists the frame a little each time, and that is what leaves them sitting crooked months later.',
    },
    my: {
      title: 'မျက်မှန်ကို လက်နှစ်ဖက်ဖြင့် ချွတ်ပါ',
      body: 'လက်တစ်ဖက်တည်းဖြင့် ချွတ်ခြင်းက ဘောင်ကို တစ်ကြိမ်လျှင် အနည်းငယ်စီ လိမ်စေသည်။ လများကြာလျှင် စောင်းသွားတတ်သည်။',
    },
  },
  {
    id: 'care-lenses-up',
    category: 'care',
    en: {
      title: 'Never rest glasses lens-down',
      body: 'Put them in a case, or fold them and lay them on their side. A lens face down on any surface picks up scratches quickly.',
    },
    my: {
      title: 'မှန်မျက်နှာကို အောက်ချ၍ မထားပါနှင့်',
      body: 'အိတ်ထဲ ထည့်ပါ၊ သို့မဟုတ် ခေါက်ပြီး ဘေးစောင်းထားပါ။ မှန်မျက်နှာ အောက်ချထားလျှင် ခြစ်ရာ လွယ်လွယ် ဖြစ်သည်။',
    },
  },
  {
    id: 'care-hot-car',
    category: 'care',
    en: {
      title: 'Do not leave glasses in a hot car',
      body: 'Heat inside a parked car can warp frames and damage lens coatings. Take them with you or keep them out of direct sun.',
    },
    my: {
      title: 'ပူသော ကားထဲတွင် မျက်မှန် မထားခဲ့ပါနှင့်',
      body: 'ရပ်ထားသော ကားအတွင်း အပူချိန်သည် ဘောင်ကို ကွေးစေပြီး မှန်၏ အလွှာကို ပျက်စီးစေနိုင်သည်။ ယူသွားပါ။',
    },
  },
  {
    id: 'care-head-of-bed',
    category: 'care',
    en: {
      title: 'Not on your head, not on your collar',
      body: 'The two most reliable ways to stretch a frame and to drop it. A case takes a second longer and saves an adjustment.',
    },
    my: {
      title: 'ခေါင်းပေါ် တင်မထားပါနှင့်',
      body: 'ခေါင်းပေါ် သို့မဟုတ် လည်ကတုံးတွင် ချိတ်ထားခြင်းက ဘောင်ကို ဆွဲဆန့်စေပြီး ပြုတ်ကျရန်လည်း လွယ်သည်။ အိတ်ထဲ ထည့်ပါ။',
    },
  },
  {
    id: 'care-annual-adjust',
    category: 'care',
    en: {
      title: 'Come in for a free adjustment',
      body: 'Frames loosen with wear. A few minutes with a technician restores the fit and, with it, the optical centring you paid for.',
    },
    my: {
      title: 'အခမဲ့ ချိန်ညှိမှု ခံယူပါ',
      body: 'အသုံးပြုရင်း ဘောင်များ လျော့ရဲလာသည်။ ဆိုင်တွင် မိနစ်အနည်းငယ် ချိန်ညှိပေးခြင်းဖြင့် အံဝင်မှုနှင့် မှန်အလယ်ဗဟို ပြန်မှန်သွားသည်။',
    },
  },
  {
    id: 'care-old-prescription',
    category: 'care',
    en: {
      title: 'An old prescription is not harmless',
      body: 'Wearing out-of-date lenses will not damage your eyes, but the headaches and tired vision it causes are entirely avoidable.',
    },
    my: {
      title: 'မှန်ဟောင်း ဆက်တပ်ခြင်း မသင့်ပါ',
      body: 'သက်တမ်းလွန် မှန် တပ်ခြင်းသည် မျက်လုံးကို ပျက်စီးမစေသော်လည်း ခေါင်းကိုက်ခြင်းနှင့် အမြင်ပင်ပန်းခြင်းကို ဖြစ်စေသည်။',
    },
  },
];

/* ── Helpers ───────────────────────────────────────────────────────────── */

/** Guards the promised count — the brief asked for fifty. */
export const TIP_COUNT = EYE_CARE_TIPS.length;

/** Tips in a category, or all of them when `category` is null. */
export function tipsByCategory(category: TipCategory | null): EyeCareTip[] {
  return category === null
    ? EYE_CARE_TIPS
    : EYE_CARE_TIPS.filter((tip) => tip.category === category);
}

/**
 * Case-insensitive search across whichever language is on screen.
 *
 * Searches the active language only. Matching the hidden language would return
 * tips whose visible text does not contain the query, which reads as a bug.
 */
export function searchTips(
  tips: EyeCareTip[],
  query: string,
  language: 'en' | 'my',
): EyeCareTip[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return tips;

  return tips.filter((tip) => {
    const { title, body } = tip[language];
    return `${title} ${body}`.toLowerCase().includes(needle);
  });
}
