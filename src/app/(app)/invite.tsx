import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon-button';
import { PressableScale } from '@/components/pressable-scale';
import { Fonts, Shape, Spacing } from '@/constants/theme';
import { siteUrl } from '@/lib/guide';
import { fetchReferralInvite, type ReferralInvite } from '@/lib/referral';

// The website's invite colours (src/features/referral/referral-invite-modal.tsx
// in unive-v2): the gift scene melting into a warm brown.
const BROWN = '#816856';
const BROWN_CLEAR = 'rgba(129, 104, 86, 0)';
const TITLE_SIZE = 38;
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
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
          <Animated.View entering={FadeInDown.delay(80).duration(450)} style={styles.titles}>
            <Text style={styles.title}>Give & get{'\n'}a month of Unive free</Text>
            <Text style={styles.subtitle}>
              Share Unive with a friend. When they join, you both get a month free.
            </Text>
          </Animated.View>

          {invite && (invite.timesRedeemed > 0 || invite.pendingRewardMonths > 0) ? (
            <Animated.View entering={FadeIn} style={styles.stats}>
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
              <Animated.View key={step.title} entering={FadeInDown.delay(160 + index * 70).duration(400)} style={styles.step}>
                <View style={styles.stepIcon}>
                  <SymbolView name={step.icon} size={18} tintColor="#ffffff" style={styles.icon} />
                </View>
                <View style={styles.stepText}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Your link: tap to copy it. */}
          <PressableScale
            pressedScale={0.98}
            onPress={() => void copy()}
            accessibilityRole="button"
            accessibilityLabel="Copy your invite link"
            style={styles.link}>
            <Text style={styles.linkText} numberOfLines={1}>
              {invite ? invite.inviteUrl.replace(/^https?:\/\//, '') : 'Loading your link…'}
            </Text>
            {copied ? (
              <Animated.View key="copied" entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={styles.linkAction}>
                <SymbolView name="checkmark" size={14} tintColor="#ffffff" style={styles.smallIcon} />
                <Text style={styles.linkActionText}>Copied</Text>
              </Animated.View>
            ) : (
              <Animated.View key="copy" entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={styles.linkAction}>
                <SymbolView name="doc.on.doc" size={14} tintColor="#ffffff" style={styles.smallIcon} />
                <Text style={styles.linkActionText}>Copy</Text>
              </Animated.View>
            )}
          </PressableScale>
          {invite ? <Text style={styles.code}>Or share your code: {invite.referralCode}</Text> : null}
        </View>
      </ScrollView>

      <View style={[styles.close, { top: insets.top + Spacing.two }]}>
        <IconButton systemImage="xmark" accessibilityLabel="Close" onPress={() => router.back()} />
      </View>

      <Animated.View entering={FadeInDown.delay(250).springify().damping(16)} style={[styles.shareBar, { bottom: insets.bottom + Spacing.two }]}>
        <PressableScale haptic pressedScale={0.96} onPress={() => void share()} accessibilityRole="button" style={styles.share}>
          <SymbolView name="square.and.arrow.up" size={18} tintColor={BROWN} style={styles.icon} />
          <Text style={styles.shareLabel}>Share invite link</Text>
        </PressableScale>
      </Animated.View>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const WHITE_SOFT = 'rgba(255, 255, 255, 0.78)';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BROWN,
  },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    experimental_backgroundImage: `linear-gradient(0deg, ${BROWN}, ${BROWN_CLEAR})`,
  },
  body: {
    marginTop: -Spacing.six,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  titles: {
    gap: Spacing.two,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: TITLE_SIZE,
    lineHeight: TITLE_SIZE * 1.1,
    // The heading font's tight tracking, like the website's (-0.03em).
    letterSpacing: TITLE_SIZE * -0.03,
    color: '#ffffff',
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    lineHeight: 24,
    color: WHITE_SOFT,
  },
  stats: {
    ...Shape.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
  },
  statValue: {
    fontFamily: Fonts.heading,
    fontSize: 28,
    color: '#ffffff',
  },
  statLabel: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: WHITE_SOFT,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  steps: {
    gap: Spacing.three,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  icon: {
    width: 20,
    height: 20,
  },
  stepText: {
    flex: 1,
    gap: Spacing.half,
  },
  stepTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 16,
    color: '#ffffff',
  },
  stepDescription: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 19,
    color: WHITE_SOFT,
  },
  link: {
    ...Shape.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingLeft: Spacing.four,
    paddingRight: Spacing.two,
    paddingVertical: Spacing.two,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  linkText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: '#ffffff',
  },
  linkAction: {
    ...Shape.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  smallIcon: {
    width: 15,
    height: 15,
  },
  linkActionText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    color: '#ffffff',
  },
  code: {
    marginTop: -Spacing.two,
    textAlign: 'center',
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: WHITE_SOFT,
  },
  close: {
    position: 'absolute',
    left: Spacing.four,
  },
  shareBar: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
  },
  share: {
    ...Shape.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three + Spacing.half,
    backgroundColor: '#ffffff',
    boxShadow: '0 10px 30px rgba(60, 40, 25, 0.35)',
  },
  shareLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 17,
    color: BROWN,
  },
});
