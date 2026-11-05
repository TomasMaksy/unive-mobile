import { Alert } from 'react-native';

import { deleteItem, type KnowledgeKind } from '@/lib/knowledge';
import { FORMS } from '@/lib/knowledge-fields';
import { haptics } from '@/theme';

/** Asks first, then deletes the item; `onDeleted` runs once it's gone. */
export function confirmDelete(kind: KnowledgeKind, id: string, onDeleted?: () => void, onCancel?: () => void) {
  const noun = FORMS[kind].noun.toLowerCase();
  Alert.alert(`Delete ${noun}?`, 'The AI will no longer know about it.', [
    { text: 'Cancel', style: 'cancel', onPress: onCancel },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: async () => {
        try {
          await deleteItem(kind, id);
          haptics.success();
          onDeleted?.();
        } catch {
          Alert.alert(`Couldn't delete this ${noun}`, 'Please try again.');
          onCancel?.();
        }
      },
    },
  ]);
}
