// The AI SDK streams chat replies with web APIs that React Native lacks.
// https://ai-sdk.dev/docs/getting-started/expo
import { TextDecoderStream, TextEncoderStream } from '@stardazed/streams-text-encoding';
import structuredClone from '@ungap/structured-clone';
import { Platform } from 'react-native';

if (Platform.OS !== 'web') {
  const g = globalThis as Record<string, unknown>;
  g.structuredClone ??= structuredClone;
  g.TextEncoderStream ??= TextEncoderStream;
  g.TextDecoderStream ??= TextDecoderStream;
}
