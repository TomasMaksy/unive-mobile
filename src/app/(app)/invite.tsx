import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon-button';
import { Button, PressableScale, Text } from '@/components/ui';
import { alpha, colors, duration, easeUnive, haptics, pressScale, riseIn, shape, space } from '@/theme';
import { siteUrl } from '@/lib/guide';
import { fetchReferralInvite, type ReferralInvite } from '@/lib/referral';

// Like the website's invite dialog, the gift scene melts into a warm brown:
// here the brand's dusk (the website used an off-palette #816856).
const PAGE = colors.placeholder;
const SHARE_BAR_SPACE = 120;

const STEPS: { icon: SFSymbol; title: string; description: string }[] = [
  { icon: 'square.and.arrow.up', title: 'Share your link', description: 'Send your personal Unive invite to a friend.' },
  { icon: 'creditcard', title: 'They join Unive', description: 'Your friend signs up and subscribes through your link.' },
  { icon: 'gift', title: 'You both get a month free', description: 'One free month each, added automatically.' },
];

/**
 * Give & get: invite a friend and you both get a month of Unive free, like the
 * website's invite dialog. Opened from "Invite friends" on the profile.
 */
export default function InviteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [invite, setInvite] = useState<ReferralInvite | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralInvite().then(setInvite, () => {});
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  async function share() {
    try {
      const { inviteUrl } = invite ?? (await fetchReferralInvite());
      // The link goes inside the message: passed separately, iOS's Copy would copy only the text.
      await Share.share({ message: `Join me on Unive and we both get a month free: ${inviteUrl}` });
    } catch {
      Alert.alert("Couldn't load your invite link", 'Check your connection and try again.');
    }
  }

  async function copy() {
    if (!invite) return;
    try {
      await Clipboard.setStringAsync(invite.inviteUrl);
      haptics.success();
      setCopied(true);
    } catch (error) {
      Alert.alert("Couldn't copy your link", error instanceof Error ? error.message : 'Please try again.');
    }
  }

  const heroHeight = width * 1.05;

  return (
    <View style={styles.screen}>
      <ScrollView contentInsetAdjustmentBehavior="never" contentContainerStyle={{ paddingBottom: insets.bottom + SHARE_BAR_SPACE }}>
        <View style={{ height: heroHeight }}>
          <Image source={{ uri: siteUrl('/scenes/gift-scene-4.webp') }} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="top" transition={300} />
          {/* The scene melts into the page's brown, like the website's. */}
          <View pointerEvents="none" style={styles.heroFade} />
        </View>

        <View style={styles.body}>
          <Animated.View entering={riseIn(1)} style={styles.titles}>
            <Text variant="h1" color="textInverse">
              Give & get{'\n'}a month of Unive free
            </Text>
            <Text color="onInverseMuted">Share Unive with a friend. When they join, you both get a month free.</Text>
          </Animated.View>

          {invite && (invite.timesRedeemed > 0 || invite.pendingRewardMonths > 0) ? (
            <Animated.View entering={FadeIn.duration(duration.standard).easing(easeUnive)} style={styles.stats}>
              <Stat value={invite.timesRedeemed} label={invite.timesRedeemed === 1 ? 'friend joined' : 'friends joined'} />
              <View style={styles.statDivider} />
              <Stat value={invite.timesRedeemed} label={invite.timesRedeemed === 1 ? 'month earned' : 'months earned'} />
              {invite.pendingRewardMonths > 0 ? (
                <>
                  <View style={styles.statDivider} />
                  <Stat value={invite.pendingRewardMonths} label="waiting" />
                </>
              ) : null}
            </Animated.View>
          ) : null}

          <View style={styles.steps}>
            {STEPS.map((step, index) => (
              <Animated.View key={step.title} entering={riseIn(2 + index)} style={styles.step}>
                <View style={styles.stepIcon}>
                  <SymbolView name={step.icon} size={18} tintColor={colors.textInverse} style={styles.icon} />
                </View>
                <View style={styles.stepText}>
                  <Text variant="headline" color="textInverse">
                    {step.title}
                  </Text>
                  <Text variant="small" color="onInverseMuted">
                    {step.description}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Your link: tap to copy it. */}
          <PressableScale
            pressedScale={pressScale.card}
            onPress={() => void copy()}
            accessibilityRole="button"
            accessibilityLabel="Copy your invite link"
            style={styles.link}>
            <Text variant="callout" color="textInverse" numberOfLines={1} style={styles.linkText}>
              {invite ? invite.inviteUrl.replace(/^https?:\/\//, '') : 'Loading your link…'}
            </Text>
            {copied ? (
              <Animated.View key="copied" entering={FadeIn.duration(duration.quick)} exiting={FadeOut.duration(duration.quick)} style={styles.linkAction}>
                <SymbolView name="checkmark" size={14} tintColor={colors.textInverse} style={styles.smallIcon} />
                <Text variant="label" color="textInverse">
                  Copied
                </Text>
              </Animated.View>
            ) : (
              <Animated.View key="copy" entering={FadeIn.duration(duration.quick)} exiting={FadeOut.duration(duration.quick)} style={styles.linkAction}>
                <SymbolView name="doc.on.doc" size={14} tintColor={colors.textInverse} style={styles.smallIcon} />
                <Text variant="label" color="textInverse">
                  Copy
                </Text>
              </Animated.View>
            )}
          </PressableScale>
          {invite ? (
            <Text variant="caption" color="onInverseMuted" align="center" style={styles.code}>
              Or share your code: {invite.referralCode}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.close, { top: insets.top + space[2] }]}>
        <IconButton systemImage="xmark" accessibilityLabel="Close" onPress={() => router.back()} />
      </View>

      <Animated.View entering={riseIn(4)} style={[styles.shareBar, { bottom: insets.bottom + space[2] }]}>
        <Button label="Share invite link" variant="inverse" size="lg" icon="square.and.arrow.up" onPress={() => void share()} />
      </Animated.View>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="h3" color="textInverse">
        {value}
      </Text>
      <Text variant="caption" color="onInverseMuted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PAGE,
  },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    experimental_backgroundImage: `linear-gradient(0deg, ${PAGE}, ${alpha('dusk', 0)})`,
  },
  body: {
    marginTop: -space[16],
    paddingHorizontal: space[6],
    gap: space[6],
  },
  titles: {
    gap: space[2],
  },
  stats: {
    ...shape.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space[4],
    backgroundColor: alpha('white', 0.12),
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: space[0.5],
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: colors.onInverseFillStrong,
  },
  steps: {
    gap: space[4],
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
  },
  stepIcon: {
    width: 44,
    height: 44,
    ...shape.tile,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.onInverseFill,
  },
  icon: {
    width: 20,
    height: 20,
  },
  stepText: {
    flex: 1,
    gap: space[0.5],
  },
  link: {
    ...shape.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingLeft: space[6],
    paddingRight: space[2],
    paddingVertical: space[2],
    backgroundColor: alpha('ink', 0.18),
  },
  linkText: {
    flex: 1,
  },
  linkAction: {
    ...shape.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    paddingHorizontal: space[4],
    paddingVertical: space[2],
    backgroundColor: colors.onInverseFill,
  },
  smallIcon: {
    width: 15,
    height: 15,
  },
  code: {
    marginTop: -space[2],
  },
  close: {
    position: 'absolute',
    left: space[6],
  },
  // The shadow sits on the bar, shaped like the button inside it.
  shareBar: {
    ...shape.pill,
    position: 'absolute',
    left: space[4],
    right: space[4],
    boxShadow: `0 10px 30px ${alpha('ink', 0.35)}`,
  },
});
