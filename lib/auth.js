'use strict';

const JWT = require('jsonwebtoken');

module.exports.verify = event => {
	if (!event || !event.headers || !event.headers.Authorization) return null;
	const tokenParts = event.headers.Authorization.split(' ');
	const tokenValue = tokenParts[1];
	if (!(tokenParts[0].toLowerCase() === 'bearer' && tokenValue)) return null;
	try { return JWT.verify(tokenValue, process.env.JWT_SECRET, { issuer : process.env.JWT_ISSUER }); }
	catch (err){ return null; }
};


exports = module.exports = class {
	constructor(event, route, request){
		this.event = event;
		this.route = route;
		this.request = request;
	}

	_verify() {
		if (!this.event || !this.event.headers || !this.event.headers.Authorization) return null;
		const tokenParts = this.event.headers.Authorization.split(' ');
		const tokenValue = tokenParts[1];
		if (!(tokenParts[0].toLowerCase() === 'bearer' && tokenValue)) return null;
		try { return JWT.verify(tokenValue, process.env.JWT_SECRET, { issuer : process.env.JWT_ISSUER }); }
		catch (err){ return null; }
	}

	_check(fctName){
		let fct, fctok = false;
		fct = this.route.auth[fctName];
		if(typeof fct=="function") fctok = fct(credentials);
		return fctok;
	};

	async get(){
		const credentials = this._verify();
		if(!credentials) return null;
		let checked = true;
		switch(typeof this.route.config.auth){
			case 'string': checked = this._check(this.route.config.auth); break;
			case 'object':
				if(Array.isArray(this.route.config.auth)){
					checked = false;
					this.route.config.auth.forEach(a=>{ checked = this._check(a)?true:checked; });
				}
				break;
			case 'function':
				if(this.route.config.auth.constructor.name == 'AsyncFunction')
					checked = await this.route.config.auth(this.request, credentials);
				else
					checked = this.route.config.auth(this.request, credentials);
				break;
		}
		if(!checked) return null;
		return credentials;
	}

}