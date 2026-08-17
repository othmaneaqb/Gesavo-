const path = require("path");

module.exports = function override(config) {
  config.resolve.alias = {
    ...config.resolve.alias,
    "@": path.resolve(__dirname, "src"),
  };

  return config;
};

module.exports.jest = function overrideJest(config) {
  config.moduleNameMapper = {
    ...config.moduleNameMapper,
    "^react-router/dom$": "<rootDir>/node_modules/react-router/dist/development/dom-export.js",
    "^@/(.*)$": "<rootDir>/src/$1",
  };
  return config;
};
