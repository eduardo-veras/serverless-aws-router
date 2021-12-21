'use strict';

const Qs = require('qs');

const QueryStringParser = (event, core) => {

	if((core||{}).parseQueryString !== true){
		return event.queryStringParameters || {};
	}

	const query = { ...event.queryStringParameters };

	for(const key in query){
		try { query[key] = JSON.parse(query[key]); }
		catch(e){  }
	}

	return Qs.parse(query);

}

exports = module.exports = class {
	constructor(route, event, core) {
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
			query : QueryStringParser(event, core),
			params : route.params,
			payload : payload,
			raw : event.body
		};
	}
}