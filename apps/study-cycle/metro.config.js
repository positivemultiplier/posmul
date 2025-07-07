const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration for PosMul StudyCycle React Native App
 * 독립 앱 최적화 설정
 * 
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    alias: {
      '@': './src',
    },
    // React Native 최적화
    sourceExts: ['js', 'json', 'ts', 'tsx', 'jsx'],
    assetExts: ['png', 'jpg', 'jpeg', 'gif', 'svg'],
  },
  transformer: {
    // TypeScript 지원 강화
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  watchFolders: [
    // src 폴더만 감시 (성능 최적화)
    path.resolve(__dirname, 'src'),
  ],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
