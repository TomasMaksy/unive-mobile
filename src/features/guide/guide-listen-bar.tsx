import { type AudioPlaylist, setAudioModeAsync, useAudioPlaylist, useAudioPlaylistStatus } from 'expo-audio';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { Colors, Fonts, Shape, Spacing } from '@/constants/theme';
import type { GuideAudioSegment } from '@/lib/guide';

const SPEEDS = [1, 1.25, 1.5, 0.75] as const;

type GuideListenBarProps = {
  segments: GuideAudioSegment[];
  /** Play from this recording (a section id or "intro"); `n` changes on every request. */
  request: { id: string; n: number } | null;
  /** The recording playing now, so the screen can mark its section. */
  onSegmentChange: (id: string | null) => void;
  bottomInset: number;
};

/**
 * Listen to the guide, read by the website's narrator: one recording per
 * section, played one after another. Floats at the bottom like Podcasts'
 * mini player.
 */
export function GuideListenBar({ segments, request, onSegmentChange, bottomInset }: GuideListenBarProps) {
  // Created once with all the recordings; this component only mounts once they're known.
  const playlist = useAudioPlaylist({ sources: segments.map((segment) => ({ uri: segment.audioUrl })), updateInterval: 250 });
  const status = useAudioPlaylistStatus(playlist);
  const [pressedPlay, setPressedPlay] = useState(false);
  // Playing starts with the button here or a section's listen button.
  const started = pressedPlay || request !== null;
  const [speed, setSpeed] = useState(0);

  const current = started ? segments[status.currentIndex] : undefined;
  const totalMinutes = Math.max(1, Math.round(segments.reduce((sum, s) => sum + s.durationSeconds, 0) / 60));
  const finished = started && !status.playing && status.currentIndex === segments.length - 1 && status.duration > 0 && status.currentTime >= status.duration - 0.3;

  useEffect(() => {
    // Plays with the ring/silent switch on, like any app you listen to on purpose.
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  useEffect(() => {
    if (!request) return;
    const index = segments.findIndex((segment) => segment.id === request.id);
    if (index < 0) return;
    playlist.skipTo(index);
    playlist.play();
  }, [request, segments, playlist]);

  useEffect(() => {
    onSegmentChange(started && !finished ? (segments[status.currentIndex]?.id ?? null) : null);
  }, [started, finished, status.currentIndex, segments, onSegmentChange]);

  function toggle() {
    setPressedPlay(true);
    if (finished) playlist.skipTo(0);
    if (status.playing) playlist.pause();
    else playlist.play();
  }

  function changeSpeed() {
    const next = (speed + 1) % SPEEDS.length;
    setSpeed(next);
    setRate(playlist, SPEEDS[next]);
  }

  const progress = status.duration > 0 ? Math.min(1, status.currentTime / status.duration) : 0;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(16)}
      layout={LinearTransition.springify()}
      style={[styles.wrap, { bottom: bottomInset + Spacing.two }]}>
      <Surface>
        <View style={styles.row}>
          <RoundButton
            systemImage={status.playing ? 'pause.fill' : 'play.fill'}
            label={status.playing ? 'Pause' : 'Listen'}
            onPress={toggle}
          />
          <View style={styles.titles}>
            {current && !finished ? (
              <>
                <Text style={styles.title} numberOfLines={1}>
                  {current.title}
                </Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${progress * 100}%` }]} />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.title}>{finished ? 'Listen again' : 'Listen to this guide'}</Text>
                <Text style={styles.subtitle}>{totalMinutes} min · read aloud</Text>
              </>
            )}
          </View>
          {started && !finished ? (
            <>
              <PressableScale onPress={changeSpeed} accessibilityRole="button" accessibilityLabel="Playback speed" style={styles.speed}>
                <Text style={styles.speedText}>{SPEEDS[speed]}×</Text>
              </PressableScale>
              <RoundButton
                systemImage="forward.end.fill"
                label="Next section"
                plain
                onPress={() => {
                  if (status.currentIndex >= segments.length - 1) return;
                  // Moving on keeps playing (next() alone stops at the new section).
                  playlist.next();
                  playlist.play();
                }}
              />
            </>
          ) : null}
        </View>
      </Surface>
    </Animated.View>
  );
}

// The playlist is a native object whose rate is set as a property.
function setRate(playlist: AudioPlaylist, rate: number) {
  playlist.playbackRate = rate;
}

// iOS 26's glass, or a white pill before it.
function Surface({ children }: { children: React.ReactNode }) {
  if (isLiquidGlassAvailable()) {
    return (
      <GlassView glassEffectStyle="regular" tintColor="rgba(249, 249, 247, 0.75)" isInteractive style={styles.surface}>
        {children}
      </GlassView>
    );
  }
  return <View style={[styles.surface, styles.solid]}>{children}</View>;
}

function RoundButton({ systemImage, label, onPress, plain }: { systemImage: SFSymbol; label: string; onPress: () => void; plain?: boolean }) {
  return (
    <PressableScale haptic pressedScale={0.88} onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={[styles.round, plain && styles.roundPlain]}>
      <SymbolView name={systemImage} size={plain ? 18 : 16} tintColor={plain ? Colors.text : '#ffffff'} style={styles.roundIcon} />
    </PressableScale>
  );
}

const ROUND = 40;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
  },
  surface: {
    ...Shape.pill,
    overflow: 'hidden',
    paddingVertical: Spacing.two,
    paddingLeft: Spacing.two,
    paddingRight: Spacing.three,
  },
  solid: {
    backgroundColor: Colors.backgroundElement,
    boxShadow: '0 6px 24px rgba(0, 0, 0, 0.12)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  round: {
    width: ROUND,
    height: ROUND,
    borderRadius: ROUND / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.olive,
  },
  roundPlain: {
    backgroundColor: 'transparent',
    width: 32,
  },
  roundIcon: {
    width: 20,
    height: 20,
  },
  titles: {
    flex: 1,
    gap: Spacing.one,
  },
  title: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  track: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  fill: {
    height: 3,
    backgroundColor: Colors.olive,
  },
  speed: {
    ...Shape.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  speedText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 13,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
});
