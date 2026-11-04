import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { siteUrl } from '@/lib/guide';

// The website's Knowledge Library picture: a reading room whose shelves fill
// up as the library does, in 19 frames (unive-v2's public/knwoledge-img-seq).
const FRAME_COUNT = 19;
const FRAMES = Array.from({ length: FRAME_COUNT }, (_, index) =>
  siteUrl(`/knwoledge-img-seq/library000864${String(index).padStart(2, '0')}.webp`),
);
const FRAME_MS = 55;

/** The frame for a completion percent, the same mapping as the website's (99% is the last frame). */
function frameFor(percent: number) {
  const clamped = Math.min(99, Math.max(0, percent));
  return Math.round((clamped / 99) * (FRAME_COUNT - 1));
}

/**
 * The room for your completion: it fills from empty to where you are when the
 * page opens. Every frame is stacked and loaded up front, and only the current
 * one is visible, so the flip-book never flickers.
 */
export function Bookshelf({ percent, size }: { percent: number; size: number }) {
  const target = frameFor(percent);
  const [frame, setFrame] = useState(0);
  // Which frames have loaded: it only steps onto a frame that can show.
  const [loaded, setLoaded] = useState<ReadonlySet<number>>(() => new Set());
  const next = frame + Math.sign(target - frame);

  useEffect(() => {
    // Steps one frame at a time towards the target, up or down.
    if (frame === target || !loaded.has(next)) return;
    const timer = setTimeout(() => setFrame(next), FRAME_MS);
    return () => clearTimeout(timer);
  }, [frame, next, target, loaded]);

  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {FRAMES.slice(0, Math.max(target, frame) + 1).map((uri, index) => (
        <Image
          key={uri}
          source={{ uri }}
          style={[StyleSheet.absoluteFill, { opacity: index === frame ? 1 : 0 }]}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={0}
          onLoad={() => setLoaded((current) => new Set(current).add(index))}
        />
      ))}
    </View>
  );
}
