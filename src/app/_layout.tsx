import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';
import { useColorScheme, View, StyleSheet } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AgentTracePanel } from '@/components/AgentTracePanel';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={styles.container}>
        <AnimatedSplashOverlay />
        <AppTabs />
        <AgentTracePanel />
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
