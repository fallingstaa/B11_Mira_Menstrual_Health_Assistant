import { reloadAppAsync } from 'expo';
import { createContext, ReactNode, useCallback, useContext, useMemo } from 'react';

import { CHRISTMAS_AT_STARTUP, saveChristmasMode } from '@/constants/season';

type SeasonalTheme = {
  /** Christmas mode: Christmas colours, snow, decorations, festive Yumi and share cards. Off by default. */
  christmas: boolean;
  /** Saves the choice and restarts the app so the new colours apply everywhere. */
  setChristmas: (on: boolean) => void;
};

const SeasonalThemeContext = createContext<SeasonalTheme>({ christmas: false, setChristmas: () => {} });

/**
 * Opt-in seasonal look. Only ever turned on by the user (Profile → Preferences → Christmas
 * mode), and remembered on this device. The value is fixed for the whole app session: colours
 * are baked into every screen's styles when the app starts (see constants/season.ts), so a
 * switch saves the new value and restarts the app rather than half-changing things live.
 */
export function SeasonalThemeProvider({ children }: { children: ReactNode }) {
  const setChristmas = useCallback((on: boolean) => {
    if (on === CHRISTMAS_AT_STARTUP) return;
    saveChristmasMode(on);
    reloadAppAsync('Christmas mode changed').catch((err) =>
      console.warn('[seasonal-theme] could not restart the app; the change applies next launch:', err),
    );
  }, []);

  const value = useMemo(() => ({ christmas: CHRISTMAS_AT_STARTUP, setChristmas }), [setChristmas]);
  return <SeasonalThemeContext.Provider value={value}>{children}</SeasonalThemeContext.Provider>;
}

export function useSeasonalTheme(): SeasonalTheme {
  return useContext(SeasonalThemeContext);
}
