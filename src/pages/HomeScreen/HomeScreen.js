import { View, StatusBar, StyleSheet, Pressable, Text, ScrollView, TextInput } from "react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import ZikirCounter from "../../components/ZikirCounter/ZikirCounter";
import { useExploreTheme } from "../../utils/Theme/ExploreTheme";
import { toggleExploreTheme } from "../../redux/ContentPrefsSlice";
import { setActiveZikr } from "../../redux/CounterSlice";
import AdBanner from "../../components/AdBanner/AdBanner";
import InterstitialAd from "../../components/InterstitialAd/InterstitialAd";

const HomeScreen = () => {
  const { c, fonts, mode } = useExploreTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const activeZikr = useSelector((state) => state.counter.activeZikr);
  const [draftName, setDraftName] = useState("");

  const startZikr = (name) => {
    const value = (name ?? draftName).trim();
    if (!value) return;
    dispatch(setActiveZikr(value));
    setDraftName("");
  };


  const [clickCounts, setClickCounts] = useState({
    button: 0,
    button1: 0,
    button2: 0,
    button3: 0,
    button4: 0,
  });

  const thresholds = {
    button: 5,
    button1: 10,
    button2: 15,
    button3: 25,
    button4: 100,
  };

  const handleButtonClick = (buttonKey) => {
    setClickCounts((prevCounts) => {
      const newCount = prevCounts[buttonKey] + 1;
      return { ...prevCounts, [buttonKey]: newCount };
    });
  };

  const resetClickCount = (buttonKey) => {
    setClickCounts((prevCounts) => ({ ...prevCounts, [buttonKey]: 0 }));
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: c.bg }]}
      accessible={false}
      accessibilityLabel={"Home1"}
    >
      <StatusBar barStyle={mode === "dark" ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: c.ink, fontFamily: fonts.display }]}>
              {t("APP_NAME")}
            </Text>
            <Text style={[styles.subtitle, { color: c.muted, fontFamily: fonts.ui }]}>
              {t("BASMALA")}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("THEME_TOGGLE")}
            onPress={() => dispatch(toggleExploreTheme())}
            style={({ pressed }) => [
              styles.themeBtn,
              { backgroundColor: c.goldSoft, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Feather name={mode === "dark" ? "sun" : "moon"} size={20} color={c.gold} />
          </Pressable>
        </View>

        {/* Naming comes first: the counter cannot run without knowing which
            dhikr it is counting, and that name is what gets saved. */}
        {activeZikr ? (
          <>
          <View
            style={[
              styles.dhikrChip,
              { backgroundColor: c.surface, borderColor: c.line, shadowColor: c.shadow },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.dhikrLabel, { color: c.muted, fontFamily: fonts.ui }]}>
                {t("ACTIVE_DHIKR")}
              </Text>
              <Text
                numberOfLines={2}
                style={[styles.dhikrName, { color: c.ink, fontFamily: fonts.ui }]}
              >
                {activeZikr}
              </Text>
            </View>
          </View>

          <View style={styles.bodyContainer}>
            <ZikirCounter onButtonClick={handleButtonClick} />
          </View>
          </>
        ) : (
          <View
            style={[
              styles.startCardWrap,
            ]}
          >
          <View
            style={[
              styles.startCard,
              { backgroundColor: c.surface, borderColor: c.line, shadowColor: c.shadow },
            ]}
          >
            <Text style={[styles.startTitle, { color: c.ink, fontFamily: fonts.display }]}>
              {t("ZIKR_NAME_PROMPT")}
            </Text>
            <Text style={[styles.startHint, { color: c.muted, fontFamily: fonts.ui }]}>
              {t("ZIKR_PICK_HINT")}
            </Text>


            <View style={styles.startRow}>
              <TextInput
                value={draftName}
                onChangeText={setDraftName}
                placeholder={t("ZIKR_NAME_PLACEHOLDER")}
                placeholderTextColor={c.muted}
                returnKeyType="done"
                onSubmitEditing={() => startZikr()}
                style={[
                  styles.startInput,
                  { color: c.ink, fontFamily: fonts.ui, backgroundColor: c.card, borderColor: c.line },
                ]}
              />
              <Pressable
                accessibilityRole="button"
                disabled={!draftName.trim()}
                onPress={() => startZikr()}
                style={({ pressed }) => [
                  styles.startBtn,
                  {
                    backgroundColor: c.gold,
                    opacity: !draftName.trim() ? 0.4 : pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={{ fontFamily: fonts.ui, fontSize: 16, fontWeight: "700", color: c.onAcc }}>
                  {t("START")}
                </Text>
              </Pressable>
            </View>
          </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomContainer}>
        <AdBanner />
      </View>

      {Object.keys(clickCounts).map((buttonKey) => (
        <InterstitialAd
          key={buttonKey}
          clickCount={clickCounts[buttonKey]}
          onAdClosed={() => resetClickCount(buttonKey)}
          adCouner={thresholds[buttonKey]}
        />
      ))}
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  scroll: {
    flexGrow: 1,
    paddingTop: 6,
    paddingBottom: 12,
  },
  header: {
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    letterSpacing: 0.4,
  },
  themeBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  dhikrChip: {
    marginTop: 18,
    marginHorizontal: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  dhikrLabel: {
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  dhikrName: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 2,
  },
  startCardWrap: { flexGrow: 1, justifyContent: "center", paddingBottom: 40 },
  startCard: {
    marginTop: 18,
    marginHorizontal: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 16,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  startTitle: { fontSize: 20, fontWeight: "700" },
  startHint: { fontSize: 16, marginTop: 3 },
  startRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 18 },
  startInput: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 17,
  },
  startBtn: {
    height: 56,
    paddingHorizontal: 22,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  bodyContainer: {
    flexGrow: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 22,
    paddingBottom: 20,
  },
  bottomContainer: {
    width: "100%",
    minHeight: 60,
    justifyContent: "center",
    alignItems: "center",
  },
});
