module.exports = {
  import: 'tsx/esm',
  timeout: '10000000',
  ui: 'bdd',
  exit: true,
  spec: [
    'apps/**/*.spec.[jt]s',
    'generators/**/*.spec.[jt]s',
    'libs/**/*.spec.[jt]s',
    'tools/**/*.spec.[jt]s',
  ],
};
