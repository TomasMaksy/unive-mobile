import { NativeTabs } from 'expo-router/native-tabs';

import { Colors } from '@/constants/theme';

// AI isn't a tab: pull down from the top of any tab to open it (features/ai/ai-panel.tsx).
export default function AppTabs() {
  return (
    <NativeTabs
      tintColor={Colors.text}
      backgroundColor={Colors.background}
      // Labels keep the system font: iOS 26's glass tab bar sizes them for it, and
      // a taller custom font (Inter) left unselected labels low and clipped.
      indicatorColor={Colors.backgroundSelected}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="apps">
        <NativeTabs.Trigger.Label>Apps</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'tray.full', selected: 'tray.full.fill' }} md="inbox" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="essay">
        <NativeTabs.Trigger.Label>Essay</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'doc.text', selected: 'doc.text.fill' }} md="description" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="study">
        <NativeTabs.Trigger.Label>Study</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'book', selected: 'book.fill' }} md="menu_book" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
