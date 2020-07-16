/* eslint-disable no-process-env */
const path = require('path');
const fs = require('fs');
const constants = require('../constants/index');

const getEnvOptions = () => {
  const options = {};

  Object.keys(constants.ENVIRONMENT_CONFIG_MAP).forEach((name) => {
    if (process.env[name]) {
      options[constants.ENVIRONMENT_CONFIG_MAP[name]] = process.env[name];
    }
  });

  return options;
};

const getAppOptions = (pathToResolve) => {
  let traversing = true;

  // Find nearest package.json by traversing up directories until /
  while (traversing) {
    traversing = pathToResolve !== path.sep;

    const pkgpath = path.join(pathToResolve, 'package.json');

    if (fs.existsSync(pkgpath)) {
      // eslint-disable-next-line global-require,import/no-dynamic-require
      let options = (require(pkgpath) || {})['jest-junit'];

      if (Object.prototype.toString.call(options) !== '[object Object]') {
        options = {};
      }

      return options;
    }
    // eslint-disable-next-line no-param-reassign
    pathToResolve = path.dirname(pathToResolve);
  }

  return {};
};

module.exports = {
  options: (reporterOptions = {}) =>
    Object.assign(
      constants.DEFAULT_OPTIONS,
      reporterOptions,
      getAppOptions(process.cwd()),
      getEnvOptions(),
    ),
  getAppOptions,
  getEnvOptions,
};
