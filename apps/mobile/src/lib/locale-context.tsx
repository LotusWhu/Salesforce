import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Locale, translations } from "@localhub/shared-types";
import { api } from "./api";
import { useAuth } from "./auth-context";

const LANGUAGE_KEY = "localhub_language";
const CITY_KEY = "localhub_city";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  city: string | null;
  setCity: (city: string | null) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { user, refresh } = useAuth();
  const [locale, setLocaleState] = useState<Locale>("zh");
  const [city, setCityState] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const storedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (storedLang === "zh" || storedLang === "en") {
        setLocaleState(storedLang);
      } else {
        // 面向海外华人社区，默认中文优先；只有设备语言明确是英文且从未设置过时才用英文
        const deviceLang = Localization.getLocales?.()[0]?.languageCode ?? "zh";
        setLocaleState(deviceLang === "en" ? "en" : "zh");
      }
      const storedCity = await AsyncStorage.getItem(CITY_KEY);
      setCityState(storedCity);
    })();
  }, []);

  useEffect(() => {
    if (user?.language) setLocaleState(user.language);
    if (user?.city) setCityState(user.city);
  }, [user]);

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      AsyncStorage.setItem(LANGUAGE_KEY, next);
      if (user) {
        api
          .patch("/me", { language: next })
          .then(() => refresh())
          .catch(() => {});
      }
    },
    [user, refresh],
  );

  const setCity = useCallback(
    (next: string | null) => {
      setCityState(next);
      if (next) AsyncStorage.setItem(CITY_KEY, next);
      else AsyncStorage.removeItem(CITY_KEY);
      if (user) {
        api
          .patch("/me", { city: next ?? "" })
          .then(() => refresh())
          .catch(() => {});
      }
    },
    [user, refresh],
  );

  const t = useMemo(() => {
    const dict = translations[locale];
    return (key: string) => dict[key] ?? translations.zh[key] ?? key;
  }, [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, city, setCity, t }),
    [locale, setLocale, city, setCity, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale 必须在 LocaleProvider 内使用");
  return ctx;
}
