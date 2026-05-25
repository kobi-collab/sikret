import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, I18nManager, View } from 'react-native';
import { useEffect } from 'react';
import { AppProvider, useApp } from '../src/context/AppContext';
import { colors } from '../src/theme';

I18nManager.allowRTL(true);

function RootNav() {
  const { ready, onboardingDone } = useApp();

  useEffect(() => {
    if (ready && !onboardingDone) {
      router.replace('/onboarding');
    }
  }, [ready, onboardingDone]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgVoid, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.neonCyan} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bgVoid },
          animation: 'fade',
        }}
      />
    </>
  );
}

export default function Layout() {
  return (
    <AppProvider>
      <RootNav />
    </AppProvider>
  );
}
