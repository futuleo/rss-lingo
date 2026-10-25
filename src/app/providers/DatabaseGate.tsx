import { useEffect, useState, type PropsWithChildren } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@shared/ui';
import { useTheme } from '@shared/theme';
import { openDatabase } from '@shared/lib/db';

type GateState = { status: 'pending' } | { status: 'ready' } | { status: 'error' };

/**
 * Opens the local SQLite database before any screen renders,
 * so repositories can rely on an initialized database.
 */
export function DatabaseGate({ children }: PropsWithChildren) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [state, setState] = useState<GateState>({ status: 'pending' });

  useEffect(() => {
    let cancelled = false;
    openDatabase()
      .then(() => {
        if (!cancelled) setState({ status: 'ready' });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === 'pending') {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text variant="body" style={{ color: theme.colors.danger }}>
          {t('common.error')}
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
