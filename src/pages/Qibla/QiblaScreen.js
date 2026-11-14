import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import * as Location from "expo-location";
import Svg, { Circle, Line, G, Text as SvgText, Path } from "react-native-svg";
import Feather from "@expo/vector-icons/Feather";
import { ExploreScreen, ExploreHeader, Card } from "../../components/explore/ExploreUI";
import { useExploreTheme, NUMERIC } from "../../utils/Theme/ExploreTheme";
import { qiblaBearing, distanceToKaaba, angleDelta } from "../../utils/qibla";
import { getCityCoords } from "../../data/cities";

const DIAL = 280;
const R = DIAL / 2;
const ALIGNED_TOLERANCE = 5; // degrees
const LOCATION_TIMEOUT_MS = 6000;

/** Compass rose + qibla marker. Rotated as one piece, like a real dial. */
const CompassRose = ({ c, cardinalLabels, heading, bearing, aligned }) => {
  const ticks = [];
  for (let deg = 0; deg < 360; deg += 5) {
    const major = deg % 30 === 0;
    const len = major ? 14 : 7;
    const rad = ((deg - 90) * Math.PI) / 180;
    const outer = R - 10;
    const inner = outer - len;
    ticks.push(
      <Line
        key={deg}
        x1={R + Math.cos(rad) * outer}
        y1={R + Math.sin(rad) * outer}
        x2={R + Math.cos(rad) * inner}
        y2={R + Math.sin(rad) * inner}
        stroke={major ? c.inkSoft : c.line}
        strokeWidth={major ? 2 : 1}
        strokeLinecap="round"
      />
    );
  }

  const cardinals = [
    { deg: 0, label: cardinalLabels.n },
    { deg: 90, label: cardinalLabels.e },
    { deg: 180, label: cardinalLabels.s },
    { deg: 270, label: cardinalLabels.w },
  ];

  // Kaaba marker rides the rose at the qibla bearing.
  const markerRad = ((bearing - 90) * Math.PI) / 180;
  const markerR = R - 52;
  const mx = R + Math.cos(markerRad) * markerR;
  const my = R + Math.sin(markerRad) * markerR;

  return (
    <View style={{ transform: [{ rotate: `${-heading}deg` }] }}>
      <Svg width={DIAL} height={DIAL}>
        <Circle cx={R} cy={R} r={R - 2} fill={c.surface} stroke={c.line} strokeWidth={2} />
        {ticks}
        {cardinals.map(({ deg, label }) => {
          const rad = ((deg - 90) * Math.PI) / 180;
          const rr = R - 34;
          return (
            <SvgText
              key={deg}
              x={R + Math.cos(rad) * rr}
              y={R + Math.sin(rad) * rr + 6}
              fill={deg === 0 ? c.gold : c.muted}
              fontSize={deg === 0 ? 18 : 15}
              fontWeight="700"
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}

        {/* qibla direction line + Kaaba marker */}
        <Line
          x1={R}
          y1={R}
          x2={R + Math.cos(markerRad) * (markerR - 22)}
          y2={R + Math.sin(markerRad) * (markerR - 22)}
          stroke={aligned ? c.gold : c.line}
          strokeWidth={3}
          strokeDasharray="6 6"
          strokeLinecap="round"
        />
        <G>
          <Circle cx={mx} cy={my} r={22} fill={aligned ? c.gold : c.goldSoft} />
          {/* simplified Kaaba: cube with the kiswah band */}
          <Path
            d={`M ${mx - 9} ${my - 8} h 18 v 17 h -18 z`}
            fill={aligned ? c.onAcc : c.gold}
          />
          <Line
            x1={mx - 9}
            y1={my - 1}
            x2={mx + 9}
            y2={my - 1}
            stroke={aligned ? c.gold : c.goldSoft}
            strokeWidth={2.5}
          />
        </G>
      </Svg>
    </View>
  );
};

const QiblaScreen = () => {
  const { t, i18n } = useTranslation();
  const { c, fonts } = useExploreTheme();
  const navigation = useNavigation();
  const selectedCity = useSelector((s) => s.counter?.selectedCity);

  const [coords, setCoords] = useState(null);
  const [usingGps, setUsingGps] = useState(false);
  const [heading, setHeading] = useState(null);
  const [lowAccuracy, setLowAccuracy] = useState(false);
  const [hasCompass, setHasCompass] = useState(true);
  const [loading, setLoading] = useState(true);

  // Smoothed heading, so the dial glides instead of twitching with the sensor.
  const smoothed = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const resolveLocation = async () => {
      const fallback = getCityCoords(selectedCity);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          // getCurrentPositionAsync waits forever for a fix that may never
          // arrive (indoors, airplane mode, an emulator with no location set),
          // so take the last known fix if there is one and cap the wait.
          const last = await Location.getLastKnownPositionAsync();
          const pos =
            last ||
            (await Promise.race([
              Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
              new Promise((resolve) => setTimeout(() => resolve(null), LOCATION_TIMEOUT_MS)),
            ]));
          if (cancelled) return;
          if (pos?.coords) {
            setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setUsingGps(true);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.log("Kıble için konum alınamadı:", error);
      }
      if (cancelled) return;
      // Without a fix the selected prayer-times city is still a good answer:
      // the qibla bearing barely moves within a province.
      setCoords({ lat: fallback.lat, lng: fallback.lng });
      setUsingGps(false);
      setLoading(false);
    };

    resolveLocation();
    return () => {
      cancelled = true;
    };
  }, [selectedCity]);

  useEffect(() => {
    let subscription;
    let cancelled = false;

    const watch = async () => {
      try {
        subscription = await Location.watchHeadingAsync((h) => {
          if (cancelled) return;
          // trueHeading is -1 when the device cannot correct for declination.
          const raw = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
          if (typeof raw !== "number" || Number.isNaN(raw)) return;

          const previous = smoothed.current;
          const next =
            previous === null ? raw : (previous + angleDelta(previous, raw) * 0.2 + 360) % 360;
          smoothed.current = next;
          setHeading(next);
          setLowAccuracy(typeof h.accuracy === "number" && h.accuracy >= 0 && h.accuracy < 2);
        });
      } catch (error) {
        console.log("Pusula başlatılamadı:", error);
        if (!cancelled) setHasCompass(false);
      }
    };

    watch();
    return () => {
      cancelled = true;
      subscription?.remove?.();
    };
  }, []);

  const bearing = useMemo(
    () => (coords ? qiblaBearing(coords.lat, coords.lng) : null),
    [coords]
  );
  const distance = useMemo(
    () => (coords ? distanceToKaaba(coords.lat, coords.lng) : null),
    [coords]
  );

  const cardinalLabels = {
    n: t("DEGREE_NORTH"),
    e: t("DEGREE_EAST"),
    s: t("DEGREE_SOUTH"),
    w: t("DEGREE_WEST"),
  };

  const delta = heading !== null && bearing !== null ? angleDelta(heading, bearing) : null;
  const aligned = delta !== null && Math.abs(delta) <= ALIGNED_TOLERANCE;
  const compassLive = heading !== null && hasCompass;

  const Stat = ({ icon, label, value }) => (
    <Card style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: c.goldSoft }]}>
        <Feather name={icon} size={17} color={c.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.ui, fontSize: 14, color: c.muted }}>{label}</Text>
        <Text
          style={{ fontFamily: fonts.numeric, ...NUMERIC, fontSize: 19, fontWeight: "700", color: c.ink, marginTop: 2 }}
        >
          {value}
        </Text>
      </View>
    </Card>
  );

  return (
    <ExploreScreen>
      <ExploreHeader
        title={t("QIBLA")}
        subtitle={t("QIBLA_SUBTITLE")}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading || bearing === null ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={c.gold} />
            <Text style={{ fontFamily: fonts.ui, fontSize: 16, color: c.muted, marginTop: 14 }}>
              {t("QIBLA_LOCATING")}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.dialWrap}>
              <CompassRose
                c={c}
                cardinalLabels={cardinalLabels}
                heading={compassLive ? heading : 0}
                bearing={bearing}
                aligned={aligned}
              />

              {/* fixed index at the top — the direction the phone points */}
              <View style={styles.indexWrap} pointerEvents="none">
                <View
                  style={[
                    styles.index,
                    { borderTopColor: aligned ? c.gold : c.inkSoft },
                  ]}
                />
              </View>

              {/* hub */}
              <View style={[styles.hub, { backgroundColor: c.bg, borderColor: c.line }]}>
                <Text style={{ fontFamily: fonts.numeric, ...NUMERIC, fontSize: 26, fontWeight: "700", color: c.ink }}>
                  {Math.round(bearing)}°
                </Text>
                {compassLive ? (
                  <Text
                    style={{
                      fontFamily: fonts.ui,
                      fontSize: 13,
                      fontWeight: "700",
                      color: aligned ? c.gold : c.muted,
                      marginTop: 2,
                    }}
                  >
                    {aligned ? "✓" : `${delta > 0 ? "↻" : "↺"} ${Math.abs(Math.round(delta))}°`}
                  </Text>
                ) : null}
              </View>
            </View>

            <Text
              style={[
                styles.status,
                {
                  fontFamily: fonts.ui,
                  color: aligned ? c.gold : c.inkSoft,
                  fontWeight: aligned ? "700" : "500",
                },
              ]}
            >
              {!compassLive
                ? t("QIBLA_NO_COMPASS")
                : aligned
                ? t("QIBLA_ALIGNED")
                : t("QIBLA_TURN")}
            </Text>

            {compassLive && lowAccuracy ? (
              <Text style={[styles.note, { fontFamily: fonts.ui, color: c.muted }]}>
                {t("QIBLA_CALIBRATE")}
              </Text>
            ) : null}

            <View style={styles.stats}>
              <Stat icon="compass" label={t("QIBLA_BEARING")} value={`${bearing.toFixed(1)}°`} />
              <Stat
                icon="map-pin"
                label={t("QIBLA_DISTANCE")}
                // grouped with Western digits on purpose: the LCD face used across the
                // app (countdowns, the counter) has no Arabic-Indic glyphs, and mixing
                // the two on one screen looked broken.
                value={`${Math.round(distance).toLocaleString("en-US")} ${t("KM")}`}
              />
            </View>

            <Text style={[styles.source, { fontFamily: fonts.ui, color: c.muted }]}>
              {usingGps
                ? t("QIBLA_USING_GPS")
                : t("QIBLA_USING_CITY", { city: getCityCoords(selectedCity).name })}
            </Text>
          </>
        )}
      </ScrollView>
    </ExploreScreen>
  );
};

export default QiblaScreen;

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  loadingBox: { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  dialWrap: {
    width: DIAL,
    height: DIAL,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  indexWrap: { position: "absolute", top: -6, alignItems: "center" },
  index: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 16,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  hub: {
    position: "absolute",
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  status: { fontSize: 15, textAlign: "center", marginTop: 26, lineHeight: 22 },
  note: { fontSize: 15, textAlign: "center", marginTop: 10, lineHeight: 22 },
  stats: { flexDirection: "row", gap: 12, marginTop: 24 },
  stat: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  source: { fontSize: 14, textAlign: "center", marginTop: 18 },
});
