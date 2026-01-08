import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface Preferences {
  selectedModel: string;
}

interface PreferencesContextValue {
  preferences: Preferences;
  updatePreferences: (updates: Partial<Preferences>) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(
  undefined,
);

const STORAGE_KEY = 'vektor-preferences';

function loadPreferences(): Preferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading preferences:', error);
  }
  return {
    selectedModel: '',
  };
}

function savePreferences(preferences: Preferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(() =>
    loadPreferences(),
  );

  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  const updatePreferences = (updates: Partial<Preferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
  };

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
