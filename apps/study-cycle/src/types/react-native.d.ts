/// <reference types="react-native" />

import React from 'react';

declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> { }
    interface ElementClass extends React.Component<any> {
      render(): React.ReactNode
    }
    interface ElementAttributesProperty { props: {} }
    interface ElementChildrenAttribute { children: {} }
    interface IntrinsicAttributes extends React.Attributes { }
    interface IntrinsicClassAttributes<T> extends React.ClassAttributes<T> { }
  }
}

// React Native와 호환되는 React 타입 재정의
declare module 'react' {
  namespace React {
    type ReactNode = ReactChild | ReactFragment | ReactPortal | boolean | null | undefined;
  }
  
  interface Component<P = {}, S = {}, SS = any> {
    render(): ReactNode;
  }
}

// React Native 컴포넌트 타입 확장
declare module 'react-native' {
  import { ComponentType } from 'react';
  
  export interface ViewProps {
    style?: any;
    testID?: string;
    children?: React.ReactNode;
  }
  
  export interface TextProps {
    style?: any;
    children?: React.ReactNode;
    onPress?: () => void;
  }
  
  export interface TextInputProps {
    style?: any;
    placeholder?: string;
    placeholderTextColor?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    editable?: boolean;
    secureTextEntry?: boolean;
  }
  
  export const View: ComponentType<ViewProps>;
  export const Text: ComponentType<TextProps>;
  export const TextInput: ComponentType<TextInputProps>;
  export const ActivityIndicator: ComponentType<any>;
  export const TouchableOpacity: ComponentType<any>;
}
