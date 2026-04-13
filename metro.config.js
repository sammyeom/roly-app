const { getDefaultConfig } = require('@granite-js/mpack');

const config = getDefaultConfig(__dirname);

config.watcher = {
  watchman: {
    deferStates: ['hg.update'],
  },
};

config.resolver.blockList = [
  /node_modules\/.*\/node_modules\/.*/,
];

module.exports = config;
