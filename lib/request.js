'use strict';

const Qs = require('qs');

exports = module.exports = class {
	constructor(route, event) {
		let payload = {};
		if(event.body){
			try { payload = JSON.parse(event.body); }
			catch(err){ payload = Qs.parse(event.body); }
		}
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
			payload : payload
		};
	}
}