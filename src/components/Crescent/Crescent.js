// Crescent (hilal) mark used across the app in place of the old star motif.
// Drawn as an SVG path rather than a text glyph: "☾" renders differently (or
// not at all) depending on the device font.

import React from "react";
import Svg, { Path } from "react-native-svg";

const INNER_RATIO = 0.8; // inner circle radius / outer radius
const OFFSET_RATIO = 0.42; // how far the inner circle is pushed right

/**
 * Path for a crescent centred on (cx, cy): an outer circle of radius r with an
 * offset inner circle cut out of it, opening to the right.
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 * @returns {string}
 */
export const crescentPath = (cx, cy, r) => {
  const ri = r * INNER_RATIO;
  const d = r * OFFSET_RATIO;
  // where the two circles intersect
  const x = (r * r - ri * ri + d * d) / (2 * d);
  const y = Math.sqrt(Math.max(0, r * r - x * x));
  const px = cx + x;
  return [
    `M ${px} ${cy - y}`,
    `A ${r} ${r} 0 1 0 ${px} ${cy + y}`, // outer edge, round the left
    `A ${ri} ${ri} 0 1 1 ${px} ${cy - y}`, // inner edge back up
    "Z",
  ].join(" ");
};

/**
 * @param {{size?: number, color: string, rotate?: number, style?: object}} props
 *   rotate is in degrees; a slight negative tilt reads most naturally.
 */
const Crescent = ({ size = 24, color, rotate = -20, style }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <Path d={crescentPath(50, 50, 44)} fill={color} transform={`rotate(${rotate} 50 50)`} />
  </Svg>
);

export default Crescent;
