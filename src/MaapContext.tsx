import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
  useCallback,
  useEffect
} from 'react';
import { ISettingRegistry } from '@jupyterlab/settingregistry';

export type MaapSettings = {
  maapApiUrl: string;
  maapToken: string;
  workspaceBucket: string;
};

interface IMaapContextType extends MaapSettings {
  setMaapApiUrl: (url: string) => Promise<void>;
  setMaapToken: (token: string) => Promise<void>;
  setWorkspaceBucket: (image: string) => Promise<void>;

  /**
   * Reads settings from the JupyterLab SettingRegistry right now and returns them.
   * Use this when you need the latest values immediately before making API calls.
   */
  getLatestSettings: () => Promise<MaapSettings>;

  /**
   * Expose settings instance in case callers need it.
   */
  settings: ISettingRegistry.ISettings;
}

const MaapContext = createContext<IMaapContextType | null>(null);

export function useMaapContext(): IMaapContextType {
  const ctx = useContext(MaapContext);
  if (!ctx) {
    throw new Error('useMaapContext must be used within a MaapProvider');
  }
  return ctx;
}

interface IMaapProviderProps {
  children: ReactNode;
  settings: ISettingRegistry.ISettings;
}

const DEFAULTS: MaapSettings = {
  maapApiUrl: '',
  maapToken: '',
  workspaceBucket: ''
};

export const MaapProvider: React.FC<IMaapProviderProps> = ({
  children,
  settings
}) => {
  const [state, setState] = useState<MaapSettings>(DEFAULTS);

  // Load initial values from settings once on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const apiUrlRes = await settings.get('maapApiUrl');
        const tokenRes = await settings.get('maapToken');
        const workspaceBucketRes = await settings.get('workspaceBucket');

        const maapApiUrl =
          (apiUrlRes.composite as string) ?? DEFAULTS.maapApiUrl;
        const maapToken = (tokenRes.composite as string) ?? DEFAULTS.maapToken;
        const workspaceBucket =
          (workspaceBucketRes.composite as string) ?? DEFAULTS.workspaceBucket;

        if (!cancelled) {
          setState({ maapApiUrl, maapToken, workspaceBucket });
        }
      } catch (err) {
        console.error('Failed to load MAAP settings:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [settings]);

  const setMaapApiUrl = useCallback(
    async (maapApiUrl: string) => {
      await settings.set('maapApiUrl', maapApiUrl);
      // Keep local state consistent for UI consumers
      setState(prev => ({ ...prev, maapApiUrl }));
    },
    [settings]
  );

  const setWorkspaceBucket = useCallback(
    async (workspaceBucket: string) => {
      await settings.set('workspaceBucket', workspaceBucket);
      // Keep local state consistent for UI consumers
      setState(prev => ({ ...prev, workspaceBucket }));
    },
    [settings]
  );

  const setMaapToken = useCallback(
    async (maapToken: string) => {
      await settings.set('maapToken', maapToken);
      // Keep local state consistent for UI consumers
      setState(prev => ({ ...prev, maapToken }));
    },
    [settings]
  );

  const getLatestSettings = useCallback(async (): Promise<MaapSettings> => {
    const apiUrlRes = await settings.get('maapApiUrl');
    const tokenRes = await settings.get('maapToken');
    const workspaceBucketRes = await settings.get('workspaceBucket');
    const currentAppImageRes = await settings.get('currentAppImage');

    const maapApiUrl = (apiUrlRes.composite as string) ?? DEFAULTS.maapApiUrl;
    const maapToken = (tokenRes.composite as string) ?? DEFAULTS.maapToken;
    const workspaceBucket =
      (workspaceBucketRes.composite as string) ?? DEFAULTS.workspaceBucket;

    // Optional: update local state so UI reflects latest values
    setState({ maapApiUrl, maapToken, workspaceBucket });

    return { maapApiUrl, maapToken, workspaceBucket };
  }, [settings]);

  const value = useMemo<IMaapContextType>(
    () => ({
      ...state,
      setMaapApiUrl,
      setMaapToken,
      setWorkspaceBucket,
      getLatestSettings,
      settings
    }),
    [
      state,
      setMaapApiUrl,
      setMaapToken,
      setWorkspaceBucket,
      getLatestSettings,
      settings
    ]
  );

  return <MaapContext.Provider value={value}>{children}</MaapContext.Provider>;
};
