import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import { applyLayoutDirection } from "../utils/rtl";
// moment ships English only; the other locales have to be pulled in explicitly
// or moment.locale("tr"|"ar") silently falls back to English dates.
import "moment/locale/tr";
import "moment/locale/ar";

import tr from "../locales/tr.json";
import en from "../locales/en.json";
import ar from "../locales/ar.json";

export const SUPPORTED_UI_LANGUAGES = ["tr", "en", "ar"];
const STORAGE_KEY = "@zc/appLanguage";

const resources = {
  tr: { translation: tr },
  en: { translation: en },
  ar: { translation: ar },
};

const deviceLanguage = () => {
  const tag = getLocales()?.[0]?.languageTag?.split("-")[0];
  return SUPPORTED_UI_LANGUAGES.includes(tag) ? tag : "tr";
};

i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage(),
  fallbackLng: "tr",
  returnObjects: true,
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: "v3",
});

// Keep moment's locale in step with the UI language so saved-dhikr dates and
// prayer countdowns are formatted in the language the user is reading.
const syncMoment = (lng) => moment.locale(SUPPORTED_UI_LANGUAGES.includes(lng) ? lng : "tr");
syncMoment(i18n.language);
i18n.on("languageChanged", syncMoment);

/**
 * Change the app language and remember it across launches.
 * @param {"tr"|"en"|"ar"} lng
 * @returns {Promise<boolean>} true when the writing direction flipped, so the
 *   caller has to ask the user to restart before the layout matches.
 */
export const setAppLanguage = async (lng) => {
  if (!SUPPORTED_UI_LANGUAGES.includes(lng) || lng === i18n.language) return false;
  await i18n.changeLanguage(lng);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lng);
  } catch (error) {
    console.log("Dil tercihi kaydedilemedi:", error);
  }
  return applyLayoutDirection(lng);
};

/**
 * Apply the stored language, if the user has ever picked one. Awaited during
 * startup so the first frame is already in the right language.
 */
export const hydrateAppLanguage = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_UI_LANGUAGES.includes(stored) && stored !== i18n.language) {
      await i18n.changeLanguage(stored);
    }
  } catch (error) {
    console.log("Dil tercihi okunamadı:", error);
  }
  // Runs before the first render, so Arabic launches straight into RTL.
  applyLayoutDirection(i18n.language);
};

export default i18n;
