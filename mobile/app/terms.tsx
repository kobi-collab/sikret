import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../src/components/Screen';
import { GlassCard, PrimaryButton, Subtitle, Title } from '../src/components/UI';
import { copy } from '../src/copy';
import { useApp } from '../src/context/AppContext';
import { EULA_SECTIONS } from '../src/terms';
import { colors, spacing } from '../src/theme';
import { hebrewText } from '../src/typography';

export default function TermsScreen() {
  const { acceptEula } = useApp();

  const agree = async () => {
    await acceptEula();
    router.replace('/');
  };

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Title>{copy.termsTitle}</Title>
        <Subtitle>{copy.termsSubtitle}</Subtitle>
        {EULA_SECTIONS.map((section) => (
          <GlassCard key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </GlassCard>
        ))}
        <View style={styles.footer}>
          <PrimaryButton label={copy.termsAgree} onPress={agree} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.neonCyan,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    ...hebrewText,
  },
  sectionBody: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    ...hebrewText,
  },
  footer: {
    marginTop: spacing.md,
  },
});
