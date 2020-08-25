# serverless-aws-router

[![Build Status: Linux](https://travis-ci.org/eduardo-veras/serverless-aws-router.svg?branch=master)](https://travis-ci.com/github/eduardo-veras/serverless-aws-router)

This project aim to be a lightweight router system for [Serverless framework](https://serverless.com) for AWS Lambda. The code design was inspirated on [Hapi](https://hapi.dev) framework, and try to mimic the routes, validations, requests and response models of traditional NodeJS router frameworks.


## Serverless code pattern
The Serverless Architecture choosed for this router, is the [Monolithic Pattern](https://www.serverless.com/blog/serverless-architecture-code-patterns).
In the Monolithic Pattern your entire application is crammed into a single Lambda function. In this case, the entire app is in a single Lambda function, and all HTTP endpoints point to that Lambda function.

**Benefits of the Monolithic Pattern:**

-   A single Lambda function is much easier to comprehend and manage. It’s more of a traditional set-up.
-   Fast deployments, depending on the total code size.
-   Theoretically faster performance. Your single Lambda function will be called frequently and it is less likely that your users will run into cold-starts.

**Drawbacks of the Monolithic Pattern:**

-   Requires building a more complex router within your Lambda function and ensuring it always directs calls the appropriate logic.
-   It’s harder to understand performance. The Lambda function will run for a variety of durations.
-   You can easily hit the Lambda size limit in real world practical applications due to the larger function size. But this can be avoided spliting your application on micro-services, keeping the total function size small per micro-service.

## Install
```bash
$ npm install serverless-aws-router
```

## Creating a Router Handler

The router handler need two parts: a `serverless.yml` that will have the main route configuration, and a `server.js` that will have the inner endpoints. A very basic example will look like the following:

### serverless.yml
```yaml
service: serverless-social-network

provider:
  name: aws
  runtime: nodejs12.x

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

### server.js
```node
'use strict';

const slsRouter = require('serverless-aws-router');
const Joi = require('joi');

const server = new slsRouter.Server({ Joi });

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

To avoid versioning problems between the Joi library, add the [Joi](https://www.npmjs.com/package/joi) package globally in you project, and pass it when you are creating a new server.

## Adding Routes
There are three ways to add routes to your system.

### Single route
The most basic way to create a route. Simple call the `server.route` with your route configuration inside the `server.js` file.
```node
server.route({
	method: 'GET',
	path: '/',
	handler: async (request, reply) => {
		return reply.response({ Hello : "World!" });
	}
});
```

### Register routes
Registering routes, allow you to separate the routes files from the `server.js` file. To do this, first create your route file:

#### route.js
```node
"use strict";

module.exports.register = (server) => {

	server.route({
		method: 'GET',
		path: '/',
		handler: async (request, reply) => {
			return reply.response({ Hello : "World!" });
		}
	});

};
```

And then register the route by requiring this `route.js` file at the `server.js` file:
#### server.js - single route
```node
"use strict";

const slsRouter = require('serverless-aws-router');

const server = new slsRouter.Server({});

server.register(require('route.js'));

module.exports.handler = (event, context, callback) => server.handler(event, context, callback);
```
If you have more than one route file, you can register using an array:
#### server.js - multiple routes
```node
"use strict";

const slsRouter = require('serverless-aws-router');

const server = new slsRouter.Server({});

server.register([
	require('route1.js'),
	require('route2.js')
]);

module.exports.handler = (event, context, callback) => server.handler(event, context, callback);
```

### Loading directory of routes
If you have several routes files, under several folders and subfolders, you will find the `server.loadRoutes()` method very usefull. Imagine that you have the following folders and files structure:
```bash
├── routes
│   ├── customers
│   │   ├── profile.js
│   │   └── salesOrders.js
│   └── invoices
│       ├── generate.js
│       └── history.js
├── server.js
└── serverless.yml
```
Instead add manually every file you can do this in one line by:
```node
"use strict";

const path = require('path');
const slsRouter = require('serverless-aws-router');

const server = new slsRouter.Server({});

server.loadRoutes(path.join(__dirname, 'routes'), { recursive : true });

module.exports.handler = (event, context, callback) => server.handler(event, context, callback);
```
The `server.loadRoutes()` will search on the `routes` directory for `*.js` files that have the `register` function on it (as presented at the `route.js` example). By default, this method will search only for routes on the same folder, but you can set the `recursive : true` flag to inform the loader, to search for `.js` route files in all sub-directories.

### Routes
When you add a new route, you need three basic elements: the `method`, the `path`, and a `handler`. These are passed to your server as an object, and ca be as simple as the follwing:
```node
server.route({
	method: 'GET',
	path: '/',
	handler: (request, reply) => {
		return 'Hello world';
	}
});
```
#### method `string | array<strings>`
The method opetion can be any valid HTTP method. The route above responds to a single method `GET`, but you can also define multiple by passing an array of strings.
```node
server.route({
	method: ['PUT','POST'],
	path: '/customer',
	handler: (request, reply) => {
		return 'Good job!';
	}
});
```
#### path `string`
The path option must be a string, though it can contain named parameters. To name a parameter in a path, simply put `:` at the begin. For example:
```node
server.route({
	method: 'GET',
	path: '/hello/:user',
	handler: function (request, h) {
		return `Hello ${request.params.user}!`;
	}
});
```
In this example you have the `:user` in you path, which will make the value provided on the path during the request to be stored in the object `request.params` with the handler. So, if you request the `/hello/ferris`, you will get `Hello ferris!` as response.

##### Optional parameters on path
In the previous example, the `user` parameter is required, if you request `/hello/bob` or `/hello/susan` will work, but a request to `/hello` will not. To make the parameter optional, simple put a `?` (question mark) at the end of the paramenter's name. Let's check the same route as above, but with an optional parameter:
```node
server.route({
	method: 'GET',
	path: '/hello/:user?',
	handler: function (request, h) {
		const user = request.params.user ? request.params.user : 'stranger';
		return `Hello ${user}!`;
	}
});
```
Now if you request `/hello/sloan` will reply with `Hello sloan!` and a request to `/hello` will reply with `Hello stranger!`.

#### config `object (optional)`
Each route can be configured to define authentication and validation rules for requests.

##### config.auth `async function (optional)`
Build-in 
 - `false` to disable authentication (*default*);
 - `function`

##### config.validate

#### handler `(async) function`
##### request
##### reply

## Examples
You can find some usage examples on the [test](/test) folder on this repo.

## To do
Next steps on this project:
- [ ] Documentation for the `config` object;
- [ ] Documentation for the `handler` function;
- [ ] Add global Auth registrations
- [ ] Validate if a route is already registered before add