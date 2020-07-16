'use strict';

const Qs = require('qs');

exports = module.exports = class {
	constructor(route, event) {
		return {
			info : {
				id : event.requestContext.requestId,
				stage : event.requestContext.stage,
				host : event.headers.Host,
				remoteAddress : event.requestContext.identity.sourceIp,
				isOffline : !!event.isOffline
			},
			auth : {
				isAuthenticated : false,
				credentials : null
			},
			headers : event.headers,
			method : event.httpMethod,
			path : event.path,
			query : event.queryStringParameters || {},
			params : route.params,
			payload : event.body?Qs.parse(event.body):{}
		};
	}
}