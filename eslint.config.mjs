import next from 'eslint-config-next';

export default [
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    ...next,
  },
];
