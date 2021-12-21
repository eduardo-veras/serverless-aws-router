'use strict';

const Auth = require('./auth');
const Reply = require('./reply');
const Request = require('./request');
const Response = require('./response');
const Router = require('./router');
const EventBus = require('./eventBus');

const log = {
	start : name => { if(process.env.NODE_ENV=='dev') console.time(name); },
	end : name => { if(process.env.NODE_ENV=='dev') console.timeEnd(name); }
};

exports = module.exports = class {


	constructor(options) {
		if(!options.Joi) throw new Error('Please provide a "Joi" component.');
		if(typeof validationAllowUnknown == 'boolean') {
			console.info('DEPRECATED: validationAllowUnknown was deprecated on v1.0.12, and will removed in the furutre. Please use "joiOptions.allowUnknown" instead.');
		}
		if(options.joiOptions && typeof options.joiOptions !== 'object'){
			throw new Error('joiOptions must be an object');
		}
		this.Joi = options.Joi;
		this.joiOptions = options.joiOptions || null;
		this.parseQueryString = options.parseQueryString === true;
		this.auth = options.auth || {};
		this.validationAllowUnknown = (options.validationAllowUnknown === true);
		this.instances = [];
		this.router = new Router();
		this.routes = this.router.routes;
		this.wrapResponse = (typeof options.wrapResponse=='boolean')?options.wrapResponse:true;
		this.eventBus = new EventBus();
	}

	_handler(event, context, callback) {

		(async ()=>{

			await this.eventBus.emit('onEvent', event);

			log.start(event.path+' [route]');
			const route = this.router.get(event.path, event.httpMethod);
			context.callbackWaitsForEmptyEventLoop = false;
			context.invokedFunctionArn = (route?route.path:event.path).substr(1).replace(/\//g,'_');
			log.end(event.path+' [route]');

			const reply = new Reply();
			if(!route) return reply.response("Route not found").code(404);
		
			const request = new Request(route, event, this);
			const server = this.instances.length?this.instances[0]:{ auth : {} };

			for(let k in request.payload){
				if(request.payload[k] && ['[','{'].indexOf(request.payload[k].toString().substr(0,1))==0)
					try { request.payload[k] = JSON.parse(request.payload[k]); } catch(err) {}
			}

			await this.eventBus.emit('onRequest', request);

			if(route.config){
				if(
					typeof route.config.auth=='function'
					|| typeof server.auth.function=='function'
				){
					log.start(event.path+' [auth]');
					let credentials = null;
					if (typeof route.config.auth=='function'){
						switch(server.auth.method){
							case 'jwt':
								credentials = await (new Auth(event, route, request)).get();
								break;
							case 'custom':
								credentials = await route.config.auth(event, route, request);
								break;
						}
					} else if(
						server.auth.method=='custom'
						&& typeof server.auth.function=='function'
					){
						credentials = await server.auth.function(event, route, request);
					}
					if(credentials){
						request.auth.isAuthenticated = true;
						request.auth.credentials = credentials;
					}

					log.end(event.path+' [auth]');
					await this.eventBus.emit('onPostAuth', request);

					if(!credentials)
						return reply.response(
							server.auth.method == 'jwt'
							?"Invalid Token"
							:"Invalid Credentials"
						).code(401);
				}
	
				if(route.config.validate){
					log.start(event.path+' [validate]');
					for(let method in route.config.validate){

						let schema = route.config.validate[method];
						if(
							typeof this.Joi.isSchema != 'function'
							|| !this.Joi.isSchema(schema)
						){
							schema = this.Joi.object(schema);
						}

						const joiOptions = Object.assign(
							{ allowUnknown: this.validationAllowUnknown },
							this.joiOptions || {}
						);

						const validated = schema.validate(request[method], joiOptions);
						if(validated.error) throw validated.error;
						request[method] = validated.value;
					}
					log.end(event.path+' [validate]');
				}
			}
	
			log.start(event.path+' [handler]');
			await this.eventBus.emit('onPreHandler', request);

			try {
				const payload = await route.handler(request, reply);
				await this.eventBus.emit('onPostHandler', payload);
				return payload;
			}
			catch(err){ throw err; }
			finally { log.end(event.path+' [handler]'); }
	
		})()
			.then(res=>{ this._response({ event, context, callback, payload:res }); })
			.catch(err=>{ this._response({ event, context, callback, payload:err, error:true }); })
	}

	async _response(params) {
		const response = new Response(params.payload, this);
		await this.eventBus.emit('onPreResponse', response, params.event);
		params.callback(null, {
			statusCode: response.statusCode || 200,
			headers: response.headers || {},
			body: response.body || ''
		});
		if(params.error) params.context.fail(params.payload);
	}

	registerServer(server) {
		this.instances.push(server);
	}

}