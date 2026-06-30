import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, I18nManager, View } from 'react-native';
import { useEffect } from 'react';
import { AppProvider, useApp } from '../src/context/AppContext';
import { routes } from '../src/routes';
import { colors } from '../src/theme';

I18nManager.allowRTL(true);
if (!I18nManager.isRTL) {
  I18nManager.forceRTL(true);
}

function RootNav() {
  const { ready, onboardingDone, eulaAccepted, me } = useApp();

  useEffect(() => {
    if (!ready) return;
    if (me?.banned || (me?.suspendedUntil && me.suspendedUntil > Date.now())) {
      router.replace(routes.suspended);
      return;
    }
    if (!onboardingDone) {
      router.replace(routes.onboarding);
      return;
    }
    if (!eulaAccepted && !me?.eulaAccepted) {
      router.replace(routes.terms);
    }
  }, [ready, onboardingDone, eulaAccepted, me?.eulaAccepted, me?.banned, me?.suspendedUntil]);

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
