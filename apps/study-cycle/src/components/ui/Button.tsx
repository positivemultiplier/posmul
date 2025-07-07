/**
 * Study-Cycle Button 컴포넌트
 * 
 * React Native 환경에 최적화된 터치 가능한 버튼 컴포넌트
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Theme } from '../../styles/theme';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  testID,
}) => {
  const isDisabled = disabled || loading;

  const buttonStyle = [
    styles.base,
    styles[`size_${size}`],
    styles[`variant_${variant}`],
    isDisabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    isDisabled && styles.textDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={Theme.opacity.pressed}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' || variant === 'ghost' ? Theme.colors.primary : Theme.colors.white}
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  
  // Size variants
  size_sm: {
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    minHeight: 32,
  },
  size_md: {
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    minHeight: 44,
  },
  size_lg: {
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.xl,
    minHeight: 52,
  },
  
  // Variant styles
  variant_primary: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
    ...Theme.shadow.sm,
  },
  variant_secondary: {
    backgroundColor: Theme.colors.secondary,
    borderColor: Theme.colors.secondary,
    ...Theme.shadow.sm,
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderColor: Theme.colors.primary,
    borderWidth: 1,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  variant_danger: {
    backgroundColor: Theme.colors.error,
    borderColor: Theme.colors.error,
    ...Theme.shadow.sm,
  },
  
  // Text styles
  text: {
    ...Theme.typography.button,
    textAlign: 'center',
  },
  text_primary: {
    color: Theme.colors.textOnPrimary,
  },
  text_secondary: {
    color: Theme.colors.textOnSecondary,
  },
  text_outline: {
    color: Theme.colors.primary,
  },
  text_ghost: {
    color: Theme.colors.primary,
  },
  text_danger: {
    color: Theme.colors.textOnPrimary,
  },
  
  // Text size variants
  textSize_sm: {
    fontSize: 14,
    lineHeight: 18,
  },
  textSize_md: {
    fontSize: 16,
    lineHeight: 20,
  },
  textSize_lg: {
    fontSize: 18,
    lineHeight: 22,
  },
  
  // Disabled states
  disabled: {
    opacity: Theme.opacity.disabled,
  },
  textDisabled: {
    opacity: Theme.opacity.disabled,
  },
});

export default Button;
