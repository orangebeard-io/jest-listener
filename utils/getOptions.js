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

  // Find nearest orangebeard.json by traversing up directories until /
  while (traversing) {
    traversing = pathToResolve !== path.sep;

    const pkgpath = path.join(pathToResolve, 'orangebeard.json');

    if (fs.existsSync(pkgpath)) {
      try {
        // eslint-disable-next-line global-require,import/no-dynamic-require
        let options = require(pkgpath);

        if (typeof options !== 'object') {
          options = {};
        }

        return options;
      } catch (error) {
        return {};
      }
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
