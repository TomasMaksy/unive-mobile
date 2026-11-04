import { TextField, useNativeState } from '@expo/ui/swift-ui';
import { useContext, useEffect } from 'react';

import { type NativeTextFieldProps, TextFieldRegistry } from '@/components/native-text-field-types';

/**
 * A SwiftUI text field that starts with some text and keeps it natively (no
 * flicker while typing). With a `name`, its form can read the exact text when
 * saving (see useTextFieldValues).
 */
export function NativeTextField({ initialText, onTextChange, name, ...props }: NativeTextFieldProps) {
  const text = useNativeState(initialText);
  const registry = useContext(TextFieldRegistry);

  useEffect(() => {
    if (!name || !registry) return;
    return registry.register(name, () => text.get());
  }, [name, registry, text]);

  return <TextField text={text} onTextChange={onTextChange} {...props} />;
}
