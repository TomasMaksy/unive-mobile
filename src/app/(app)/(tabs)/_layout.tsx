import AppTabs from '@/components/app-tabs';
import { AiPanelProvider } from '@/features/ai/ai-panel';

export default function TabsLayout() {
  return (
    // The AI panel sits above the tabs; pulling down on any tab brings it in.
    <AiPanelProvider>
      <AppTabs />
    </AiPanelProvider>
  );
}
