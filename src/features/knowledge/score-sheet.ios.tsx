import { Host } from '@expo/ui';
import { BottomSheet, Button, HStack, Image, Slider, Spacer, Text, TextField, useNativeState, VStack } from '@expo/ui/swift-ui';
import {
  background,
  buttonStyle,
  clipShape,
  controlSize,
  font,
  foregroundStyle,
  frame,
  keyboardType,
  kerning,
  monospacedDigit,
  multilineTextAlignment,
  padding,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';
import { Alert } from 'react-native';

import { alpha, colors, haptics } from '@/theme';
import { formatScore, saveScore, SCORES } from '@/features/knowledge/academics';
import type { ScoreSheetProps } from '@/features/knowledge/score-sheet-types';
import type { Academics } from '@/lib/knowledge';

// How each score moves: the buttons' step, the slider's step, and where an
// empty score starts.
const STEPS: Record<keyof Academics, { button: number; slider: number; start: number }> = {
  gpa: { button: 0.1, slider: 0.01, start: 3.5 },
  actComposite: { button: 1, slider: 1, start: 24 },
  satReading: { button: 10, slider: 10, start: 600 },
  satMath: { button: 10, slider: 10, start: 600 },
};

const NUMBER_SIZE = 72;
const STEP_SIZE = 56;

/**
 * One score, in a native sheet over About you: a big number you can type
 * into, a slider to drag and − / + buttons. Save keeps it. All SwiftUI, so
 * every control gets its touches.
 */
export function ScoreSheet({ scoreKey, current, onClose }: ScoreSheetProps) {
  return (
    <Host matchContents style={{ position: 'absolute' }}>
      <BottomSheet isPresented={scoreKey != null} onIsPresentedChange={(open) => !open && onClose()} fitToContents>
        {scoreKey ? <Score key={scoreKey} scoreKey={scoreKey} current={current} onDone={onClose} /> : <Text> </Text>}
      </BottomSheet>
    </Host>
  );
}

function Score({ scoreKey: key, current, onDone }: { scoreKey: keyof Academics; current: number | null; onDone: () => void }) {
  const field = SCORES.find((score) => score.key === key)!;
  const steps = STEPS[key];
  const decimals = key === 'gpa' ? 2 : 0;
  const clamp = (next: number) => Math.min(field.max, Math.max(field.min, Number(next.toFixed(decimals))));

  const [value, setValue] = useState(current ?? steps.start);
  const [touched, setTouched] = useState(current != null);
  const [invalid, setInvalid] = useState(false);
  const [saving, setSaving] = useState(false);
  const text = useNativeState(current == null ? '' : (formatScore(key, current) ?? ''));

  function show(next: number, fromTyping = false) {
    setValue(next);
    setTouched(true);
    setInvalid(false);
    if (!fromTyping) text.set(formatScore(key, next) ?? '');
  }

  function step(direction: 1 | -1) {
    // From an empty score, the first tap shows where it starts.
    const next = touched ? clamp(value + direction * steps.button) : steps.start;
    haptics.tick();
    show(next);
  }

  function typed(raw: string) {
    if (!raw.trim()) return;
    const number = Number(raw.replace(',', '.'));
    const ok = Number.isFinite(number) && number >= field.min && number <= field.max && (key === 'gpa' || Number.isInteger(number));
    if (ok) show(number, true);
    else setInvalid(true);
  }

  async function save(next: number | null) {
    setSaving(true);
    try {
      if (next !== current) await saveScore(key, next);
      haptics.success();
      onDone();
    } catch (error) {
      Alert.alert("Couldn't save", error instanceof Error ? error.message : 'Please try again.');
      setSaving(false);
    }
  }

  const canSave = touched && !invalid && !saving;

  return (
      <VStack spacing={20} modifiers={[padding({ horizontal: 24, top: 28, bottom: 16 })]}>
        <VStack spacing={2}>
          <Text modifiers={[font({ size: 17, weight: 'semibold' }), foregroundStyle(colors.text)]}>{field.label}</Text>
          <Text modifiers={[font({ size: 14 }), foregroundStyle(invalid ? colors.danger : colors.textSecondary)]}>
            {`From ${field.min} to ${field.max}`}
          </Text>
        </VStack>

        <HStack spacing={12}>
          <StepButton symbol="minus" disabled={touched && value <= field.min} onPress={() => step(-1)} />
          <TextField
            text={text}
            placeholder={formatScore(key, steps.start) ?? ''}
            onTextChange={typed}
            modifiers={[
              font({ family: 'AveriaSerifLibre-Regular', size: NUMBER_SIZE }),
              kerning(NUMBER_SIZE * -0.03),
              monospacedDigit(),
              multilineTextAlignment('center'),
              foregroundStyle(invalid ? colors.danger : colors.text),
              keyboardType(key === 'gpa' ? 'decimal-pad' : 'numeric'),
              frame({ maxWidth: Infinity }),
            ]}
          />
          <StepButton symbol="plus" disabled={touched && value >= field.max} onPress={() => step(1)} />
        </HStack>

        <VStack spacing={6}>
          <Slider
            value={value}
            min={field.min}
            max={field.max}
            step={steps.slider}
            onValueChange={(next) => {
              const rounded = clamp(next);
              // A tick for each button-sized step, not every hundredth of a GPA point.
              if (Math.round(rounded / steps.button) !== Math.round(value / steps.button)) haptics.tick();
              show(rounded);
            }}
            modifiers={[tint(colors.accent)]}
          />
          <HStack>
            <Text modifiers={[font({ size: 13 }), foregroundStyle(colors.textMuted)]}>{formatScore(key, field.min) ?? ''}</Text>
            <Spacer />
            <Text modifiers={[font({ size: 13 }), foregroundStyle(colors.textMuted)]}>{formatScore(key, field.max) ?? ''}</Text>
          </HStack>
        </VStack>

        <Button onPress={canSave ? () => save(value) : undefined} modifiers={[buttonStyle('plain')]}>
          <Text
            modifiers={[
              font({ size: 17, weight: 'semibold' }),
              foregroundStyle(colors.textInverse),
              frame({ maxWidth: Infinity, minHeight: 52, maxHeight: 52 }),
              // Disabled is the accent at the brand's 48%.
              background(canSave ? colors.accent : alpha('meadow', 0.48)),
              clipShape('capsule'),
            ]}>
            {saving ? 'Saving…' : 'Save'}
          </Text>
        </Button>
        {current != null ? (
          <Button role="destructive" label="Remove score" onPress={saving ? undefined : () => save(null)} modifiers={[controlSize('regular')]} />
        ) : null}
      </VStack>
  );
}

// A round − or + button.
function StepButton({ symbol, disabled, onPress }: { symbol: 'minus' | 'plus'; disabled: boolean; onPress: () => void }) {
  return (
    <Button onPress={disabled ? undefined : onPress} modifiers={[buttonStyle('plain')]}>
      <Image
        systemName={symbol}
        modifiers={[
          font({ size: 22, weight: 'semibold' }),
          foregroundStyle(disabled ? colors.textMuted : colors.text),
          frame({ width: STEP_SIZE, height: STEP_SIZE }),
          background(colors.backgroundGrouped),
          clipShape('circle'),
        ]}
      />
    </Button>
  );
}
