/**
 * Lookbook content: styled looks, and the face-shape styling guide.
 *
 * Bilingual text lives here beside the data for the same reason the eye-care
 * tips do — it is editorial copy, not UI chrome, and a translation is only
 * checkable next to its source.
 *
 * Media is generated placeholder artwork. Video entries carry a poster and
 * `videoSrc: null`: the UI shows a genuine play affordance and, on opening, says
 * plainly that the clip is not shot yet. That is better than a `<video>` with no
 * source, which renders as a broken black box, and better than hiding the video
 * slots, which would make the layout change when real footage arrives.
 */
import type { FaceShape } from '@/lib/attributes';
import {
  LOOKBOOK_PALETTES,
  type HeadShape,
  lookbookImage,
  lookbookVideoPoster,
} from '@/lib/seed/lookbook-artwork';

export const OCCASIONS = ['work', 'weekend', 'evening', 'outdoors', 'campus'] as const;
export type Occasion = (typeof OCCASIONS)[number];

export type LookMedia =
  | { kind: 'image'; src: string }
  /** `src` is null until the clip is shot; the UI handles that explicitly. */
  | { kind: 'video'; poster: string; src: string | null };

export type Look = {
  id: string;
  occasion: Occasion;
  /** Face shapes this pairing flatters, matching `attributes.ts`. */
  faceShapes: FaceShape[];
  /** Frame code from the sample catalogue, so a look can link to a product. */
  frameCode: string;
  media: LookMedia;
  /** Feature tiles get a taller image and more space in the grid. */
  featured: boolean;
  en: { title: string; outfit: string; why: string };
  my: { title: string; outfit: string; why: string };
};

/** Keeps the artwork calls short and consistent below. */
const img = (palette: keyof typeof LOOKBOOK_PALETTES, head: HeadShape, label: string, portrait = false) =>
  ({ kind: 'image', src: lookbookImage(LOOKBOOK_PALETTES[palette], head, label, portrait) }) as const;

const vid = (palette: keyof typeof LOOKBOOK_PALETTES, head: HeadShape, label: string) =>
  ({
    kind: 'video',
    poster: lookbookVideoPoster(LOOKBOOK_PALETTES[palette], head, label),
    src: null,
  }) as const;

export const LOOKS: Look[] = [
  {
    id: 'work-titanium',
    occasion: 'work',
    faceShapes: ['Round', 'Oval'],
    frameCode: 'PBV-1180',
    media: img('coolSlate', 'round', 'Inle Square', true),
    featured: true,
    en: {
      title: 'The quiet office frame',
      outfit: 'Pale blue shirt, charcoal trousers, no tie.',
      why: 'A squared frame gives a rounder face the horizontal line it lacks. Titanium keeps it light enough for a nine-hour day.',
    },
    my: {
      title: 'ရုံးအတွက် သပ်ရပ်သော မှန်',
      outfit: 'အပြာနု ရှပ်အင်္ကျီ၊ မီးခိုးရောင် ဘောင်းဘီ။',
      why: 'စတုရန်း မှန်သည် လုံးဝိုင်းသော မျက်နှာအတွက် အလိုအပ်ဆုံး မျဉ်းဖြောင့်ကို ပေးသည်။ တိုက်တေနီယမ်က နေကုန် တပ်နိုင်လောက်အောင် ပေါ့သည်။',
    },
  },
  {
    id: 'work-halfrim',
    occasion: 'work',
    faceShapes: ['Oval', 'Square'],
    frameCode: 'MD-410',
    media: img('softSage', 'oval', 'Half-Rim', false),
    featured: false,
    en: {
      title: 'Barely-there for long meetings',
      outfit: 'Linen shirt, rolled sleeves.',
      why: 'A half rim reads as almost no frame at all — useful when you would rather people looked at your face than your glasses.',
    },
    my: {
      title: 'အစည်းအေးရှည်များအတွက် ပေါ့ပါးသော မှန်',
      outfit: 'လင်နင် ရှပ်အင်္ကျီ၊ လက်တင်ခေါက်။',
      why: 'အောက်ဘောင်မပါသော မှန်သည် မှန်မတပ်သလို ပေါ်သည်။ မျက်မှန်ထက် မျက်နှာကို ကြည့်စေလိုသည့်အခါ သင့်လျော်သည်။',
    },
  },
  {
    id: 'weekend-tortoise',
    occasion: 'weekend',
    faceShapes: ['Square', 'Heart', 'Diamond'],
    frameCode: 'PBV-2041',
    media: img('warmClay', 'square', 'Yangon Round', true),
    featured: true,
    en: {
      title: 'Softening a strong jaw',
      outfit: 'White tee, denim, canvas shoes.',
      why: 'Round acetate is the standard counterweight to an angular face. Tortoiseshell warms the whole thing up without shouting.',
    },
    my: {
      title: 'မေးရိုးထင်ရှားမှုကို ပြေပြစ်စေခြင်း',
      outfit: 'အင်္ကျီဖြူ၊ ဂျင်းဘောင်းဘီ၊ ကမ်းဗတ် ဖိနပ်။',
      why: 'လုံးဝိုင်းသော acetate မှန်သည် ထောင့်များသော မျက်နှာကို ချိန်ခွင်လျှာညှိပေးသည်။ လိပ်ခွံအရောင်က နူးညံ့စွာ နွေးစေသည်။',
    },
  },
  {
    id: 'weekend-eco',
    occasion: 'weekend',
    faceShapes: ['Square', 'Diamond'],
    frameCode: 'VD-201',
    media: vid('softSage', 'diamond', 'Eco Round — clip'),
    featured: false,
    en: {
      title: 'Plant-based, in daylight',
      outfit: 'Olive overshirt, plain trousers.',
      why: 'Castor-oil acetate warms to the skin faster than petroleum plastic. Worth seeing in motion to judge the thickness.',
    },
    my: {
      title: 'သဘာဝ ပစ္စည်း၊ နေ့အလင်းရောင်ထဲတွင်',
      outfit: 'သံလွင်ရောင် အင်္ကျီ၊ ရိုးရှင်းသော ဘောင်းဘီ။',
      why: 'ကြက်ဆူဆီမှ acetate သည် ရေနံပလတ်စတစ်ထက် အသားနှင့် ပိုမြန်စွာ နွေးသည်။ ထူပါးကို လှုပ်ရှားသည့် ဗီဒီယိုတွင် ပိုမြင်နိုင်သည်။',
    },
  },
  {
    id: 'evening-cateye',
    occasion: 'evening',
    faceShapes: ['Round', 'Square', 'Oval'],
    frameCode: 'AU-330',
    media: img('duskRose', 'oval', 'Bagan Cat-Eye', true),
    featured: true,
    en: {
      title: 'Cat-eye, after six',
      outfit: 'Dark silk, gold at the wrist.',
      why: 'The upswept corner lifts the cheekbone. Fine metal keeps it from tipping into costume under warm light.',
    },
    my: {
      title: 'ညနေပိုင်းအတွက် ကြောင်မျက်လုံး မှန်',
      outfit: 'အရောင်ရင့် ပိုးထည်၊ လက်တွင် ရွှေ။',
      why: 'အထက်သို့ ကွေးတက်သော ထောင့်သည် ပါးရိုးကို မြင့်တင်ပေးသည်။ သွယ်လျသော သတ္တုက မီးနွေးအောက်တွင် ပိုသပ်ရပ်စေသည်။',
    },
  },
  {
    id: 'evening-oversize',
    occasion: 'evening',
    faceShapes: ['Diamond', 'Heart', 'Square'],
    frameCode: 'LM-077',
    media: img('amberDusk', 'heart', 'Thanlyin Oversize', false),
    featured: false,
    en: {
      title: 'Deliberately oversized',
      outfit: 'Monochrome, one strong colour.',
      why: 'A wide frame balances prominent cheekbones. Keep the rest of the outfit plain and let the glasses do the talking.',
    },
    my: {
      title: 'တမင် ကြီးမားစွာ ရွေးချယ်ခြင်း',
      outfit: 'တစ်ရောင်တည်း၊ အရောင်ရင့် တစ်ခု။',
      why: 'ကျယ်သော ဘောင်သည် ထင်ရှားသော ပါးရိုးကို ချိန်ခွင်လျှာညှိသည်။ အဝတ်အစားကို ရိုးရှင်းစွာ ထားပါ။',
    },
  },
  {
    id: 'outdoors-aviator',
    occasion: 'outdoors',
    faceShapes: ['Oval', 'Heart', 'Diamond'],
    frameCode: 'AU-505',
    media: vid('deepTeal', 'oval', 'Mandalay Aviator — clip'),
    featured: false,
    en: {
      title: 'Aviator, full sun',
      outfit: 'Field jacket, cotton shirt.',
      why: 'The double bridge sits high enough for a hat brim. Wide lenses cut the light bouncing up off pavement.',
    },
    my: {
      title: 'နေပြင်းအောက် လေယာဉ်မှူး မှန်',
      outfit: 'ဂျာကင်၊ ဂွမ်းရှပ်အင်္ကျီ။',
      why: 'နှစ်ဆင့် နှာတံသည် ဦးထုပ်နှင့် အံဝင်လောက်အောင် မြင့်သည်။ မှန်ကျယ်သည် လမ်းမှ ပြန်ဟပ်သော အလင်းကို ဖြတ်ပေးသည်။',
    },
  },
  {
    id: 'outdoors-kids',
    occasion: 'outdoors',
    faceShapes: ['Round', 'Oval'],
    frameCode: 'VD-088',
    media: img('deepTeal', 'round', 'Little Explorer', false),
    featured: false,
    en: {
      title: 'Built for a football match',
      outfit: 'Whatever they were already wearing.',
      why: 'Spring hinges survive being sat on. Rounded edges everywhere, because children do not take glasses off first.',
    },
    my: {
      title: 'ဘောလုံးကစားရန် ခံနိုင်သော မှန်',
      outfit: 'သူတို့ ဝတ်ထားသည့် အဝတ်အစားနှင့်။',
      why: 'စပရိန် တံခါးချိတ်သည် ထိုင်မိသည်ကိုပင် ခံနိုင်သည်။ ကလေးများသည် မျက်မှန်ကို အရင် မချွတ်တတ်သဖြင့် အနားများ လုံးထားသည်။',
    },
  },
  {
    id: 'campus-studio',
    occasion: 'campus',
    faceShapes: ['Round', 'Oval', 'Heart'],
    frameCode: 'LM-014',
    media: img('coolSlate', 'heart', 'Studio Rectangle', false),
    featured: false,
    en: {
      title: 'The one frame to own',
      outfit: 'Anything. That is the point.',
      why: 'A plain rectangle in black or crystal goes with every outfit and every occasion. Start here if you are buying your first pair.',
    },
    my: {
      title: 'တစ်လက်တည်း ရွေးရလျှင်',
      outfit: 'ဘာနှင့်မဆို လိုက်ဖက်သည်။',
      why: 'အနက်ရောင် သို့မဟုတ် ကြည်လင်သော ရိုးရိုး စတုဂံမှန်သည် အဝတ်အစားတိုင်းနှင့် လိုက်ဖက်သည်။ ပထမဆုံး မျက်မှန်အတွက် ဤနေရာမှ စပါ။',
    },
  },
  {
    id: 'campus-petite',
    occasion: 'campus',
    faceShapes: ['Heart', 'Diamond', 'Round'],
    frameCode: 'MD-155',
    media: vid('duskRose', 'diamond', 'Petite Oval — clip'),
    featured: false,
    en: {
      title: 'Properly scaled for a small face',
      outfit: 'Knit cardigan, tote bag.',
      why: 'Not a shrunken men’s frame in a different colour — cut for narrower temples from the start.',
    },
    my: {
      title: 'မျက်နှာသေးအတွက် အရွယ်အစား တိကျစွာ',
      outfit: 'ကာဒီဂန်၊ လွယ်အိတ်။',
      why: 'အမျိုးသား မှန်ကို ချုံ့၍ အရောင်ပြောင်းထားခြင်း မဟုတ်ပါ — သွယ်သော နဖူးအတွက် အစမှစ ဒီဇိုင်းထုတ်ထားသည်။',
    },
  },
];

/* ── Styling guide ─────────────────────────────────────────────────────────── */

/**
 * What to look for, per face shape.
 *
 * The received wisdom in optics is contrast: angular frames on round faces,
 * curved frames on angular ones. Stated as guidance rather than rules, because
 * plenty of people suit the "wrong" frame and a shop that says otherwise talks
 * customers out of frames they liked.
 */
export type StylingNote = {
  faceShape: FaceShape;
  en: { look: string; avoid: string };
  my: { look: string; avoid: string };
};

export const STYLING_GUIDE: StylingNote[] = [
  {
    faceShape: 'Round',
    en: {
      look: 'Rectangular and square frames, with a defined top line to add angles.',
      avoid: 'Small round frames, which echo the face rather than balance it.',
    },
    my: {
      look: 'စတုဂံနှင့် စတုရန်း ဘောင်များ၊ အထက်မျဉ်း ထင်ရှားသော မှန်များ။',
      avoid: 'သေးငယ်၍ လုံးဝိုင်းသော မှန်များ — မျက်နှာသဏ္ဌာန်ကို ထပ်ပြရုံသာ ဖြစ်သည်။',
    },
  },
  {
    faceShape: 'Square',
    en: {
      look: 'Round and oval frames, softer edges, a slightly narrower width than the jaw.',
      avoid: 'Heavy angular frames that repeat the jawline.',
    },
    my: {
      look: 'လုံးဝိုင်းသော နှင့် ဘဲဥသဏ္ဌာန် မှန်များ၊ အနားပြေပြစ်သော မှန်များ။',
      avoid: 'မေးရိုးကို ထပ်ပြသော ထောင့်ကြီး၍ ထူသော မှန်များ။',
    },
  },
  {
    faceShape: 'Oval',
    en: {
      look: 'Most shapes work. Match the frame width to the widest part of your face.',
      avoid: 'Frames so oversized they shorten the face visually.',
    },
    my: {
      look: 'သဏ္ဌာန် အများစု လိုက်ဖက်သည်။ ဘောင်အနံကို မျက်နှာ အကျယ်ဆုံးအပိုင်းနှင့် ညှိပါ။',
      avoid: 'မျက်နှာကို တိုသွားစေလောက်အောင် ကြီးမားသော မှန်များ။',
    },
  },
  {
    faceShape: 'Heart',
    en: {
      look: 'Frames wider at the bottom, light rims, and low-set temples to balance the forehead.',
      avoid: 'Heavy top bars, which add weight where the face is already widest.',
    },
    my: {
      look: 'အောက်ပိုင်း ပိုကျယ်သော မှန်များ၊ ပေါ့ပါးသော ဘောင်များ။',
      avoid: 'အထက်ပိုင်း ထူသော မှန်များ — နဖူးကျယ်မှုကို ပိုဆွဲထုတ်သည်။',
    },
  },
  {
    faceShape: 'Diamond',
    en: {
      look: 'Cat-eye or oval frames with detail on the brow line, to widen the forehead.',
      avoid: 'Narrow frames that emphasise the cheekbones further.',
    },
    my: {
      look: 'ကြောင်မျက်လုံး သို့မဟုတ် ဘဲဥသဏ္ဌာန် မှန်များ၊ အထက်မျဉ်းတွင် အသေးစိတ် ပါသော မှန်များ။',
      avoid: 'ပါးရိုးကို ပိုထင်ရှားစေသော သွယ်လွန်းသည့် မှန်များ။',
    },
  },
];
