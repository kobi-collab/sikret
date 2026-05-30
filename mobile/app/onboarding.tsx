import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EnvelopeOrb } from '../src/components/EnvelopeOrb';
import { Screen } from '../src/components/Screen';
import { GlassCard, PrimaryButton, Subtitle, Title } from '../src/components/UI';
import { copy } from '../src/copy';
import { useApp } from '../src/context/AppContext';
import { routes } from '../src/routes';
import { colors } from '../src/theme';

const SLIDES = [
  {
    title: copy.appName,
    body: copy.tagline,
  },
  {
    title: 'וידוי וקבלה',
    body: 'מתוודים על סוד, מקבלים סוד זר בתמורה. בלי שם. בלי חזרה.',
  },
  {
    title: 'לא טיפול',
    body: 'אם אתה במצב קשה — פנה לעזרה מקצועית. כאן מקום לשתף, לא לטפל.',
  },
];

export default function OnboardingScreen() {
  const { finishOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];
  const last = step === SLIDES.length - 1;

  const next = async () => {
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
      <GlassCard>
        <Text style={styles.age}>אני מעל גיל 18 ומבין/ה שזה לא שירות טיפולי.</Text>
      </GlassCard>
      <PrimaryButton label={last ? 'התחל' : 'המשך'} onPress={next} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  age: { color: colors.textSecondary, textAlign: 'right', fontSize: 14, lineHeight: 22 },
});
