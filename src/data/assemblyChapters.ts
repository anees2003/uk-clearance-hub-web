export type ChapterPanelSide = 'left' | 'right' | 'center';

export interface ChapterPanelCta {
  label: string;
  to: string;
  variant: 'primary' | 'outline';
}

export interface ChapterPanelContent {
  side: ChapterPanelSide;
  chapterNumber?: string;
  eyebrowLabel?: string;
  heading: string;
  copy: string;
  specs?: string[];
  ctas?: ChapterPanelCta[];
}

export interface ChapterDefinition {
  id: string;
  label: string;
  timelineLabel: string;
  startTime: number;
  panel?: ChapterPanelContent;
}

export interface ChapterProgressStop {
  id: string;
  label: string;
  sectionIndex: number;
}

export const CHAPTER_PROGRESS_STOPS: ChapterProgressStop[] = [
  { id: 'chapter-base', label: 'Base', sectionIndex: 1 },
  { id: 'chapter-mattress', label: 'Mattress', sectionIndex: 2 },
  { id: 'chapter-headboard', label: 'Headboard', sectionIndex: 3 },
  { id: 'chapter-pillows', label: 'Pillows', sectionIndex: 4 },
  { id: 'chapter-bedside', label: 'Bedside', sectionIndex: 5 },
  { id: 'chapter-lighting', label: 'Lighting', sectionIndex: 6 },
  { id: 'chapter-complete', label: 'Complete', sectionIndex: 7 },
];

/**
 * Ensures preloader progress is clamped to [0, 100] and never jumps backwards.
 */
export function computeMonotonicProgress(
  prevMax: number,
  rawProgress: number,
  active: boolean,
  loaded: number,
  total: number
): number {
  const safePrev = Math.max(0, Math.min(100, prevMax));
  const rawClamped = Math.max(0, Math.min(100, Number.isFinite(rawProgress) ? rawProgress : 0));

  if (!active && total > 0 && loaded >= total) {
    return 100;
  }

  return Math.max(safePrev, rawClamped);
}

/**
 * Formats a numeric progress value (0..100) as a 3-digit tabular string ("000" -> "100").
 */
export function formatPreloaderCounter(value: number): string {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return String(clamped).padStart(3, '0');
}

export interface ChapterProgressState {
  isVisible: boolean;
  fillProgress: number;
  activeStopIndex: number;
  activeStopId: string;
}

/**
 * Computes the visibility, vertical/top bar fill progress (0..1), and active stop
 * for the 7 assembly chapters (Base through Complete) given the current scroll offset.
 *
 * The chapters wrapper has 8 sections of height `viewportHeight` (indices 0..7):
 * - index 0: chapter-hero (bar hidden while in hero, fades in after hero at >= 0.55 * vh)
 * - indices 1..7: Base (1) through Complete (7)
 * - > 7.45 * vh: "More sections coming" covers the viewport (bar fades out)
 */
export function computeChapterProgressState(
  scrollY: number,
  wrapperTopDocY: number,
  viewportHeight: number
): ChapterProgressState {
  const vh = Math.max(1, viewportHeight);
  const relScroll = scrollY - wrapperTopDocY;
  const chapterFloat = relScroll / vh; // 0 at hero, 1 at base, ..., 7 at complete

  const isVisible = chapterFloat >= 0.55 && chapterFloat <= 7.45;

  // Fill progress across the 7 assembly chapters (from Base start ~0.55 to Complete 7.0)
  const rawFill = (chapterFloat - 0.55) / (7.0 - 0.55);
  const fillProgress = Math.max(0, Math.min(1, rawFill));

  // Map chapterFloat (1..7) to stop index (0..6)
  const activeStopIndex = Math.max(
    0,
    Math.min(
      CHAPTER_PROGRESS_STOPS.length - 1,
      Math.round(chapterFloat) - 1
    )
  );

  return {
    isVisible,
    fillProgress,
    activeStopIndex,
    activeStopId: CHAPTER_PROGRESS_STOPS[activeStopIndex].id,
  };
}

export const ASSEMBLY_CHAPTERS: ChapterDefinition[] = [
  {
    id: 'chapter-hero',
    label: '01 · Hero (Empty Studio Floor)',
    timelineLabel: 'hero',
    startTime: 0,
  },
  {
    id: 'chapter-base',
    label: '02 · Divan Base Assembly',
    timelineLabel: 'base',
    startTime: 0.25,
    panel: {
      side: 'left',
      chapterNumber: '01 / 06',
      eyebrowLabel: 'Foundations',
      heading: 'Solid foundations',
      copy: 'Every restful night begins beneath the mattress. Our clearance divan bases and bedsteads are crafted from kiln-dried solid timber with steel-reinforced corner brackets, engineered for high weight capacity and silent, creak-free support. Sprung beech slats and ventilated platform tops distribute load evenly from edge to edge.',
      specs: [
        'Kiln-dried solid timber & steel-reinforced frame construction',
        'Tested to 350 kg (55 stone) weight capacity across King & Super King',
        'Sprung beech slatted support for airflow & mattress longevity',
      ],
    },
  },
  {
    id: 'chapter-mattress',
    label: '03 · Orthopaedic Mattress Drop',
    timelineLabel: 'mattress',
    startTime: 1.0,
    panel: {
      side: 'right',
      chapterNumber: '02 / 06',
      eyebrowLabel: 'Mattress Craft',
      heading: 'Mattress layers explained',
      copy: 'Individually nested pocket springs respond independently to your body contours so movement on one side never disturbs the other. Above the spring core, high-density memory foam and open-cell cooling layers relieve pressure at the shoulders and hips whilst regulating sleep temperature. Available in Soft-Medium, Medium-Firm and Orthopaedic tensions.',
      specs: [
        'Up to 2,000 individually nested pocket springs for zoned spinal alignment',
        'Pressure-relieving memory foam paired with breathable cooling layers',
        'Tailored firmness options from plush hotel medium to orthopaedic firm',
      ],
    },
  },
  {
    id: 'chapter-headboard',
    label: '04 · Winged Headboard Hinge',
    timelineLabel: 'headboard',
    startTime: 2.0,
    panel: {
      side: 'left',
      chapterNumber: '03 / 06',
      eyebrowLabel: 'Headboards',
      heading: 'Upholstered headboards',
      copy: 'Upholstered in tactile Belgian linen, rich velvet and textured bouclé, our statement headboards bring warmth and architectural proportion to the bedroom. Deep high-resilience foam padding offers generous cushioned comfort when sitting up to read. Every fabric is treated with an easy-clean finish to resist everyday marks.',
      specs: [
        'Woven linen, brushed velvet & heavyweight bouclé upholstery options',
        'Deeply padded high-resilience foam over solid hardwood struts',
        'Easy-clean stain protection compliant with UK BS 7177 fire standards',
      ],
    },
  },
  {
    id: 'chapter-pillows',
    label: '05 · Layered Pillows Stagger',
    timelineLabel: 'pillows',
    startTime: 3.0,
    panel: {
      side: 'right',
      chapterNumber: '04 / 06',
      eyebrowLabel: 'Pillows & Layering',
      heading: 'The finishing touch',
      copy: 'Thoughtful pillow layering balances neck alignment with cloud-like softness. Start with a supportive pair of rebound hollowfibre pillows at the back to cradle your posture, then layer indulgent duck-feather and down pillows in front for sink-in comfort. Finished in breathable cotton percale casings that stay crisp all night.',
      specs: [
        'Bounce-back hollowfibre & ethically sourced duck-feather fills',
        'Supportive rear foundation pillows paired with soft-loft front pillows',
        '300-thread-count combed cotton casings with double-piped seams',
      ],
    },
  },
  {
    id: 'chapter-bedside',
    label: '06 · Bedside Nightstands Slide',
    timelineLabel: 'bedside',
    startTime: 4.0,
    panel: {
      side: 'left',
      chapterNumber: '05 / 06',
      eyebrowLabel: 'Bedroom Furniture',
      heading: 'Complete the bedroom',
      copy: 'Matching bedside tables frame the bed with symmetry and practical storage. Smooth soft-close drawers keep evening reading, glasses and charging cables neatly tucked away so the top surface stays calm and uncluttered. Sourced directly from ex-display and overstock collections at substantial clearance savings.',
      specs: [
        'Matching left & right bedside tables in warm oak and matte lacquer',
        'Deep soft-close drawer storage with solid timber runners',
        'Ex-display & end-of-line cabinet pairs at up to 70% off RRP',
      ],
    },
  },
  {
    id: 'chapter-lighting',
    label: '07 · Bedside Lamps & Warm Glow',
    timelineLabel: 'lighting',
    startTime: 5.0,
    panel: {
      side: 'right',
      chapterNumber: '06 / 06',
      eyebrowLabel: 'Bedside Lighting',
      heading: 'Set the mood',
      copy: 'Replacing harsh overhead glare with warm bedside lighting signals to your body that it is time to unwind. Fitted with 2700K warm-white bulbs behind woven linen shades, our lamps cast a gentle, low-blue-light glow that supports natural melatonin rhythms and creates a cosy evening ambience.',
      specs: [
        'Warm 2700K colour temperature engineered for better sleep hygiene',
        'Linen-diffused shades for soft, glare-free bedtime reading',
        'Cosy evening ambience with independent left and right bedside control',
      ],
    },
  },
  {
    id: 'chapter-complete',
    label: '08 · Complete Bed Set Hold',
    timelineLabel: 'complete',
    startTime: 6.0,
    panel: {
      side: 'center',
      heading: 'Up to 70% off. Clearance stock, top brands.',
      copy: 'Ex-display, end-of-line and overstock furniture, inspected and delivered across the UK.',
      ctas: [
        {
          label: 'Shop Home & Living Deals',
          to: '/deals?category=Home%20%26%20Living',
          variant: 'primary',
        },
        {
          label: 'Bed Size Guide',
          to: '/bed-size-guide',
          variant: 'outline',
        },
      ],
    },
  },
];
