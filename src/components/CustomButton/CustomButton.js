import { StyleSheet, Pressable, Text, View } from "react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { useExploreTheme } from "../../utils/Theme/ExploreTheme";
import { ButtonCap } from "../ZikirCounter/DeviceChrome";
import Crescent from "../Crescent/Crescent";

const SIZE = 150;
const RING = 6; // box-shadow: 0 0 0 6px rgba(255,255,255,.14)

// `inactive` dims the button but keeps it pressable — the press handler is
// what explains why nothing counted yet.
const CustomButton = ({ onPress, inactive = false }) => {
  const { t } = useTranslation();
  const { c, fonts } = useExploreTheme();

  return (
    <View style={[styles.ring, inactive && { opacity: 0.5 }]}>
      <Pressable
        accessible={true}
        accessibilityRole="button"
        accessibilityState={{ disabled: inactive }}
        accessibilityLabel={t("INCREASE")}
        onPress={onPress}
        style={({ pressed }) => [
          styles.btn,
          pressed && { transform: [{ translateY: 4 }, { scale: 0.965 }] },
        ]}
      >
        <ButtonCap size={SIZE} id="capPull" big />
        <Crescent size={34} color={c.gold} />
        <Text style={[styles.label, { color: c.deviceInk, fontFamily: fonts.ui }]}>{t("PULL")}</Text>
      </Pressable>
    </View>
  );
};

export default CustomButton;

const styles = StyleSheet.create({
  ring: {
    width: SIZE + RING * 2,
    height: SIZE + RING * 2,
    borderRadius: (SIZE + RING * 2) / 2,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  btn: {
    height: SIZE,
    width: SIZE,
    borderRadius: SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    // opaque base so iOS derives a shadow; the SVG cap paints over it
    backgroundColor: "#FFFFFF",
    shadowColor: "rgba(0,50,32,1)",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2,
  },
});
