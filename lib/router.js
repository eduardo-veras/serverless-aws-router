'use strict';

const RouteMatch = require('path-match')({ sensitive: false, strict: false, end: true });

exports = module.exports = class {
	routes = [];

	constructor(options){ }

	add(route) {
		//TODO: Verify if the route exists before add
		this.routes.push(route);
	}

	get(path, method){
		for(let r=0;r<this.routes.length;r++){
			if(this.routes[r].method!==method) continue;
			const params = RouteMatch(this.routes[r].path)(path);
			if(params)
				return {
					"path" : this.routes[r].path,
					"handler" : this.routes[r].handler,
					"config" : this.routes[r].config || null,
					"params" : params
				};
		}
		return null;
	};

}