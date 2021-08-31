/*
 *  Copyright 2020 EPAM Systems
 *  Modifications copyright (C) 2020 Orangemile B.V. Netherlands
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

const OrangebeardClient = require('@orangebeard-io/javascript-client');
const getOptions = require('./utils/getOptions');
const {
  getClientInitObject,
  getSuiteStartObject,
  getStartLaunchObject,
  getTestStartObject,
  getStepStartObject,
  getAgentInfo,
  getCodeRef,
  getFullTestName,
  getFullStepName,
} = require('./utils/objectUtils');

const testItemStatuses = { PASSED: 'passed', FAILED: 'failed', SKIPPED: 'skipped' };
const logLevels = {
  ERROR: 'error',
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
};

const promiseErrorHandler = (promise) => {
  promise.catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
  });
};

class OrangebeardJestListener {
  /**
   * Constructor for the reporter
   *
   * @param {Object} _globalConfig - Jest configuration object
   * @param {Object} _options - Options object defined in jest config
   */
  constructor(globalConfig, options) {
    const agentInfo = getAgentInfo();
    this.reportOptions = getClientInitObject(getOptions.options(options));
    this.client = new OrangebeardClient(this.reportOptions, agentInfo);
    this.tempSuiteIds = new Map();
    this.tempTestIds = new Map();
    this.tempStepId = null;
    this.promises = [];
  }

  /**
   * Hook to process the test run before running the tests, the only real data
   * available at this time is the number of test suites about to be executed
   *
   * @param _results - Results for the test run, but only `numTotalTestSuites` is of use
   * @param _options - Run configuration
   */
  // eslint-disable-next-line no-unused-vars
  onRunStart() {
    const startLaunchObj = getStartLaunchObject(this.reportOptions);
    const { tempId, promise } = this.client.startLaunch(startLaunchObj);

    this.tempLaunchId = tempId;
    promiseErrorHandler(promise);
    this.promises.push(promise);
  }

  /**
   * Hook to process the test run before starting the test suite
   * This will be called many times during the test run
   *
   * @param _test - The test this run
   */
  // eslint-disable-next-line no-unused-vars
  onTestStart() {}

  /**
   * Hook to process the test run results after a test suite has been executed
   * This will be called many times during the test run
   *
   * @param _test - The test last run
   * @param _testResults - Results for the test suite just executed
   * @param _aggregatedResult - Results for the test run at the point in time of the test suite being executed
   */
  // eslint-disable-next-line no-unused-vars
  onTestResult(_test, _testResult) {
    _testResult.testResults.forEach((result) => {
      this._startSuite(result.ancestorTitles[0], _test.path);
      if (result.ancestorTitles.length !== 1) {
        this._startTest(result, _test.path);
      }

      if (!result.invocations) {
        if (this.reportOptions.listenerMode === 'FAST') {
          this._startAndFinishStep(result, false, _test.path);
        } else {
          this._startStep(result, false, _test.path);
          this._finishStep(result, false);
        }
        return;
      }

      for (let i = 0; i < result.invocations; i += 1) {
        const isRetried = result.invocations !== 1;

        if (this.reportOptions.listenerMode === 'FAST') {
          this._startAndFinishStep(result, isRetried, _test.path);
        } else {
          this._startStep(result, isRetried, _test.path);
          this._finishStep(result, isRetried);
        }
      }
    });

    this.tempTestIds.forEach((tempTestId, key) => {
      this._finishTest(tempTestId, key);
    });
    this.tempSuiteIds.forEach((tempSuiteId, key) => {
      this._finishSuite(tempSuiteId, key);
    });
  }

  /**
   * Hook to process the test run results after all the test suites have been
   * executed
   *
   * @param {string} _contexts - The Contexts of the test run
   * @param {JestTestRunResult} _results - Results from the test run
   */
  // eslint-disable-next-line no-unused-vars
  async onRunComplete() {
    await Promise.all(this.promises);
    const { promise } = this.client.finishLaunch(this.tempLaunchId);

    promiseErrorHandler(promise);
    await promise;
  }

  /**
   * Start a new suite
   *
   * @param {string} suiteName - The name of the suite
   * @param {string} path - Location of the suite
   */
  _startSuite(suiteName, path) {
    if (this.tempSuiteIds.get(suiteName)) {
      return;
    }
    const codeRef = getCodeRef(path, suiteName);
    const { tempId, promise } = this.client.startTestItem(
      getSuiteStartObject(suiteName, codeRef),
      this.tempLaunchId,
    );

    this.tempSuiteIds.set(suiteName, tempId);
    promiseErrorHandler(promise);
    this.promises.push(promise);
  }

  /**
   * Start a new test
   *
   * @param {Object} test - Jest test object
   * @param {string} testPath - Location of the test
   */
  _startTest(test, testPath) {
    if (this.tempTestIds.get(test.ancestorTitles.join('/'))) {
      return;
    }

    const tempSuiteId = this.tempSuiteIds.get(test.ancestorTitles[0]);
    const fullTestName = getFullTestName(test);
    const codeRef = getCodeRef(testPath, fullTestName);
    const testStartObj = getTestStartObject(
      test.ancestorTitles[test.ancestorTitles.length - 1],
      codeRef,
    );
    const parentId =
      this.tempTestIds.get(test.ancestorTitles.slice(0, -1).join('/')) || tempSuiteId;
    const { tempId, promise } = this.client.startTestItem(
      testStartObj,
      this.tempLaunchId,
      parentId,
    );

    this.tempTestIds.set(fullTestName, tempId);
    promiseErrorHandler(promise);
    this.promises.push(promise);
  }

  /**
   * Start a new step
   *
   * @param {Object} test - Jest test object
   * @param {boolean} isRetried - Is a retry or not
   * @param {string} testPath - Location of the step
   */
  _startStep(test, isRetried, testPath) {
    const tempSuiteId = this.tempSuiteIds.get(test.ancestorTitles[0]);
    const fullStepName = getFullStepName(test);
    const codeRef = getCodeRef(testPath, fullStepName);
    const stepStartObj = getStepStartObject(test.title, isRetried, codeRef);
    const parentId = this.tempTestIds.get(test.ancestorTitles.join('/')) || tempSuiteId;
    const { tempId, promise } = this.client.startTestItem(
      stepStartObj,
      this.tempLaunchId,
      parentId,
    );

    this.tempStepId = tempId;
    promiseErrorHandler(promise);
    this.promises.push(promise);
  }

  /**
   * Finish a step
   *
   * @param {Object} test - Jest test object
   * @param {boolean} isRetried - Is a retry or not
   */
  _finishStep(test, isRetried) {
    const errorMsg = test.failureMessages[0];
    let finishTestObj;

    switch (test.status) {
      case testItemStatuses.PASSED:
        finishTestObj = this._finishPassedStep(isRetried);
        break;
      case testItemStatuses.FAILED:
        finishTestObj = this._finishFailedStep(errorMsg, isRetried);
        break;
      default:
        finishTestObj = this._finishSkippedStep(isRetried);
    }

    this._sendFinishTestObj(this.tempStepId, finishTestObj);
  }

  /**
   * Create a finish passed step object
   *
   * @param {boolean} isRetried - Is a retry or not
   * @returns {Object}
   */
  _finishPassedStep(isRetried) {
    const status = testItemStatuses.PASSED;
    return { status, retry: isRetried };
  }

  /**
   * Create a finish failed step object
   *
   * @param {string} failureMessage - The jest debug message output
   * @param {boolean} isRetried - Is a retry or not
   * @param {boolean} [sendLog = true] - Should send a log
   * @returns {Object}
   */
  _finishFailedStep(failureMessage, isRetried, sendLog = true) {
    const status = testItemStatuses.FAILED;

    if (sendLog) {
      // Remove ANSI caracters from the logs. This is caused by the Jest colors in the output.
      const formattedFailureMessage = failureMessage.replace(
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
        '',
      );
      this._sendLog(formattedFailureMessage);
    }

    return { status, retry: isRetried };
  }

  /**
   * Create a finish skipped step object
   *
   * @param {boolean} isRetried - Is a retry or not
   * @returns {Object}
   */
  _finishSkippedStep(isRetried) {
    const status = testItemStatuses.SKIPPED;
    const issue = this.reportOptions.skippedIssue === false ? { issueType: 'NOT_ISSUE' } : null;
    return Object.assign(
      {
        status,
        retry: isRetried,
      },
      issue && { issue },
    );
  }

  /**
   * Start and finish a step with only 1 call
   *
   * @param {Object} test - Jest test object
   * @param {boolean} isRetried - Is a retry or not
   * @param {string} testPath - Location of the step
   */
  _startAndFinishStep(test, isRetried, testPath) {
    const tempSuiteId = this.tempSuiteIds.get(test.ancestorTitles[0]);
    const fullStepName = getFullStepName(test);
    const codeRef = getCodeRef(testPath, fullStepName);
    const stepStartObj = getStepStartObject(test.title, isRetried, codeRef);
    const parentId = this.tempTestIds.get(test.ancestorTitles.join('/')) || tempSuiteId;
    let finishTestObj;

    switch (test.status) {
      case testItemStatuses.PASSED:
        finishTestObj = this._finishPassedStep(isRetried);
        break;
      case testItemStatuses.FAILED:
        finishTestObj = this._finishFailedStep(test.failureMessages[0], isRetried, false);
        break;
      default:
        finishTestObj = this._finishSkippedStep(isRetried);
    }

    const { promise } = this.client.startAndFinishTestItem(
      stepStartObj,
      this.tempLaunchId,
      parentId,
      finishTestObj,
    );
    promiseErrorHandler(promise);
    this.promises.push(promise);
  }

  /**
   * Send the finish test object to the client
   *
   * @param {string} tempStepId - The id to identify the step
   * @param {Object} finishTestObj - The data that will be send to the client
   */
  _sendFinishTestObj(tempStepId, finishTestObj) {
    const { promise } = this.client.finishTestItem(tempStepId, finishTestObj);

    promiseErrorHandler(promise);
    this.promises.push(promise);
  }

  /**
   * Send a log message to the client
   *
   * @param {string} message - The log message
   */
  _sendLog(message) {
    const logObject = {
      message,
      level: logLevels.ERROR,
    };
    const { promise } = this.client.sendLog(this.tempStepId, logObject);

    promiseErrorHandler(promise);
    this.promises.push(promise);
  }

  /**
   * Finish a test
   *
   * @param {string} tempTestId - The id to identify the test
   * @param {string} key - The temp test id
   */
  _finishTest(tempTestId, key) {
    if (!tempTestId) return;

    const { promise } = this.client.finishTestItem(tempTestId, {});

    this.tempTestIds.delete(key);
    promiseErrorHandler(promise);
    this.promises.push(promise);
  }

  /**
   * Finish a suite
   *
   * @param {string} tempSuiteId - The id to identify the suite
   * @param {string} key - The temp suite id
   */
  _finishSuite(tempSuiteId, key) {
    if (!tempSuiteId) return;

    const { promise } = this.client.finishTestItem(tempSuiteId, {});

    this.tempSuiteIds.delete(key);
    promiseErrorHandler(promise);
    this.promises.push(promise);
  }
}

module.exports = OrangebeardJestListener;
