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

const getValueIgnoringKeyCase = (object, key) => {
    const foundKey = Object
        .keys(object)
        .find(currentKey => currentKey.toLocaleLowerCase() === key.toLowerCase());
    return object[foundKey];
}

const formDataParse = (event) => {
    const boundary = getValueIgnoringKeyCase(event.headers, 'Content-Type').split('=')[1];
    const result = {};
    event.body
        .split(boundary)
        .forEach(item => {
            if (/filename=".+"/g.test(item)) {
                result[item.match(/name=".+";/g)[0].slice(6, -2)] = {
                    type: 'file',
                    filename: item.match(/filename=".+"/g)[0].slice(10, -1),
                    contentType: item.match(/Content-Type:\s.+/g)[0].slice(14),
                    content: Buffer.from(item.slice(item.search(/Content-Type:\s.+/g) + item.match(/Content-Type:\s.+/g)[0].length + 4, -4), 'binary'),
                };
            } else if (/name=".+"/g.test(item)){
                result[item.match(/name=".+"/g)[0].slice(6, -1)] = item.slice(item.search(/name=".+"/g) + item.match(/name=".+"/g)[0].length + 4, -4);
            }
        });
    return result;
};

exports = module.exports = class {
	constructor(route, event, core) {
		let payload = {};
		if(event.body){
			if((event.headers['Content-Type']||'').indexOf('multipart/form-data')>=0){
				payload = Qs.parse(formDataParse(event));
			} else {
				try { payload = JSON.parse(event.body); }
				catch(err){ payload = Qs.parse(event.body); }
			}
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