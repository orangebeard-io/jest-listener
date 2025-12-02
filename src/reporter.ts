import { UUID } from 'crypto';
import { AggregatedResult, Config, Reporter, Test, TestResult } from '@jest/reporters';
import OrangebeardAsyncV3Client from '@orangebeard-io/javascript-client/dist/client/OrangebeardAsyncV3Client';
import { getTime, getZonedDateTime, removeAnsi } from './util';
import { StartSuite } from '@orangebeard-io/javascript-client/dist/client/models/StartSuite';
import { StartTest } from '@orangebeard-io/javascript-client/dist/client/models/StartTest';
import { FinishTest } from '@orangebeard-io/javascript-client/dist/client/models/FinishTest';
import { Log } from '@orangebeard-io/javascript-client/dist/client/models/Log';
import TestType = StartTest.TestType;
import Status = FinishTest.Status;
import LogLevel = Log.LogLevel;
import LogFormat = Log.LogFormat;

export default class OrangebeardReporter implements Reporter {
  private _error?: Error;
  protected _globalConfig: Config.GlobalConfig;
  protected _options?: any;

  private _client: OrangebeardAsyncV3Client;
  private _suites: Map<string, UUID> = new Map();
  private readonly _testRunUUID: UUID;

  constructor(globalConfig: Config.GlobalConfig, options?: any) {
    this._globalConfig = globalConfig;
    this._options = options;
    this._client = new OrangebeardAsyncV3Client();

    this._testRunUUID = this._client.startTestRun({
      testSetName: this._client.config.testset,
      description: this._client.config.description,
      startTime: getTime(),
      attributes: this._client.config.attributes,
    });
  }

  onRunStart(): void {
    //intentionally empty
  }

  onTestStart(test?: Test): void {
    const suiteNames = this.getSuiteNameArray(test);

    const suiteUUIDS = this._client.startSuite(<StartSuite>{
      testRunUUID: this._testRunUUID,
      suiteNames: suiteNames,
    });

    if (suiteUUIDS && suiteNames) {
      this._suites.set(suiteNames.join('/'), suiteUUIDS[suiteUUIDS.length - 1]);
    }

  }

  onTestResult(
    test: Test,
    testResult: TestResult,
    aggregatedResults: AggregatedResult,
  ): void {

    testResult.testResults.forEach(result => {
      const suiteNames = this.getSuiteNameArray(test)!;
      let suiteUUID = this._suites.get(suiteNames.join('/'));

      if (result.ancestorTitles.length > 0) {

        suiteNames.push(...result.ancestorTitles);
        if (this._suites.get(suiteNames.join('/'))) {
          suiteUUID = this._suites.get(suiteNames.join('/'));
        } else {
          const suiteUUIDs = this._client.startSuite(<StartSuite>{
            testRunUUID: this._testRunUUID,
            suiteNames: suiteNames,
          });

          this._suites.set(suiteNames.join('/'), suiteUUIDs[suiteUUIDs.length - 1]);
          suiteUUID = suiteUUIDs[suiteUUIDs.length - 1];
        }
      }

      if (!suiteUUID) {
        console.error(`Suite UUID not found for suite: ${suiteNames}`);
        return;
      }

      const startTime = getZonedDateTime();
      const endTime = startTime.plusNanos(result.duration! * 1_000_000);

      const startTestUUID = this._client.startTest(<StartTest>{
        testRunUUID: this._testRunUUID,
        suiteUUID: suiteUUID,
        testName: result.title,
        startTime: startTime.toString(),
        testType: TestType.TEST,
      });

      if (result.status === 'passed') {
        this._client.finishTest(startTestUUID, <FinishTest>{
          testRunUUID: this._testRunUUID,
          status: Status.PASSED,
          endTime: endTime.toString(),
        });

      } else if (result.status === 'failed') {
        result.failureMessages.forEach(failureMessage => {
          this._client.log(<Log>{
            testRunUUID: this._testRunUUID,
            testUUID: startTestUUID,
            logLevel: LogLevel.ERROR,
            logFormat: LogFormat.PLAIN_TEXT,
            message: removeAnsi(failureMessage),
            logTime: getTime(),
          });
        });

        this._client.finishTest(startTestUUID, <FinishTest>{
          testRunUUID: this._testRunUUID,
          status: Status.FAILED,
          endTime: endTime.toString(),
        });
      } else if (result.status === 'pending') {
        this._client.finishTest(startTestUUID, <FinishTest>{
          testRunUUID: this._testRunUUID,
          status: Status.SKIPPED,
          endTime: endTime.toString(),
        });
      }
    });
  }

  onRunComplete(): Promise<void> | void {
    return this._client.finishTestRun(this._testRunUUID, { endTime: getTime() });
  }

  getLastError(): Error | undefined {
    return this._error;
  }

  protected _setError(error: Error): void {
    this._error = error;
  }

  private getSuiteNameArray(test?: Test) {
    const path = test?.path;
    const cwd = test?.context.config.cwd;
    const filename = path?.substring(cwd!.length + 1);
    return filename?.split('\\');
  }
}
