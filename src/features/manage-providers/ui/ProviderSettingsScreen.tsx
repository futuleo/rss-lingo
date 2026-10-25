import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { createProvider, PROVIDERS, type ProviderInfo } from '@shared/api/ai';
import {
  deleteApiKey,
  getApiKey,
  saveApiKey,
  saveSettings,
  useAiProviderSettings,
} from '@entities/ai-provider';
import { Button, Text } from '@shared/ui';
import { useTheme } from '@shared/theme';
import {
  setAppLanguage,
  supportedLanguages,
  type AppLanguage,
} from '@shared/i18n';

function providerLabelKey(id: string): string {
  switch (id) {
    case 'openai':
      return 'settings.providerOpenAi';
    case 'anthropic':
      return 'settings.providerAnthropic';
    case 'gemini':
      return 'settings.providerGemini';
    case 'deepseek':
      return 'settings.providerDeepSeek';
    default:
      return 'settings.providerOpenAi';
  }
}

export function ProviderSettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { settings, loading } = useAiProviderSettings();

  const [isLoaded, setIsLoaded] = useState(false);
  const [providerId, setProviderId] = useState<string>(PROVIDERS[0]!.id);
  const [model, setModel] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [targetLang, setTargetLang] = useState<AppLanguage>(supportedLanguages[0]);
  const [apiKey, setApiKey] = useState('');
  const [isApiKeyDirty, setIsApiKeyDirty] = useState(false);
  const [testStatus, setTestStatus] = useState<
    | { type: 'idle' }
    | { type: 'loading' }
    | { type: 'ok'; result: string }
    | { type: 'error'; message: string }
  >({ type: 'idle' });

  const selectedProvider = useMemo<ProviderInfo>(
    () => PROVIDERS.find((p) => p.id === providerId) ?? PROVIDERS[0]!,
    [providerId],
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  // Initialize the local form state once the persisted settings are loaded.
  // This is a one-way sync from the repository into form fields.
  useEffect(() => {
    if (!settings || isLoaded) {
      return;
    }
    setProviderId(settings.providerId);
    setModel(settings.model);
    setBaseUrl(settings.baseUrl ?? '');

    const supported = supportedLanguages as readonly string[];
    if (supported.includes(settings.targetLang)) {
      setTargetLang(settings.targetLang as AppLanguage);
    } else {
      setTargetLang(supportedLanguages[0]);
    }

    setIsLoaded(true);
  }, [settings, isLoaded]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    void (async () => {
      const key = await getApiKey(providerId);
      setApiKey(key ?? '');
      setIsApiKeyDirty(false);
    })();
  }, [providerId, isLoaded]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    const timeout = setTimeout(() => {
      void saveSettings({
        providerId,
        model,
        baseUrl: baseUrl.trim() || undefined,
        targetLang,
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [providerId, model, baseUrl, targetLang, isLoaded]);

  useEffect(() => {
    if (!isLoaded || !isApiKeyDirty) {
      return;
    }
    const timeout = setTimeout(() => {
      void (async () => {
        if (apiKey.trim().length === 0) {
          await deleteApiKey(providerId);
        } else {
          await saveApiKey(providerId, apiKey);
        }
        setIsApiKeyDirty(false);
      })();
    }, 500);
    return () => clearTimeout(timeout);
  }, [apiKey, providerId, isLoaded, isApiKeyDirty]);

  const selectProvider = useCallback((id: string) => {
    const next = PROVIDERS.find((p) => p.id === id);
    setProviderId(id);
    setModel(next?.defaultModelExample ?? '');
    setBaseUrl(next?.defaultBaseUrl ?? '');
    setApiKey('');
    setIsApiKeyDirty(false);
    setTestStatus({ type: 'idle' });
  }, []);

  const selectTargetLang = useCallback((lang: AppLanguage) => {
    setTargetLang(lang);
    setAppLanguage(lang);
  }, []);

  const handleTestConnection = useCallback(async () => {
    if (!apiKey.trim()) {
      setTestStatus({
        type: 'error',
        message: t('settings.testErrorApiKeyRequired'),
      });
      return;
    }

    setTestStatus({ type: 'loading' });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const provider = createProvider(providerId);
      const result = await provider.translate({
        text: 'Hello',
        targetLang,
        apiKey,
        model: model.trim() || selectedProvider.defaultModelExample,
        baseUrl: baseUrl.trim() || undefined,
        signal: controller.signal,
      });
      setTestStatus({ type: 'ok', result });
    } catch (error) {
      setTestStatus({
        type: 'error',
        message: error instanceof Error ? error.message : t('common.error'),
      });
    } finally {
      clearTimeout(timeout);
    }
  }, [apiKey, providerId, targetLang, model, baseUrl, selectedProvider, t]);

  const inputStyle = useMemo(
    () => ({
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      color: theme.colors.text,
    }),
    [theme],
  );

  if (loading || !isLoaded) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { padding: theme.spacing.m, gap: theme.spacing.m },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.section}>
        <Text variant="caption">{t('settings.providerLabel')}</Text>
        <View style={styles.providerList}>
          {PROVIDERS.map((provider) => {
            const selected = provider.id === providerId;
            return (
              <Pressable
                key={provider.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => selectProvider(provider.id)}
                style={[
                  styles.providerCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <Text variant="headline">{t(providerLabelKey(provider.id))}</Text>
                <Text variant="caption">{provider.keyHint}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="caption">{t('settings.modelLabel')}</Text>
        <View style={styles.langList}>
          {selectedProvider.models.map((m) => {
            const selected = model === m;
            return (
              <Pressable
                key={m}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => setModel(m)}
                style={[
                  styles.langChip,
                  {
                    backgroundColor: selected
                      ? theme.colors.primary
                      : theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: selected ? theme.colors.primaryText : theme.colors.text,
                  }}
                >
                  {m}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: !selectedProvider.models.includes(model) }}
            onPress={() => setModel('')}
            style={[
              styles.langChip,
              {
                backgroundColor: !selectedProvider.models.includes(model)
                  ? theme.colors.primary
                  : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={{
                color: !selectedProvider.models.includes(model)
                  ? theme.colors.primaryText
                  : theme.colors.text,
              }}
            >
              {t('settings.modelCustom')}
            </Text>
          </Pressable>
        </View>
        {!selectedProvider.models.includes(model) && (
          <TextInput
            accessibilityLabel={t('settings.modelLabel')}
            value={model}
            onChangeText={setModel}
            placeholder={t('settings.modelPlaceholder')}
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, inputStyle]}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text variant="caption">{t('settings.baseUrlLabel')}</Text>
        <TextInput
          accessibilityLabel={t('settings.baseUrlLabel')}
          value={baseUrl}
          onChangeText={setBaseUrl}
          placeholder={selectedProvider.defaultBaseUrl}
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, inputStyle]}
        />
      </View>

      <View style={styles.section}>
        <Text variant="caption">{t('settings.apiKeyLabel')}</Text>
        <TextInput
          accessibilityLabel={t('settings.apiKeyLabel')}
          value={apiKey}
          onChangeText={(value) => {
            setApiKey(value);
            setIsApiKeyDirty(true);
          }}
          onBlur={() => {
            if (!isApiKeyDirty) {
              return;
            }
            void (async () => {
              if (apiKey.trim().length === 0) {
                await deleteApiKey(providerId);
              } else {
                await saveApiKey(providerId, apiKey);
              }
              setIsApiKeyDirty(false);
            })();
          }}
          placeholder={t('settings.apiKeyPlaceholder')}
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, inputStyle]}
        />
      </View>

      <View style={styles.section}>
        <Text variant="caption">{t('settings.targetLangLabel')}</Text>
        <View style={styles.langList}>
          {supportedLanguages.map((lang) => {
            const selected = targetLang === lang;
            return (
              <Pressable
                key={lang}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => selectTargetLang(lang)}
                style={[
                  styles.langChip,
                  {
                    backgroundColor: selected
                      ? theme.colors.primary
                      : theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: selected ? theme.colors.primaryText : theme.colors.text,
                  }}
                >
                  {lang.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text variant="caption" style={{ color: theme.colors.textMuted }}>
          {t('settings.targetLangHint')}
        </Text>
      </View>

      <View style={styles.section}>
        <Button
          label={t('settings.testConnection')}
          onPress={handleTestConnection}
          disabled={testStatus.type === 'loading'}
        />
        {testStatus.type === 'loading' && (
          <ActivityIndicator
            style={{ marginTop: theme.spacing.s }}
            color={theme.colors.primary}
          />
        )}
        {testStatus.type === 'ok' && (
          <Text
            variant="body"
            style={{ color: theme.colors.textMuted, marginTop: theme.spacing.s }}
          >
            {t('settings.testOk', { result: testStatus.result })}
          </Text>
        )}
        {testStatus.type === 'error' && (
          <Text
            variant="body"
            style={{ color: theme.colors.danger, marginTop: theme.spacing.s }}
          >
            {t('settings.testError', { message: testStatus.message })}
          </Text>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/faq')}
        style={[
          styles.faqRow,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.m,
            padding: theme.spacing.m,
          },
        ]}
      >
        <Text variant="headline">{t('settings.faq')}</Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: 18 }}>›</Text>
      </Pressable>

      <Text
        variant="caption"
        style={[styles.savedHint, { color: theme.colors.textMuted }]}
      >
        {t('settings.saved')}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 48,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: 8,
  },
  providerList: {
    gap: 8,
  },
  providerCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  langList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  langChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  savedHint: {
    textAlign: 'center',
  },
});
