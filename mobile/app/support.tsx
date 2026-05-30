import { Linking, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { GlassCard, OutlineButton, Subtitle, Title } from '../src/components/UI';
import { copy } from '../src/copy';
import { EULA_SECTIONS, SUPPORT_EMAIL } from '../src/terms';
import { colors, spacing } from '../src/theme';
import { routes } from '../src/routes';
import { hebrewText } from '../src/typography';

export default function SupportScreen() {
  const mail = () => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('סיקרט — דיווח / תמיכה')}`);

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Title>{copy.supportTitle}</Title>
        <Subtitle>{copy.supportIntro}</Subtitle>

        <GlassCard>
          <Text style={styles.label}>{copy.supportEmailLabel}</Text>
          <Pressable onPress={mail}>
            <Text style={styles.email}>{SUPPORT_EMAIL}</Text>
          </Pressable>
        </GlassCard>

        <GlassCard>
          <Text style={styles.body}>{copy.supportReportExplain}</Text>
        </GlassCard>

        <GlassCard>
          <Text style={styles.sectionTitle}>{copy.termsTitle}</Text>
          {EULA_SECTIONS.slice(0, 3).map((s) => (
            <Text key={s.title} style={styles.bullet}>
              • {s.title}: {s.body.slice(0, 80)}…
            </Text>
          ))}
          <OutlineButton label={copy.supportViewTerms} onPress={() => router.push(routes.terms)} />
        </GlassCard>

        <OutlineButton label={copy.supportBack} onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl },
  label: { color: colors.textMuted, fontSize: 13, marginBottom: 6, ...hebrewText },
  email: { color: colors.neonCyan, fontSize: 17, fontWeight: '600', ...hebrewText },
  body: { color: colors.textSecondary, fontSize: 15, lineHeight: 24, ...hebrewText },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 8, ...hebrewText },
  bullet: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 6, ...hebrewText },
});
