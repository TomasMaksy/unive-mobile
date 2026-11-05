import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Field, Text, Wordmark } from '@/components/ui';
import { authClient, signOut } from '@/lib/auth-client';
import { colors, duration, easeUnive, haptics, riseIn, screenPadding, shadow, shape, space } from '@/theme';

const PRIVACY_POLICY_URL = 'https://unive.ai/legal/privacy-policy';

export default function SignInScreen() {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function fail(message: string) {
    setError(message);
    haptics.error();
  }

  async function sendCode() {
    if (!email.trim() || loading) return;
    setError(null);
    setLoading(true);
    try {
      // An expired session left on the device would make better-auth reject
      // the request for missing an Origin header, so drop it first.
      if (await authClient.getCookie()) await signOut();

      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: email.trim().toLowerCase(),
        type: 'sign-in',
      });
      if (error) return fail(error.message ?? 'Could not send the code.');
      setCode('');
      setStep('code');
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    if (code.trim().length < 6 || loading) return;
    setError(null);
    setLoading(true);
    try {
      const { error } = await authClient.signIn.emailOtp({
        email: email.trim().toLowerCase(),
        otp: code.trim(),
      });
      // On success the session updates and the root layout leaves this screen.
      if (error) fail(error.message ?? 'That code did not work.');
      else haptics.success();
    } finally {
      setLoading(false);
    }
  }

  const stepEnter = FadeIn.duration(duration.standard).easing(easeUnive);
  const stepExit = FadeOut.duration(duration.quick);

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.flex}>
        <Animated.View entering={riseIn(0, 6)} style={styles.wordmark}>
          <Wordmark height={26} />
        </Animated.View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Animated.View entering={riseIn(1)} style={styles.heading}>
              <Text variant="display" align="center">
                Sign in to Unive
              </Text>
              <Text variant="lead" color="textSecondary" align="center">
                Continue where you left off.
              </Text>
            </Animated.View>

            <Animated.View entering={riseIn(2)} style={styles.panel}>
              {step === 'email' ? (
                <Animated.View key="email" entering={stepEnter} exiting={stepExit} style={styles.step}>
                  <Field
                    size="lg"
                    placeholder="Enter your email"
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    returnKeyType="go"
                    autoFocus
                    value={email}
                    error={error}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (error) setError(null);
                    }}
                    onSubmitEditing={sendCode}
                  />
                  <Button
                    label="Continue with email"
                    size="lg"
                    loading={loading}
                    disabled={!email.trim()}
                    onPress={sendCode}
                  />
                </Animated.View>
              ) : (
                <Animated.View key="code" entering={stepEnter} exiting={stepExit} style={styles.step}>
                  <Text variant="small" color="textSecondary" align="center">
                    Enter the 6-digit code we sent to {email.trim()}.
                  </Text>
                  <Field
                    size="lg"
                    inputStyle={styles.code}
                    placeholder="000000"
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    autoComplete="one-time-code"
                    autoFocus
                    maxLength={6}
                    value={code}
                    error={error}
                    onChangeText={(text) => {
                      setCode(text);
                      if (error) setError(null);
                    }}
                    onSubmitEditing={verifyCode}
                  />
                  <Button label="Sign in" size="lg" loading={loading} disabled={code.trim().length < 6} onPress={verifyCode} />
                  <Button
                    label="Use a different email"
                    variant="ghost"
                    size="sm"
                    inline
                    haptic={false}
                    disabled={loading}
                    style={styles.centerSelf}
                    onPress={() => {
                      setError(null);
                      setStep('email');
                    }}
                  />
                </Animated.View>
              )}

              <Text variant="caption" color="textMuted" align="center">
                By continuing, you accept Unive’s{' '}
                <Text
                  variant="caption"
                  color="textSecondary"
                  style={styles.underline}
                  onPress={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}>
                  Privacy Policy
                </Text>
                .
              </Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  wordmark: { paddingHorizontal: screenPadding, paddingTop: space[2] },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: space[8],
    padding: screenPadding,
  },
  heading: { gap: space[3] },
  panel: {
    ...shape.panel,
    gap: space[5],
    padding: space[5],
    backgroundColor: colors.surface,
    boxShadow: shadow.card,
  },
  step: { gap: space[4] },
  centerSelf: { alignSelf: 'center' },
  // A one-time code reads best spaced out and centred.
  // eslint-disable-next-line no-restricted-syntax
  code: { fontSize: 24, letterSpacing: 10, textAlign: 'center' },
  underline: { textDecorationLine: 'underline' },
});
