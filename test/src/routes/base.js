"use strict";


module.exports.register = (server) => {

	server.route({
		method: 'GET',
		path: '/',
		handler: async (request, reply) => {
			return reply.response({ Hello : "World!" });
		}
		/* handler: (request, reply) => {
			return "Hello world";
		} */
	});

};