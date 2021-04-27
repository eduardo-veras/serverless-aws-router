'use strict';

const HttpCodes = require('./httpCodes');

exports = module.exports = class {

	constructor(payload) {

		this.statusCode = 200;
		this.headers = {
			"Access-Control-Allow-Origin" : '*',
			"Access-Control-Allow-Credentials" : true
		};
		this.body = { "statusCode": this.statusCode };

		const httpStatus = new HttpCodes();

		if(typeof payload=='object'&&payload.isReply){
			this.body.statusCode = this.statusCode = payload.statusCode;
			if(this.statusCode>=400) this.body.error = httpStatus[this.statusCode.toString()];
			this.body[this.statusCode==200?'response':'message'] = payload.payload;
			if(typeof payload.headers=='object') for(const key in payload.headers) this.headers[key] = payload.headers[key];
			if(payload.contentType) this.headers['content-type'] = payload.contentType;
		}

		if(typeof payload=='object'&&payload.isJoi){
			this.body.statusCode = this.statusCode = 412;
			this.body.error = httpStatus[this.statusCode.toString()];
			this.body.message = payload.message;
			this.body.details = payload.details;
		}

		if(payload instanceof Error && !payload.isJoi){
			this.body.statusCode = this.statusCode = 500;
			this.body.error = httpStatus[this.statusCode.toString()];
			this.body.message = payload.message;
			this.body.stack = payload.stack.toString().split('\n');
		}

		if(typeof payload=='string'){
			return {
				"statusCode": this.statusCode,
				"headers": this.headers,
				"body": payload
			};
		}
		if(typeof payload=='object' && payload.html && !payload.isReply){
			this.headers['content-type'] = 'text/html';
			return {
				"statusCode": this.statusCode,
				"headers": this.headers,
				"body": payload.html
			};
		}
		if(typeof payload=='object' && payload.raw && !payload.isReply){
			this.headers['content-type'] = 'application/json';
			return {
				"statusCode": this.statusCode,
				"headers": this.headers,
				"body": JSON.stringify(payload.raw)
			};
		}

		if(typeof payload=='object' && payload.isRaw && payload.isReply){
			this.headers['content-type'] = 'application/json';
			
			return {
				"statusCode": this.statusCode,
				"headers": this.headers,
				"body": JSON.stringify(payload.payload)
			};
		}

		return {
			"statusCode": this.statusCode,
			"headers": this.headers,
			"body": JSON.stringify(this.body)
		};


	}

}
