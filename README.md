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
    <img src="https://img.shields.io/github/actions/workflow/status/orangebeard-io/jest-listener/release.yml?branch=main&style=flat-square"
      alt="Build Status" />
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
  "endpoint": "https://app.orangebeard.io/[ORGANIZATION]",
  "token": "[LISTENER TOKEN]",
  "project": "example-project",
  "testset": "Jest Test set",
  "description": "Jest run",
  "attributes": [
    {
      "key": "Tool",
      "value": "Jest"
    }
  ],
  "referenceUrl": "https://docs.orangebeard.io/"
}

```

__It's good practice__ to omit the token from the json file and get it from your env:

Windows cmd:
```
set orangebeard_token=[LISTENER TOKEN]
```
Linux/Mac:
```
export orangebeard_token=[LISTENER TOKEN]
```

### Environment properties

Properties can also be set in the build, by passing them as environment variables.  
It's important to mention that environment variables have precedence over the `orangebeard.json` definition.

```shell
$ export ORANGEBEARD_ENDPOINT=https://app.orangebeard.io/[ORGANIZATION]
$ export ORANGEBEARD_TOKEN=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
$ export ORANGEBEARD_PROJECT=example_project
$ export ORANGEBEARD_TESTSET=Jest testset
$ export ORANGEBEARD_DESCRIPTION=My awesome testrun
$ export ORANGEBEARD_ATTRIBUTES=key:value; value;
```
