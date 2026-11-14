import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Alert, DevSettings } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { setFontSize, setNotificationPermission } from '../../redux/CounterSlice';
import { setExploreTheme, setContentLanguage } from '../../redux/ContentPrefsSlice';
import PrayerNotificationService from '../../services/PrayerNotificationService';
import { useTranslation } from 'react-i18next';
import { setAppLanguage, SUPPORTED_UI_LANGUAGES } from '../../i18n/i18n';
import { forwardChevron } from '../../utils/rtl';
import { useNavigation } from '@react-navigation/native';
import Feather from '@expo/vector-icons/Feather';
import { useExploreTheme } from '../../utils/Theme/ExploreTheme';
import { Toggle } from '../../components/explore/ExploreUI';
import AdBanner from '../../components/AdBanner/AdBanner';
import InterstitialAd from '../../components/InterstitialAd/InterstitialAd';
import CustomHeader from '../../components/CustomHeader/CustomHeader';

const SettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const { c, fonts, mode } = useExploreTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { fontSize, selectedCity, notificationPermission } = useSelector((state) => state.counter);
  const contentLanguage = useSelector((state) => state.contentPrefs?.contentLanguage) || 'tr';

  const [clickCounts, setClickCounts] = useState({ button1: 0, button2: 0, button3: 0, button4: 0 });
  const thresholds = { button1: 10, button2: 15, button3: 25, button4: 100 };
  const resetClickCount = (buttonKey) => setClickCounts((prev) => ({ ...prev, [buttonKey]: 0 }));

  const handleEmailPress = () => {
    const email = 'mobiflextech@gmail.com';
    const subject = t('SUPPORT_REQUEST');
    const body = t('SUPPORT_MESSAGE');
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(mailtoUrl)
      .then((supported) => { if (!supported) alert(t('MAIL_ERROR')); })
      .catch((error) => console.log('Error:', error));
  };

  const buttonSizes = [64, 68, 72, 76];
  const fontSizeLabels = { 64: t('FONT_SIZE_64'), 68: t('FONT_SIZE_68'), 72: t('FONT_SIZE_72'), 76: t('FONT_SIZE_76') };
  // Native language names stay untranslated on purpose: someone stuck in a
  // language they cannot read still has to recognise their own.
  const LANGUAGE_NAMES = { tr: 'Türkçe', en: 'English', ar: 'العربية' };

  // Switching to or from Arabic flips the whole layout, and React Native only
  // picks that up on a fresh start — so say so instead of leaving a half-mirrored UI.
  const handleAppLanguageChange = async (lng) => {
    const directionChanged = await setAppLanguage(lng);
    if (!directionChanged) return;
    Alert.alert(
      t('RESTART_REQUIRED_TITLE'),
      t('RESTART_REQUIRED_BODY'),
      __DEV__
        ? [{ text: t('RESTART_NOW'), onPress: () => DevSettings.reload() }, { text: t('CANCEL') }]
        : [{ text: t('YES') }]
    );
  };

  const handleNotificationToggle = async () => {
    if (notificationPermission) {
      await PrayerNotificationService.cancelAllNotifications();
      dispatch(setNotificationPermission(false));
    } else {
      const hasPermission = await PrayerNotificationService.requestPermissions();
      dispatch(setNotificationPermission(hasPermission));
    }
  };

  const LanguagePicker = ({ label, value, onChange }) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={[styles.pickerLabel, { color: c.inkSoft, fontFamily: fonts.ui }]}>{label}</Text>
      <View style={[styles.segmented, { backgroundColor: c.surface, borderColor: c.line }]}>
        {SUPPORTED_UI_LANGUAGES.map((lng) => {
          const on = value === lng;
          return (
            <Pressable
              key={lng}
              onPress={() => onChange(lng)}
              style={[styles.segBtn, { backgroundColor: on ? c.gold : 'transparent' }]}
            >
              <Text
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 16,
                  fontWeight: '600',
                  color: on ? c.onAcc : c.inkSoft,
                }}
              >
                {LANGUAGE_NAMES[lng]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const SectionTitle = ({ children }) => (
    <Text style={[styles.sectionTitle, { color: c.muted, fontFamily: fonts.ui }]}>{children}</Text>
  );

  const Row = ({ icon, iconColor, label, value, onPress, right }) => (
    <Pressable
      style={[styles.row, { borderBottomColor: c.line }]}
      onPress={onPress}
      android_ripple={{ color: c.goldSoft }}
    >
      {icon ? (
        <View style={[styles.rowIcon, { backgroundColor: c.goldSoft }]}>
          <Feather name={icon} size={18} color={iconColor || c.gold} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: c.ink, fontFamily: fonts.ui }]}>{label}</Text>
        {value ? <Text style={[styles.rowValue, { color: c.muted, fontFamily: fonts.ui }]}>{value}</Text> : null}
      </View>
      {right || <Feather name={forwardChevron()} size={18} color={c.muted} />}
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <CustomHeader title={t('SETTINGS')} subtitle={t('MANAGE_APP_PREFERENCES')} />

        {/* Dil */}
        <View style={styles.section}>
          <SectionTitle>{t('LANGUAGE')}</SectionTitle>
          <LanguagePicker
            label={t('LANGUAGE_SUBTITLE')}
            value={i18n.language}
            onChange={handleAppLanguageChange}
          />
          <LanguagePicker
            label={t('CONTENT_LANGUAGE_SUBTITLE')}
            value={contentLanguage}
            onChange={(lng) => dispatch(setContentLanguage(lng))}
          />
        </View>

        {/* Görünüm (theme) */}
        <View style={styles.section}>
          <SectionTitle>{t('THEME')}</SectionTitle>
          <View style={[styles.segmented, { backgroundColor: c.surface, borderColor: c.line }]}>
            {[
              { v: 'light', label: t('THEME_LIGHT'), icon: 'sun' },
              { v: 'dark', label: t('THEME_DARK'), icon: 'moon' },
            ].map((opt) => {
              const on = mode === opt.v;
              return (
                <Pressable
                  key={opt.v}
                  onPress={() => dispatch(setExploreTheme(opt.v))}
                  style={[styles.segBtn, { backgroundColor: on ? c.gold : 'transparent' }]}
                >
                  <Feather name={opt.icon} size={16} color={on ? c.onAcc : c.inkSoft} />
                  <Text style={{ fontFamily: fonts.ui, fontSize: 16, fontWeight: '600', color: on ? c.onAcc : c.inkSoft }}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Font size */}
        <View style={styles.section}>
          <SectionTitle>{t('FONTSİZE')}</SectionTitle>
          <View style={styles.fontContainer}>
            {buttonSizes.map((size) => {
              const isSelected = fontSize === size;
              return (
                <Pressable
                  key={size}
                  style={[styles.fontButton, { backgroundColor: isSelected ? c.gold : c.surface, borderColor: isSelected ? c.gold : c.line }]}
                  onPress={() => dispatch(setFontSize(size))}
                >
                  {/* the digit itself, in the counter's LCD face, so the
                      choice is legible without knowing what "68" means */}
                  <Text style={{ fontFamily: fonts.mono, fontSize: size * 0.42, lineHeight: size * 0.46, color: isSelected ? c.onAcc : c.inkSoft }}>88</Text>
                  <Text style={{ fontFamily: fonts.ui, fontSize: 12, fontWeight: '600', color: isSelected ? c.onAcc : c.muted, opacity: 0.85 }}>
                    {fontSizeLabels[size]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <SectionTitle>{t('PREFERENCES')}</SectionTitle>
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]}>
            <Row
              icon={notificationPermission ? 'bell' : 'bell-off'}
              label={t('PRAYER_NOTIFICATIONS')}
              value={notificationPermission ? t('ENABLED') : t('DISABLED')}
              right={<Toggle value={notificationPermission} onValueChange={handleNotificationToggle} />}
            />
            <Row
              icon="map-pin"
              label={t('PRAYER_TIMES_CITY')}
              value={selectedCity?.name || 'İstanbul'}
              onPress={() => navigation.navigate('MainStack', { screen: 'CitySelection' })}
            />
            <Row
              icon="book-open"
              label={t('SOURCES')}
              value={t('SOURCES_SUBTITLE')}
              onPress={() => navigation.navigate('MainStack', { screen: 'Sources' })}
            />
          </View>
        </View>

        {/* More */}
        <View style={styles.section}>
          <SectionTitle>{t('OTHER')}</SectionTitle>
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]}>
            <Row icon="star" iconColor="#F5B301" label={t('RATE_US')} onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.zikirmatik.app.mobiflex')} />
            <Row icon="mail" label={t('SUPPORT')} onPress={handleEmailPress} />
            <Row icon="shield" label={t('PRIVACY_POLICY')} onPress={() => navigation.navigate('MainStack', { screen: 'PrivacyPolicy' })} />
            <Row icon="file-text" label={t('TERMS_OF_SERVICE')} onPress={() => navigation.navigate('MainStack', { screen: 'TermsOfService' })} />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.appInfo}>
          <Text style={{ fontFamily: fonts.display, fontSize: 20, fontWeight: '700', color: c.ink }}>{t('APP_NAME')}</Text>
          <Text style={{ fontFamily: fonts.ui, fontSize: 15, color: c.muted, marginTop: 4 }}>{t('APP_VERSION', { version: '2.0.0' })}</Text>
          <Text style={{ fontFamily: fonts.ui, fontSize: 13, color: c.muted, marginTop: 8, textAlign: 'center', paddingHorizontal: 24 }}>
            {t('CONTENT_ATTRIBUTION_SHORT')}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.adContainer}>
        <AdBanner />
      </View>

      {Object.keys(clickCounts).map((buttonKey) => (
        <InterstitialAd key={buttonKey} clickCount={clickCounts[buttonKey]} onAdClosed={() => resetClickCount(buttonKey)} adCouner={thresholds[buttonKey]} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  adContainer: { width: '100%', minHeight: 60, justifyContent: 'center', alignItems: 'center' },
  section: { paddingHorizontal: 20, paddingVertical: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1, marginHorizontal: 4 },
  segmented: { flexDirection: 'row', gap: 8, borderRadius: 16, borderWidth: 1, padding: 6 },
  pickerLabel: { fontSize: 15, fontWeight: '500', marginBottom: 8, marginHorizontal: 4 },
  segBtn: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12 },
  fontContainer: { flexDirection: 'row', gap: 10 },
  fontButton: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, gap: 4 },
  card: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1 },
  rowIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowValue: { fontSize: 15, marginTop: 2 },
  appInfo: { alignItems: 'center', paddingVertical: 28 },
});

export default SettingsScreen;
