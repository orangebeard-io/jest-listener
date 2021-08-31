<h1 align="center">
  <a href="https://github.com/orangebeard-io/jest-listener">
    <img src="https://raw.githubusercontent.com/orangebeard-io/jest-listener/master/.github/logo.svg" alt="Orangebeard.io Jest Listener" height="200">
  </a>
  <br>Orangebeard.io Jest Listener<br>
</h1>

<h4 align="center">Orangebeard listener for the Javascript <a href="https://jestjs.io/" target="_blank" rel="noopener">Jest</a> unit test framework.</h4>

<p align="center">
  <a href="https://www.npmjs.com/package/@orangebeard-io/jest-listener">
    <img src="https://img.shields.io/npm/v/@orangebeard-io/jest-listener.svg?style=flat-square"
      alt="NPM Version" />
  </a>
  <a href="https://github.com/orangebeard-io/jest-listener/actions">
    <img src="https://img.shields.io/github/workflow/status/orangebeard-io/jest-listener/release?style=flat-square"
      alt="Build Status" />
  </a>
  <a href="https://github.com/orangebeard-io/jest-listener/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/orangebeard-io/jest-listener?style=flat-square"
      alt="License" />
  </a>
</p>

<div align="center">
  <h4>
    <a href="https://orangebeard.io">Orangebeard</a> |
    <a href="#installation">Installation</a> |
    <a href="#configuration">Configuration</a>
  </h4>
</div>

## Installation

### Install the npm package

```shell
npm install --save-dev @orangebeard-io/jest-listener
```

## Configuration

In your jest config section of `package.json`, add the following entry:

```JSON
{
    "jest": {
        ...
        "reporters": ["default","@orangebeard-io/jest-listener"],
        ...
    }
}
```

For projects with Create-React-App the above Jest config doesn't work. You should edit the test command in the `package.json` like this:

```json
...
  "scripts": {
    ...
    "test": "react-scripts test --reporters=default --reporters=@orangebeard-io/jest-listener",
    ...
  },
...
```

Create a new file named `orangebeard.json` in the project root folder, next to `package.json`. Add the following entry:

```JSON
{
  "endpoint": "https://company.orangebeard.app",
  "accessToken": "00000000-0000-0000-0000-000000000000",
  "project": "project_name",
  "testset": "testset_NAME_EXAMPLE",
  "description": "Your description",
  "attributes": [
    {
      "key": "YourKey",
      "value": "YourValue"
    },
    {
      "value": "YourValue"
    }
  ],
  "listenerMode": "DEFAULT",
  "restClientConfig": {
    "timeout": 0
  }
}
```

### Environment properties

Properties can also be set in the build, by passing them as environment variables. It's important to mention that environment variables have precedence over the `orangebeard.json` definition.

```shell
$ export ORANGEBEARD_ENDPOINT=https://company.orangebeard.app
$ export ORANGEBEARD_ACCESSTOKEN=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
$ export ORANGEBEARD_PROJECT=piet_personal
$ export ORANGEBEARD_TESTSET=piet_TEST_EXAMPLE
$ export ORANGEBEARD_DESCRIPTION=My awesome testrun
$ export ORANGEBEARD_ATTRIBUTES=key:value; value;
```

### Tips & tricks

We would advise you to always use the Jest `describe` method around a set of tests, even if it's just one test. In that way the listener creates a suite. If you still don't want to use the `describe` method then the default suite name is `Suite` plus your test name.
