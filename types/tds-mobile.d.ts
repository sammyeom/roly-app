import type { FC, ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle, TextProps as RNTextProps } from 'react-native';

export type TDSTypography =
  | 'heading1'
  | 'heading2'
  | 'body1'
  | 'body2'
  | 'caption1'
  | 'caption2';

export interface NavigationBarProps {
  title?: string;
  onBack?: () => void;
}
export declare const NavigationBar: FC<NavigationBarProps>;

export interface TDSTextProps extends Omit<RNTextProps, 'style'> {
  typography?: TDSTypography;
  style?: StyleProp<TextStyle>;
  children?: ReactNode;
}
export declare const Text: FC<TDSTextProps>;

export declare const Divider: FC<{ style?: StyleProp<ViewStyle> }>;

export declare const color: {
  white: string;
  black: string;
  gray50: string;
  gray100: string;
  gray200: string;
  gray300: string;
  gray400: string;
  gray500: string;
  gray600: string;
  gray700: string;
  gray800: string;
  gray900: string;
  blue50: string;
  blue500: string;
  blue600: string;
  green50: string;
  green500: string;
  orange50: string;
  orange400: string;
  red50: string;
  red500: string;
};
