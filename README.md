# serverless-aws-router

[![Build Status: Linux](https://travis-ci.org/eduardo-veras/serverless-aws-router.svg?branch=master)](https://travis-ci.com/github/eduardo-veras/serverless-aws-router) ![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/serverless-aws-router) ![npm](https://img.shields.io/npm/dm/serverless-aws-router) ![node-current](https://img.shields.io/node/v/serverless-aws-router) ![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/eduardo-veras/serverless-aws-router)

This project aims to be a lightweight router system for [Serverless framework](https://serverless.com) for AWS Lambda. The code design was inspired on [Hapi](https://hapi.dev) framework, and try to mimic the routes, validations, requests and response models of traditional NodeJS router frameworks.


## Install
```bash
$ npm install serverless-aws-router
```

## Creating a Router Handler

The router handler needs two parts: a `serverless.yml` that will have the main route configuration, and a `server.js` that will have the inner endpoints. A very basic example will look like the following:

### serverless.yml
```yaml
service: serverless-social-network

provider:
  name: aws
  runtime: nodejs16.x

functions:
  app:
    handler: server.handler
    events:
      - http:
          path: /
          method: ANY
          cors: true
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
```
All HTTP endpoints paths and methods, are pointed to the `server.handler`, which will call the exported method `handler` at the `server.js` file. 

### Server({ options })
```javascript
'use strict';

const slsRouter = require('serverless-aws-router');
const Joi = require('joi');

const server = new slsRouter.Server({
	Joi, //Required
	joiOptions : { //Optional
		abortEarly: true, //Optional
		allowUnknown: false, //Optional
		cache: true //Optional
	},
	wrapResponse: true, //Optional, default true
	auth : { //Optional
		method: 'jwt', //Default 'jwt'
		function: null //Default null
	},
	parseQueryString: false //Optional, default false (v1.1.0+)
});

server.route({
	method: 'GET',
	path: '/',
	handler: async (request, reply) => {
		return reply.response({ Hello : "World!" });
	}
});

module.exports.handler = (event, context, callback) => server.handler(event, context, callback);
```
First create a new `slsRouter.Server()`, then add your routes to the server, and finally export the `server.handler()` that will receive the serverless requests.

## Documentation and options
All configuration options, methods, and events can be found on the [Wiki](../../wiki) section on this repo.

## Examples
You can find some usage examples on the [test](/test) folder on this repo.
