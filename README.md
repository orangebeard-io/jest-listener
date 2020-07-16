<h1 align="center">
  <a href="https://github.com/orangebeard-io/jest-listener">
    <img src="./.github/logo.svg" alt="Orangebeard.io Jest Listener" height="200">
  </a>
  <br>Orangebeard.io Jest Listener<br>
</h1>

<h4 align="center">Orangebeard listener for the Javascript <a href="https://jestjs.io/" target="_blank" rel="noopener">Jest</a> unit test framework.</h4>

<p align="center">
  <a href="https://npmjs.org/package/@oranegbeard-io/jest-listener">
    <img src="https://img.shields.io/npm/v/@oranegbeard-io/jest-listener.svg?style=flat-square"
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
npm install --save-dev @oranegbeard-io/jest-listener
```

## Configuration

In your jest config section of `package.json`, add the following entry:

```JSON
{
    "jest": {
        ...
        "reporters": [
            "default",
            ["@oranegbeard-io/jest-listener",
            {
                "token": "00000000-0000-0000-0000-000000000000",
                "endpoint": "https://your_endpoint",
                "project": "YourProjectName",
                "launch": "YourLauncherName",
                "description": "YourDescription",
                "attributes": [
                    {
                        "key": "YourKey",
                        "value": "YourValue"
                    },
                    {
                        "value": "YourValue"
                    },
                ]
            }]
        ],
        ...
    }
}
```

### Environment properties

Properties can also be set in the build, by passing them as environment variables. It's important to mention that environment variables hashave precedence over the `package.json` definition.

```shell
$ export ORANGEBEARD_UUID=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
$ export ORANGEBEARD_ENDPOINT=https://my_endpoint
$ export ORANGEBEARD_PROJECT_NAME=MY_AWESOME_PROJECT
$ export ORANGEBEARD_LAUNCH=MY_COOL_LAUNCHER
$ export ORANGEBEARD_DESCRIPTION=THIS_IS_MY_COOL_TEST_PROJECT
$ export ORANGEBEARD_ATTRIBUTES=key:value,key:value,value
```
