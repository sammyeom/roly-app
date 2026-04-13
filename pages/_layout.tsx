import React, { type PropsWithChildren } from 'react';
import { View } from 'react-native';
import { colors } from '@toss/tds-react-native';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      {children}
    </View>
  );
}
