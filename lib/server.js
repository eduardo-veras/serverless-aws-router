'use strict';

const Core = require('./core');
const Package = require('../package.json');

const fs = require('fs');
const path = require('path');

//Search for 
const _loadRoutes = (dir, recursive, filelist) => {
	let files = fs.readdirSync(dir);
	filelist = filelist || [];
	for(const file of files)
		if(recursive && fs.statSync(path.join(dir, file)).isDirectory()){ filelist = _loadRoutes(path.join(dir, file), true, filelist); }
		else if( (/\.js$/i).test(file) ){ filelist.push(require(path.join(dir, file))); }
	return filelist;
};

const Server = class {
	constructor(core, parent) {

		this._core = core;

		this.app = core.app;
		this.auth = { method : 'jwt', function : null, ...core.auth };
		this.parent = parent;
		this.routes = core.routes;
		this.version = Package.version;

		core.registerServer(this);

	}

	_clone() { return new Server(this._core, this); }

	_register(route){
		if(typeof route.register == 'function') route.register(this);
	}

	on (event, callback) { this._core.eventBus.on(event, callback); }
	once (event, callback) { this._core.eventBus.once(event, callback); }

	route(config){
		this._core.router.add(config);
	}

	register(routes) {
		if(Array.isArray(routes)) for(const route of routes) this._register(route);
		else this._register(routes);
	}

	loadRoutes(path, options){

		options = {
			recursive : false,
			...options
		};

		for(const route of _loadRoutes(path, options.recursive)) this._register(route);

	}

	handler(event, context, callback){
		return this._core._handler(event, context, callback);
	}

	authorization(params){
		this.auth = { method : 'jwt', function : null, ...params };
	}

}

exports = module.exports = function (options) {
    const core = new Core(options);
    return new Server(core);
};