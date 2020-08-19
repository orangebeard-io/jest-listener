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

/* eslint-disable no-process-env */
const path = require('path');
const pjson = require('../package.json');

const PJSON_VERSION = pjson.version;
const PJSON_NAME = pjson.name;
const entityType = { SUITE: 'SUITE', TEST: 'STEP' };

const getSystemAttributes = (skippedIssue) => {
  const systemAttr = [
    {
      key: 'agent',
      value: `${PJSON_NAME}|${PJSON_VERSION}`,
      system: true,
    },
  ];

  if (skippedIssue === false) {
    const skippedIssueAttribute = {
      key: 'skippedIssue',
      value: 'false',
      system: true,
    };

    systemAttr.push(skippedIssueAttribute);
  }

  return systemAttr;
};

const getStartLaunchObject = (options = {}) => {
  const systemAttr = getSystemAttributes(options.skippedIssue);

  return {
    launch: process.env.ORANGEBEARD_TESTSET || options.launch || 'Unit Tests',
    description: process.env.ORANGEBEARD_DESCRIPTION || options.description,
    attributes: options.attributes ? options.attributes.concat(systemAttr) : systemAttr,
    rerun: options.rerun,
    rerunOf: options.rerunOf,
    mode: options.mode,
    skippedIssue: options.skippedIssue,
    startTime: new Date().valueOf(),
  };
};

const getTestStartObject = (testTitle, isRetried, codeRef) => ({
  type: entityType.TEST,
  name: testTitle,
  codeRef,
  retry: isRetried,
});

const getSuiteStartObject = (suiteName, codeRef) => ({
  type: entityType.SUITE,
  name: suiteName,
  codeRef,
  startTime: new Date().valueOf(),
});

const getClientInitObject = (options = {}) => {
  const envAttributes =
    process.env.ORANGEBEARD_ATTRIBUTES === undefined || !process.env.ORANGEBEARD_ATTRIBUTES
      ? undefined
      : process.env.ORANGEBEARD_ATTRIBUTES.split(',').map((item) => {
          const itemArr = item.split(':');

          return {
            key: itemArr.length === 1 ? null : itemArr[0],
            value: itemArr.length === 1 ? itemArr[0] : itemArr[1],
          };
        });

  let endpoint;
  if (process.env.ORANGEBEARD_ENDPOINT || options.endpoint) {
    endpoint = `${process.env.ORANGEBEARD_ENDPOINT || options.endpoint}/api/v1`;
  }

  return {
    token: process.env.ORANGEBEARD_ACCESSTOKEN || options.accessToken,
    endpoint,
    launch: process.env.ORANGEBEARD_TESTSET || options.testset || 'Unit Tests',
    project: process.env.ORANGEBEARD_PROJECT || options.project,
    rerun: options.rerun,
    rerunOf: options.rerunOf,
    skippedIssue: options.skippedIssue,
    description: process.env.ORANGEBEARD_DESCRIPTION || options.description,
    attributes: envAttributes || options.attributes,
    mode: options.mode,
    debug: options.debug,
  };
};

const getAgentInfo = () => ({
  version: PJSON_VERSION,
  name: PJSON_NAME,
});

const getCodeRef = (testPath, title) => {
  const testFileDir = path
    .parse(path.normalize(path.relative(process.cwd(), testPath)))
    .dir.replace(new RegExp('\\'.concat(path.sep), 'g'), '/');
  const separator = testFileDir ? '/' : '';
  const testFile = path.parse(testPath);

  return `${testFileDir}${separator}${testFile.base}/${title}`;
};

const getFullTestName = (test) =>
  test.ancestorTitles && test.ancestorTitles.length
    ? `${test.ancestorTitles.join('/')}/${test.title}`
    : `Suite/${test.title}`;

module.exports = {
  getClientInitObject,
  getStartLaunchObject,
  getSuiteStartObject,
  getTestStartObject,
  getAgentInfo,
  getCodeRef,
  getFullTestName,
  getSystemAttributes,
};
