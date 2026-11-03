import { NativeTabs } from 'expo-router/native-tabs';

import { Colors, Fonts } from '@/constants/theme';

export default function AppTabs() {
  return (
    <NativeTabs
      tintColor={Colors.text}
      backgroundColor={Colors.background}
      indicatorColor={Colors.backgroundSelected}
      labelStyle={{ fontFamily: Fonts.sansMedium }}>
      {/* Today (the action plan) is hidden for now: the website doesn't show it yet.
          Its screen is kept in src/features/today. */}
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Chat</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="bubble.left.and.bubble.right"
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Label>Account</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="person.crop.circle"
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
