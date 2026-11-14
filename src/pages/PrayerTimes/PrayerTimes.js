import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useExploreTheme, NUMERIC } from '../../utils/Theme/ExploreTheme';
import { fetchPrayerTimes } from '../../redux/CounterSlice';
import PrayerNotificationService from '../../services/PrayerNotificationService';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Feather from '@expo/vector-icons/Feather';
import { forwardChevron } from '../../utils/rtl';
import Svg, { Circle, Defs, Pattern, Path, Rect } from 'react-native-svg';
import { crescentPath } from '../../components/Crescent/Crescent';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import moment from 'moment';
import 'moment-timezone';
import AdBanner from '../../components/AdBanner/AdBanner';
import InterstitialAd from '../../components/InterstitialAd/InterstitialAd';
import CustomHeader from '../../components/CustomHeader/CustomHeader';

const RING = 104;
const RING_STROKE = 8;
const RING_R = (RING - RING_STROKE) / 2;
const RING_C = 2 * Math.PI * RING_R;

/** Share of the current interval already elapsed, drawn clockwise from 12. */
const ProgressRing = ({ progress, tint, children }) => (
  <View style={styles.ringWrap}>
    <Svg width={RING} height={RING} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle
        cx={RING / 2}
        cy={RING / 2}
        r={RING_R}
        stroke={tint}
        strokeOpacity={0.25}
        strokeWidth={RING_STROKE}
        fill="none"
      />
      <Circle
        cx={RING / 2}
        cy={RING / 2}
        r={RING_R}
        stroke={tint}
        strokeWidth={RING_STROKE}
        strokeLinecap="round"
        strokeDasharray={RING_C}
        strokeDashoffset={RING_C * (1 - Math.min(1, Math.max(0, progress)))}
        fill="none"
      />
    </Svg>
    <View style={styles.ringCenter}>{children}</View>
  </View>
);

/** Faint crescent watermark tiled across the hero card. */
const CrescentMotif = ({ tint }) => (
  <Svg style={StyleSheet.absoluteFill}>
    <Defs>
      <Pattern id="heroCrescents" width="56" height="56" patternUnits="userSpaceOnUse">
        <Path
          d={crescentPath(28, 28, 11)}
          fill="none"
          stroke={tint}
          strokeOpacity={0.12}
          strokeWidth={1.2}
          transform="rotate(-20 28 28)"
        />
      </Pattern>
    </Defs>
    <Rect width="100%" height="100%" fill="url(#heroCrescents)" />
  </Svg>
);

const PrayerTimes = () => {
  const { t, i18n } = useTranslation();
  const { c, fonts } = useExploreTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { selectedCity, prayerTimes, prayerTimesLoading, prayerTimesError, notificationPermission } = useSelector((state) => state.counter);

  const [refreshing, setRefreshing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState({});
  const [nextPrayer, setNextPrayer] = useState(null);
  // 0-1 through the interval between the previous prayer and the next one
  const [intervalProgress, setIntervalProgress] = useState(0);

  const [clickCounts, setClickCounts] = useState({ button1: 0, button2: 0, button3: 0, button4: 0 });
  const thresholds = { button1: 10, button2: 15, button3: 25, button4: 100 };

  const handleButtonClick = (buttonKey) => {
    setClickCounts((prev) => ({ ...prev, [buttonKey]: prev[buttonKey] + 1 }));
  };
  const resetClickCount = (buttonKey) => {
    setClickCounts((prev) => ({ ...prev, [buttonKey]: 0 }));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const cityName = selectedCity?.name || 'Istanbul';
    await dispatch(fetchPrayerTimes(cityName));
    setRefreshing(false);
  };

  useEffect(() => {
    if (selectedCity) {
      const cityName = selectedCity.name || 'Istanbul';
      const updatePrayerTimes = async () => {
        const result = await dispatch(fetchPrayerTimes(cityName));
        if (notificationPermission && result.payload) {
          await PrayerNotificationService.schedulePrayerNotifications(result.payload, selectedCity.name);
        }
      };
      updatePrayerTimes();
    }
  }, [selectedCity, dispatch, notificationPermission]);

  useEffect(() => {
    if (!prayerTimes) return;

    const updateCountdown = () => {
      const now = moment().tz('Europe/Istanbul');
      const today = now.format('YYYY-MM-DD');

      const prayers = [
        { key: 'Fajr', time: prayerTimes.timings.Fajr },
        { key: 'Sunrise', time: prayerTimes.timings.Sunrise },
        { key: 'Dhuhr', time: prayerTimes.timings.Dhuhr },
        { key: 'Asr', time: prayerTimes.timings.Asr },
        { key: 'Maghrib', time: prayerTimes.timings.Maghrib },
        { key: 'Isha', time: prayerTimes.timings.Isha },
      ];

      let foundNext = null;
      let minDiff = moment.duration(Infinity);
      const remaining = {};

      for (let i = 0; i < prayers.length; i++) {
        const prayer = prayers[i];
        const prayerTime = moment.tz(`${today} ${prayer.time}`, 'Europe/Istanbul');
        const diff = moment.duration(prayerTime.diff(now));

        if (diff.asMilliseconds() > 0) {
          remaining[prayer.key] = {
            hours: Math.floor(diff.asHours()),
            minutes: diff.minutes(),
            seconds: diff.seconds(),
            total: diff.asMilliseconds(),
          };
          if (diff.asMilliseconds() < minDiff.asMilliseconds()) {
            minDiff = diff;
            foundNext = prayer;
          }
        } else {
          remaining[prayer.key] = null;
        }
      }

      if (!foundNext) {
        const tomorrow = now.clone().add(1, 'day').format('YYYY-MM-DD');
        const fajrTomorrow = moment.tz(`${tomorrow} ${prayerTimes.timings.Fajr}`, 'Europe/Istanbul');
        const diff = moment.duration(fajrTomorrow.diff(now));
        if (diff.asMilliseconds() > 0) {
          remaining['Fajr'] = {
            hours: Math.floor(diff.asHours()),
            minutes: diff.minutes(),
            seconds: diff.seconds(),
            total: diff.asMilliseconds(),
          };
          foundNext = { key: 'Fajr', time: prayerTimes.timings.Fajr };
        }
      }

      setTimeRemaining(remaining);
      setNextPrayer(foundNext);

      // How far through the current interval we are, for the hero card's ring.
      // The previous prayer is the one before `foundNext`; before the day's
      // first prayer that means yesterday's Isha (whose time we approximate
      // with today's — they differ by about a minute).
      if (foundNext) {
        const at = (dateStr, time) => moment.tz(`${dateStr} ${time}`, 'Europe/Istanbul');
        const idx = prayers.findIndex((p) => p.key === foundNext.key);
        const nextIsTomorrow = !remaining[foundNext.key] || now.isAfter(at(today, foundNext.time));

        const from = nextIsTomorrow
          ? at(today, prayerTimes.timings.Isha)
          : idx <= 0
          ? at(now.clone().subtract(1, 'day').format('YYYY-MM-DD'), prayerTimes.timings.Isha)
          : at(today, prayers[idx - 1].time);
        const to = nextIsTomorrow
          ? at(now.clone().add(1, 'day').format('YYYY-MM-DD'), foundNext.time)
          : at(today, foundNext.time);

        const span = to.diff(from);
        setIntervalProgress(span > 0 ? Math.min(1, Math.max(0, now.diff(from) / span)) : 0);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [prayerTimes]);

  const onRefresh = () => handleRefresh();
  const formatTime = (time) => time || '--:--';

  const formatCountdown = (remaining) => {
    if (!remaining) return null;
    const { hours, minutes, seconds } = remaining;
    if (hours > 0) return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    if (minutes > 0) return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    if (seconds > 0) return `00:${String(seconds).padStart(2, '0')}`;
    return null;
  };

  /** Full label: a clock plus "remaining", or just "passed" — never both. */
  const countdownLabel = (remaining) => {
    const clock = formatCountdown(remaining);
    return clock ? `${clock} ${t('REMAINING')}` : t('PASSED');
  };

  const getPrayerName = (prayerKey) => {
    const names = { Fajr: t('FAJR'), Sunrise: t('SUNRISE'), Dhuhr: t('DHUHR'), Asr: t('ASR'), Sunset: t('SUNSET'), Maghrib: t('MAGHRIB'), Isha: t('ISHA') };
    return names[prayerKey] || prayerKey;
  };

  const getPrayerIcon = (prayerKey) => {
    const icons = { Fajr: 'wb-twilight', Sunrise: 'wb-sunny', Dhuhr: 'wb-sunny', Asr: 'wb-sunny', Maghrib: 'wb-sunny', Isha: 'nights-stay' };
    return icons[prayerKey] || 'schedule';
  };

  if (prayerTimesLoading) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={c.gold} />
          <Text style={[styles.stateText, { color: c.inkSoft, fontFamily: fonts.ui }]}>{t('PRAYER_TIMES_LOADING')}</Text>
        </View>
      </View>
    );
  }

  if (prayerTimesError) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={styles.centerBox}>
          <MaterialIcons name="error-outline" size={48} color={c.muted} />
          <Text style={[styles.stateText, { color: c.inkSoft, fontFamily: fonts.ui }]}>{t('PRAYER_TIMES_ERROR')}</Text>
          <Text style={[styles.retryText, { color: c.gold, fontFamily: fonts.ui }]} onPress={onRefresh}>{t('RETRY')}</Text>
        </View>
      </View>
    );
  }

  // The API hands back an English "12 Sep 2026" and a bare "01-04-1448";
  // render both in the reader's own language instead.
  const apiDate = prayerTimes?.date;
  const gregorian = apiDate?.gregorian?.date
    ? moment(apiDate.gregorian.date, 'DD-MM-YYYY').format('D MMMM YYYY')
    : apiDate?.readable || '';
  const hijriMonth =
    i18n.language === 'ar' ? apiDate?.hijri?.month?.ar : apiDate?.hijri?.month?.en;
  const hijri =
    apiDate?.hijri?.day && hijriMonth
      ? `${Number(apiDate.hijri.day)} ${hijriMonth} ${apiDate.hijri.year}`
      : apiDate?.hijri?.date || '';
  const headerDate = [gregorian, hijri].filter(Boolean).join(' · ');

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.gold} />}
      >
        <CustomHeader title={t('PRAYER_TIMES')} subtitle={headerDate} />

        {/* Next prayer hero */}
        {nextPrayer && (
          <View style={[styles.heroShadow, { shadowColor: c.gold }]}>
          <View style={[styles.hero, { backgroundColor: c.gold }]}>
            <CrescentMotif tint={c.onAcc} />

            <View style={styles.heroTopRow}>
              <Text style={[styles.heroLabel, { color: c.onAcc, fontFamily: fonts.ui }]}>
                {t('NEXT_PRAYER')}
              </Text>
              <View style={[styles.cityPill, { borderColor: c.onAcc }]}>
                <Feather name="map-pin" size={11} color={c.onAcc} />
                <Text style={[styles.cityPillText, { color: c.onAcc, fontFamily: fonts.ui }]}>
                  {selectedCity?.name || ''}
                </Text>
              </View>
            </View>

            <View style={styles.heroBody}>
              <View style={styles.heroInfo}>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[styles.heroName, { color: c.onAcc, fontFamily: fonts.display }]}
                >
                  {getPrayerName(nextPrayer.key)}
                </Text>
                <Text style={[styles.heroTime, { color: c.onAcc, fontFamily: fonts.numeric, ...NUMERIC }]}>
                  {formatTime(nextPrayer.time)}
                </Text>
                <View style={[styles.countdownPill, { backgroundColor: `${c.onAcc}2E` }]}>
                  <Feather name="clock" size={13} color={c.onAcc} />
                  <Text style={[styles.heroCountdownText, { color: c.onAcc, fontFamily: fonts.numeric, ...NUMERIC }]}>
                    {countdownLabel(timeRemaining[nextPrayer.key])}
                  </Text>
                </View>
              </View>

              <ProgressRing progress={intervalProgress} tint={c.onAcc}>
                <MaterialIcons name={getPrayerIcon(nextPrayer.key)} size={34} color={c.onAcc} />
              </ProgressRing>
            </View>
          </View>
          </View>
        )}

        {/* Kıble */}
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('MainStack', { screen: 'Qibla' })}
          style={({ pressed }) => [
            styles.qiblaRow,
            { backgroundColor: c.surface, borderColor: c.line, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <View style={[styles.qiblaIcon, { backgroundColor: c.goldSoft }]}>
            <Feather name="compass" size={20} color={c.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.qiblaTitle, { color: c.ink, fontFamily: fonts.ui }]}>{t('QIBLA')}</Text>
            <Text style={[styles.qiblaSubtitle, { color: c.muted, fontFamily: fonts.ui }]}>{t('QIBLA_SUBTITLE')}</Text>
          </View>
          <Feather name={forwardChevron()} size={18} color={c.muted} />
        </Pressable>

        {/* Prayer list */}
        <View style={[styles.prayerList, { backgroundColor: c.surface, borderColor: c.line }]}>
          {prayerTimes?.timings && Object.entries(prayerTimes.timings).map(([key, time], idx, arr) => {
            if (['Imsak', 'Midnight', 'Firstthird', 'Lastthird'].includes(key)) return null;
            const isNext = nextPrayer?.key === key;
            return (
              <View
                key={key}
                style={[
                  styles.prayerItem,
                  { borderBottomColor: c.line },
                  isNext && { backgroundColor: c.goldSoft },
                ]}
              >
                <View style={styles.prayerItemLeft}>
                  <MaterialIcons name={getPrayerIcon(key)} size={22} color={isNext ? c.gold : c.muted} />
                  <View style={styles.prayerItemInfo}>
                    <Text style={[styles.prayerItemName, { color: c.ink, fontFamily: fonts.ui }, isNext && { fontWeight: '700' }]}>
                      {getPrayerName(key)}
                    </Text>
                    <Text style={[styles.countdownText, { color: c.muted, fontFamily: fonts.numeric, ...NUMERIC }, isNext && { color: c.goldInk }]}>
                      {countdownLabel(timeRemaining[key])}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.prayerItemTime, { color: c.ink, fontFamily: fonts.numeric, ...NUMERIC }, isNext && { color: c.goldInk }]}>
                  {formatTime(time)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Location */}
        <View style={[styles.locationCard, { backgroundColor: c.card, borderColor: c.line }]}>
          <MaterialIcons name="location-on" size={18} color={c.gold} />
          <Text style={[styles.locationText, { color: c.inkSoft, fontFamily: fonts.ui }]}>
            {selectedCity?.name || 'İstanbul'}, {t('TURKEY')}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.adContainer}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  adContainer: { width: '100%', minHeight: 60, justifyContent: 'center', alignItems: 'center' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  stateText: { fontSize: 16, marginTop: 16, textAlign: 'center' },
  retryText: { fontSize: 15, marginTop: 10, fontWeight: '700' },
  qiblaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  qiblaIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  qiblaTitle: { fontSize: 15, fontWeight: '600' },
  qiblaSubtitle: { fontSize: 14, marginTop: 2 },
  heroShadow: {
    marginHorizontal: 20,
    marginTop: 4,
    borderRadius: 24,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  hero: {
    padding: 22,
    borderRadius: 24,
    overflow: 'hidden',
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  heroLabel: { fontSize: 14, fontWeight: '700', letterSpacing: 1, opacity: 0.9, textTransform: 'uppercase' },
  cityPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999, borderWidth: 1, opacity: 0.85,
  },
  cityPillText: { fontSize: 13, fontWeight: '600' },
  heroBody: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 14 },
  heroInfo: { flex: 1, minWidth: 0 },
  heroName: { fontSize: 32, fontWeight: '700' },
  heroTime: { fontSize: 22, fontWeight: '700', marginTop: 2, opacity: 0.9 },
  countdownPill: {
    flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start',
    marginTop: 12, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999,
  },
  heroCountdownText: { fontSize: 16, fontWeight: '700' },
  ringWrap: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  prayerList: { marginHorizontal: 20, marginTop: 16, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  prayerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  prayerItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  prayerItemInfo: { marginLeft: 12, flex: 1 },
  prayerItemName: { fontSize: 16, fontWeight: '500' },
  countdownText: { fontSize: 15, marginTop: 2 },
  prayerItemTime: { fontSize: 17, fontWeight: '600' },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 20,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  locationText: { fontSize: 16 },
});

export default PrayerTimes;
