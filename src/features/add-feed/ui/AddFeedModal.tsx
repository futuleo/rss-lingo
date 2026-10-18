import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Modal,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Button, Text } from '@shared/ui';
import { useTheme } from '@shared/theme';
import { useAddFeed } from '../model/useAddFeed';

export interface AddFeedModalProps {
  visible: boolean;
  onClose: () => void;
  onAdded: () => void | Promise<void>;
}

export function AddFeedModal({ visible, onClose, onAdded }: AddFeedModalProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { adding, addFeed } = useAddFeed();
  const [url, setUrl] = useState('');

  const handleSubmit = async () => {
    try {
      await addFeed(url);
      setUrl('');
      await onAdded();
      onClose();
    } catch {
      Alert.alert(t('common.error'), t('feeds.addFailed'));
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.modalBackdrop, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radii.l,
              padding: theme.spacing.l,
              gap: theme.spacing.s,
            },
          ]}
        >
          <Text variant="headline">{t('feeds.addTitle')}</Text>
          <Text variant="caption">{t('feeds.urlLabel')}</Text>
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder={t('feeds.urlPlaceholder')}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.input,
              {
                borderColor: theme.colors.border,
                borderRadius: theme.radii.s,
                color: theme.colors.text,
                padding: theme.spacing.s,
              },
            ]}
          />
          <View style={styles.modalButtons}>
            <Button
              label={t('common.cancel')}
              variant="secondary"
              onPress={onClose}
              disabled={adding}
            />
            <Button
              label={adding ? t('common.loading') : t('feeds.addSubmit')}
              onPress={handleSubmit}
              disabled={adding}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    margin: 16,
  },
  input: {
    borderWidth: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
});
