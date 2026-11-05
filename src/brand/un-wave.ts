/**
 * The "un" as a wave: the geometry behind every Unive loader.
 *
 * Ported from unive-brand/src/lib/un-wave.ts. The maths is the same; the
 * only change is that each function is a Reanimated worklet, so the loader
 * draws its frames on the UI thread and keeps moving while JavaScript is
 * busy (which is exactly when something is loading).
 *
 * `un-geometry.json` holds the icon's centreline and stroke radius, traced
 * from the hand-drawn artwork. One stretch of it is a period: repeated end
 * to end it makes an endless "ununun" wave. Every loader is a window onto it:
 *
 *   flow    the icon slides along its own path, like a wave through water
 *   write   a pen writes the icon, then lifts it off again
 *   ribbon  a long wave for progress, written left to right
 */
import geometry from './un-geometry.json';

type Point = [number, number, number];
type Sample = { x: number; y: number; r: number };

const PERIOD = geometry.period as Point[];
const FULL = geometry.full as Point[];
const SHIFT = geometry.shift as [number, number];
const TAIL = geometry.tail;
const HEAD = geometry.head;
/** The flow trims the stroke ends a little, where the endless wave would hook into the next letter. */
const TRIM = 0.72;

function arcLengths(points: Point[]): number[] {
  const s = [0];
  for (let i = 1; i < points.length; i++) {
    s.push(s[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  }
  return s;
}

const PERIOD_S = arcLengths(PERIOD);
const FULL_S = arcLengths(FULL);
const PERIOD_LENGTH = PERIOD_S[PERIOD_S.length - 1];
const ICON_LENGTH = FULL_S[FULL_S.length - 1];

function lookup(points: Point[], s: number[], at: number): Sample {
  'worklet';
  let lo = 0;
  let hi = s.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (s[mid] <= at) lo = mid;
    else hi = mid;
  }
  const t = s[hi] === s[lo] ? 0 : (at - s[lo]) / (s[hi] - s[lo]);
  const a = points[lo];
  const b = points[hi];
  return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, r: a[2] + (b[2] - a[2]) * t };
}

function onWave(s: number): Sample {
  'worklet';
  const k = Math.floor(s / PERIOD_LENGTH);
  const p = lookup(PERIOD, PERIOD_S, s - k * PERIOD_LENGTH);
  return { x: p.x + k * SHIFT[0], y: p.y + k * SHIFT[1], r: p.r };
}

function onIcon(s: number): Sample {
  'worklet';
  return lookup(FULL, FULL_S, Math.min(Math.max(s, 0), ICON_LENGTH));
}

function fmt(v: number): string {
  'worklet';
  return (Math.round(v * 10) / 10).toString();
}

/**
 * A variable-width stroke drawn as overlapping discs along the path, one SVG
 * path. With the nonzero fill rule the discs merge into one clean shape at
 * any size. `dx`/`dy` move the whole stroke (the flow's camera).
 */
function strokeDiscs(
  kind: 'wave' | 'icon',
  from: number,
  to: number,
  step: number,
  dx = 0,
  dy = 0,
  ribbonShift = 0,
): string {
  'worklet';
  const len = to - from;
  if (len < 0) return '';
  const n = Math.max(1, Math.ceil(len / step));
  let d = '';
  for (let i = 0; i <= n; i++) {
    const s = from + (len * i) / n;
    const p = kind === 'wave' ? onWave(s) : onIcon(s);
    const r = p.r;
    if (r <= 0) continue;
    const x = p.x + dx - ribbonShift;
    const y = p.y + dy;
    d += `M${fmt(x - r)} ${fmt(y)}a${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(2 * r)} 0a${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(-2 * r)} 0`;
  }
  return d;
}

/** Disc spacing that keeps the edge within ~0.15 screen px at `scale` px per artwork px. */
export function discStep(scale: number): number {
  'worklet';
  return Math.min(28, Math.max(3, Math.sqrt((8 * 40 * 0.15) / scale)));
}

/** The icon's box in artwork px, with room for the flow's travel. */
export const UN_VIEWBOX = { x: 110, y: 340, width: 1040, height: 700 } as const;

/** Flow: phase 0..1 is one loop. The icon slides one period along its own path; the camera follows. */
export function flowPath(phase: number, step: number): string {
  'worklet';
  const p = ((phase % 1) + 1) % 1;
  const s = p * PERIOD_LENGTH;
  return strokeDiscs('wave', s - TAIL * TRIM, s + PERIOD_LENGTH + HEAD * TRIM, step, -p * SHIFT[0], -p * SHIFT[1]);
}

/** A calm pen: slow in, slow out. */
function easeInOut(t: number): number {
  'worklet';
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Write: the pen writes the icon (phase 0 to 0.5), then lifts it off from the start (0.5 to 1). */
export function writePath(phase: number, step: number): string {
  'worklet';
  const p = ((phase % 1) + 1) % 1;
  const head = easeInOut(Math.min(1, p / 0.5)) * ICON_LENGTH;
  const tail = easeInOut(Math.max(0, (p - 0.5) / 0.5)) * ICON_LENGTH;
  return head - tail < 0.5 ? '' : strokeDiscs('icon', tail, head, step);
}

/** The whole still icon (reduced motion, paused). */
export function iconPath(step: number): string {
  'worklet';
  return strokeDiscs('icon', 0, ICON_LENGTH, step);
}

/**
 * Ribbon: an endless "ununun" wave for progress, `periods` long, flowing at
 * `phase`; `value` 0..1 is how much of it is written.
 */
export function ribbonPath(value: number, phase: number, periods: number, step: number): string {
  'worklet';
  const s0 = (((phase % 1) + 1) % 1) * PERIOD_LENGTH;
  const v = Math.min(1, Math.max(0, value));
  if (v <= 0) return '';
  return strokeDiscs('wave', s0, s0 + periods * PERIOD_LENGTH * v, step, 0, 0, (s0 / PERIOD_LENGTH) * SHIFT[0]);
}

const WAVE_TOP = Math.min(...PERIOD.map((p) => p[1] - p[2]));
const WAVE_BOTTOM = Math.max(...PERIOD.map((p) => p[1] + p[2]));
const WAVE_R = Math.max(...PERIOD.map((p) => p[2]));

export function ribbonBox(periods: number) {
  return {
    x: PERIOD[0][0] - WAVE_R - 8,
    y: WAVE_TOP - 8,
    width: periods * SHIFT[0] + 2 * WAVE_R + 16,
    height: WAVE_BOTTOM - WAVE_TOP + 16,
  };
}
