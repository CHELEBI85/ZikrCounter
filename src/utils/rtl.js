// Right-to-left support.
//
// React Native flips layout natively once I18nManager.forceRTL is set, but the
// flag is read when views are created: changing it mid-session leaves already
// mounted screens laid out the old way. So it is applied during startup (before
// the first render, see hydrateAppLanguage in src/i18n/i18n.js) and a change at
// runtime reports back that a restart is needed.

import { I18nManager } from "react-native";

const RTL_LANGUAGES = ["ar"];

/**
 * @param {string} [language]
 * @returns {boolean}
 */
export const isRtlLanguage = (language) =>
  RTL_LANGUAGES.includes((language || "").split("-")[0]);

/**
 * Align the native layout direction with a language.
 * @param {string} language
 * @returns {boolean} true when the direction actually changed, meaning the
 *   running UI is now stale and the app has to be restarted to look right.
 */
export const applyLayoutDirection = (language) => {
  const shouldBeRtl = isRtlLanguage(language);
  if (I18nManager.isRTL === shouldBeRtl) return false;
  I18nManager.allowRTL(shouldBeRtl);
  I18nManager.forceRTL(shouldBeRtl);
  return true;
};

/**
 * Name of a chevron that points "forward" (into the next screen) — mirrored in
 * RTL. Feather icon names.
 * @returns {"chevron-right"|"chevron-left"}
 */
export const forwardChevron = () => (I18nManager.isRTL ? "chevron-left" : "chevron-right");

/**
 * Name of a chevron that points "back" — mirrored in RTL.
 * @returns {"chevron-left"|"chevron-right"}
 */
export const backChevron = () => (I18nManager.isRTL ? "chevron-right" : "chevron-left");
