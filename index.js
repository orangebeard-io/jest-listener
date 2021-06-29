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

const testItemStatuses = { PASSED: 'passed', FAILED: 'failed', SKIPPED: 'pending' };
const logLevels = {
  ERROR: 'error',
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
};

const promiseErrorHandler = (promise) => {
  promise.catch((err) => {
    // istanbul ignore next
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
        this._startStep(result, false, _test.path);
        this._finishStep(result, false);
        return;
      }

      for (let i = 0; i < result.invocations; i += 1) {
        const isRetried = result.invocations !== 1;

        this._startStep(result, isRetried, _test.path);
        this._finishStep(result, isRetried);
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
  onRunComplete() {
    const { promise } = this.client.finishLaunch(this.tempLaunchId);

    promiseErrorHandler(promise);
  }

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
  }

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
  }

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
  }

  _finishStep(test, isRetried) {
    const errorMsg = test.failureMessages[0];

    switch (test.status) {
      case testItemStatuses.PASSED:
        this._finishPassedStep(isRetried);
        break;
      case testItemStatuses.FAILED:
        this._finishFailedStep(errorMsg, isRetried);
        break;
      default:
        this._finishSkippedStep(isRetried);
    }
  }

  _finishPassedStep(isRetried) {
    const status = testItemStatuses.PASSED;
    const finishTestObj = { status, retry: isRetried };
    const { promise } = this.client.finishTestItem(this.tempStepId, finishTestObj);

    promiseErrorHandler(promise);
  }

  _finishFailedStep(failureMessage, isRetried) {
    const status = testItemStatuses.FAILED;
    const finishTestObj = { status, retry: isRetried };

    // Remove ANSI caracters from the logs. This is caused by the Jest colors in the output.
    const formattedFailureMessage = failureMessage.replace(
      /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
      '',
    );

    this._sendLog(formattedFailureMessage);

    const { promise } = this.client.finishTestItem(this.tempStepId, finishTestObj);

    promiseErrorHandler(promise);
  }

  _sendLog(message) {
    const logObject = {
      message,
      level: logLevels.ERROR,
    };
    const { promise } = this.client.sendLog(this.tempStepId, logObject);

    promiseErrorHandler(promise);
  }

  _finishSkippedStep(isRetried) {
    const status = 'skipped';
    const issue = this.reportOptions.skippedIssue === false ? { issueType: 'NOT_ISSUE' } : null;
    const finishTestObj = Object.assign(
      {
        status,
        retry: isRetried,
      },
      issue && { issue },
    );
    const { promise } = this.client.finishTestItem(this.tempStepId, finishTestObj);

    promiseErrorHandler(promise);
  }

  _finishTest(tempTestId, key) {
    if (!tempTestId) return;

    const { promise } = this.client.finishTestItem(tempTestId, {});

    this.tempTestIds.delete(key);
    promiseErrorHandler(promise);
  }

  _finishSuite(tempSuiteId, key) {
    if (!tempSuiteId) return;

    const { promise } = this.client.finishTestItem(tempSuiteId, {});

    this.tempSuiteIds.delete(key);
    promiseErrorHandler(promise);
  }
}

module.exports = OrangebeardJestListener;
