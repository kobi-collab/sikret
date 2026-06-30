import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { EnvelopeOrb } from '../src/components/EnvelopeOrb';
import { Screen } from '../src/components/Screen';
import { GlassCard, PrimaryButton, Subtitle, Title } from '../src/components/UI';
import { copy } from '../src/copy';
import { useApp } from '../src/context/AppContext';
import { routes } from '../src/routes';
import { colors } from '../src/theme';
import { hebrewText } from '../src/typography';

const SLIDES = [
  { title: copy.appName, body: copy.tagline },
  { title: copy.onboardingSlide2Title, body: copy.onboardingSlide2Body },
  { title: copy.onboardingSlide3Title, body: copy.onboardingSlide3Body },
];

export default function OnboardingScreen() {
  const { finishOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [ageOk, setAgeOk] = useState(false);
  const slide = SLIDES[step];
  const last = step === SLIDES.length - 1;

  const next = async () => {
    if (last && !ageOk) {
      Alert.alert(copy.onboardingSlide3Title, copy.ageConfirmRequired);
      return;
    }
    if (last) {
      await finishOnboarding();
      router.replace(routes.terms);
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <Screen scroll>
      <View style={styles.center}>
        <EnvelopeOrb mode="idle" />
      </View>
      <Title>{slide.title}</Title>
      <Subtitle>{slide.body}</Subtitle>
      {last && (
        <Pressable onPress={() => setAgeOk((v) => !v)}>
          <GlassCard style={ageOk ? styles.checked : undefined}>
            <Text style={styles.age}>
              {ageOk ? '☑ ' : '☐ '}
              {copy.ageConfirm}
            </Text>
          </GlassCard>
        </Pressable>
      )}
      <PrimaryButton label={last ? 'התחל' : 'המשך'} onPress={next} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  age: { color: colors.textSecondary, fontSize: 14, lineHeight: 22, ...hebrewText },
  checked: { borderColor: colors.neonCyan },
});
