# serverless-aws-router

[![Build Status: Linux](https://travis-ci.org/eduardo-veras/serverless-aws-router.svg?branch=master)](https://travis-ci.com/github/eduardo-veras/serverless-aws-router) ![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/serverless-aws-router) ![npm](https://img.shields.io/npm/dm/serverless-aws-router) ![node-current](https://img.shields.io/node/v/serverless-aws-router) ![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/eduardo-veras/serverless-aws-router)

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

### Server({ options })
```javascript
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

#### Server Options
The server options control the behavior of the server object.

##### server.options.Joi `object | mandatory`
To avoid versioning problems between the Joi library, add the [Joi](https://www.npmjs.com/package/joi) package globally in you project, and pass it when you are creating a new server.

##### server.options.validationAllowUnknown `boolean | optional` (v1.0.10+)
Default value: `false`

When `true`, allows `Joi` validation object to contain unknown keys which are ignored.

##### server.options.wrapResponse `boolean | optional` (v1.0.7+)
Default value: `true`

Used to indicate if all responses data should be wraped before the final response.

If set to `false` the `reply` will always act as `reply.raw().response(content)`.

##### server.options.auth `object | optional`
Default value: `{ method : 'jwt', function : null }`

Sets the default method to be used to authenticated requests.

###### server.options.auth.method `string | mandatory`
Default value: `jwt`

Define the authorization method, which can be:

 - `jwt` - by default the server will use JWT to authenticate and validate requests.
 - `custom` - sets authorization to use a custom function to authenticate requests. This method will only work togheter with the `function` option.

###### server.options.auth.function `async function(event, route, request) | optional`
Default value: `null`

This option will only work when the `method` is set to `custom`, and the function must return:
 - `null` - if the authorization fails.
 - `object` - an object with the will be saved (shallowly copied) into `request.auth.credentials` and will set `request.auth.isAuthenticated` to `true`. 

## Adding Routes
There are three ways to add routes to your system.

### Single route
The most basic way to create a route. Simple call the `server.route` with your route configuration inside the `server.js` file.
```javascript
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
```javascript
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
```javascript
"use strict";

const slsRouter = require('serverless-aws-router');

const server = new slsRouter.Server({});

server.register(require('route.js'));

module.exports.handler = (event, context, callback) => server.handler(event, context, callback);
```
If you have more than one route file, you can register using an array:
#### server.js - multiple routes
```javascript
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

### route({ options })
When you add a new route, you need three basic elements: the `method`, the `path`, and a `handler`. These are passed to your server as an object, and ca be as simple as the follwing:
```javascript
server.route({
	method: 'GET',
	path: '/',
	handler: (request, reply) => {
		return 'Hello world';
	}
});
```
#### route.options.method `string | array<strings>`
The method opetion can be any valid HTTP method. The route above responds to a single method `GET`, but you can also define multiple by passing an array of strings.
```javascript
server.route({
	method: ['PUT','POST'],
	path: '/customer',
	handler: (request, reply) => {
		return 'Good job!';
	}
});
```
#### route.options.path `string`
The path option must be a string, though it can contain named parameters. To name a parameter in a path, simply put `:` at the begin. For example:
```javascript
server.route({
	method: 'GET',
	path: '/hello/:user',
	handler: function (request, reply) {
		return `Hello ${request.params.user}!`;
	}
});
```
In this example you have the `:user` in you path, which will make the value provided on the path during the request to be stored in the object `request.params` with the handler. So, if you request the `/hello/ferris`, you will get `Hello ferris!` as response.

##### Optional parameters on path
In the previous example, the `user` parameter is required, if you request `/hello/bob` or `/hello/susan` will work, but a request to `/hello` will not. To make the parameter optional, simple put a `?` (question mark) at the end of the paramenter's name. Let's check the same route as above, but with an optional parameter:
```javascript
server.route({
	method: 'GET',
	path: '/hello/:user?',
	handler: function (request, reply) {
		const user = request.params.user ? request.params.user : 'stranger';
		return `Hello ${user}!`;
	}
});
```
Now if you request `/hello/sloan` will reply with `Hello sloan!` and a request to `/hello` will reply with `Hello stranger!`.

#### route.options.config `object (optional)`
Each route can be configured to define authentication and validation rules for requests.

##### route.options.config.auth `async function (optional)`
Build-in 
 - `false` to disable authentication (*default*);
 - `function`

##### route.options.config.validate

#### route.options.handler `(async) function`
The route handler function performs the main business logic of the route and sets the response.

It can be a normal function:
```javascript
server.route({
	method: 'GET',
	path: '/hello',
	handler: function (request, reply) {
		return 'Hello world';
	}
});
```

Or an arrow function:
```javascript
server.route({
	method: 'GET',
	path: '/hello',
	handler: (request, reply) => {
		return 'Hello world';
	}
});
```

Or an asyncronous function:
```javascript
server.route({
	method: 'GET',
	path: '/hello',
	handler: async (request, reply) => {
		return 'Hello world';
	}
});
```

Then handler function has 2 input parameters:

##### request
Request object model:
```javascript
{
	info : {
		id : 'string', //Unique RequestID
		stage : 'string', //Context stage from Lambda (defined on serverless.yml)
		host : 'string', //Host address and port
		remoteAddress : 'string', //Remote source IP address
		isOffline : false //Indicate if the server is running using serverless-offline lib
	},
	auth : {
		isAuthenticated : false, //Return true if the route was sucessfully authenticated
		credentials : null //Return an object with the auth result
	},
	headers : { /* ... */ }, //Raw request headers
	method : 'string', //HTTP request method (like: GET, POST, PATCH)
	path : 'string', //Request path
	query : {}, //Parsed query string parameters as an object
	params : {}, //Parsed path parameters
	payload : {}, //Form content sent using POST, PUT or PATCH
	raw : null //Any raw form payload
}
```

##### reply

The reply parameter, is an option to parse and manipulate the handler's response.

```javascript
server.route({
	method: 'GET',
	path: '/hello',
	handler: async (request, reply) => {
		return reply.response('Hello world');
	}
});
/*
{
	"statusCode": 200,
	"response": "Hello world"
}
*/
```

###### Methods

All methods are chained, so it can be used in any order.

<br>

`response(body: any)` (mandatory)

Set the response content. It can be any type of data. By default the content will be encapsulated in a response interface and converted using `JSON.stringify()`, unless the `raw()` method is used.

Example:
```javascript
return reply.response('Hello world');
// { "statusCode": 200, "response": "Hello world" }

return reply.response(401);
// { "statusCode": 200, "response": 401 }

return reply.response(new Date());
// { "statusCode": 200, "response": "2020-01-01T00:00:00.000Z" }

return reply.response({ test : { a : true } });
// { "statusCode": 200, "response": { "test" : { "a" : true } } }

return reply.response([ 1, 2, 3 ]);
// { "statusCode": 200, "response": [ 1, 2, 3 ] }
```

<br>

`raw()` (optional) v1.0.5+

Prevent the content to be encapsulated in the response interface, the content will still be converted using `JSON.stringify()`. It can e used before or after the `response()`.

Example:
```javascript
return reply.raw().response({ test : true });
// { "test" : true }

return reply.response({ test : true }).raw();
// { "test" : true }
```

<br>
<br>

`code(codeValue: number)` (optional)

Set the status code for the **response header** and content. Useful to indicate errors and validations.

Default value: `200`

Behavior:

A `200` code will create a response:

```javascript
return reply.code(200).response('Hello world');
// { "statusCode": 200, "response": "Hello world" }
```

A code number greater or equal `400` will be be treated has an error, and will generate an HTTP error [code message](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) related to the code number:

```javascript
return reply.code(404).response('Hello world');
// { "statusCode": 200, "error": "Not Found", "message": "Hello world" }

return reply.code(412).response('Hello world');
// { "statusCode": 200, "error": "Precondition Failed", "message": "Hello world" }

return reply.code(416).response('Hello world');
// { "statusCode": 200, "error": "Range Not Satisfiable", "message": "Hello world" }

return reply.code(417).response('Hello world');
// { "statusCode": 200, "error": "Expectation Failed", "message": "Hello world" }
```

<br>
<br>

`type(contentType: string)` (optional)

Set a different content type for the response. Useful to render HTML, CSV, or plain text pages.

Default value: `application/json`

```javascript
return reply.type('text/html').raw().response('<html><h1>Hello world</h1></html>');
```

 <br>
 <br>

`header(key: string, value: string)` (optional)

Set custom **response headers**.

```javascript
return reply.type('x-key', 'abcdef').response('Hello world');
```
## Request Lifecycle

![image](https://user-images.githubusercontent.com/12535965/118333232-5b718000-b4d9-11eb-908e-ee1928e1bb87.png)

## Events (v1.0.7+)

The events listed on the request lifecycle can be binded on the `server` level, using the method `on(criteria, listener)` as:
```javascript
const server = new slsRouter.Server({ Joi : require('joi') });

server.on('onEvent', async event => {
  console.log('onEvent', event);
});

server.on('onRequest', async request => {
  console.log('onRequest', request);
});

server.on('onPostAuth', async request => {
  console.log('onPostAuth',request);
});

server.on('onPreHandler', async request => {
  console.log('onPreHandler', request);
});

server.on('onPostHandler', async payload => {
  console.log('onPostHandler', payload);
});

server.on('onPreResponse', async (response, event) => {
  console.log('onPreResponse', event);
  console.log('onPreResponse', response);
});
```


## Examples
You can find some usage examples on the [test](/test) folder on this repo.
