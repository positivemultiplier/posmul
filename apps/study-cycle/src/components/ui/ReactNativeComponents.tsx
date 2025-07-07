/**
 * React Native Components with proper typing
 */

import React from 'react';

// 스타일 타입 정의 - any를 피하고 unknown 사용
type StyleProp = unknown;

interface ViewProps {
  style?: StyleProp;
  testID?: string;
  children?: React.ReactNode;
}

interface TextProps {
  style?: StyleProp;
  children?: React.ReactNode;
  onPress?: () => void;
}

interface TextInputProps {
  style?: StyleProp;
  placeholder?: string;
  placeholderTextColor?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  editable?: boolean;
  secureTextEntry?: boolean;
}

interface TouchableOpacityProps {
  style?: StyleProp;
  children?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}

interface ActivityIndicatorProps {
  size?: 'small' | 'large' | number;
  color?: string;
}

// React Native 컴포넌트들
export const RNView = React.forwardRef<unknown, ViewProps>((props, ref) => {
  return React.createElement('View', { ...props, ref });
});

export const RNText = React.forwardRef<unknown, TextProps>((props, ref) => {
  return React.createElement('Text', { ...props, ref });
});

export const RNTextInput = React.forwardRef<unknown, TextInputProps>((props, ref) => {
  return React.createElement('TextInput', { ...props, ref });
});

export const RNTouchableOpacity = React.forwardRef<unknown, TouchableOpacityProps>((props, ref) => {
  return React.createElement('TouchableOpacity', { ...props, ref });
});

export const RNActivityIndicator = React.forwardRef<unknown, ActivityIndicatorProps>((props, ref) => {
  return React.createElement('ActivityIndicator', { ...props, ref });
});

// Input 컴포넌트
export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  containerStyle?: StyleProp;
  testID?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  required = false,
  disabled = false,
  variant = 'outlined',
  size = 'md',
  containerStyle,
  testID,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const getContainerStyle = (): StyleProp => {
    const baseStyle: Record<string, unknown> = {
      marginVertical: 8,
    };
    
    if (containerStyle) {
      return [baseStyle, containerStyle];
    }
    
    return baseStyle;
  };

  const getInputContainerStyle = (): StyleProp => {
    const baseStyle: Record<string, unknown> = {
      borderRadius: 8,
      borderWidth: 1,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 12,
    };

    // Size styles
    if (size === 'sm') {
      baseStyle.minHeight = 36;
    } else if (size === 'lg') {
      baseStyle.minHeight = 52;
    } else {
      baseStyle.minHeight = 44;
    }

    // Variant styles
    if (variant === 'filled') {
      baseStyle.backgroundColor = '#F3F4F6';
    }

    // State styles
    if (error) {
      baseStyle.borderColor = '#EF4444';
    } else if (isFocused) {
      baseStyle.borderColor = '#3B82F6';
      baseStyle.borderWidth = 2;
    } else {
      baseStyle.borderColor = '#D1D5DB';
    }

    if (disabled) {
      baseStyle.opacity = 0.6;
      baseStyle.backgroundColor = '#F3F4F6';
    }

    return baseStyle;
  };

  const getInputStyle = (): StyleProp => {
    const baseStyle: Record<string, unknown> = {
      color: '#111827',
      padding: 0,
      flex: 1,
    };

    // Size styles
    if (size === 'sm') {
      baseStyle.fontSize = 14;
    } else if (size === 'lg') {
      baseStyle.fontSize = 18;
    } else {
      baseStyle.fontSize = 16;
    }

    if (disabled) {
      baseStyle.color = '#9CA3AF';
    }

    return baseStyle;
  };

  return (
    <RNView style={getContainerStyle()} testID={testID}>
      {label && (
        <RNText style={{
          fontSize: 14,
          color: '#374151',
          marginBottom: 4,
        }}>
          {label}
          {required && (
            <RNText style={{ color: '#EF4444' }}>*</RNText>
          )}
        </RNText>
      )}
      
      <RNView style={getInputContainerStyle()}>
        <RNTextInput
          style={getInputStyle()}
          placeholderTextColor="#9CA3AF"
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...textInputProps}
        />
      </RNView>
      
      {error && (
        <RNText style={{
          fontSize: 12,
          color: '#EF4444',
          marginTop: 4,
        }}>
          {error}
        </RNText>
      )}
    </RNView>
  );
};
