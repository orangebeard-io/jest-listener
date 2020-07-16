/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');
const process = require('process');
const { options, getAppOptions, getEnvOptions } = require('../utils/getOptions');
const constants = require('../constants/index');

describe('Get Options script', () => {
  const OLD_ENV = process.env;
  const processCwdValue = process.cwd();

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env = OLD_ENV;
  });

  describe('getEnvOptions', () => {
    test("should return empty envOptions object if environments don't set", () => {
      const envOptionsObject = getEnvOptions();

      expect(envOptionsObject).toBeDefined();
      expect(envOptionsObject).toEqual({});
    });

    test('should return envOptions object with correct values', () => {
      const expectedEnvOptionsObject = {
        suiteName: 'suite name',
        output: 'output',
        classNameTemplate: 'class name',
        titleTemplate: 'title',
      };
      process.env = {
        JEST_SUITE_NAME: 'suite name',
        JEST_JUNIT_OUTPUT: 'output',
        JEST_JUNIT_CLASSNAME: 'class name',
        JEST_JUNIT_TITLE: 'title',
      };

      const envOptionsObject = getEnvOptions();

      expect(envOptionsObject).toBeDefined();
      expect(envOptionsObject).toEqual(expectedEnvOptionsObject);
    });
  });

  describe('getAppOptions', () => {
    test('should return empty AppOptions object if fs.existsSync return false', () => {
      const pathToResolve = `${path.sep}path${path.sep}to${path.sep}directory`;
      jest.mock('fs');
      fs.existsSync = jest.fn();
      fs.existsSync.mockReturnValue(false);

      const appOptionsObject = getAppOptions(pathToResolve);

      expect(appOptionsObject).toBeDefined();
      expect(appOptionsObject).toEqual({});
    });

    test('should return empty AppOptions object if fs.existsSync return true and type of options is not [object Object]', () => {
      const spyProcessCwd = jest.spyOn(process, 'cwd');
      spyProcessCwd.mockReturnValue(
        `${processCwdValue}${path.sep}__tests__${path.sep}fixtures${path.sep}mockedPackageJsonString`,
      );
      jest.mock('fs');
      fs.existsSync = jest.fn();
      fs.existsSync.mockReturnValue(true);

      const appOptionsObject = getAppOptions(process.cwd());

      expect(appOptionsObject).toBeDefined();
      expect(appOptionsObject).toEqual({});

      spyProcessCwd.mockClear();
    });

    test('should return AppOptions object if fs.existsSync return true and type of options is [object Object]', () => {
      const spyProcessCwd = jest.spyOn(process, 'cwd');
      spyProcessCwd.mockReturnValue(
        `${processCwdValue}${path.sep}__tests__${path.sep}fixtures${path.sep}mockedPackageJsonObject`,
      );
      jest.mock('fs');
      fs.existsSync = jest.fn();
      fs.existsSync.mockReturnValue(true);

      const appOptionsObject = getAppOptions(process.cwd());

      expect(appOptionsObject).toBeDefined();
      expect(appOptionsObject).toEqual({ keyOne: 'valueOne' });
    });
  });

  describe('options', () => {
    test('should return options object with empty reporterOptions object', () => {
      const expectedOptions = { ...constants.DEFAULT_OPTIONS };
      const spyProcessCwd = jest.spyOn(process, 'cwd');
      spyProcessCwd.mockReturnValue(processCwdValue);

      const optionsObject = options();

      expect(optionsObject).toBeDefined();
      expect(optionsObject).toEqual(expectedOptions);
    });
  });
});
