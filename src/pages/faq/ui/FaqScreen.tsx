import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
            paddingTop: 48,
            paddingBottom: theme.spacing.s,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={{ color: theme.colors.primary }}>← {t('settings.back')}</Text>
        </Pressable>
        <Text variant="title">{title}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { padding: theme.spacing.m, gap: theme.spacing.m },
        ]}
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
    minWidth: 64,
  },
  placeholder: {
    minWidth: 64,
  },
  content: {
    paddingBottom: 48,
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
