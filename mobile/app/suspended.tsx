import { Linking, Alert } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { EnvelopeOrb } from '../src/components/EnvelopeOrb';
import { OutlineButton, Subtitle, Title } from '../src/components/UI';
import { copy } from '../src/copy';
import { useApp } from '../src/context/AppContext';
import { SUPPORT_EMAIL } from '../src/terms';
import { StyleSheet, Text } from 'react-native';
import { colors } from '../src/theme';
import { routes } from '../src/routes';
import { hebrewCenter, hebrewText } from '../src/typography';

export default function SuspendedScreen() {
  const { me, refreshMe } = useApp();
  const banned = me?.banned;
  const until = me?.suspendedUntil
    ? new Date(me.suspendedUntil).toLocaleString('he-IL')
    : '';

  useEffect(() => {
    if (!me?.suspendedUntil || banned) return;
    const ms = me.suspendedUntil - Date.now();
    if (ms <= 0) {
      refreshMe().then(() => router.replace(routes.home));
      return;
    }
    const t = setTimeout(() => {
      refreshMe().then(() => router.replace(routes.home));
    }, Math.min(ms, 60_000));
    return () => clearTimeout(t);
  }, [me?.suspendedUntil, banned, refreshMe]);

  const mail = async () => {
    try {
      await Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
    } catch {
      Alert.alert('דוא״ל', copy.mailtoFailed);
    }
  };

  return (
    <Screen scroll>
      <EnvelopeOrb mode="locked" />
      <Title>{banned ? copy.bannedTitle : copy.suspendedTitle}</Title>
      <Subtitle>{banned ? copy.bannedBody : copy.suspendedBody}</Subtitle>
      {!banned && <Text style={styles.email}>{SUPPORT_EMAIL}</Text>}
      {until && !banned ? (
        <Text style={styles.until}>{copy.suspendedUntil(until)}</Text>
      ) : null}
      <OutlineButton label="דוא״ל לתמיכה" onPress={mail} />
      <OutlineButton label={copy.supportLink} onPress={() => router.push(routes.support)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  until: { color: colors.danger, marginVertical: 16, ...hebrewCenter },
  email: { color: colors.neonCyan, marginVertical: 12, fontSize: 16, ...hebrewText },
});
