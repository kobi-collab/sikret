import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, I18nManager, View } from 'react-native';
import { useEffect } from 'react';
import { AppProvider, useApp } from '../src/context/AppContext';
import { routes } from '../src/routes';
import { colors } from '../src/theme';

I18nManager.allowRTL(true);

function RootNav() {
  const { ready, onboardingDone, eulaAccepted, me } = useApp();

  useEffect(() => {
    if (!ready) return;
    if (!onboardingDone) {
      router.replace('/onboarding');
      return;
    }
    if (!eulaAccepted && !me?.eulaAccepted) {
      router.replace(routes.terms);
    }
  }, [ready, onboardingDone, eulaAccepted, me?.eulaAccepted]);

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
