import { NativeTabs } from 'expo-router/native-tabs';
import { Platform } from 'react-native';

import { Colors } from '@/constants/theme';

// From iOS 26, a tab with the search role sits in its own glass circle to the
// right of the tab bar, like Bevel's. Older iOS would show it as a regular
// tab titled "Search", so AI only gets the role where it renders separately.
const separateAiTab = Platform.OS === 'ios' && parseFloat(String(Platform.Version)) >= 26;

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

      <NativeTabs.Trigger
        name="ai"
        {...(separateAiTab && {
          role: 'search',
          // Opening AI shouldn't pop up a search field and keyboard.
          disableAutomaticSearchActivation: true,
          // iOS 27 places the tab on its own surface this way instead.
          prominent: true,
        })}>
        <NativeTabs.Trigger.Label>AI</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="sparkles" md="auto_awesome" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
