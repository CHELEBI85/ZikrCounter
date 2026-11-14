import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExploreTheme } from '../../utils/Theme/ExploreTheme';

const CustomHeader = ({ title, subtitle, right }) => {
  const { c, fonts } = useExploreTheme();
  // The status bar is translucent, so the header has to clear it itself —
  // without this the title sits underneath the clock.
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.headerTitle, { color: c.ink, fontFamily: fonts.display }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.headerSubtitle, { color: c.muted, fontFamily: fonts.ui }]}>{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '400',
  },
});

export default CustomHeader;
