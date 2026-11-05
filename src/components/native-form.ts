import { frame, listRowInsets } from '@expo/ui/swift-ui/modifiers';

// Room for the tallest control a row holds (a date's capsule, a menu picker),
// so a row of plain text is just as tall. With the padding: 52 points, what
// iOS 26 uses for every row anyway.
const ROW_HEIGHT = 40;
const ROW_PADDING = { top: 6, bottom: 6, leading: 20, trailing: 20 };

/**
 * Put on every row of a SwiftUI form (`<Section>` children in a `<List>`).
 * iOS sizes each row to its control, so on iOS 18 and earlier a date or a
 * picker made its row taller than the text rows around it; on iOS 26 they
 * already match, and this changes nothing there.
 */
export const formRow = [frame({ minHeight: ROW_HEIGHT }), listRowInsets(ROW_PADDING)];
