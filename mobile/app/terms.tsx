import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../src/components/Screen';
import { GlassCard, PrimaryButton, Subtitle, Title } from '../src/components/UI';
import { copy } from '../src/copy';
import { useApp } from '../src/context/AppContext';
import { EULA_SECTIONS } from '../src/terms';
import { colors, spacing } from '../src/theme';
import { hebrewText } from '../src/typography';
import { routes } from '../src/routes';

export default function TermsScreen() {
  const { acceptEula, eulaAccepted, me } = useApp();
  const [scrolledEnd, setScrolledEnd] = useState(false);
  const [loading, setLoading] = useState(false);
  const readOnly = eulaAccepted || me?.eulaAccepted;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 48) {
      setScrolledEnd(true);
    }
  };

  const agree = async () => {
    if (readOnly) {
      router.back();
      return;
    }
    if (!scrolledEnd) {
      Alert.alert(copy.termsTitle, copy.termsScrollHint);
      return;
    }
    setLoading(true);
    try {
      await acceptEula();
      router.replace(routes.home);
    } catch {
      Alert.alert('שגיאה', copy.networkError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={false}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={120}
      >
        <Title>{copy.termsTitle}</Title>
        <Subtitle>{readOnly ? 'תנאים וכללי הקהילה' : copy.termsSubtitle}</Subtitle>
        {EULA_SECTIONS.map((section) => (
          <GlassCard key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </GlassCard>
        ))}
        <View style={styles.footer}>
          {readOnly ? (
            <PrimaryButton label={copy.supportBack} onPress={() => router.back()} />
          ) : (
            <PrimaryButton
              label={loading ? copy.loadingProfile : copy.termsAgree}
              onPress={agree}
              disabled={loading}
            />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl },
  section: { marginBottom: spacing.sm },
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
  footer: { marginTop: spacing.md },
});
