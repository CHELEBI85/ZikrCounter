import React, { useState } from "react";
import { View, Pressable, Text, StyleSheet, useWindowDimensions, Alert } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { increment, reset, setFavorite, updateFavorite } from "../../redux/CounterSlice";
import { useAudioPlayer } from "expo-audio";
import Feather from "@expo/vector-icons/Feather";
import CustomButton from "../CustomButton/CustomButton";
import CustomAlert from "../CustomAlert/CustomAlert";
import { useExploreTheme } from "../../utils/Theme/ExploreTheme";
import { useTranslation } from "react-i18next";
import moment from "moment";
import { DeviceSkin, ButtonCap } from "./DeviceChrome";
import Crescent from "../Crescent/Crescent";

const TARGET = 33;
const DEVICE_W = 280; // mockup width, inside a 368px viewport
const CAP = 52;

/** KAYDET / SIFIRLA cap sitting on the device body. */
const SmallCap = ({ id, icon, iconColor, label, labelColor, fonts, onPress, accessibilityLabel }) => (
  <View style={styles.capCol}>
    <Pressable
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.cap,
        pressed && { transform: [{ translateY: 2 }, { scale: 0.96 }] },
      ]}
    >
      <ButtonCap size={CAP} id={id} />
      <Feather name={icon} size={22} color={iconColor} />
    </Pressable>
    <Text style={[styles.capLabel, { color: labelColor, fontFamily: fonts.ui }]}>{label}</Text>
  </View>
);

const ZikirCounterSkeleton = ({ onButtonClick }) => {
  const { t } = useTranslation();
  const { c, fonts } = useExploreTheme();
  const { width } = useWindowDimensions();

  const { value, fontSize, activeZikr, resumedFavoriteId } = useSelector((state) => state.counter);
  const dispatch = useDispatch();

  const player = useAudioPlayer(require("../../assets/sound/click.mp3"));

  const [modalVisible, setModalVisible] = useState(false);

  const handleButtonPress = (v) => onButtonClick(v);

  // The dhikr was named before counting started, so saving no longer stops to
  // ask for a name — it records that name and hands back a fresh, unnamed counter.
  // Every blocked action says why. Silently doing nothing when the counter has
  // no dhikr set just reads as a broken button.
  const warnNoZikr = () =>
    Alert.alert(t("ZIKR_REQUIRED_TITLE"), t("ZIKR_REQUIRED_BODY"), [{ text: t("OK") }]);

  const handleSavePress = () => {
    handleButtonPress("button1");
    if (!activeZikr) return warnNoZikr();
    if (value === 0) {
      Alert.alert(t("NOTHING_TO_SAVE_TITLE"), t("NOTHING_TO_SAVE_BODY"), [{ text: t("OK") }]);
      return;
    }
    const date = moment().format("DD MMMM dddd");
    if (resumedFavoriteId != null) {
      dispatch(updateFavorite({ id: resumedFavoriteId, fav: activeZikr, counter: value, date }));
    } else {
      dispatch(
        setFavorite({
          id: Math.floor(Math.random() * 9999999999),
          counter: value,
          fav: activeZikr,
          date,
        })
      );
    }
    dispatch(reset());
  };

  const handleClose = () => setModalVisible(false);

  const handleOnPress = async () => {
    if (!activeZikr) return warnNoZikr();
    handleButtonPress("button4");
    try {
      player.seekTo(0);
      player.play();
    } catch (error) {
      console.log("Ses çalma hatası:", error);
    }
    dispatch(increment());
  };

  const resetPress = () => {
    // reset() also clears the active dhikr, so it must run when the count is
    // already 0 but a dhikr is still selected — otherwise confirming did nothing.
    if (value !== 0 || activeZikr) {
      dispatch(reset());
    }
    setModalVisible(false);
  };

  const handleResetPress = () => {
    handleButtonPress("button1");
    if (value !== 0 || activeZikr) setModalVisible(true);
  };

  const laps = Math.floor(value / TARGET);
  const deviceW = Math.min(DEVICE_W, width - 88);

  return (
    <View style={styles.wrap}>
      {/* lanyard loop — tucked behind the body, which paints after it */}
      <View style={[styles.loop, { borderColor: c.deviceMid }]} />

      {/* physical tasbih device */}
      {/* backgroundColor is only there so Android has a surface to cast the
          elevation shadow from; DeviceSkin paints over it */}
      <View style={[styles.device, { width: deviceW, backgroundColor: c.deviceMid }]}>
        <View style={styles.skin}>
          <DeviceSkin c={c} width={deviceW} />
        </View>

        <View style={styles.brandRow}>
          <Crescent size={13} color={c.onAcc} style={styles.brandMark} />
          <Text style={[styles.brand, { color: c.onAcc }]}>{t("APP_NAME_MARK")}</Text>
          <Crescent size={13} color={c.onAcc} rotate={200} style={styles.brandMark} />
        </View>

        {/* LCD */}
        <View style={[styles.lcd, { backgroundColor: c.screen, borderColor: c.lcdDim }]}>
          <Text style={[styles.lcdLap, { color: c.lcdInk, fontFamily: fonts.ui }]}>
            {t("LAP")} {laps}
          </Text>
          <Text style={[styles.lcdTarget, { color: c.lcdInk, fontFamily: fonts.mono }]}>/ {TARGET}</Text>
          <View style={styles.lcdCenter}>
            {/* mockup: line-height:.9 keeps the digits inside the 88px window */}
            <Text style={[styles.ghost, { color: c.lcdInk, fontSize, lineHeight: fontSize * 0.9 }]}>88</Text>
            <Text style={[styles.value, { color: c.lcdInk, fontSize, lineHeight: fontSize * 0.9 }]}>
              {value}
            </Text>
          </View>
        </View>

        {/* KAYDET / SIFIRLA */}
        <View style={styles.capRow}>
          <SmallCap
            id="capSave"
            icon="bookmark"
            iconColor={c.gold}
            label={t("SAVE")}
            labelColor={c.onAcc}
            fonts={fonts}
            onPress={handleSavePress}
            accessibilityLabel={"save"}
          />
          <SmallCap
            id="capReset"
            icon="rotate-ccw"
            iconColor={c.deviceInk}
            label={t("RESET")}
            labelColor={c.onAcc}
            fonts={fonts}
            onPress={handleResetPress}
            accessibilityLabel={"Reset"}
          />
        </View>

        {/* ÇEK */}
        <View style={styles.pullRow}>
          <CustomButton onPress={handleOnPress} inactive={!activeZikr} />
        </View>
      </View>

      {modalVisible && (
        <View style={styles.modalOverlay}>
          <CustomAlert onClose={handleClose} visible={modalVisible} onConfirm={resetPress} />
        </View>
      )}
    </View>
  );
};

export default ZikirCounterSkeleton;

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  loop: {
    width: 34,
    height: 26,
    borderWidth: 5,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: "transparent",
    marginBottom: -10,
  },
  device: {
    borderTopLeftRadius: 52,
    borderTopRightRadius: 52,
    borderBottomLeftRadius: 62,
    borderBottomRightRadius: 62,
    paddingTop: 26,
    paddingHorizontal: 24,
    paddingBottom: 30,
    shadowColor: "rgba(20,90,65,1)",
    shadowOpacity: 0.55,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 30 },
    elevation: 12,
  },
  // separate clipping layer so the gradient follows the asymmetric radii
  // without the body's shadow being clipped along with it
  skin: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 52,
    borderTopRightRadius: 52,
    borderBottomLeftRadius: 62,
    borderBottomRightRadius: 62,
    overflow: "hidden",
  },
  brand: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 3,
    opacity: 0.92,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  brandMark: { opacity: 0.92 },
  lcd: {
    borderRadius: 16,
    borderWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 10,
    overflow: "hidden",
  },
  lcdLap: {
    position: "absolute",
    top: 12,
    left: 18,
    fontSize: 12,
    letterSpacing: 2,
    opacity: 0.5,
  },
  lcdTarget: {
    position: "absolute",
    top: 12,
    right: 18,
    fontSize: 13,
    opacity: 0.55,
  },
  lcdCenter: {
    height: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  ghost: {
    position: "absolute",
    fontFamily: "digital",
    opacity: 0.08,
    includeFontPadding: false,
  },
  value: {
    fontFamily: "digital",
    includeFontPadding: false,
  },
  capRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 26,
    marginTop: 20,
  },
  capCol: {
    alignItems: "center",
    gap: 6,
  },
  cap: {
    width: CAP,
    height: CAP,
    borderRadius: CAP / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "rgba(0,40,26,1)",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  capLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    opacity: 0.9,
  },
  pullRow: {
    alignItems: "center",
    marginTop: 22,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
});
