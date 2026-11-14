// Design tokens for the new "Keşfet" (Explore) / Qur'an / Hadith surface.
// Extracted verbatim from the Zikirmatik v2.0 mockup (emerald theme,
// light + dark). This module is SELF-CONTAINED and does not touch the
// existing screens' visual system.

import { useSelector } from "react-redux";

const LIGHT = {
  bg: "#F7FBF7",
  bg2: "#FFFFFF",
  surface: "#FFFFFF",
  card: "#F5FAF5",
  ink: "#1C3A30",
  inkSoft: "#51695E",
  // was #93A69B (2.5:1 on bg) — below the 4.5:1 readable minimum for body text
  muted: "#5F7569",
  line: "#E4ECE4",
  gold: "#1E9E76",
  gold2: "#34BC8D",
  goldInk: "#0B3A2B",
  goldSoft: "#DCF1E6",
  onAcc: "#FFFFFF",
  shadow: "rgba(30,70,55,0.14)",
  tabbar: "#FFFFFF",
  overlay: "rgba(0,0,0,0.35)",
  // Tasbih device (home counter) — mockup vars --screen / --lcd-ink / --lcd-dim.
  screen: "#C7D6C0",
  lcdInk: "#233A2C",
  lcdDim: "rgba(35,58,44,0.18)",
  // Body gradient stops for linear-gradient(160deg, gold2 0%, gold 58%, gold-ink 140%);
  // deviceEnd is that ramp sampled at 100%. deviceInk = the mockup's raw --gold-ink,
  // kept separate because DARK.goldInk is intentionally inverted for the Keşfet chips.
  deviceTop: "#34BC8D",
  deviceMid: "#1E9E76",
  deviceEnd: "#146B50",
  deviceInk: "#0B3A2B",
};

const DARK = {
  bg: "#122019",
  bg2: "#17281F",
  surface: "#1A2E24",
  card: "#18291F",
  ink: "#EAF3EC",
  inkSoft: "#B5CBBF",
  muted: "#7C9488",
  line: "rgba(120,200,160,0.16)",
  gold: "#37C093",
  gold2: "#58D8AE",
  goldInk: "#DCF1E6",
  goldSoft: "#1E4234",
  onAcc: "#062018",
  shadow: "rgba(0,0,0,0.45)",
  tabbar: "#142219",
  overlay: "rgba(0,0,0,0.55)",
  screen: "#0C1712",
  lcdInk: "#5CD9AF",
  lcdDim: "rgba(92,217,175,0.16)",
  deviceTop: "#58D8AE",
  deviceMid: "#37C093",
  deviceEnd: "#207357",
  deviceInk: "#0A2A1E",
};

// Font families. The mockup uses Google fonts (Plus Jakarta Sans / Cormorant /
// Amiri / Share Tech Mono); the RN app only bundles "OpenSans" + "digital", so
// we fall back to those + platform defaults. Arabic renders correctly with the
// system font. (Custom fonts can be dropped into utils/Fonts later without
// changing screen code.)
export const FONTS = {
  ui: "OpenSans",
  display: "OpenSans", // headings (serif display could be added later)
  arabic: undefined, // system Arabic shaping
  // 7-segment face: only for things drawn *on the tasbih's LCD*. Anything the
  // user has to read as text (times, countdowns, distances) uses `numeric`.
  mono: "digital",
  numeric: "OpenSans",
};

// Digits that line up and don't jitter as a countdown ticks.
export const NUMERIC = { fontVariant: ["tabular-nums"] };

export const getExploreTheme = (mode) => {
  const c = mode === "dark" ? DARK : LIGHT;
  return { mode: mode === "dark" ? "dark" : "light", c, fonts: FONTS };
};

/**
 * Hook: current Explore theme from redux (contentPrefs.exploreTheme).
 * @returns {{mode:string, c:typeof LIGHT, fonts:typeof FONTS}}
 */
export const useExploreTheme = () => {
  const mode = useSelector((s) => s.contentPrefs?.exploreTheme) || "light";
  return getExploreTheme(mode);
};

// Shared numeric scale (radii / spacing) from the spec.
export const RADIUS = { card: 18, container: 18, chip: 12, pill: 999, search: 14, button: 14, sheet: 24 };
export const SPACE = { screenH: 20, headerH: 24, gap: 12, cardPad: 16 };
