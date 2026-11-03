import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { API_URL, authClient, signOutOnDevice } from '@/lib/auth-client';

export default function SignInScreen() {
  const theme = useTheme();
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
      if (await authClient.getCookie()) await signOutOnDevice();

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

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.content}>
          <ThemedText type="subtitle">Sign in to unive</ThemedText>
          <ThemedText themeColor="textSecondary">
            {step === 'email'
              ? 'Use the email of your unive account. We’ll send you a code.'
              : `Enter the code we sent to ${email.trim()}.`}
          </ThemedText>
          {__DEV__ && (
            <ThemedText type="small" themeColor="textSecondary">
              {API_URL.startsWith('http://localhost')
                ? `Local backend (${API_URL}): the code is printed as [OTP] in the terminal running bun dev.`
                : `Backend: ${API_URL}. Codes are sent by real email.`}
            </ThemedText>
          )}

          {step === 'email' ? (
            <TextInput
              key="email"
              style={inputStyle}
              placeholder="you@example.com"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoFocus
              value={email}
              onChangeText={setEmail}
              onSubmitEditing={sendCode}
            />
          ) : (
            <TextInput
              key="code"
              style={[inputStyle, styles.code]}
              placeholder="123456"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              value={code}
              onChangeText={setCode}
              onSubmitEditing={verifyCode}
            />
          )}

          {error && <ThemedText style={styles.error}>{error}</ThemedText>}

          {step === 'email' ? (
            <Button label="Send code" loading={loading} disabled={!email.trim()} onPress={sendCode} />
          ) : (
            <>
              <Button label="Sign in" loading={loading} disabled={!code.trim()} onPress={verifyCode} />
              <Button
                label="Use a different email"
                variant="secondary"
                disabled={loading}
                onPress={() => {
                  setError(null);
                  setStep('email');
                }}
              />
            </>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  input: {
    minHeight: 52,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    fontSize: 17,
  },
  code: {
    fontSize: 24,
    letterSpacing: 8,
  },
  error: {
    color: '#e5484d',
  },
});
