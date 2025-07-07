/**
 * Study-Cycle Card 컴포넌트
 * 
 * React Native 환경에 최적화된 카드 컨테이너 컴포넌트
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Theme } from '../../styles/theme';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  margin?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  margin = 'none',
  shadow = true,
  style,
  testID,
}) => {
  const cardStyle = [
    styles.base,
    styles[`variant_${variant}`],
    styles[`padding_${padding}`],
    styles[`margin_${margin}`],
    shadow && variant !== 'flat' && Theme.shadow.md,
    style,
  ];

  return (
    <View style={cardStyle} testID={testID}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.surface,
  },
  
  // Variant styles
  variant_default: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 0,
  },
  variant_elevated: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 0,
    // Shadow is added conditionally via props
  },
  variant_outlined: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  variant_flat: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  
  // Padding variants
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: Theme.spacing.sm,
  },
  padding_md: {
    padding: Theme.spacing.lg,
  },
  padding_lg: {
    padding: Theme.spacing.xl,
  },
  
  // Margin variants
  margin_none: {
    margin: 0,
  },
  margin_sm: {
    margin: Theme.spacing.sm,
  },
  margin_md: {
    margin: Theme.spacing.md,
  },
  margin_lg: {
    margin: Theme.spacing.lg,
  },
});

export default Card;
