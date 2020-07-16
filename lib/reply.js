'use strict';

exports = module.exports = class {
	constructor(){
		this.isReply = true;
		this.headers = {};
		this.statusCode = 200;
		this.contentType = 'application/json';
		this.payload = null;
		this.error = null;
	}
	response(payload){ this.payload = payload; return this; }
	code(statusCode){ this.statusCode = statusCode; return this; }
	header(key, value){ this.headers[key] = value; return this; }
	type(type){ this.contentType = type; return this; }
}