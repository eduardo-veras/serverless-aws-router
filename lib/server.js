'use strict';

const Core = require('./core');
const Package = require('../package.json');

exports = module.exports = function (options) {

    const core = new Core(options);
    return new Server(core);
};

const Server = class {
	constructor(core, parent) {

		this._core = core;

		this.app = core.app;
		this.auth = core.auth;
		this.parent = parent;
		this.routes = core.routes;
		this.version = Package.version;

		core.registerServer(this);

	}

	_clone() { return new Server(this._core, this); }

	route(config){
		this._core.router.add(config);
	}

	register(routes) {
		if(Array.isArray(routes)){

		} else {

		}
	}

	handler(event, context, callback){
		return this._core._handler(event, context, callback);
	}

}