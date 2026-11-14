import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { setSelectedCity as setSelectedCityAction } from '../../redux/CounterSlice';
import { TURKISH_CITIES, findNearestCity } from '../../data/cities';
import { backChevron } from '../../utils/rtl';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExploreTheme } from '../../utils/Theme/ExploreTheme';
import { useTranslation } from 'react-i18next';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import * as Location from 'expo-location';

const CitySelection = ({ navigation }) => {
  const { t } = useTranslation();
  const { c, fonts } = useExploreTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const [filteredCities, setFilteredCities] = useState(TURKISH_CITIES);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState(null);

  useEffect(() => {
    setFilteredCities(TURKISH_CITIES);
    setLoading(false);
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const defaultCity = { id: 34, name: 'İstanbul', code: 'istanbul' };
        dispatch(setSelectedCityAction(defaultCity));
        Alert.alert(t('LOCATION_PERMISSION_DENIED'), t('LOCATION_PERMISSION_DENIED_MESSAGE'), [{ text: t('OK') }]);
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = location.coords;
      const nearestCity = findNearestCity(latitude, longitude);
      if (nearestCity) {
        dispatch(setSelectedCityAction(nearestCity));
        setSelectedCity(nearestCity);
        Alert.alert(t('LOCATION_DETECTED'), `${t('LOCATION_DETECTED_MESSAGE')} ${nearestCity.name}`, [{ text: t('OK') }]);
      } else {
        const defaultCity = { id: 34, name: 'İstanbul', code: 'istanbul' };
        dispatch(setSelectedCityAction(defaultCity));
        Alert.alert(t('LOCATION_ERROR'), t('LOCATION_ERROR_MESSAGE'), [{ text: t('OK') }]);
      }
    } catch (error) {
      const defaultCity = { id: 34, name: 'İstanbul', code: 'istanbul' };
      dispatch(setSelectedCityAction(defaultCity));
      Alert.alert(t('LOCATION_ERROR'), t('LOCATION_ERROR_MESSAGE'), [{ text: t('OK') }]);
    }
  };

  const handleSearch = (text) => {
    setSearchText(text);
    if (text.trim() === '') {
      setFilteredCities(TURKISH_CITIES);
    } else {
      setFilteredCities(TURKISH_CITIES.filter((city) => city.name.toLowerCase().includes(text.toLowerCase())));
    }
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    dispatch(setSelectedCityAction(city));
    Alert.alert(t('CITY_SELECTED'), `${city.name} ${t('CITY_SELECTED_MESSAGE')}`, [
      { text: t('OK'), onPress: () => navigation.goBack() },
    ]);
  };

  const renderCity = ({ item }) => {
    const on = selectedCity?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.cityItem, { backgroundColor: on ? c.goldSoft : c.card, borderColor: on ? c.gold : c.line }]}
        onPress={() => handleCitySelect(item)}
      >
        <Text style={[styles.cityName, { color: on ? c.goldInk : c.ink, fontFamily: fonts.ui, fontWeight: on ? '700' : '500' }]}>
          {item.name}
        </Text>
        {on && <MaterialIcons name="check" size={22} color={c.gold} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={c.gold} />
          <Text style={[styles.loadingText, { color: c.inkSoft, fontFamily: fonts.ui }]}>{t('CITIES_LOADING')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: c.surface, borderColor: c.line }]}
          onPress={() => navigation.goBack()}
        >
          <Feather name={backChevron()} size={20} color={c.ink} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.ink, fontFamily: fonts.display }]}>{t('CITY_SELECTION')}</Text>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: c.surface, borderColor: c.line }]}>
        <Feather name="search" size={18} color={c.muted} />
        <TextInput
          style={[styles.searchInput, { color: c.ink, fontFamily: fonts.ui }]}
          placeholder={t('CITY_SEARCH_PLACEHOLDER')}
          placeholderTextColor={c.muted}
          value={searchText}
          onChangeText={handleSearch}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Feather name="x" size={18} color={c.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Use my location */}
      <TouchableOpacity style={[styles.locBtn, { backgroundColor: c.goldSoft }]} onPress={getCurrentLocation}>
        <Feather name="navigation" size={16} color={c.goldInk} />
        <Text style={[styles.locBtnText, { color: c.goldInk, fontFamily: fonts.ui }]}>{t('USE_MY_LOCATION')}</Text>
      </TouchableOpacity>

      <FlatList
        data={filteredCities}
        renderItem={renderCity}
        keyExtractor={(item) => item.id.toString()}
        style={styles.citiesList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.citiesListContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  loadingText: { fontSize: 16, marginTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingBottom: 12 },
  backButton: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginTop: 6,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 16, padding: 0 },
  locBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 12, paddingVertical: 12, borderRadius: 14,
  },
  locBtnText: { fontSize: 16, fontWeight: '700' },
  citiesList: { flex: 1, marginTop: 12 },
  citiesListContent: { paddingHorizontal: 20, paddingBottom: 20 },
  cityItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 18, marginBottom: 8, borderRadius: 14, borderWidth: 1,
  },
  cityName: { fontSize: 15 },
});

export default CitySelection;
