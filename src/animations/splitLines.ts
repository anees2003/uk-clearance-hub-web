export interface WordOffsetMeasurement {
  word: string;
  offsetTop: number;
}

/**
 * Pure helper that groups measured words into lines whenever their vertical
 * offsetTop changes beyond tolerancePx.
 */
export function groupWordsByOffsetTop(
  measurements: WordOffsetMeasurement[],
  tolerancePx = 3
): string[][] {
  if (measurements.length === 0) return [];

  const lines: string[][] = [];
  let currentLine: string[] = [measurements[0].word];
  let currentTop = measurements[0].offsetTop;

  for (let i = 1; i < measurements.length; i++) {
    const item = measurements[i];
    if (Math.abs(item.offsetTop - currentTop) <= tolerancePx) {
      currentLine.push(item.word);
    } else {
      lines.push(currentLine);
      currentLine = [item.word];
      currentTop = item.offsetTop;
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}

export interface SplitLinesResult {
  lineMasks: HTMLElement[];
  lineInners: HTMLElement[];
  revert: () => void;
}

/**
 * Splits a heading/text element into masked lines without GSAP SplitText:
 * 1. Wraps each word in a temporary span to measure its rendered offsetTop.
 * 2. Groups words sharing the same offsetTop into lines.
 * 3. Wraps each line in an overflow-hidden mask (<span data-line-mask>) containing
 *    an inner animated line span (<span data-line-inner>).
 */
export function splitLines(element: HTMLElement): SplitLinesResult {
  const originalText =
    element.dataset.originalText ?? (element.textContent || '').replace(/\s+/g, ' ').trim();
  element.dataset.originalText = originalText;

  const words = originalText.split(' ').filter(Boolean);
  if (words.length === 0) {
    return {
      lineMasks: [],
      lineInners: [],
      revert: () => {
        element.textContent = originalText;
      },
    };
  }

  // Pass 1: Measure word offsetTops in the current container width
  element.textContent = '';
  const wordSpans: HTMLSpanElement[] = [];

  words.forEach((word, index) => {
    const span = document.createElement('span');
    span.style.display = 'inline-block';
    span.textContent = word;
    element.appendChild(span);
    wordSpans.push(span);

    if (index < words.length - 1) {
      element.appendChild(document.createTextNode(' '));
    }
  });

  const measurements: WordOffsetMeasurement[] = wordSpans.map((span, idx) => ({
    word: words[idx],
    offsetTop: span.offsetTop,
  }));

  const groupedLines = groupWordsByOffsetTop(measurements, 3);

  // Pass 2: Build overflow-hidden line masks and inner animated spans
  element.textContent = '';
  const lineMasks: HTMLElement[] = [];
  const lineInners: HTMLElement[] = [];

  groupedLines.forEach((lineWords) => {
    const mask = document.createElement('span');
    mask.dataset.lineMask = 'true';
    mask.className = 'block overflow-hidden pb-[0.09em] -mb-[0.09em]';

    const inner = document.createElement('span');
    inner.dataset.lineInner = 'true';
    inner.className = 'block will-change-transform';
    inner.textContent = lineWords.join(' ');

    mask.appendChild(inner);
    element.appendChild(mask);

    lineMasks.push(mask);
    lineInners.push(inner);
  });

  return {
    lineMasks,
    lineInners,
    revert: () => {
      element.textContent = originalText;
    },
  };
}
