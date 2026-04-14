import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DEFAULT_ENABLED } from "@/constants/presets";
import { api } from "@/services/api";

interface UserContextValue {
  enabledModes: string[];
  setEnabledModes: (modes: string[]) => void;
  reloadProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  enabledModes: DEFAULT_ENABLED,
  setEnabledModes: () => {},
  reloadProfile: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [enabledModes, setEnabledModes] = useState<string[]>(DEFAULT_ENABLED);

  const reloadProfile = useCallback(async () => {
    try {
      const data = await api.getProfile();
      if (data.enabled_modes) setEnabledModes(data.enabled_modes);
    } catch {}
  }, []);

  useEffect(() => {
    reloadProfile();
  }, []);

  return (
    <UserContext.Provider value={{ enabledModes, setEnabledModes, reloadProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  return useContext(UserContext);
}
