export type DealCategory =
  | 'Electronics & Gadgets'
  | 'Home Appliances'
  | 'Home & Living';

export type DealCondition = 'New' | 'Refurbished' | 'Graded' | 'Ex-display';

export type DealStockStatus =
  | 'In stock'
  | 'Low stock'
  | 'Out of stock'
  | 'Check with supplier';

export type DealStatus = 'active' | 'expired' | 'unavailable';

export type ThreeDModelCategory =
  | 'Beds'
  | 'Mattresses'
  | 'Headboards'
  | 'Bedside tables';

/** Kept as an alias so 3D camera/isolation utilities continue to type-check cleanly */
export type ProductCategory = ThreeDModelCategory;

export type UkBedSizeLabel =
  | 'Single'
  | 'Small Double'
  | 'Double'
  | 'King'
  | 'Super King';

export interface ProductSizeOption {
  label: UkBedSizeLabel | string;
  dimensionsCm: string;
  ukCode?: string;
  /** Z-axis width multiplier for 3D bed/mattress/headboard/pillow scaling (King = 1.0) */
  widthScale: number;
}

export interface ProductColourOption {
  name: string;
  hex: string;
}

export interface DealImage {
  src: string;
  alt: string;
}

export interface DealThreeDConfig {
  modelCategory: ThreeDModelCategory;
  sizes: ProductSizeOption[];
  colours: ProductColourOption[];
}

export interface Deal {
  /** Internal product ID (e.g. "UKCH-P-0001") — NEVER render in visible UI */
  id: string;
  slug: string;
  title: string;
  brand: string;
  category: DealCategory;
  subcategory: string;
  shortDescription: string;
  description: string;
  highlights: string[];
  specs: Record<string, string>;
  images: DealImage[];
  condition: DealCondition;
  conditionNote?: string;
  price: number;
  referencePrice?: number;
  priceVerified: boolean;
  stockStatus: DealStockStatus;
  delivery: string;
  deliveredBy: string;
  /** Internal supplier ID (e.g. "SUP-001") — NEVER render in visible UI */
  supplierId: string;
  supplierName: string;
  dealUrl?: string;
  enquiryEnabled: boolean;
  status: DealStatus;
  expiresAt?: string;
  isSample: boolean;
  addedOrder: number;
  recommendedRank: number;
  /** Present on converted 3D bed/mattress/headboard/bedside-table items */
  threeDConfig?: DealThreeDConfig;
}

export const STOCK_CONFIRMATION_NOTE = 'Subject to supplier confirmation';

export const DEAL_CATEGORIES: DealCategory[] = [
  'Electronics & Gadgets',
  'Home Appliances',
  'Home & Living',
];

export const DEAL_CONDITIONS: DealCondition[] = [
  'New',
  'Refurbished',
  'Graded',
  'Ex-display',
];

export const UK_BED_SIZES: ProductSizeOption[] = [
  {
    label: 'Single',
    dimensionsCm: '90×190 cm',
    ukCode: "3'0\" Single",
    widthScale: 0.68,
  },
  {
    label: 'Small Double',
    dimensionsCm: '120×190 cm',
    ukCode: "4'0\" Small Double",
    widthScale: 0.82,
  },
  {
    label: 'Double',
    dimensionsCm: '135×190 cm',
    ukCode: "4'6\" Double",
    widthScale: 0.91,
  },
  {
    label: 'King',
    dimensionsCm: '150×200 cm',
    ukCode: "5'0\" King",
    widthScale: 1.0,
  },
  {
    label: 'Super King',
    dimensionsCm: '180×200 cm',
    ukCode: "6'0\" Super King",
    widthScale: 1.16,
  },
];

const BEDSIDE_STANDARD_SIZE: ProductSizeOption[] = [
  {
    label: 'Standard Pair / Single',
    dimensionsCm: '52×44×56 cm',
    ukCode: 'Bedside Standard',
    widthScale: 1.0,
  },
];

/**
 * Formats a GBP amount with £ and UK comma thousands separators (no decimals when whole).
 */
export function formatGBP(amount: number): string {
  const isWhole =
    Number.isInteger(amount) || Math.abs(amount - Math.round(amount)) < 1e-6;
  const formatted = new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  }).format(isWhole ? Math.round(amount) : amount);
  return `£${formatted}`;
}

/** Alias kept for shared components such as PriceRangeSlider */
export const formatPrice = formatGBP;

/**
 * Returns the verified saving percentage (1..99) ONLY when referencePrice exists,
 * is greater than price, and priceVerified is true; otherwise returns null.
 */
export function getSavingPercent(
  deal: Pick<Deal, 'price' | 'referencePrice' | 'priceVerified'>
): number | null {
  if (
    !deal.priceVerified ||
    typeof deal.referencePrice !== 'number' ||
    !Number.isFinite(deal.referencePrice) ||
    deal.referencePrice <= 0 ||
    deal.price <= 0 ||
    deal.price >= deal.referencePrice
  ) {
    return null;
  }
  const pct = Math.round(
    ((deal.referencePrice - deal.price) / deal.referencePrice) * 100
  );
  return pct > 0 ? pct : null;
}

/**
 * Checks whether a deal is currently live (status === 'active' and not past expiresAt).
 */
export function isDealLive(deal: Deal, now: Date = new Date()): boolean {
  if (deal.status !== 'active') {
    return false;
  }
  if (deal.expiresAt) {
    const expiryTime = Date.parse(deal.expiresAt);
    if (!Number.isNaN(expiryTime) && now.getTime() > expiryTime) {
      return false;
    }
  }
  return true;
}

/**
 * Validates that a supplier/affiliate dealUrl uses HTTPS and is a well-formed URL.
 */
export function isValidDealUrl(url: string | undefined): boolean {
  if (!url || !url.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Appends referral tracking query parameters to a valid HTTPS dealUrl while preserving
 * existing query parameters and URL hash.
 * Adds: ?utm_source=ukclearancehub&utm_medium=referral&utm_campaign=<category>&ukch_ref=<leadId>
 */
export function buildDealOutboundUrl(
  dealUrl: string | undefined,
  leadId: string,
  category: string = 'general'
): string | null {
  if (!isValidDealUrl(dealUrl)) {
    return null;
  }
  try {
    const parsed = new URL(dealUrl!.trim());
    parsed.searchParams.set('utm_source', 'ukclearancehub');
    parsed.searchParams.set('utm_medium', 'referral');
    parsed.searchParams.set('utm_campaign', category);
    parsed.searchParams.set('ukch_ref', leadId.trim());
    return parsed.toString();
  } catch {
    return null;
  }
}

// ─── 18 LIVE SAMPLE DEALS + 2 EXPIRED/UNAVAILABLE SAMPLE DEALS ───────────────

export const ALL_DEALS: Deal[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // ELECTRONICS & GADGETS (6 Live Sample Deals)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'UKCH-P-0001',
    slug: 'auralis-anc-pro-wireless-headphones',
    title: 'Auralis Studio ANC Pro Over-Ear Wireless Headphones',
    brand: 'Auralis Acoustics',
    category: 'Electronics & Gadgets',
    subcategory: 'Headphones',
    shortDescription:
      'Hybrid 45dB active noise-cancelling wireless headphones with 40mm beryllium-coated drivers, 55-hour battery life, and multipoint Bluetooth 5.3.',
    description:
      'Cleared from a UK audio distributor end-of-season allocation, the Auralis Studio ANC Pro pairs five-microphone adaptive noise cancellation with studio-tuned 40mm dynamic drivers. Plush protein-leather memory foam earcups provide all-day comfort for commuting and home listening.',
    highlights: [
      'Adaptive 45dB hybrid active noise cancellation with transparency mode',
      'Up to 55 hours playback on a single USB-C charge (40 hours with ANC on)',
      'Dual-device Bluetooth 5.3 multipoint + 3.5mm wired studio cable included',
      'Fold-flat aluminium yoke with hard-shell travel case',
    ],
    specs: {
      'Driver Size': '40mm custom dynamic with titanium-coated diaphragm',
      'Battery Life': 'Up to 55 hours (ANC off) / 40 hours (ANC on); 10-min fast charge = 6 hours',
      Connectivity: 'Bluetooth 5.3 (AAC, aptX Adaptive) + 3.5mm Aux + USB-C audio',
      Weight: '268 g (excluding carry case)',
      Warranty: '12-month supplier warranty included',
    },
    images: [],
    condition: 'Refurbished',
    conditionNote:
      'Manufacturer refurbished in sealed box with unused earpads and full accessory kit',
    price: 89,
    referencePrice: 219,
    priceVerified: true,
    stockStatus: 'In stock',
    delivery: 'Delivered by supplier, 2–4 working days',
    deliveredBy: 'Tracked UK parcel courier',
    supplierId: 'SUP-001',
    supplierName: 'NorthGate Tech & Appliance Clearance Ltd',
    dealUrl: undefined,
    enquiryEnabled: true,
    status: 'active',
    isSample: true,
    addedOrder: 18,
    recommendedRank: 2,
  },
  {
    id: 'UKCH-P-0002',
    slug: 'chronovex-titanium-gps-smartwatch',
    title: 'ChronoVex Vantage 45mm Titanium Dual-Band GPS Smartwatch',
    brand: 'ChronoVex',
    category: 'Electronics & Gadgets',
    subcategory: 'Smartwatches',
    shortDescription:
      'Aerospace-grade titanium fitness and outdoor smartwatch featuring a sapphire AMOLED display, 14-day battery, and offline UK OS trail mapping.',
    description:
      'Ex-cabinet display stock from a specialist UK wearable retailer. The ChronoVex Vantage combines a scratch-resistant sapphire crystal lens and brushed grade-5 titanium bezel with dual-frequency L1+L5 satellite tracking and continuous wrist-based heart-rate and SpO2 telemetry.',
    highlights: [
      '1.43-inch 1,000-nit always-on AMOLED display under flat sapphire glass',
      'Dual-band multi-GNSS GPS for accurate urban and UK moorland navigation',
      'Up to 14 days typical battery life or 36 hours continuous GPS recording',
      '5 ATM water resistance suitable for pool and open-water swimming',
    ],
    specs: {
      'Case Dimensions': '45 × 45 × 11.4 mm (Grade-5 Titanium bezel, polymer rear)',
      Display: '1.43" AMOLED (466 × 466 px) with Sapphire Crystal',
      Compatibility: 'iOS 15+ and Android 10+ via companion app',
      Strap: '22mm quick-release fluoroelastomer strap (fits 140–215 mm wrists)',
      Warranty: '12-month supplier warranty',
    },
    images: [],
    condition: 'Ex-display',
    conditionNote: 'Locked glass cabinet display unit — unmarked sapphire crystal and bezel',
    price: 119,
    referencePrice: 279,
    priceVerified: true,
    stockStatus: 'Low stock',
    delivery: 'Delivered by supplier, 2–4 working days',
    deliveredBy: 'Tracked UK parcel courier',
    supplierId: 'SUP-001',
    supplierName: 'NorthGate Tech & Appliance Clearance Ltd',
    dealUrl: undefined,
    enquiryEnabled: true,
    status: 'active',
    isSample: true,
    addedOrder: 17,
    recommendedRank: 5,
  },
  {
    id: 'UKCH-P-0003',
    slug: 'velocetab-11-oled-128gb-tablet',
    title: 'VeloceTab 11-Inch 2.5K 120Hz OLED Tablet (128GB, Wi-Fi 6)',
    brand: 'VeloceTech',
    category: 'Electronics & Gadgets',
    subcategory: 'Tablets',
    shortDescription:
      'Ultra-slim 5.9mm CNC aluminium tablet with an 11-inch 2.5K 120Hz OLED screen, quad-speaker spatial audio, and 8GB RAM / 128GB storage.',
    description:
      'Factory-sealed overstock from a commercial UK education and enterprise hardware roll-out. With an 8,600mAh all-day battery and low-latency stylus support, the VeloceTab 11 handles streaming, reading, and productivity effortlessly.',
    highlights: [
      '11-inch 2560 × 1600 OLED panel with 120Hz adaptive refresh rate',
      'Octa-core processor paired with 8GB LPDDR5 RAM and 128GB UFS 3.1 storage',
      'Quad stereo speakers tuned for wide-stage media playback',
      'Includes 33W UK 3-pin fast charger and braided USB-C cable in box',
    ],
    specs: {
      Display: '11.0" 2.5K OLED (2560 × 1600), 120Hz, 600 nits peak',
      Memory: '8GB RAM + 128GB storage (microSD expandable up to 1TB)',
      Battery: '8,600mAh Li-Polymer with 33W UK fast charging',
      Dimensions: '254 × 165 × 5.9 mm · 475 g',
      Connectivity: 'Wi-Fi 6 (802.11ax), Bluetooth 5.2, USB-C 3.2',
    },
    images: [],
    condition: 'New',
    conditionNote: 'Factory-sealed UK retail box',
    price: 199,
    referencePrice: 329,
    priceVerified: false, // Unverified reference price -> UI must show only £199
    stockStatus: 'In stock',
    delivery: 'Delivered by supplier, 2–4 working days',
    deliveredBy: 'Tracked UK parcel courier',
    supplierId: 'SUP-001',
    supplierName: 'NorthGate Tech & Appliance Clearance Ltd',
    dealUrl: undefined,
    enquiryEnabled: true,
    status: 'active',
    isSample: true,
    addedOrder: 16,
    recommendedRank: 8,
  },
  {
    id: 'UKCH-P-0004',
    slug: 'klangwerk-omni-360-bluetooth-speaker',
    title: 'Klangwerk Omni 360 Weatherproof Portable Bluetooth Speaker',
    brand: 'Klangwerk Audio',
    category: 'Electronics & Gadgets',
    subcategory: 'Bluetooth Speakers',
    shortDescription:
      '40W RMS 360-degree portable wireless speaker with dual passive bass radiators, IP67 dust/waterproofing, and 20-hour battery.',
    description:
      'Engineered with an acoustic waveguide cone that disperses balanced sound evenly across rooms, patios, and gardens. Wrapped in hydrophobic woven acoustic fabric with a tactile anodised aluminium carry handle.',
    highlights: [
      '40W RMS output with dual opposing passive bass radiators',
      'IP67 rated — fully dust-tight and waterproof up to 1 metre for 30 minutes',
      'True Wireless Stereo (TWS) pairing links two speakers for left/right stereo',
      'Built-in USB-C power bank output for topping up your phone on the go',
    ],
    specs: {
      'Audio Output': '40W RMS (2 × 15W full-range + 10W tweeter + dual passive radiators)',
      'Ingress Protection': 'IP67 waterproof and dustproof',
      'Playtime': 'Up to 20 hours at 50% volume',
      Dimensions: 'Ø 108 × H 212 mm · 1.15 kg',
      Charging: 'USB-C 5V/3A (cable included)',
    },
    images: [],
    condition: 'New',
    price: 64,
    referencePrice: undefined,
    priceVerified: false,
    stockStatus: 'In stock',
    delivery: 'Delivered by supplier, 3–5 working days',
    deliveredBy: 'Tracked UK parcel courier',
    supplierId: 'SUP-003',
    supplierName: 'Caledonian Surplus & Retail Partners',
    dealUrl: undefined,
    enquiryEnabled: true,
    status: 'active',
    isSample: true,
    addedOrder: 15,
    recommendedRank: 11,
  },
  {
    id: 'UKCH-P-0005',
    slug: 'aerosweep-lidar-self-empty-robot-vacuum',
    title: 'AeroSweep LiDAR Pro Robot Vacuum & 3L Self-Emptying Dock',
    brand: 'AeroSweep Home',
    category: 'Electronics & Gadgets',
    subcategory: 'Robot Vacuums',
    shortDescription:
      '5,500Pa laser-guided robot vacuum and mop with multi-floor UK home mapping, carpet boost, and a 60-day hands-free auto-empty base.',
    description:
      'Precision 360-degree dToF LiDAR scans your floorplan in minutes, creating room-by-room cleaning schedules and virtual no-go zones. Automatically boosts suction on carpets and empties collected dust into a sealed 3-litre allergen bag at the dock.',
    highlights: [
      '5,500Pa brushless suction motor with automatic ultrasonic carpet boost',
      'Compact self-emptying dock holds up to 60 days of household dust and pet hair',
      'Stores up to 4 floor maps — ideal for British townhouses and multi-storey homes',
      'Up to 180 minutes runtime per charge with automatic recharge-and-resume',
    ],
    specs: {
      Suction: '5,500 Pa max with 4 adjustable power modes',
      Navigation: '360° LiDAR + cliff and bumper sensors',
      'Dock Capacity': '3.0L sealed E12 allergen dust bag',
      'Robot Dimensions': 'Ø 350 × H 96.5 mm (fits under standard radiators & sofas)',
      Plug: 'UK BS 1363 3-pin moulded plug',
    },
    images: [],
    condition: 'Graded',
    conditionNote: 'Grade A: outer transit box repackaged; vacuum and dock unused',
    price: 179,
    referencePrice: 449,
    priceVerified: true,
    stockStatus: 'Low stock',
    delivery: 'Delivered by supplier, 3–5 working days',
    deliveredBy: 'Tracked UK courier',
    supplierId: 'SUP-001',
    supplierName: 'NorthGate Tech & Appliance Clearance Ltd',
    dealUrl: undefined,
    enquiryEnabled: true,
    status: 'active',
    isSample: true,
    addedOrder: 14,
    recommendedRank: 3,
  },
  {
    id: 'UKCH-P-0006',
    slug: 'luminaview-55-4k-qled-hdr-smart-tv',
    title: 'LuminaView 55-Inch 4K Ultra HD QLED 120Hz HDR Smart TV',
    brand: 'LuminaView Electronics',
    category: 'Electronics & Gadgets',
    subcategory: '4K TVs',
    shortDescription:
      'Quantum-dot 55-inch 4K television with full-array local dimming, HDMI 2.1 120Hz VRR gaming support, Freeview Play, and Dolby Atmos.',
    description:
      'Sourced from a regional showroom display refresh, this 55-inch QLED panel delivers over a billion quantum-dot colour shades with deep local-dimming contrast. Built-in UK Freeview Play catch-up apps (BBC iPlayer, ITVX, Channel 4, My5) and twin HDMI 2.1 ports.',
    highlights: [
      '55-inch 4K QLED panel with Full-Array Local Dimming and HDR10+ / Dolby Vision',
      'Native 120Hz panel with HDMI 2.1 ALLM and VRR for next-gen console gaming',
      'Integrated UK Freeview Play HD tuner and voice remote',
      'Supplied with centre pedestal stand, remote, and 12-month supplier warranty',
    ],
    specs: {
      'Screen Size': '55 inches (139 cm diagonal) · 3840 × 2160 4K UHD',
      'Refresh Rate': '120Hz native with Variable Refresh Rate (48–120Hz)',
      Ports: '4 × HDMI (2 × HDMI 2.1 eARC/120Hz), 2 × USB, Optical, Ethernet, CI+',
      'Dimensions (with stand)': 'W 1228 × H 774 × D 265 mm · VESA 300 × 200',
      'Energy Rating': 'UK/EU Class F (SDR) / Class G (HDR)',
    },
    images: [],
    condition: 'Ex-display',
    conditionNote: 'Showroom wall display — panel uniformity checked, zero dead pixels',
    price: 329,
    referencePrice: 699,
    priceVerified: true,
    stockStatus: 'Check with supplier',
    delivery: 'Delivered by supplier, 3–5 working days',
    deliveredBy: 'Two-person specialist TV courier',
    supplierId: 'SUP-001',
    supplierName: 'NorthGate Tech & Appliance Clearance Ltd',
    dealUrl: undefined,
    enquiryEnabled: true,
    status: 'active',
    isSample: true,
    addedOrder: 13,
    recommendedRank: 6,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HOME APPLIANCES (6 Live Sample Deals)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'UKCH-P-0007',
    slug: 'crispair-dual-zone-9l-air-fryer',
    title: 'CrispAir Dual-Zone 9L Digital Air Fryer with Viewing Windows',
    brand: 'CrispAir Culinary',
    category: 'Home Appliances',
    subcategory: 'Air Fryers',
    shortDescription:
      'Family-sized 9-litre twin-drawer air fryer (2 × 4.5L) with illuminated glass viewing windows, SyncFinish technology, and PFAS-free ceramic baskets.',
    description:
      'Cook a whole 2kg roast chicken in one drawer and crispy roast potatoes in the other, timed to finish together with SyncFinish. Illuminated double-glazed windows let you check browning progress without opening the drawers and losing heat.',
    highlights: [
      'Twin independent 4.5L drawers (9L total capacity) with SyncFinish & MatchCook',
      'Illuminated tempered-glass viewing windows on both drawers',
      '8 one-touch presets: Air Fry, Roast, Bake, Grill, Dehydrate, Reheat, Chips, Fish',
      'Dishwasher-safe PFAS-free non-stick ceramic crisper plates and baskets',
    ],
    specs: {
      Capacity: '9.0 Litres total (2 × 4.5L independent zones)',
      Power: '2,400W · 40°C to 210°C digital thermostat',
      Dimensions: 'W 385 × D 315 × H 322 mm',
      Materials: 'Brushed stainless steel fascia, BPA/PFAS-free ceramic coating',
      Plug: 'UK 13A 3-pin plug (0.9m cord)',
    },
    images: [],
    condition: 'New',
    conditionNote: 'Factory-sealed overstock carton',
    price: 69,
    referencePrice: 159,
    priceVerified: true,
    stockStatus: 'In stock',
    delivery: 'Delivered by supplier, 2–4 working days',
    deliveredBy: 'Tracked UK parcel courier',
    supplierId: 'SUP-003',
    supplierName: 'Caledonian Surplus & Retail Partners',
    dealUrl: undefined,
    enquiryEnabled: true,
    status: 'active',
    isSample: true,
    addedOrder: 12,
    recommendedRank: 4,
  },
  {
    id: 'UKCH-P-0008',
    slug: 'hydrospin-9kg-1400rpm-inverter-washing-machine',
    title: 'HydroSpin 9kg 1400rpm A-Rated Steam Inverter Washing Machine',
    brand: 'HydroSpin Appliances',
    category: 'Home Appliances',
    subcategory: 'Washing Machines',
    shortDescription:
      'Freestanding 9kg family drum washing machine with a quiet brushless inverter motor, hygienic anti-allergy steam cycle, and 15-minute quick wash.',
    description:
      'Cleared as Grade-A cosmetic stock due to a minor warehouse handling mark on the left side panel (hidden once slotted under a standard 60cm UK kitchen counter). Tested to full factory pressure and spin standards with a 12-month supplier warranty.',
    highlights: [
      'A-rated energy efficiency — saves water and electricity on every load',
      'Hygienic SteamCare finish reduces creases and removes 99.9% of common allergens',
      'Whisper-quiet brushless DirectDrive inverter motor (72 dB max spin)',
      '15-minute rapid refresh cycle for lightly soiled daily laundry',
    ],
    specs: {
      Capacity: '9.0 kg cotton load · 1,400 rpm max spin speed',
      'Energy Rating': 'UK Class A (49 kWh per 100 cycles)',
      Dimensions: 'H 845 × W 598 × D 565 mm (Standard 60cm freestanding slot)',
      Programmes: '15 programmes including Eco 40-60, Wool, Bedding, Steam Allergy, 15m Quick',
      Finish: 'Polar White with tinted glass porthole door',
    },
    images: [],
    condition: 'Graded',
    conditionNote: 'Grade A: minor 3cm cosmetic mark on left side panel; front fascia immaculate',
    price: 229,
    referencePrice: 469,
    priceVerified: true,
    stockStatus: 'In stock',
    delivery: 'Delivered by supplier, 3–5 working days',
    deliveredBy: 'Two-person UK appliance courier',
    supplierId: 'SUP-001',
    supplierName: 'NorthGate Tech & Appliance Clearance Ltd',
    dealUrl: undefined,
    enquiryEnabled: true,
    status: 'active',
    isSample: true,
    addedOrder: 11,
    recommendedRank: 7,
  },
  {
    id: 'UKCH-P-0009',
    slug: 'frostline-70-30-total-no-frost-fridge-freezer',
    title: 'FrostLine 200cm 70/30 Total No-Frost Fridge Freezer (Brushed Steel)',
    brand: 'FrostLine UK',
    category: 'Home Appliances',
    subcategory: 'Fridge Freezers',
    shortDescription:
      'Tall 355-litre 70/30 freestanding fridge freezer with Total No-Frost multi-airflow cooling, humidity crisper drawer, and reversible doors.',
    description:
      'With 251 litres of chilled space above a 104-litre three-drawer freezer, the FrostLine 70/30 eliminates manual defrosting altogether. Dual air-duct sensors maintain consistent cabinet temperatures even after loading the weekly shop.',
    highlights: [
      'Total No-Frost circulation prevents ice build-up in both fridge and freezer',
      'Generous 355L net capacity (251L fridge / 104L freezer) — holds ~19 shopping bags',
      '2-bottle chrome wine rack plus humidity-controlled fruit & veg crisper',
      'Flush 90-degree door opening with reversible left/right hinges',
    ],
    specs: {
      'Total Capacity': '355 Litres net (251L Fridge / 104L 4-Star Freezer)',
      Dimensions: 'H 2000 × W 595 × D 635 mm',
      'Noise Level': '37 dB quiet inverter compressor',
      'Flame Retardant Back': 'Yes — full metal-backed safety enclosure',
      Finish: 'Fingerprint-resistant Brushed Inox Steel',
    },
    images: [],
    condition: 'Graded',
    conditionNote: 'Grade A: light 2cm scuff on lower right side edge; front doors unmarked',
    price: 299,
    referencePrice: 649,
    priceVerified: true,
    stockStatus: 'Low stock',
    delivery: 'Delivered by supplier, 3–5 working days',
    deliveredBy: 'Two-person UK appliance courier',
    supplierId: 'SUP-001',
    supplierName: 'NorthGate Tech & Appliance Clearance Ltd',
    dealUrl: undefined,
    enquiryEnabled: true,
    status: 'active',
    isSample: true,
    addedOrder: 10,
    recommendedRank: 9,
  },
  {
    id: 'UKCH-P-0010',
    slug: 'baristacraft-15bar-bean-to-cup-espresso-machine',
    title: 'BaristaCraft 15-Bar Bean-to-Cup Espresso & Latte Machine',
    brand: 'BaristaCraft',
    category: 'Home Appliances',
    subcategory: 'Coffee Machines',
    shortDescription:
      'Stainless-steel automatic bean-to-cup coffee machine with a 13-setting conical burr grinder, thermoblock heating, and manual microfoam steam wand.',
    description:
      'Freshly grinds whole coffee beans immediately before extraction for authentic Italian crema. Engineer-inspected and descaled by our supplier workshop, supplied with a new water filter cartridge and stainless milk jug.',
    highlights: [
      'Integrated stainless steel conical burr grinder with 13 grind settings',
      '15-bar Italian pump with rapid 35-second PID thermoblock heat-up',
      'Commercial-style swivel steam wand for velvety flat white and latte microfoam',
      'Removable 1.8L water tank and front-access brew unit for easy rinsing',
    ],
    specs: {
      Pressure: '15 Bar pump · 1,450W Thermoblock',
      'Bean Hopper': '250g airtight UV-tinted hopper + pre-ground bypass chute',
      'Water Tank': '1.8 Litres removable with water hardness filter slot',
      Dimensions: 'W 238 × D 430 × H 350 mm',
      Warranty: '12-month supplier workshop warranty',
    },
    images: [],
    condition: 'Refurbished',
    conditionNote: 'Supplier-refurbished and pressure-tested; supplied in plain transit box',
    price: 189,
    referencePrice: 399,
    priceVerified: false, // Unverified reference price -> UI must show only £189
    stockStatus: 'In stock',
    delivery: 'Delivered by supplier, 2–4 working days',
    deliveredBy: 'Tracked UK parcel courier',
    supplierId: 'SUP-003',
    supplierName: 'Caledonian Surplus & Retail Partners',
    dealUrl: undefined,
    enquiryEnabled: true,
    status: 'active',
    isSample: true,
    addedOrder: 9,
    recommendedRank: 12,
  },
  {
    id: 'UKCH-P-0011',
    slug: 'vortexclean-v12-anti-tangle-cordless-vacuum',
    title: 'VortexClean V12 450W Anti-Tangle Cordless Stick Vacuum',
    brand: 'VortexClean',
    category: 'Home Appliances',
    subcategory: 'Cordless Vacuums',
    shortDescription:
      'Lightweight 2.4kg cordless vacuum cleaner with LED floorhead, V-comb anti-hair-wrap brush bar, 60-minute runtime, and removable battery.',
    description:
      'Designed for British carpets and hard floors alike, the VortexClean V12 uses a V-shaped comb floorhead that actively separates pet and long hair from the roller as you vacuum. Converts in seconds into a handheld cleaner for stairs and car interiors.',
    highlights: [
      '150 Air Watts suction with 5-stage sealed HEPA filtration (traps 99.97% of dust)',
      'Up to 60 minutes runtime in Eco mode (28m in Auto, 14m in Boost)',
      'Anti-tangle motorised floorhead with LED dust-reveal headlights',
      'Includes crevice tool, upholstery brush, mini motorised pet tool, and wall dock',
    ],
    specs: {
      Motor: '450W digital brushless motor · 150 AW suction',
      Battery: '25.9V removable lithium-ion pack (60 mins max runtime)',
      'Bin Volume': '0.7L one-click hygienic point-and-shoot emptying',
      Weight: '2.4 kg full stick / 1.45 kg handheld',
      Filtration: 'Washable HEPA H13 post-motor filter',
    },
    images: [],
    condition: 'New',
    conditionNote: 'Brand-new boxed overstock',
    price: 115,
    referencePrice: 249,
    priceVerified: true,
    stockStatus: 'In stock',
    delivery: 'Delivered by supplier, 2–4 working days',
    deliveredBy: 'Tracked UK parcel courier',
    supplierId: 'SUP-003',
    supplierName: 'Caledonian Surplus & Retail Partners',
    dealUrl: undefined,
    enquiryEnabled: true,
    status: 'active',
    isSample: true,
    addedOrder: 8,
    recommendedRank: 10,
  },
  {
    id: 'UKCH-P-0012',
    slug: 'heatwave-25l-flatbed-inverter-combination-microwave',
    title: 'HeatWave 25L Flatbed Inverter Microwave, Quartz Grill & Convection Oven',
    brand: 'HeatWave Kitchen',
    category: 'Home Appliances',
    subcategory: 'Microwaves',
    shortDescription:
      'Turntable-free 25-litre combination microwave oven providing 40% more usable dish space for rectangular roasting trays and casserole dishes.',
    description:
      'By replacing the traditional glass turntable with a ceramic flatbed base, the HeatWave 25L accommodates large lasagne dishes that won’t rotate in standard microwaves. Combines 900W inverter microwave heating with a 1,100W quartz grill and 200°C fan convection.',
    highlights: [
      'Turntable-free ceramic flatbed floor — fits large rectangular baking dishes',
      '3-in-1 versatility: 900W Inverter Microwave, 1,100W Grill, and 200°C Convection',
      'Inverter technology delivers continuous gentle heating for even defrosting',
      'Wipe-clean stainless steel cavity with child safety lock',
    ],
    specs: {
      Capacity: '25 Litres usable flatbed interior',
      'Power Output': '900W Microwave / 1,100W Grill / 1,950W Convection',
      Dimensions: 'W 490 × D 410 × H 292 mm',
      Cavity: '304-grade stainless steel with ceramic flatbed floor',
      Plug: 'UK 13A 3-pin plug',
    },
    images: [],
    condition: 'Ex-display',
    conditionNote: 'Kitchen showroom counter display — unused interior cavity',
    price: 84,
    referencePrice: undefined,
    priceVerified: false,
    stockStatus: 'Check with supplier',
    delivery: 'Delivered by supplier, 3–5 working days',
    deliveredBy: 'Tracked UK parcel courier',
    supplierId: 'SUP-003',
    supplierName: 'Caledonian Surplus & Retail Partners',
    dealUrl: undefined,
    enquiryEnabled: true,
    status: 'active',
    isSample: true,
    addedOrder: 7,
    recommendedRank: 14,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HOME & LIVING (6 Live Sample Deals: Bed, Mattress, Headboard, Bedside Table, Sofa, Rug)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'UKCH-P-0013',
    slug: 'savoy-ottoman-bed',
    title: 'Savoy Gas-Lift Storage Ottoman Bed Frame',
    brand: 'Mayfair Sleep Guild',
    category: 'Home & Living',
    subcategory: 'Beds',
    shortDescription:
      'Full-footprint gas-lift storage ottoman bed frame offering 720 litres of boarded under-bed capacity and a deep cushioned headboard.',
    description:
      'Sourced from an end-of-season hotel and luxury apartment production run, the Savoy Ottoman Bed conceals a full-depth storage compartment beneath a twin-piston 600N gas-lift platform. The internal floor is fully boarded to keep spare duvets, luggage, and seasonal linens dust-free off the bedroom carpet.',
    highlights: [
      'Twin 600N German hydraulic gas-lift pistons for effortless one-handed lifting',
      'Fully boarded internal base with anti-slip mattress retention bar',
      'Heavyweight textured bouclé upholstery with double-piped seams',
      'Compliant with UK BS 7177 Domestic Medium Hazard fire safety regulations',
    ],
    specs: {
      Dimensions: 'W 158 × L 212 × H 122 cm (King frame footprint)',
      Materials: 'Engineered hardwood frame, steel ottoman chassis, heavyweight bouclé',
      'Mattress Depth': 'Optimised for mattresses up to 32 cm (up to 65 kg weight)',
      'Weight Capacity': '360 kg (56 stone) structural rating',
      Assembly: 'Modular knockdown frame; self-assembly in 30 mins',
    },
    images: [],
    condition: 'New',
    conditionNote: 'Factory-sealed hotel overstock in breathable transit wrap',
    price: 699,
    referencePrice: 1599,
    priceVerified: true,
    stockStatus: 'In stock',
    delivery: 'Delivered by supplier, 3–5 working days',
    deliveredBy: 'Two-person room-of-choice courier',
    supplierId: 'SUP-002',
    supplierName: 'Albion Home & Living Direct',
    dealUrl: undefined,
    enquiryEnabled: true,
    status: 'active',
    isSample: true,
    addedOrder: 6,
    recommendedRank: 1,
    threeDConfig: {
      modelCategory: 'Beds',
      sizes: UK_BED_SIZES,
      colours: [
        { name: 'Warm Putty Bouclé', hex: '#CFC5B7' },
        { name: 'Slate Graphite Velvet', hex: '#3D3E40' },
        { name: 'Soft Truffle Weave', hex: '#9E8F7F' },
      ],
    },
  },
  {
    id: 'UKCH-P-0014',
    slug: 'harrogate-pocket-2000-mattress',
    title: 'Harrogate Pocket 2000 Natural British Wool Mattress',
    brand: 'Yorkshire Guild Bedmakers',
    category: 'Home & Living',
    subcategory: 'Mattresses',
    shortDescription:
      'Hand-tufted 2,000 pocket-sprung Yorkshire mattress layered with British Herdwick wool, breathable cotton, and edge-to-edge support.',
    description:
      'Handmade in West Yorkshire by an NBF-approved bedmaker, the Harrogate Pocket 2000 features dual tiers of individually nested calico pocket springs that respond independently to shoulder and hip pressure. Generous upholstery layers of pure British wool and crisp cotton regulate humidity through warm summer and cool winter nights.',
    highlights: [
      '2,000 individually nested pocket springs (in King size) for zero motion transfer',
      'Pure British wool and breathable cotton comfort layers — naturally fire-retardant',
      '3 rows of traditional hand side-stitching preventing edge roll-off',
      'Medium-Firm tension suited to front, back, and combination sleepers',
    ],
    specs: {
      Dimensions: '150 × 200 × 29 cm (King); available in all 5 standard UK sizes',
      Materials: 'High-tensile steel pocket springs, British wool, organic cotton, viscose damask',
      'Mattress Depth': '29 cm full-depth hand-tufted profile',
      'Weight Capacity': 'Up to 160 kg (25 stone) per sleeping side',
      Delivery: 'Delivered flat and ready to sleep on (not rolled or vacuum-packed)',
    },
    images: [],
    condition: 'New',
    conditionNote: 'Sealed factory overstock from West Yorkshire workshop',
    price: 399,
    referencePrice: 999,
    priceVerified: true,
    stockStatus: 'In stock',
    delivery: 'Delivered by supplier, 3–5 working days',
    deliveredBy: 'Two-person room-of-choice courier',
    supplierId: 'SUP-002',
    supplierName: 'Albion Home & Living Direct',
    dealUrl: undefined,
    enquiryEnabled: true,
    status: 'active',
    isSample: true,
    addedOrder: 5,
    recommendedRank: 13,
    threeDConfig: {
      modelCategory: 'Mattresses',
      sizes: UK_BED_SIZES,
      colours: [
        { name: 'Natural Belgian Damask Ivory', hex: '#EAE3D7' },
        { name: 'Dove Grey Piped Border', hex: '#C2BDB6' },
      ],
    },
  },
  {
    id: 'UKCH-P-0015',
    slug: 'windsor-winged-headboard',
    title: 'Windsor Floor-Standing Winged Upholstered Headboard',
    brand: 'Mayfair Sleep Guild',
    category: 'Home & Living',
    subcategory: 'Headboards',
    shortDescription:
      'Floor-standing winged headboard with tailored piped edges and deep high-resilience foam padding, universal for UK divan bases.',
    description:
      'Standing a full 135 cm from the floor for superior stability over strutted models, the Windsor Winged Headboard transforms any existing UK divan base into a centrepiece bedstead. Its gently angled side wings frame your pillows neatly whilst shielding against bedroom draughts.',
    highlights: [
      'Full-height floor-standing construction for zero wobble against the wall',
      'Universal UK divan bolt slots compatible with all standard UK bases',
      '6 cm multi-density foam cushioning over FSC-certified birch plywood',
      'Easy-clean stain-repellent fabric treatment included as standard',
    ],
    specs: {
      Dimensions: 'W 162 × D 22 × H 135 cm (King floor-standing size)',
      Materials: 'FSC birch hardwood frame, high-resilience CMHR foam, heavyweight bouclé',
      Compatibility: 'Universal fit for all standard UK divan bases',
      Assembly: 'Attaches to any standard UK divan base in 5 minutes using existing bolts',
    },
    images: [],
    condition: 'Ex-display',
    conditionNote: 'Surrey partner showroom display piece — inspected & steam-sanitised',
    price: 219,
    referencePrice: 549,
    priceVerified: true,
    stockStatus: 'Low stock',
    delivery: 'Delivered by supplier, 3–5 working days',
    deliveredBy: 'Two-person UK courier',
    supplierId: 'SUP-002',
    supplierName: 'Albion Home & Living Direct',
    dealUrl: undefined,
    enquiryEnabled: true,
    status: 'active',
    isSample: true,
    addedOrder: 4,
    recommendedRank: 15,
    threeDConfig: {
      modelCategory: 'Headboards',
      sizes: UK_BED_SIZES,
      colours: [
        { name: 'Warm Ivory Bouclé', hex: '#DDD5C7' },
        { name: 'Stone Linen Weave', hex: '#B8ADA0' },
        { name: 'Deep Charcoal Velvet', hex: '#3B3B3D' },
      ],
    },
  },
  {
    id: 'UKCH-P-0016',
    slug: 'chelsea-2-drawer-bedside-table',
    title: 'Chelsea 2-Drawer Soft-Close Oak Bedside Table',
    brand: 'Cotswold Cabinetworks',
    category: 'Home & Living',
    subcategory: 'Bedside tables',
    shortDescription:
      'Contemporary two-drawer bedside table pairing a crown-cut European oak carcasse with soft-close matte lacquered drawer fronts.',
    description:
      'Designed as the exact companion to our upholstered and timber bed frames, the Chelsea 2-Drawer Bedside Table provides generous concealed storage for bedtime reading and spectacles alongside an uncluttered top surface for a warm bedside lamp. Fitted with concealed German soft-close runners.',
    highlights: [
      'Concealed soft-close drawer runners for silent night-time closing',
      'Solid oak legs and durable scratch-resistant matte lacquer finish',
      'Rear cable management cut-out for discreet phone & lamp leads',
      'Delivered fully assembled in protective corner-guarded packaging',
    ],
    specs: {
      Dimensions: 'W 52 × D 44 × H 56 cm',
      Materials: 'Crown-cut European oak, solid oak legs, matte polyurethane lacquer',
      'Weight Capacity': '35 kg top surface load; 12 kg per drawer',
      Assembly: 'Arrives fully assembled — simply attach the 4 tapered legs',
    },
    images: [],
    condition: 'New',
    conditionNote: 'Boxed factory overstock',
    price: 149,
    referencePrice: undefined,
    priceVerified: false,
    stockStatus: 'In stock',
    delivery: 'Delivered by supplier, 2–4 working days',
    deliveredBy: 'Tracked UK courier',
    supplierId: 'SUP-002',
    supplierName: 'Albion Home & Living Direct',
    dealUrl: undefined,
    enquiryEnabled: true,
    status: 'active',
    isSample: true,
    addedOrder: 3,
    recommendedRank: 16,
    threeDConfig: {
      modelCategory: 'Bedside tables',
      sizes: BEDSIDE_STANDARD_SIZE,
      colours: [
        { name: 'Warm Oak & Matte Ivory', hex: '#C6AD89' },
        { name: 'Smoked Walnut & Charcoal', hex: '#6E5844' },
        { name: 'Natural Ash & Stone', hex: '#D9CBB5' },
      ],
    },
  },
  {
    id: 'UKCH-P-0017',
    slug: 'henley-3-seater-feather-linen-sofa',
    title: 'Henley 3-Seater Deep-Seated Belgian Linen Sofa',
    brand: 'Cotswold Cabinetworks',
    category: 'Home & Living',
    subcategory: 'Sofas',
    shortDescription:
      'Generously proportioned 218cm three-seater sofa crafted with a kiln-dried beech frame, pocket-sprung feather-wrapped cushions, and removable linen covers.',
    description:
      'Originally built for a Cotswold boutique showhome, the Henley 3-Seater Sofa features deep 64cm seat cushions combining a pocket-sprung core with ethically sourced duck-feather and down wraps. Loose washed-linen slipcovers can be unzipped for professional cleaning.',
    highlights: [
      'Kiln-dried solid European beech frame with dowelled and screwed corner blocks',
      'Pocket-sprung seat cores wrapped in feather and down for sink-in support',
      'Removable 100% washed Belgian flax linen covers in Oatmeal Marl',
      'Compliant with UK BS 5852 domestic upholstery fire safety regulations',
    ],
    specs: {
      Dimensions: 'W 218 × D 98 × H 84 cm (Seat height 46 cm, Seat depth 64 cm)',
      Frame: 'FSC-certified kiln-dried European beech with serpentine steel springs',
      Upholstery: '520gsm washed Belgian flax linen (removable covers)',
      Legs: 'Solid turned oak feet with felt floor glides (removable for narrow hallways)',
    },
    images: [],
    condition: 'Ex-display',
    conditionNote: 'Showhome display piece — minor 1cm mark on rear timber leg',
    price: 649,
    referencePrice: 1499,
    priceVerified: true,
    stockStatus: 'Low stock',
    delivery: 'Delivered by supplier, 5–7 working days',
    deliveredBy: 'Two-person room-of-choice courier',
    supplierId: 'SUP-002',
    supplierName: 'Albion Home & Living Direct',
    dealUrl: undefined,
    enquiryEnabled: true,
    status: 'active',
    isSample: true,
    addedOrder: 2,
    recommendedRank: 17,
  },
  {
    id: 'UKCH-P-0018',
    slug: 'kensington-hand-loomed-wool-berber-rug',
    title: 'Kensington Hand-Loomed 100% New Zealand Wool Rug (200×300 cm)',
    brand: 'Hearth & Weave',
    category: 'Home & Living',
    subcategory: 'Rugs',
    shortDescription:
      'Large 200 × 300 cm heavyweight hand-loomed pure wool area rug with a high-low lattice weave, cotton backing, and natural stain resistance.',
    description:
      'Woven from unbleached, lanolin-rich New Zealand wool yarn, the Kensington area rug brings acoustic warmth and underfoot softness to living rooms or beneath a King or Super King bedframe. Sized to frame a three-seater sofa or full bedroom layout.',
    highlights: [
      'Hand-loomed from 100% pure New Zealand wool (3,400 gsm pile weight)',
      'Generous 200 × 300 cm room size suited to living rooms and master bedrooms',
      'Naturally flame-retardant, moth-treated, and compatible with underfloor heating',
      'Heavy organic cotton canvas backing for flat, curl-free floor placement',
    ],
    specs: {
      Dimensions: '200 × 300 cm (approx. 6\'7" × 9\'10") · 16mm pile height',
      Material: '100% New Zealand pure wool pile on 100% cotton warp',
      Weight: '20.4 kg rolled',
      Care: 'Suction-only vacuuming (no beater bar); blot spills immediately',
    },
    images: [],
    condition: 'New',
    conditionNote: 'End-of-line woven batch in sealed heavy-duty polythene',
    price: 159,
    referencePrice: 349,
    priceVerified: true,
    stockStatus: 'In stock',
    delivery: 'Delivered by supplier, 3–5 working days',
    deliveredBy: 'Tracked UK courier',
    supplierId: 'SUP-002',
    supplierName: 'Albion Home & Living Direct',
    dealUrl: undefined,
    enquiryEnabled: true,
    status: 'active',
    isSample: true,
    addedOrder: 1,
    recommendedRank: 18,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPIRED & UNAVAILABLE DEALS (Hidden from listings/search/related; render "This deal has ended" banner on direct URL visit)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'UKCH-P-0019',
    slug: 'ashford-upholstered-bed',
    title: 'Ashford Upholstered Belgian Linen Bed Frame',
    brand: 'Mayfair Sleep Guild',
    category: 'Home & Living',
    subcategory: 'Beds',
    shortDescription:
      'Architectural low-profile upholstered bed frame in tactile Belgian linen with sprung beech slats and solid oak block feet.',
    description:
      'Originally displayed in our Surrey partner showroom, the Ashford Upholstered Bed pairs tailored British upholstery with a kiln-dried Scandinavian pine and hardwood frame. This clearance batch has now concluded with the supplier.',
    highlights: [
      'Hand-upholstered in 420gsm stain-resistant Belgian linen weave',
      'Kiln-dried solid timber perimeter frame with steel centre support rail',
      'European sprung beech slats engineered for silent posture support',
    ],
    specs: {
      Dimensions: 'W 162 × L 214 × H 116 cm (King frame footprint)',
      Materials: 'Kiln-dried solid hardwood, Belgian linen weave, high-resilience foam',
      'Weight Capacity': '350 kg (55 stone) total user + mattress rating',
    },
    images: [],
    condition: 'Ex-display',
    conditionNote: 'Single Surrey showroom floor model (now sold)',
    price: 599,
    referencePrice: 1299,
    priceVerified: true,
    stockStatus: 'Out of stock',
    delivery: 'Delivered by supplier, 3–5 working days',
    deliveredBy: 'Two-person room-of-choice courier',
    supplierId: 'SUP-002',
    supplierName: 'Albion Home & Living Direct',
    dealUrl: 'https://albion-home-direct.example.co.uk/deals/ashford-bed',
    enquiryEnabled: false,
    status: 'expired',
    expiresAt: '2025-11-01T00:00:00.000Z',
    isSample: true,
    addedOrder: 0,
    recommendedRank: 99,
    threeDConfig: {
      modelCategory: 'Beds',
      sizes: UK_BED_SIZES,
      colours: [
        { name: 'Oatmeal Belgian Linen', hex: '#D8CFC2' },
        { name: 'Warm Charcoal Wool', hex: '#4A4946' },
      ],
    },
  },
  {
    id: 'UKCH-P-0020',
    slug: 'kensington-wingback-bed',
    title: 'Kensington Fluted Velvet Wingback Bed Frame',
    brand: 'Mayfair Sleep Guild',
    category: 'Home & Living',
    subcategory: 'Beds',
    shortDescription:
      'Statement winged headboard bedstead with fluted vertical channels, solid turned oak legs, and a recessed platform base.',
    description:
      'End-of-line velvet wingback bed frame batch from our partner workshop. All supplier units in this allocation have now been claimed.',
    highlights: [
      'Sculpted 132 cm tall winged headboard with deep vertical channel fluting',
      'Solid turned European oak legs finished in clear matte lacquer',
      'Recessed mattress well prevents mattress movement during the night',
    ],
    specs: {
      Dimensions: 'W 170 × L 216 × H 132 cm (King outer wing width)',
      Materials: 'Solid beech & birch frame, brushed cotton-velvet, European oak legs',
    },
    images: [],
    condition: 'Ex-display',
    price: 649,
    referencePrice: 1899,
    priceVerified: true,
    stockStatus: 'Out of stock',
    delivery: 'Delivered by supplier, 3–5 working days',
    deliveredBy: 'Two-person room-of-choice courier',
    supplierId: 'SUP-002',
    supplierName: 'Albion Home & Living Direct',
    dealUrl: undefined,
    enquiryEnabled: false,
    status: 'unavailable',
    isSample: true,
    addedOrder: -1,
    recommendedRank: 100,
    threeDConfig: {
      modelCategory: 'Beds',
      sizes: UK_BED_SIZES,
      colours: [{ name: 'Champagne Velvet', hex: '#D4C6B2' }],
    },
  },
];

/** The 18 live sample deals shown across listings, search, and related deals */
export const DEALS: Deal[] = ALL_DEALS.filter((d) => isDealLive(d));

/** Live deals that use the 3D bed.glb snapshot generator */
export const THREE_D_DEALS: Deal[] = ALL_DEALS.filter((d) => Boolean(d.threeDConfig));

export const MAX_DEAL_PRICE: number = Math.max(
  ...DEALS.map((d) => d.price),
  750
);

export const ALL_SUBCATEGORIES: string[] = Array.from(
  new Set(DEALS.map((d) => d.subcategory))
);

export function getSubcategoriesForCategory(
  category: DealCategory | 'All'
): string[] {
  const source =
    category === 'All'
      ? DEALS
      : DEALS.filter((d) => d.category === category);
  return Array.from(new Set(source.map((d) => d.subcategory)));
}

const LEGACY_SLUG_MAP: Record<string, string> = {
  'cotswold-oak-bed': 'savoy-ottoman-bed',
  'yorkshire-wool-ortho-mattress': 'harrogate-pocket-2000-mattress',
  'mayfair-pillow-top-3000-mattress': 'harrogate-pocket-2000-mattress',
  'henley-hybrid-cooling-mattress': 'harrogate-pocket-2000-mattress',
  'belgravia-fluted-velvet-headboard': 'windsor-winged-headboard',
  'marlow-linen-panel-headboard': 'windsor-winged-headboard',
  'chatsworth-buttoned-headboard': 'windsor-winged-headboard',
  'richmond-fluted-oak-nightstand': 'chelsea-2-drawer-bedside-table',
  'cavendish-lacquered-bedside-chest': 'chelsea-2-drawer-bedside-table',
  'arundel-solid-ash-nightstand': 'chelsea-2-drawer-bedside-table',
};

export function getDealBySlug(slug: string | undefined): Deal | undefined {
  if (!slug) return undefined;
  const clean = slug.trim().toLowerCase();
  const direct = ALL_DEALS.find((d) => d.slug.toLowerCase() === clean);
  if (direct) return direct;

  const mappedSlug = LEGACY_SLUG_MAP[clean];
  if (mappedSlug) {
    return ALL_DEALS.find((d) => d.slug === mappedSlug);
  }
  return undefined;
}

/**
 * Returns up to `count` related LIVE deals for a given deal (never includes expired or unavailable deals).
 * Prioritises same subcategory, then same category, then other live deals.
 */
export function getRelatedDeals(
  deal: Deal,
  count: number = 4,
  now: Date = new Date()
): Deal[] {
  const liveCandidates = ALL_DEALS.filter(
    (d) => d.id !== deal.id && isDealLive(d, now)
  );

  const sameSubcategory = liveCandidates.filter(
    (d) =>
      d.category === deal.category &&
      d.subcategory.toLowerCase() === deal.subcategory.toLowerCase()
  );
  const sameCategory = liveCandidates.filter(
    (d) =>
      d.category === deal.category &&
      d.subcategory.toLowerCase() !== deal.subcategory.toLowerCase()
  );
  const otherCategories = liveCandidates.filter(
    (d) => d.category !== deal.category
  );

  return [...sameSubcategory, ...sameCategory, ...otherCategories].slice(
    0,
    count
  );
}

export type DealSortOption =
  | 'recommended'
  | 'saving-desc'
  | 'price-asc'
  | 'price-desc'
  | 'newest';

export interface DealFilterState {
  category: DealCategory | 'All';
  subcategory: string | 'All';
  condition: DealCondition | 'All';
  minPrice: number;
  maxPrice: number;
  inStockOnly: boolean;
  verifiedSavingsOnly: boolean;
  sort: DealSortOption;
  q: string;
}

export const DEFAULT_DEAL_FILTERS: DealFilterState = {
  category: 'All',
  subcategory: 'All',
  condition: 'All',
  minPrice: 0,
  maxPrice: MAX_DEAL_PRICE,
  inStockOnly: false,
  verifiedSavingsOnly: false,
  sort: 'recommended',
  q: '',
};

/**
 * Case-insensitive word matching against title, brand, category, subcategory, and highlights.
 */
export function matchesDealSearchQuery(deal: Deal, query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;

  const haystack = [
    deal.title,
    deal.brand,
    deal.category,
    deal.subcategory,
    ...deal.highlights,
  ]
    .join(' ')
    .toLowerCase();

  return words.every((word) => haystack.includes(word));
}

export function filterAndSortDeals(
  deals: Deal[],
  filters: Partial<DealFilterState>,
  now: Date = new Date()
): Deal[] {
  const merged: DealFilterState = {
    ...DEFAULT_DEAL_FILTERS,
    ...filters,
  };

  const filtered = deals.filter((deal) => {
    // Always exclude expired or unavailable deals from listings and search
    if (!isDealLive(deal, now)) {
      return false;
    }

    if (merged.category !== 'All' && deal.category !== merged.category) {
      return false;
    }

    if (
      merged.subcategory !== 'All' &&
      deal.subcategory.toLowerCase() !== merged.subcategory.toLowerCase()
    ) {
      return false;
    }

    if (merged.condition !== 'All' && deal.condition !== merged.condition) {
      return false;
    }

    if (deal.price < merged.minPrice || deal.price > merged.maxPrice) {
      return false;
    }

    if (merged.inStockOnly && deal.stockStatus !== 'In stock') {
      return false;
    }

    if (merged.verifiedSavingsOnly && getSavingPercent(deal) === null) {
      return false;
    }

    if (merged.q && !matchesDealSearchQuery(deal, merged.q)) {
      return false;
    }

    return true;
  });

  return [...filtered].sort((a, b) => {
    switch (merged.sort) {
      case 'recommended':
        return a.recommendedRank - b.recommendedRank || a.price - b.price;
      case 'saving-desc': {
        const savingA = getSavingPercent(a) ?? -1;
        const savingB = getSavingPercent(b) ?? -1;
        return savingB - savingA || a.price - b.price;
      }
      case 'price-asc':
        return a.price - b.price || a.recommendedRank - b.recommendedRank;
      case 'price-desc':
        return b.price - a.price || a.recommendedRank - b.recommendedRank;
      case 'newest':
        return b.addedOrder - a.addedOrder;
      default:
        return 0;
    }
  });
}

const LEGACY_SUBCATEGORY_FROM_CATEGORY_PARAM: Record<string, string> = {
  Beds: 'Beds',
  Mattresses: 'Mattresses',
  Headboards: 'Headboards',
  'Bedside tables': 'Bedside tables',
};

export function parseDealFilterQueryParams(
  searchParams: URLSearchParams,
  pathname: string = '/deals'
): DealFilterState {
  const rawCategory = (searchParams.get('category') ?? '').trim();
  const rawSubcategory = (searchParams.get('subcategory') ?? '').trim();

  let category: DealCategory | 'All' = 'All';
  let subcategory: string | 'All' = 'All';

  if (pathname === '/home-living' && !rawCategory) {
    category = 'Home & Living';
  }

  if (rawCategory && DEAL_CATEGORIES.includes(rawCategory as DealCategory)) {
    category = rawCategory as DealCategory;
  } else if (
    rawCategory &&
    LEGACY_SUBCATEGORY_FROM_CATEGORY_PARAM[rawCategory]
  ) {
    // Support legacy links like /clearance-deals?category=Mattresses or ?category=Beds
    category = 'Home & Living';
    subcategory = LEGACY_SUBCATEGORY_FROM_CATEGORY_PARAM[rawCategory];
  }

  if (rawSubcategory) {
    const matchedSub = ALL_SUBCATEGORIES.find(
      (s) => s.toLowerCase() === rawSubcategory.toLowerCase()
    );
    if (matchedSub) {
      subcategory = matchedSub;
    }
  }

  const rawCondition = (searchParams.get('condition') ?? '').trim();
  const condition: DealCondition | 'All' =
    rawCondition && DEAL_CONDITIONS.includes(rawCondition as DealCondition)
      ? (rawCondition as DealCondition)
      : 'All';

  const rawMinStr = searchParams.get('minPrice');
  const rawMaxStr = searchParams.get('maxPrice');
  const rawMin =
    rawMinStr !== null && rawMinStr.trim() !== '' ? Number(rawMinStr) : NaN;
  const rawMax =
    rawMaxStr !== null && rawMaxStr.trim() !== '' ? Number(rawMaxStr) : NaN;

  const minPrice =
    Number.isFinite(rawMin) && rawMin >= 0 && rawMin <= MAX_DEAL_PRICE
      ? Math.round(rawMin)
      : 0;
  const maxPrice =
    Number.isFinite(rawMax) && rawMax >= minPrice && rawMax <= MAX_DEAL_PRICE
      ? Math.round(rawMax)
      : MAX_DEAL_PRICE;

  const inStockOnly =
    searchParams.get('inStock') === 'true' ||
    searchParams.get('inStock') === '1';
  const verifiedSavingsOnly =
    searchParams.get('verified') === 'true' ||
    searchParams.get('verified') === '1';

  const rawSort = searchParams.get('sort') as DealSortOption | null;
  const validSorts: DealSortOption[] = [
    'recommended',
    'saving-desc',
    'price-asc',
    'price-desc',
    'newest',
  ];
  const sort: DealSortOption =
    rawSort && validSorts.includes(rawSort) ? rawSort : 'recommended';

  const q = (searchParams.get('q') ?? '').trim();

  return {
    category,
    subcategory,
    condition,
    minPrice,
    maxPrice,
    inStockOnly,
    verifiedSavingsOnly,
    sort,
    q,
  };
}

export function serializeDealFilterQueryParams(
  filters: DealFilterState
): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.category !== 'All') {
    params.category = filters.category;
  }
  if (filters.subcategory !== 'All') {
    params.subcategory = filters.subcategory;
  }
  if (filters.condition !== 'All') {
    params.condition = filters.condition;
  }
  if (filters.minPrice > 0) {
    params.minPrice = String(filters.minPrice);
  }
  if (filters.maxPrice < MAX_DEAL_PRICE) {
    params.maxPrice = String(filters.maxPrice);
  }
  if (filters.inStockOnly) {
    params.inStock = 'true';
  }
  if (filters.verifiedSavingsOnly) {
    params.verified = 'true';
  }
  if (filters.sort !== 'recommended') {
    params.sort = filters.sort;
  }
  if (filters.q && filters.q.trim()) {
    params.q = filters.q.trim();
  }
  return params;
}

/**
 * Computes the Z-axis scale and nightstand/lamp Z offsets when switching UK bed sizes.
 * In bed.glb local coordinates, the bed width runs along Z, centered near defaultCenterZ.
 */
export function computeBedSizeZOffsets(
  widthScale: number,
  origBedCenterZ: number,
  origBedHalfWidthZ: number,
  origLeftNightstandZ: number,
  origRightNightstandZ: number
): {
  scaleZMultiplier: number;
  leftDeltaZ: number;
  rightDeltaZ: number;
} {
  const clampedScale = Math.max(0.5, Math.min(1.5, widthScale));
  const halfWidthDelta = origBedHalfWidthZ * (clampedScale - 1.0);

  const leftSign = origLeftNightstandZ < origBedCenterZ ? -1 : 1;
  const rightSign = origRightNightstandZ < origBedCenterZ ? -1 : 1;

  return {
    scaleZMultiplier: clampedScale,
    leftDeltaZ: leftSign * halfWidthDelta,
    rightDeltaZ: rightSign * halfWidthDelta,
  };
}
