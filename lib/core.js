'use strict';

const Joi = require('@hapi/joi');

const Auth = require('./auth');
const Reply = require('./reply');
const Request = require('./request');
const Response = require('./response');
const Router = require('./router');

exports = module.exports = class {


	constructor(options) {
		this.instances = [];
		this.router = new Router();
		this.routes = this.router.routes;
	}

	_handler(event, context, callback) {

		const route = this.router.get(event.path, event.httpMethod);
		context.callbackWaitsForEmptyEventLoop = false;
		context.invokedFunctionArn = (route?route.path:event.path).substr(1).replace(/\//g,'_');
	
		const reply = new Reply();
		if(!route) return callback(null, new Response(reply.response("Route not found").code(404)));
	
		const request = new Request(route, event);
		

		for(let k in request.payload){
			if(request.payload[k] && ['[','{'].indexOf(request.payload[k].toString().substr(0,1))==0)
				try { request.payload[k] = JSON.parse(request.payload[k]); } catch(err) {}
		}
	
		(async ()=>{
	
			if(route.config){
				if(route.config.auth){
					const credentials = await (new Auth(event, route, request)).get();
					if(!credentials) return reply.response("Invalid token").code(401);
					request.auth.isAuthenticated = true;
					request.auth.credentials = credentials;
				}
	
				if(route.config.validate){
					for(let method in route.config.validate){
						const validated = Joi.object(route.config.validate[method]).validate(request[method]);
						if(validated.error) throw validated.error;
						request[method] = validated.value;
					}
				}
			}
	
			try { return await route.handler(request, reply); }
			catch(err){ throw err; }
	
		})()
			.then(res=>{ callback(null, new Response(res)); })
			.catch(err=>{ callback(null, new Response(err)); context.fail(err); });
	


	}

	registerServer(server) {
		this.instances.push(server);
	}

}