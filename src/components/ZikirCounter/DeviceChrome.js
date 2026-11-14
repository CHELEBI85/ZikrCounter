// Physical-tasbih chrome for the home counter, ported 1:1 from the
// "Zikirmatik Yeni Tasarim" mockup. RN has no CSS gradients, so the body
// fill and the moulded button caps are drawn with react-native-svg.

import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect, Circle } from "react-native-svg";

/**
 * Device body fill:
 *   linear-gradient(160deg, --gold-2 0%, --gold 58%, --gold-ink 140%)
 * plus the glossy top highlight:
 *   radial-gradient(ellipse at 42% 10%, rgba(255,255,255,.4), transparent 68%)
 *
 * Rendered as an absolutely-positioned layer; the parent clips it to the
 * device's asymmetric corner radii via overflow:"hidden".
 */
export const DeviceSkin = ({ c, width }) => (
  <Svg style={StyleSheet.absoluteFill}>
    <Defs>
      {/* 160deg ≈ down and slightly right */}
      <LinearGradient id="deviceBody" x1="0" y1="0" x2="0.35" y2="1">
        <Stop offset="0" stopColor={c.deviceTop} />
        <Stop offset="0.58" stopColor={c.deviceMid} />
        <Stop offset="1" stopColor={c.deviceEnd} />
      </LinearGradient>
      <RadialGradient id="deviceGloss" cx="0.42" cy="0.1" rx="0.68" ry="0.68">
        <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.4" />
        <Stop offset="0.68" stopColor="#FFFFFF" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    <Rect x="0" y="0" width="100%" height="100%" fill="url(#deviceBody)" />
    <Rect x={22} y={10} width={Math.max(0, width - 44)} height={70} rx={40} fill="url(#deviceGloss)" />
  </Svg>
);

/**
 * Moulded white button cap.
 *   small: radial-gradient(circle at 38% 32%, #fff, #e8efe9 78%)
 *   big:   radial-gradient(circle at 40% 30%, #fff 0%, #eef3ee 55%, #d7e2da 100%)
 */
export const ButtonCap = ({ size, id, big = false }) => {
  // Built as an array rather than inline JSX: react-native-svg's gradient
  // extractor calls cloneElement on every child, so a conditional `null`
  // child crashes the render.
  const stops = big
    ? [
        { offset: "0", color: "#FFFFFF" },
        { offset: "0.55", color: "#EEF3EE" },
        { offset: "1", color: "#D7E2DA" },
      ]
    : [
        { offset: "0", color: "#FFFFFF" },
        { offset: "0.78", color: "#E8EFE9" },
      ];

  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient
          id={id}
          cx={size * (big ? 0.4 : 0.38)}
          cy={size * (big ? 0.3 : 0.32)}
          rx={size * 0.8}
          ry={size * 0.8}
          gradientUnits="userSpaceOnUse"
        >
          {stops.map((s) => (
            <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
    </Svg>
  );
};
