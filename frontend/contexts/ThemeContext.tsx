import { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppScheme } from "@/constants/colors";

const STORAGE_KEY = "app_theme";

interface ThemeContextValue {
  scheme: AppScheme;
  setScheme: (s: AppScheme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  scheme: "light",
  setScheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = (useColorScheme() ?? "light") as "light" | "dark";
  const [scheme, setSchemeState] = useState<AppScheme>(systemScheme);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === "light" || saved === "dark" || saved === "warm") {
        setSchemeState(saved);
      } else {
        setSchemeState(systemScheme);
      }
      setLoaded(true);
    });
  }, []);

  const setScheme = (s: AppScheme) => {
    setSchemeState(s);
    AsyncStorage.setItem(STORAGE_KEY, s);
  };

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ scheme, setScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
