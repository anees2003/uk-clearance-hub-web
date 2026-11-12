export interface FirmnessLevelInfo {
  rating: number;
  shortLabel: string;
  categoryName: string;
  whoItSuits: string;
  sleepPosition: string;
  bodyWeightGuidance: string;
  description: string;
  scaleY: number;
}

/**
 * Maps a firmness rating from 1 (Soft) to 10 (Extra firm) onto a Y-scale multiplier
 * for the 3D Mattress node so softer ratings visibly compress/squash the mattress
 * while firmer ratings keep it lofted and taut.
 */
export function computeMattressSquashScaleY(firmnessRating: number): number {
  const clamped = Math.max(1, Math.min(10, Math.round(firmnessRating)));
  // 1 -> 0.72 (deep plush compression), 6 -> 0.91, 10 -> 1.04 (extra-firm loft)
  const t = (clamped - 1) / 9;
  return Number((0.72 + t * 0.32).toFixed(3));
}

export const FIRMNESS_SCALE_LEVELS: FirmnessLevelInfo[] = [
  {
    rating: 1,
    shortLabel: 'Extra Soft',
    categoryName: '1 / 10 · Extra Soft (Cloud Plush)',
    whoItSuits:
      'Petite side sleepers with delicate shoulders or hips seeking maximum surface sinkage and zero pressure build-up.',
    sleepPosition: 'Strict Side Sleepers',
    bodyWeightGuidance: 'Under 9 stone (< 57 kg)',
    description:
      'Deep, cloud-like cushioning using ultra-plush lamb’s wool and low-gauge pocket springs that cradle sharp pressure points immediately.',
    scaleY: computeMattressSquashScaleY(1),
  },
  {
    rating: 2,
    shortLabel: 'Soft',
    categoryName: '2 / 10 · Soft',
    whoItSuits:
      'Lighter-framed side sleepers who prefer sleeping "in" rather than "on" the mattress surface.',
    sleepPosition: 'Side Sleepers',
    bodyWeightGuidance: 'Under 10 stone (< 64 kg)',
    description:
      'Generous upper comfort layers allow the shoulder and pelvis to nestle deeply whilst maintaining gentle lumbar contact.',
    scaleY: computeMattressSquashScaleY(2),
  },
  {
    rating: 3,
    shortLabel: 'Soft-Medium',
    categoryName: '3 / 10 · Soft to Medium',
    whoItSuits:
      'Side sleepers who occasionally roll onto their back and want plush upholstery without losing core support.',
    sleepPosition: 'Side & Combination Sleepers',
    bodyWeightGuidance: '9–11 stone (57–70 kg)',
    description:
      'Balances a sumptuous pillow-top or cashmere comfort quilt with responsive medium-tension pocket springs underneath.',
    scaleY: computeMattressSquashScaleY(3),
  },
  {
    rating: 4,
    shortLabel: 'Medium-Soft',
    categoryName: '4 / 10 · Medium-Soft',
    whoItSuits:
      'Dedicated side sleepers of average build seeking tailored hip and shoulder relief with natural spinal alignment.',
    sleepPosition: 'Side & Back Combination',
    bodyWeightGuidance: '10–12.5 stone (64–80 kg)',
    description:
      'Our most popular softer tension for British master bedrooms—yielding gently at the shoulder whilst supporting the waist.',
    scaleY: computeMattressSquashScaleY(4),
  },
  {
    rating: 5,
    shortLabel: 'Medium',
    categoryName: '5 / 10 · True Medium',
    whoItSuits:
      'Couples with different sleeping habits and restless combination sleepers who shift between side and back.',
    sleepPosition: 'All-Round Combination (Side & Back)',
    bodyWeightGuidance: '10–14 stone (64–89 kg)',
    description:
      'An equilibrium of surface comfort and mid-tier spring tension that adapts smoothly as you change posture overnight.',
    scaleY: computeMattressSquashScaleY(5),
  },
  {
    rating: 6,
    shortLabel: 'Medium-Firm',
    categoryName: '6 / 10 · Balanced Medium-Firm',
    whoItSuits:
      'The UK’s #1 all-rounder for couples, back sleepers, and medium-to-broad side sleepers wanting uplifting support.',
    sleepPosition: 'Back & Side Sleepers',
    bodyWeightGuidance: '11–15 stone (70–95 kg)',
    description:
      'Combines a breathable wool-and-cotton top layer with higher-tension pocket springs to prevent lower-back hammocking.',
    scaleY: computeMattressSquashScaleY(6),
  },
  {
    rating: 7,
    shortLabel: 'Firm-Medium',
    categoryName: '7 / 10 · Supportive Medium-Firm',
    whoItSuits:
      'Back sleepers and broader-framed sleepers who prefer lying flat on top of a supportive, buoyant surface.',
    sleepPosition: 'Back & Front Sleepers',
    bodyWeightGuidance: '12–16 stone (76–102 kg)',
    description:
      'Noticeably taut hand-tufted surface with reinforced perimeter springs, keeping the lumbar spine neutral all night.',
    scaleY: computeMattressSquashScaleY(7),
  },
  {
    rating: 8,
    shortLabel: 'Firm',
    categoryName: '8 / 10 · Firm',
    whoItSuits:
      'Stomach (front) sleepers and heavier back sleepers who require strong pelvic elevation to avoid lower-back arch strain.',
    sleepPosition: 'Back & Front Sleepers',
    bodyWeightGuidance: '14–18 stone (89–114 kg)',
    description:
      'High-gauge pocket springs paired with dense natural coir and Horsetail/Herdwick wool upholstery for minimal sinkage.',
    scaleY: computeMattressSquashScaleY(8),
  },
  {
    rating: 9,
    shortLabel: 'Orthopaedic Firm',
    categoryName: '9 / 10 · Orthopaedic Firm',
    whoItSuits:
      'Sleepers seeking targeted orthopaedic back support or heavier individuals who find standard mattresses dip over time.',
    sleepPosition: 'Back & Stomach Sleepers',
    bodyWeightGuidance: '16–20 stone (102–127 kg)',
    description:
      'Engineered with heavy-duty 1.6 mm wire springs and compressed Yorkshire wool pads for unyielding postural alignment.',
    scaleY: computeMattressSquashScaleY(9),
  },
  {
    rating: 10,
    shortLabel: 'Extra Firm',
    categoryName: '10 / 10 · Extra Firm (Orthopaedic)',
    whoItSuits:
      'Dedicated orthopaedic sleepers and heavier builds requiring maximum surface resistance with zero body roll.',
    sleepPosition: 'Strict Back or Front Sleepers',
    bodyWeightGuidance: 'Over 17 stone (> 108 kg)',
    description:
      'Our firmest tension—hand-tufted under high compression with dual-tier heavy-gauge springs for rock-solid skeletal support.',
    scaleY: computeMattressSquashScaleY(10),
  },
];

export function getFirmnessLevelInfo(rating: number): FirmnessLevelInfo {
  const clamped = Math.max(1, Math.min(10, Math.round(rating)));
  return FIRMNESS_SCALE_LEVELS[clamped - 1] ?? FIRMNESS_SCALE_LEVELS[5];
}

export interface SleepPositionGuide {
  id: 'side' | 'back' | 'front';
  title: string;
  recommendedFirmness: string;
  recommendedRange: [number, number];
  summary: string;
  whyItWorks: string;
  keyTip: string;
}

export const SLEEP_POSITIONS_GUIDE: SleepPositionGuide[] = [
  {
    id: 'side',
    title: 'Side Sleeper',
    recommendedFirmness: '4 – 6 / 10 (Medium-Soft to Medium-Firm)',
    recommendedRange: [4, 6],
    summary:
      'Adopted by over 60% of British adults. Your shoulder and hip bear the majority of your body weight and must sink in slightly so your spine stays horizontal.',
    whyItWorks:
      'If a mattress is too firm, your shoulder jams and your neck tilts; if too soft, your pelvis drops. A 4–6 rating cushions joints whilst supporting the waist gap.',
    keyTip:
      'Pair with a deep, high-loft pillow that fills the exact distance between your ear and outer shoulder.',
  },
  {
    id: 'back',
    title: 'Back Sleeper',
    recommendedFirmness: '6 – 8 / 10 (Medium-Firm to Firm)',
    recommendedRange: [6, 8],
    summary:
      'Distributes weight evenly across the widest surface area of your body, placing the primary mechanical demand on preserving the natural S-curve of your lower spine.',
    whyItWorks:
      'A 6–8 tension prevents the heavier pelvic area from sinking deeper than your ribcage ("hammocking"), whilst gently filling the small of the back.',
    keyTip:
      'Choose a medium-height pillow so your chin stays parallel to the chest rather than tipped forward.',
  },
  {
    id: 'front',
    title: 'Front (Stomach) Sleeper',
    recommendedFirmness: '7 – 9 / 10 (Firm to Orthopaedic)',
    recommendedRange: [7, 9],
    summary:
      'Because your centre of mass sits around the abdomen and pelvis, a soft mattress allows your midsection to sag downwards, hyper-extending the lumbar spine.',
    whyItWorks:
      'A taut 7–9 tension holds your hips level with your shoulders so your lower back remains flat and free from morning stiffness.',
    keyTip:
      'Use a very slim, breathable pillow—or sleep directly on the mattress surface—to reduce neck rotation.',
  },
];

export interface MattressTypeSpec {
  type: string;
  badge: string;
  feel: string;
  support: string;
  temperature: string;
  motionIsolation: string;
  lifespan: string;
  clearancePriceRange: string;
}

export const MATTRESS_TYPES_COMPARISON: MattressTypeSpec[] = [
  {
    type: 'Pocket Sprung',
    badge: 'Most Popular in UK',
    feel: 'Buoyant, tailored & responsive; natural wool/cotton loft',
    support: '1,000–3,000+ independent fabric-pocketed steel springs',
    temperature: 'Excellent — open spring channels & breathable natural fibres',
    motionIsolation: 'Very good — each spring compresses independently',
    lifespan: '8 – 12 years',
    clearancePriceRange: '£299 – £599',
  },
  {
    type: 'Hybrid (Pocket + Latex/Foam)',
    badge: 'Best All-Rounder',
    feel: 'Instant pressure-relieving hug over a lively spring core',
    support: 'Zoned pocket springs topped with Talalay latex or micro-coils',
    temperature: 'Good to Very Good — open-cell comfort layers + airflow border',
    motionIsolation: 'Excellent — dampens partner movement across the bed',
    lifespan: '8 – 10 years',
    clearancePriceRange: '£349 – £549',
  },
  {
    type: 'Natural Latex',
    badge: 'Hypoallergenic & Cool',
    feel: 'Weightless, elastic uplift that rebounds immediately',
    support: 'Pinhole-ventilated natural rubber core with progressive resistance',
    temperature: 'Very Good — natural open-cell ventilation',
    motionIsolation: 'Excellent — zero metallic spring transfer',
    lifespan: '10 – 14 years',
    clearancePriceRange: '£399 – £649',
  },
  {
    type: 'Memory Foam',
    badge: 'Maximum Contouring',
    feel: 'Slow, body-moulding cradle that distributes point pressure',
    support: 'High-density reflex base foam with viscoelastic upper layer',
    temperature: 'Moderate — retains more warmth unless graphite/gel infused',
    motionIsolation: 'Outstanding — virtually zero partner disturbance',
    lifespan: '7 – 9 years',
    clearancePriceRange: '£219 – £449',
  },
  {
    type: 'Open Coil (Traditional)',
    badge: 'Guest & Budget Rooms',
    feel: 'Light, springy traditional feel with interconnected bounce',
    support: 'Continuous hourglass Bonnell springs linked by a perimeter rod',
    temperature: 'Good — large internal air cavity',
    motionIsolation: 'Low — movement transfers across the linked spring unit',
    lifespan: '5 – 6 years',
    clearancePriceRange: '£139 – £249',
  },
];

export interface UkBedSizeDetail {
  id: 'single' | 'small-double' | 'double' | 'king' | 'super-king';
  name: 'Single' | 'Small Double' | 'Double' | 'King' | 'Super King';
  widthCm: number;
  lengthCm: number;
  dimensionsCm: string;
  feetInches: string;
  perPersonWidthCm: number;
  whoItSuits: string;
  idealRoomMinimum: string;
  notes: string;
}

export const UK_BED_SIZE_DETAILS: UkBedSizeDetail[] = [
  {
    id: 'single',
    name: 'Single',
    widthCm: 90,
    lengthCm: 190,
    dimensionsCm: '90 × 190 cm',
    feetInches: '3\'0" × 6\'3"',
    perPersonWidthCm: 90,
    whoItSuits:
      'Children, teenagers, solo adult sleepers, and compact UK box rooms or guest bedrooms.',
    idealRoomMinimum: '2.1 m × 2.5 m',
    notes:
      'Gives one adult a generous 90 cm sleeping width. Can be tucked against a side wall in smaller third bedrooms.',
  },
  {
    id: 'small-double',
    name: 'Small Double',
    widthCm: 120,
    lengthCm: 190,
    dimensionsCm: '120 × 190 cm',
    feetInches: '4\'0" × 6\'3"',
    perPersonWidthCm: 60,
    whoItSuits:
      'Solo sleepers wanting luxury sprawl space, guest rooms, and Victorian/new-build double bedrooms where a 4\'6" Double feels tight.',
    idealRoomMinimum: '2.4 m × 2.5 m',
    notes:
      'Also known in the UK as a "Queen" or "Three-Quarter" bed. Saves 15 cm of precious floor width compared with a standard Double.',
  },
  {
    id: 'double',
    name: 'Double',
    widthCm: 135,
    lengthCm: 190,
    dimensionsCm: '135 × 190 cm',
    feetInches: '4\'6" × 6\'3"',
    perPersonWidthCm: 67.5,
    whoItSuits:
      'Britain’s most common two-person bed size for standard master and second bedrooms.',
    idealRoomMinimum: '2.55 m × 2.5 m',
    notes:
      'Note that two adults sharing a 135 cm Double each get 67.5 cm of width—less than a baby’s cot—so upgrading to a King is transformative if space permits.',
  },
  {
    id: 'king',
    name: 'King',
    widthCm: 150,
    lengthCm: 200,
    dimensionsCm: '150 × 200 cm',
    feetInches: '5\'0" × 6\'6"',
    perPersonWidthCm: 75,
    whoItSuits:
      'Couples in master bedrooms and anyone over 5\'10" (178 cm) who benefits from the extra 10 cm of legroom.',
    idealRoomMinimum: '2.7 m × 2.6 m',
    notes:
      'Adds both 15 cm of width and 10 cm of length over a standard UK Double, dramatically reducing nighttime partner disturbance.',
  },
  {
    id: 'super-king',
    name: 'Super King',
    widthCm: 180,
    lengthCm: 200,
    dimensionsCm: '180 × 200 cm',
    feetInches: '6\'0" × 6\'6"',
    perPersonWidthCm: 90,
    whoItSuits:
      'Spacious master suites, couples who value hotel-grade personal space, and families whose children or pets join them on Sunday mornings.',
    idealRoomMinimum: '3.0 m × 2.6 m',
    notes:
      'Gives each partner the full 90 cm width of a Single bed side by side. Check staircase turns before ordering a one-piece Super King mattress.',
  },
];

export interface RoomSizeRecommendation {
  roomWidthM: number;
  roomLengthM: number;
  recommendedSize: UkBedSizeDetail;
  fitsWithFullClearance: boolean;
  sideClearanceCmEach: number;
  footClearanceCm: number;
  fittingSizeNames: string[];
  summaryText: string;
}

/**
 * Recommends the largest comfortable UK bed size for a given room width and length (in metres),
 * maintaining at least 60 cm (0.60 m) walking clearance on EACH side of the bed and 60 cm at the foot end.
 */
export function recommendBedSizeForRoom(
  rawWidthM: number,
  rawLengthM: number
): RoomSizeRecommendation {
  const roomWidthM = Number.isFinite(rawWidthM)
    ? Math.max(1.5, Math.min(8.0, Number(rawWidthM.toFixed(2))))
    : 3.0;
  const roomLengthM = Number.isFinite(rawLengthM)
    ? Math.max(1.8, Math.min(8.0, Number(rawLengthM.toFixed(2))))
    : 3.2;

  const MIN_SIDE_CLEARANCE_CM = 60;
  const MIN_FOOT_CLEARANCE_CM = 60;

  const fittingSizes = UK_BED_SIZE_DETAILS.filter((spec) => {
    const sideEachCm = (roomWidthM * 100 - spec.widthCm) / 2;
    const footCm = roomLengthM * 100 - spec.lengthCm;
    return (
      sideEachCm >= MIN_SIDE_CLEARANCE_CM && footCm >= MIN_FOOT_CLEARANCE_CM
    );
  });

  if (fittingSizes.length > 0) {
    const best = fittingSizes[fittingSizes.length - 1];
    const sideClearanceCmEach = Math.round(
      (roomWidthM * 100 - best.widthCm) / 2
    );
    const footClearanceCm = Math.round(roomLengthM * 100 - best.lengthCm);

    return {
      roomWidthM,
      roomLengthM,
      recommendedSize: best,
      fitsWithFullClearance: true,
      sideClearanceCmEach,
      footClearanceCm,
      fittingSizeNames: fittingSizes.map((s) => s.name),
      summaryText: `A ${best.name} (${best.dimensionsCm}) is the largest comfortable fit for your ${roomWidthM.toFixed(1)}m × ${roomLengthM.toFixed(1)}m room, leaving ${sideClearanceCmEach} cm of walking clearance on each side and ${footClearanceCm} cm at the foot end.`,
    };
  }

  // Fallback to Single if room is narrower than 2.1m × 2.5m
  const single = UK_BED_SIZE_DETAILS[0];
  const sideClearanceCmEach = Math.max(
    0,
    Math.round((roomWidthM * 100 - single.widthCm) / 2)
  );
  const footClearanceCm = Math.max(
    0,
    Math.round(roomLengthM * 100 - single.lengthCm)
  );

  return {
    roomWidthM,
    roomLengthM,
    recommendedSize: single,
    fitsWithFullClearance: false,
    sideClearanceCmEach,
    footClearanceCm,
    fittingSizeNames: [],
    summaryText: `Your ${roomWidthM.toFixed(1)}m × ${roomLengthM.toFixed(1)}m room is compact for a centred bed with 60 cm walkways on both sides. We recommend a Single (${single.dimensionsCm}) placed neatly against one side wall to free up ${Math.max(0, Math.round(roomWidthM * 100 - single.widthCm))} cm of floor walkway.`,
  };
}

export type FaqCategory =
  | 'All'
  | 'Ordering'
  | 'Delivery'
  | 'Returns'
  | 'Product condition'
  | 'Payments';

export const FAQ_CATEGORIES: FaqCategory[] = [
  'All',
  'Ordering',
  'Delivery',
  'Returns',
  'Product condition',
  'Payments',
];

export interface FaqItem {
  id: string;
  category: Exclude<FaqCategory, 'All'>;
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'delivery-time',
    category: 'Delivery',
    question: 'How long does UK delivery take and can I choose my delivery day?',
    answer:
      'Because every clearance bed, mattress, and bedside table is already held in stock at our Midlands warehouse, mainland UK delivery takes just 3–5 working days (7–10 working days for the Scottish Highlands & Islands, and 5–8 working days for Northern Ireland). Within 24 hours of ordering or confirming your reservation, we text and email you a calendar link to pick your preferred delivery day, followed by a 3-hour time window 48 hours before arrival.',
  },
  {
    id: 'delivery-access-stairs',
    category: 'Delivery',
    question:
      'Will the crew carry my bed or Super King mattress upstairs to my bedroom?',
    answer:
      'Yes. When you select our Two-Person Room of Choice (£49) or White-Glove Assembly (£89) service, our uniformed two-person specialist furniture team will carry your order up to two flights of stairs (or via a passenger lift) directly into your chosen bedroom. Please check staircase turns and ceiling clearance if ordering a one-piece King or Super King mattress.',
  },
  {
    id: 'ex-display-condition',
    category: 'Product condition',
    question:
      'What is the difference between Ex-display, End-of-line, and Overstock items?',
    answer:
      'Overstock items are brand-new, factory-sealed pieces from excess production runs. End-of-line pieces are brand-new items where a British manufacturer has discontinued a specific fabric colourway or seasonal trim. Ex-display items have stood inside a climate-controlled partner showroom to demonstrate frame craftsmanship; every ex-display item undergoes our 5-stage inspection, ultrasonic sanitisation, and grading protocol before dispatch.',
  },
  {
    id: 'mattress-hygiene-grading',
    category: 'Product condition',
    question: 'Are clearance mattresses brand new or have they been slept on?',
    answer:
      'None of our clearance mattresses have ever been slept on in a home. Overstock and End-of-line mattresses are 100% factory-sealed in heavy-duty polythene. Ex-display showroom mattresses have only been displayed on a showroom bed frame with a protective foot-runner and are UV-C sanitised, steam-freshened, and sealed in fresh transit wrapping prior to dispatch.',
  },
  {
    id: 'warranty-guarantee',
    category: 'Product condition',
    question: 'Do clearance items come with a supplier warranty?',
    answer:
      'Warranty cover depends on the individual deal and fulfilling UK supplier. Many new overstock, refurbished, and ex-display deals include a supplier warranty (shown in the product specifications table), alongside your statutory rights under the UK Consumer Rights Act 2015.',
  },
  {
    id: 'reservation-hold',
    category: 'Ordering',
    question:
      'How do I buy or enquire about a clearance deal on UK Clearance Hub?',
    answer:
      'UK Clearance Hub is a product discovery and referral service. When you find a deal, click "View Deal" to visit the supplier’s website directly, or click "Enquire Now" / WhatsApp to generate a unique Lead ID and ask our UK desk to confirm stock availability or delivery details with the supplier.',
  },
  {
    id: 'uk-size-compatibility',
    category: 'Ordering',
    question:
      'Do your beds and headboards fit standard UK mattresses and divan bases?',
    answer:
      'Yes. Every bed frame, mattress, and headboard featured in our Home & Living range conforms to standard British National Bed Federation (NBF) dimensions: Single (90×190 cm), Small Double (120×190 cm), Double (135×190 cm), King (150×200 cm), and Super King (180×200 cm).',
  },
  {
    id: 'returns-policy-clearance',
    category: 'Returns',
    question: 'Can I return a clearance item if I change my mind?',
    answer:
      'Yes. Under the UK Consumer Contracts Regulations 2013, when you buy online or over the phone from a UK supplier for home delivery, you have a statutory 14-day cancellation window starting the day after your goods are delivered. Items must be kept in clean, unused condition; return collection terms are set by the fulfilling supplier.',
  },
  {
    id: 'faulty-or-damaged-returns',
    category: 'Returns',
    question:
      'What happens if my item arrives with transit damage or develops a fault?',
    answer:
      'In accordance with the UK Consumer Rights Act 2015, if an item arrives with unreported transit damage or a fault that was not disclosed in its condition grade, you have a statutory 30-day short-term right to reject for a repair, replacement, or full refund from the fulfilling supplier, plus ongoing statutory protection and any stated supplier warranty.',
  },
  {
    id: 'payment-methods-vat',
    category: 'Payments',
    question:
      'How do payments work and do displayed prices include UK VAT?',
    answer:
      'All guide prices displayed on UK Clearance Hub are shown in Pound Sterling (£) including UK VAT. Because we are a referral platform, we never take payments on this website—you complete your purchase securely with the fulfilling UK supplier using their accepted payment methods.',
  },
  {
    id: 'interest-free-instalments',
    category: 'Payments',
    question: 'Does using UK Clearance Hub add any extra fees to the price?',
    answer:
      'Never. UK Clearance Hub is completely free for shoppers to use. When you buy through one of our referral links or supplier introductions, we may earn a commission from the supplier, which never increases the price you pay.',
  },
  {
    id: 'old-bed-recycling',
    category: 'Delivery',
    question: 'Can the supplier’s delivery team recycle my old mattress or appliance?',
    answer:
      'Many of our partner UK furniture and appliance suppliers offer optional like-for-like recycling collection when booking a two-person delivery. Ask our team via "Enquire Now" or WhatsApp with your Lead ID and postcode and we will confirm whether recycling collection is available for that deal.',
  },
];

export function filterFaqItems(
  items: FaqItem[],
  category: FaqCategory,
  searchQuery: string
): FaqItem[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  return items.filter((item) => {
    const matchesCategory = category === 'All' || item.category === category;
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;
    return (
      item.question.toLowerCase().includes(normalizedQuery) ||
      item.answer.toLowerCase().includes(normalizedQuery) ||
      item.category.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function findFaqByHash(
  items: FaqItem[],
  hash: string
): FaqItem | undefined {
  const cleanId = hash.replace(/^#/, '').trim();
  if (!cleanId) return undefined;
  return items.find((item) => item.id === cleanId);
}

export const CONTACT_TOPICS: string[] = [
  'Clearance stock enquiry',
  'Bed or mattress sizing advice',
  'Existing order & delivery slot',
  'Returns or aftercare support',
  'Supplier partnership & stock listing',
  'Trade & interior designer enquiry',
];

export function resolveContactTopicFromQuery(topicParam: string | null): string {
  const cleaned = (topicParam ?? '').trim().toLowerCase();
  if (cleaned === 'supplier' || cleaned.includes('supplier')) {
    return 'Supplier partnership & stock listing';
  }
  const exact = CONTACT_TOPICS.find((t) => t.toLowerCase() === cleaned);
  return exact ?? CONTACT_TOPICS[0];
}

export interface ContactFormInput {
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
}

export interface ContactFormValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof ContactFormInput, string>>;
}

export function validateContactForm(
  input: ContactFormInput
): ContactFormValidationResult {
  const errors: Partial<Record<keyof ContactFormInput, string>> = {};

  if (!input.name || input.name.trim().length < 2) {
    errors.name = 'Please enter your full name.';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!input.email || !emailRegex.test(input.email.trim())) {
    errors.email = 'Please enter a valid UK or international email address.';
  }

  const cleanedPhone = (input.phone || '').replace(/[\s()-]/g, '');
  const phoneRegex = /^(\+44|0)[1-9]\d{8,9}$/;
  if (!cleanedPhone || !phoneRegex.test(cleanedPhone)) {
    errors.phone =
      'Please enter a valid UK telephone or mobile number (e.g. 07700 900123).';
  }

  if (!input.topic || input.topic.trim().length === 0) {
    errors.topic = 'Please select an enquiry topic.';
  }

  if (!input.message || input.message.trim().length < 10) {
    errors.message =
      'Please enter a message of at least 10 characters so we can assist you.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
