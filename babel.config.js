module.exports = {
  presets: ['module:metro-react-native-babel-preset', '@babel/preset-typescript'],
  plugins: [
    ['nativewind/babel', { mode: 'transformOnly' }],
    'react-native-reanimated/plugin',
  ],
};
