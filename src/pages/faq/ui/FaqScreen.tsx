import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@shared/ui';
import { useTheme } from '@shared/theme';

type FaqItem = {
  q: string;
  a: string;
};

type FaqSection = {
  title: string;
  items: FaqItem[];
};

export function FaqScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const sections = t('faq.sections', {
    returnObjects: true,
  }) as unknown as FaqSection[];
  const title = t('faq.title');

  const toggleSection = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: theme.spacing.m,
            paddingTop: insets.top + theme.spacing.s,
            paddingBottom: theme.spacing.s,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('settings.back')}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Feather name="chevron-left" size={24} color={theme.colors.primary} />
        </Pressable>
        <Text variant="title">{title}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: theme.spacing.m,
          paddingHorizontal: theme.spacing.m,
          paddingBottom: theme.spacing.m + insets.bottom,
          gap: theme.spacing.m,
        }}
      >
        {sections.map((section, sectionIndex) => {
          const id = String(sectionIndex);
          const expanded = expandedIds.has(id);
          return (
            <View
              key={id}
              style={[
                styles.sectionCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radii.m,
                  padding: theme.spacing.m,
                },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => toggleSection(id)}
                style={styles.sectionHeader}
              >
                <Text variant="headline" style={{ flex: 1 }}>
                  {section.title}
                </Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 18 }}>
                  {expanded ? '−' : '+'}
                </Text>
              </Pressable>

              {expanded && (
                <View style={styles.items}>
                  {section.items.map((item, itemIndex) => (
                    <View
                      key={itemIndex}
                      style={[
                        styles.item,
                        itemIndex > 0 && {
                          borderTopWidth: 1,
                          borderTopColor: theme.colors.border,
                          paddingTop: theme.spacing.m,
                        },
                      ]}
                    >
                      <Text variant="body" style={{ fontWeight: theme.weight.bold }}>
                        {item.q}
                      </Text>
                      <Text variant="body" style={{ color: theme.colors.text }}>
                        {item.a}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  placeholder: {
    minWidth: 44,
  },
  sectionCard: {
    borderWidth: 1,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  items: {
    gap: 16,
  },
  item: {
    gap: 6,
  },
});
