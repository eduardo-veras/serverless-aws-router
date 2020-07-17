"use strict";

const slsRouter = require('../../lib');


const server = new slsRouter.Server({});


server.route({
	method: 'GET',
	path: '/',
	handler: async (request, reply) => {
		return reply.response({ ok : true });
	}
});


module.exports.handler = (event, context, callback) => { return server.handler(event, context, callback) };