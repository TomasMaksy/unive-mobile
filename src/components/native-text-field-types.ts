import type { TextField } from '@expo/ui/swift-ui';
import { createContext, useMemo, useRef } from 'react';

// Shared by native-text-field.ios.tsx and native-text-field.tsx.
export type NativeTextFieldProps = Omit<Parameters<typeof TextField>[0], 'text' | 'ref' | 'onTextChange'> & {
  /** The text it starts with. */
  initialText: string;
  onTextChange: (text: string) => void;
  /** Lets a form read this field's exact text when saving (see useTextFieldValues). */
  name?: string;
};

type Registry = { register: (name: string, read: () => string) => () => void };

export const TextFieldRegistry = createContext<Registry | null>(null);

/**
 * The exact text in a form's fields, read when you save. SwiftUI reports
 * typing to JavaScript a moment late, so a draft built only from change
 * events can miss the last letter if you tap Save straight away.
 */
export function useTextFieldValues() {
  const readers = useRef(new Map<string, () => string>());
  const registry = useMemo<Registry>(
    () => ({
      register(name, read) {
        readers.current.set(name, read);
        return () => {
          readers.current.delete(name);
        };
      },
    }),
    [],
  );
  const read = () => Object.fromEntries([...readers.current].map(([name, readText]) => [name, readText()]));
  return { registry, read };
}
