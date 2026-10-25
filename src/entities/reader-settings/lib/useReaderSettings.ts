import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_READER_SETTINGS } from '../model/types';
import type { ReaderSettings } from '../model/types';
import { getReaderSettings, saveReaderSettings } from '../model/settings-repository';

export interface UseReaderSettingsResult {
  settings: ReaderSettings;
  loading: boolean;
  update: (patch: Partial<ReaderSettings>) => void;
}

/**
 * Loads persisted reader appearance settings and exposes a write-through
 * `update`. Updates apply optimistically (instant re-render) and persist to
 * the settings table in the background.
 */
export function useReaderSettings(): UseReaderSettingsResult {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_READER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const settingsRef = useRef<ReaderSettings>(DEFAULT_READER_SETTINGS);

  useEffect(() => {
    let cancelled = false;
    void getReaderSettings().then((stored) => {
      if (cancelled) {
        return;
      }
      settingsRef.current = stored;
      setSettings(stored);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback((patch: Partial<ReaderSettings>) => {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next);
    void saveReaderSettings(next);
  }, []);

  return { settings, loading, update };
}
