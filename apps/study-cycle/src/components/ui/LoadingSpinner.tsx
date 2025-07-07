/**
 * Study-Cycle LoadingSpinner 컴포넌트
 * 
 * React Native 환경에 최적화된 로딩 스피너 컴포넌트
 */

import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Theme } from '../../styles/theme';

export interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  overlay?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = Theme.colors.primary,
  message,
  overlay = false,
  style,
  testID,
}) => {
  const containerStyle = [
    styles.container,
    overlay && styles.overlay,
    style,
  ];

  return (
    <View style={containerStyle} testID={testID}>
      <View style={styles.content}>
        <ActivityIndicator
          size={size}
          color={color}
          style={styles.spinner}
        />
        {message && (
          <Text style={styles.message}>{message}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `rgba(255, 255, 255, ${Theme.opacity.overlay})`,
    zIndex: 1000,
  },
  
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  spinner: {
    marginBottom: Theme.spacing.sm,
  },
  
  message: {
    ...Theme.typography.body2,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: Theme.spacing.sm,
  },
});

export default LoadingSpinner;
