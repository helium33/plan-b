/**
 * Myanmar regions and states, with the townships a delivery actually goes to.
 *
 * ── Why this is a curated list and not the full administrative index ───────
 * Myanmar has 330-odd townships. Shipping every one of them into the bundle to
 * populate a dropdown would be a hundred kilobytes to support destinations this
 * shop does not deliver to. The list below covers the urban townships that carry
 * real order volume, and `OTHER_TOWNSHIP` lets a customer outside them proceed
 * by typing their own — which is better than a long list that is *still*
 * missing their village.
 */

export type Region = {
  /** Stored value and display label. Kept in English, as addresses are written. */
  name: string;
  /** Burmese label, shown alongside. */
  nameMy: string;
  townships: string[];
};

/** Chosen when a customer's township is not listed; reveals a free-text field. */
export const OTHER_TOWNSHIP = 'Other';

export const REGIONS: readonly Region[] = [
  {
    name: 'Yangon',
    nameMy: 'ရန်ကုန်',
    townships: [
      'Ahlone',
      'Bahan',
      'Botataung',
      'Dagon',
      'Hlaing',
      'Insein',
      'Kamayut',
      'Kyauktada',
      'Lanmadaw',
      'Latha',
      'Mayangone',
      'Mingalar Taung Nyunt',
      'North Okkalapa',
      'Pabedan',
      'Pazundaung',
      'Sanchaung',
      'South Okkalapa',
      'Tamwe',
      'Thaketa',
      'Thingangyun',
      'Yankin',
    ],
  },
  {
    name: 'Mandalay',
    nameMy: 'မန္တလေး',
    townships: [
      'Aungmyethazan',
      'Chanayethazan',
      'Chanmyathazi',
      'Mahaaungmye',
      'Amarapura',
      'Pyigyitagon',
      'Meiktila',
      'Pyin Oo Lwin',
    ],
  },
  {
    name: 'Naypyidaw',
    nameMy: 'နေပြည်တော်',
    townships: ['Zabuthiri', 'Pobbathiri', 'Ottarathiri', 'Dekkhinathiri', 'Pyinmana', 'Lewe'],
  },
  {
    name: 'Bago',
    nameMy: 'ပဲခူး',
    townships: ['Bago', 'Taungoo', 'Pyay', 'Thayarwady', 'Nyaunglebin'],
  },
  {
    name: 'Ayeyarwady',
    nameMy: 'ဧရာဝတီ',
    townships: ['Pathein', 'Hinthada', 'Myaungmya', 'Maubin', 'Pyapon', 'Bogale'],
  },
  {
    name: 'Magway',
    nameMy: 'မကွေး',
    townships: ['Magway', 'Pakokku', 'Yenangyaung', 'Minbu', 'Aunglan'],
  },
  {
    name: 'Sagaing',
    nameMy: 'စစ်ကိုင်း',
    townships: ['Sagaing', 'Monywa', 'Shwebo', 'Katha', 'Kalay'],
  },
  {
    name: 'Tanintharyi',
    nameMy: 'တနင်္သာရီ',
    townships: ['Dawei', 'Myeik', 'Kawthaung'],
  },
  {
    name: 'Shan State',
    nameMy: 'ရှမ်းပြည်နယ်',
    townships: ['Taunggyi', 'Lashio', 'Kyaukme', 'Nyaungshwe', 'Kalaw', 'Muse'],
  },
  {
    name: 'Mon State',
    nameMy: 'မွန်ပြည်နယ်',
    townships: ['Mawlamyine', 'Thaton', 'Kyaikto', 'Mudon'],
  },
  {
    name: 'Kachin State',
    nameMy: 'ကချင်ပြည်နယ်',
    townships: ['Myitkyina', 'Bhamo', 'Mohnyin'],
  },
  {
    name: 'Kayin State',
    nameMy: 'ကရင်ပြည်နယ်',
    townships: ['Hpa-An', 'Myawaddy', 'Kawkareik'],
  },
  {
    name: 'Rakhine State',
    nameMy: 'ရခိုင်ပြည်နယ်',
    townships: ['Sittwe', 'Thandwe', 'Kyaukphyu'],
  },
  {
    name: 'Chin State',
    nameMy: 'ချင်းပြည်နယ်',
    townships: ['Hakha', 'Falam', 'Tedim'],
  },
  {
    name: 'Kayah State',
    nameMy: 'ကယားပြည်နယ်',
    townships: ['Loikaw', 'Demoso'],
  },
];

/** Townships for a region name, plus the "Other" escape hatch. */
export function townshipsFor(regionName: string): string[] {
  const region = REGIONS.find((entry) => entry.name === regionName);
  return region ? [...region.townships, OTHER_TOWNSHIP] : [];
}
