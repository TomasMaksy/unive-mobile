import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts, Shape, Spacing } from '@/constants/theme';
import { API_URL, authClient, signOut } from '@/lib/auth-client';

const PRIVACY_POLICY_URL = 'https://unive.ai/legal/privacy-policy';

export default function SignInScreen() {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendCode() {
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
      if (error) return setError(error.message ?? 'Could not send the code.');
      setCode('');
      setStep('code');
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setError(null);
    setLoading(true);
    try {
      const { error } = await authClient.signIn.emailOtp({
        email: email.trim().toLowerCase(),
        otp: code.trim(),
      });
      // On success the session updates and the root layout leaves this screen.
      if (error) setError(error.message ?? 'That code did not work.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <ThemedText type="wordmark" style={styles.wordmark}>
          Unive
        </ThemedText>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.heading}>
              <ThemedText type="title" style={styles.center}>
                Sign in to Unive
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={[styles.center, styles.lead]}>
                Continue where you left off.
              </ThemedText>
            </View>

            <View style={styles.card}>
              {step === 'email' ? (
                <>
                  <TextField
                    key="email"
                    placeholder="Enter your email"
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    returnKeyType="go"
                    autoFocus
                    value={email}
                    onChangeText={setEmail}
                    onSubmitEditing={sendCode}
                  />
                  <Button
                    label="Continue with email"
                    loading={loading}
                    disabled={!email.trim()}
                    onPress={sendCode}
                  />
                </>
              ) : (
                <>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                    Enter the 6-digit code we sent to {email.trim()}.
                  </ThemedText>
                  <TextField
                    key="code"
                    style={styles.code}
                    placeholder="000000"
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    autoComplete="one-time-code"
                    autoFocus
                    maxLength={6}
                    value={code}
                    onChangeText={setCode}
                    onSubmitEditing={verifyCode}
                  />
                  <Button label="Sign in" loading={loading} disabled={code.trim().length < 6} onPress={verifyCode} />
                  <ThemedText
                    type="link"
                    themeColor="textSecondary"
                    style={styles.center}
                    disabled={loading}
                    onPress={() => {
                      setError(null);
                      setStep('email');
                    }}>
                    Use a different email
                  </ThemedText>
                </>
              )}

              {error && (
                <ThemedText type="small" themeColor="destructive" style={styles.center}>
                  {error}
                </ThemedText>
              )}

              <ThemedText type="small" themeColor="textSecondary" style={[styles.center, styles.legal]}>
                By continuing, you accept Unive’s{' '}
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  style={styles.underline}
                  onPress={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}>
                  Privacy Policy
                </ThemedText>
                .
              </ThemedText>
            </View>

            {__DEV__ && (
              <ThemedText type="small" themeColor="textMuted" style={styles.center}>
                {API_URL.startsWith('http://')
                  ? `Local backend (${API_URL}): the code is printed as [OTP] in the terminal running npm run dev.`
                  : `Backend: ${API_URL}. Codes are sent by real email.`}
              </ThemedText>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wordmark: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
  },
  heading: {
    gap: Spacing.two,
  },
  center: {
    textAlign: 'center',
  },
  lead: {
    fontFamily: Fonts.headingLight,
    fontSize: 17,
    lineHeight: 26,
  },
  card: {
    gap: Spacing.three,
    ...Shape.panel,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundElement,
  },
  code: {
    fontSize: 24,
    letterSpacing: 10,
    textAlign: 'center',
  },
  legal: {
    fontSize: 12,
    lineHeight: 18,
  },
  underline: {
    fontSize: 12,
    lineHeight: 18,
    textDecorationLine: 'underline',
  },
});
