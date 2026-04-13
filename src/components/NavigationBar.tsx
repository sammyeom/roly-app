import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { colors } from '@toss/tds-react-native';

interface NavigationBarProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44;
const NAV_BAR_HEIGHT = 56;

export default function NavigationBar({ title, onBack, rightElement }: NavigationBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        <View style={styles.left}>
          {onBack != null && (
            <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={styles.hitSlop}>
              <Text style={styles.backIcon}>{'‹'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.right}>
          {rightElement}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingTop: STATUS_BAR_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey100,
  },
  bar: {
    height: NAV_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  left: {
    width: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  right: {
    width: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: colors.grey900,
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    fontSize: 28,
    color: colors.grey900,
    lineHeight: 32,
    fontWeight: '300',
  },
  hitSlop: {
    top: 8,
    bottom: 8,
    left: 8,
    right: 8,
  },
});
